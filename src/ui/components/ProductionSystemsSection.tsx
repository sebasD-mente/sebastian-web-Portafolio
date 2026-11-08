"use client";

import React, { useState } from "react";
import Link from "next/link";
import type {
  ProductionSystem,
  ProductionSystemCategory
} from "@/types/portfolio";

export interface ProductionSystemsSectionProps {
  systems: ProductionSystem[];
}

const CATEGORY_FILTERS: readonly {
  id: ProductionSystemCategory | "all";
  label: string;
}[] = [
  { id: "all", label: "ALL SYSTEMS (04)" },
  { id: "distributed-systems", label: "01 // DISTRIBUTED & AI GATEWAY" },
  { id: "data-pipelines", label: "02 // REAL-TIME DATA LEDGER" },
  { id: "ai-agents", label: "03 // AGENTIC HARNESS v2.1" },
  { id: "cloud-infrastructure", label: "04 // UBUNTU HOME LAB EDGE" }
];

function SystemVisualTelemetryFrame({ system }: { system: ProductionSystem }) {
  return (
    <div className="border border-[var(--outline-variant)] bg-[var(--surface-container-lowest)] p-5 sm:p-6 rounded-[2px] flex flex-col justify-between gap-5 h-full">
      {/* Top Status & Live Metric Pill */}
      <div className="flex flex-wrap items-center justify-between gap-3 border-b border-[var(--outline-variant)] pb-3.5">
        <div className="flex items-center gap-2">
          <span
            aria-hidden="true"
            className="h-2 w-2 rounded-full bg-[var(--tertiary-fixed)]"
          />
          <span className="mono-label text-[var(--primary)]">
            SYS // {system.order} · {system.status}
          </span>
        </div>
        <span className="px-2.5 py-1 border border-[var(--outline-variant)] bg-[var(--surface-container-low)] rounded-[2px] mono-label text-[var(--tertiary-fixed)]">
          {system.liveMetricPill}
        </span>
      </div>

      {/* Schematic 3-Stage Pipeline Preview */}
      <div className="space-y-2.5">
        <div className="flex items-center justify-between">
          <span className="mono-label text-[var(--secondary)]">
            TOPOLOGÍA DE EJECUCIÓN // 3 ETAPAS VERIFICADAS
          </span>
          <span className="mono-label text-[var(--on-surface-variant)]">
            COMMIT {system.deploymentLedger.commitSha}
          </span>
        </div>

        <ol role="list" className="grid grid-cols-1 sm:grid-cols-3 gap-2.5">
          {system.pipelineStages.map((stage) => (
            <li
              key={stage.stageNumber}
              className="border border-[var(--outline-variant)] bg-[var(--surface-container-low)] p-3 rounded-[2px] space-y-1.5"
            >
              <div className="flex items-center justify-between gap-1">
                <span className="mono-label text-[var(--secondary)]">
                  {stage.stageNumber}
                </span>
                <span className="mono-label text-[var(--tertiary-fixed)]">
                  {stage.latencyOrSlo}
                </span>
              </div>
              <p className="font-display text-xs sm:text-sm font-medium text-[var(--primary)] leading-snug">
                {stage.title}
              </p>
            </li>
          ))}
        </ol>
      </div>

      {/* KPI Metrics Grid inside Preview Frame */}
      <dl className="grid grid-cols-2 sm:grid-cols-4 gap-2.5">
        {system.metrics.map((metric) => (
          <div
            key={metric.label}
            className="border border-[var(--outline-variant)] bg-[var(--surface-container-low)] p-3 rounded-[2px]"
          >
            <dt className="mono-label text-[var(--on-surface-variant)]">
              {metric.label}
            </dt>
            <dd className="font-display text-base sm:text-lg font-semibold text-[var(--primary)] mt-1">
              {metric.value}
            </dd>
            <dd className="mono-label text-[var(--secondary)] mt-0.5">
              {metric.deltaOrTarget}
            </dd>
          </div>
        ))}
      </dl>

      {/* Terminal Stream Snapshot */}
      <div className="border border-[var(--outline-variant)] bg-[var(--surface-container-low)] p-3.5 rounded-[2px] space-y-1.5">
        <div className="flex items-center justify-between border-b border-[var(--outline-variant)] pb-1.5">
          <span className="mono-label text-[var(--on-surface-variant)]">
            RUNTIME STREAM // {system.deploymentLedger.hostEnvironment}
          </span>
          <span className="mono-label text-[var(--tertiary-fixed)]">
            {system.deploymentLedger.verificationGate}
          </span>
        </div>
        <div className="space-y-1 overflow-x-auto">
          {system.terminalPreviewLines.map((line) => (
            <p
              key={line}
              className="mono-code text-xs text-[var(--on-surface-variant)] whitespace-nowrap"
            >
              {line}
            </p>
          ))}
        </div>
      </div>
    </div>
  );
}

