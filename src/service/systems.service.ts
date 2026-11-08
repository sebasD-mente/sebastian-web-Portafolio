import { defaultProductionSystemsRepository } from "@/repo/systems.repo";
import type {
  HeroTelemetryCardData,
  HeroTelemetrySeriesPoint,
  IndustrialBenchmarkKpi,
  ProductionSystem,
  ProductionSystemCategory,
  ProductionSystemsProvider,
  SystemDeepDiveNavigationLink,
  SystemDeepDiveSnapshot,
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
    secondarySystems
  };
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
