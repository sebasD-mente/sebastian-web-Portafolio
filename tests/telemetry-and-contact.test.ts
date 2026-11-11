import React from "react";
import { renderToStaticMarkup } from "react-dom/server";
import { describe, expect, it } from "vitest";
import { POST as postContactRoute } from "@/app/api/contact/route";
import { GET as getHealthRoute } from "@/app/api/health/route";
import { GET as getTelemetryRoute } from "@/app/api/telemetry/route";
import HomePage from "@/app/page";
import { buildServerdmenteLiveMonitor } from "@/repo/telemetry.repo";
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
import { getSiteFoundationSnapshot } from "@/service/site.service";
import {
  executeTerminalCommand,
  getHomeLabHealthReport,
  getHomeLabTelemetrySnapshot,
  getServerdmenteLiveMonitor
} from "@/service/telemetry.service";
import { HeroSection } from "@/ui/components/HeroSection";

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

  it("feat-020: exposes liveMonitor in /api/telemetry, parses Linux kernel sensors safely, and renders serverdmente monitor in HeroSection without DEFAULT THEME or HARNESS SCORE", async () => {
    const liveMonitor = getServerdmenteLiveMonitor();
    expect(liveMonitor.headerTitle).toBe("HOME-LAB // SERVERDMENTE");
    expect(liveMonitor.statusBadge).toBe("ONLINE · LIVE 5S");
    expect(liveMonitor.hostAndKernel).toContain("Ubuntu 26.04 LTS");
    expect(liveMonitor.cpuAndLoad).toContain("Core i5-1035G1 (4C/8T)");
    expect(liveMonitor.thermalSensors.label).toContain("CPU");
    expect(liveMonitor.thermalSensors.label).toContain("NVMe");
    expect(liveMonitor.hostMemory.label).toContain("14.81 GiB");
    expect(liveMonitor.containerCgroup.label).toContain("256 MiB (Next.js Standalone)");
    expect(liveMonitor.storageNvme.label).toContain("KINGSTON 1TB NVMe");
    expect(liveMonitor.dataAndEdgeMesh).toBe(
      "pgvector:pg17 ONLINE · Tailscale WireGuard"
    );
    expect(liveMonitor.hostUptime.label).toContain("Continuous");
    expect(liveMonitor.gauges.map((g) => g.label)).toEqual([
      "THERMAL HEADROOM",
      "HOST RAM USAGE",
      "CONTAINER CGROUP QUOTA"
    ]);

    // Verify Linux kernel probe parsing on simulated serverdmente /sys and /proc files
    const simulatedLinuxMonitor = buildServerdmenteLiveMonitor({
      platform: "linux",
      arch: "x64",
      kernelRelease: "7.0.0-42-generic",
      cpuModels: Array.from(
        { length: 8 },
        () => "Intel(R) Core(TM) i5-1035G1 CPU @ 1.00GHz"
      ),
      loadAvg: [0.02, 0.05, 0.01],
      uptimeSeconds: 760320,
      processRssBytes: 50331648,
      readDir(dirPath: string): string[] {
        if (dirPath === "/sys/class/hwmon") return ["hwmon0", "hwmon1"];
        return [];
      },
      readFile(filePath: string): string | null {
        const files: Record<string, string> = {
          "/etc/os-release": 'PRETTY_NAME="Ubuntu 26.04.1 LTS"\nNAME="Ubuntu"\n',
          "/sys/class/hwmon/hwmon0/name": "coretemp\n",
          "/sys/class/hwmon/hwmon0/temp1_input": "58000\n",
          "/sys/class/hwmon/hwmon1/name": "nvme\n",
          "/sys/class/hwmon/hwmon1/temp1_input": "50850\n",
          "/proc/meminfo":
            "MemTotal:       15529188 kB\nMemFree:        11000000 kB\nMemAvailable:   13115200 kB\n",
          "/sys/fs/cgroup/memory.current": "50331648\n",
          "/sys/fs/cgroup/memory.max": "268435456\n",
          "/proc/uptime": "760320.45 6000000.00\n"
        };
        return files[filePath] ?? null;
      },
      statRootFs() {
        return {
          bsize: 4096,
          blocks: 239861760, // ~915 GiB
          bfree: 224133120,  // ~60 GiB used
          bavail: 212074496
        };
      }
    });

    expect(simulatedLinuxMonitor.hostAndKernel).toBe(
      "Ubuntu 26.04 LTS · Linux 7.0.0-42 x86_64"
    );
    expect(simulatedLinuxMonitor.cpuAndLoad).toBe(
      "Core i5-1035G1 (4C/8T) · Load 0.02 / 0.05"
    );
    expect(simulatedLinuxMonitor.thermalSensors).toEqual({
      cpuTempC: 58.0,
      nvmeTempC: 50.9,
      label: "CPU 58.0°C · NVMe 50.9°C"
    });
    expect(simulatedLinuxMonitor.hostMemory).toEqual({
      usedGib: 2.3,
      totalGib: 14.81,
      usedPercent: 16,
      label: "2.30 GiB / 14.81 GiB (16% Used)"
    });
    expect(simulatedLinuxMonitor.containerCgroup).toEqual({
      usedMib: 48,
      limitMib: 256,
      usedPercent: 19,
      label: "48 MiB / 256 MiB (Next.js Standalone)"
    });
    expect(simulatedLinuxMonitor.storageNvme).toEqual({
      usedGb: 60,
      totalGb: 915,
      usedPercent: 7,
      label: "KINGSTON 1TB NVMe · 60 GB / 915 GB (7%)"
    });
    expect(simulatedLinuxMonitor.hostUptime).toEqual({
      uptimeHours: 211.2,
      label: "8d 19h 12m (211.2h Continuous)"
    });

    // Verify GET /api/telemetry includes liveMonitor
    const telRes = await getTelemetryRoute(
      new Request("http://localhost:3000/api/telemetry")
    );
    expect(telRes.status).toBe(200);
    expect(telRes.headers.get("Cache-Control")).toContain("no-store");
    const telPayload = (await telRes.json()) as TelemetryEndpointPayload;
    expect(telPayload.telemetry.liveMonitor.headerTitle).toBe(
      "HOME-LAB // SERVERDMENTE"
    );
    expect(telPayload.telemetry.liveMonitor.gauges).toHaveLength(3);

    // feat-024: Verify HeroSection and HomePage render the modular dashboard in JetBrains Mono without ellipsis, with integrated progressbars and uptime
    const { identity } = getSiteFoundationSnapshot();
    const heroHtml = renderToStaticMarkup(
      React.createElement(HeroSection, { identity })
    );
    const homeHtml = renderToStaticMarkup(await HomePage());

    for (const html of [heroHtml, homeHtml]) {
      expect(html).toContain("NODE TELEMETRY");
      expect(html).toContain("HOME-LAB // serverdmente");
      expect(html).toContain("ONLINE · LIVE 5S");
      expect(html).toContain("HOST OS &amp; KERNEL");
      expect(html).toContain("TEMPERATURA &amp; DISIPACIÓN");
      expect(html).toContain("HOST RAM");
      expect(html).toContain("CGROUP NEXT.JS");
      expect(html).toContain("ALMACENAMIENTO NVMe");
      expect(html).toContain("TIEMPO ACTIVO (UPTIME):");
      expect(html).toContain("font-mono-tech");
      expect(html).toContain('role="progressbar"');
      expect(html).not.toContain("DEFAULT THEME");
      expect(html).not.toContain("HARNESS SCORE");
      expect(html).not.toContain("14 NODES");
    }

    // HeroSection specific ergonomic invariants: zero ellipsis, no truncate class, and network badges replaced with uptime
    expect(heroHtml).not.toContain("...");
    expect(heroHtml).not.toContain("truncate");
    expect(heroHtml).not.toContain("pgvector:pg17 ONLINE · Tailscale WireGuard");
  });
});
