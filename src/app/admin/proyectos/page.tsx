import React from "react";
import type { Metadata } from "next";
import { getSiteFoundationSnapshot } from "@/service/site.service";
import {
  getCatalogSectionsConfig,
  getDefaultSystemTemplateInput,
  listCatalogSystemsAsync
} from "@/service/systems.service";
import { AppShell } from "@/ui/components/AppShell";
import { CatalogAdminView } from "@/ui/components/CatalogAdminView";

export const dynamic = "force-dynamic";

export const metadata: Metadata = {
  title: "Administrador de Proyectos (/admin/proyectos) | Sebastián — dekolabs.org",
  description:
    "Panel de administración para gestionar proyectos en SISTEMAS EN PRODUCCIÓN y MÁS PROYECTOS DE IA, y subir imágenes al volumen persistente /app/data/uploads.",
  robots: {
    index: false,
    follow: false
  }
};

export default async function CatalogAdminPage() {
  const siteSnapshot = getSiteFoundationSnapshot();
  const initialSystems = await listCatalogSystemsAsync();
  const sections = getCatalogSectionsConfig();
  const defaultTemplate = getDefaultSystemTemplateInput();

  return (
    <AppShell
      identity={siteSnapshot.identity}
      navigation={siteSnapshot.navigation}
      ambientTelemetry={siteSnapshot.ambientTelemetry}
      defaultTheme={siteSnapshot.defaultTheme}
    >
      <CatalogAdminView
        initialSystems={initialSystems}
        sections={sections}
        defaultTemplate={defaultTemplate}
      />
    </AppShell>
  );
}
