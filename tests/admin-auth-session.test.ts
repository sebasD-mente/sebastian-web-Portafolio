import fs from "node:fs";
import path from "node:path";
import React from "react";
import { renderToStaticMarkup } from "react-dom/server";
import { afterEach, describe, expect, it, vi } from "vitest";

const { mockedCookies } = vi.hoisted(() => ({
  mockedCookies: vi.fn()
}));

vi.mock("next/headers", () => ({
  cookies: mockedCookies
}));

import AdminLoginPage, {
  metadata as adminLoginMetadata
} from "@/app/admin/login/page";
import CatalogAdminPage from "@/app/admin/proyectos/page";
import { createPostgresCatalogRepository } from "@/repo/postgres-catalog.repo";
import { createProductionSystemsRepository } from "@/repo/systems.repo";
import {
  type AdminAuthErrorPayload,
  type AdminLoginSuccessPayload,
  type AdminLogoutSuccessPayload,
  handleAdminAuthLoginPost,
  handleAdminAuthLogoutPost
} from "@/runtime/admin-auth.handler";
import {
  type AdminSystemsListSuccessPayload,
  handleAdminSystemsGet
} from "@/runtime/admin-catalog.handler";
import {
  createAdminSessionToken,
  createLoginRateLimiter,
  getAdminSessionCookieName,
  parseCookieValueFromHeader,
  resolveAdminAuthConfiguration,
  serializeAdminSessionCookie,
  serializeExpiredAdminSessionCookie,
  verifyAdminCredentials,
  verifyAdminSessionToken
} from "@/service/admin-auth.service";
import { getSiteFoundationSnapshot } from "@/service/site.service";
import type { AdminAuthConfigOverrides } from "@/types/portfolio";
import { AdminLoginView } from "@/ui/components/AdminLoginView";

const REPO_ROOT = path.resolve(__dirname, "..");

function readRepoFile(relPath: string): string {
  return fs.readFileSync(path.join(REPO_ROOT, relPath), "utf8");
}

const TEST_AUTH_CONFIG: AdminAuthConfigOverrides = {
  username: "sebastian@dekolabs.org",
  password: "SuperSecurePassword!2026",
  sessionSecret: "dekolabs-hmac-sha256-session-secret-key-2026-verified",
  nodeEnv: "production",
  sessionTtlSeconds: 43200,
  maxLoginAttempts: 3,
  rateLimitWindowMs: 60_000,
  lockoutDurationMs: 120_000
};

