import { describe, expect, it } from "vitest";
import {
  buildSparklineSvgGeometry,
  filterProductionSystemsByCategory,
  getFeaturedHomeProductionSystems,
  getHeroTelemetryCardData,
  getIndustrialBenchmarks,
  getProductionSystemBySlug,
  getProductionSystems,
  getSystemsCatalogSnapshot
} from "@/service/systems.service";

describe("feat-002 & feat-007: Production Systems Catalog, Hero Telemetry & Deco Vintage Platform", () => {
  it("returns the catalog snapshot with Deco Vintage Platform as featured Project 01", () => {
    const snapshot = getSystemsCatalogSnapshot();
    const featured = getFeaturedHomeProductionSystems();

    expect(snapshot.heroTelemetry.cardTitle).toBe("KERNEL & HOME LAB TELEMETRY");
    expect(snapshot.heroTelemetry.nodeStatus).toBe("ONLINE");
    expect(snapshot.heroTelemetry.sparklinePoints.length).toBeGreaterThanOrEqual(8);

    expect(snapshot.benchmarks).toHaveLength(4);
    expect(snapshot.benchmarks.map((b) => b.code)).toEqual([
      "KPI // 01",
      "KPI // 02",
      "KPI // 03",
      "KPI // 04"
    ]);

    expect(snapshot.systems).toHaveLength(1);
    expect(snapshot.systems.map((s) => s.order)).toEqual(["01"]);

    expect(featured).toHaveLength(1);
    expect(featured[0]?.slug).toBe("deco-vintage-platform");
    expect(featured[0]?.title).toBe("DECO VINTAGE PLATFORM");
    expect(featured[0]?.projectHeaderLabel).toBe(
      "PROJECT 01 // E-COMMERCE & CLOUD MEDIA ENGINE"
    );
    expect(featured[0]?.versionBadge).toBe("v3.4.0 PRODUCTION");
    expect(featured[0]?.highlightedStackTag).toBe("GOOGLE CLOUD STORAGE");
    expect(featured[0]?.liveUrl).toBe("https://www.decovintage.online");
    expect(featured[0]?.previewImageSrc).toBe("/assets/deco-vintage-preview.png");
    // feat-026: Atributos requeridos para el layout split editorial (columna izquierda + tarjeta derecha)
    expect(featured[0]?.subtitle.length).toBeGreaterThan(10);
    expect(featured[0]?.summary.length).toBeGreaterThan(20);
    expect(featured[0]?.architectureSpecs.length).toBeGreaterThanOrEqual(2);
    expect(featured[0]?.stackTags.length).toBeGreaterThanOrEqual(4);
    expect(featured[0]?.detailHref).toBe("/sistemas/deco-vintage-platform");

    expect(snapshot.primarySystems).toHaveLength(1);
    expect(snapshot.primarySystems[0]?.layoutVariant).toBe("primary-7-5");

    expect(snapshot.secondarySystems).toHaveLength(0);
  });

  it("resolves systems by slug and returns null for unknown or empty slugs", () => {
    const decoVintage = getProductionSystemBySlug("deco-vintage-platform");
    expect(decoVintage).not.toBeNull();
    expect(decoVintage?.order).toBe("01");
    expect(decoVintage?.pipelineStages).toHaveLength(3);
    expect(decoVintage?.solvedChallenges).toHaveLength(3);
    expect(decoVintage?.stackTags).toEqual([
      "NODE.JS + EXPRESS 5",
      "REACT 18 + VITE",
      "POSTGRESQL + PRISMA 6",
      "SHARP (LIBVIPS RAM)",
      "GOOGLE CLOUD STORAGE",
      "ZOD + ZERO-TRUST"
    ]);

    const normalizedDeco = getProductionSystemBySlug("  DECO-VINTAGE-PLATFORM ");
    expect(normalizedDeco).not.toBeNull();
    expect(normalizedDeco?.order).toBe("01");
    expect(normalizedDeco?.category).toBe("distributed-systems");

    expect(getProductionSystemBySlug("non-existent-system")).toBeNull();
    expect(getProductionSystemBySlug("")).toBeNull();
  });

  it("filters production systems by category and preserves immutability", () => {
    const all = filterProductionSystemsByCategory("all");
    expect(all).toHaveLength(1);

    const distributedSystems = filterProductionSystemsByCategory("distributed-systems");
    expect(distributedSystems).toHaveLength(1);
    expect(distributedSystems[0]?.slug).toBe("deco-vintage-platform");

    const aiSystems = filterProductionSystemsByCategory("ai-agents");
    expect(aiSystems).toHaveLength(0);

    const homelabSystems = filterProductionSystemsByCategory("cloud-infrastructure");
    expect(homelabSystems).toHaveLength(0);

    // Verify defensive cloning
    const firstCall = getProductionSystems();
    firstCall[0]?.stackTags.push("MutatedTag");
    const secondCall = getProductionSystems();
    expect(secondCall[0]?.stackTags).not.toContain("MutatedTag");
  });

  it("builds deterministic SVG sparkline geometry for Hero telemetry and handles empty series safely", () => {
    const telemetry = getHeroTelemetryCardData();
    const geometry = buildSparklineSvgGeometry(telemetry.sparklinePoints, 320, 72);

    expect(geometry.minLatencyMs).toBeGreaterThan(0);
    expect(geometry.maxLatencyMs).toBeGreaterThanOrEqual(geometry.minLatencyMs);
    expect(geometry.avgLatencyMs).toBeGreaterThanOrEqual(geometry.minLatencyMs);
    expect(geometry.polylinePoints.split(" ")).toHaveLength(
      telemetry.sparklinePoints.length
    );
    expect(geometry.areaPath).toContain("M 0 72");
    expect(geometry.areaPath.endsWith("Z")).toBe(true);

    const emptyGeometry = buildSparklineSvgGeometry([], 200, 50);
    expect(emptyGeometry.minLatencyMs).toBe(0);
    expect(emptyGeometry.maxLatencyMs).toBe(0);
    expect(emptyGeometry.polylinePoints).toBe("0,50 200,50");

    const benchmarks = getIndustrialBenchmarks();
    expect(benchmarks).toHaveLength(4);
  });
});
