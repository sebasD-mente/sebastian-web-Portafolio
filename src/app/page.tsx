import React from "react";
import { getSiteFoundationSnapshot } from "@/service/site.service";
import {
  getFeaturedHomeProductionSystems,
  getSystemsCatalogSnapshot
} from "@/service/systems.service";
import { AppShell } from "@/ui/components/AppShell";
import { HeroSection } from "@/ui/components/HeroSection";
import { ProductionSystemsSection } from "@/ui/components/ProductionSystemsSection";

export default function HomePage() {
  const siteSnapshot = getSiteFoundationSnapshot();
  const catalogSnapshot = getSystemsCatalogSnapshot();
  const featuredSystems = getFeaturedHomeProductionSystems();

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

      {/* 2. Sistemas en Producción — Tarjeta de Vista Preliminar DECO VINTAGE PLATFORM */}
      <ProductionSystemsSection systems={featuredSystems} />
    </AppShell>
  );
}
