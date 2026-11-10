"use client";

import React, { useEffect, useState } from "react";
import { getServerdmenteLiveMonitor } from "@/service/telemetry.service";
import type {
  HeroTelemetryCardData,
  ServerdmenteLiveGauge,
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

function resolveGaugeBarColor(tone: ServerdmenteLiveGauge["tone"]): string {
  if (tone === "amber") {
    return "bg-[#D97706]";
  }
  if (tone === "blue") {
    return "bg-[#2563EB]";
  }
  return "bg-[#059669]";
}

function resolveGaugeValueTextColor(tone: ServerdmenteLiveGauge["tone"]): string {
  if (tone === "amber") {
    return "text-[#B45309]";
  }
  if (tone === "blue") {
    return "text-[#2563EB]";
  }
  return "text-[#059669]";
}

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

          {/* Right Column (4 cols): Real-Time serverdmente Hardware & Kernel Monitor */}
          <div className="lg:col-span-4 flex justify-center lg:justify-end">
            <div className="w-full max-w-[440px] bg-white border border-[#6B8EBF]/80 p-3.5 shadow-[0_1px_3px_rgba(0,0,0,0.03)]">
              <aside
                aria-label="Monitor en tiempo real del servidor físico serverdmente"
                className="border border-[#D1D5DB] bg-[#F3F4F6] p-4 sm:p-5 space-y-3.5"
              >
                <div className="flex items-center justify-between border-b border-[#D1D5DB] pb-2.5">
                  <span className="mono-pixel text-[10px] sm:text-[11px] font-semibold text-[#111827]">
                    {monitor.headerTitle}
                  </span>
                  <span className="inline-flex items-center gap-1.5 mono-pixel text-[10px] sm:text-[11px] font-semibold text-[#059669]">
                    <span
                      aria-hidden="true"
                      className="h-2 w-2 rounded-full bg-[#059669] animate-pulse"
                    />
                    {monitor.statusBadge}
                  </span>
                </div>

                <dl className="space-y-1.5 mono-pixel text-[10px] sm:text-[10.5px]">
                  <div className="flex justify-between items-baseline gap-2">
                    <dt className="text-[#4B5563] shrink-0">HOST &amp; KERNEL</dt>
                    <dd className="text-[#111827] font-semibold text-right truncate">
                      {monitor.hostAndKernel}
                    </dd>
                  </div>
                  <div className="flex justify-between items-baseline gap-2">
                    <dt className="text-[#4B5563] shrink-0">CPU &amp; LOAD</dt>
                    <dd className="text-[#111827] text-right truncate">
                      {monitor.cpuAndLoad}
                    </dd>
                  </div>
                  <div className="flex justify-between items-baseline gap-2">
                    <dt className="text-[#4B5563] shrink-0">THERMAL SENSORS</dt>
                    <dd className="text-[#059669] font-semibold text-right truncate">
                      {monitor.thermalSensors.label}
                    </dd>
                  </div>
                  <div className="flex justify-between items-baseline gap-2">
                    <dt className="text-[#4B5563] shrink-0">HOST MEMORY</dt>
                    <dd className="text-[#111827] font-semibold text-right truncate">
                      {monitor.hostMemory.label}
                    </dd>
                  </div>
                  <div className="flex justify-between items-baseline gap-2">
                    <dt className="text-[#4B5563] shrink-0">CONTAINER CGROUP</dt>
                    <dd className="text-[#2563EB] font-semibold text-right truncate">
                      {monitor.containerCgroup.label}
                    </dd>
                  </div>
                  <div className="flex justify-between items-baseline gap-2">
                    <dt className="text-[#4B5563] shrink-0">STORAGE (NVME)</dt>
                    <dd className="text-[#111827] text-right truncate">
                      {monitor.storageNvme.label}
                    </dd>
                  </div>
                  <div className="flex justify-between items-baseline gap-2">
                    <dt className="text-[#4B5563] shrink-0">DATA &amp; EDGE MESH</dt>
                    <dd className="text-[#059669] font-semibold text-right truncate">
                      {monitor.dataAndEdgeMesh}
                    </dd>
                  </div>
                  <div className="flex justify-between items-baseline gap-2">
                    <dt className="text-[#4B5563] shrink-0">HOST UPTIME</dt>
                    <dd className="text-[#111827] font-semibold text-right truncate">
                      {monitor.hostUptime.label}
                    </dd>
                  </div>
                </dl>

                {/* Real-Time Hardware & Cgroup Gauges */}
                <div className="border-t border-[#D1D5DB] pt-3 space-y-2.5">
                  {monitor.gauges.map((gauge) => (
                    <div key={gauge.id} className="space-y-1">
                      <div className="flex items-center justify-between gap-2 mono-pixel text-[9.5px] sm:text-[10px]">
                        <span className="text-[#4B5563] font-semibold">
                          {gauge.label}
                        </span>
                        <span
                          className={`font-semibold whitespace-nowrap ${resolveGaugeValueTextColor(gauge.tone)}`}
                        >
                          {gauge.valueLabel}
                        </span>
                      </div>
                      <div
                        role="progressbar"
                        aria-label={gauge.label}
                        aria-valuenow={gauge.percent}
                        aria-valuemin={0}
                        aria-valuemax={100}
                        className="w-full h-1.5 bg-[#E5E7EB] border border-[#D1D5DB] overflow-hidden"
                      >
                        <div
                          className={`h-full transition-all duration-500 ${resolveGaugeBarColor(gauge.tone)}`}
                          style={{
                            width: `${Math.min(100, Math.max(2, gauge.percent))}%`
                          }}
                        />
                      </div>
                    </div>
                  ))}
                </div>
              </aside>
            </div>
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
