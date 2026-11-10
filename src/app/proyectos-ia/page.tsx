import React from "react";
import type { Metadata } from "next";
import { getSiteFoundationSnapshot } from "@/service/site.service";
import {
  getCatalogSectionsConfig,
  listCatalogSystemsAsync,
  splitSystemsByHomeCatalogSection
} from "@/service/systems.service";
import { AiProjectsCatalogView } from "@/ui/components/AiProjectsCatalogView";
import { AppShell } from "@/ui/components/AppShell";

export const dynamic = "force-dynamic";

export const metadata: Metadata = {
  title: "Más Proyectos de IA — Google ADK & Sistemas RAG | Sebastián J — dekolabs.org",
  description:
    "Agentes autónomos con Google ADK, pipelines RAG sobre PostgreSQL + pgvector y sistemas de inteligencia artificial en construcción por Sebastián en dekolabs.org.",
  alternates: {
    canonical: "/proyectos-ia"
  }
};

export default async function AiProjectsPage() {
  const siteSnapshot = getSiteFoundationSnapshot();
  const sectionsConfig = getCatalogSectionsConfig();
  const allCatalogSystems = await listCatalogSystemsAsync();
  const { aiProjects } = splitSystemsByHomeCatalogSection(allCatalogSystems);

  const {
    identity,
    navigation,
    ambientTelemetry,
    defaultTheme
  } = siteSnapshot;

  return (
    <AppShell
      identity={identity}
      navigation={navigation}
      ambientTelemetry={ambientTelemetry}
      defaultTheme={defaultTheme}
      currentPath="/proyectos-ia"
    >
      <AiProjectsCatalogView
        projects={aiProjects}
        section={sectionsConfig["ai-projects"]}
      />
    </AppShell>
  );
}
