import React from "react";
import { getSiteFoundationSnapshot } from "@/service/site.service";
import { getSystemsCatalogSnapshot } from "@/service/systems.service";
import { AppShell } from "@/ui/components/AppShell";
import { BenchmarksStrip } from "@/ui/components/BenchmarksStrip";
import { HeroSection } from "@/ui/components/HeroSection";
import { ProductionSystemsSection } from "@/ui/components/ProductionSystemsSection";

export default function HomePage() {
  const siteSnapshot = getSiteFoundationSnapshot();
  const catalogSnapshot = getSystemsCatalogSnapshot();

  const {
    identity,
    navigation,
    ambientTelemetry,
    defaultTheme,
    architectureLayers
  } = siteSnapshot;

  const { heroTelemetry, benchmarks, systems } = catalogSnapshot;

  return (
    <AppShell
      identity={identity}
      navigation={navigation}
      ambientTelemetry={ambientTelemetry}
      defaultTheme={defaultTheme}
    >
      {/* 1. Hero Editorial (8 cols) + KERNEL & HOME LAB TELEMETRY Card (4 cols) */}
      <HeroSection
        identity={identity}
        telemetryCard={heroTelemetry}
        defaultTheme={defaultTheme}
      />

      {/* 2. Industrial Benchmarks Strip (4 Verified KPIs) */}
      <BenchmarksStrip benchmarks={benchmarks} />

      {/* 3. Operational Catalog of 4 Production Systems (7/5, 5/7 & 2-Col Split) */}
      <ProductionSystemsSection systems={systems} />

      {/* 4. 6-Layer Strict Architecture Foundation */}
      <section
        id="orquestacion-agentica"
        aria-labelledby="six-layer-architecture-heading"
        className="border-b border-[var(--outline-variant)] py-16 bg-[var(--surface-container-lowest)]"
      >
        <div className="swiss-container space-y-8">
          <div className="flex flex-col sm:flex-row sm:items-end justify-between gap-4">
            <div>
              <p className="mono-label text-[var(--secondary)]">
                02 // ARQUITECTURA VERIFICADA · FLUJO DIRECCIONAL DE 6 CAPAS
              </p>
              <h2
                id="six-layer-architecture-heading"
                className="font-display text-2xl sm:text-3xl font-semibold tracking-tight mt-1 text-[var(--primary)]"
              >
                Cimiento Estructural de {identity.domain}
              </h2>
            </div>
            <p className="mono-label text-[var(--on-surface-variant)]">
              TYPES -&gt; CONFIG -&gt; REPO -&gt; SERVICE -&gt; RUNTIME -&gt; UI
            </p>
          </div>

          <ul
            role="list"
            className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4"
          >
            {architectureLayers.map((layer) => (
              <li
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
              </li>
            ))}
          </ul>
        </div>
      </section>

      {/* 5. Home Lab Telemetry & Direct Advisory Anchors */}
      <section className="border-b border-[var(--outline-variant)] py-14 bg-[var(--background)]">
        <div className="swiss-container grid grid-cols-1 md:grid-cols-2 gap-6">
          <div
            id="telemetria-homelab"
            className="border border-[var(--outline-variant)] bg-[var(--surface-container-low)] p-6 rounded-[2px] space-y-2"
          >
            <p className="mono-label text-[var(--tertiary-fixed)]">
              03 // HOME LAB NODE · {ambientTelemetry.nodeId}
            </p>
            <h3 className="font-display text-xl font-semibold text-[var(--primary)]">
              Ubuntu Linux Standalone Runtime
            </h3>
            <p className="text-sm text-[var(--on-surface-variant)] leading-relaxed">
              Contenedor Node 22 Alpine de baja huella de memoria (&lt;150MB RAM) operando detrás de Reverse Proxy TLS 1.3 en {identity.domain}.
            </p>
          </div>

          <div
            id="contacto"
            className="border border-[var(--outline-variant)] bg-[var(--surface-container-low)] p-6 rounded-[2px] space-y-2"
          >
            <p className="mono-label text-[var(--secondary)]">
              04 // CONTRATACIÓN DIRECTA &amp; ADVISORY
            </p>
            <h3 className="font-display text-xl font-semibold text-[var(--primary)]">
              Implementación End-to-End &amp; Freelance
            </h3>
            <p className="text-sm text-[var(--on-surface-variant)] leading-relaxed">
              Disponible para contratos de arquitectura de software, sistemas de agentes autónomos e infraestructura dedicada.
            </p>
          </div>
        </div>
      </section>
    </AppShell>
  );
}
