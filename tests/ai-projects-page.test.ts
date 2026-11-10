import fs from "node:fs";
import path from "node:path";
import React from "react";
import { renderToStaticMarkup } from "react-dom/server";
import { beforeEach, describe, expect, it, vi } from "vitest";

const { mockedRevalidatePath } = vi.hoisted(() => ({
  mockedRevalidatePath: vi.fn()
}));

vi.mock("next/cache", () => ({
  revalidatePath: mockedRevalidatePath
}));

import HomePage, { dynamic as homeDynamic } from "@/app/page";
import { metadata as rootMetadata } from "@/app/layout";
import AiProjectsPage, {
  dynamic as aiProjectsDynamic,
  metadata as aiProjectsMetadata
} from "@/app/proyectos-ia/page";
import { generateMetadata as generateSystemDetailMetadata } from "@/app/sistemas/[slug]/page";
import { createPostgresCatalogRepository } from "@/repo/postgres-catalog.repo";
import { createProductionSystemsRepository } from "@/repo/systems.repo";
import {
  CATALOG_REVALIDATION_PATHS,
  type AdminSystemSingleSuccessPayload,
  handleAdminSystemsDelete,
  handleAdminSystemsPost,
  handleAdminSystemsPut
} from "@/runtime/admin-catalog.handler";
import { getSiteFoundationSnapshot } from "@/service/site.service";
import {
  getCatalogSectionsConfig,
  getProductionSystems,
  listCatalogSystemsAsync,
  splitSystemsByHomeCatalogSection
} from "@/service/systems.service";
import type { ProductionSystem } from "@/types/portfolio";
import { AiProjectsCatalogView } from "@/ui/components/AiProjectsCatalogView";
import { AppShell } from "@/ui/components/AppShell";
import {
  buildPromoteToProductionPayload,
  createBlankProjectDraft
} from "@/ui/components/CatalogAdminView";
import { ProductionSystemsSection } from "@/ui/components/ProductionSystemsSection";

const REPO_ROOT = path.resolve(__dirname, "..");

function readRepoFile(relPath: string): string {
  return fs.readFileSync(path.join(REPO_ROOT, relPath), "utf8");
}

