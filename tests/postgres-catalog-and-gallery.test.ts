import fs from "node:fs";
import path from "node:path";
import { describe, expect, it } from "vitest";
import {
  createPostgresCatalogRepository,
  POSTGRES_CATALOG_SCHEMA_SQL
} from "@/repo/postgres-catalog.repo";
import { createProductionSystemsRepository } from "@/repo/systems.repo";
import {
  deleteCatalogSystemBySlugAsync,
  getCatalogSectionsConfig,
  getNormalizedSystemGallery,
  getProductionSystemDeepDiveBySlugAsync,
  getSystemRagDocument,
  listCatalogSystemsAsync,
  splitSystemsByHomeCatalogSection,
  upsertCatalogSystemAsync
} from "@/service/systems.service";

const REPO_ROOT = path.resolve(__dirname, "..");

function readRepoFile(relPath: string): string {
  return fs.readFileSync(path.join(REPO_ROOT, relPath), "utf8");
}

describe("feat-009: Cimiento PostgreSQL (pgvector), Volumen /app/data/uploads, 2 Categorías en Home y Galería de 3 Imágenes en Detalle", () => {
  it("verifica la configuración de PostgreSQL (pgvector/pgvector:pg17) y volumen /app/data/uploads compatible con read_only: true", () => {
    const dockerfile = readRepoFile("Dockerfile");
    const compose = readRepoFile("docker-compose.yml");
    const envExample = readRepoFile(".env.example");

    // Permisos nextjs:nodejs antes de USER nextjs en Dockerfile
    const mkdirIndex = dockerfile.indexOf("mkdir -p /app/data/uploads /app/.next/cache");
    const chownIndex = dockerfile.indexOf("chown -R nextjs:nodejs /app/data /app/.next/cache");
    const userNextjsIndex = dockerfile.indexOf("USER nextjs");
    expect(mkdirIndex).toBeGreaterThan(0);
    expect(chownIndex).toBeGreaterThan(mkdirIndex);
    expect(userNextjsIndex).toBeGreaterThan(chownIndex);

    // Contenedor dekolabs-db con pgvector/pgvector:pg17 y volumen dekolabs_uploads
    expect(compose).toContain("container_name: dekolabs-db");
    expect(compose).toContain("image: pgvector/pgvector:pg17");
    expect(compose).toContain("dekolabs_pgdata:/var/lib/postgresql/data");
    expect(compose).toContain("pg_isready");
    expect(compose).toContain("dekolabs_uploads:/app/data/uploads");
    expect(compose).toContain("/app/.next/cache:mode=1777,size=64m");
    expect(compose).toContain("read_only: true");

    // Variables en .env.example
    expect(envExample).toContain("DATABASE_URL=");
    expect(envExample).toContain("ADMIN_ACCESS_KEY=");
    expect(envExample).toContain('CATALOG_UPLOADS_DIR="/app/data/uploads"');

    // Esquema SQL idempotente con portfolio_systems, rag_knowledge_document y portfolio_system_gallery
    expect(POSTGRES_CATALOG_SCHEMA_SQL).toContain("CREATE TABLE IF NOT EXISTS portfolio_systems");
    expect(POSTGRES_CATALOG_SCHEMA_SQL).toContain("catalog_section TEXT NOT NULL");
    expect(POSTGRES_CATALOG_SCHEMA_SQL).toContain("rag_knowledge_document TEXT NOT NULL");
    expect(POSTGRES_CATALOG_SCHEMA_SQL).toContain("CREATE TABLE IF NOT EXISTS portfolio_system_gallery");
    expect(POSTGRES_CATALOG_SCHEMA_SQL).toContain("ON DELETE CASCADE");
    expect(POSTGRES_CATALOG_SCHEMA_SQL).toContain("CHECK (slot IN (1, 2, 3))");
  });

  it("gestiona las 2 categorías del Home (SISTEMAS EN PRODUCCIÓN y MÁS PROYECTOS DE IA) y CRUD con Capability Seam", async () => {
    const sectionsConfig = getCatalogSectionsConfig();
    expect(sectionsConfig["production-systems"].heading).toBe("SISTEMAS EN PRODUCCIÓN");
    expect(sectionsConfig["production-systems"].anchorId).toBe("proyectos-destacados");
    expect(sectionsConfig["production-systems"].routeHref).toBe("/#proyectos-destacados");
    expect(sectionsConfig["ai-projects"].heading).toBe("MÁS PROYECTOS DE IA");
    expect(sectionsConfig["ai-projects"].anchorId).toBe("mas-proyectos-ia");
    expect(sectionsConfig["ai-projects"].routeHref).toBe("/proyectos-ia");

    const isolatedFallback = createProductionSystemsRepository();
    const isolatedAsyncRepo = createPostgresCatalogRepository({
      connectionString: "",
      fallbackRepo: isolatedFallback
    });

    const initialList = await listCatalogSystemsAsync(isolatedAsyncRepo);
    expect(initialList).toHaveLength(1);
    const initialHomeSplit = splitSystemsByHomeCatalogSection(initialList);
    expect(initialHomeSplit.productionSystems).toHaveLength(1);
    expect(initialHomeSplit.productionSystems[0]?.slug).toBe("deco-vintage-platform");
    expect(initialHomeSplit.aiProjects).toHaveLength(0);

    // Publicar un nuevo proyecto de IA en la sección MÁS PROYECTOS DE IA con sus 3 imágenes de detalle
    const createdAiProject = await upsertCatalogSystemAsync(
      {
        order: "05",
        slug: "adk-rag-autonomous-agent",
        title: "ADK RAG // Agente Autónomo sobre pgvector",
        subtitle: "Orquestación de agentes con Google ADK y recuperación semántica híbrida.",
        catalogSection: "ai-projects",
        categoryLabel: "GOOGLE ADK & PGVECTOR RAG",
        projectHeaderLabel: "PROJECT 05 // GOOGLE ADK & PGVECTOR RAG",
        versionBadge: "v0.9.0 AI BUILD",
        previewImageSrc: "/api/assets/adk-rag-cover.png",
        highlightedStackTag: "GOOGLE ADK",
        featuredOnHome: true,
        summary:
          "Agente conversacional técnico conectado a PostgreSQL 17 + pgvector para responder consultas de arquitectura sobre los sistemas de dekolabs.org.",
        architecturalNarrative:
          "Indexa automáticamente el documento consolidado rag_knowledge_document de cada proyecto y ejecuta búsqueda vectorial con citas verificables.",
        stackTags: ["GOOGLE ADK", "PGVECTOR", "POSTGRESQL 17", "TYPESCRIPT"],
        architectureSpecs: [
          { label: "ARQUITECTURA", value: "Agentic RAG + Vector Search" },
          { label: "DISPONIBILIDAD", value: "Ubuntu Home Lab Docker Node" }
        ],
        deploymentLedger: {
          architecturePattern: "Agentic RAG over pgvector",
          commitSha: "adk0901",
          hostEnvironment: "Ubuntu 24.04 LTS · dekolabs-db",
          verificationGate: "100/100 PASS"
        },
        liveUrl: "https://dekolabs.org/sistemas/adk-rag-autonomous-agent",
        galleryImages: [
          {
            slot: 1,
            src: "/api/assets/adk-view-01.png",
            alt: "Vista 1 del agente ADK",
            label: "VIEW 01 // CONSOLA AGÉNTICA",
            caption: "Flujo de razonamiento del agente Google ADK."
          },
          {
            slot: 2,
            src: "/api/assets/adk-view-02.png",
            alt: "Vista 2 de pgvector",
            label: "VIEW 02 // ÍNDICE VECTORIAL PGVECTOR",
            caption: "Recuperación semántica desde portfolio_systems."
          },
          {
            slot: 3,
            src: "/api/assets/adk-view-03.png",
            alt: "Vista 3 de telemetría",
            label: "VIEW 03 // TRAZABILIDAD DE CITAS",
            caption: "Verificación de respuestas sin alucinaciones."
          }
        ],
        pipelineStages: [
          {
            stageNumber: "ETAPA 01",
            title: "Ingesta de Conocimiento Estructurado",
            latencyOrSlo: "1.8 ms",
            description: "Extrae rag_knowledge_document de cada proyecto.",
            invariants: ["Sincronización transaccional en PostgreSQL."]
          },
          {
            stageNumber: "ETAPA 02",
            title: "Búsqueda Híbrida en pgvector",
            latencyOrSlo: "6.2 ms",
            description: "Recupera fragmentos relevantes con similitud coseno.",
            invariants: ["Cero lecturas fuera del catálogo autorizado."]
          },
          {
            stageNumber: "ETAPA 03",
            title: "Síntesis con Google ADK",
            latencyOrSlo: "Streaming",
            description: "Genera respuesta técnica con referencias exactas.",
            invariants: ["Trazabilidad completa de fuentes."]
          }
        ],
        codeTabs: [
          {
            id: "adk-agent",
            filename: "src/service/rag-agent.service.ts",
            layer: "Service Layer",
            language: "typescript",
            code: "export const RAG_AGENT_READY = true;\n"
          }
        ],
        solvedChallenges: [
          {
            number: "01",
            title: "Sincronización entre Catálogo Web y Base de Conocimiento RAG",
            problem: "Mantener documentos separados producía desfase al editar proyectos.",
            solution: "Generación automática de rag_knowledge_document en cada upsert.",
            impactMetric: "100% de consistencia entre UI y motor RAG."
          },
          {
            number: "02",
            title: "Baja Latencia en Home Lab Auto-Alojado",
            problem: "Evitar dependencias de bases vectoriales externas costosas.",
            solution: "Contenedor pgvector/pgvector:pg17 en la misma red Docker.",
            impactMetric: "Consultas vectoriales en < 10ms locales."
          },
          {
            number: "03",
            title: "Persistencia de Imágenes en Contenedor read_only",
            problem: "El sistema de archivos raíz del contenedor es inmutable.",
            solution: "Volumen dedicado /app/data/uploads servido por /api/assets.",
            impactMetric: "0 errores EROFS/EACCES al subir capturas."
          }
        ]
      },
      isolatedAsyncRepo
    );

    expect(createdAiProject.catalogSection).toBe("ai-projects");
    expect(createdAiProject.galleryImages).toHaveLength(3);
    expect(createdAiProject.galleryImages?.[0]?.src).toBe("/api/assets/adk-view-01.png");
    expect(getSystemRagDocument(createdAiProject)).toContain("MÁS PROYECTOS DE IA");

    const updatedList = await listCatalogSystemsAsync(isolatedAsyncRepo);
    const updatedSplit = splitSystemsByHomeCatalogSection(updatedList);
    expect(updatedSplit.productionSystems).toHaveLength(1);
    expect(updatedSplit.aiProjects).toHaveLength(1);
    expect(updatedSplit.aiProjects[0]?.slug).toBe("adk-rag-autonomous-agent");

    const deepDive = await getProductionSystemDeepDiveBySlugAsync(
      "adk-rag-autonomous-agent",
      isolatedAsyncRepo
    );
    expect(deepDive).not.toBeNull();
    expect(deepDive?.system.galleryImages?.map((g) => g.slot)).toEqual([1, 2, 3]);

    const deleted = await deleteCatalogSystemBySlugAsync(
      "adk-rag-autonomous-agent",
      isolatedAsyncRepo
    );
    expect(deleted).toBe(true);
  });

  it("garantiza 3 slots de galería limpios sin imágenes falsas por defecto y verifica el retiro de los 4 KPIs y consola en SystemDetailView.tsx", () => {
    const defaultGallery = getNormalizedSystemGallery({
      title: "DECO VINTAGE PLATFORM",
      galleryImages: undefined
    });

    expect(defaultGallery).toHaveLength(3);
    expect(defaultGallery.map((item) => item.slot)).toEqual([1, 2, 3]);
    // Prohibido precargar imágenes falsas: src debe estar vacío hasta que Sebastián las suba en producción
    for (const slot of defaultGallery) {
      expect(slot.src).toBe("");
      expect(slot.label).toContain(`VIEW 0${slot.slot}`);
    }

    const homeSectionCode = readRepoFile("src/ui/components/ProductionSystemsSection.tsx");
    expect(homeSectionCode).toContain('id="proyectos-destacados"');
    expect(homeSectionCode).toContain("SISTEMAS EN PRODUCCIÓN");
    expect(homeSectionCode).not.toContain('id="mas-proyectos-ia"');
    expect(homeSectionCode).not.toContain("MÁS PROYECTOS DE IA");

    const aiProjectsViewCode = readRepoFile("src/ui/components/AiProjectsCatalogView.tsx");
    expect(aiProjectsViewCode).toContain("mas-proyectos-ia");
    expect(aiProjectsViewCode).toContain("MÁS PROYECTOS DE IA");

    const detailViewCode = readRepoFile("src/ui/components/SystemDetailView.tsx");
    expect(detailViewCode).toContain("01 // VISTAS DE INTERFAZ Y OPERACIÓN DEL SISTEMA");
    expect(detailViewCode).toContain("VIEW 0");
    // Las 2 secciones señaladas en la captura fueron retiradas por completo
    expect(detailViewCode).not.toContain("CONSOLA DE MANDO Y DIAGNÓSTICO EN TIEMPO REAL");
    expect(detailViewCode).not.toContain("Trazabilidad Operativa y Telemetría de Ejecución");
    expect(detailViewCode).not.toContain("Indicadores clave de rendimiento del sistema");
  });
});
