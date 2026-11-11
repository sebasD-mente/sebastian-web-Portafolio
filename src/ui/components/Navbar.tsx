"use client";

import React from "react";
import Link from "next/link";
import type { NavigationItem, SiteIdentity } from "@/types/portfolio";

export interface NavbarProps {
  identity: SiteIdentity;
  navigation: NavigationItem[];
  currentPath?: string;
}

export function renderTwoLineNavLabel(label: string): React.ReactNode {
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
    normalized === "HABILIDADES Y STACK TECNOLÓGICO" ||
    normalized === "HABILIDADES Y STACK TECNOLOGICO"
  ) {
    return (
      <>
        <span className="block">HABILIDADES Y</span>
        <span className="block">STACK TECNOLÓGICO</span>
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

export function Navbar({ identity, navigation, currentPath = "" }: NavbarProps) {
  return (
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
                isDedicatedPageLink && currentPath === item.href;

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
  );
}
