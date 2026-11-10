import {
  CATALOG_SECTIONS_CONFIG,
  DEFAULT_CATALOG_UPLOADS_DIR
} from "@/config/site.config";
import { defaultPostgresCatalogRepository } from "@/repo/postgres-catalog.repo";
import {
  buildRagKnowledgeDocument,
  defaultProductionSystemsRepository,
  normalizeSystemGalleryImages
} from "@/repo/systems.repo";
import type {
  AsyncCatalogRepository,
  CatalogSectionDescriptor,
  CatalogSectionId,
  CodeSnippetTab,
  HeroTelemetryCardData,
  HeroTelemetrySeriesPoint,
  IndustrialBenchmarkKpi,
  PipelineStage,
  ProductionSystem,
  ProductionSystemCategory,
  ProductionSystemLayoutVariant,
  ProductionSystemsProvider,
  ProductionSystemUpsertInput,
  SolvedChallenge,
  SystemArchitectureSpec,
  SystemDeepDiveNavigationLink,
  SystemDeepDiveSnapshot,
  SystemDeploymentLedger,
  SystemGalleryImage,
  SystemsCatalogSnapshot
} from "@/types/portfolio";

export interface SparklineSvgGeometry {
  polylinePoints: string;
  areaPath: string;
  minLatencyMs: number;
  maxLatencyMs: number;
  avgLatencyMs: number;
}

export function getHeroTelemetryCardData(
  repo: ProductionSystemsProvider = defaultProductionSystemsRepository
): HeroTelemetryCardData {
  return repo.getHeroTelemetryCard();
}

export function getIndustrialBenchmarks(
  repo: ProductionSystemsProvider = defaultProductionSystemsRepository
): IndustrialBenchmarkKpi[] {
  return repo.getIndustrialBenchmarks();
}

export function getProductionSystems(
  repo: ProductionSystemsProvider = defaultProductionSystemsRepository
): ProductionSystem[] {
  return repo
    .getAllProductionSystems()
    .sort((a, b) => a.order.localeCompare(b.order));
}

export function getProductionSystemBySlug(
  slug: string,
  repo: ProductionSystemsProvider = defaultProductionSystemsRepository
): ProductionSystem | null {
  if (!slug || typeof slug !== "string") {
    return null;
  }
  return repo.getProductionSystemBySlug(slug);
}

export function getAllProductionSystemSlugs(
  repo: ProductionSystemsProvider = defaultProductionSystemsRepository
): { slug: string }[] {
  return getProductionSystems(repo).map((system) => ({
    slug: system.slug
  }));
}

function toNavigationLink(
  system: ProductionSystem
): SystemDeepDiveNavigationLink {
  return {
    order: system.order,
    slug: system.slug,
    title: system.title,
    categoryLabel: system.categoryLabel,
    detailHref: system.detailHref
  };
}

export function getProductionSystemDeepDiveBySlug(
  slug: string,
  repo: ProductionSystemsProvider = defaultProductionSystemsRepository
): SystemDeepDiveSnapshot | null {
  const normalizedSlug = typeof slug === "string" ? slug.trim() : "";
  if (!normalizedSlug) {
    return null;
  }

  const orderedSystems = getProductionSystems(repo);
  const currentIndex = orderedSystems.findIndex(
    (item) => item.slug === normalizedSlug
  );
  if (currentIndex === -1 || orderedSystems.length === 0) {
    return null;
  }

  const system = orderedSystems[currentIndex];
  if (!system) {
    return null;
  }

  const prevIndex =
    (currentIndex - 1 + orderedSystems.length) % orderedSystems.length;
  const nextIndex = (currentIndex + 1) % orderedSystems.length;

  const previousCandidate = orderedSystems[prevIndex] ?? system;
  const nextCandidate = orderedSystems[nextIndex] ?? system;

  return {
    system,
    previousSystem: toNavigationLink(previousCandidate),
    nextSystem: toNavigationLink(nextCandidate),
    relatedSystems: orderedSystems
      .filter((candidate) => candidate.slug !== system.slug)
      .map(toNavigationLink)
  };
}