function SystemSpecificationColumn({ system }: { system: ProductionSystem }) {
  return (
    <div className="border border-[var(--outline-variant)] bg-[var(--surface-container-low)] p-6 sm:p-7 rounded-[2px] flex flex-col justify-between gap-6 h-full">
      <div className="space-y-4">
        <div className="flex flex-wrap items-center justify-between gap-2">
          <span className="mono-label text-[var(--secondary)]">
            {system.order} // {system.categoryLabel}
          </span>
          <span className="mono-label px-2 py-0.5 border border-[var(--outline-variant)] bg-[var(--surface-container-lowest)] text-[var(--primary)] rounded-[2px]">
            {system.deploymentLedger.architecturePattern}
          </span>
        </div>

        <h3 className="font-display text-2xl sm:text-3xl font-semibold tracking-tight text-[var(--primary)] leading-tight">
          {system.title}
        </h3>

        <p className="text-sm sm:text-base font-medium text-[var(--primary)] leading-relaxed">
          {system.subtitle}
        </p>

        <p className="text-sm text-[var(--on-surface-variant)] leading-relaxed">
          {system.summary}
        </p>

        {/* Architecture Specifications Ledger */}
        <dl className="border-t border-b border-[var(--outline-variant)] py-3.5 space-y-2">
          {system.architectureSpecs.map((spec) => (
            <div
              key={spec.label}
              className="flex flex-col sm:flex-row sm:items-center justify-between gap-1 text-xs"
            >
              <dt className="mono-label text-[var(--on-surface-variant)]">
                {spec.label}
              </dt>
              <dd className="mono-code text-xs text-[var(--primary)] font-medium sm:text-right">
                {spec.value}
              </dd>
            </div>
          ))}
        </dl>

        {/* Stack Tags in JetBrains Mono */}
        <div className="space-y-2">
          <span className="mono-label text-[var(--on-surface-variant)] block">
            STACK EN PRODUCCIÓN // VERIFIED DEPENDENCIES
          </span>
          <ul role="list" className="flex flex-wrap gap-1.5">
            {system.stackTags.map((tag) => (
              <li
                key={tag}
                className="px-2.5 py-1 border border-[var(--outline-variant)] bg-[var(--surface-container-high)] text-[var(--primary)] rounded-[2px] mono-label"
              >
                {tag}
              </li>
            ))}
          </ul>
        </div>
      </div>

      {/* Actions */}
      <div className="flex flex-wrap items-center gap-3 pt-2 border-t border-[var(--outline-variant)]">
        <Link
          href={system.detailHref}
          aria-label={`Detalle de Arquitectura — ${system.title}`}
          className="px-4 py-2.5 bg-[var(--primary)] text-[var(--background)] rounded-[2px] mono-label hover:opacity-90 transition-opacity focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[var(--secondary)]"
        >
          Detalle de Arquitectura →
        </Link>
        <a
          href={system.detailHref}
          aria-label={`Inspeccionar Caso de Estudio — ${system.title}`}
          className="px-4 py-2.5 border border-[var(--outline-variant)] bg-[var(--surface-container-lowest)] text-[var(--primary)] rounded-[2px] mono-label hover:bg-[var(--surface-container-high)] transition-colors focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[var(--secondary)]"
        >
          Inspeccionar Caso de Estudio
        </a>
      </div>
    </div>
  );
}

