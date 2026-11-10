import fs from "node:fs";
import path from "node:path";
import React from "react";
import { renderToStaticMarkup } from "react-dom/server";
import { describe, expect, it } from "vitest";
import CatalogAdminPage, {
  metadata as adminPageMetadata
} from "@/app/admin/proyectos/page";
import { createPostgresCatalogRepository } from "@/repo/postgres-catalog.repo";
import { createProductionSystemsRepository } from "@/repo/systems.repo";
import {
  type AdminSystemSingleSuccessPayload,
  handleAdminSystemsPut
} from "@/runtime/admin-catalog.handler";
import {
  buildPromotedToProductionInput,
  getCatalogSectionsConfig,
  getDefaultSystemTemplateInput,
  getProductionSystems,
  promoteCatalogSystemToProductionAsync,
  upsertCatalogSystemAsync
} from "@/service/systems.service";
import type { ProductionSystem } from "@/types/portfolio";
import {
  buildDecoTemplateDraft,
  buildPromoteToProductionPayload,
  CatalogAdminView,
  convertSystemToFormInput,
  createBlankProjectDraft,
  ensureThreeGallerySlots,
  slugifyProjectTitle
} from "@/ui/components/CatalogAdminView";

const REPO_ROOT = path.resolve(__dirname, "..");

function readRepoFile(relPath: string): string {
  return fs.readFileSync(path.join(REPO_ROOT, relPath), "utf8");
}

