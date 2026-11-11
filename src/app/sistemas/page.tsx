import React from "react";
import type { Metadata } from "next";
import { getSiteFoundationSnapshot } from "@/service/site.service";
import {
  listCatalogSystemsAsync,
  splitSystemsByHomeCatalogSection
} from "@/service/systems.service";
import { AppShell } from "@/ui/components/AppShell";
import { ProductionSystemsSection } from "@/ui/components/ProductionSystemsSection";

export const dynamic = "force-dynamic";

export const metadata: Metadata = {
  title: "Sistemas en Producción — Infraestructura & Software",
  description:
    "Plataformas e infraestructuras distribuidas operando en entornos reales con SLA verificado.",
  alternates: {
    canonical: "/sistemas"
  }
};

export default async function SistemasPage() {
  const siteSnapshot = getSiteFoundationSnapshot();
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

  return (
    <AppShell
      identity={identity}
      navigation={navigation}
      ambientTelemetry={ambientTelemetry}
      defaultTheme={defaultTheme}
      footer={footer}
      currentPath="/sistemas"
    >
      <ProductionSystemsSection systems={productionSystems} />
    </AppShell>
  );
}
