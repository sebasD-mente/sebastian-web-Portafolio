import { describe, expect, it } from "vitest";
import {
  buildSparklineSvgGeometry,
  filterProductionSystemsByCategory,
  getHeroTelemetryCardData,
  getIndustrialBenchmarks,
  getProductionSystemBySlug,
  getProductionSystems,
  getSystemsCatalogSnapshot
} from "@/service/systems.service";

describe("feat-002: Production Systems Catalog, Hero Telemetry & Benchmarks Service", () => {
  it("returns the complete catalog snapshot with 4 ordered systems, 2 primary (7/5 & 5/7) and 2 secondary split", () => {
    const snapshot = getSystemsCatalogSnapshot();

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

    expect(snapshot.systems).toHaveLength(4);
    expect(snapshot.systems.map((s) => s.order)).toEqual(["01", "02", "03", "04"]);

    expect(snapshot.primarySystems).toHaveLength(2);
    expect(snapshot.primarySystems[0]?.layoutVariant).toBe("primary-7-5");
    expect(snapshot.primarySystems[1]?.layoutVariant).toBe("primary-5-7");

    expect(snapshot.secondarySystems).toHaveLength(2);
    expect(
      snapshot.secondarySystems.every((s) => s.layoutVariant === "secondary-split")
    ).toBe(true);
  });

  it("resolves systems by slug and returns null for unknown or empty slugs", () => {
    const nexus = getProductionSystemBySlug("nexus-distributed-inference-gateway");
    expect(nexus).not.toBeNull();
    expect(nexus?.order).toBe("01");
    expect(nexus?.pipelineStages).toHaveLength(3);
    expect(nexus?.solvedChallenges).toHaveLength(3);

    const chameleon = getProductionSystemBySlug("  CHAMELEON-AGENTIC-HARNESS ");
    expect(chameleon).not.toBeNull();
    expect(chameleon?.order).toBe("03");
    expect(chameleon?.category).toBe("ai-agents");

    expect(getProductionSystemBySlug("non-existent-system")).toBeNull();
    expect(getProductionSystemBySlug("")).toBeNull();
  });

  it("filters production systems by category and preserves immutability", () => {
    const all = filterProductionSystemsByCategory("all");
    expect(all).toHaveLength(4);

    const aiSystems = filterProductionSystemsByCategory("ai-agents");
    expect(aiSystems).toHaveLength(1);
    expect(aiSystems[0]?.slug).toBe("chameleon-agentic-harness");

    const homelabSystems = filterProductionSystemsByCategory("cloud-infrastructure");
    expect(homelabSystems).toHaveLength(1);
    expect(homelabSystems[0]?.slug).toBe("monolith-homelab-cloud-edge");

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