export function ProductionSystemsSection({
  systems
}: ProductionSystemsSectionProps) {
  const [selectedCategory, setSelectedCategory] = useState<
    ProductionSystemCategory | "all"
  >("all");

  const visibleSystems =
    selectedCategory === "all"
      ? systems
      : systems.filter((sys) => sys.category === selectedCategory);

  const primaryVisible = visibleSystems.filter(
    (sys) =>
      sys.layoutVariant === "primary-7-5" || sys.layoutVariant === "primary-5-7"
  );
  const secondaryVisible = visibleSystems.filter(
    (sys) => sys.layoutVariant === "secondary-split"
  );

  return (
    <section
      id="proyectos-destacados"
      aria-labelledby="production-systems-heading"
      className="border-b border-[var(--outline-variant)] py-16 lg:py-24 bg-[var(--background)]"
    >
      <div className="swiss-container space-y-12">
        {/* Section Header + Category Filter Bar */}
        <div className="flex flex-col lg:flex-row lg:items-end justify-between gap-6 border-b border-[var(--outline-variant)] pb-6">
          <div className="space-y-2">
            <p className="mono-label text-[var(--secondary)]">
              01 // CATÁLOGO OPERACIONAL DE INGENIERÍA
            </p>
            <h2
              id="production-systems-heading"
              className="font-display text-3xl sm:text-4xl font-semibold tracking-tight text-[var(--primary)]"
            >
              Sistemas Reales en Producción
            </h2>
            <p className="text-sm sm:text-base text-[var(--on-surface-variant)] max-w-2xl">
              Arquitecturas distribuidas, pasarelas de inferencia IA, gobernanza agéntica determinista e infraestructura auto-alojada en Ubuntu Linux.
            </p>
          </div>

          <div
            role="group"
            aria-label="Filtrar sistemas en producción por dominio técnico"
            className="flex flex-wrap gap-2"
          >
            {CATEGORY_FILTERS.map((filter) => {
              const isSelected = selectedCategory === filter.id;
              return (
                <button
                  key={filter.id}
                  type="button"
                  aria-pressed={isSelected}
                  onClick={() => setSelectedCategory(filter.id)}
                  className={`px-3 py-2 border rounded-[2px] mono-label transition-colors cursor-pointer focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[var(--secondary)] ${
                    isSelected
                      ? "border-[var(--primary)] bg-[var(--primary)] text-[var(--background)]"
                      : "border-[var(--outline-variant)] bg-[var(--surface-container-low)] text-[var(--primary)] hover:bg-[var(--surface-container-high)]"
                  }`}
                >
                  {filter.label}
                </button>
              );
            })}
          </div>
        </div>

        {/* Primary Systems (12-Column Alternating 7/5 and 5/7 Stitch Layout) */}
        {primaryVisible.length > 0 && (
          <div className="space-y-12">
            {primaryVisible.map((system) => {
              const isInverted = system.layoutVariant === "primary-5-7";
              return (
                <article
                  key={system.id}
                  aria-label={`Sistema principal ${system.order}: ${system.title}`}
                  className="grid grid-cols-1 lg:grid-cols-12 gap-6 lg:gap-8 items-stretch"
                >
                  {isInverted ? (
                    <>
                      <div className="lg:col-span-5">
                        <SystemSpecificationColumn system={system} />
                      </div>
                      <div className="lg:col-span-7">
                        <SystemVisualTelemetryFrame system={system} />
                      </div>
                    </>
                  ) : (
                    <>
                      <div className="lg:col-span-7">
                        <SystemVisualTelemetryFrame system={system} />
                      </div>
                      <div className="lg:col-span-5">
                        <SystemSpecificationColumn system={system} />
                      </div>
                    </>
                  )}
                </article>
              );
            })}
          </div>
        )}

        {/* Secondary Systems Split Row (2 Equal Columns: System 03 & System 04) */}
        {secondaryVisible.length > 0 && (
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 items-stretch">
            {secondaryVisible.map((system) => (
              <article
                key={system.id}
                aria-label={`Sistema especializado ${system.order}: ${system.title}`}
                className="border border-[var(--outline-variant)] bg-[var(--surface-container-low)] p-6 sm:p-7 rounded-[2px] flex flex-col justify-between gap-6"
              >
                <div className="space-y-4">
                  <div className="flex flex-wrap items-center justify-between gap-2 border-b border-[var(--outline-variant)] pb-3">
                    <span className="mono-label text-[var(--secondary)]">
                      {system.order} // {system.categoryLabel}
                    </span>
                    <span className="px-2.5 py-1 border border-[var(--outline-variant)] bg-[var(--surface-container-lowest)] rounded-[2px] mono-label text-[var(--tertiary-fixed)]">
                      {system.liveMetricPill}
                    </span>
                  </div>

                  <h3 className="font-display text-2xl font-semibold tracking-tight text-[var(--primary)]">
                    {system.title}
                  </h3>

                  <p className="text-sm font-medium text-[var(--primary)]">
                    {system.subtitle}
                  </p>

                  <p className="text-sm text-[var(--on-surface-variant)] leading-relaxed">
                    {system.summary}
                  </p>

                  {/* Compact Metrics Grid */}
                  <dl className="grid grid-cols-2 gap-2.5 pt-1">
                    {system.metrics.slice(0, 4).map((metric) => (
                      <div
                        key={metric.label}
                        className="border border-[var(--outline-variant)] bg-[var(--surface-container-lowest)] p-3 rounded-[2px]"
                      >
                        <dt className="mono-label text-[var(--on-surface-variant)]">
                          {metric.label}
                        </dt>
                        <dd className="font-display text-base font-semibold text-[var(--primary)] mt-1">
                          {metric.value}
                        </dd>
                        <dd className="mono-label text-[var(--secondary)] mt-0.5">
                          {metric.deltaOrTarget}
                        </dd>
                      </div>
                    ))}
                  </dl>

                  {/* Terminal Trace Preview */}
                  <div className="border border-[var(--outline-variant)] bg-[var(--surface-container-lowest)] p-3 rounded-[2px] space-y-1 overflow-x-auto">
                    {system.terminalPreviewLines.slice(0, 2).map((line) => (
                      <p
                        key={line}
                        className="mono-code text-xs text-[var(--on-surface-variant)] whitespace-nowrap"
                      >
                        {line}
                      </p>
                    ))}
                  </div>

                  {/* Stack Chips */}
                  <ul role="list" className="flex flex-wrap gap-1.5 pt-1">
                    {system.stackTags.map((tag) => (
                      <li
                        key={tag}
                        className="px-2.5 py-1 border border-[var(--outline-variant)] bg-[var(--surface-container-high)] text-[var(--primary)] rounded-[2px] mono-label"
                      >
                        {tag}
                      </li>
                    ))}
                  </ul>
                </div>

                <div className="flex flex-wrap items-center justify-between gap-3 border-t border-[var(--outline-variant)] pt-4">
                  <span className="mono-label text-[var(--on-surface-variant)]">
                    {system.status}
                  </span>
                  <Link
                    href={system.detailHref}
                    aria-label={`Detalle de Arquitectura — ${system.title}`}
                    className="px-4 py-2 bg-[var(--primary)] text-[var(--background)] rounded-[2px] mono-label hover:opacity-90 transition-opacity focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[var(--secondary)]"
                  >
                    Detalle de Arquitectura →
                  </Link>
                </div>
              </article>
            ))}
          </div>
        )}
      </div>
    </section>
  );
}
