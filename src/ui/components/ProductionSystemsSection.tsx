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

  const liveUrlDisplay = system.liveUrl
    .replace(/^https?:\/\//, "")
    .replace(/\/$/, "")
    .toUpperCase();

  return (
    <article
      aria-label={`Proyecto ${system.order}: ${system.title}`}
      className="bg-white border border-[#CBD5E1] p-6 sm:p-8 lg:p-10 rounded-[2px] shadow-[0_1px_3px_rgba(0,0,0,0.03)] space-y-6 sm:space-y-7 transition-all duration-300 hover:border-[#2563EB]/50 hover:shadow-[0_8px_24px_rgba(37,99,235,0.07)]"
    >
      {/* Project Header: Category / Order, Title & Status */}
      <div className="space-y-3">
        <div className="flex flex-wrap items-center justify-between gap-3">
          <div className="mono-pixel text-[11px] sm:text-[12px] text-[#2563EB] font-bold tracking-wider uppercase">
            {headerCategory}
          </div>
          <div className="flex items-center gap-2">
            <span className="mono-pixel text-[10px] sm:text-[11px] px-2.5 py-0.5 bg-[#EAECEF] border border-[#CBD5E1] text-[#111827] rounded-[2px] font-semibold">
              {versionBadge}
            </span>
            <span className="mono-pixel text-[10px] text-[#22C55E] flex items-center gap-1.5 font-semibold">
              <span
                aria-hidden="true"
                className="h-2 w-2 rounded-full bg-[#22C55E] inline-block shadow-[0_0_6px_rgba(34,197,94,0.6)]"
              />
              {system.status === "ACTIVE // EDGE NODE"
                ? "EDGE ACTIVE"
                : "ONLINE"}
            </span>
          </div>
        </div>

        {/* Prominent Project Title */}
        <HeadingTag className="font-display text-2xl sm:text-3xl lg:text-[2.5rem] font-extrabold uppercase tracking-[-0.02em] text-[#0A0A0A] leading-[1.06]">
          {system.title}
        </HeadingTag>

        {/* Narrative Subtitle */}
        {system.subtitle && (
          <p className="text-xs sm:text-[13px] text-[#4B5563] leading-relaxed max-w-3xl">
            {system.subtitle}
          </p>
        )}
      </div>

      {/* Main Technical Showcase Box (Split 2-Panel Card: Left Browser & Clickable Image + Right Specs) */}
      <div className="border border-[#9CA3AF] rounded-[2px] overflow-hidden grid grid-cols-1 lg:grid-cols-12 bg-white">
        {/* Left Column (~58% / 7 cols): Browser Chrome + Clickable Screenshot */}
        <div className="lg:col-span-7 flex flex-col border-b lg:border-b-0 lg:border-r border-[#CBD5E1] bg-white">
          {/* Browser Window Frame Bar with Live Green Dot */}
          <div className="px-3.5 py-2.5 bg-white border-b border-[#E5E7EB] flex items-center justify-between">
            <div className="flex items-center gap-2">
              <span
                aria-hidden="true"
                className="h-3 w-3 rounded-full bg-[#22C55E] inline-block shadow-[0_0_6px_rgba(34,197,94,0.6)]"
              />
              <span className="mono-pixel text-[10.5px] sm:text-[11px] text-[#374151] font-semibold tracking-wide">
                {liveUrlDisplay}
              </span>
            </div>
            <span className="mono-pixel text-[10px] text-[#6B7280] uppercase tracking-wider hidden sm:inline">
              LIVE PREVIEW
            </span>
          </div>

          {/* Screenshot Linked to Live URL */}
          <a
            href={system.liveUrl}
            target="_blank"
            rel="noopener noreferrer"
            title={`Probar ${system.title} en vivo (${system.liveUrl})`}
            aria-label={`Probar ${system.title} en vivo en una nueva pestaña`}
            className="block relative group/preview cursor-pointer overflow-hidden aspect-[16/10] sm:aspect-[16/9] bg-[#0B0D13] w-full flex-1"
          >
            {isFirstCard ? (
              <img
                src={previewSrc}
                alt={previewAlt}
                fetchPriority="high"
                width={1280}
                height={720}
                className="w-full h-full object-cover block group-hover/preview:scale-[1.015] transition-transform duration-300"
              />
            ) : (
              <img
                src={previewSrc}
                alt={previewAlt}
                loading="lazy"
                width={1280}
                height={720}
                className="w-full h-full object-cover block group-hover/preview:scale-[1.015] transition-transform duration-300"
              />
            )}
            <div className="absolute inset-0 bg-transparent group-hover/preview:bg-[#0A0A0A]/10 transition-colors duration-200 pointer-events-none flex items-center justify-center">
              <span className="opacity-0 group-hover/preview:opacity-100 transition-opacity duration-200 px-3 py-1.5 bg-[#0A0A0A]/85 text-white mono-label text-[11px] font-semibold rounded-[2px] shadow-lg flex items-center gap-1.5 backdrop-blur-[2px]">
                PROBAR SISTEMA EN VIVO ↗
              </span>
            </div>
          </a>
        </div>

        {/* Right Column (~42% / 5 cols): Technical Specifications & Actions */}
        <div className="lg:col-span-5 bg-[#F9FAFB] p-5 sm:p-6 lg:p-7 flex flex-col justify-between gap-5">
          <div className="space-y-4">
            {/* Top Metadata Bar */}
            <div className="flex items-center justify-between gap-2 pb-2.5 border-b border-[#E5E7EB]">
              <span className="mono-pixel text-[10px] sm:text-[10.5px] text-[#2563EB] font-bold tracking-wider uppercase truncate">
                {headerCategory}
              </span>
              <span className="mono-pixel text-[10px] text-[#6B7280] font-medium shrink-0">
                {versionBadge}
              </span>
            </div>

            {/* Summary */}
            <p className="text-xs sm:text-[13px] text-[#374151] leading-relaxed font-normal">
              {system.summary}
            </p>

            {/* Stack Technology Tags (Grid of White Chips) */}
            <ul
              role="list"
              aria-label="Stack tecnológico del sistema"
              className="grid grid-cols-2 gap-1.5 pt-0.5"
            >
              {system.stackTags.map((tag) => {
                const isHighlighted =
                  tag.toUpperCase() === highlightedTag.toUpperCase();
                return (
                  <li
                    key={tag}
                    className={
                      isHighlighted
                        ? "px-2.5 py-1.5 border border-[#2563EB] bg-[#DBEAFE] text-[#1D4ED8] rounded-[2px] mono-label text-[10px] sm:text-[10.5px] font-semibold truncate text-center"
                        : "px-2.5 py-1.5 border border-[#CBD5E1] bg-white text-[#1F2937] rounded-[2px] mono-label text-[10px] sm:text-[10.5px] truncate text-center"
                    }
                    title={tag}
                  >
                    {tag}
                  </li>
                );
              })}
            </ul>

            {/* Architecture & Availability Box */}
            <dl className="border border-[#CBD5E1] bg-white p-3.5 rounded-[2px] space-y-2">
              {displaySpecs.map((spec) => (
                <div
                  key={spec.label}
                  className="flex flex-col sm:flex-row sm:items-baseline justify-between gap-1 text-xs"
                >
                  <dt className="mono-pixel text-[10px] text-[#4B5563] uppercase">
                    {spec.label}:
                  </dt>
                  <dd className="mono-code text-[11px] sm:text-[11.5px] text-[#0A0A0A] font-medium sm:text-right">
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
              className="flex-1 text-center px-4 py-2.5 bg-[#0A0A0A] hover:bg-[#1F2937] text-white rounded-[2px] mono-label text-[11px] font-semibold transition-all duration-300 hover:shadow-md focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[#2563EB]"
            >
              PROBAR SISTEMA EN VIVO ↗
            </a>
            <Link
              href={system.detailHref}
              className="flex-1 text-center px-4 py-2.5 border border-[#0A0A0A]/30 bg-white hover:bg-[#F3F4F6] text-[#0A0A0A] rounded-[2px] mono-label text-[11px] font-semibold transition-all duration-300 hover:border-[#0A0A0A]/60 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[#2563EB]"
            >
              {"{}"} ARQUITECTURA &amp; REPO
            </Link>
          </div>
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
  const displaySystems =
    productionCandidates.length > 0 ? productionCandidates : [];

  return (
    <section
      id="proyectos-destacados"
      aria-labelledby="production-systems-heading"
      className="py-10 sm:py-14 lg:py-16 bg-[#F8F9FA]"
    >
      <div className="swiss-container space-y-10 sm:space-y-12">
        <div className="space-y-3 border-b border-[#D1D5DB] pb-6">
          <div className="flex flex-wrap items-center justify-between gap-3">
            <span className="mono-pixel text-[10px] sm:text-[11px] text-[#2563EB] font-semibold tracking-wider">
              INFRAESTRUCTURA · CLOUD · SISTEMAS EN VIVO
            </span>
            <span className="mono-pixel text-[10px] px-2.5 py-1 bg-[#EAECEF] border border-[#CBD5E1] text-[#111827] rounded-[2px]">
              STAGE // PRODUCTION VERIFIED
            </span>
          </div>
          <h2
            id="production-systems-heading"
            className="font-display text-3xl sm:text-4xl lg:text-[2.65rem] font-extrabold uppercase tracking-[-0.02em] text-[#0A0A0A]"
          >
            SISTEMAS EN PRODUCCIÓN
          </h2>
          <p className="text-sm sm:text-base text-[#374151] leading-relaxed max-w-3xl">
            Sistemas completos diseñados para alta concurrencia, procesamiento en memoria y despliegue resiliente en producción.
          </p>
        </div>

        {displaySystems.length > 0 ? (
          <div className="space-y-12 sm:space-y-16">
            {displaySystems.map((system, idx) => (
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
