import React from "react";
import { getAgenticStackSnapshot } from "@/service/agentic-stack.service";
import { getSiteFoundationSnapshot } from "@/service/site.service";
import { getSystemsCatalogSnapshot } from "@/service/systems.service";
import { AgenticOrchestrationSection } from "@/ui/components/AgenticOrchestrationSection";
import { AppShell } from "@/ui/components/AppShell";
import { BenchmarksStrip } from "@/ui/components/BenchmarksStrip";
import { HeroSection } from "@/ui/components/HeroSection";
import { ProductionSystemsSection } from "@/ui/components/ProductionSystemsSection";
import { TechStackMatrix } from "@/ui/components/TechStackMatrix";

export default function HomePage() {
  const siteSnapshot = getSiteFoundationSnapshot();
  const catalogSnapshot = getSystemsCatalogSnapshot();
  const agenticStackSnapshot = getAgenticStackSnapshot();

  const {
    identity,
    navigation,
    ambientTelemetry,
    defaultTheme
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

      {/* 4. Agentic Orchestration, 6-Layer Architecture & Harness Engineering v2.1 */}
      <AgenticOrchestrationSection
        domain={identity.domain}
        architectureLayers={agenticStackSnapshot.architectureLayers}
        makerCheckerSpec={agenticStackSnapshot.makerCheckerSpec}
        workflowNodes={agenticStackSnapshot.workflowNodes}
        verificationGates={agenticStackSnapshot.verificationGates}
        mcpBridges={agenticStackSnapshot.mcpBridges}
      />

      {/* 5. Commercial Tech Stack Matrix & Delivery Blueprints */}
      <TechStackMatrix
        categories={agenticStackSnapshot.stackCategories}
        capabilities={agenticStackSnapshot.stackCapabilities}
        commercialBlueprints={agenticStackSnapshot.commercialBlueprints}
      />

      {/* 6. Home Lab Telemetry & Direct Advisory Anchors */}
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