describe("feat-011 & feat-013: Panel /admin/proyectos en 2 Vistas Separadas, <select> de Sección y Evolución a Producción", () => {
  it("normaliza las 3 ranuras de imágenes de detalle (VIEW 01..03) y construye borradores/moldes para ambas categorías", () => {
    expect(slugifyProjectTitle("Agente RAG Autónomo v2!")).toBe(
      "agente-rag-autonomo-v2"
    );

    const slots = ensureThreeGallerySlots(
      [
        {
          slot: 2,
          src: "/api/assets/vista-02.webp",
          alt: "Vista 02",
          label: "VIEW 02 // CUSTOM",
          caption: "Caption 02"
        }
      ],
      "DECO VINTAGE PLATFORM"
    );

    expect(slots).toHaveLength(3);
    expect(slots[0]?.slot).toBe(1);
    expect(slots[0]?.src).toBe("");
    expect(slots[1]?.slot).toBe(2);
    expect(slots[1]?.src).toBe("/api/assets/vista-02.webp");
    expect(slots[1]?.label).toBe("VIEW 02 // CUSTOM");
    expect(slots[2]?.slot).toBe(3);
    expect(slots[2]?.src).toBe("");

    const aiDraft = createBlankProjectDraft("05", "ai-projects");
    expect(aiDraft.catalogSection).toBe("ai-projects");
    expect(aiDraft.highlightedStackTag).toBe("GOOGLE ADK");
    expect(aiDraft.galleryImages).toHaveLength(3);
    expect(aiDraft.pipelineStages).toHaveLength(3);
    expect(aiDraft.solvedChallenges).toHaveLength(3);

    const template = getDefaultSystemTemplateInput();
    const decoDraft = buildDecoTemplateDraft(template, "06");
    expect(decoDraft.order).toBe("06");
    expect(decoDraft.slug).toBe("deco-vintage-platform-copia");
    expect(decoDraft.title).toContain("MOLDE");
    expect(decoDraft.stackTags).toContain("GOOGLE CLOUD STORAGE");
  });

  it("abre por defecto en Vista 1 ('list') mostrando solo tarjetas, un único botón '+ Crear Nuevo Proyecto' y 'Evolucionar a Producción' sin abrir el formulario", () => {
    const baseSystems = getProductionSystems();
    const sections = getCatalogSectionsConfig();
    const defaultTemplate = getDefaultSystemTemplateInput();

    const baseDeco = baseSystems[0]!;
    const aiProjectFixture: ProductionSystem = {
      ...baseDeco,
      id: "sys-ai-fixture-05",
      order: "05",
      slug: "agente-adk-incubacion",
      title: "AGENTE ADK EN INCUBACIÓN",
      catalogSection: "ai-projects",
      versionBadge: "v0.9.0 IN BUILD"
    };

    const listHtml = renderToStaticMarkup(
      React.createElement(CatalogAdminView, {
        initialSystems: [...baseSystems, aiProjectFixture],
        sections,
        defaultTemplate
      })
    );

    // Header & Active Session Bar
    expect(listHtml).toContain("/admin/proyectos");
    expect(listHtml).not.toContain("ADMIN_ACCESS_KEY");
    expect(listHtml).not.toContain('name="adminAccessKey"');
    expect(listHtml).toContain("SESIÓN ACTIVA · HTTPONLY");
    expect(listHtml).toContain("Cerrar Sesión");

    // Un único botón primario de creación; eliminados los 2 botones viejos
    expect(listHtml).toContain("+ Crear Nuevo Proyecto");
    expect(listHtml).not.toContain("+ Nuevo en Producción");
    expect(listHtml).not.toContain("+ Nuevo Proyecto de IA");
    expect(listHtml).not.toContain("+ Añadir IA");

    // Ambas secciones de tarjetas visibles y botón directo de evolución en proyectos de IA
    expect(listHtml).toContain("PROYECTOS EN PRODUCCIÓN");
    expect(listHtml).toContain("MÁS PROYECTOS DE IA");
    expect(listHtml).toContain("DECO VINTAGE PLATFORM");
    expect(listHtml).toContain("AGENTE ADK EN INCUBACIÓN");
    expect(listHtml).toContain("Evolucionar a Producción");

    // El formulario NO se renderiza en automático al entrar a /admin/proyectos
    expect(listHtml).not.toContain("<form");
    expect(listHtml).not.toContain("BLOQUE A //");
    expect(listHtml).not.toContain('name="coverImageFile"');
  });

  it("renderiza Vista 2 ('form') bajo demanda con '<select name=\"catalogSection\">', cero cajas radio antiguas, 4 bloques y 4 cargadores de imagen", () => {
    const systems = getProductionSystems();
    const sections = getCatalogSectionsConfig();
    const defaultTemplate = getDefaultSystemTemplateInput();

    const firstSystem = systems[0];
    expect(firstSystem).toBeDefined();
    const converted = convertSystemToFormInput(firstSystem!);
    expect(converted.slug).toBe("deco-vintage-platform");
    expect(converted.galleryImages).toHaveLength(3);

    const formHtml = renderToStaticMarkup(
      React.createElement(CatalogAdminView, {
        initialSystems: systems,
        sections,
        defaultTemplate,
        initialViewMode: "form"
      })
    );

    // Controles exclusivos de la Vista 2 (creación de proyecto nuevo)
    expect(formHtml).toContain("← Volver a Proyectos Creados");
    expect(formHtml).toContain("Cargar Molde Base (Deco Vintage)");
    expect(formHtml).not.toContain('id="admin-projects-list-heading"');

    // Selector desplegable <select name="catalogSection"> limpio y eliminación al 100% de las cajas radio
    expect(formHtml).toContain('<select id="project-catalog-section-select" name="catalogSection"');
    expect(formHtml).toContain('<option value="production-systems"');
    expect(formHtml).toContain("Proyectos en Producción");
    expect(formHtml).toContain('<option value="ai-projects"');
    expect(formHtml).toContain("Más Proyectos de IA");
    expect(formHtml).not.toContain('type="radio"');
    expect(formHtml.toUpperCase()).not.toContain(
      "UBICACIÓN DEL PROYECTO EN LA PÁGINA DE INICIO"
    );

    // 4 bloques estructurados del formulario
    expect(formHtml).toContain(
      "BLOQUE A // SECCIÓN DEL CATÁLOGO, TARJETA PRELIMINAR E IMAGEN DE PORTADA"
    );
    expect(formHtml).toContain(
      "BLOQUE B // 3 IMÁGENES EXCLUSIVAS DE LA VISTA DE DETALLE"
    );
    expect(formHtml).toContain("BLOQUE C // NARRATIVA DEL CASO DE ESTUDIO");
    expect(formHtml).toContain("BLOQUE D // BLUEPRINT TÉCNICO");

    // 4 cargadores de archivo independientes (1 portada + 3 detalle)
    expect(formHtml).toContain('name="coverImageFile"');
    expect(formHtml).toContain('name="galleryFileSlot_1"');
    expect(formHtml).toContain('name="galleryFileSlot_2"');
    expect(formHtml).toContain('name="galleryFileSlot_3"');
    expect(formHtml).toContain("RANURA DETALLE // VIEW 01");
    expect(formHtml).toContain("RANURA DETALLE // VIEW 02");
    expect(formHtml).toContain("RANURA DETALLE // VIEW 03");

    // Modo edición sobre un proyecto existente
    const editFormHtml = renderToStaticMarkup(
      React.createElement(CatalogAdminView, {
        initialSystems: systems,
        sections,
        defaultTemplate,
        initialViewMode: "form",
        initialEditingSlug: "deco-vintage-platform"
      })
    );
    expect(editFormHtml).toContain("Editar Proyecto: DECO VINTAGE PLATFORM");
    expect(editFormHtml).toContain("Guardar Cambios y Publicar Proyecto");
  });

  it("ejecuta el ciclo de evolución de 'Más Proyectos de IA' hacia 'Proyectos en Producción' en servicio y API PUT /api/admin/systems", async () => {
    const isolatedRepo = createPostgresCatalogRepository({
      connectionString: "",
      fallbackRepo: createProductionSystemsRepository()
    });

    const createdAi = await upsertCatalogSystemAsync(
      {
        ...createBlankProjectDraft("05", "ai-projects"),
        slug: "orquestador-rag-multimodal",
        title: "ORQUESTADOR RAG MULTIMODAL",
        subtitle: "Agente con Google ADK y pgvector",
        summary: "Sistema de recuperación aumentada listo para pasar a producción."
      },
      isolatedRepo
    );
    expect(createdAi.catalogSection).toBe("ai-projects");
    expect(createdAi.versionBadge).toBe("v0.9.0 IN BUILD");

    // Verificación del payload cliente del botón 'Evolucionar a Producción' sobre PUT /api/admin/systems
    const clientPromotePayload = buildPromoteToProductionPayload(createdAi);
    expect(clientPromotePayload.catalogSection).toBe("production-systems");
    expect(clientPromotePayload.versionBadge).toBe("v0.9.0 PRODUCTION");

    const putReq = new Request("http://localhost:3000/api/admin/systems", {
      method: "PUT",
      headers: {
        "Content-Type": "application/json",
        "x-admin-key": "test-evolve-key"
      },
      body: JSON.stringify(clientPromotePayload)
    });
    const putRes = await handleAdminSystemsPut(putReq, {
      adminAccessKey: "test-evolve-key",
      repo: isolatedRepo
    });
    expect(putRes.status).toBe(200);
    const putBody = (await putRes.json()) as AdminSystemSingleSuccessPayload;
    expect(putBody.ok).toBe(true);
    expect(putBody.system.catalogSection).toBe("production-systems");
    expect(putBody.system.versionBadge).toBe("v0.9.0 PRODUCTION");

    // Verificación directa del servicio de promoción sobre otro proyecto en incubación
    const secondAi = await upsertCatalogSystemAsync(
      {
        ...createBlankProjectDraft("06", "ai-projects"),
        slug: "agente-evaluador-codigo",
        title: "AGENTE EVALUADOR DE CÓDIGO",
        subtitle: "Auditoría One-Shot Zero-Inheritance",
        summary: "Agente verificador determinista."
      },
      isolatedRepo
    );
    const serviceInput = buildPromotedToProductionInput(secondAi);
    expect(serviceInput.catalogSection).toBe("production-systems");

    const promotedViaService = await promoteCatalogSystemToProductionAsync(
      "agente-evaluador-codigo",
      isolatedRepo
    );
    expect(promotedViaService).not.toBeNull();
    expect(promotedViaService?.catalogSection).toBe("production-systems");
    expect(promotedViaService?.versionBadge).toBe("v0.9.0 PRODUCTION");
  });

  it("verifica la página /admin/proyectos (noindex), 0 violaciones de las 6 capas y documentación Home Lab", async () => {
    expect(adminPageMetadata.title).toContain("/admin/proyectos");
    expect(adminPageMetadata.robots).toEqual({
      index: false,
      follow: false
    });

    const pageElement = await CatalogAdminPage();
    expect(pageElement).toBeTruthy();

    const pageSource = readRepoFile("src/app/admin/proyectos/page.tsx");
    const viewSource = readRepoFile("src/ui/components/CatalogAdminView.tsx");
    const serviceSource = readRepoFile("src/service/systems.service.ts");

    for (const src of [pageSource, viewSource]) {
      expect(src).not.toContain("@/config/");
      expect(src).not.toContain("@/repo/");
      expect(src.includes("\r")).toBe(false);
    }
    expect(serviceSource.includes("\r")).toBe(false);
    expect(viewSource.toUpperCase()).not.toContain(
      "UBICACIÓN DEL PROYECTO EN LA PÁGINA DE INICIO"
    );

    const doc = readRepoFile("docs/design-docs/homelab-deployment.md");
    expect(doc).toContain("dekolabs-db");
    expect(doc).toContain("pgvector/pgvector:pg17");
    expect(doc).toContain("/app/data/uploads");
    expect(doc).toContain("ADMIN_ACCESS_KEY");
    expect(doc).toContain("/admin/proyectos");
    expect(doc.includes("\r")).toBe(false);
  });
});
