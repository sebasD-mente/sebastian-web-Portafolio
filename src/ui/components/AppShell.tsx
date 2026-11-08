"use client";

import React, { useEffect, useState } from "react";
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

export function AppShell({
  identity,
  navigation,
  ambientTelemetry,
  defaultTheme,
  children
}: AppShellProps) {
  const [theme, setTheme] = useState<ThemeMode>(defaultTheme);

  useEffect(() => {
    try {
      const stored = window.localStorage.getItem("color-scheme");
      const initial: ThemeMode =
        stored === "dark" || stored === "light" ? stored : defaultTheme;
      setTheme(initial);
      applyDocumentTheme(initial);
    } catch {
      applyDocumentTheme(defaultTheme);
    }

    const handleStorage = (event: StorageEvent) => {
      if (event.key === "color-scheme") {
        const next: ThemeMode =
          event.newValue === "dark" || event.newValue === "light"
            ? event.newValue
            : defaultTheme;
        setTheme(next);
        applyDocumentTheme(next);
      }
    };

    const mediaQuery = window.matchMedia("(prefers-color-scheme: dark)");
    const handleMediaChange = (event: MediaQueryListEvent) => {
      try {
        const stored = window.localStorage.getItem("color-scheme");
        if (stored !== "light" && stored !== "dark") {
          const next: ThemeMode = event.matches ? "dark" : defaultTheme;
          setTheme(next);
          applyDocumentTheme(next);
        }
      } catch {
        // Ignore storage read errors in restricted contexts
      }
    };

    window.addEventListener("storage", handleStorage);
    mediaQuery.addEventListener("change", handleMediaChange);
    return () => {
      window.removeEventListener("storage", handleStorage);
      mediaQuery.removeEventListener("change", handleMediaChange);
    };
  }, [defaultTheme]);

  const handleToggleTheme = () => {
    const nextTheme: ThemeMode = theme === "light" ? "dark" : "light";
    setTheme(nextTheme);
    applyDocumentTheme(nextTheme);
    try {
      window.localStorage.setItem("color-scheme", nextTheme);
    } catch {
      // Ensure theme is applied to page even if localStorage is blocked
    }
  };

  return (
    <div className="min-h-screen flex flex-col bg-[var(--background)] text-[var(--primary)]">
      {/* Ambient Telemetry Strip */}
      <div
        role="region"
        aria-label="Telemetría ambiental del nodo Ubuntu Home Lab"
        className="w-full border-b border-[var(--outline-variant)] bg-[var(--surface-container-lowest)]"
      >
        <div className="swiss-container py-2 flex flex-wrap items-center justify-between gap-3">
          <div className="flex items-center gap-3 flex-wrap">
            <span className="inline-flex items-center gap-2 mono-label text-[var(--tertiary-fixed)]">
              <span
                aria-hidden="true"
                className="h-2 w-2 rounded-full bg-[var(--tertiary-fixed)] animate-pulse"
              />
              {ambientTelemetry.nodeId} · {ambientTelemetry.status}
            </span>
            <span className="hidden sm:inline text-[var(--outline-variant)]">|</span>
            <span className="mono-label text-[var(--on-surface-variant)]">
              HOST: {ambientTelemetry.hostOs}
            </span>
          </div>

          <div className="flex items-center gap-4 flex-wrap">
            <span className="mono-label text-[var(--on-surface-variant)]">
              P99: <strong className="text-[var(--primary)]">{ambientTelemetry.latencyMs}ms</strong>
            </span>
            <span className="mono-label text-[var(--on-surface-variant)]">
              SLO: <strong className="text-[var(--primary)]">{ambientTelemetry.availabilitySlo}</strong>
            </span>
            <span className="hidden md:inline mono-label text-[var(--secondary)]">
              HARNESS: {ambientTelemetry.harnessScore}
            </span>
            <span className="hidden lg:inline mono-label text-[var(--on-surface-variant)]">
              REV: {ambientTelemetry.deployedRevision}
            </span>
          </div>
        </div>
      </div>

      {/* Fixed Frosted Header */}
      <header className="sticky top-0 z-40 w-full border-b border-[var(--outline-variant)] bg-[var(--background)]/90 backdrop-blur-md">
        <div className="swiss-container py-4 flex items-center justify-between gap-4">
          <a
            href="#"
            className="group flex items-center gap-3 focus:outline-none focus-visible:ring-2 focus-visible:ring-[var(--secondary)]"
          >
            <span className="px-2.5 py-1 border border-[var(--outline-variant)] bg-[var(--surface-container-low)] mono-label text-[var(--primary)] rounded-[2px]">
              {identity.monogram}
            </span>
            <div className="flex flex-col">
              <span className="font-display text-sm sm:text-base font-semibold tracking-tight text-[var(--primary)]">
                {identity.name.toUpperCase()} <span className="text-[var(--secondary)]">{"//"}</span>{" "}
                <span className="font-normal text-[var(--on-surface-variant)]">
                  {identity.roleTitle}
                </span>
              </span>
              <span className="mono-label text-[var(--on-surface-variant)]">
                {identity.domain}
              </span>
            </div>
          </a>

          <nav
            aria-label="Navegación principal del portafolio"
            className="hidden xl:flex items-center gap-6"
          >
            {navigation.map((item) => (
              <a
                key={item.id}
                href={item.href}
                className="mono-label text-[var(--on-surface-variant)] hover:text-[var(--primary)] transition-colors"
              >
                <span className="text-[var(--secondary)] mr-1">{item.code}.</span>
                {item.label}
              </a>
            ))}
          </nav>

          <div className="flex items-center gap-3">
            <span className="hidden 2xl:inline-flex items-center gap-2 px-2.5 py-1 border border-[var(--outline-variant)] bg-[var(--surface-container-low)] rounded-[2px] mono-label text-[var(--tertiary-fixed)]">
              <span
                aria-hidden="true"
                className="h-1.5 w-1.5 rounded-full bg-[var(--tertiary-fixed)]"
              />
              {identity.availabilityBadge}
            </span>

            <button
              type="button"
              onClick={handleToggleTheme}
              aria-label={
                theme === "light"
                  ? "Cambiar a Modo Oscuro (Atelier Monolith Dark)"
                  : "Cambiar a Modo Claro (Atelier Monolith Light)"
              }
              className="px-3 py-2 border border-[var(--outline-variant)] bg-[var(--surface-container-low)] hover:bg-[var(--surface-container-high)] text-[var(--primary)] rounded-[2px] mono-label transition-colors cursor-pointer"
            >
              {theme === "light" ? "THEME // LIGHT" : "THEME // DARK"}
            </button>

            <a
              href={identity.secondaryCtaHref}
              className="px-3.5 py-2 bg-[var(--primary)] text-[var(--background)] rounded-[2px] mono-label hover:opacity-90 transition-opacity"
            >
              {identity.secondaryCtaLabel}
            </a>
          </div>
        </div>
      </header>

      {/* Main Content */}
      <main id="contenido-principal" className="flex-1">
        {children}
      </main>

      {/* Technical Footer */}
      <footer className="border-t border-[var(--outline-variant)] bg-[var(--surface-container-lowest)]">
        <div className="swiss-container py-10 grid grid-cols-1 md:grid-cols-12 gap-8">
          <div className="md:col-span-6 space-y-2">
            <p className="font-display font-semibold text-base text-[var(--primary)]">
              {identity.name} — {identity.roleTitle} ({identity.domain})
            </p>
            <p className="text-sm text-[var(--on-surface-variant)] max-w-xl">
              {identity.footerNote}
            </p>
          </div>

          <div className="md:col-span-6 flex flex-col md:items-end justify-between gap-3">
            <div className="flex flex-wrap gap-4">
              {navigation.map((item) => (
                <a
                  key={item.id}
                  href={item.href}
                  className="mono-label text-[var(--on-surface-variant)] hover:text-[var(--primary)]"
                >
                  {item.code}. {item.label}
                </a>
              ))}
            </div>
            <p className="mono-label text-[var(--on-surface-variant)]">
              ATELIER MONOLITH SYSTEM · UNIVERSAL CHAMELEON HARNESS v2.1 · UBUNTU HOME LAB
            </p>
          </div>
        </div>
      </footer>
    </div>
  );
}
