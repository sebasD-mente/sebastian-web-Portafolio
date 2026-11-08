import React from "react";
import { getAgenticStackSnapshot } from "@/service/agentic-stack.service";
import { getEngagementModalities } from "@/service/contact.service";
import { getSiteFoundationSnapshot } from "@/service/site.service";
import { getSystemsCatalogSnapshot } from "@/service/systems.service";
import { getHomeLabTelemetrySnapshot } from "@/service/telemetry.service";
import { AgenticOrchestrationSection } from "@/ui/components/AgenticOrchestrationSection";
import { AppShell } from "@/ui/components/AppShell";
import { BenchmarksStrip } from "@/ui/components/BenchmarksStrip";
import { ContactAdvisorySection } from "@/ui/components/ContactAdvisorySection";
import { HeroSection } from "@/ui/components/HeroSection";
import { LiveTerminalSection } from "@/ui/components/LiveTerminalSection";
import { ProductionSystemsSection } from "@/ui/components/ProductionSystemsSection";
import { TechStackMatrix } from "@/ui/components/TechStackMatrix";

export default function HomePage() {
  const siteSnapshot = getSiteFoundationSnapshot();
  const catalogSnapshot = getSystemsCatalogSnapshot();
  const agenticStackSnapshot = getAgenticStackSnapshot();
  const homeLabTelemetrySnapshot = getHomeLabTelemetrySnapshot();
  const engagementModalities = getEngagementModalities();

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

      {/* 6. Ubuntu Linux Home Lab Telemetry & Interactive TTY Terminal */}
      <LiveTerminalSection initialSnapshot={homeLabTelemetrySnapshot} />

      {/* 7. Direct Commercial Engagement & Technical Advisory Form */}
      <ContactAdvisorySection
        domain={identity.domain}
        modalities={engagementModalities}
      />
    </AppShell>
  );
}
