import React from "react";
import { buildSparklineSvgGeometry } from "@/service/systems.service";
import type {
  HeroTelemetryCardData,
  SiteIdentity,
  ThemeMode
} from "@/types/portfolio";

export interface HeroSectionProps {
  identity: SiteIdentity;
  telemetryCard: HeroTelemetryCardData;
  defaultTheme: ThemeMode;
}

export function HeroSection({
  identity,
  telemetryCard,
  defaultTheme
}: HeroSectionProps) {
  const sparkline = buildSparklineSvgGeometry(
    telemetryCard.sparklinePoints,
    320,
    72
  );

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

          {/* Right Column (4 cols): KERNEL & HOME LAB TELEMETRY Monitor */}
          <div className="lg:col-span-4 flex justify-center lg:justify-end">
            <div className="w-full max-w-[420px] bg-white border border-[#6B8EBF]/80 p-3.5 shadow-[0_1px_3px_rgba(0,0,0,0.03)]">
              <aside
                aria-label="Tarjeta de telemetría del Kernel y Ubuntu Home Lab"
                className="border border-[#D1D5DB] bg-[#F3F4F6] p-4 sm:p-5 space-y-4"
              >
                <div className="flex items-center justify-between border-b border-[#D1D5DB] pb-2.5">
                  <span className="mono-pixel text-[10px] sm:text-[11px] text-[#111827]">
                    {telemetryCard.cardTitle}
                  </span>
                  <span className="inline-flex items-center gap-1.5 mono-pixel text-[10px] sm:text-[11px] text-[#059669]">
                    <span
                      aria-hidden="true"
                      className="h-1.5 w-1.5 rounded-full bg-[#059669]"
                    />
                    {telemetryCard.nodeStatus}
                  </span>
                </div>

                <dl className="space-y-2 mono-pixel text-[10px] sm:text-[11px]">
                  <div className="flex justify-between gap-2">
                    <dt className="text-[#4B5563]">NODE ID</dt>
                    <dd className="text-[#111827] font-semibold text-right">
                      {telemetryCard.nodeId}
                    </dd>
                  </div>
                  <div className="flex justify-between gap-2">
                    <dt className="text-[#4B5563]">HOST OS</dt>
                    <dd className="text-[#111827] text-right max-w-[230px]">
                      {telemetryCard.hostEnvironment}
                    </dd>
                  </div>
                  <div className="flex justify-between gap-2">
                    <dt className="text-[#4B5563]">ACTIVE CONTAINERS</dt>
                    <dd className="text-[#111827] font-semibold">
                      {telemetryCard.activeContainers} NODES
                    </dd>
                  </div>
                  <div className="flex justify-between gap-2">
                    <dt className="text-[#4B5563]">P99 LATENCY</dt>
                    <dd className="text-[#059669] font-semibold">
                      {telemetryCard.p99LatencyMs} ms (AVG {sparkline.avgLatencyMs} ms)
                    </dd>
                  </div>
                  <div className="flex justify-between gap-2">
                    <dt className="text-[#4B5563]">HARNESS SCORE</dt>
                    <dd className="text-[#2563EB] font-semibold">
                      {telemetryCard.harnessGateScore}
                    </dd>
                  </div>
                  <div className="flex justify-between gap-2">
                    <dt className="text-[#4B5563]">MEMORY RSS</dt>
                    <dd className="text-[#111827]">
                      {telemetryCard.memoryFootprint}
                    </dd>
                  </div>
                  <div className="flex justify-between gap-2">
                    <dt className="text-[#4B5563]">DEFAULT THEME</dt>
                    <dd className="text-[#111827] uppercase">{defaultTheme}</dd>
                  </div>
                </dl>

                {/* SVG Sparkline Telemetry Visualization */}
                <div className="border-t border-[#D1D5DB] pt-3 space-y-2">
                  <div className="flex items-start justify-between gap-2">
                    <span className="mono-pixel text-[9.5px] sm:text-[10px] text-[#4B5563] leading-tight">
                      {telemetryCard.sparklineLabel}
                    </span>
                    <span className="mono-pixel text-[9.5px] sm:text-[10px] text-[#2563EB] whitespace-nowrap">
                      {sparkline.minLatencyMs}MS – {sparkline.maxLatencyMs}MS
                    </span>
                  </div>

                  <div className="border border-[#D1D5DB] bg-[#FAFAFA] p-2.5">
                    <svg
                      role="img"
                      viewBox="0 0 320 72"
                      className="w-full h-12 overflow-visible"
                    >
                      <title>
                        Gráfico sparkline de latencia P99 en ventana de 24 horas entre{" "}
                        {sparkline.minLatencyMs}ms y {sparkline.maxLatencyMs}ms con
                        promedio de {sparkline.avgLatencyMs}ms
                      </title>
                      <path
                        d={sparkline.areaPath}
                        fill="#2563EB"
                        fillOpacity="0.12"
                      />
                      <polyline
                        fill="none"
                        stroke="#2563EB"
                        strokeWidth="1.75"
                        points={sparkline.polylinePoints}
                      />
                    </svg>
                    <div className="flex justify-between mono-pixel text-[9.5px] text-[#4B5563] pt-1">
                      <span>00:00 UTC</span>
                      <span>SLO {telemetryCard.uptimePercent}</span>
                      <span>NOW // LIVE</span>
                    </div>
                  </div>
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
