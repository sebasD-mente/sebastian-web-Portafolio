import { describe, expect, it } from "vitest";
import { POST as postContactRoute } from "@/app/api/contact/route";
import { GET as getHealthRoute } from "@/app/api/health/route";
import { GET as getTelemetryRoute } from "@/app/api/telemetry/route";
import type {
  ContactEndpointErrorPayload,
  ContactEndpointSuccessPayload
} from "@/runtime/contact.handler";
import type {
  HealthEndpointPayload,
  TelemetryEndpointPayload
} from "@/runtime/telemetry.handler";
import {
  createContactSubmissionReceipt,
  getEngagementModalities,
  validateContactInquiry
} from "@/service/contact.service";
import {
  executeTerminalCommand,
  getHomeLabHealthReport,
  getHomeLabTelemetrySnapshot
} from "@/service/telemetry.service";

describe("Ubuntu Home Lab Telemetry & Contact Advisory (feat-005)", () => {
  it("builds a deterministic Home Lab telemetry snapshot and executes terminal presets", () => {
    const snapshot = getHomeLabTelemetrySnapshot("tel-test-001");

    expect(snapshot.nodeId).toBe("HOME-LAB: UBUNTU-NODE-01");
    expect(snapshot.domain).toBe("dekolabs.org");
    expect(snapshot.correlationId).toBe("tel-test-001");
    expect(snapshot.runtimeMetrics.rssMemoryMb).toBeGreaterThan(0);
    expect(snapshot.runtimeMetrics.memoryBudgetMb).toBe(150);
    expect(snapshot.containers.length).toBeGreaterThanOrEqual(4);
    expect(snapshot.terminalCommands.map((c) => c.id)).toEqual([
      "status",
      "containers",
      "gates",
      "network",
      "help"
    ]);

    const gatesCmd = executeTerminalCommand("gates");
    expect(gatesCmd.id).toBe("gates");
    expect(gatesCmd.outputLines.some((line) => line.includes("100/100"))).toBe(
      true
    );

    const fallbackCmd = executeTerminalCommand("unknown-command");
    expect(fallbackCmd.id).toBe("help");
  });

  it("validates contact inquiries, strips HTML tags, and blocks spam honeypots", () => {
    const modalities = getEngagementModalities();
    expect(modalities).toHaveLength(4);

    const validResult = validateContactInquiry({
      fullName: "  Elena   Vance <b>CTO</b> ",
      email: "ELENA.VANCE@ACME.IO",
      organization: "Acme Robotics",
      modality: "agentic-ai-systems",
      projectSummary:
        "Necesitamos orquestar un sistema multi-agente con servidores MCP y auditoría Maker-Checker en producción."
    });

    expect(validResult.valid).toBe(true);
    expect(validResult.isSpamHoneypot).toBe(false);
    expect(validResult.sanitized.fullName).toBe("Elena Vance CTO");
    expect(validResult.sanitized.email).toBe("elena.vance@acme.io");

    const receipt = createContactSubmissionReceipt(
      validResult.sanitized,
      "corr-contact-01"
    );
    expect(receipt.ok).toBe(true);
    expect(receipt.receiptId).toMatch(/^DL-[0-9A-F]{6}$/);
    expect(receipt.correlationId).toBe("corr-contact-01");

    const invalidResult = validateContactInquiry({
      fullName: "A",
      email: "invalid-email",
      modality: "end-to-end-implementation",
      projectSummary: "Corto"
    });
    expect(invalidResult.valid).toBe(false);
    expect(invalidResult.errors.fullName).toBeDefined();
    expect(invalidResult.errors.email).toBeDefined();
    expect(invalidResult.errors.projectSummary).toBeDefined();

    const honeypotResult = validateContactInquiry({
      fullName: "Bot User",
      email: "bot@spam.example",
      modality: "end-to-end-implementation",
      projectSummary: "Automated spam message with sufficient length.",
      websiteHoneypot: "https://spam.example"
    });
    expect(honeypotResult.isSpamHoneypot).toBe(true);
    expect(honeypotResult.valid).toBe(false);
  });

  it("serves /api/health and /api/telemetry with RuntimeLogEntry and correlationId headers", async () => {
    const healthReport = getHomeLabHealthReport("hlth-direct-01");
    expect(healthReport.ok).toBe(true);
    expect(healthReport.checks.standaloneRuntime).toBe("pass");

    const healthReq = new Request("http://localhost:3000/api/health", {
      headers: { "x-correlation-id": "hlth-route-99" }
    });
    const healthRes = await getHealthRoute(healthReq);
    expect(healthRes.status).toBe(200);
    expect(healthRes.headers.get("x-correlation-id")).toBe("hlth-route-99");

    const healthJson = (await healthRes.json()) as HealthEndpointPayload;
    expect(healthJson.health.ok).toBe(true);
    expect(healthJson.runtimeLog.correlationId).toBe("hlth-route-99");
    expect(healthJson.runtimeLog.action).toBe("GET /api/health");

    const telReq = new Request(
      "http://localhost:3000/api/telemetry?cmd=containers",
      {
        headers: { "x-correlation-id": "tel-route-77" }
      }
    );
    const telRes = await getTelemetryRoute(telReq);
    expect(telRes.status).toBe(200);
    expect(telRes.headers.get("x-correlation-id")).toBe("tel-route-77");

    const telJson = (await telRes.json()) as TelemetryEndpointPayload;
    expect(telJson.telemetry.nodeId).toBe("HOME-LAB: UBUNTU-NODE-01");
    expect(telJson.executedCommand?.id).toBe("containers");
    expect(telJson.runtimeLog.correlationId).toBe("tel-route-77");
  });

  it("handles POST /api/contact for valid payloads (200), validation errors (422), and malformed JSON (400)", async () => {
    const validReq = new Request("http://localhost:3000/api/contact", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "x-correlation-id": "cnt-valid-01"
      },
      body: JSON.stringify({
        fullName: "Marco Aurelio",
        email: "marco@imperium.dev",
        organization: "Imperium Cloud",
        modality: "homelab-cloud-architecture",
        projectSummary:
          "Requerimos contenedorizar nuestra plataforma en Next.js 15 standalone sobre Ubuntu Linux con túneles TLS."
      })
    });

    const validRes = await postContactRoute(validReq);
    expect(validRes.status).toBe(200);
    expect(validRes.headers.get("x-correlation-id")).toBe("cnt-valid-01");
    const validJson = (await validRes.json()) as ContactEndpointSuccessPayload;
    expect(validJson.ok).toBe(true);
    expect(validJson.receipt.correlationId).toBe("cnt-valid-01");
    expect(validJson.runtimeLog.level).toBe("info");

    const invalidReq = new Request("http://localhost:3000/api/contact", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        fullName: "",
        email: "bad",
        modality: "end-to-end-implementation",
        projectSummary: "muy corto"
      })
    });
    const invalidRes = await postContactRoute(invalidReq);
    expect(invalidRes.status).toBe(422);
    const invalidJson = (await invalidRes.json()) as ContactEndpointErrorPayload;
    expect(invalidJson.ok).toBe(false);
    expect(invalidJson.errors.email).toBeDefined();

    const malformedReq = new Request("http://localhost:3000/api/contact", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: "{not-valid-json"
    });
    const malformedRes = await postContactRoute(malformedReq);
    expect(malformedRes.status).toBe(400);
  });
});