export function filterProductionSystemsByCategory(
  category: ProductionSystemCategory | "all",
  repo: ProductionSystemsProvider = defaultProductionSystemsRepository
): ProductionSystem[] {
  const all = getProductionSystems(repo);
  if (category === "all") {
    return all;
  }
  return all.filter((system) => system.category === category);
}

export function getSystemsCatalogSnapshot(
  repo: ProductionSystemsProvider = defaultProductionSystemsRepository
): SystemsCatalogSnapshot {
  const systems = getProductionSystems(repo);
  const primarySystems = systems.filter(
    (system) =>
      system.layoutVariant === "primary-7-5" ||
      system.layoutVariant === "primary-5-7"
  );
  const secondarySystems = systems.filter(
    (system) => system.layoutVariant === "secondary-split"
  );

  return {
    heroTelemetry: repo.getHeroTelemetryCard(),
    benchmarks: repo.getIndustrialBenchmarks(),
    systems,
    primarySystems,
    secondarySystems,
    productionSectionSystems: systems.filter(
      (s) =>
        (s.catalogSection ?? "production-systems") === "production-systems" &&
        s.featuredOnHome === true
    ),
    aiProjectsSectionSystems: systems.filter(
      (s) => s.catalogSection === "ai-projects" && s.featuredOnHome === true
    )
  };
}

export function getCatalogSectionsConfig(): Record<
  CatalogSectionId,
  CatalogSectionDescriptor
> {
  return {
    "production-systems": { ...CATALOG_SECTIONS_CONFIG["production-systems"] },
    "ai-projects": { ...CATALOG_SECTIONS_CONFIG["ai-projects"] }
  };
}

export function getNormalizedSystemGallery(
  system: Pick<ProductionSystem, "title" | "galleryImages">
): SystemGalleryImage[] {
  return normalizeSystemGalleryImages(system.galleryImages, system.title);
}

export function getSystemRagDocument(system: ProductionSystem): string {
  return buildRagKnowledgeDocument(system);
}

export function splitSystemsByHomeCatalogSection(
  systems: readonly ProductionSystem[]
): {
  productionSystems: ProductionSystem[];
  aiProjects: ProductionSystem[];
} {
  const ordered = [...systems].sort((a, b) => a.order.localeCompare(b.order));
  const productionFeatured = ordered.filter(
    (s) =>
      (s.catalogSection ?? "production-systems") === "production-systems" &&
      s.featuredOnHome === true
  );
  const allProduction = ordered.filter(
    (s) => (s.catalogSection ?? "production-systems") === "production-systems"
  );

  const aiFeatured = ordered.filter(
    (s) => s.catalogSection === "ai-projects" && s.featuredOnHome === true
  );

  return {
    productionSystems:
      productionFeatured.length > 0
        ? productionFeatured
        : allProduction.slice(0, 1),
    aiProjects: aiFeatured
  };
}

export async function listCatalogSystemsAsync(
  asyncRepo: AsyncCatalogRepository = defaultPostgresCatalogRepository
): Promise<ProductionSystem[]> {
  const systems = await asyncRepo.listSystems();
  return [...systems].sort((a, b) => a.order.localeCompare(b.order));
}

