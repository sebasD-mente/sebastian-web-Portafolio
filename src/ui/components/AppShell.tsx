"use client";

import React, { useEffect } from "react";
import { usePathname } from "next/navigation";
import { getOfficialFooterSnapshot } from "@/service/site.service";
import type {
  AmbientTelemetryStatus,
  NavigationItem,
  OfficialFooterData,
  SiteIdentity,
  ThemeMode
} from "@/types/portfolio";
import { Navbar, renderTwoLineNavLabel } from "@/ui/components/Navbar";
import { OfficialFooter } from "@/ui/components/OfficialFooter";

export { renderTwoLineNavLabel };

export interface AppShellProps {
  identity: SiteIdentity;
  navigation: NavigationItem[];
  ambientTelemetry: AmbientTelemetryStatus;
  defaultTheme: ThemeMode;
  footer?: OfficialFooterData;
  currentPath?: string;
  children: React.ReactNode;
}

function applyDocumentTheme(mode: ThemeMode): void {
  if (typeof document === "undefined") return;
  const root = document.documentElement;
  root.classList.remove("light", "dark");
  root.classList.add(mode);
  const meta = document.querySelector('meta[name="color-scheme"]');
  if (meta) {
    meta.setAttribute("content", mode);
  }
}

export function AppShell({
  identity,
  navigation,
  defaultTheme,
  footer,
  currentPath,
  children
}: AppShellProps) {
  const pathnameFromHook = usePathname();
  const activePath = currentPath ?? pathnameFromHook ?? "";
  const resolvedFooter = footer ?? getOfficialFooterSnapshot();

  useEffect(() => {
    applyDocumentTheme(defaultTheme);
  }, [defaultTheme]);

  return (
    <div className="min-h-screen flex flex-col bg-[#F8F9FA] text-[#0A0A0A]">
      {/* Skip Link for Keyboard Users */}
      <a
        href="#contenido-principal"
        className="sr-only focus:not-sr-only focus:fixed focus:top-3 focus:left-3 focus:z-[60] focus:px-4 focus:py-2 focus:bg-[#0A0A0A] focus:text-white focus:rounded-[2px] mono-label text-xs focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[#2563EB]"
      >
        Saltar al contenido principal
      </a>

      {/* Fixed Top Navigation Header */}
      <Navbar
        identity={identity}
        navigation={navigation}
        currentPath={activePath}
      />

      {/* Top Subtle Gray Divider Band */}
      <div
        aria-hidden="true"
        className="w-full h-5 sm:h-6 bg-[#EAECEF] border-b border-[#E5E7EB]"
      />

      {/* Main Content */}
      <main id="contenido-principal" className="flex-1">
        {children}
      </main>

      {/* Official Institutional Footer & Social Channels */}
      <OfficialFooter footer={resolvedFooter} />
    </div>
  );
}
