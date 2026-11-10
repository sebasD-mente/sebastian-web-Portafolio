import fs from "node:fs";
import path from "node:path";
import React from "react";
import { renderToStaticMarkup } from "react-dom/server";
import { describe, expect, it } from "vitest";
import CatalogAdminPage, {
  metadata as adminPageMetadata
} from "@/app/admin/proyectos/page";
import {
  getCatalogSectionsConfig,
  getDefaultSystemTemplateInput,
  getProductionSystems
} from "@/service/systems.service";
import {
  buildDecoTemplateDraft,
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

describe("feat-011: Panel Visual del Administrador de Proyectos (/admin/proyectos) y Guía Home Lab", () => {
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

  it("renderiza CatalogAdminView con los 4 bloques, selector de categoría, 4 cargadores de imagen (1 portada + 3 detalle) y botón de molde", () => {
    const systems = getProductionSystems();
    const sections = getCatalogSectionsConfig();
    const defaultTemplate = getDefaultSystemTemplateInput();

    const firstSystem = systems[0];
    expect(firstSystem).toBeDefined();
    const converted = convertSystemToFormInput(firstSystem!);
    expect(converted.slug).toBe("deco-vintage-platform");
    expect(converted.galleryImages).toHaveLength(3);

    const html = renderToStaticMarkup(
      React.createElement(CatalogAdminView, {
        initialSystems: systems,
        sections,
        defaultTemplate
      })
    );

    // Header & Active Session Bar (sin ADMIN_ACCESS_KEY expuesto en pantalla)
    expect(html).toContain("/admin/proyectos");
    expect(html).not.toContain("ADMIN_ACCESS_KEY");
    expect(html).not.toContain('name="adminAccessKey"');
    expect(html).toContain("SESIÓN ACTIVA · HTTPONLY");
    expect(html).toContain("Cerrar Sesión");
    expect(html).toContain("Cargar Molde Base (Deco Vintage)");

    // Both Categories
    expect(html).toContain("SISTEMAS EN PRODUCCIÓN");
    expect(html).toContain("MÁS PROYECTOS DE IA");

    // 4 Structured Form Blocks
    expect(html).toContain("BLOQUE A // CATEGORÍA EN HOME");
    expect(html).toContain("BLOQUE B // 3 IMÁGENES EXCLUSIVAS DE LA VISTA DE DETALLE");
    expect(html).toContain("BLOQUE C // NARRATIVA DEL CASO DE ESTUDIO");
    expect(html).toContain("BLOQUE D // BLUEPRINT TÉCNICO");

    // 4 Independent Image File Inputs (1 cover + 3 detail slots)
    expect(html).toContain('name="coverImageFile"');
    expect(html).toContain('name="galleryFileSlot_1"');
    expect(html).toContain('name="galleryFileSlot_2"');
    expect(html).toContain('name="galleryFileSlot_3"');
    expect(html).toContain("RANURA DETALLE // VIEW 01");
    expect(html).toContain("RANURA DETALLE // VIEW 02");
    expect(html).toContain("RANURA DETALLE // VIEW 03");
  });

  it("verifica la página /admin/proyectos (noindex) y el cumplimiento estricto de las 6 capas", async () => {
    expect(adminPageMetadata.title).toContain("/admin/proyectos");
    expect(adminPageMetadata.robots).toEqual({
      index: false,
      follow: false
    });

    const pageElement = await CatalogAdminPage();
    expect(pageElement).toBeTruthy();

    const pageSource = readRepoFile("src/app/admin/proyectos/page.tsx");
    const viewSource = readRepoFile("src/ui/components/CatalogAdminView.tsx");

    for (const src of [pageSource, viewSource]) {
      expect(src).not.toContain("@/config/");
      expect(src).not.toContain("@/repo/");
      expect(src.includes("\r")).toBe(false);
    }
  });

  it("documenta en docs/design-docs/homelab-deployment.md la operación de dekolabs-db, /app/data/uploads y /admin/proyectos", () => {
    const doc = readRepoFile("docs/design-docs/homelab-deployment.md");

    expect(doc).toContain("dekolabs-db");
    expect(doc).toContain("pgvector/pgvector:pg17");
    expect(doc).toContain("/app/data/uploads");
    expect(doc).toContain("ADMIN_ACCESS_KEY");
    expect(doc).toContain("/admin/proyectos");
    expect(doc.includes("\r")).toBe(false);
  });
});