export async function getProductionSystemDeepDiveBySlugAsync(
  slug: string,
  asyncRepo: AsyncCatalogRepository = defaultPostgresCatalogRepository
): Promise<SystemDeepDiveSnapshot | null> {
  const normalizedSlug = typeof slug === "string" ? slug.trim().toLowerCase() : "";
  if (!normalizedSlug) {
    return null;
  }

  const orderedSystems = await listCatalogSystemsAsync(asyncRepo);
  const currentIndex = orderedSystems.findIndex(
    (item) => item.slug.toLowerCase() === normalizedSlug
  );
  if (currentIndex === -1 || orderedSystems.length === 0) {
    return null;
  }

  const system = orderedSystems[currentIndex];
  if (!system) {
    return null;
  }

  const prevIndex =
    (currentIndex - 1 + orderedSystems.length) % orderedSystems.length;
  const nextIndex = (currentIndex + 1) % orderedSystems.length;

  const previousCandidate = orderedSystems[prevIndex] ?? system;
  const nextCandidate = orderedSystems[nextIndex] ?? system;

  return {
    system: {
      ...system,
      galleryImages: normalizeSystemGalleryImages(
        system.galleryImages,
        system.title
      )
    },
    previousSystem: toNavigationLink(previousCandidate),
    nextSystem: toNavigationLink(nextCandidate),
    relatedSystems: orderedSystems
      .filter((candidate) => candidate.slug !== system.slug)
      .map(toNavigationLink)
  };
}

export async function getCatalogSystemBySlugAsync(
  slug: string,
  asyncRepo: AsyncCatalogRepository = defaultPostgresCatalogRepository
): Promise<ProductionSystem | null> {
  const normalizedSlug = typeof slug === "string" ? slug.trim().toLowerCase() : "";
  if (!normalizedSlug) {
    return null;
  }
  return asyncRepo.getSystemBySlug(normalizedSlug);
}

export async function upsertCatalogSystemAsync(
  input: ProductionSystemUpsertInput,
  asyncRepo: AsyncCatalogRepository = defaultPostgresCatalogRepository
): Promise<ProductionSystem> {
  return asyncRepo.upsertSystem(input);
}

export async function deleteCatalogSystemBySlugAsync(
  slug: string,
  asyncRepo: AsyncCatalogRepository = defaultPostgresCatalogRepository
): Promise<boolean> {
  return asyncRepo.deleteSystemBySlug(slug);
}

export function getDefaultCatalogUploadsDir(overrideDir?: string): string {
  if (typeof overrideDir === "string" && overrideDir.trim().length > 0) {
    return overrideDir.trim();
  }
  const envDir = process.env.CATALOG_UPLOADS_DIR?.trim();
  return envDir && envDir.length > 0 ? envDir : DEFAULT_CATALOG_UPLOADS_DIR;
}

