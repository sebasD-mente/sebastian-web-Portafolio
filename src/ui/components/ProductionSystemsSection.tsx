import React from "react";
import Link from "next/link";
import type { ProductionSystem } from "@/types/portfolio";

export interface ProductionSystemsSectionProps {
  systems: ProductionSystem[];
}

export interface ProjectPreviewCardProps {
  system: ProductionSystem;
  isFirstCard: boolean;
  headingTag?: "h2" | "h3";
}

export function ProjectPreviewCard({
  system,
  isFirstCard,
  headingTag = "h3"
}: ProjectPreviewCardProps) {
  const headerCategory =
    system.projectHeaderLabel ??
    `PROJECT ${system.order} // ${system.categoryLabel}`;
  const versionBadge = system.versionBadge ?? "v3.4.0 PRODUCTION";
  const previewSrc =
    system.previewImageSrc ?? "/assets/deco-vintage-preview.png";
  const previewAlt =
    system.previewImageAlt ?? `Vista preliminar de ${system.title}`;
  const highlightedTag =
    system.highlightedStackTag ?? "GOOGLE CLOUD STORAGE";

  const displaySpecs = system.architectureSpecs.slice(0, 2);
  const HeadingTag = headingTag;

  return (
    <article
      aria-label={`Proyecto ${system.order}: ${system.title}`}
      className="grid grid-cols-1 lg:grid-cols-12 border border-[#9CA3AF] bg-white shadow-[0_1px_3px_rgba(0,0,0,0.04)]"
    >
      {/* Left Column (7 cols): Browser Window Frame + Real Screenshot */}
      <div className="lg:col-span-7 flex flex-col justify-between bg-white">
        {/* Window Top Bar with Green Live Status Dot */}
        <div className="px-3.5 py-2.5 bg-white border-b border-[#E5E7EB] flex items-center justify-between">
          <span
            aria-hidden="true"
            className="h-3.5 w-3.5 rounded-full bg-[#22C55E] inline-block"
          />
          <span className="mono-pixel text-[10px] text-[#6B7280] hidden sm:inline">
            {system.liveUrl.replace(/^https?:\/\//, "")}
          </span>
        </div>

        {/* Screenshot Container */}
        <div className="bg-[#0B0D13] flex-1 flex items-center justify-center overflow-hidden">
          {isFirstCard ? (
            <img
              src={previewSrc}
              alt={previewAlt}
              fetchPriority="high"
              width={1280}
              height={720}
              className="w-full h-full object-cover block"
            />
          ) : (
            <img
              src={previewSrc}
              alt={previewAlt}
              loading="lazy"
              width={1280}
              height={720}
              className="w-full h-full object-cover block"
            />
          )}
        </div>

        {/* Window Bottom Margin Strip */}
        <div
          aria-hidden="true"
          className="h-3.5 bg-white border-t border-[#E5E7EB]"
        />
      </div>

      {/* Right Column (5 cols): Balanced Technical Specification Panel */}
      <div className="lg:col-span-5 bg-[#EAECEF] border-t lg:border-t-0 lg:border-l border-[#9CA3AF] p-6 sm:p-7 xl:p-8 flex flex-col justify-between gap-5">
        <div className="space-y-4">
          {/* Top Row: Category Header (Left) + Version Badge (Right) */}
          <div className="flex flex-wrap items-center justify-between gap-2">
            <span className="mono-pixel text-[10px] sm:text-[11px] text-[#2563EB] font-semibold tracking-wider">
              {headerCategory}
            </span>
            <span className="mono-pixel text-[10px] sm:text-[11px] px-2.5 py-1 bg-[#D5D9DF] text-[#111827] rounded-[2px]">
              {versionBadge}
            </span>
          </div>

          {/* System Title */}
          <HeadingTag className="font-display text-2xl sm:text-3xl xl:text-[2.1rem] font-extrabold uppercase tracking-[-0.02em] text-[#0A0A0A] leading-[1.06]">
            {system.title}
          </HeadingTag>

          {/* Summary of Stack & Services */}
          <p className="text-xs sm:text-[13.5px] text-[#374151] leading-[1.6] font-normal">
            {system.summary}
          </p>

          {/* Stack Technology Tags (Pills with highlighted tag in blue) */}
          <ul
            role="list"
            aria-label="Stack tecnológico del sistema"
            className="flex flex-wrap gap-1.5 pt-0.5"
          >
            {system.stackTags.map((tag) => {
              const isHighlighted =
                tag.toUpperCase() === highlightedTag.toUpperCase();
              return (
                <li
                  key={tag}
                  className={
                    isHighlighted
                      ? "px-2.5 py-1 border border-[#2563EB] bg-[#DBEAFE] text-[#1D4ED8] rounded-[2px] mono-label text-[10.5px] font-semibold"
                      : "px-2.5 py-1 border border-[#CBD5E1] bg-white/90 text-[#1F2937] rounded-[2px] mono-label text-[10.5px]"
                  }
                >
                  {tag}
                </li>
              );
            })}
          </ul>

          {/* Architecture & Availability Box */}
          <dl className="border border-[#CBD5E1] bg-[#F8FAFC] p-3.5 rounded-[2px] space-y-2">
            {displaySpecs.map((spec) => (
              <div
                key={spec.label}
                className="flex flex-col sm:flex-row sm:items-baseline justify-between gap-1 text-xs"
              >
                <dt className="mono-pixel text-[10px] text-[#4B5563]">
                  {spec.label}:
                </dt>
                <dd className="mono-code text-[11.5px] text-[#0A0A0A] font-medium sm:text-right">
                  {spec.value}
                </dd>
              </div>
            ))}
          </dl>
        </div>

        {/* Action Buttons */}
        <div className="flex flex-wrap items-center gap-3 pt-3 border-t border-[#CBD5E1]">
          <a
            href={system.liveUrl}
            target="_blank"
            rel="noopener noreferrer"
            className="px-4 py-2.5 bg-[#0A0A0A] hover:bg-[#1F2937] text-white rounded-[2px] mono-label text-[11px] font-semibold transition-colors focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[#2563EB]"
          >
            PROBAR SISTEMA EN VIVO ↗
          </a>
          <Link
            href={system.detailHref}
            className="px-4 py-2.5 border border-[#0A0A0A]/30 bg-white hover:bg-[#F3F4F6] text-[#0A0A0A] rounded-[2px] mono-label text-[11px] font-semibold transition-colors focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[#2563EB]"
          >
            {"{}"} ARQUITECTURA &amp; REPO
          </Link>
        </div>
      </div>
    </article>
  );
}

export function ProductionSystemsSection({
  systems
}: ProductionSystemsSectionProps) {
  const productionCandidates = systems.filter(
    (sys) => (sys.catalogSection ?? "production-systems") === "production-systems"
  );
  const featuredProduction =
    productionCandidates.filter((sys) => sys.featuredOnHome === true).length > 0
      ? productionCandidates.filter((sys) => sys.featuredOnHome === true)
      : productionCandidates.slice(0, 1);

  return (
    <section
      id="proyectos-destacados"
      aria-labelledby="production-systems-heading"
      className="py-10 sm:py-14 lg:py-16 bg-[#F8F9FA]"
    >
      <div className="swiss-container space-y-7 sm:space-y-8">
        <h2
          id="production-systems-heading"
          className="font-display text-3xl sm:text-4xl lg:text-[2.65rem] font-extrabold uppercase tracking-[-0.02em] text-[#0A0A0A]"
        >
          SISTEMAS EN PRODUCCIÓN
        </h2>

        {featuredProduction.length > 0 ? (
          <div className="space-y-10">
            {featuredProduction.map((system, idx) => (
              <ProjectPreviewCard
                key={system.id}
                system={system}
                isFirstCard={idx === 0}
                headingTag="h3"
              />
            ))}
          </div>
        ) : (
          <div className="border border-[#CBD5E1] bg-white p-6 sm:p-8 rounded-[2px]">
            <p className="text-xs sm:text-sm text-[#374151] leading-relaxed">
              No hay sistemas publicados aún en la categoría SISTEMAS EN PRODUCCIÓN.
            </p>
          </div>
        )}
      </div>
    </section>
  );
}
