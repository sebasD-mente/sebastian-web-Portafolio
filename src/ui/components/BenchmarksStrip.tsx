import React from "react";
import type { IndustrialBenchmarkKpi } from "@/types/portfolio";

export interface BenchmarksStripProps {
  benchmarks: IndustrialBenchmarkKpi[];
}

export function BenchmarksStrip({ benchmarks }: BenchmarksStripProps) {
  return (
    <section
      aria-labelledby="benchmarks-strip-heading"
      className="border-b border-[var(--outline-variant)] bg-[var(--surface-container-lowest)] py-10"
    >
      <div className="swiss-container space-y-6">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
          <h2
            id="benchmarks-strip-heading"
            className="mono-label text-[var(--secondary)]"
          >
            BENCHMARKS INDUSTRIALES // MÉTRICAS DE IMPACTO Y GARANTÍA DE ENTREGA
          </h2>
          <span className="mono-label text-[var(--on-surface-variant)]">
            VERIFIED TELEMETRY LEDGER · DEKOLABS.ORG
          </span>
        </div>

        <ul
          role="list"
          className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4"
        >
          {benchmarks.map((kpi) => (
            <li
              key={kpi.id}
              className="border border-[var(--outline-variant)] bg-[var(--surface-container-low)] p-5 rounded-[2px] flex flex-col justify-between gap-4"
            >
              <div className="space-y-2">
                <div className="flex items-center justify-between gap-2">
                  <span className="mono-label text-[var(--secondary)]">
                    {kpi.code}
                  </span>
                  <span className="mono-label text-[var(--tertiary-fixed)]">
                    {kpi.verificationTag}
                  </span>
                </div>
                <p className="font-display text-3xl sm:text-4xl font-semibold tracking-tight text-[var(--primary)]">
                  {kpi.metricValue}
                </p>
                <p className="font-display text-base font-medium text-[var(--primary)]">
                  {kpi.label}
                </p>
              </div>
              <p className="text-xs sm:text-sm text-[var(--on-surface-variant)] border-t border-[var(--outline-variant)] pt-3 leading-relaxed">
                {kpi.context}
              </p>
            </li>
          ))}
        </ul>
      </div>
    </section>
  );
}
