import { CATALOG_SECTIONS_CONFIG } from "@/config/site.config";
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
  HeroTelemetryCardData,
  HeroTelemetrySeriesPoint,
  IndustrialBenchmarkKpi,
  ProductionSystem,
  ProductionSystemCategory,
  ProductionSystemsProvider,
  ProductionSystemUpsertInput,
  SystemDeepDiveNavigationLink,
  SystemDeepDiveSnapshot,
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
