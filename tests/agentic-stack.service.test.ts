import { describe, expect, it } from "vitest";
import {
  getAgenticStackSnapshot,
  getCommercialDeliveryBlueprints,
  getHarnessVerificationGates,
  getStackCapabilitiesByCategory
} from "@/service/agentic-stack.service";

describe("agentic-stack.service — Agentic Orchestration, Harness v2.1 & Commercial Stack Matrix", () => {
  it("builds a complete AgenticStackSnapshot with 6 ordered layers, 5 graph nodes, and Maker-Checker One-Shot spec", () => {
    const snapshot = getAgenticStackSnapshot();

    expect(snapshot.architectureLayers).toHaveLength(6);
    expect(snapshot.architectureLayers.map((l) => l.layer)).toEqual([
      "Types",
      "Config",
      "Repo",
      "Service",
      "Runtime",
      "UI"
    ]);

    expect(snapshot.makerCheckerSpec.protocolVersion).toContain(
      "Universal Chameleon Harness v2.1"
    );
    expect(snapshot.makerCheckerSpec.circuitBreakerLocks).toHaveLength(4);

    expect(snapshot.workflowNodes).toHaveLength(5);
    expect(snapshot.workflowNodes.map((n) => n.nodeId)).toEqual([
      "research",
      "implement",
      "verify",
      "human_approval",
      "merge"
    ]);

    expect(snapshot.mcpBridges.length).toBeGreaterThanOrEqual(4);
  });

  it("exposes the 3 deterministic verification gates (PUERTA 01, PUERTA 02, PUERTA 03)", () => {
    const gates = getHarnessVerificationGates();

    expect(gates).toHaveLength(3);
    expect(gates.map((g) => g.gateNumber)).toEqual([
      "PUERTA 01",
      "PUERTA 02",
      "PUERTA 03"
    ]);

    for (const gate of gates) {
      expect(gate.command.length).toBeGreaterThan(5);
      expect(gate.invariantsChecked.length).toBeGreaterThanOrEqual(3);
      expect(gate.passThreshold.length).toBeGreaterThan(5);
    }
  });

  it("filters stack capabilities by domain category and computes consistent category counts", () => {
    const snapshot = getAgenticStackSnapshot();
    const allItems = getStackCapabilitiesByCategory("all");
    const aiItems = getStackCapabilitiesByCategory("ai-agentic");
    const backendItems = getStackCapabilitiesByCategory("distributed-backend");
    const uiItems = getStackCapabilitiesByCategory("frontend-design");
    const infraItems = getStackCapabilitiesByCategory("cloud-homelab");

    expect(allItems.length).toBeGreaterThanOrEqual(10);
    expect(
      aiItems.length + backendItems.length + uiItems.length + infraItems.length
    ).toBe(allItems.length);

    const allCategoryOption = snapshot.stackCategories.find(
      (c) => c.id === "all"
    );
    expect(allCategoryOption?.count).toBe(allItems.length);

    for (const item of aiItems) {
      expect(item.category).toBe("ai-agentic");
    }
  });

  it("provides commercial delivery blueprints for client engagements with verifiable deliverables", () => {
    const blueprints = getCommercialDeliveryBlueprints();

    expect(blueprints).toHaveLength(3);
    for (const blueprint of blueprints) {
      expect(blueprint.title.length).toBeGreaterThan(10);
      expect(blueprint.includedDeliverables.length).toBeGreaterThanOrEqual(3);
      expect(blueprint.qualityGuarantee.length).toBeGreaterThan(10);
    }
  });
});
