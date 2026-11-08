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
    <section
      aria-labelledby="hero-editorial-heading"
      className="border-b border-[var(--outline-variant)] py-14 lg:py-24 bg-[var(--background)]"
    >
      <div className="swiss-container grid grid-cols-1 lg:grid-cols-12 gap-10 items-start">
        {/* Left Column (8 cols): Editorial Value Proposition */}
        <div className="lg:col-span-8 space-y-6">
          <div className="flex flex-wrap items-center gap-2">
            <span className="inline-flex items-center gap-2 px-3 py-1 border border-[var(--outline-variant)] bg-[var(--surface-container-low)] rounded-[2px] mono-label text-[var(--secondary)]">
              ATELIER MONOLITH // {identity.domain.toUpperCase()}
            </span>
            <span className="inline-flex items-center gap-2 px-3 py-1 border border-[var(--outline-variant)] bg-[var(--surface-container-lowest)] rounded-[2px] mono-label text-[var(--tertiary-fixed)]">
              <span
                aria-hidden="true"
                className="h-1.5 w-1.5 rounded-full bg-[var(--tertiary-fixed)]"
              />
              {identity.availabilityBadge}
            </span>
          </div>

          <h1
            id="hero-editorial-heading"
            className="font-display text-4xl sm:text-5xl lg:text-[4rem] font-semibold tracking-[-0.035em] leading-[1.05] text-[var(--primary)]"
          >
            {identity.tagline}
          </h1>

          <p className="text-base sm:text-lg text-[var(--on-surface-variant)] max-w-3xl leading-relaxed">
            {identity.summary}
          </p>

          <ul
            role="list"
            className="grid grid-cols-1 sm:grid-cols-3 gap-3 pt-1"
          >
            {telemetryCard.executiveHighlights.map((highlight) => (
              <li
                key={highlight}
                className="border border-[var(--outline-variant)] bg-[var(--surface-container-lowest)] p-3.5 rounded-[2px] text-xs sm:text-sm text-[var(--on-surface-variant)] leading-snug"
              >
                <span
                  aria-hidden="true"
                  className="mono-label text-[var(--secondary)] block mb-1"
                >
                  INVARIANT // VERIFIED
                </span>
                {highlight}
              </li>
            ))}
          </ul>

          <div className="flex flex-wrap items-center gap-4 pt-3">
            <a
              href={identity.primaryCtaHref}
              className="px-6 py-3.5 bg-[var(--primary)] text-[var(--background)] rounded-[2px] mono-label hover:opacity-90 transition-opacity focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[var(--secondary)]"
            >
              {identity.primaryCtaLabel}
            </a>
            <a
              href={identity.secondaryCtaHref}
              className="px-6 py-3.5 border border-[var(--outline-variant)] bg-[var(--surface-container-low)] text-[var(--primary)] rounded-[2px] mono-label hover:bg-[var(--surface-container-high)] transition-colors focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[var(--secondary)]"
            >
              Discutir Proyecto / {identity.secondaryCtaLabel}
            </a>
          </div>
        </div>

        {/* Right Column (4 cols): KERNEL & HOME LAB TELEMETRY Card */}
        <aside
          aria-label="Tarjeta de telemetría del Kernel y Ubuntu Home Lab"
          className="lg:col-span-4 border border-[var(--outline-variant)] bg-[var(--surface-container-low)] p-6 rounded-[2px] space-y-5"
        >
          <div className="flex items-center justify-between border-b border-[var(--outline-variant)] pb-3">
            <span className="mono-label text-[var(--primary)]">
              {telemetryCard.cardTitle}
            </span>
            <span className="inline-flex items-center gap-1.5 mono-label text-[var(--tertiary-fixed)]">
              <span
                aria-hidden="true"
                className="h-2 w-2 rounded-full bg-[var(--tertiary-fixed)]"
              />
              {telemetryCard.nodeStatus}
            </span>
          </div>

          <dl className="space-y-2.5 mono-code text-xs sm:text-sm">
            <div className="flex justify-between gap-2">
              <dt className="text-[var(--on-surface-variant)]">NODE ID</dt>
              <dd className="text-[var(--primary)] font-medium text-right">
                {telemetryCard.nodeId}
              </dd>
            </div>
            <div className="flex justify-between gap-2">
              <dt className="text-[var(--on-surface-variant)]">HOST OS</dt>
              <dd className="text-[var(--primary)] text-right">
                {telemetryCard.hostEnvironment}
              </dd>
            </div>
            <div className="flex justify-between gap-2">
              <dt className="text-[var(--on-surface-variant)]">ACTIVE CONTAINERS</dt>
              <dd className="text-[var(--primary)] font-medium">
                {telemetryCard.activeContainers} NODES
              </dd>
            </div>
            <div className="flex justify-between gap-2">
              <dt className="text-[var(--on-surface-variant)]">P99 LATENCY</dt>
              <dd className="text-[var(--tertiary-fixed)] font-medium">
                {telemetryCard.p99LatencyMs} ms (AVG {sparkline.avgLatencyMs} ms)
              </dd>
            </div>
            <div className="flex justify-between gap-2">
              <dt className="text-[var(--on-surface-variant)]">HARNESS SCORE</dt>
              <dd className="text-[var(--secondary)] font-medium">
                {telemetryCard.harnessGateScore}
              </dd>
            </div>
            <div className="flex justify-between gap-2">
              <dt className="text-[var(--on-surface-variant)]">MEMORY RSS</dt>
              <dd className="text-[var(--primary)]">
                {telemetryCard.memoryFootprint}
              </dd>
            </div>
            <div className="flex justify-between gap-2">
              <dt className="text-[var(--on-surface-variant)]">DEFAULT THEME</dt>
              <dd className="text-[var(--primary)] uppercase">{defaultTheme}</dd>
            </div>
          </dl>

          {/* SVG Sparkline Telemetry Visualization */}
          <div className="border-t border-[var(--outline-variant)] pt-4 space-y-2">
            <div className="flex items-center justify-between">
              <span className="mono-label text-[var(--on-surface-variant)]">
                {telemetryCard.sparklineLabel}
              </span>
              <span className="mono-label text-[var(--secondary)]">
                {sparkline.minLatencyMs}ms – {sparkline.maxLatencyMs}ms
              </span>
            </div>

            <div className="border border-[var(--outline-variant)] bg-[var(--surface-container-lowest)] p-3 rounded-[2px]">
              <svg
                role="img"
                viewBox="0 0 320 72"
                className="w-full h-16 overflow-visible"
              >
                <title>
                  Gráfico sparkline de latencia P99 en ventana de 24 horas entre{" "}
                  {sparkline.minLatencyMs}ms y {sparkline.maxLatencyMs}ms con
                  promedio de {sparkline.avgLatencyMs}ms
                </title>
                <path
                  d={sparkline.areaPath}
                  fill="var(--secondary)"
                  fillOpacity="0.12"
                />
                <polyline
                  fill="none"
                  stroke="var(--secondary)"
                  strokeWidth="2"
                  points={sparkline.polylinePoints}
                />
              </svg>
              <div className="flex justify-between mono-label text-[var(--on-surface-variant)] pt-1">
                <span>00:00 UTC</span>
                <span>SLO {telemetryCard.uptimePercent}</span>
                <span>NOW // LIVE</span>
              </div>
            </div>
          </div>
        </aside>
      </div>
    </section>
  );
}