export function getDefaultSystemTemplateInput(
  repo: ProductionSystemsProvider = defaultProductionSystemsRepository
): ProductionSystemUpsertInput {
  const base =
    repo.getProductionSystemBySlug("deco-vintage-platform") ??
    repo.getAllProductionSystems()[0];

  if (!base) {
    return {
      order: "02",
      slug: "nuevo-proyecto-ia",
      title: "NUEVO SISTEMA EN PRODUCCIÓN",
      subtitle: "Arquitectura Cloud-Native & IA",
      catalogSection: "production-systems",
      category: "distributed-systems",
      categoryLabel: "AI & CLOUD ARCHITECTURE",
      projectHeaderLabel: "PROJECT 02 // AI & CLOUD ARCHITECTURE",
      versionBadge: "v1.0.0 PRODUCTION",
      previewImageSrc: "/assets/deco-vintage-preview.png",
      previewImageAlt: "Vista preliminar del proyecto",
      highlightedStackTag: "GOOGLE ADK",
      featuredOnHome: true,
      layoutVariant: "primary-7-5",
      status: "PRODUCTION // ONLINE",
      liveMetricPill: "v1.0.0 · 100/100 PASS",
      summary:
        "Descripción ejecutiva del sistema, stack tecnológico y capacidades operativas en producción.",
      architecturalNarrative:
        "Narrativa arquitectónica detallada del sistema y sus invariantes operativas.",
      stackTags: ["NEXT.JS 15", "TYPESCRIPT", "POSTGRESQL + PGVECTOR", "GOOGLE ADK"],
      architectureSpecs: [
        { label: "ARQUITECTURA", value: "Stateless Cloud-Native" },
        { label: "DISPONIBILIDAD", value: "99.9% SLA Activo" }
      ],
      deploymentLedger: {
        architecturePattern: "6-Layer Clean Architecture",
        commitSha: "v1.0.0",
        hostEnvironment: "Ubuntu 24.04 LTS · Docker",
        verificationGate: "100/100 PASS"
      },
      liveUrl: "https://dekolabs.org",
      galleryImages: normalizeSystemGalleryImages([], "NUEVO SISTEMA EN PRODUCCIÓN"),
      pipelineStages: [
        {
          stageNumber: "ETAPA 01",
          title: "INGESTA Y VALIDACIÓN",
          latencyOrSlo: "p95 < 15ms",
          description: "Validación determinista de contratos de entrada.",
          invariants: ["Zero-Trust Input", "Strict Schema"]
        },
        {
          stageNumber: "ETAPA 02",
          title: "PROCESAMIENTO PRINCIPAL",
          latencyOrSlo: "p95 < 45ms",
          description: "Orquestación de lógica de dominio y persistencia transaccional.",
          invariants: ["ACID Transactions", "Idempotency"]
        },
        {
          stageNumber: "ETAPA 03",
          title: "ENTREGA Y OBSERVABILIDAD",
          latencyOrSlo: "SLO 99.9%",
          description: "Emisión de respuesta con telemetría estructurada RuntimeLogEntry.",
          invariants: ["Correlation ID", "Secret Redaction"]
        }
      ],
      codeTabs: [
        {
          id: "core-service",
          filename: "src/service/system.service.ts",
          layer: "Layer 4 · Service",
          language: "typescript",
          code: "export async function executeSystemPipeline() {\n  return { ok: true };\n}"
        }
      ],
      solvedChallenges: [
        {
          number: "01",
          title: "Aislamiento de Capas",
          problem: "Acoplamiento entre interfaz y almacenamiento.",
          solution: "Separación estricta en 6 capas con Capability Seams.",
          impactMetric: "0 violaciones arquitectónicas"
        },
        {
          number: "02",
          title: "Persistencia Resiliente",
          problem: "Pérdida de estado en contenedores efímeros.",
          solution: "Volúmenes dedicados y transacciones PostgreSQL.",
          impactMetric: "100% durabilidad"
        },
        {
          number: "03",
          title: "Observabilidad en Producción",
          problem: "Trazabilidad incompleta en fallos de red.",
          solution: "Logs estructurados con correlationId y redacción de secretos.",
          impactMetric: "MTTR < 2 min"
        }
      ]
    };
  }

  return {
    order: base.order,
    slug: base.slug,
    title: base.title,
    subtitle: base.subtitle,
    catalogSection: base.catalogSection ?? "production-systems",
    category: base.category,
    categoryLabel: base.categoryLabel,
    projectHeaderLabel: base.projectHeaderLabel,
    versionBadge: base.versionBadge,
    previewImageSrc: base.previewImageSrc,
    previewImageAlt: base.previewImageAlt,
    highlightedStackTag: base.highlightedStackTag,
    featuredOnHome: base.featuredOnHome ?? true,
    layoutVariant: base.layoutVariant,
    status: base.status,
    liveMetricPill: base.liveMetricPill,
    summary: base.summary,
    architecturalNarrative: base.architecturalNarrative,
    stackTags: [...base.stackTags],
    metrics: base.metrics.map((m) => ({ ...m })),
    architectureSpecs: base.architectureSpecs.map((s) => ({ ...s })),
    deploymentLedger: { ...base.deploymentLedger },
    terminalPreviewLines: [...base.terminalPreviewLines],
    liveUrl: base.liveUrl,
    detailHref: base.detailHref,
    galleryImages: normalizeSystemGalleryImages(base.galleryImages, base.title),
    pipelineStages: base.pipelineStages.map((st) => ({
      ...st,
      invariants: [...st.invariants]
    })),
    codeTabs: base.codeTabs.map((t) => ({ ...t })),
    solvedChallenges: base.solvedChallenges.map((c) => ({ ...c })),
    ragKnowledgeDocument: base.ragKnowledgeDocument
  };
}

