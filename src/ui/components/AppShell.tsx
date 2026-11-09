"use client";

import React, { useEffect } from "react";
import Link from "next/link";
import type {
  AmbientTelemetryStatus,
  NavigationItem,
  SiteIdentity,
  ThemeMode
} from "@/types/portfolio";

export interface AppShellProps {
  identity: SiteIdentity;
  navigation: NavigationItem[];
  ambientTelemetry: AmbientTelemetryStatus;
  defaultTheme: ThemeMode;
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
  if (normalized === "STACK TECNOLOGICO") {
    return (
      <>
        <span className="block">STACK</span>
        <span className="block">TECNOLOGICO</span>
      </>
    );
  }
  if (normalized === "MAS PROYECTOS DE IA") {
    return (
      <>
        <span className="block">MAS PROYECTOS</span>
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
  children
}: AppShellProps) {
  useEffect(() => {
    applyDocumentTheme(defaultTheme);
  }, [defaultTheme]);

  return (
    <div className="min-h-screen flex flex-col bg-[#F8F9FA] text-[#0A0A0A]">
      {/* Fixed Top Navigation Header */}
      <header className="sticky top-0 z-50 w-full border-b border-[#E5E7EB] bg-[#F8F9FA]/95 backdrop-blur-md">
        <div className="swiss-container py-3.5 sm:py-4 flex flex-wrap items-center justify-between gap-6">
          {/* Brand Signature Logo */}
          <Link
            href="/"
            aria-label={identity.logoAlt}
            className="flex items-center focus:outline-none focus-visible:ring-2 focus-visible:ring-[#2563EB] rounded-[2px]"
          >
            <img
              src={identity.logoSrc}
              alt={identity.logoAlt}
              width={360}
              height={58}
              className="h-10 sm:h-12 lg:h-[52px] w-auto object-contain select-none"
            />
          </Link>

          {/* Center Navigation Links (3 Exact Buttons) */}
          <nav
            aria-label="Navegación principal del portafolio"
            className="hidden md:flex items-center gap-10 lg:gap-16 xl:gap-20"
          >
            {navigation.map((item) => (
              <a
                key={item.id}
                href={item.href}
                className="mono-nav text-[#111827] hover:text-[#2563EB] text-center transition-colors focus:outline-none focus-visible:ring-2 focus-visible:ring-[#2563EB] rounded-[2px]"
              >
                {renderTwoLineNavLabel(item.label)}
              </a>
            ))}
          </nav>

          {/* Primary Black CTA Button */}
          <div className="flex items-center">
            <a
              href={identity.secondaryCtaHref}
              className="inline-flex flex-col items-center justify-center px-5 py-2.5 bg-[#0A0A0A] hover:bg-[#1F2937] text-white rounded-[12px] mono-nav text-xs font-semibold leading-[1.15] tracking-wider transition-colors focus:outline-none focus-visible:ring-2 focus-visible:ring-offset-2 focus-visible:ring-[#2563EB]"
            >
              {identity.secondaryCtaLabel === "CONTRATAR / HABLEMOS" ? (
                <>
                  <span className="block">CONTRATAR /</span>
                  <span className="block">HABLEMOS</span>
                </>
              ) : (
                identity.secondaryCtaLabel
              )}
            </a>
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
    </div>
  );
}
