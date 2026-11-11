import React from "react";
import type { Metadata } from "next";
import { getSiteFoundationSnapshot } from "@/service/site.service";
import { AppShell } from "@/ui/components/AppShell";
import { TechStackSection } from "@/ui/components/TechStackSection";

export const dynamic = "force-dynamic";

export const metadata: Metadata = {
  title: "Habilidades y Stack Tecnológico — Arquitectura & Herramientas",
  description:
    "Curaduría técnica de capacidades comerciales, arquitecturas agénticas con Google ADK, pipelines RAG e infraestructura.",
  alternates: {
    canonical: "/habilidades-y-stack"
  }
};

export default async function HabilidadesYStackPage() {
  const siteSnapshot = getSiteFoundationSnapshot();
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
      currentPath="/habilidades-y-stack"
    >
      <TechStackSection />
    </AppShell>
  );
}
