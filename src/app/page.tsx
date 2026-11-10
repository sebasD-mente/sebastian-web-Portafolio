import React from "react";
import { getSiteFoundationSnapshot } from "@/service/site.service";
import {
  getSystemsCatalogSnapshot,
  listCatalogSystemsAsync,
  splitSystemsByHomeCatalogSection
} from "@/service/systems.service";
import { getServerdmenteLiveMonitor } from "@/service/telemetry.service";
import { AppShell } from "@/ui/components/AppShell";
import { HeroSection } from "@/ui/components/HeroSection";
import { ProductionSystemsSection } from "@/ui/components/ProductionSystemsSection";
import { TechStackSection } from "@/ui/components/TechStackSection";

export const dynamic = "force-dynamic";

export default async function HomePage() {
  const siteSnapshot = getSiteFoundationSnapshot();
  const catalogSnapshot = getSystemsCatalogSnapshot();
  const liveMonitor = getServerdmenteLiveMonitor();
  const allCatalogSystems = await listCatalogSystemsAsync();
  const { productionSystems } =
    splitSystemsByHomeCatalogSection(allCatalogSystems);

  const {
    identity,
    navigation,
    ambientTelemetry,
    defaultTheme,
    footer
  } = siteSnapshot;

  const { heroTelemetry } = catalogSnapshot;

  return (
    <AppShell
      identity={identity}
      navigation={navigation}
      ambientTelemetry={ambientTelemetry}
      defaultTheme={defaultTheme}
      footer={footer}
      currentPath="/"
    >
      {/* 1. Hero Editorial Des-saturado (8 cols) + Monitor Real HOME-LAB // SERVERDMENTE (4 cols) */}
      <HeroSection
        identity={identity}
        telemetryCard={heroTelemetry}
        defaultTheme={defaultTheme}
        liveMonitor={liveMonitor}
      />

      {/* 2. Catálogo Exclusivo de Sistemas en Producción (#proyectos-destacados) */}
      <ProductionSystemsSection systems={productionSystems} />

      {/* 3. Sección de Stack Tecnológico en Construcción (#stack-tecnologico) */}
      <TechStackSection />
    </AppShell>
  );
}
