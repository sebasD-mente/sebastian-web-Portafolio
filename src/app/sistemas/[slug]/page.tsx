import React from "react";
import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { getSiteFoundationSnapshot } from "@/service/site.service";
import {
  getAllProductionSystemSlugs,
  getProductionSystemDeepDiveBySlugAsync
} from "@/service/systems.service";
import { AppShell } from "@/ui/components/AppShell";
import { SystemDetailView } from "@/ui/components/SystemDetailView";

export const dynamicParams = true;

export interface SystemDetailPageProps {
  params: Promise<{
    slug: string;
  }>;
}

export function generateStaticParams(): { slug: string }[] {
  return getAllProductionSystemSlugs();
}

export async function generateMetadata({
  params
}: SystemDetailPageProps): Promise<Metadata> {
  const { slug } = await params;
  const deepDive = await getProductionSystemDeepDiveBySlugAsync(slug);

  if (!deepDive) {
    return {
      title: "Sistema No Encontrado | Sebastián — dekolabs.org"
    };
  }

  return {
    title: `${deepDive.system.title} | Sebastián — dekolabs.org`,
    description: deepDive.system.summary,
    alternates: {
      canonical: deepDive.system.liveUrl
    }
  };
}

export default async function SystemDetailPage({
  params
}: SystemDetailPageProps) {
  const { slug } = await params;
  const deepDive = await getProductionSystemDeepDiveBySlugAsync(slug);

  if (!deepDive) {
    notFound();
  }

  const siteSnapshot = getSiteFoundationSnapshot();

  return (
    <AppShell
      identity={siteSnapshot.identity}
      navigation={siteSnapshot.navigation}
      ambientTelemetry={siteSnapshot.ambientTelemetry}
      defaultTheme={siteSnapshot.defaultTheme}
      footer={siteSnapshot.footer}
    >
      <SystemDetailView deepDive={deepDive} />
    </AppShell>
  );
}
