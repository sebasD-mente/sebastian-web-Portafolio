import { describe, expect, it } from "vitest";
import {
  getAllProductionSystemSlugs,
  getProductionSystemDeepDiveBySlug
} from "@/service/systems.service";

describe("System Deep-Dive Service & Code Inspector Contracts (feat-003)", () => {
  it("generates static params for the production system catalog (Deco Vintage Platform)", () => {
    const slugs = getAllProductionSystemSlugs();
    expect(slugs).toEqual([
      { slug: "deco-vintage-platform" }
    ]);
  });

  it("builds a complete deep-dive snapshot with 3 pipeline stages, code inspector tabs, and 3 solved challenges for every system", () => {
    const slugs = getAllProductionSystemSlugs();

    for (const { slug } of slugs) {
      const deepDive = getProductionSystemDeepDiveBySlug(slug);
      expect(deepDive).not.toBeNull();
      if (!deepDive) continue;

      const { system, relatedSystems } = deepDive;
      expect(system.slug).toBe(slug);
      expect(system.detailHref).toBe(`/sistemas/${slug}`);

      // Deployment Metadata Ledger
      expect(system.deploymentLedger.architecturePattern.length).toBeGreaterThan(3);
      expect(system.deploymentLedger.commitSha.length).toBeGreaterThanOrEqual(7);
      expect(system.deploymentLedger.hostEnvironment.length).toBeGreaterThan(5);
      expect(system.deploymentLedger.verificationGate.length).toBeGreaterThan(5);

      // 4 KPIs and terminal preview lines
      expect(system.metrics).toHaveLength(4);
      expect(system.terminalPreviewLines.length).toBeGreaterThanOrEqual(3);
      expect(system.architectureSpecs.length).toBeGreaterThanOrEqual(4);

      // 3 Pipeline Stages (ETAPA 01, 02, 03)
      expect(system.pipelineStages.map((s) => s.stageNumber)).toEqual([
        "ETAPA 01",
        "ETAPA 02",
        "ETAPA 03"
      ]);
      for (const stage of system.pipelineStages) {
        expect(stage.title.length).toBeGreaterThan(5);
        expect(stage.description.length).toBeGreaterThan(15);
        expect(stage.invariants.length).toBeGreaterThanOrEqual(2);
      }

      // Code Inspector Tabs (readonly snippets, 0 CRLF)
      expect(system.codeTabs.length).toBeGreaterThanOrEqual(2);
      for (const tab of system.codeTabs) {
        expect(tab.id.length).toBeGreaterThan(2);
        expect(tab.filename.length).toBeGreaterThan(3);
        expect(tab.layer.length).toBeGreaterThan(3);
        expect(tab.code.trim().length).toBeGreaterThan(30);
        expect(tab.code.includes("\r")).toBe(false);
      }

      // 3 Solved Engineering Challenges (01, 02, 03)
      expect(system.solvedChallenges.map((c) => c.number)).toEqual([
        "01",
        "02",
        "03"
      ]);
      for (const challenge of system.solvedChallenges) {
        expect(challenge.title.length).toBeGreaterThan(5);
        expect(challenge.problem.length).toBeGreaterThan(15);
        expect(challenge.solution.length).toBeGreaterThan(15);
        expect(challenge.impactMetric.length).toBeGreaterThan(5);
      }

      // Related systems exclude current system
      expect(relatedSystems).toHaveLength(0);
      expect(relatedSystems.some((item) => item.slug === slug)).toBe(false);
    }
  });

  it("computes cyclic previous and next system navigation on the single-system seed catalog", () => {
    const first = getProductionSystemDeepDiveBySlug(
      "deco-vintage-platform"
    );
    expect(first).not.toBeNull();
    expect(first?.previousSystem.order).toBe("01");
    expect(first?.previousSystem.slug).toBe("deco-vintage-platform");
    expect(first?.nextSystem.order).toBe("01");
    expect(first?.nextSystem.slug).toBe("deco-vintage-platform");
  });

  it("returns null for non-existent or empty slugs", () => {
    expect(getProductionSystemDeepDiveBySlug("non-existent-system")).toBeNull();
    expect(getProductionSystemDeepDiveBySlug("   ")).toBeNull();
    expect(getProductionSystemDeepDiveBySlug("")).toBeNull();
  });
});