describe("feat-014: Página de Inicio (/) Exclusiva para Producción y Ruta Pública Dedicada /proyectos-ia", () => {
  beforeEach(() => {
    mockedRevalidatePath.mockReset();
  });

  it("retira por completo #mas-proyectos-ia y MÁS PROYECTOS DE IA de la página de inicio (/) y de ProductionSystemsSection.tsx", async () => {
    expect(homeDynamic).toBe("force-dynamic");

    const homeSource = readRepoFile("src/app/page.tsx");
    const sectionSource = readRepoFile(
      "src/ui/components/ProductionSystemsSection.tsx"
    );

    for (const source of [homeSource, sectionSource]) {
      expect(source).not.toContain('id="mas-proyectos-ia"');
      expect(source).not.toContain("mas-proyectos-ia");
      expect(source).not.toContain("MÁS PROYECTOS DE IA");
    }

    const baseSystems = getProductionSystems();
    const sectionHtml = renderToStaticMarkup(
      React.createElement(ProductionSystemsSection, {
        systems: baseSystems
      })
    );
    expect(sectionHtml).toContain('id="proyectos-destacados"');
    expect(sectionHtml).toContain("SISTEMAS EN PRODUCCIÓN");
    expect(sectionHtml).toContain("DECO VINTAGE PLATFORM");
    expect(sectionHtml).not.toContain('id="mas-proyectos-ia"');
    expect(sectionHtml).not.toContain("MÁS PROYECTOS DE IA");

    const homeElement = await HomePage();
    const homeHtml = renderToStaticMarkup(homeElement);
    expect(homeHtml).toContain('id="proyectos-destacados"');
    expect(homeHtml).toContain("SISTEMAS EN PRODUCCIÓN");
    expect(homeHtml).toContain("DECO VINTAGE PLATFORM");
    expect(homeHtml).not.toContain('id="mas-proyectos-ia"');
    expect(homeHtml).not.toContain("MÁS PROYECTOS DE IA");
  });

  it("actualiza la navegación global hacia /proyectos-ia y /#... manteniendo los labels oficiales e indicando aria-current=\"page\"", () => {
    const siteSnapshot = getSiteFoundationSnapshot();

    expect(siteSnapshot.navigation).toEqual([
      {
        id: "sistemas",
        code: "01",
        label: "SISTEMAS EN PRODUCCIÓN",
        href: "/#proyectos-destacados"
      },
      {
        id: "stack",
        code: "02",
        label: "STACK TECNOLÓGICO",
        href: "/#stack-tecnologico"
      },
      {
        id: "mas-proyectos",
        code: "03",
        label: "MÁS PROYECTOS DE IA",
        href: "/proyectos-ia"
      }
    ]);
    expect(siteSnapshot.identity.primaryCtaHref).toBe("/#proyectos-destacados");
    expect(siteSnapshot.identity.secondaryCtaHref).toBe("/#contacto");

    const homeShellHtml = renderToStaticMarkup(
      React.createElement(AppShell, {
        identity: siteSnapshot.identity,
        navigation: siteSnapshot.navigation,
        ambientTelemetry: siteSnapshot.ambientTelemetry,
        defaultTheme: siteSnapshot.defaultTheme,
        currentPath: "/",
        children: React.createElement("div", null, "Contenido Home")
      })
    );
    expect(homeShellHtml).toContain('href="/proyectos-ia"');
    expect(homeShellHtml).toContain('href="/#proyectos-destacados"');
    expect(homeShellHtml).toContain('href="/#stack-tecnologico"');
    expect(homeShellHtml).toContain('href="/#contacto"');
    expect(homeShellHtml).toContain("TECNOLÓGICO");
    expect(homeShellHtml).toContain("MÁS PROYECTOS");
    expect(homeShellHtml).not.toContain('aria-current="page"');

    const aiShellHtml = renderToStaticMarkup(
      React.createElement(AppShell, {
        identity: siteSnapshot.identity,
        navigation: siteSnapshot.navigation,
        ambientTelemetry: siteSnapshot.ambientTelemetry,
        defaultTheme: siteSnapshot.defaultTheme,
        currentPath: "/proyectos-ia",
        children: React.createElement("div", null, "Contenido IA")
      })
    );
    expect(aiShellHtml).toMatch(
      /<a[^>]*aria-current="page"[^>]*href="\/proyectos-ia"/
    );
  });

  it("renderiza la página pública /proyectos-ia con estado vacío sobrio y con tarjetas Atelier Monolith jerarquizadas (h1 -> h2)", async () => {
    expect(aiProjectsDynamic).toBe("force-dynamic");
    expect(aiProjectsMetadata.title).toBe(
      "Más Proyectos de IA — Google ADK & Sistemas RAG"
    );
    expect(String(aiProjectsMetadata.title)).not.toContain("dekolabs.org");
    expect(aiProjectsMetadata.alternates?.canonical).toBe("/proyectos-ia");

    // Verificación de metadatos OpenGraph y títulos sin duplicación en layout y /sistemas/[slug]
    expect(JSON.stringify(rootMetadata.openGraph?.images)).toContain(
      "/assets/deco-vintage-preview.png"
    );
    expect(JSON.stringify(rootMetadata.twitter?.images)).toContain(
      "/assets/deco-vintage-preview.png"
    );

    const detailMeta = await generateSystemDetailMetadata({
      params: Promise.resolve({ slug: "deco-vintage-platform" })
    });
    expect(detailMeta.title).toBe("DECO VINTAGE PLATFORM");
    expect(String(detailMeta.title)).not.toContain("dekolabs.org");
    expect(JSON.stringify(detailMeta.openGraph?.images)).toContain(
      "/assets/deco-vintage-preview.png"
    );

    const notFoundMeta = await generateSystemDetailMetadata({
      params: Promise.resolve({ slug: "sistema-inexistente" })
    });
    expect(notFoundMeta.title).toBe("Sistema No Encontrado");

    // 1. Estado inicial sin proyectos de IA publicados en producción -> estado vacío sobrio
    const emptyPageElement = await AiProjectsPage();
    const emptyPageHtml = renderToStaticMarkup(emptyPageElement);
    expect(emptyPageHtml).toContain('id="mas-proyectos-ia"');
    expect(emptyPageHtml).toContain("MÁS PROYECTOS DE IA");
    expect(emptyPageHtml).toContain("CATÁLOGO EN CONSTRUCCIÓN");
    expect(emptyPageHtml).toContain('href="/#proyectos-destacados"');
    expect(emptyPageHtml).toContain('aria-current="page"');

    // 2. Estado con múltiples proyectos en etapa Más Proyectos de IA
    const baseTemplate = getProductionSystems()[0]!;
    const sections = getCatalogSectionsConfig();
    const aiFixtureOne: ProductionSystem = {
      ...baseTemplate,
      id: "sys-ai-01",
      order: "05",
      slug: "adk-multiagent-orchestrator",
      title: "ADK MULTI-AGENT ORCHESTRATOR",
      catalogSection: "ai-projects",
      featuredOnHome: true,
      projectHeaderLabel: "PROJECT 05 // GOOGLE ADK & MCP",
      versionBadge: "v0.9.0 IN BUILD",
      highlightedStackTag: "GOOGLE ADK",
      stackTags: ["GOOGLE ADK", "PGVECTOR", "TYPESCRIPT"],
      previewImageSrc: "/api/assets/adk-orchestrator.webp",
      detailHref: "/sistemas/adk-multiagent-orchestrator"
    };
    const aiFixtureTwo: ProductionSystem = {
      ...baseTemplate,
      id: "sys-ai-02",
      order: "06",
      slug: "pgvector-hybrid-rag",
      title: "PGVECTOR HYBRID RAG ENGINE",
      catalogSection: "ai-projects",
      featuredOnHome: true,
      projectHeaderLabel: "PROJECT 06 // HYBRID VECTOR SEARCH",
      versionBadge: "v0.8.0 AI BUILD",
      highlightedStackTag: "PGVECTOR",
      stackTags: ["PGVECTOR", "POSTGRESQL 17", "NEXT.JS 15"],
      previewImageSrc: "/api/assets/pgvector-rag.webp",
      detailHref: "/sistemas/pgvector-hybrid-rag"
    };

    const populatedHtml = renderToStaticMarkup(
      React.createElement(AiProjectsCatalogView, {
        projects: [aiFixtureOne, aiFixtureTwo],
        section: sections["ai-projects"]
      })
    );

    expect(populatedHtml).toContain('id="mas-proyectos-ia"');
    expect(populatedHtml).toContain("<h1");
    expect(populatedHtml).toContain("MÁS PROYECTOS DE IA");
    expect(populatedHtml).toContain("2 PROYECTOS EN CATÁLOGO DE IA");
    expect(populatedHtml).toContain("ADK MULTI-AGENT ORCHESTRATOR");
    expect(populatedHtml).toContain("PGVECTOR HYBRID RAG ENGINE");
    expect(populatedHtml).toContain("<h2");
    expect(populatedHtml).not.toContain("CATÁLOGO EN CONSTRUCCIÓN");
    // Primera tarjeta priorizada para LCP y segunda con carga diferida limpia
    expect(populatedHtml.toLowerCase()).toContain('fetchpriority="high"');
    expect(populatedHtml).toContain('loading="lazy"');
  });

  it("mueve automáticamente un proyecto de /proyectos-ia hacia / al evolucionar a Producción y ejecuta revalidatePath(\"/proyectos-ia\")", async () => {
    expect(CATALOG_REVALIDATION_PATHS).toContain("/");
    expect(CATALOG_REVALIDATION_PATHS).toContain("/proyectos-ia");
    expect(CATALOG_REVALIDATION_PATHS).toContain("/admin/proyectos");

    const isolatedRepo = createPostgresCatalogRepository({
      connectionString: "",
      fallbackRepo: createProductionSystemsRepository()
    });
    const adminKey = "test-feat014-admin-key";

    // 1. Crear proyecto en Más Proyectos de IA -> aparece en /proyectos-ia y NO en /
    const createDraft = {
      ...createBlankProjectDraft("05", "ai-projects"),
      slug: "agente-rag-produccion-ready",
      title: "AGENTE RAG PRODUCCIÓN READY",
      subtitle: "Pipeline Google ADK con PostgreSQL 17 + pgvector",
      summary: "Agente autónomo validado en incubación listo para evolucionar."
    };

    const postRes = await handleAdminSystemsPost(
      new Request("http://localhost:3000/api/admin/systems", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          "x-admin-key": adminKey
        },
        body: JSON.stringify(createDraft)
      }),
      { adminAccessKey: adminKey, repo: isolatedRepo }
    );
    expect(postRes.status).toBe(201);
    const createdSystem = (
      (await postRes.json()) as AdminSystemSingleSuccessPayload
    ).system;

    expect(mockedRevalidatePath).toHaveBeenCalledWith("/");
    expect(mockedRevalidatePath).toHaveBeenCalledWith("/proyectos-ia");
    expect(mockedRevalidatePath).toHaveBeenCalledWith(
      "/sistemas/agente-rag-produccion-ready"
    );

    const afterCreateSplit = splitSystemsByHomeCatalogSection(
      await listCatalogSystemsAsync(isolatedRepo)
    );
    expect(
      afterCreateSplit.aiProjects.some(
        (p) => p.slug === "agente-rag-produccion-ready"
      )
    ).toBe(true);
    expect(
      afterCreateSplit.productionSystems.some(
        (p) => p.slug === "agente-rag-produccion-ready"
      )
    ).toBe(false);

    // 2. Evolucionar a Producción -> sale de /proyectos-ia y entra a /
    mockedRevalidatePath.mockClear();
    const promotePayload = buildPromoteToProductionPayload(createdSystem);
    const putRes = await handleAdminSystemsPut(
      new Request("http://localhost:3000/api/admin/systems", {
        method: "PUT",
        headers: {
          "Content-Type": "application/json",
          "x-admin-key": adminKey
        },
        body: JSON.stringify(promotePayload)
      }),
      { adminAccessKey: adminKey, repo: isolatedRepo }
    );
    expect(putRes.status).toBe(200);
    expect(mockedRevalidatePath).toHaveBeenCalledWith("/");
    expect(mockedRevalidatePath).toHaveBeenCalledWith("/proyectos-ia");

    const afterPromoteSplit = splitSystemsByHomeCatalogSection(
      await listCatalogSystemsAsync(isolatedRepo)
    );
    expect(
      afterPromoteSplit.aiProjects.some(
        (p) => p.slug === "agente-rag-produccion-ready"
      )
    ).toBe(false);
    expect(
      afterPromoteSplit.productionSystems.some(
        (p) => p.slug === "agente-rag-produccion-ready"
      )
    ).toBe(true);

    // 3. Eliminar proyecto -> también revalida /proyectos-ia
    mockedRevalidatePath.mockClear();
    const delRes = await handleAdminSystemsDelete(
      new Request(
        "http://localhost:3000/api/admin/systems?slug=agente-rag-produccion-ready",
        {
          method: "DELETE",
          headers: { "x-admin-key": adminKey }
        }
      ),
      { adminAccessKey: adminKey, repo: isolatedRepo }
    );
    expect(delRes.status).toBe(200);
    expect(mockedRevalidatePath).toHaveBeenCalledWith("/proyectos-ia");
  });

  it("cumple estrictamente las 6 capas (cero imports a config/repo desde app/ui) y 0 CRLF", () => {
    for (const relPath of [
      "src/app/page.tsx",
      "src/app/proyectos-ia/page.tsx",
      "src/ui/components/AppShell.tsx",
      "src/ui/components/ProductionSystemsSection.tsx",
      "src/ui/components/AiProjectsCatalogView.tsx"
    ]) {
      const content = readRepoFile(relPath);
      expect(content).not.toContain("@/config/");
      expect(content).not.toContain("@/repo/");
      expect(content.includes("\r")).toBe(false);
    }

    for (const relPath of [
      "src/types/portfolio.ts",
      "src/config/site.config.ts",
      "src/runtime/admin-catalog.handler.ts"
    ]) {
      const content = readRepoFile(relPath);
      expect(content.includes("\r")).toBe(false);
    }
  });
});
