import fs from "node:fs";
import path from "node:path";
import React from "react";
import { renderToStaticMarkup } from "react-dom/server";
import { afterEach, describe, expect, it } from "vitest";
import HomePage from "@/app/page";
import AiProjectsPage from "@/app/proyectos-ia/page";
import HabilidadesYStackPage from "@/app/habilidades-y-stack/page";
import SistemasPage from "@/app/sistemas/page";
import SystemDetailPage from "@/app/sistemas/[slug]/page";
import {
  DEFAULT_SOCIAL_LINKS_URLS,
  OFFICIAL_AUTHOR_CREDIT,
  OFFICIAL_COPYRIGHT_NOTICE,
  resolveSafeSocialUrl
} from "@/config/site.config";
import {
  getOfficialFooterSnapshot,
  getSiteFoundationSnapshot
} from "@/service/site.service";
import { AppShell } from "@/ui/components/AppShell";
import { OfficialFooter } from "@/ui/components/OfficialFooter";

const REPO_ROOT = path.resolve(__dirname, "..");

function readRepoFile(relPath: string): string {
  return fs.readFileSync(path.join(REPO_ROOT, relPath), "utf8");
}

const ENV_KEYS = [
  "NEXT_PUBLIC_SOCIAL_LINKEDIN_URL",
  "NEXT_PUBLIC_SOCIAL_FACEBOOK_URL",
  "NEXT_PUBLIC_SOCIAL_INSTAGRAM_URL",
  "NEXT_PUBLIC_SOCIAL_WHATSAPP_URL"
] as const;