describe("feat-012: Sistema Profesional de Login (/admin/login), Sesión Firmada HttpOnly y Anti-Fuerza Bruta", () => {
  afterEach(() => {
    vi.restoreAllMocks();
  });

  it("aplica política Fail-Closed en producción ante placeholders y verifica credenciales en tiempo constante con node:crypto", () => {
    const placeholderProd = resolveAdminAuthConfiguration({
      username: "admin@dekolabs.org",
      password: "change_this_admin_password_in_production",
      sessionSecret: "change_this_admin_session_secret_min_32_chars_in_production",
      nodeEnv: "production"
    });
    expect(placeholderProd.configured).toBe(false);
    expect(
      verifyAdminCredentials(
        {
          username: "admin@dekolabs.org",
          password: "change_this_admin_password_in_production"
        },
        {
          username: "admin@dekolabs.org",
          password: "change_this_admin_password_in_production",
          sessionSecret:
            "change_this_admin_session_secret_min_32_chars_in_production",
          nodeEnv: "production"
        }
      )
    ).toBe(false);

    // Credenciales válidas (case-insensitive en email, exacto en password)
    expect(
      verifyAdminCredentials(
        {
          username: "  SEBASTIAN@dekolabs.org ",
          password: "SuperSecurePassword!2026"
        },
        TEST_AUTH_CONFIG
      )
    ).toBe(true);

    // Contraseña o usuario incorrectos
    expect(
      verifyAdminCredentials(
        {
          username: "sebastian@dekolabs.org",
          password: "WrongPassword!2026"
        },
        TEST_AUTH_CONFIG
      )
    ).toBe(false);
    expect(
      verifyAdminCredentials(
        {
          username: "intruder@dekolabs.org",
          password: "SuperSecurePassword!2026"
        },
        TEST_AUTH_CONFIG
      )
    ).toBe(false);
  });

  it("firma y valida tokens de sesión HMAC-SHA256 rechazando adulteración, expiración y cambio de sujeto", () => {
    const baseNowMs = 1_760_000_000_000;
    const token = createAdminSessionToken(
      "sebastian@dekolabs.org",
      TEST_AUTH_CONFIG,
      baseNowMs
    );

    const validCheck = verifyAdminSessionToken(
      token,
      TEST_AUTH_CONFIG,
      baseNowMs + 60_000
    );
    expect(validCheck.valid).toBe(true);
    expect(validCheck.claims?.sub).toBe("sebastian@dekolabs.org");

    // Adulteración de firma o payload
    const tampered = `${token.slice(0, -4)}abcd`;
    const tamperedCheck = verifyAdminSessionToken(
      tampered,
      TEST_AUTH_CONFIG,
      baseNowMs + 1000
    );
    expect(tamperedCheck.valid).toBe(false);
    expect(tamperedCheck.reason).toBe("invalid-signature");

    // Expiración tras 12h (43200s)
    const expiredCheck = verifyAdminSessionToken(
      token,
      TEST_AUTH_CONFIG,
      baseNowMs + 43_201 * 1000
    );
    expect(expiredCheck.valid).toBe(false);
    expect(expiredCheck.reason).toBe("expired-token");

    // Serialización de cookie segura HttpOnly + SameSite=Strict + Secure
    const setCookie = serializeAdminSessionCookie(token, TEST_AUTH_CONFIG);
    expect(setCookie).toContain(`${getAdminSessionCookieName()}=`);
    expect(setCookie).toContain("HttpOnly");
    expect(setCookie).toContain("SameSite=Strict");
    expect(setCookie).toContain("Path=/");
    expect(setCookie).toContain("Max-Age=43200");
    expect(setCookie).toContain("Secure");

    const parsedFromCookieHeader = parseCookieValueFromHeader(
      `theme=light; ${setCookie.split(";")[0]}; other=1`
    );
    expect(parsedFromCookieHeader).toBe(token);

    const expiredCookie = serializeExpiredAdminSessionCookie(TEST_AUTH_CONFIG);
    expect(expiredCookie).toContain("Max-Age=0");
    expect(expiredCookie).toContain("HttpOnly");
  });

  it("gestiona login, cookie HttpOnly, autorización en /api/admin/systems, bloqueo 429 anti-fuerza bruta y logout", async () => {
    const rateLimiter = createLoginRateLimiter({
      maxAttempts: 3,
      windowMs: 60_000,
      lockoutMs: 120_000
    });
    const nowMs = 1_760_000_000_000;
    const clientIp = "203.0.113.42";

    // 3 intentos fallidos devuelven 401 y el 4to devuelve 429 Too Many Requests
    for (let attempt = 1; attempt <= 3; attempt += 1) {
      const badReq = new Request("https://dekolabs.org/api/admin/auth/login", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          "x-forwarded-for": clientIp
        },
        body: JSON.stringify({
          username: "sebastian@dekolabs.org",
          password: `wrong-pass-${attempt}`
        })
      });
      const badRes = await handleAdminAuthLoginPost(badReq, {
        authConfig: TEST_AUTH_CONFIG,
        rateLimiter,
        nowMs: nowMs + attempt * 1000
      });
      expect(badRes.status).toBe(401);
      const badBody = (await badRes.json()) as AdminAuthErrorPayload;
      expect(badBody.ok).toBe(false);
      expect(badBody.remainingAttempts).toBe(3 - attempt);
      // Redacción garantizada de contraseñas en logs
      expect(JSON.stringify(badBody.runtimeLog)).not.toContain(
        `wrong-pass-${attempt}`
      );
    }

    // 4to intento bloqueado con 429 Too Many Requests + Retry-After
    const lockedReq = new Request("https://dekolabs.org/api/admin/auth/login", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "x-forwarded-for": clientIp
      },
      body: JSON.stringify({
        username: "sebastian@dekolabs.org",
        password: "SuperSecurePassword!2026"
      })
    });
    const lockedRes = await handleAdminAuthLoginPost(lockedReq, {
      authConfig: TEST_AUTH_CONFIG,
      rateLimiter,
      nowMs: nowMs + 4000
    });
    expect(lockedRes.status).toBe(429);
    expect(Number(lockedRes.headers.get("Retry-After"))).toBeGreaterThan(0);
    const lockedBody = (await lockedRes.json()) as AdminAuthErrorPayload;
    expect(lockedBody.ok).toBe(false);
    expect(lockedBody.retryAfterSeconds).toBeGreaterThan(0);

    // Desde otra IP limpia (o tras ventana de desbloqueo), login exitoso emite Set-Cookie HttpOnly
    const okLoginReq = new Request("https://dekolabs.org/api/admin/auth/login", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "x-forwarded-for": "198.51.100.10"
      },
      body: JSON.stringify({
        username: "sebastian@dekolabs.org",
        password: "SuperSecurePassword!2026"
      })
    });
    const okLoginRes = await handleAdminAuthLoginPost(okLoginReq, {
      authConfig: TEST_AUTH_CONFIG,
      rateLimiter
    });
    expect(okLoginRes.status).toBe(200);
    const setCookieHeader = okLoginRes.headers.get("Set-Cookie") ?? "";
    expect(setCookieHeader).toContain("dekolabs_admin_session=");
    expect(setCookieHeader).toContain("HttpOnly");
    expect(setCookieHeader).toContain("SameSite=Strict");

    const okLoginBody = (await okLoginRes.json()) as AdminLoginSuccessPayload;
    expect(okLoginBody.ok).toBe(true);
    expect(okLoginBody.redirectTo).toBe("/admin/proyectos");
    expect(JSON.stringify(okLoginBody.runtimeLog)).not.toContain(
      "SuperSecurePassword!2026"
    );

    // La cookie firmada autoriza GET /api/admin/systems sin necesitar x-admin-key
    const cookiePair = setCookieHeader.split(";")[0] ?? "";
    const isolatedRepo = createPostgresCatalogRepository({
      connectionString: "",
      fallbackRepo: createProductionSystemsRepository()
    });
    const adminApiReq = new Request("https://dekolabs.org/api/admin/systems", {
      method: "GET",
      headers: {
        Cookie: cookiePair
      }
    });
    const adminApiRes = await handleAdminSystemsGet(adminApiReq, {
      authConfig: TEST_AUTH_CONFIG,
      adminAccessKey: "unused-key",
      repo: isolatedRepo
    });
    expect(adminApiRes.status).toBe(200);
    const adminApiBody =
      (await adminApiRes.json()) as AdminSystemsListSuccessPayload;
    expect(adminApiBody.ok).toBe(true);
    expect(adminApiBody.systems.length).toBeGreaterThanOrEqual(1);

    // Logout revoca inmediatamente la cookie con Max-Age=0
    const logoutReq = new Request("https://dekolabs.org/api/admin/auth/logout", {
      method: "POST"
    });
    const logoutRes = await handleAdminAuthLogoutPost(logoutReq, {
      authConfig: TEST_AUTH_CONFIG
    });
    expect(logoutRes.status).toBe(200);
    expect(logoutRes.headers.get("Set-Cookie")).toContain("Max-Age=0");
    const logoutBody = (await logoutRes.json()) as AdminLogoutSuccessPayload;
    expect(logoutBody.loggedOut).toBe(true);
    expect(logoutBody.redirectTo).toBe("/admin/login");
  });

  it("renderiza /admin/login (noindex, autofill semántico) y protege /admin/proyectos redirigiendo sin sesión válida", async () => {
    expect(adminLoginMetadata.title).toContain("/admin/login");
    expect(adminLoginMetadata.robots).toEqual({
      index: false,
      follow: false
    });

    const siteSnapshot = getSiteFoundationSnapshot();
    const loginHtml = renderToStaticMarkup(
      React.createElement(AdminLoginView, {
        identity: siteSnapshot.identity
      })
    );

    expect(loginHtml).toContain("Acceso Administrador");
    expect(loginHtml).toContain('action="/api/admin/auth/login"');
    expect(loginHtml).toContain('name="username"');
    expect(loginHtml.toLowerCase()).toContain('autocomplete="username"');
    expect(loginHtml).toContain('name="password"');
    expect(loginHtml.toLowerCase()).toContain('autocomplete="current-password"');
    expect(loginHtml).toContain("MOSTRAR");
    expect(loginHtml).toContain("Iniciar Sesión");

    mockedCookies.mockResolvedValue({
      get: () => undefined
    });

    const loginPageElement = await AdminLoginPage();
    expect(loginPageElement).toBeTruthy();

    // Verificar redirección Server-Side en CatalogAdminPage cuando cookies() no trae sesión válida
    await expect(CatalogAdminPage()).rejects.toThrow(/NEXT_REDIRECT/);

    // Verificar acceso permitido en CatalogAdminPage y redirección de /admin/login cuando ya hay sesión válida
    const validDevToken = createAdminSessionToken("admin@dekolabs.org");
    mockedCookies.mockResolvedValue({
      get: (name: string) =>
        name === getAdminSessionCookieName()
          ? { name, value: validDevToken }
          : undefined
    });

    const authorizedPage = await CatalogAdminPage();
    expect(authorizedPage).toBeTruthy();
    await expect(AdminLoginPage()).rejects.toThrow(/NEXT_REDIRECT/);

    // Cumplimiento de 6 capas y 0 CRLF en todos los archivos nuevos/modificados
    for (const relPath of [
      "src/app/admin/login/page.tsx",
      "src/ui/components/AdminLoginView.tsx",
      "src/app/admin/proyectos/page.tsx",
      "src/ui/components/CatalogAdminView.tsx"
    ]) {
      const content = readRepoFile(relPath);
      expect(content).not.toContain("@/config/");
      expect(content).not.toContain("@/repo/");
      expect(content.includes("\r")).toBe(false);
    }

    const envExample = readRepoFile(".env.example");
    const compose = readRepoFile("docker-compose.yml");
    expect(envExample).toContain("ADMIN_USERNAME=");
    expect(envExample).toContain("ADMIN_PASSWORD=");
    expect(envExample).toContain("ADMIN_SESSION_SECRET=");
    expect(compose).toContain("ADMIN_USERNAME:");
    expect(compose).toContain("ADMIN_PASSWORD:");
    expect(compose).toContain("ADMIN_SESSION_SECRET:");
  });
});
