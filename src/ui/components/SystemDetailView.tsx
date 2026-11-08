import React from "react";
import Link from "next/link";
import type { SystemDeepDiveSnapshot } from "@/types/portfolio";
import { CodeInspectorTabs } from "@/ui/components/CodeInspectorTabs";

export interface SystemDetailViewProps {
  deepDive: SystemDeepDiveSnapshot;
}

export function SystemDetailView({ deepDive }: SystemDetailViewProps) {
  const { system, previousSystem, nextSystem } = deepDive;
  const specsTableCaptionId = `specs-caption-${system.slug}`;

  return (
    <article
      aria-labelledby="system-detail-heading"
      className="bg-[var(--background)] text-[var(--primary)]"
    >
      {/* 1. Telemetry Breadcrumb Bar */}
      <nav
        aria-label="Ruta de retorno y estado del sistema"
        className="border-b border-[var(--outline-variant)] bg-[var(--surface-container-low)]"
      >
        <div className="swiss-container py-3 flex flex-wrap items-center justify-between gap-4">
          <div className="flex flex-wrap items-center gap-3">
            <Link
              href="/#proyectos-destacados"
              className="inline-flex items-center gap-2 px-3 py-1.5 border border-[var(--outline-variant)] bg-[var(--surface-container-lowest)] hover:bg-[var(--surface-container-high)] text-[var(--primary)] rounded-[2px] mono-label transition-colors focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[var(--secondary)]"
            >
              ← CATÁLOGO DE SISTEMAS
            </Link>
            <span className="text-[var(--outline-variant)]" aria-hidden="true">
              /
            </span>
            <span className="mono-label text-[var(--on-surface-variant)]">
              DEKOLABS.ORG
            </span>
            <span className="text-[var(--outline-variant)]" aria-hidden="true">
              /
            </span>
            <span className="mono-label text-[var(--secondary)]">
              SYS-{system.order} ({system.slug.toUpperCase()})
            </span>
          </div>

          <div className="flex flex-wrap items-center gap-2.5">
            <span className="inline-flex items-center gap-2 px-2.5 py-1 border border-[var(--outline-variant)] bg-[var(--surface-container-lowest)] rounded-[2px] mono-label text-[var(--tertiary-fixed)]">
              <span
                aria-hidden="true"
                className="h-2 w-2 rounded-full bg-[var(--tertiary-fixed)]"
              />
              {system.status}
            </span>
            <span className="px-2.5 py-1 border border-[var(--outline-variant)] bg-[var(--surface-container-lowest)] rounded-[2px] mono-label text-[var(--primary)]">
              {system.deploymentLedger.verificationGate}
            </span>
          </div>
        </div>
      </nav>

      {/* 2. System Hero + Deployment Metadata Ledger */}
      <section
        aria-labelledby="system-detail-heading"
        className="border-b border-[var(--outline-variant)] py-12 lg:py-16"
      >
        <div className="swiss-container grid grid-cols-1 lg:grid-cols-12 gap-8 lg:gap-10 items-start">
          {/* Left 8 Columns: Case Study Narrative */}
          <div className="lg:col-span-8 space-y-6">
            <div className="flex flex-wrap items-center gap-2.5">
              <span className="px-2.5 py-1 border border-[var(--outline-variant)] bg-[var(--surface-container-low)] rounded-[2px] mono-label text-[var(--secondary)]">
                CASO DE ESTUDIO // SISTEMA {system.order}
              </span>
              <span className="px-2.5 py-1 border border-[var(--outline-variant)] bg-[var(--surface-container-low)] rounded-[2px] mono-label text-[var(--primary)]">
                {system.categoryLabel}
              </span>
              <span className="px-2.5 py-1 border border-[var(--outline-variant)] bg-[var(--surface-container-lowest)] rounded-[2px] mono-label text-[var(--tertiary-fixed)]">
                {system.liveMetricPill}
              </span>
            </div>

            <h1
              id="system-detail-heading"
              className="font-display text-3xl sm:text-5xl font-semibold tracking-tight text-[var(--primary)] leading-[1.08]"
            >
              {system.title}
            </h1>

            <p className="font-display text-lg sm:text-xl font-medium text-[var(--primary)] leading-snug">
              {system.subtitle}
            </p>

            <div className="space-y-4 pt-2 border-t border-[var(--outline-variant)]">
              <p className="text-base text-[var(--on-surface-variant)] leading-relaxed">
                {system.summary}
              </p>
              <p className="text-sm sm:text-base text-[var(--on-surface-variant)] leading-relaxed">
                {system.architecturalNarrative}
              </p>
            </div>

            <div className="flex flex-wrap items-center gap-3 pt-2">
              <a
                href="#topologia-pipeline"
                className="px-4 py-2.5 bg-[var(--primary)] text-[var(--background)] rounded-[2px] mono-label hover:opacity-90 transition-opacity focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[var(--secondary)]"
              >
                Inspeccionar Topología 3 Etapas
              </a>
              <a
                href="#inspector-codigo"
                className="px-4 py-2.5 border border-[var(--outline-variant)] bg-[var(--surface-container-low)] hover:bg-[var(--surface-container-high)] text-[var(--primary)] rounded-[2px] mono-label transition-colors focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[var(--secondary)]"
              >
                Ver Código Fuente ({system.codeTabs.length} Archivos)
              </a>
              <Link
                href="/#contacto"
                className="px-4 py-2.5 border border-[var(--outline-variant)] bg-[var(--surface-container-lowest)] hover:bg-[var(--surface-container-high)] text-[var(--secondary)] rounded-[2px] mono-label transition-colors focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[var(--secondary)]"
              >
                Solicitar Implementación Similar →
              </Link>
            </div>
          </div>

          {/* Right 4 Columns: Deployment Metadata Ledger */}
          <aside
            aria-label="Ledger de metadata de despliegue"
            className="lg:col-span-4 border border-[var(--outline-variant)] bg-[var(--surface-container-low)] p-6 rounded-[2px] space-y-5"
          >
            <div className="flex items-center justify-between border-b border-[var(--outline-variant)] pb-3">
              <span className="mono-label text-[var(--primary)]">
                DEPLOYMENT METADATA LEDGER
              </span>
              <span className="mono-label text-[var(--tertiary-fixed)]">
                VERIFIED
              </span>
            </div>

            <dl className="space-y-3">
              <div className="border border-[var(--outline-variant)] bg-[var(--surface-container-lowest)] p-3 rounded-[2px]">
                <dt className="mono-label text-[var(--on-surface-variant)]">
                  ARCHITECTURE PATTERN
                </dt>
                <dd className="mono-code text-xs sm:text-sm font-medium text-[var(--primary)] mt-1">
                  {system.deploymentLedger.architecturePattern}
                </dd>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div className="border border-[var(--outline-variant)] bg-[var(--surface-container-lowest)] p-3 rounded-[2px]">
                  <dt className="mono-label text-[var(--on-surface-variant)]">
                    COMMIT SHA
                  </dt>
                  <dd className="mono-code text-xs sm:text-sm font-semibold text-[var(--secondary)] mt-1">
                    {system.deploymentLedger.commitSha}
                  </dd>
                </div>

                <div className="border border-[var(--outline-variant)] bg-[var(--surface-container-lowest)] p-3 rounded-[2px]">
                  <dt className="mono-label text-[var(--on-surface-variant)]">
                    GATE STATUS
                  </dt>
                  <dd className="mono-code text-xs sm:text-sm font-semibold text-[var(--tertiary-fixed)] mt-1">
                    {system.deploymentLedger.verificationGate}
                  </dd>
                </div>
              </div>

              <div className="border border-[var(--outline-variant)] bg-[var(--surface-container-lowest)] p-3 rounded-[2px]">
                <dt className="mono-label text-[var(--on-surface-variant)]">
                  HOST OS & RUNTIME ENGINE
                </dt>
                <dd className="mono-code text-xs sm:text-sm text-[var(--primary)] mt-1">
                  {system.deploymentLedger.hostEnvironment}
                </dd>
              </div>

              <div className="border border-[var(--outline-variant)] bg-[var(--surface-container-lowest)] p-3 rounded-[2px]">
                <dt className="mono-label text-[var(--on-surface-variant)]">
                  CANONICAL PRODUCTION URI
                </dt>
                <dd className="mono-code text-xs text-[var(--on-surface-variant)] break-all mt-1">
                  {system.liveUrl}
                </dd>
              </div>
            </dl>

            <div className="space-y-2 border-t border-[var(--outline-variant)] pt-4">
              <span className="mono-label text-[var(--on-surface-variant)] block">
                STACK TECNOLÓGICO AUDITADO
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
          </aside>
        </div>
      </section>

      {/* 3. System 4-KPI Grid */}
      <section
        aria-label="Indicadores clave de rendimiento del sistema"
        className="border-b border-[var(--outline-variant)] bg-[var(--surface-container-low)] py-10"
      >
        <div className="swiss-container">
          <dl className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-5">
            {system.metrics.map((metric, idx) => (
              <div
                key={metric.label}
                className="border border-[var(--outline-variant)] bg-[var(--surface-container-lowest)] p-5 rounded-[2px] flex flex-col justify-between gap-3"
              >
                <div className="flex items-center justify-between">
                  <dt className="mono-label text-[var(--on-surface-variant)]">
                    {metric.label}
                  </dt>
                  <span className="mono-label text-[var(--secondary)]">
                    M-0{idx + 1}
                  </span>
                </div>
                <dd className="font-display text-2xl sm:text-3xl font-semibold text-[var(--primary)]">
                  {metric.value}
                </dd>
                <dd className="mono-label text-[var(--tertiary-fixed)] border-t border-[var(--outline-variant)] pt-2.5">
                  {metric.deltaOrTarget}
                </dd>
              </div>
            ))}
          </dl>
        </div>
      </section>

      {/* 4. Command & Diagnostic Console */}
      <section
        aria-labelledby="diagnostic-console-heading"
        className="border-b border-[var(--outline-variant)] py-14 lg:py-16"
      >
        <div className="swiss-container space-y-6">
          <div className="flex flex-col sm:flex-row sm:items-end justify-between gap-4">
            <div className="space-y-1.5">
              <p className="mono-label text-[var(--secondary)]">
                01 // CONSOLA DE MANDO Y DIAGNÓSTICO EN TIEMPO REAL
              </p>
              <h2
                id="diagnostic-console-heading"
                className="font-display text-2xl sm:text-3xl font-semibold tracking-tight text-[var(--primary)]"
              >
                Trazabilidad Operativa y Telemetría de Ejecución
              </h2>
            </div>
            <span className="mono-label text-[var(--tertiary-fixed)]">
              STREAM STATUS: ACTIVE · ZERO PACKET LOSS
            </span>
          </div>

          <div className="border border-[var(--outline-variant)] bg-[var(--surface-container-lowest)] rounded-[2px] overflow-hidden">
            {/* Console Top Bar */}
            <div className="px-4 py-3 border-b border-[var(--outline-variant)] bg-[var(--surface-container-low)] flex flex-wrap items-center justify-between gap-3">
              <div className="flex items-center gap-2">
                <span
                  aria-hidden="true"
                  className="h-2.5 w-2.5 rounded-full bg-[var(--tertiary-fixed)]"
                />
                <span className="mono-label text-[var(--primary)]">
                  TTY // {system.slug.toUpperCase()} · {system.deploymentLedger.hostEnvironment}
                </span>
              </div>
              <div className="flex items-center gap-3">
                <span className="mono-label text-[var(--on-surface-variant)]">
                  REV: {system.deploymentLedger.commitSha}
                </span>
                <span className="mono-label text-[var(--secondary)]">
                  {system.liveMetricPill}
                </span>
              </div>
            </div>

            {/* Console Output Lines */}
            <div className="p-5 sm:p-6 space-y-2.5 bg-[var(--surface-container-lowest)] overflow-x-auto">
              {system.terminalPreviewLines.map((line, index) => (
                <div
                  key={line}
                  className="flex items-start gap-3 mono-code text-xs sm:text-sm text-[var(--primary)] whitespace-nowrap"
                >
                  <span
                    aria-hidden="true"
                    className="select-none text-[var(--secondary)] font-semibold"
                  >
                    0{index + 1} &gt;
                  </span>
                  <span>{line}</span>
                </div>
              ))}
              <div className="flex items-center gap-3 mono-code text-xs text-[var(--tertiary-fixed)] pt-2 border-t border-[var(--outline-variant)]">
                <span aria-hidden="true">04 &gt;</span>
                <span>
                  [INVARIANT-CHECK] 6-Layer directional boundaries verified · Pass-State Gating 100/100 · Ready for inspection
                </span>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* 5. Pipeline Topology & 3-Stage Architecture Mechanics */}
      <section
        id="topologia-pipeline"
        aria-labelledby="pipeline-topology-heading"
        className="border-b border-[var(--outline-variant)] bg-[var(--surface-container-low)] py-14 lg:py-20"
      >
        <div className="swiss-container space-y-10">
          <div className="flex flex-col lg:flex-row lg:items-end justify-between gap-4 border-b border-[var(--outline-variant)] pb-6">
            <div className="space-y-2">
              <p className="mono-label text-[var(--secondary)]">
                02 // TOPOLOGÍA DEL PIPELINE Y MECÁNICA DE ARQUITECTURA
              </p>
              <h2
                id="pipeline-topology-heading"
                className="font-display text-2xl sm:text-3xl font-semibold tracking-tight text-[var(--primary)]"
              >
                Flujo Determinista en 3 Etapas Verificadas
              </h2>
            </div>
            <p className="mono-label text-[var(--on-surface-variant)]">
              PATRÓN: {system.deploymentLedger.architecturePattern.toUpperCase()}
            </p>
          </div>

          <ol
            role="list"
            className="grid grid-cols-1 lg:grid-cols-3 gap-6 items-stretch"
          >
            {system.pipelineStages.map((stage) => (
              <li
                key={stage.stageNumber}
                className="border border-[var(--outline-variant)] bg-[var(--surface-container-lowest)] p-6 rounded-[2px] flex flex-col justify-between gap-6"
              >
                <div className="space-y-4">
                  <div className="flex items-center justify-between gap-2 border-b border-[var(--outline-variant)] pb-3">
                    <span className="px-2.5 py-1 border border-[var(--outline-variant)] bg-[var(--surface-container-low)] rounded-[2px] mono-label text-[var(--secondary)]">
                      {stage.stageNumber}
                    </span>
                    <span className="mono-label text-[var(--tertiary-fixed)]">
                      SLO // {stage.latencyOrSlo}
                    </span>
                  </div>

                  <h3 className="font-display text-xl font-semibold text-[var(--primary)] leading-snug">
                    {stage.title}
                  </h3>

                  <p className="text-sm text-[var(--on-surface-variant)] leading-relaxed">
                    {stage.description}
                  </p>
                </div>

                <div className="border-t border-[var(--outline-variant)] pt-4 space-y-2">
                  <span className="mono-label text-[var(--primary)] block">
                    INVARIANTES DE ETAPA // FAIL-CLOSED
                  </span>
                  <ul role="list" className="space-y-1.5">
                    {stage.invariants.map((inv) => (
                      <li
                        key={inv}
                        className="text-xs text-[var(--on-surface-variant)] flex items-start gap-2"
                      >
                        <span
                          aria-hidden="true"
                          className="text-[var(--tertiary-fixed)] font-mono font-bold"
                        >
                          ✓
                        </span>
                        <span>{inv}</span>
                      </li>
                    ))}
                  </ul>
                </div>
              </li>
            ))}
          </ol>
        </div>
      </section>

      {/* 6. Technical Specification Table + Interactive Code Inspector */}
      <section
        id="inspector-codigo"
        aria-labelledby="specs-and-code-heading"
        className="border-b border-[var(--outline-variant)] py-14 lg:py-20"
      >
        <div className="swiss-container space-y-10">
          <div className="space-y-2 border-b border-[var(--outline-variant)] pb-6">
            <p className="mono-label text-[var(--secondary)]">
              03 // MATRIZ TÉCNICA E INSPECTOR INTERACTIVO DE CÓDIGO
            </p>
            <h2
              id="specs-and-code-heading"
              className="font-display text-2xl sm:text-3xl font-semibold tracking-tight text-[var(--primary)]"
            >
              Especificaciones de Arquitectura e Implementación Real
            </h2>
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-stretch">
            {/* Left 5 Columns: Accessible Responsive Specification Table */}
            <div className="lg:col-span-5 flex flex-col justify-between gap-6 border border-[var(--outline-variant)] bg-[var(--surface-container-low)] p-6 rounded-[2px]">
              <div className="space-y-4">
                <div className="flex items-center justify-between border-b border-[var(--outline-variant)] pb-3">
                  <span className="mono-label text-[var(--primary)]">
                    TABLA DE ESPECIFICACIONES TÉCNICAS
                  </span>
                  <span className="mono-label text-[var(--secondary)]">
                    6-LAYER COMPLIANT
                  </span>
                </div>

                <div
                  tabIndex={0}
                  role="region"
                  aria-labelledby={specsTableCaptionId}
                  className="overflow-x-auto border border-[var(--outline-variant)] bg-[var(--surface-container-lowest)] rounded-[2px] focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[var(--secondary)]"
                >
                  <table className="w-full text-left border-collapse">
                    <caption
                      id={specsTableCaptionId}
                      className="sr-only"
                    >
                      Especificaciones técnicas de arquitectura para {system.title}
                    </caption>
                    <thead className="sticky top-0 z-10 bg-[var(--surface-container-low)] border-b border-[var(--outline-variant)]">
                      <tr>
                        <th
                          scope="col"
                          className="p-3 mono-label text-[var(--on-surface-variant)]"
                        >
                          DIMENSIÓN
                        </th>
                        <th
                          scope="col"
                          className="p-3 mono-label text-[var(--on-surface-variant)]"
                        >
                          ESPECIFICACIÓN VERIFICADA
                        </th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-[var(--outline-variant)]">
                      {system.architectureSpecs.map((spec) => (
                        <tr key={spec.label}>
                          <th
                            scope="row"
                            className="sticky left-0 bg-[var(--surface-container-lowest)] p-3 mono-label text-[var(--primary)] align-top whitespace-nowrap"
                          >
                            {spec.label}
                          </th>
                          <td className="p-3 mono-code text-xs text-[var(--on-surface-variant)] align-top">
                            {spec.value}
                          </td>
                        </tr>
                      ))}
                      <tr>
                        <th
                          scope="row"
                          className="sticky left-0 bg-[var(--surface-container-lowest)] p-3 mono-label text-[var(--primary)] align-top whitespace-nowrap"
                        >
                          HOST / ENTORNO
                        </th>
                        <td className="p-3 mono-code text-xs text-[var(--on-surface-variant)] align-top">
                          {system.deploymentLedger.hostEnvironment}
                        </td>
                      </tr>
                      <tr>
                        <th
                          scope="row"
                          className="sticky left-0 bg-[var(--surface-container-lowest)] p-3 mono-label text-[var(--primary)] align-top whitespace-nowrap"
                        >
                          AUDITORÍA ARNÉS
                        </th>
                        <td className="p-3 mono-code text-xs text-[var(--tertiary-fixed)] font-medium align-top">
                          {system.deploymentLedger.verificationGate}
                        </td>
                      </tr>
                    </tbody>
                  </table>
                </div>
              </div>

              <div className="border-t border-[var(--outline-variant)] pt-4 space-y-2">
                <p className="mono-label text-[var(--primary)]">
                  GARANTÍA ARQUITECTÓNICA DE 6 CAPAS
                </p>
                <p className="text-xs text-[var(--on-surface-variant)] leading-relaxed">
                  Los extractos del inspector muestran contratos reales desacoplados bajo el flujo direccional{" "}
                  <code className="mono-code text-[var(--primary)]">
                    Types -&gt; Config -&gt; Repo -&gt; Service -&gt; Runtime -&gt; UI
                  </code>
                  .
                </p>
              </div>
            </div>

            {/* Right 7 Columns: Interactive Code Inspector */}
            <div className="lg:col-span-7">
              <CodeInspectorTabs
                systemTitle={system.title}
                tabs={system.codeTabs}
              />
            </div>
          </div>
        </div>
      </section>

      {/* 7. 3 Solved Engineering Challenges */}
      <section
        aria-labelledby="solved-challenges-heading"
        className="border-b border-[var(--outline-variant)] bg-[var(--surface-container-low)] py-14 lg:py-20"
      >
        <div className="swiss-container space-y-10">
          <div className="space-y-2 border-b border-[var(--outline-variant)] pb-6">
            <p className="mono-label text-[var(--secondary)]">
              04 // DESAFÍOS DE INGENIERÍA RESUELTOS EN PRODUCCIÓN
            </p>
            <h2
              id="solved-challenges-heading"
              className="font-display text-2xl sm:text-3xl font-semibold tracking-tight text-[var(--primary)]"
            >
              Decisiones Técnicas y Resultados Medibles
            </h2>
          </div>

          <ol
            role="list"
            className="grid grid-cols-1 lg:grid-cols-3 gap-6 items-stretch"
          >
            {system.solvedChallenges.map((challenge) => (
              <li
                key={challenge.number}
                className="border border-[var(--outline-variant)] bg-[var(--surface-container-lowest)] p-6 rounded-[2px] flex flex-col justify-between gap-6"
              >
                <div className="space-y-4">
                  <div className="flex items-center justify-between border-b border-[var(--outline-variant)] pb-3">
                    <span className="mono-label text-[var(--secondary)]">
                      DESAFÍO // {challenge.number}
                    </span>
                    <span className="mono-label text-[var(--tertiary-fixed)]">
                      RESUELTO EN PROD
                    </span>
                  </div>

                  <h3 className="font-display text-xl font-semibold text-[var(--primary)] leading-snug">
                    {challenge.title}
                  </h3>

                  <div className="space-y-3 pt-1">
                    <div>
                      <p className="mono-label text-[var(--on-surface-variant)]">
                        PROBLEMA TÉCNICO
                      </p>
                      <p className="text-sm text-[var(--on-surface-variant)] leading-relaxed mt-1">
                        {challenge.problem}
                      </p>
                    </div>

                    <div>
                      <p className="mono-label text-[var(--primary)]">
                        SOLUCIÓN ARQUITECTÓNICA
                      </p>
                      <p className="text-sm text-[var(--primary)] leading-relaxed mt-1">
                        {challenge.solution}
                      </p>
                    </div>
                  </div>
                </div>

                <div className="border-t border-[var(--outline-variant)] pt-3.5">
                  <span className="mono-label text-[var(--on-surface-variant)] block">
                    IMPACTO VERIFICADO
                  </span>
                  <p className="mono-code text-xs sm:text-sm font-semibold text-[var(--tertiary-fixed)] mt-1">
                    {challenge.impactMetric}
                  </p>
                </div>
              </li>
            ))}
          </ol>
        </div>
      </section>

      {/* 8. Sequential System Navigation & Commercial Conversion Strip */}
      <nav
        aria-label="Navegación entre casos de estudio de sistemas"
        className="py-12 lg:py-16 bg-[var(--background)]"
      >
        <div className="swiss-container space-y-8">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <Link
              href={previousSystem.detailHref}
              className="group border border-[var(--outline-variant)] bg-[var(--surface-container-low)] hover:bg-[var(--surface-container-high)] p-6 rounded-[2px] transition-colors flex flex-col justify-between gap-2 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[var(--secondary)]"
            >
              <span className="mono-label text-[var(--on-surface-variant)]">
                ← SISTEMA ANTERIOR ({previousSystem.order})
              </span>
              <span className="font-display text-lg sm:text-xl font-semibold text-[var(--primary)]">
                {previousSystem.title}
              </span>
              <span className="mono-label text-[var(--secondary)]">
                {previousSystem.categoryLabel}
              </span>
            </Link>

            <Link
              href={nextSystem.detailHref}
              className="group border border-[var(--outline-variant)] bg-[var(--surface-container-low)] hover:bg-[var(--surface-container-high)] p-6 rounded-[2px] transition-colors flex flex-col justify-between gap-2 md:text-right focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[var(--secondary)]"
            >
              <span className="mono-label text-[var(--on-surface-variant)]">
                SIGUIENTE SISTEMA ({nextSystem.order}) →
              </span>
              <span className="font-display text-lg sm:text-xl font-semibold text-[var(--primary)]">
                {nextSystem.title}
              </span>
              <span className="mono-label text-[var(--secondary)]">
                {nextSystem.categoryLabel}
              </span>
            </Link>
          </div>
        </div>
      </nav>
    </article>
  );
}
