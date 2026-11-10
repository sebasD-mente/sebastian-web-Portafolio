import fs from "node:fs";
import os from "node:os";
import path from "node:path";
import { afterEach, beforeEach, describe, expect, it } from "vitest";
import { createPostgresCatalogRepository } from "@/repo/postgres-catalog.repo";
import { createProductionSystemsRepository } from "@/repo/systems.repo";
import {
  type AdminCatalogErrorPayload,
  type AdminCatalogHandlerOptions,
  type AdminSystemDeleteSuccessPayload,
  type AdminSystemSingleSuccessPayload,
  type AdminSystemsListSuccessPayload,
  type AdminUploadSuccessPayload,
  handleAdminSystemsDelete,
  handleAdminSystemsGet,
  handleAdminSystemsPost,
  handleAdminSystemsPut,
  handleAdminUploadPost,
  handleAssetGet
} from "@/runtime/admin-catalog.handler";
import { splitSystemsByHomeCatalogSection } from "@/service/systems.service";

const TEST_ADMIN_KEY = "test-admin-secret-key-2026";

describe("Admin Catalog Backend APIs & Read-Only-Safe Asset Uploads (feat-010)", () => {
  let tempUploadsDir: string;
  let handlerOptions: AdminCatalogHandlerOptions;

  beforeEach(() => {
    tempUploadsDir = fs.mkdtempSync(
      path.join(os.tmpdir(), "dekolabs-uploads-test-")
    );
    const isolatedFallback = createProductionSystemsRepository();
    const isolatedRepo = createPostgresCatalogRepository({
      connectionString: "",
      fallbackRepo: isolatedFallback
    });

    handlerOptions = {
      adminAccessKey: TEST_ADMIN_KEY,
      uploadsDir: tempUploadsDir,
      repo: isolatedRepo
    };
  });

  afterEach(() => {
    if (tempUploadsDir && fs.existsSync(tempUploadsDir)) {
      fs.rmSync(tempUploadsDir, { recursive: true, force: true });
    }
  });

  it("enforces Fail-Closed ADMIN_ACCESS_KEY authentication on /api/admin/systems and /api/admin/upload", async () => {
    const noAuthReq = new Request("http://localhost:3000/api/admin/systems", {
      method: "GET"
    });
    const noAuthRes = await handleAdminSystemsGet(noAuthReq, handlerOptions);
    expect(noAuthRes.status).toBe(401);
    const noAuthBody = (await noAuthRes.json()) as AdminCatalogErrorPayload;
    expect(noAuthBody.ok).toBe(false);
    expect(noAuthBody.runtimeLog.level).toBe("warn");

    const wrongKeyReq = new Request("http://localhost:3000/api/admin/systems", {
      method: "GET",
      headers: {
        "x-admin-key": "wrong-key"
      }
    });
    const wrongKeyRes = await handleAdminSystemsGet(wrongKeyReq, handlerOptions);
    expect(wrongKeyRes.status).toBe(401);

    const validBearerReq = new Request(
      "http://localhost:3000/api/admin/systems",
      {
        method: "GET",
        headers: {
          Authorization: `Bearer ${TEST_ADMIN_KEY}`
        }
      }
    );
    const validRes = await handleAdminSystemsGet(validBearerReq, handlerOptions);
    expect(validRes.status).toBe(200);
    const validBody = (await validRes.json()) as AdminSystemsListSuccessPayload;
    expect(validBody.ok).toBe(true);
    expect(validBody.systems.length).toBeGreaterThanOrEqual(4);
    expect(validBody.sections["production-systems"].heading).toBe(
      "SISTEMAS EN PRODUCCIÓN"
    );
    expect(validBody.sections["ai-projects"].heading).toBe(
      "MÁS PROYECTOS DE IA"
    );
  });

  it("supports full CRUD across both categories (SISTEMAS EN PRODUCCIÓN & MÁS PROYECTOS DE IA) and updates the 3 detail gallery images", async () => {
    // 1. Create a new project in MÁS PROYECTOS DE IA ("ai-projects")
    const createPayload = {
      order: "05",
      slug: "agente-rag-enterprise",
      title: "AGENTE RAG ENTERPRISE",
      subtitle: "Orquestación Multi-Agente con Google ADK y pgvector",
      catalogSection: "ai-projects",
      categoryLabel: "AGENTIC AI & RAG",
      versionBadge: "v0.9.0 IN BUILD",
      previewImageSrc: "/api/assets/agente-rag-card.png",
      highlightedStackTag: "GOOGLE ADK",
      featuredOnHome: true,
      summary:
        "Agente autónomo con recuperación semántica sobre PostgreSQL pgvector y validación determinista.",
      architecturalNarrative:
        "Diseñado en 6 capas con separación estricta entre ingesta vectorial y síntesis generativa.",
      stackTags: ["GOOGLE ADK", "POSTGRESQL + PGVECTOR", "NEXT.JS 15", "TYPESCRIPT"],
      liveUrl: "https://dekolabs.org/rag-agent",
      galleryImages: [
        {
          slot: 1,
          src: "/api/assets/rag-view-01.png",
          label: "VIEW 01 // CONSOLA AGÉNTICA",
          caption: "Vista principal del orquestador de agentes."
        },
        {
          slot: 2,
          src: "/api/assets/rag-view-02.png",
          label: "VIEW 02 // ÍNDICE VECTORIAL HNSW",
          caption: "Inspección de embeddings en PostgreSQL 17."
        },
        {
          slot: 3,
          src: "/api/assets/rag-view-03.png",
          label: "VIEW 03 // TRAZABILIDAD RUNTIME",
          caption: "Auditoría de llamadas a herramientas MCP."
        }
      ]
    };

    const postReq = new Request("http://localhost:3000/api/admin/systems", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "x-admin-key": TEST_ADMIN_KEY
      },
      body: JSON.stringify(createPayload)
    });
    const postRes = await handleAdminSystemsPost(postReq, handlerOptions);
    expect(postRes.status).toBe(201);
    const postBody = (await postRes.json()) as AdminSystemSingleSuccessPayload;
    expect(postBody.ok).toBe(true);
    expect(postBody.system.slug).toBe("agente-rag-enterprise");
    expect(postBody.system.catalogSection).toBe("ai-projects");
    expect(postBody.system.galleryImages).toHaveLength(3);
    expect(postBody.system.galleryImages?.[0]?.src).toBe(
      "/api/assets/rag-view-01.png"
    );

    // 2. Update Deco Vintage Platform (PUT) to attach its 3 exclusive detail gallery images
    const getDecoReq = new Request(
      "http://localhost:3000/api/admin/systems?slug=deco-vintage-platform",
      {
        method: "GET",
        headers: { "x-admin-key": TEST_ADMIN_KEY }
      }
    );
    const getDecoRes = await handleAdminSystemsGet(getDecoReq, handlerOptions);
    expect(getDecoRes.status).toBe(200);
    const decoCurrent = ((await getDecoRes.json()) as AdminSystemSingleSuccessPayload)
      .system;

    const putReq = new Request("http://localhost:3000/api/admin/systems", {
      method: "PUT",
      headers: {
        "Content-Type": "application/json",
        "x-admin-key": TEST_ADMIN_KEY
      },
      body: JSON.stringify({
        ...decoCurrent,
        catalogSection: "production-systems",
        galleryImages: [
          {
            slot: 1,
            src: "/api/assets/deco-detail-1.webp",
            label: "VIEW 01 // CATÁLOGO CURADO +540 OBRAS",
            caption: "Paginación por cursores e hidratación progresiva."
          },
          {
            slot: 2,
            src: "/api/assets/deco-detail-2.webp",
            label: "VIEW 02 // COTIZADOR DINÁMICO A MEDIDA",
            caption: "Motor autoritativo de cálculo dimensional."
          },
          {
            slot: 3,
            src: "/api/assets/deco-detail-3.webp",
            label: "VIEW 03 // PIPELINE MULTIMEDIA SHARP",
            caption: "Transcodificación WebP en memoria con libvips."
          }
        ]
      })
    });
    const putRes = await handleAdminSystemsPut(putReq, handlerOptions);
    expect(putRes.status).toBe(200);
    const putBody = (await putRes.json()) as AdminSystemSingleSuccessPayload;
    expect(putBody.system.galleryImages?.[2]?.src).toBe(
      "/api/assets/deco-detail-3.webp"
    );
    expect(putBody.system.previewImageSrc).toBe(
      "/assets/deco-vintage-preview.png"
    );

    // 3. Verify both Home sections have their respective projects
    const listReq = new Request("http://localhost:3000/api/admin/systems", {
      method: "GET",
      headers: { "x-admin-key": TEST_ADMIN_KEY }
    });
    const listBody = (await (
      await handleAdminSystemsGet(listReq, handlerOptions)
    ).json()) as AdminSystemsListSuccessPayload;
    const split = splitSystemsByHomeCatalogSection(listBody.systems);
    expect(
      split.productionSystems.some((s) => s.slug === "deco-vintage-platform")
    ).toBe(true);
    expect(
      split.aiProjects.some((s) => s.slug === "agente-rag-enterprise")
    ).toBe(true);

    // 4. Delete the newly created AI project
    const delReq = new Request(
      "http://localhost:3000/api/admin/systems?slug=agente-rag-enterprise",
      {
        method: "DELETE",
        headers: { "x-admin-key": TEST_ADMIN_KEY }
      }
    );
    const delRes = await handleAdminSystemsDelete(delReq, handlerOptions);
    expect(delRes.status).toBe(200);
    const delBody = (await delRes.json()) as AdminSystemDeleteSuccessPayload;
    expect(delBody.deletedSlug).toBe("agente-rag-enterprise");
  });

  it("uploads images into CATALOG_UPLOADS_DIR (/app/data/uploads equivalent) and serves them via /api/assets/[filename]", async () => {
    // 1x1 transparent PNG bytes
    const pngBytes = Buffer.from(
      "iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAYAAAAfFcSJAAAADUlEQVR42mNk+M9QDwADhgGAWjR9awAAAABJRU5ErkJggg==",
      "base64"
    );

    const formData = new FormData();
    const file = new File([pngBytes], "Captura Vista Detalle 01.png", {
      type: "image/png"
    });
    formData.append("file", file);

    const uploadReq = new Request("http://localhost:3000/api/admin/upload", {
      method: "POST",
      headers: {
        "x-admin-key": TEST_ADMIN_KEY
      },
      body: formData
    });

    const uploadRes = await handleAdminUploadPost(uploadReq, handlerOptions);
    expect(uploadRes.status).toBe(201);
    const uploadBody = (await uploadRes.json()) as AdminUploadSuccessPayload;
    expect(uploadBody.ok).toBe(true);
    expect(uploadBody.asset.url).toMatch(
      /^\/api\/assets\/captura-vista-detalle-01-[a-z0-9-]+\.png$/
    );
    expect(uploadBody.asset.mimeType).toBe("image/png");
    expect(uploadBody.asset.sizeBytes).toBe(pngBytes.byteLength);

    // Verify physical file exists in tempUploadsDir
    const savedFilePath = path.join(tempUploadsDir, uploadBody.asset.filename);
    expect(fs.existsSync(savedFilePath)).toBe(true);

    // Fetch image via handleAssetGet (/api/assets/[filename])
    const assetGetReq = new Request(
      `http://localhost:3000${uploadBody.asset.url}`,
      { method: "GET" }
    );
    const assetGetRes = await handleAssetGet(
      assetGetReq,
      uploadBody.asset.filename,
      handlerOptions
    );
    expect(assetGetRes.status).toBe(200);
    expect(assetGetRes.headers.get("Content-Type")).toBe("image/png");
    expect(assetGetRes.headers.get("Cache-Control")).toContain("immutable");
    const servedBytes = Buffer.from(await assetGetRes.arrayBuffer());
    expect(servedBytes.equals(pngBytes)).toBe(true);
  });

  it("blocks unsupported MIME types on upload and blocks path traversal attempts on /api/assets/[filename]", async () => {
    const badFormData = new FormData();
    badFormData.append(
      "file",
      new File([Buffer.from("not an image")], "malicious.svg", {
        type: "image/svg+xml"
      })
    );

    const badUploadReq = new Request("http://localhost:3000/api/admin/upload", {
      method: "POST",
      headers: { "x-admin-key": TEST_ADMIN_KEY },
      body: badFormData
    });
    const badUploadRes = await handleAdminUploadPost(
      badUploadReq,
      handlerOptions
    );
    expect(badUploadRes.status).toBe(415);

    for (const traversalAttempt of [
      "../package.json",
      "..\\Dockerfile",
      "%2e%2e%2fpackage.json",
      "nested/path/image.png"
    ]) {
      const req = new Request(
        `http://localhost:3000/api/assets/${traversalAttempt}`,
        { method: "GET" }
      );
      const res = await handleAssetGet(req, traversalAttempt, handlerOptions);
      expect(res.status).toBe(400);
    }
  });
});
