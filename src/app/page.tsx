import React from "react";
import { getSiteFoundationSnapshot } from "@/service/site.service";
import {
  getSystemsCatalogSnapshot,
  listCatalogSystemsAsync,
  splitSystemsByHomeCatalogSection
} from "@/service/systems.service";
import { AppShell } from "@/ui/components/AppShell";
import { HeroSection } from "@/ui/components/HeroSection";
import { ProductionSystemsSection } from "@/ui/components/ProductionSystemsSection";

export const dynamic = "force-dynamic";

export default async function HomePage() {
  const siteSnapshot = getSiteFoundationSnapshot();
  const catalogSnapshot = getSystemsCatalogSnapshot();
  const allCatalogSystems = await listCatalogSystemsAsync();
  const { productionSystems, aiProjects } =
    splitSystemsByHomeCatalogSection(allCatalogSystems);

  const {
    identity,
    navigation,
    ambientTelemetry,
    defaultTheme
  } = siteSnapshot;

  const { heroTelemetry } = catalogSnapshot;

  return (
    <AppShell
      identity={identity}
      navigation={navigation}
      ambientTelemetry={ambientTelemetry}
      defaultTheme={defaultTheme}
    >
      {/* 1. Hero Editorial Des-saturado (8 cols) + KERNEL & HOME LAB TELEMETRY Card (4 cols) */}
      <HeroSection
        identity={identity}
        telemetryCard={heroTelemetry}
        defaultTheme={defaultTheme}
      />

      {/* 2. Las 2 Categorías del Catálogo: SISTEMAS EN PRODUCCIÓN (#proyectos-destacados) y MÁS PROYECTOS DE IA (#mas-proyectos-ia) */}
      <ProductionSystemsSection
        systems={productionSystems}
        aiProjects={aiProjects}
      />
    </AppShell>
  );
}
