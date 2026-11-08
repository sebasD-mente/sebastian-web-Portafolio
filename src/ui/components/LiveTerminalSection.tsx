"use client";

import React, { useState } from "react";
import type {
  HomeLabTelemetrySnapshot,
  RuntimeLogEntry,
  TerminalCommandId,
  TerminalCommandPreset
} from "@/types/portfolio";

export interface LiveTerminalSectionProps {
  initialSnapshot: HomeLabTelemetrySnapshot;
}

interface TelemetryApiResponse {
  telemetry: HomeLabTelemetrySnapshot;
  executedCommand: TerminalCommandPreset | null;
  runtimeLog: RuntimeLogEntry;
}

export function LiveTerminalSection({
  initialSnapshot
}: LiveTerminalSectionProps) {
  const [snapshot, setSnapshot] =
    useState<HomeLabTelemetrySnapshot>(initialSnapshot);
  const [activeCommandId, setActiveCommandId] =
    useState<TerminalCommandId>("status");
  const [lastRuntimeLog, setLastRuntimeLog] = useState<RuntimeLogEntry | null>(
    null
  );
  const [isRefreshing, setIsRefreshing] = useState(false);
  const [liveAnnouncement, setLiveAnnouncement] = useState<string>("");

  const activePreset: TerminalCommandPreset =
    snapshot.terminalCommands.find((cmd) => cmd.id === activeCommandId) ??
    snapshot.terminalCommands[0];

  async function handleCommandSelect(commandId: TerminalCommandId) {
    setActiveCommandId(commandId);
    const selected = snapshot.terminalCommands.find((c) => c.id === commandId);
    if (selected) {
      setLiveAnnouncement(
        `Comando ejecutado en terminal: ${selected.command}. ${selected.description}`
      );
    }
  }

  async function handleRefreshFromApi() {
    if (isRefreshing) return;
    setIsRefreshing(true);
    try {
      const response = await fetch(
        `/api/telemetry?cmd=${encodeURIComponent(activeCommandId)}`,
        {
          method: "GET",
          headers: { Accept: "application/json" },
          cache: "no-store"
        }
      );
      if (response.ok) {
        const data = (await response.json()) as TelemetryApiResponse;
        if (data.telemetry) {
          setSnapshot(data.telemetry);
        }
        if (data.runtimeLog) {
          setLastRuntimeLog(data.runtimeLog);
        }
        setLiveAnnouncement(
          `Telemetría actualizada desde /api/telemetry con correlationId ${
            data.runtimeLog?.correlationId ?? data.telemetry?.correlationId
          }.`
        );
      }
    } catch {
      setLiveAnnouncement(
        "Se mantuvo la instantánea determinista local del nodo Ubuntu Home Lab."
      );
    } finally {
      setIsRefreshing(false);
    }
  }

  const { runtimeMetrics, containers } = snapshot;

  return (
    <section
      id="telemetria-homelab"
      aria-labelledby="homelab-telemetry-heading"
      className="border-b border-[var(--outline-variant)] py-16 md:py-24 bg-[var(--background)]"
    >
      <div className="swiss-container space-y-12">
        {/* Polite live region for assistive technology announcements */}
        <div className="visually-hidden" aria-live="polite" aria-atomic="true">
          {liveAnnouncement}
        </div>

        {/* Section Header */}
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-end border-b border-[var(--outline-variant)] pb-8">
          <div className="lg:col-span-8 space-y-3">
            <div className="flex flex-wrap items-center gap-3">
              <span className="inline-flex items-center gap-2 px-2.5 py-1 rounded-[2px] border border-[var(--outline-variant)] bg-[var(--surface-container-low)] mono-label text-[var(--tertiary-fixed)]">
                <span
                  aria-hidden="true"
                  className="inline-block w-2 h-2 rounded-full bg-[var(--tertiary-fixed)]"
                />
                03 // HOME LAB TELEMETRY · {snapshot.nodeId}
              </span>
              <span className="mono-label text-[var(--on-surface-variant)]">
                ENDPOINT: /api/telemetry &amp; /api/health
              </span>
            </div>
            <h2
              id="homelab-telemetry-heading"
              className="font-display text-3xl md:text-4xl font-semibold tracking-tight text-[var(--primary)]"
            >
              Ubuntu Linux Home Lab &amp; Consola TTY en Vivo
            </h2>
            <p className="text-base text-[var(--on-surface-variant)] max-w-3xl leading-relaxed">
              Inspección en tiempo real del contenedor{" "}
              <code className="font-mono-tech text-xs px-1.5 py-0.5 bg-[var(--surface-container-low)] border border-[var(--outline-variant)]">
                node:22-alpine
              </code>{" "}
              que sirve <strong className="text-[var(--primary)]">{snapshot.domain}</strong>.
              Instrumentado bajo{" "}
              <code className="font-mono-tech text-xs px-1.5 py-0.5 bg-[var(--surface-container-low)] border border-[var(--outline-variant)]">
                Capability Seams
              </code>{" "}
              y trazabilidad estructurada{" "}
              <code className="font-mono-tech text-xs px-1.5 py-0.5 bg-[var(--surface-container-low)] border border-[var(--outline-variant)]">
                RuntimeLogEntry
              </code>{" "}
              con <code className="font-mono-tech text-xs">correlationId</code>.
            </p>
          </div>

          <div className="lg:col-span-4 flex flex-col sm:flex-row lg:flex-col items-start sm:items-end justify-between gap-3">
            <div className="text-left sm:text-right">
              <p className="mono-label text-[var(--on-surface-variant)]">
                INGRESS REVERSE PROXY
              </p>
              <p className="font-mono-tech text-xs text-[var(--primary)] mt-0.5">
                {snapshot.reverseProxyIngress}
              </p>
            </div>
            <button
              type="button"
              onClick={handleRefreshFromApi}
              disabled={isRefreshing}
              className="inline-flex items-center gap-2 px-4 py-2.5 min-h-[44px] rounded-[2px] border border-[var(--outline-variant)] bg-[var(--surface-container-low)] hover:bg-[var(--surface-container-high)] text-[var(--primary)] mono-label transition-colors cursor-pointer disabled:opacity-60"
            >
              <span aria-hidden="true">↻</span>
              {isRefreshing
                ? "Consultando /api/telemetry..."
                : "Refrescar /api/telemetry en Vivo"}
            </button>
          </div>
        </div>

        {/* 4 Runtime KPI Cards */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
          <div className="border border-[var(--outline-variant)] bg-[var(--surface-container-lowest)] p-5 rounded-[2px] space-y-1.5">
            <p className="mono-label text-[var(--on-surface-variant)]">
              MEMORIA RSS CONTENEDOR
            </p>
            <p className="font-display text-2xl font-semibold text-[var(--primary)]">
              {runtimeMetrics.rssMemoryMb} MB{" "}
              <span className="text-sm font-normal text-[var(--on-surface-variant)]">
                / {runtimeMetrics.memoryBudgetMb} MB
              </span>
            </p>
            <p className="mono-label text-[var(--tertiary-fixed)]">
              {runtimeMetrics.memoryWithinSlo
                ? "✓ SLO < 150MB CUMPLIDO"
                : "! ALERTA DE PRESUPUESTO"}
            </p>
          </div>

          <div className="border border-[var(--outline-variant)] bg-[var(--surface-container-lowest)] p-5 rounded-[2px] space-y-1.5">
            <p className="mono-label text-[var(--on-surface-variant)]">
              UPTIME &amp; LOAD AVG (1M)
            </p>
            <p className="font-display text-2xl font-semibold text-[var(--primary)]">
              {runtimeMetrics.formattedUptime}
            </p>
            <p className="mono-label text-[var(--secondary)]">
              LOAD: {runtimeMetrics.loadAverage1m} · LATENCIA: {snapshot.latencyMs}ms
            </p>
          </div>

          <div className="border border-[var(--outline-variant)] bg-[var(--surface-container-lowest)] p-5 rounded-[2px] space-y-1.5">
            <p className="mono-label text-[var(--on-surface-variant)]">
              RUNTIME ENGINE &amp; ARCH
            </p>
            <p className="font-display text-2xl font-semibold text-[var(--primary)]">
              Node {runtimeMetrics.nodeVersion}
            </p>
            <p className="mono-label text-[var(--on-surface-variant)]">
              {runtimeMetrics.platformArch} · STANDALONE
            </p>
          </div>

          <div className="border border-[var(--outline-variant)] bg-[var(--surface-container-lowest)] p-5 rounded-[2px] space-y-1.5">
            <p className="mono-label text-[var(--on-surface-variant)]">
              CORRELATION ID &amp; PUERTAS
            </p>
            <p className="font-mono-tech text-lg font-semibold text-[var(--primary)] truncate">
              {snapshot.correlationId}
            </p>
            <p className="mono-label text-[var(--tertiary-fixed)]">
              {snapshot.harnessScore}
            </p>
          </div>
        </div>

        {/* Main Grid: Interactive Terminal (7 cols) + Active Containers Ledger (5 cols) */}
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-start">
          {/* Left 7 cols: Interactive TTY Stream */}
          <div className="lg:col-span-7 border border-[var(--outline-variant)] rounded-[2px] overflow-hidden bg-[#0D0E0F] text-[#FFFFFF]">
            {/* Terminal Titlebar */}
            <div className="flex flex-wrap items-center justify-between gap-2 px-4 py-3 border-b border-[#292A2A] bg-[#141516]">
              <div className="flex items-center gap-2">
                <span
                  aria-hidden="true"
                  className="inline-block w-2.5 h-2.5 rounded-full bg-[#10B981]"
                />
                <span className="font-mono-tech text-xs text-[#C4C7C8]">
                  sebastian@ubuntu-node-01: ~/dekolabs-standalone (TTY-01)
                </span>
              </div>
              <span className="mono-label text-[#7BD0FF]">
                STATUS: {snapshot.status}
              </span>
            </div>

            {/* Command Preset Selector Buttons */}
            <div
              role="group"
              aria-label="Comandos de diagnóstico del nodo Ubuntu Home Lab"
              className="flex flex-wrap gap-2 p-3 border-b border-[#292A2A] bg-[#121314]"
            >
              {snapshot.terminalCommands.map((cmd) => {
                const isSelected = cmd.id === activeCommandId;
                return (
                  <button
                    key={cmd.id}
                    type="button"
                    aria-pressed={isSelected}
                    onClick={() => handleCommandSelect(cmd.id)}
                    className={`px-3 py-1.5 min-h-[36px] rounded-[2px] border font-mono-tech text-xs transition-colors cursor-pointer ${
                      isSelected
                        ? "border-[#7BD0FF] bg-[#1E293B] text-[#FFFFFF] font-semibold"
                        : "border-[#292A2A] bg-[#0D0E0F] text-[#C4C7C8] hover:border-[#444748] hover:text-[#FFFFFF]"
                    }`}
                  >
                    {cmd.label}
                  </button>
                );
              })}
            </div>

            {/* TTY Output Window */}
            <div className="p-5 space-y-4 font-mono-tech text-xs sm:text-sm leading-relaxed">
              {/* Session Banner Lines */}
              <div className="space-y-1 text-[#A3A3A3] border-b border-[#292A2A] pb-3">
                {snapshot.initialTtyLines.map((line, idx) => (
                  <p key={idx} className="break-words">
                    {line}
                  </p>
                ))}
              </div>

              {/* Active Executed Command */}
              {activePreset && (
                <div className="space-y-2 pt-1">
                  <p className="text-[#7BD0FF] font-semibold">
                    $ {activePreset.command}
                  </p>
                  <p className="text-xs text-[#A3A3A3]">
                    # {activePreset.description}
                  </p>
                  <div className="space-y-1.5 pl-3 border-l-2 border-[#10B981] text-[#E5E7EB]">
                    {activePreset.outputLines.map((line, index) => (
                      <p key={index} className="break-words">
                        {line}
                      </p>
                    ))}
                  </div>
                </div>
              )}

              {/* Live RuntimeLogEntry Preview if fetched */}
              {lastRuntimeLog && (
                <div className="mt-4 pt-3 border-t border-[#292A2A] space-y-1 text-xs">
                  <p className="text-[#10B981]">
                    [RUNTIME_LOG_ENTRY // {lastRuntimeLog.correlationId}]
                  </p>
                  <pre className="overflow-x-auto text-[#C4C7C8] bg-[#141516] p-3 rounded-[2px] border border-[#292A2A]">
                    {JSON.stringify(lastRuntimeLog, null, 2)}
                  </pre>
                </div>
              )}
            </div>
          </div>

          {/* Right 5 cols: Active Containers Ledger */}
          <div className="lg:col-span-5 border border-[var(--outline-variant)] bg-[var(--surface-container-low)] p-6 rounded-[2px] space-y-5">
            <div className="flex items-center justify-between border-b border-[var(--outline-variant)] pb-4">
              <div>
                <p className="mono-label text-[var(--secondary)]">
                  DOCKER ENGINE // TOPOLOGÍA DE CONTENEDORES
                </p>
                <h3 className="font-display text-xl font-semibold text-[var(--primary)] mt-1">
                  Plano de Ejecución Activo ({containers.length} Nodos)
                </h3>
              </div>
              <span className="px-2.5 py-1 rounded-[2px] border border-[var(--outline-variant)] bg-[var(--surface-container-lowest)] mono-label text-[var(--tertiary-fixed)]">
                HEALTHCHECK: 200 OK
              </span>
            </div>

            <ul className="space-y-3" role="list">
              {containers.map((ctr) => (
                <li
                  key={ctr.id}
                  className="border border-[var(--outline-variant)] bg-[var(--surface-container-lowest)] p-4 rounded-[2px] space-y-2"
                >
                  <div className="flex items-center justify-between gap-2">
                    <span className="font-mono-tech text-sm font-semibold text-[var(--primary)]">
                      {ctr.name}
                    </span>
                    <span className="mono-label px-2 py-0.5 rounded-[2px] bg-[var(--surface-container-low)] border border-[var(--outline-variant)] text-[var(--tertiary-fixed)]">
                      {ctr.state.toUpperCase()} · {ctr.memoryMb} MB
                    </span>
                  </div>
                  <p className="text-xs text-[var(--on-surface-variant)]">
                    {ctr.role}
                  </p>
                  <div className="flex flex-wrap items-center justify-between gap-2 pt-1 border-t border-[var(--outline-variant)] font-mono-tech text-xs text-[var(--on-surface-variant)]">
                    <span>IMG: {ctr.image}</span>
                    <span>PORT: {ctr.internalPort}</span>
                  </div>
                </li>
              ))}
            </ul>
          </div>
        </div>
      </div>
    </section>
  );
}
