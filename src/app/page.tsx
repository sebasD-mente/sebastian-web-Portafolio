import React from "react";
import { getSiteFoundationSnapshot } from "@/service/site.service";
import { AppShell } from "@/ui/components/AppShell";

export default function HomePage() {
  const snapshot = getSiteFoundationSnapshot();
  const {
    identity,
    navigation,
    ambientTelemetry,
    defaultTheme,
    architectureLayers
  } = snapshot;

  return (
    <AppShell
      identity={identity}
      navigation={navigation}
      ambientTelemetry={ambientTelemetry}
      defaultTheme={defaultTheme}
    >
      {/* Hero Foundation & Ambient Ledger */}
      <section className="border-b border-[var(--outline-variant)] py-16 lg:py-24">
        <div className="swiss-container grid grid-cols-1 lg:grid-cols-12 gap-10 items-start">
          <div className="lg:col-span-8 space-y-6">
            <div className="inline-flex items-center gap-2 px-3 py-1 border border-[var(--outline-variant)] bg-[var(--surface-container-low)] rounded-[2px]">
              <span className="mono-label text-[var(--secondary)]">
                ATELIER MONOLITH // {identity.domain.toUpperCase()}
              </span>
            </div>

            <h1 className="font-display text-4xl sm:text-5xl lg:text-6xl font-semibold tracking-tight leading-[1.06] text-[var(--primary)]">
              {identity.tagline}
            </h1>

            <p className="text-base sm:text-lg text-[var(--on-surface-variant)] max-w-3xl leading-relaxed">
              {identity.summary}
            </p>

            <div className="flex flex-wrap items-center gap-4 pt-2">
              <a
                href={identity.primaryCtaHref}
                className="px-5 py-3 bg-[var(--primary)] text-[var(--background)] rounded-[2px] mono-label hover:opacity-90 transition-opacity"
              >
                {identity.primaryCtaLabel}
              </a>
              <a
                href={identity.secondaryCtaHref}
                className="px-5 py-3 border border-[var(--outline-variant)] bg-[var(--surface-container-low)] text-[var(--primary)] rounded-[2px] mono-label hover:bg-[var(--surface-container-high)] transition-colors"
              >
                {identity.secondaryCtaLabel}
              </a>
            </div>
          </div>

          <aside
            aria-label="Estado del nodo y telemetría de arranque"
            className="lg:col-span-4 border border-[var(--outline-variant)] bg-[var(--surface-container-low)] p-6 rounded-[2px] space-y-4"
          >
            <div className="flex items-center justify-between border-b border-[var(--outline-variant)] pb-3">
              <span className="mono-label text-[var(--primary)]">
                KERNEL &amp; HOME LAB TELEMETRY
              </span>
              <span className="mono-label text-[var(--tertiary-fixed)]">
                {ambientTelemetry.status}
              </span>
            </div>

            <dl className="space-y-3 mono-code">
              <div className="flex justify-between gap-2">
                <dt className="text-[var(--on-surface-variant)]">NODE</dt>
                <dd className="text-[var(--primary)] font-medium">
                  {ambientTelemetry.nodeId}
                </dd>
              </div>
              <div className="flex justify-between gap-2">
                <dt className="text-[var(--on-surface-variant)]">RUNTIME</dt>
                <dd className="text-[var(--primary)] text-right">
                  {ambientTelemetry.runtimeTarget}
                </dd>
              </div>
              <div className="flex justify-between gap-2">
                <dt className="text-[var(--on-surface-variant)]">GATE SCORE</dt>
                <dd className="text-[var(--secondary)] font-medium">
                  {ambientTelemetry.harnessScore}
                </dd>
              </div>
              <div className="flex justify-between gap-2">
                <dt className="text-[var(--on-surface-variant)]">DEFAULT THEME</dt>
                <dd className="text-[var(--primary)] uppercase">{defaultTheme}</dd>
              </div>
            </dl>
          </aside>
        </div>
      </section>

      {/* 6-Layer Strict Architecture Foundation */}
      <section
        id="orquestacion-agentica"
        className="border-b border-[var(--outline-variant)] py-14"
      >
        <div className="swiss-container space-y-8">
          <div className="flex flex-col sm:flex-row sm:items-end justify-between gap-4">
            <div>
              <p className="mono-label text-[var(--secondary)]">
                ARQUITECTURA VERIFICADA // FLUJO DIRECCIONAL DE 6 CAPAS
              </p>
              <h2 className="font-display text-2xl sm:text-3xl font-medium tracking-tight mt-1">
                Cimiento Estructural de {identity.domain}
              </h2>
            </div>
            <p className="mono-label text-[var(--on-surface-variant)]">
              TYPES -&gt; CONFIG -&gt; REPO -&gt; SERVICE -&gt; RUNTIME -&gt; UI
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {architectureLayers.map((layer) => (
              <article
                key={layer.layer}
                className="border border-[var(--outline-variant)] bg-[var(--surface-container-low)] p-5 rounded-[2px] flex flex-col justify-between gap-4"
              >
                <div className="space-y-2">
                  <div className="flex items-center justify-between">
                    <span className="mono-label text-[var(--secondary)]">
                      CAPA 0{layer.order} // {layer.layer.toUpperCase()}
                    </span>
                    <code className="mono-label px-2 py-0.5 bg-[var(--surface-container-high)] text-[var(--primary)] rounded-[2px]">
                      {layer.folder}
                    </code>
                  </div>
                  <p className="text-sm text-[var(--primary)] font-medium">
                    {layer.responsibility}
                  </p>
                </div>
                <p className="mono-label text-[var(--on-surface-variant)] border-t border-[var(--outline-variant)] pt-3">
                  INVARIANTE: {layer.invariantRule}
                </p>
              </article>
            ))}
          </div>
        </div>
      </section>

      {/* Section Anchors for Upcoming DAG Features */}
      <section
        id="proyectos-destacados"
        className="border-b border-[var(--outline-variant)] py-12"
      >
        <div className="swiss-container grid grid-cols-1 md:grid-cols-3 gap-6">
          <div className="border border-[var(--outline-variant)] bg-[var(--surface-container-lowest)] p-5 rounded-[2px]">
            <p className="mono-label text-[var(--secondary)]">01 // CATÁLOGO OPERACIONAL</p>
            <h3 className="font-display text-lg font-medium mt-1">
              Sistemas en Producción
            </h3>
            <p className="text-sm text-[var(--on-surface-variant)] mt-2">
              Galería técnica de sistemas desplegados con métricas operativas, topología de pipeline e inspección de código.
            </p>
          </div>

          <div
            id="telemetria-homelab"
            className="border border-[var(--outline-variant)] bg-[var(--surface-container-lowest)] p-5 rounded-[2px]"
          >
            <p className="mono-label text-[var(--tertiary-fixed)]">03 // HOME LAB NODE</p>
            <h3 className="font-display text-lg font-medium mt-1">
              Ubuntu Linux Standalone Runtime
            </h3>
            <p className="text-sm text-[var(--on-surface-variant)] mt-2">
              Contenedor Node 22 Alpine de baja huella de memoria (&lt;150MB RAM) operando detrás de Reverse Proxy en {identity.domain}.
            </p>
          </div>

          <div
            id="contacto"
            className="border border-[var(--outline-variant)] bg-[var(--surface-container-lowest)] p-5 rounded-[2px]"
          >
            <p className="mono-label text-[var(--primary)]">04 // CONTRATACIÓN DIRECTA</p>
            <h3 className="font-display text-lg font-medium mt-1">
              Implementación End-to-End &amp; Freelance
            </h3>
            <p className="text-sm text-[var(--on-surface-variant)] mt-2">
              Disponible para contratos de arquitectura de software, sistemas de agentes autónomos e infraestructura dedicada.
            </p>
          </div>
        </div>
      </section>
    </AppShell>
  );
}
