import React from "react";
import type { Metadata } from "next";
import { cookies } from "next/headers";
import { redirect } from "next/navigation";
import {
  getAdminSessionCookieName,
  verifyAdminSessionToken
} from "@/service/admin-auth.service";
import { getSiteFoundationSnapshot } from "@/service/site.service";
import { AdminLoginView } from "@/ui/components/AdminLoginView";

export const dynamic = "force-dynamic";

export const metadata: Metadata = {
  title: "Acceso Administrador (/admin/login) | Sebastián — dekolabs.org",
  description:
    "Inicio de sesión seguro con sesión firmada HttpOnly para administrar el catálogo de proyectos en dekolabs.org.",
  robots: {
    index: false,
    follow: false
  }
};

export default async function AdminLoginPage() {
  let requestCookiesAvailable = true;
  let sessionToken: string | undefined;

  try {
    const cookieStore = await cookies();
    sessionToken = cookieStore.get(getAdminSessionCookieName())?.value;
  } catch {
    requestCookiesAvailable = false;
  }

  if (requestCookiesAvailable && sessionToken) {
    const session = verifyAdminSessionToken(sessionToken);
    if (session.valid) {
      redirect("/admin/proyectos");
    }
  }

  const siteSnapshot = getSiteFoundationSnapshot();

  return <AdminLoginView identity={siteSnapshot.identity} />;
}