export interface CatalogSystemValidationResult {
  valid: boolean;
  input: ProductionSystemUpsertInput | null;
  errors: Record<string, string>;
}

function toCleanString(value: unknown): string {
  return typeof value === "string" ? value.trim() : "";
}

function slugifyString(raw: string): string {
  return raw
    .trim()
    .toLowerCase()
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .replace(/[^a-z0-9-]+/g, "-")
    .replace(/-+/g, "-")
    .replace(/^-+|-+$/g, "");
}

export function validateCatalogSystemUpsertPayload(
  raw: unknown
): CatalogSystemValidationResult {
  const errors: Record<string, string> = {};
  if (!raw || typeof raw !== "object" || Array.isArray(raw)) {
    return {
      valid: false,
      input: null,
      errors: {
        payload: "El cuerpo de la solicitud debe ser un objeto JSON válido."
      }
    };
  }

  const body = raw as Record<string, unknown>;
  const template = getDefaultSystemTemplateInput();

  const title = toCleanString(body.title);
  if (!title) {
    errors.title = "El título del proyecto (title) es obligatorio.";
  }

  const rawSlug = toCleanString(body.slug) || slugifyString(title);
  const slug = slugifyString(rawSlug);
  if (!slug) {
    errors.slug =
      "El identificador URL (slug) es obligatorio y solo debe contener letras, números y guiones.";
  }

  const subtitle = toCleanString(body.subtitle);
  if (!subtitle) {
    errors.subtitle = "El subtítulo técnico (subtitle) es obligatorio.";
  }

  const rawCatalogSection = toCleanString(body.catalogSection);
  const catalogSection: CatalogSectionId =
    rawCatalogSection === "ai-projects"
      ? "ai-projects"
      : rawCatalogSection === "production-systems" || !rawCatalogSection
        ? "production-systems"
        : ("invalid" as CatalogSectionId);

  if (
    catalogSection !== "production-systems" &&
    catalogSection !== "ai-projects"
  ) {
    errors.catalogSection =
      "La categoría (catalogSection) debe ser 'production-systems' o 'ai-projects'.";
  }

  const categoryLabel = toCleanString(body.categoryLabel);
  if (!categoryLabel) {
    errors.categoryLabel = "La etiqueta de categoría (categoryLabel) es obligatoria.";
  }

  const summary = toCleanString(body.summary);
  if (!summary) {
    errors.summary = "El resumen de tarjeta (summary) es obligatorio.";
  }

  const architecturalNarrative =
    toCleanString(body.architecturalNarrative) || summary;

  const liveUrl = toCleanString(body.liveUrl);
  if (!liveUrl) {
    errors.liveUrl = "La URL del sistema en vivo (liveUrl) es obligatoria.";
  }

  let stackTags: string[] = [];
  if (Array.isArray(body.stackTags)) {
    stackTags = body.stackTags
      .map((item) => toCleanString(item))
      .filter((item) => item.length > 0);
  } else if (typeof body.stackTags === "string") {
    stackTags = body.stackTags
      .split(",")
      .map((item) => item.trim())
      .filter((item) => item.length > 0);
  }
  if (stackTags.length === 0) {
    errors.stackTags = "Debes incluir al menos un tag de stack tecnológico.";
  }

  const order = toCleanString(body.order) || "01";
  const id = toCleanString(body.id) || undefined;
  const projectHeaderLabel =
    toCleanString(body.projectHeaderLabel) ||
    `PROJECT ${order} // ${categoryLabel.toUpperCase()}`;
  const versionBadge =
    toCleanString(body.versionBadge) ||
    (catalogSection === "ai-projects" ? "v1.0.0 AI BUILD" : "v1.0.0 PRODUCTION");
  const previewImageSrc =
    toCleanString(body.previewImageSrc) || "/assets/deco-vintage-preview.png";
  const previewImageAlt =
    toCleanString(body.previewImageAlt) || `Vista preliminar de ${title || slug}`;
  const highlightedStackTag =
    toCleanString(body.highlightedStackTag) || stackTags[0] || "TYPESCRIPT";
  const featuredOnHome =
    typeof body.featuredOnHome === "boolean" ? body.featuredOnHome : true;

  const rawCategory = toCleanString(body.category);
  const validCategories: ProductionSystemCategory[] = [
    "distributed-systems",
    "ai-agents",
    "data-pipelines",
    "cloud-infrastructure"
  ];
  const category: ProductionSystemCategory = validCategories.includes(
    rawCategory as ProductionSystemCategory
  )
    ? (rawCategory as ProductionSystemCategory)
    : catalogSection === "ai-projects"
      ? "ai-agents"
      : "distributed-systems";

  const rawLayout = toCleanString(body.layoutVariant);
  const validLayouts: ProductionSystemLayoutVariant[] = [
    "primary-7-5",
    "primary-5-7",
    "secondary-split"
  ];
  const layoutVariant: ProductionSystemLayoutVariant = validLayouts.includes(
    rawLayout as ProductionSystemLayoutVariant
  )
    ? (rawLayout as ProductionSystemLayoutVariant)
    : "primary-7-5";

  const rawStatus = toCleanString(body.status);
  const validStatuses: Array<ProductionSystem["status"]> = [
    "PRODUCTION // ONLINE",
    "PRODUCTION // VERIFIED",
    "ACTIVE // EDGE NODE"
  ];
  const status: ProductionSystem["status"] = validStatuses.includes(
    rawStatus as ProductionSystem["status"]
  )
    ? (rawStatus as ProductionSystem["status"])
    : "PRODUCTION // ONLINE";

  let architectureSpecs: SystemArchitectureSpec[] = [];
  if (Array.isArray(body.architectureSpecs)) {
    architectureSpecs = body.architectureSpecs
      .filter((item) => item && typeof item === "object")
      .map((item) => {
        const rec = item as Record<string, unknown>;
        return {
          label: toCleanString(rec.label),
          value: toCleanString(rec.value)
        };
      })
      .filter((spec) => spec.label.length > 0 && spec.value.length > 0);
  }
  if (architectureSpecs.length === 0) {
    architectureSpecs = template.architectureSpecs;
  }

  const rawLedger =
    body.deploymentLedger && typeof body.deploymentLedger === "object"
      ? (body.deploymentLedger as Record<string, unknown>)
      : {};
  const deploymentLedger: SystemDeploymentLedger = {
    architecturePattern:
      toCleanString(rawLedger.architecturePattern) ||
      template.deploymentLedger.architecturePattern,
    commitSha:
      toCleanString(rawLedger.commitSha) || template.deploymentLedger.commitSha,
    hostEnvironment:
      toCleanString(rawLedger.hostEnvironment) ||
      template.deploymentLedger.hostEnvironment,
    verificationGate:
      toCleanString(rawLedger.verificationGate) ||
      template.deploymentLedger.verificationGate
  };

  let rawGallery: SystemGalleryImage[] = [];
  if (Array.isArray(body.galleryImages)) {
    rawGallery = body.galleryImages
      .filter((item) => item && typeof item === "object")
      .map((item, idx) => {
        const rec = item as Record<string, unknown>;
        const numSlot = Number(rec.slot);
        const slot: 1 | 2 | 3 =
          numSlot === 1 || numSlot === 2 || numSlot === 3
            ? numSlot
            : (((idx % 3) + 1) as 1 | 2 | 3);
        return {
          slot,
          src: toCleanString(rec.src),
          alt: toCleanString(rec.alt),
          label: toCleanString(rec.label),
          caption: toCleanString(rec.caption)
        };
      });
  }
  const galleryImages = normalizeSystemGalleryImages(rawGallery, title || slug);

  let pipelineStages: PipelineStage[] = [];
  if (Array.isArray(body.pipelineStages)) {
    const stageNumbers: Array<"ETAPA 01" | "ETAPA 02" | "ETAPA 03"> = [
      "ETAPA 01",
      "ETAPA 02",
      "ETAPA 03"
    ];
    pipelineStages = body.pipelineStages
      .filter((item) => item && typeof item === "object")
      .slice(0, 3)
      .map((item, idx) => {
        const rec = item as Record<string, unknown>;
        const rawStageNum = toCleanString(rec.stageNumber);
        const stageNumber: "ETAPA 01" | "ETAPA 02" | "ETAPA 03" =
          rawStageNum === "ETAPA 01" ||
          rawStageNum === "ETAPA 02" ||
          rawStageNum === "ETAPA 03"
            ? rawStageNum
            : (stageNumbers[idx] ?? "ETAPA 01");
        let invariants: string[] = [];
        if (Array.isArray(rec.invariants)) {
          invariants = rec.invariants
            .map((inv) => toCleanString(inv))
            .filter(Boolean);
        } else if (typeof rec.invariants === "string") {
          invariants = rec.invariants
            .split(",")
            .map((inv) => inv.trim())
            .filter(Boolean);
        }
        return {
          stageNumber,
          title:
            toCleanString(rec.title) ||
            template.pipelineStages[idx]?.title ||
            `ETAPA 0${idx + 1}`,
          latencyOrSlo:
            toCleanString(rec.latencyOrSlo) ||
            template.pipelineStages[idx]?.latencyOrSlo ||
            "SLO 99.9%",
          description:
            toCleanString(rec.description) ||
            template.pipelineStages[idx]?.description ||
            "Etapa verificada del pipeline en producción.",
          invariants:
            invariants.length > 0
              ? invariants
              : (template.pipelineStages[idx]?.invariants ?? ["Verified"])
        };
      });
  }
  if (pipelineStages.length === 0) {
    pipelineStages = template.pipelineStages;
  }

  let codeTabs: CodeSnippetTab[] = [];
  if (Array.isArray(body.codeTabs)) {
    codeTabs = body.codeTabs
      .filter((item) => item && typeof item === "object")
      .map((item, idx) => {
        const rec = item as Record<string, unknown>;
        return {
          id: toCleanString(rec.id) || `tab-0${idx + 1}`,
          filename: toCleanString(rec.filename) || `src/module-${idx + 1}.ts`,
          layer: toCleanString(rec.layer) || "Layer 4 · Service",
          language: toCleanString(rec.language) || "typescript",
          code:
            typeof rec.code === "string" && rec.code.trim().length > 0
              ? rec.code.replace(/\r\n/g, "\n")
              : "// Código de referencia"
        };
      });
  }
  if (codeTabs.length === 0) {
    codeTabs = template.codeTabs;
  }

  let solvedChallenges: SolvedChallenge[] = [];
  if (Array.isArray(body.solvedChallenges)) {
    const challengeNums: Array<"01" | "02" | "03"> = ["01", "02", "03"];
    solvedChallenges = body.solvedChallenges
      .filter((item) => item && typeof item === "object")
      .slice(0, 3)
      .map((item, idx) => {
        const rec = item as Record<string, unknown>;
        const rawNum = toCleanString(rec.number);
        const number: "01" | "02" | "03" =
          rawNum === "01" || rawNum === "02" || rawNum === "03"
            ? rawNum
            : (challengeNums[idx] ?? "01");
        return {
          number,
          title:
            toCleanString(rec.title) ||
            template.solvedChallenges[idx]?.title ||
            `Desafío ${number}`,
          problem:
            toCleanString(rec.problem) ||
            template.solvedChallenges[idx]?.problem ||
            "Problema técnico de producción.",
          solution:
            toCleanString(rec.solution) ||
            template.solvedChallenges[idx]?.solution ||
            "Solución de ingeniería determinista.",
          impactMetric:
            toCleanString(rec.impactMetric) ||
            template.solvedChallenges[idx]?.impactMetric ||
            "100% verificado"
        };
      });
  }
  if (solvedChallenges.length === 0) {
    solvedChallenges = template.solvedChallenges;
  }

  if (Object.keys(errors).length > 0) {
    return {
      valid: false,
      input: null,
      errors
    };
  }

  const validatedInput: ProductionSystemUpsertInput = {
    id,
    order,
    slug,
    title,
    subtitle,
    catalogSection,
    category,
    categoryLabel,
    projectHeaderLabel,
    versionBadge,
    previewImageSrc,
    previewImageAlt,
    highlightedStackTag,
    featuredOnHome,
    layoutVariant,
    status,
    liveMetricPill: toCleanString(body.liveMetricPill) || undefined,
    summary,
    architecturalNarrative,
    stackTags,
    architectureSpecs,
    deploymentLedger,
    liveUrl,
    detailHref: `/sistemas/${slug}`,
    galleryImages,
    pipelineStages,
    codeTabs,
    solvedChallenges,
    ragKnowledgeDocument: toCleanString(body.ragKnowledgeDocument) || undefined
  };

  return {
    valid: true,
    input: validatedInput,
    errors: {}
  };
}

