import {
  buildRuntimeLogEntry,
  createCorrelationId
} from "@/runtime/logger";
import {
  createAdminSessionToken,
  defaultLoginRateLimiter,
  type LoginRateLimiter,
  resolveAdminAuthConfiguration,
  serializeAdminSessionCookie,
  serializeExpiredAdminSessionCookie,
  verifyAdminCredentials
} from "@/service/admin-auth.service";
import type {
  AdminAuthConfigOverrides,
  RuntimeLogEntry
} from "@/types/portfolio";

export interface AdminAuthHandlerOptions {
  authConfig?: AdminAuthConfigOverrides;
  rateLimiter?: LoginRateLimiter;
  nowMs?: number;
}

export interface AdminLoginSuccessPayload {
  ok: true;
  authenticated: true;
  username: string;
  redirectTo: "/admin/proyectos";
  correlationId: string;
  runtimeLog: RuntimeLogEntry;
}

export interface AdminLogoutSuccessPayload {
  ok: true;
  loggedOut: true;
  redirectTo: "/admin/login";
  correlationId: string;
  runtimeLog: RuntimeLogEntry;
}

export interface AdminAuthErrorPayload {
  ok: false;
  message: string;
  errors?: Record<string, string>;
  remainingAttempts?: number;
  retryAfterSeconds?: number;
  correlationId: string;
  runtimeLog: RuntimeLogEntry;
}

export function extractClientIpFromRequest(request: Request): string {
  const cfIp = request.headers.get("cf-connecting-ip")?.trim();
  if (cfIp) {
    return cfIp;
  }

  const forwardedFor = request.headers.get("x-forwarded-for")?.trim();
  if (forwardedFor) {
    const firstHop = forwardedFor.split(",")[0]?.trim();
    if (firstHop) {
      return firstHop;
    }
  }

  const realIp = request.headers.get("x-real-ip")?.trim();
  if (realIp) {
    return realIp;
  }

  return "127.0.0.1";
}

async function parseLoginRequestCredentials(request: Request): Promise<{
  parsed: boolean;
  username: string;
  password: string;
  isHtmlFormFallback: boolean;
}> {
  const contentType = (request.headers.get("content-type") ?? "").toLowerCase();
  const accept = (request.headers.get("accept") ?? "").toLowerCase();

  if (
    contentType.includes("application/x-www-form-urlencoded") ||
    contentType.includes("multipart/form-data")
  ) {
    try {
      const formData = await request.formData();
      const rawUser = formData.get("username");
      const rawPass = formData.get("password");
      return {
        parsed: true,
        username: typeof rawUser === "string" ? rawUser : "",
        password: typeof rawPass === "string" ? rawPass : "",
        isHtmlFormFallback: accept.includes("text/html")
      };
    } catch {
      return {
        parsed: false,
        username: "",
        password: "",
        isHtmlFormFallback: false
      };
    }
  }

  try {
    const rawBody = (await request.json()) as unknown;
    if (!rawBody || typeof rawBody !== "object" || Array.isArray(rawBody)) {
      return {
        parsed: false,
        username: "",
        password: "",
        isHtmlFormFallback: false
      };
    }
    const record = rawBody as Record<string, unknown>;
    return {
      parsed: true,
      username: typeof record.username === "string" ? record.username : "",
      password: typeof record.password === "string" ? record.password : "",
      isHtmlFormFallback: false
    };
  } catch {
    return {
      parsed: false,
      username: "",
      password: "",
      isHtmlFormFallback: false
    };
  }
}

