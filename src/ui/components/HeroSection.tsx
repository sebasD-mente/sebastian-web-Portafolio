"use client";

import React, { useEffect, useState } from "react";
import { getServerdmenteLiveMonitor } from "@/service/telemetry.service";
import type {
  HeroTelemetryCardData,
  ServerdmenteLiveMonitorData,
  SiteIdentity,
  ThemeMode
} from "@/types/portfolio";

export interface HeroSectionProps {
  identity: SiteIdentity;
  telemetryCard?: HeroTelemetryCardData;
  defaultTheme?: ThemeMode;
  liveMonitor?: ServerdmenteLiveMonitorData;
}

const LIVE_TELEMETRY_POLL_MS = 5000;

export function HeroSection({
  identity,
  liveMonitor
}: HeroSectionProps) {
  const [monitor, setMonitor] = useState<ServerdmenteLiveMonitorData>(
    () => liveMonitor ?? getServerdmenteLiveMonitor()
  );

  useEffect(() => {
    if (liveMonitor) {
      setMonitor(liveMonitor);
    }
  }, [liveMonitor]);

  useEffect(() => {
    let active = true;

    const pollServerdmenteTelemetry = async () => {
      try {
        const response = await fetch("/api/telemetry", {
          method: "GET",
          cache: "no-store",
          headers: {
            Accept: "application/json"
          }
        });
        if (!response.ok) return;

        const payload = (await response.json()) as {
          telemetry?: {
            liveMonitor?: ServerdmenteLiveMonitorData;
          };
        };

        if (active && payload?.telemetry?.liveMonitor) {
          setMonitor(payload.telemetry.liveMonitor);
        }
      } catch {
        // Keep last verified telemetry reading on transient network interruption
      }
    };

    const intervalId = setInterval(() => {
      void pollServerdmenteTelemetry();
    }, LIVE_TELEMETRY_POLL_MS);

    return () => {
      active = false;
      clearInterval(intervalId);
    };
  }, []);

  // Split hostAndKernel e.g. "Ubuntu 24.04 LTS · Linux 7.0.0-42 x86_64"
  const hostKernelParts = monitor.hostAndKernel.split(" · ");
  const distroPart = hostKernelParts[0] ?? monitor.hostAndKernel;
  const kernelPart = hostKernelParts.slice(1).join(" · ");

  // Split cpuAndLoad e.g. "Core i5-1035G1 (4C/8T) · Load 0.01 / 0.04"
  const cpuLoadParts = monitor.cpuAndLoad.split(" · ");
  const cpuModel = cpuLoadParts[0] ?? "Core i5-1035G1 (4C/8T)";
  const rawLoad = cpuLoadParts[1] ?? "Load 0.01 / 0.04";
  const loadDisplay = rawLoad.replace(/^Load\s*/i, "").trim() || "0.01 / 0.04";
  const loadTokens = loadDisplay.split("/").map((s) => s.trim());

  // Thermals
  const cpuTemp = monitor.thermalSensors.cpuTempC;
  const nvmeTemp = monitor.thermalSensors.nvmeTempC;
  const thermalPercent = Math.min(100, Math.max(2, Math.round(cpuTemp)));
  const thermalBarColor =
    cpuTemp >= 85
      ? "bg-[#D97706]"
      : cpuTemp >= 75
        ? "bg-[#F59E0B]"
        : "bg-[#10b981]";
  const thermalStatus = cpuTemp >= 85 ? "ALERTA" : "ÓPTIMO";

  // Host Memory
  const hostRamPercent = Math.min(
    100,
    Math.max(2, monitor.hostMemory.usedPercent)
  );

  // Container Cgroup
  const cgroupPercent = Math.min(
    100,
    Math.max(2, monitor.containerCgroup.usedPercent)
  );

  // NVMe Storage
  const storagePercent = Math.min(
    100,
    Math.max(2, monitor.storageNvme.usedPercent)
  );

  // Format Uptime label (e.g. "8d 19h 12m (211.0h Continuous)" -> duration + (211.0h continuo))
  const uptimeLabel = monitor.hostUptime.label.replace(/continuous/i, "continuo");
  const uptimeMatch = uptimeLabel.match(/^(.*?)\s*(\(.*?\))$/);
  const uptimeDuration = uptimeMatch ? uptimeMatch[1] : uptimeLabel;
  const uptimeContinuous = uptimeMatch ? uptimeMatch[2] : null;

  return (
    <>
      <section
        aria-labelledby="hero-editorial-heading"
        className="py-10 sm:py-14 lg:py-16 bg-[#F8F9FA]"
      >
        <div className="swiss-container grid grid-cols-1 lg:grid-cols-12 gap-10 lg:gap-12 items-center">
          {/* Left Column (8 cols): Clean Uncluttered Editorial Value Proposition */}
          <div className="lg:col-span-8 space-y-6">
            <h1
              id="hero-editorial-heading"
              className="font-display text-4xl sm:text-5xl lg:text-[3.5rem] xl:text-[3.7rem] font-bold tracking-[-0.03em] leading-[1.06] text-[#0A0A0A]"
            >
              {identity.tagline}
            </h1>

            <p className="text-base sm:text-lg lg:text-[1.125rem] text-[#374151] max-w-3xl leading-[1.6] font-normal">
              {identity.summary}
            </p>
          </div>

          {/* Right Column (4 cols): Real-Time serverdmente Modular Hardware & Kernel Monitor */}
          <div className="lg:col-span-4 flex justify-center lg:justify-end">
            <aside
              aria-label="Monitor en tiempo real del servidor físico serverdmente"
              className="w-full max-w-[490px] bg-white border border-[#cbd5e1] hover:border-[#2563eb] rounded-[10px] shadow-[0_4px_14px_rgba(0,0,0,0.05)] hover:shadow-[0_10px_25px_-5px_rgba(37,99,235,0.12)] p-4 sm:p-[18px] flex flex-col gap-3 transition-all duration-300 font-mono-tech text-[#0f172a]"
            >
              {/* Header */}
              <div className="flex items-center justify-between border-b border-[#e2e8f0] pb-3">
                <div>
                  <div className="text-[10.5px] font-bold text-[#64748b] tracking-[0.08em] uppercase">
                    NODE TELEMETRY
                  </div>
                  <div className="text-[13.5px] font-bold text-[#0f172a] mt-0.5">
                    HOME-LAB // serverdmente
                  </div>
                </div>
                <div className="inline-flex items-center gap-1.5 bg-[#ecfdf5] border border-[#a7f3d0] text-[#047857] px-2.5 py-1 rounded-md text-[11.5px] font-bold">
                  <span
                    aria-hidden="true"
                    className="h-[7px] w-[7px] rounded-full bg-[#10b981] shadow-[0_0_6px_#10b981] animate-pulse"
                  />
                  <span>{monitor.statusBadge}</span>
                </div>
              </div>

              {/* 1. OS & Hardware */}
              <div className="bg-[#f8fafc] border border-[#e2e8f0] rounded-[7px] p-[11px_13px]">
                <div className="flex items-center justify-between text-[11px] text-[#64748b] mb-1">
                  <span>HOST OS &amp; KERNEL</span>
                  <span className="font-bold text-[#334155]">{cpuModel}</span>
                </div>
                <div className="text-[12.5px] font-bold text-[#0f172a]">
                  {distroPart}
                  {kernelPart ? (
                    <span className="text-[#64748b] font-normal"> · {kernelPart}</span>
                  ) : null}
                </div>
                <div className="text-[11px] text-[#64748b] mt-1.5 flex items-center justify-between">
                  <span>
                    Carga CPU:{" "}
                    {loadTokens.length === 2 ? (
                      <>
                        <strong className="text-[#0f172a] font-semibold">{loadTokens[0]}</strong> (1m) /{" "}
                        <strong className="text-[#0f172a] font-semibold">{loadTokens[1]}</strong> (5m)
                      </>
                    ) : (
                      <strong className="text-[#0f172a] font-semibold">{loadDisplay}</strong>
                    )}
                  </span>
                  <span className="text-[#059669] font-semibold">Estado: {thermalStatus}</span>
                </div>
              </div>

              {/* 2. Thermals (CPU & NVMe con barra integrada) */}
              <div className="bg-[#f8fafc] border border-[#e2e8f0] rounded-[7px] p-[11px_13px]">
                <div className="flex items-center justify-between text-[11px] sm:text-[11.5px]">
                  <span className="text-[#64748b] font-semibold">
                    TEMPERATURA &amp; DISIPACIÓN
                  </span>
                  <span className="font-bold text-[#059669]">
                    CPU {cpuTemp.toFixed(1)}°C{" "}
                    <span className="font-normal text-[#94a3b8]">/ 100°C</span> · NVMe{" "}
                    {nvmeTemp.toFixed(1)}°C
                  </span>
                </div>
                <div className="w-full h-1.5 bg-[#e2e8f0] rounded-full overflow-hidden mt-1.5">
                  <div
                    role="progressbar"
                    aria-label="Disipación térmica CPU"
                    aria-valuenow={thermalPercent}
                    aria-valuemin={0}
                    aria-valuemax={100}
                    className={`h-full rounded-full transition-all duration-500 ${thermalBarColor}`}
                    style={{ width: `${thermalPercent}%` }}
                  />
                </div>
              </div>

              {/* 3. RAM & Next.js Cgroup (2 Columnas con sus barras) */}
              <div className="grid grid-cols-2 gap-2.5">
                {/* Host RAM */}
                <div className="bg-[#f8fafc] border border-[#e2e8f0] rounded-[7px] p-[11px_13px]">
                  <div className="text-[11px] text-[#64748b] font-semibold">
                    HOST RAM ({monitor.hostMemory.usedPercent}%)
                  </div>
                  <div className="text-[12.5px] font-bold text-[#0f172a] mt-0.5">
                    {monitor.hostMemory.usedGib.toFixed(2)} /{" "}
                    {monitor.hostMemory.totalGib.toFixed(2)} GiB
                  </div>
                  <div className="w-full h-1.5 bg-[#e2e8f0] rounded-full overflow-hidden mt-1.5">
                    <div
                      role="progressbar"
                      aria-label="Uso de memoria RAM del Host"
                      aria-valuenow={monitor.hostMemory.usedPercent}
                      aria-valuemin={0}
                      aria-valuemax={100}
                      className="h-full rounded-full transition-all duration-500 bg-[#2563eb]"
                      style={{ width: `${hostRamPercent}%` }}
                    />
                  </div>
                </div>

                {/* Cgroup Next.js */}
                <div className="bg-[#f8fafc] border border-[#e2e8f0] rounded-[7px] p-[11px_13px]">
                  <div className="text-[11px] text-[#64748b] font-semibold">
                    CGROUP NEXT.JS ({monitor.containerCgroup.usedPercent}%)
                  </div>
                  <div className="text-[12.5px] font-bold text-[#2563eb] mt-0.5">
                    {monitor.containerCgroup.usedMib} / {monitor.containerCgroup.limitMib} MiB
                  </div>
                  <div className="w-full h-1.5 bg-[#e2e8f0] rounded-full overflow-hidden mt-1.5">
                    <div
                      role="progressbar"
                      aria-label="Cuota de memoria cgroup Next.js"
                      aria-valuenow={monitor.containerCgroup.usedPercent}
                      aria-valuemin={0}
                      aria-valuemax={100}
                      className="h-full rounded-full transition-all duration-500 bg-[#10b981]"
                      style={{ width: `${cgroupPercent}%` }}
                    />
                  </div>
                </div>
              </div>

              {/* 4. Storage NVMe + Uptime Reemplazando pgvector y Tailscale */}
              <div className="bg-[#f8fafc] border border-[#e2e8f0] rounded-[7px] p-[11px_13px]">
                <div className="flex items-center justify-between text-[11px] sm:text-[11.5px]">
                  <span className="text-[#64748b] font-semibold">
                    ALMACENAMIENTO NVMe
                  </span>
                  <span className="font-bold text-[#334155]">
                    {monitor.storageNvme.usedGb} GB / {monitor.storageNvme.totalGb} GB{" "}
                    <span className="font-normal text-[#94a3b8]">
                      ({monitor.storageNvme.usedPercent}% Usado)
                    </span>
                  </span>
                </div>
                <div className="w-full h-1.5 bg-[#e2e8f0] rounded-full overflow-hidden mt-1.5">
                  <div
                    role="progressbar"
                    aria-label="Uso de almacenamiento NVMe"
                    aria-valuenow={monitor.storageNvme.usedPercent}
                    aria-valuemin={0}
                    aria-valuemax={100}
                    className="h-full rounded-full transition-all duration-500 bg-[#10b981]"
                    style={{ width: `${storagePercent}%` }}
                  />
                </div>

                {/* Uptime Continuo en la base de la tarjeta */}
                <div className="flex items-center justify-between mt-2.5 pt-2 border-t border-[#e2e8f0] text-[11px] sm:text-[11.5px]">
                  <span className="text-[#64748b] font-semibold flex items-center gap-1.5">
                    <span aria-hidden="true">⏱</span>
                    <span>TIEMPO ACTIVO (UPTIME):</span>
                  </span>
                  <span className="text-[#0f172a] font-bold">
                    {uptimeDuration}
                    {uptimeContinuous ? (
                      <span className="text-[#64748b] font-normal"> {uptimeContinuous}</span>
                    ) : null}
                  </span>
                </div>
              </div>
            </aside>
          </div>
        </div>
      </section>

      {/* Middle Subtle Gray Divider Band */}
      <div
        aria-hidden="true"
        className="w-full h-6 sm:h-7 bg-[#EAECEF] border-y border-[#E5E7EB]"
      />
    </>
  );
}