export function getFeaturedHomeProductionSystems(
  repo: ProductionSystemsProvider = defaultProductionSystemsRepository
): ProductionSystem[] {
  const systems = getProductionSystems(repo);
  const featured = systems.filter((system) => system.featuredOnHome === true);
  return featured.length > 0 ? featured : systems.slice(0, 1);
}

export function buildSparklineSvgGeometry(
  points: readonly HeroTelemetrySeriesPoint[],
  width = 320,
  height = 72
): SparklineSvgGeometry {
  if (!points || points.length === 0) {
    return {
      polylinePoints: `0,${height} ${width},${height}`,
      areaPath: `M 0 ${height} L ${width} ${height} Z`,
      minLatencyMs: 0,
      maxLatencyMs: 0,
      avgLatencyMs: 0
    };
  }

  const latencies = points.map((pt) => pt.latencyMs);
  const minLatencyMs = Math.min(...latencies);
  const maxLatencyMs = Math.max(...latencies);
  const sum = latencies.reduce((acc, value) => acc + value, 0);
  const avgLatencyMs = Number((sum / latencies.length).toFixed(1));

  const paddingY = 8;
  const usableHeight = Math.max(1, height - paddingY * 2);
  const range = Math.max(1, maxLatencyMs - minLatencyMs);
  const stepX = points.length > 1 ? width / (points.length - 1) : width;

  const coords = points.map((pt, idx) => {
    const x = Number((idx * stepX).toFixed(1));
    const normalized = (pt.latencyMs - minLatencyMs) / range;
    const y = Number((height - paddingY - normalized * usableHeight).toFixed(1));
    return { x, y };
  });

  const polylinePoints = coords.map((c) => `${c.x},${c.y}`).join(" ");
  const firstX = coords[0]?.x ?? 0;
  const lastX = coords[coords.length - 1]?.x ?? width;
  const lineSegments = coords.map((c) => `L ${c.x} ${c.y}`).join(" ");
  const areaPath = `M ${firstX} ${height} ${lineSegments} L ${lastX} ${height} Z`;

  return {
    polylinePoints,
    areaPath,
    minLatencyMs,
    maxLatencyMs,
    avgLatencyMs
  };
}