export async function handleAdminAuthLoginPost(
  request: Request,
  options?: AdminAuthHandlerOptions
): Promise<Response> {
  const startMs = Date.now();
  const nowMs = options?.nowMs ?? startMs;
  const correlationId =
    request.headers.get("x-correlation-id")?.trim() ||
    createCorrelationId("adm-login");
  const clientIp = extractClientIpFromRequest(request);
  const config = resolveAdminAuthConfiguration(options?.authConfig);

  if (!config.configured) {
    const durationMs = Math.max(1, Date.now() - startMs);
    const runtimeLog = buildRuntimeLogEntry({
      level: "error",
      component: "runtime.admin-auth.handler",
      action: "POST /api/admin/auth/login (unconfigured)",
      durationMs,
      input: { clientIp },
      output: null,
      error: {
        message:
          "Autenticación de administrador deshabilitada por política Fail-Closed.",
        why: "En producción es obligatorio configurar ADMIN_USERNAME, ADMIN_PASSWORD (>= 8 caracteres) y ADMIN_SESSION_SECRET (>= 16 caracteres) sin valores placeholder.",
        fix: "Define ADMIN_USERNAME, ADMIN_PASSWORD y ADMIN_SESSION_SECRET reales en el archivo .env del nodo Ubuntu Home Lab."
      },
      correlationId
    });

    return Response.json(
      {
        ok: false,
        message:
          "El servicio de autenticación requiere configurar las credenciales privadas en el servidor (.env).",
        correlationId,
        runtimeLog
      } satisfies AdminAuthErrorPayload,
      {
        status: 503,
        headers: {
          "Cache-Control": "no-store, max-age=0",
          "x-correlation-id": correlationId
        }
      }
    );
  }

  const rateLimiter = options?.rateLimiter ?? defaultLoginRateLimiter;
  const currentLimit = rateLimiter.check(clientIp, nowMs);
  if (!currentLimit.allowed) {
    const durationMs = Math.max(1, Date.now() - startMs);
    const runtimeLog = buildRuntimeLogEntry({
      level: "warn",
      component: "runtime.admin-auth.handler",
      action: "POST /api/admin/auth/login (rate-limited)",
      durationMs,
      input: { clientIp },
      output: { retryAfterSeconds: currentLimit.retryAfterSeconds },
      error: {
        message:
          "Demasiados intentos fallidos de inicio de sesión desde esta dirección IP.",
        why: "El candado anti-fuerza bruta protege el panel /admin/proyectos bloqueando temporalmente ráfagas de intentos inválidos.",
        fix: `Espera ${currentLimit.retryAfterSeconds} segundos antes de volver a intentar iniciar sesión.`
      },
      correlationId
    });

    return Response.json(
      {
        ok: false,
        message: `Demasiados intentos fallidos. Por seguridad, espera ${currentLimit.retryAfterSeconds} segundos antes de reintentar.`,
        remainingAttempts: 0,
        retryAfterSeconds: currentLimit.retryAfterSeconds,
        correlationId,
        runtimeLog
      } satisfies AdminAuthErrorPayload,
      {
        status: 429,
        headers: {
          "Cache-Control": "no-store, max-age=0",
          "Retry-After": String(currentLimit.retryAfterSeconds),
          "x-correlation-id": correlationId
        }
      }
    );
  }

  const body = await parseLoginRequestCredentials(request);
  if (!body.parsed) {
    const durationMs = Math.max(1, Date.now() - startMs);
    const runtimeLog = buildRuntimeLogEntry({
      level: "warn",
      component: "runtime.admin-auth.handler",
      action: "POST /api/admin/auth/login (invalid-payload)",
      durationMs,
      input: { clientIp },
      output: null,
      error: {
        message: "El formato de la solicitud de inicio de sesión es inválido.",
        why: "El endpoint espera un objeto JSON o formulario con 'username' y 'password'.",
        fix: "Envía un payload válido con 'username' y 'password'."
      },
      correlationId
    });

    return Response.json(
      {
        ok: false,
        message: "Solicitud inválida. Verifica los datos enviados.",
        correlationId,
        runtimeLog
      } satisfies AdminAuthErrorPayload,
      {
        status: 400,
        headers: {
          "Cache-Control": "no-store, max-age=0",
          "x-correlation-id": correlationId
        }
      }
    );
  }

  const fieldErrors: Record<string, string> = {};
  if (!body.username.trim()) {
    fieldErrors.username = "Ingresa tu usuario o correo de administrador.";
  }
  if (!body.password) {
    fieldErrors.password = "Ingresa tu contraseña de administrador.";
  }

  if (Object.keys(fieldErrors).length > 0) {
    const durationMs = Math.max(1, Date.now() - startMs);
    const runtimeLog = buildRuntimeLogEntry({
      level: "warn",
      component: "runtime.admin-auth.handler",
      action: "POST /api/admin/auth/login (missing-fields)",
      durationMs,
      input: {
        clientIp,
        missingFields: Object.keys(fieldErrors)
      },
      output: null,
      error: {
        message: "Campos obligatorios incompletos al iniciar sesión.",
        why: "Se requieren tanto usuario como contraseña para verificar identidad.",
        fix: "Completa los campos 'username' y 'password'."
      },
      correlationId
    });

    return Response.json(
      {
        ok: false,
        message: "Por favor completa tu usuario y contraseña.",
        errors: fieldErrors,
        correlationId,
        runtimeLog
      } satisfies AdminAuthErrorPayload,
      {
        status: 400,
        headers: {
          "Cache-Control": "no-store, max-age=0",
          "x-correlation-id": correlationId
        }
      }
    );
  }

  const credentialsValid = verifyAdminCredentials(
    {
      username: body.username,
      password: body.password
    },
    options?.authConfig
  );

  if (!credentialsValid) {
    const failureState = rateLimiter.recordFailure(clientIp, nowMs);
    const durationMs = Math.max(1, Date.now() - startMs);
    const runtimeLog = buildRuntimeLogEntry({
      level: "warn",
      component: "runtime.admin-auth.handler",
      action: "POST /api/admin/auth/login (invalid-credentials)",
      durationMs,
      input: {
        clientIp,
        username: body.username.trim(),
        password: "[REDACTED]"
      },
      output: {
        authenticated: false,
        remainingAttempts: failureState.remainingAttempts
      },
      error: {
        message: "Credenciales de administrador inválidas.",
        why: "El usuario o la contraseña no coinciden con la identidad configurada.",
        fix: "Verifica ADMIN_USERNAME y ADMIN_PASSWORD e intenta nuevamente."
      },
      correlationId
    });

    const lockoutNotice =
      failureState.remainingAttempts === 0
        ? " Se alcanzó el límite de intentos permitidos; el siguiente intento será bloqueado temporalmente."
        : "";

    return Response.json(
      {
        ok: false,
        message: `Usuario o contraseña incorrectos.${lockoutNotice}`,
        remainingAttempts: failureState.remainingAttempts,
        correlationId,
        runtimeLog
      } satisfies AdminAuthErrorPayload,
      {
        status: 401,
        headers: {
          "Cache-Control": "no-store, max-age=0",
          "x-correlation-id": correlationId
        }
      }
    );
  }

  rateLimiter.recordSuccess(clientIp);
  const sessionToken = createAdminSessionToken(
    config.username,
    options?.authConfig,
    nowMs
  );
  const setCookieHeader = serializeAdminSessionCookie(
    sessionToken,
    options?.authConfig
  );

  const durationMs = Math.max(1, Date.now() - startMs);
  const runtimeLog = buildRuntimeLogEntry({
    level: "info",
    component: "runtime.admin-auth.handler",
    action: "POST /api/admin/auth/login",
    durationMs,
    input: {
      clientIp,
      username: config.username,
      password: "[REDACTED]"
    },
    output: {
      authenticated: true,
      redirectTo: "/admin/proyectos"
    },
    error: null,
    correlationId
  });

  if (body.isHtmlFormFallback) {
    const targetUrl = new URL("/admin/proyectos", request.url);
    return new Response(null, {
      status: 303,
      headers: {
        Location: targetUrl.toString(),
        "Set-Cookie": setCookieHeader,
        "Cache-Control": "no-store, max-age=0",
        "x-correlation-id": correlationId
      }
    });
  }

  return Response.json(
    {
      ok: true,
      authenticated: true,
      username: config.username,
      redirectTo: "/admin/proyectos",
      correlationId,
      runtimeLog
    } satisfies AdminLoginSuccessPayload,
    {
      status: 200,
      headers: {
        "Set-Cookie": setCookieHeader,
        "Cache-Control": "no-store, max-age=0",
        "x-correlation-id": correlationId
      }
    }
  );
}

export async function handleAdminAuthLogoutPost(
  request: Request,
  options?: AdminAuthHandlerOptions
): Promise<Response> {
  const startMs = Date.now();
  const correlationId =
    request.headers.get("x-correlation-id")?.trim() ||
    createCorrelationId("adm-logout");
  const clientIp = extractClientIpFromRequest(request);
  const expiredCookieHeader = serializeExpiredAdminSessionCookie(
    options?.authConfig
  );

  const durationMs = Math.max(1, Date.now() - startMs);
  const runtimeLog = buildRuntimeLogEntry({
    level: "info",
    component: "runtime.admin-auth.handler",
    action: "POST /api/admin/auth/logout",
    durationMs,
    input: { clientIp },
    output: {
      loggedOut: true,
      redirectTo: "/admin/login"
    },
    error: null,
    correlationId
  });

  return Response.json(
    {
      ok: true,
      loggedOut: true,
      redirectTo: "/admin/login",
      correlationId,
      runtimeLog
    } satisfies AdminLogoutSuccessPayload,
    {
      status: 200,
      headers: {
        "Set-Cookie": expiredCookieHeader,
        "Cache-Control": "no-store, max-age=0",
        "x-correlation-id": correlationId
      }
    }
  );
}
