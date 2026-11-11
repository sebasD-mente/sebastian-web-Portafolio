import React from "react";
import { getSiteFoundationSnapshot } from "@/service/site.service";
import { getSystemsCatalogSnapshot } from "@/service/systems.service";
import { getServerdmenteLiveMonitor } from "@/service/telemetry.service";
import { AppShell } from "@/ui/components/AppShell";
import { HeroSection } from "@/ui/components/HeroSection";

export const dynamic = "force-dynamic";

export default async function HomePage() {
  const siteSnapshot = getSiteFoundationSnapshot();
  const catalogSnapshot = getSystemsCatalogSnapshot();
  const liveMonitor = getServerdmenteLiveMonitor();

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
      {/* Hero Editorial Des-saturado (8 cols) + Monitor Real HOME-LAB // SERVERDMENTE (4 cols) */}
      <HeroSection
        identity={identity}
        telemetryCard={heroTelemetry}
        defaultTheme={defaultTheme}
        liveMonitor={liveMonitor}
      />
    </AppShell>
  );
}
