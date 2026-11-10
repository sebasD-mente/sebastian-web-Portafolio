"use client";

import React, { useEffect } from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { getOfficialFooterSnapshot } from "@/service/site.service";
import type {
  AmbientTelemetryStatus,
  NavigationItem,
  OfficialFooterData,
  SiteIdentity,
  ThemeMode
} from "@/types/portfolio";
import { OfficialFooter } from "@/ui/components/OfficialFooter";

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

function renderTwoLineNavLabel(label: string): React.ReactNode {
  const normalized = label.trim().toUpperCase();
  if (normalized === "SISTEMAS EN PRODUCCIÓN") {
    return (
      <>
        <span className="block">SISTEMAS EN</span>
        <span className="block">PRODUCCIÓN</span>
      </>
    );
  }
  if (
    normalized === "STACK TECNOLÓGICO" ||
    normalized === "STACK TECNOLOGICO"
  ) {
    return (
      <>
        <span className="block">STACK</span>
        <span className="block">TECNOLÓGICO</span>
      </>
    );
  }
  if (
    normalized === "MÁS PROYECTOS DE IA" ||
    normalized === "MAS PROYECTOS DE IA"
  ) {
    return (
      <>
        <span className="block">MÁS PROYECTOS</span>
        <span className="block">DE IA</span>
      </>
    );
  }
  return label;
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
      <header className="sticky top-0 z-50 w-full border-b border-[#E5E7EB] bg-[#F8F9FA]/95 backdrop-blur-md">
        <div className="swiss-container py-3.5 sm:py-4 flex flex-wrap items-center justify-between gap-4 sm:gap-6">
          {/* Brand Signature Logo */}
          <Link
            href="/"
            aria-label={identity.logoAlt}
            className="flex items-center rounded-[2px] focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[#2563EB]"
          >
            <img
              src={identity.logoSrc}
              alt={identity.logoAlt}
              width={360}
              height={58}
              className="h-10 sm:h-12 lg:h-[52px] w-auto object-contain select-none"
            />
          </Link>

          {/* Center Navigation Links (Single Semantic Navigation Tree across viewports) */}
          <nav
            aria-label="Principal"
            className="order-3 md:order-none w-full md:w-auto pt-2.5 md:pt-0 border-t md:border-t-0 border-[#E5E7EB]"
          >
            <ul className="flex flex-wrap items-center justify-center gap-6 sm:gap-8 md:gap-10 lg:gap-16 xl:gap-20">
              {navigation.map((item) => {
                const isDedicatedPageLink =
                  item.href.startsWith("/") && !item.href.includes("#");
                const isCurrentPage =
                  isDedicatedPageLink && activePath === item.href;

                return (
                  <li key={item.id}>
                    <Link
                      href={item.href}
                      aria-current={isCurrentPage ? "page" : undefined}
                      className="inline-block mono-nav text-[#111827] hover:text-[#2563EB] text-center transition-colors rounded-[2px] px-1 py-0.5 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[#2563EB] [&[aria-current=page]]:text-[#1D4ED8] [&[aria-current=page]]:underline [&[aria-current=page]]:decoration-2 [&[aria-current=page]]:underline-offset-4 [&[aria-current=page]]:decoration-[#1D4ED8]"
                    >
                      {renderTwoLineNavLabel(item.label)}
                    </Link>
                  </li>
                );
              })}
            </ul>
          </nav>

          {/* Primary Black CTA Button */}
          <div className="flex items-center">
            <Link
              href={identity.secondaryCtaHref}
              className="inline-flex flex-col items-center justify-center px-5 py-2.5 bg-[#0A0A0A] hover:bg-[#1F2937] text-white rounded-[12px] mono-nav text-xs font-semibold leading-[1.15] tracking-wider transition-colors focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[#2563EB]"
            >
              {identity.secondaryCtaLabel === "CONTRATAR / HABLEMOS" ? (
                <>
                  <span className="block">CONTRATAR /</span>
                  <span className="block">HABLEMOS</span>
                </>
              ) : (
                identity.secondaryCtaLabel
              )}
            </Link>
          </div>
        </div>
      </header>

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
