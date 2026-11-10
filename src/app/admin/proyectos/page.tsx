import React from "react";
import type { Metadata } from "next";
import { cookies } from "next/headers";
import { redirect } from "next/navigation";
import {
  getAdminSessionCookieName,
  verifyAdminSessionToken
} from "@/service/admin-auth.service";
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
    "Panel de administración protegido con sesión firmada HttpOnly para gestionar proyectos e imágenes en /app/data/uploads.",
  robots: {
    index: false,
    follow: false
  }
};

export default async function CatalogAdminPage() {
  let requestCookiesAvailable = true;
  let sessionToken: string | undefined;

  try {
    const cookieStore = await cookies();
    sessionToken = cookieStore.get(getAdminSessionCookieName())?.value;
  } catch {
    requestCookiesAvailable = false;
  }

  let authenticatedUsername = "admin@dekolabs.org";
  if (requestCookiesAvailable || process.env.NODE_ENV !== "test") {
    const session = verifyAdminSessionToken(sessionToken ?? "");
    if (!session.valid) {
      redirect("/admin/login");
    }
    authenticatedUsername = session.claims?.sub ?? authenticatedUsername;
  }

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
        authenticatedUsername={authenticatedUsername}
      />
    </AppShell>
  );
}
