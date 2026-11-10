import { homeLabTelemetryRepo } from "@/repo/telemetry.repo";
import { defaultSiteRepository } from "@/repo/site.repo";
import type {
  HomeLabHealthReport,
  HomeLabTelemetryProvider,
  HomeLabTelemetrySnapshot,
  ServerdmenteLiveMonitorData,
  SiteConfigProvider,
  TerminalCommandId,
  TerminalCommandPreset
} from "@/types/portfolio";

export function getServerdmenteLiveMonitor(
  telemetryProvider: HomeLabTelemetryProvider = homeLabTelemetryRepo
): ServerdmenteLiveMonitorData {
  return telemetryProvider.getLiveMonitor();
}

export function getHomeLabTelemetrySnapshot(
  correlationId = "homelab-snapshot-01",
  telemetryProvider: HomeLabTelemetryProvider = homeLabTelemetryRepo,
  siteProvider: SiteConfigProvider = defaultSiteRepository
): HomeLabTelemetrySnapshot {
  const ambient = siteProvider.getAmbientTelemetry();
  const runtimeMetrics = telemetryProvider.getRuntimeMetrics();
  const containers = telemetryProvider.getActiveContainers(
    runtimeMetrics.rssMemoryMb
  );
  const terminalCommands = telemetryProvider.getTerminalCommandPresets(
    runtimeMetrics,
    containers
  );
  const liveMonitor = telemetryProvider.getLiveMonitor();

  const initialTtyLines: string[] = [
    `$ ssh -i ~/.ssh/ed25519_dekolabs sebastian@${ambient.domain} -p 2222`,
    `Connected to ${ambient.nodeId} (${ambient.hostOs})`,
    `[SYSTEM] ${ambient.runtimeTarget} · Revision: ${ambient.deployedRevision}`,
    `[MEMORY] RSS ${runtimeMetrics.rssMemoryMb} MB / ${runtimeMetrics.memoryBudgetMb} MB budget · Uptime: ${runtimeMetrics.formattedUptime}`,
    `[HARNESS] ${ambient.harnessScore} · Correlation-ID: ${correlationId}`,
    " Selecciona un comando inferior o pulsa 'Refrescar /api/telemetry' para consultar el nodo en vivo."
  ];

  return {
    timestamp: new Date().toISOString(),
    correlationId,
    nodeId: ambient.nodeId,
    status: runtimeMetrics.memoryWithinSlo ? ambient.status : "DEGRADED",
    domain: ambient.domain,
    hostOs: ambient.hostOs,
    reverseProxyIngress: `Cloudflare Zero-Trust / Caddy TLS 1.3 -> 127.0.0.1:3000 (${ambient.domain})`,
    latencyMs: ambient.latencyMs,
    availabilitySlo: ambient.availabilitySlo,
    harnessScore: ambient.harnessScore,
    deployedRevision: ambient.deployedRevision,
    runtimeMetrics,
    containers,
    terminalCommands,
    initialTtyLines,
    liveMonitor
  };
}

export function getHomeLabHealthReport(
  correlationId = "health-check-01",
  telemetryProvider: HomeLabTelemetryProvider = homeLabTelemetryRepo,
  siteProvider: SiteConfigProvider = defaultSiteRepository
): HomeLabHealthReport {
  const ambient = siteProvider.getAmbientTelemetry();
  const metrics = telemetryProvider.getRuntimeMetrics();
  const memoryCheck = metrics.memoryWithinSlo ? "pass" : "warn";

  return {
    ok: true,
    status: memoryCheck === "pass" ? "healthy" : "degraded",
    timestamp: new Date().toISOString(),
    correlationId,
    nodeId: ambient.nodeId,
    domain: ambient.domain,
    uptimeSeconds: metrics.processUptimeSeconds,
    rssMemoryMb: metrics.rssMemoryMb,
    memoryBudgetMb: metrics.memoryBudgetMb,
    checks: {
      standaloneRuntime: "pass",
      memoryBudget: memoryCheck,
      harnessGates: "pass"
    }
  };
}

export function executeTerminalCommand(
  commandId: string,
  telemetryProvider: HomeLabTelemetryProvider = homeLabTelemetryRepo
): TerminalCommandPreset {
  const metrics = telemetryProvider.getRuntimeMetrics();
  const containers = telemetryProvider.getActiveContainers(metrics.rssMemoryMb);
  const presets = telemetryProvider.getTerminalCommandPresets(metrics, containers);

  const normalized = commandId.trim().toLowerCase() as TerminalCommandId;
  const found = presets.find((item) => item.id === normalized);
  if (found) {
    return found;
  }

  return (
    presets.find((item) => item.id === "help") ?? {
      id: "help",
      command: "help",
      label: "05 // Help & Specs",
      description: "Comandos soportados",
      outputLines: ["Comandos disponibles: status, containers, gates, network, help"]
    }
  );
}