describe("feat-015: Pie de Página Oficial (OfficialFooter), Redes Sociales y Copyright 2026", () => {
  const originalEnv: Partial<Record<(typeof ENV_KEYS)[number], string | undefined>> = {
    NEXT_PUBLIC_SOCIAL_LINKEDIN_URL: process.env.NEXT_PUBLIC_SOCIAL_LINKEDIN_URL,
    NEXT_PUBLIC_SOCIAL_FACEBOOK_URL: process.env.NEXT_PUBLIC_SOCIAL_FACEBOOK_URL,
    NEXT_PUBLIC_SOCIAL_INSTAGRAM_URL: process.env.NEXT_PUBLIC_SOCIAL_INSTAGRAM_URL,
    NEXT_PUBLIC_SOCIAL_WHATSAPP_URL: process.env.NEXT_PUBLIC_SOCIAL_WHATSAPP_URL
  };

  afterEach(() => {
    for (const key of ENV_KEYS) {
      const prev = originalEnv[key];
      if (prev === undefined) {
        delete process.env[key];
      } else {
        process.env[key] = prev;
      }
    }
  });

  it("expone OfficialFooterData en getSiteFoundationSnapshot().footer usando site.config.ts como fuente única de verdad de redes sociales (sin variables NEXT_PUBLIC_SOCIAL_* en .env.example) y con sanitización de esquema", () => {
    const envExample = readRepoFile(".env.example");
    // .env.example ya no incluye variables NEXT_PUBLIC_SOCIAL_*
    expect(envExample).not.toContain("NEXT_PUBLIC_SOCIAL_");
    // Todas las variables de claves, sesión y base de datos permanecen intactas
    expect(envExample).toContain("ADMIN_USERNAME=");
    expect(envExample).toContain("ADMIN_PASSWORD=");
    expect(envExample).toContain("ADMIN_SESSION_SECRET=");
    expect(envExample).toContain("ADMIN_ACCESS_KEY=");
    expect(envExample).toContain("POSTGRES_USER=");
    expect(envExample).toContain("POSTGRES_PASSWORD=");
    expect(envExample).toContain("POSTGRES_DB=");
    expect(envExample).toContain("DATABASE_URL=");
    expect(envExample).toContain("CATALOG_UPLOADS_DIR=");

    expect(DEFAULT_SOCIAL_LINKS_URLS).toEqual({
      linkedin: "https://www.linkedin.com/in/sebastian-jimenez-aibuilder/",
      facebook: "https://www.facebook.com/sebastian.jimenez.561437",
      instagram: "https://www.instagram.com/sebastian.1969c/",
      whatsapp: "https://wa.me/50240275763"
    });

    const snapshot = getSiteFoundationSnapshot();
    expect(snapshot.footer.copyrightYear).toBe(2026);
    expect(snapshot.footer.authorCredit).toBe(
      "Creado por Sebastián Jiménez / Deko Labs"
    );
    expect(snapshot.footer.copyrightNotice).toBe(OFFICIAL_COPYRIGHT_NOTICE);
    expect(snapshot.footer.copyrightNotice).toContain(OFFICIAL_AUTHOR_CREDIT);
    expect(snapshot.footer.copyrightNotice).toBe(
      "© 2026 · Creado por Sebastián Jiménez / Deko Labs"
    );

    expect(snapshot.footer.socialLinks.map((item) => item.id)).toEqual([
      "linkedin",
      "facebook",
      "instagram",
      "whatsapp"
    ]);
    expect(snapshot.footer.socialLinks.map((item) => item.label)).toEqual([
      "LinkedIn",
      "Facebook",
      "Instagram",
      "WhatsApp"
    ]);

    // Incluso si existen variables NEXT_PUBLIC_SOCIAL_* heredadas en process.env del servidor,
    // getOfficialFooterSnapshot() las ignora y usa DEFAULT_SOCIAL_LINKS_URLS como fuente única de verdad
    process.env.NEXT_PUBLIC_SOCIAL_LINKEDIN_URL =
      "https://www.linkedin.com/in/valor-heredado-en-env";
    process.env.NEXT_PUBLIC_SOCIAL_FACEBOOK_URL =
      "https://www.facebook.com/valor-heredado-en-env";
    process.env.NEXT_PUBLIC_SOCIAL_INSTAGRAM_URL =
      "https://www.instagram.com/valor-heredado-en-env";
    process.env.NEXT_PUBLIC_SOCIAL_WHATSAPP_URL = "https://wa.me/573101234567";

    const envSnapshot = getOfficialFooterSnapshot();
    expect(envSnapshot.socialLinks.map((item) => item.href)).toEqual([
      "https://www.linkedin.com/in/sebastian-jimenez-aibuilder/",
      "https://www.facebook.com/sebastian.jimenez.561437",
      "https://www.instagram.com/sebastian.1969c/",
      "https://wa.me/50240275763"
    ]);

    // Sanitización Fail-Safe contra esquemas inseguros (javascript:, data:, cadenas corruptas)
    expect(
      resolveSafeSocialUrl(
        "javascript:alert(1)",
        DEFAULT_SOCIAL_LINKS_URLS.linkedin
      )
    ).toBe(DEFAULT_SOCIAL_LINKS_URLS.linkedin);
    expect(
      resolveSafeSocialUrl(
        "data:text/html,<script>alert(1)</script>",
        DEFAULT_SOCIAL_LINKS_URLS.whatsapp
      )
    ).toBe(DEFAULT_SOCIAL_LINKS_URLS.whatsapp);
    expect(
      resolveSafeSocialUrl("   ", DEFAULT_SOCIAL_LINKS_URLS.instagram)
    ).toBe(DEFAULT_SOCIAL_LINKS_URLS.instagram);
  });

  it("renderiza OfficialFooter con landmark <footer>, ancla #contacto, íconos SVG accesibles, seguridad rel='noopener noreferrer' y copyright literal", () => {
    const customFooter = getOfficialFooterSnapshot({
      linkedinUrl: "https://www.linkedin.com/in/sebastian-j",
      facebookUrl: "https://www.facebook.com/sebastian-j",
      instagramUrl: "https://www.instagram.com/sebastian-j",
      whatsappUrl: "https://wa.me/573009998877"
    });

    const footerHtml = renderToStaticMarkup(
      React.createElement(OfficialFooter, { footer: customFooter })
    );

    expect(footerHtml).toContain('<footer id="contacto"');
    expect(footerHtml).toContain(
      'aria-label="Redes sociales y contacto directo"'
    );
    expect(footerHtml).toContain("Creado por Sebastián Jiménez / Deko Labs");
    expect(footerHtml).toContain(
      "© 2026 · Creado por Sebastián Jiménez / Deko Labs"
    );
    expect(footerHtml).not.toContain("Jimenez 2026");
    expect(footerHtml).not.toContain("Jiménez 2026");

    for (const expected of [
      {
        id: "linkedin",
        label: "LinkedIn",
        href: "https://www.linkedin.com/in/sebastian-j"
      },
      {
        id: "facebook",
        label: "Facebook",
        href: "https://www.facebook.com/sebastian-j"
      },
      {
        id: "instagram",
        label: "Instagram",
        href: "https://www.instagram.com/sebastian-j"
      },
      {
        id: "whatsapp",
        label: "WhatsApp",
        href: "https://wa.me/573009998877"
      }
    ]) {
      expect(footerHtml).toContain(`data-social-platform="${expected.id}"`);
      expect(footerHtml).toContain(`href="${expected.href}"`);
      expect(footerHtml).toContain(`<span>${expected.label}</span>`);
    }

    // 4 enlaces externos seguros + 5 íconos vectoriales SVG decorativos ocultos de lectores de pantalla (4 redes + 1 engranaje discreto)
    const blankMatches = footerHtml.match(/target="_blank"/g) ?? [];
    const relMatches = footerHtml.match(/rel="noopener noreferrer"/g) ?? [];
    const svgMatches = footerHtml.match(/<svg[^>]*aria-hidden="true"/g) ?? [];
    expect(blankMatches).toHaveLength(4);
    expect(relMatches).toHaveLength(4);
    expect(svgMatches).toHaveLength(5);

    // Enlace muy discreto de engranaje hacia /admin/login sin texto visible ni atributo title
    expect(footerHtml).toContain('href="/admin/login"');
    expect(footerHtml).toContain('aria-label="Acceso de administrador"');
    expect(footerHtml).toContain('data-admin-login-trigger="true"');
    const adminLinkMatch = footerHtml.match(
      /<a\b[^>]*data-admin-login-trigger="true"[^>]*>([\s\S]*?)<\/a>/
    );
    expect(adminLinkMatch).not.toBeNull();
    expect(adminLinkMatch?.[0]).not.toContain("title=");
    const innerContentWithoutSvg = (adminLinkMatch?.[1] ?? "")
      .replace(/<svg[\s\S]*?<\/svg>/g, "")
      .trim();
    expect(innerContentWithoutSvg).toBe("");
  });

  it("integra OfficialFooter globalmente en AppShell (con prop explícita y fallback seguro) y en las páginas /, /proyectos-ia y /sistemas/[slug]", async () => {
    const siteSnapshot = getSiteFoundationSnapshot();

    // 1. AppShell sin prop footer explícita (compatibilidad total con tests existentes)
    const fallbackShellHtml = renderToStaticMarkup(
      React.createElement(AppShell, {
        identity: siteSnapshot.identity,
        navigation: siteSnapshot.navigation,
        ambientTelemetry: siteSnapshot.ambientTelemetry,
        defaultTheme: siteSnapshot.defaultTheme,
        children: React.createElement("section", null, "Vista de Prueba")
      })
    );
    expect(fallbackShellHtml).toContain(
      "Creado por Sebastián Jiménez / Deko Labs"
    );
    expect(fallbackShellHtml).toContain(
      "© 2026 · Creado por Sebastián Jiménez / Deko Labs"
    );
    expect(fallbackShellHtml.match(/<footer\b/g) ?? []).toHaveLength(1);

    // 2. Páginas públicas principales del portafolio: /, /sistemas, /habilidades-y-stack, /proyectos-ia y /sistemas/[slug]
    const homeHtml = renderToStaticMarkup(await HomePage());
    const sistemasHtml = renderToStaticMarkup(await SistemasPage());
    const stackHtml = renderToStaticMarkup(await HabilidadesYStackPage());
    const aiProjectsHtml = renderToStaticMarkup(await AiProjectsPage());
    const detailHtml = renderToStaticMarkup(
      await SystemDetailPage({
        params: Promise.resolve({ slug: "deco-vintage-platform" })
      })
    );

    for (const pageHtml of [
      homeHtml,
      sistemasHtml,
      stackHtml,
      aiProjectsHtml,
      detailHtml
    ]) {
      expect(pageHtml).toContain("Creado por Sebastián Jiménez / Deko Labs");
      expect(pageHtml).toContain(
        "© 2026 · Creado por Sebastián Jiménez / Deko Labs"
      );
      expect(pageHtml).toContain('data-social-platform="linkedin"');
      expect(pageHtml).toContain('data-social-platform="facebook"');
      expect(pageHtml).toContain('data-social-platform="instagram"');
      expect(pageHtml).toContain('data-social-platform="whatsapp"');
      expect(pageHtml).toContain(
        'href="https://www.linkedin.com/in/sebastian-jimenez-aibuilder/"'
      );
      expect(pageHtml).toContain('href="https://wa.me/50240275763"');
      expect(pageHtml).toContain(
        'href="https://www.instagram.com/sebastian.1969c/"'
      );
      expect(pageHtml).toContain(
        'href="https://www.facebook.com/sebastian.jimenez.561437"'
      );
      expect(pageHtml.match(/<footer\b/g) ?? []).toHaveLength(1);
    }
  });

  it("respeta estrictamente las 6 capas (cero saltos desde app/ui hacia config/repo) y mantiene 0 CRLF", () => {
    for (const uiPath of [
      "src/ui/components/Navbar.tsx",
      "src/ui/components/OfficialFooter.tsx",
      "src/ui/components/AppShell.tsx",
      "src/app/page.tsx",
      "src/app/sistemas/page.tsx",
      "src/app/habilidades-y-stack/page.tsx",
      "src/app/proyectos-ia/page.tsx",
      "src/app/sistemas/[slug]/page.tsx"
    ]) {
      const source = readRepoFile(uiPath);
      expect(source).not.toContain("@/config/");
      expect(source).not.toContain("@/repo/");
      expect(source.includes("\r")).toBe(false);
    }

    for (const lowerLayerPath of [
      ".env.example",
      "src/types/portfolio.ts",
      "src/config/site.config.ts",
      "src/repo/site.repo.ts",
      "src/service/site.service.ts",
      "tests/official-footer.test.ts",
      "tests/harness-deprecation-dag.test.ts"
    ]) {
      const source = readRepoFile(lowerLayerPath);
      expect(source.includes("\r")).toBe(false);
    }
  });
});
