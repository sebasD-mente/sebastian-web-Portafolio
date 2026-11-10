import React from "react";
import Link from "next/link";
import type {
  CatalogSectionDescriptor,
  ProductionSystem
} from "@/types/portfolio";
import { ProjectPreviewCard } from "@/ui/components/ProductionSystemsSection";

export interface AiProjectsCatalogViewProps {
  projects: ProductionSystem[];
  section?: CatalogSectionDescriptor;
}

const DEFAULT_AI_SECTION_DESCRIPTOR: CatalogSectionDescriptor = {
  id: "ai-projects",
  anchorId: "mas-proyectos-ia",
  routeHref: "/proyectos-ia",
  heading: "MÁS PROYECTOS DE IA",
  subtitle:
    "Agentes autónomos con Google ADK, pipelines RAG sobre pgvector y sistemas de IA en construcción.",
  emptyStateMessage:
    "Próximamente: nuevos proyectos de IA, agentes autónomos y arquitecturas RAG publicados desde el administrador."
};

export function AiProjectsCatalogView({
  projects,
  section = DEFAULT_AI_SECTION_DESCRIPTOR
}: AiProjectsCatalogViewProps) {
  const visibleProjects = projects.filter(
    (project) =>
      (project.catalogSection ?? "ai-projects") === "ai-projects" &&
      project.featuredOnHome !== false
  );

  return (
    <div id={section.anchorId} className="bg-[#F8F9FA] text-[#0A0A0A]">
      {/* Breadcrumb & Stage Status Strip */}
      <nav
        aria-label="Ruta del catálogo de proyectos de IA"
        className="border-b border-[#E5E7EB] bg-white"
      >
        <div className="swiss-container py-3 flex flex-wrap items-center justify-between gap-4">
          <div className="flex flex-wrap items-center gap-3">
            <Link
              href="/#proyectos-destacados"
              className="inline-flex items-center gap-2 px-3 py-1.5 border border-[#CBD5E1] bg-[#F8FAFC] hover:bg-[#EAECEF] text-[#0A0A0A] rounded-[2px] mono-label text-[11px] font-semibold transition-colors focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[#2563EB]"
            >
              ← SISTEMAS EN PRODUCCIÓN
            </Link>
            <span className="text-[#9CA3AF]" aria-hidden="true">
              /
            </span>
            <span className="mono-pixel text-[10px] text-[#4B5563]">
              DEKOLABS.ORG
            </span>
            <span className="text-[#9CA3AF]" aria-hidden="true">
              /
            </span>
            <span className="mono-pixel text-[10px] text-[#2563EB] font-semibold">
              PROYECTOS-IA
            </span>
          </div>

          <div className="flex items-center gap-2.5">
            <span className="inline-flex items-center gap-2 px-2.5 py-1 border border-[#CBD5E1] bg-[#F8FAFC] rounded-[2px] mono-pixel text-[10px] text-[#111827]">
              <span
                aria-hidden="true"
                className="h-2 w-2 rounded-full bg-[#2563EB]"
              />
              {visibleProjects.length > 0
                ? `${visibleProjects.length} PROYECTO${visibleProjects.length === 1 ? "" : "S"} EN CATÁLOGO DE IA`
                : "LABORATORIO AGÉNTICO ACTIVO"}
            </span>
          </div>
        </div>
      </nav>

      {/* Editorial Heading & Curated AI Projects Catalog */}
      <div className="py-10 sm:py-14 lg:py-16">
        <div className="swiss-container space-y-8 sm:space-y-10">
          <div className="space-y-3 border-b border-[#D1D5DB] pb-7">
            <div className="flex flex-wrap items-center justify-between gap-3">
              <span className="mono-pixel text-[10px] sm:text-[11px] text-[#2563EB] font-semibold tracking-wider">
                GOOGLE ADK · AGENTIC WORKFLOWS · PGVECTOR RAG
              </span>
              <span className="mono-pixel text-[10px] px-2.5 py-1 bg-[#EAECEF] border border-[#CBD5E1] text-[#111827] rounded-[2px]">
                STAGE // AI INCUBATION → PRODUCTION
              </span>
            </div>

            <h1
              id="ai-projects-heading"
              className="font-display text-3xl sm:text-4xl lg:text-[2.75rem] font-extrabold uppercase tracking-[-0.02em] text-[#0A0A0A] leading-[1.06]"
            >
              {section.heading}
            </h1>

            <p className="text-sm sm:text-base text-[#374151] leading-relaxed max-w-3xl">
              {section.subtitle}
            </p>
          </div>

          {visibleProjects.length > 0 ? (
            <div className="space-y-10">
              {visibleProjects.map((project, idx) => (
                <ProjectPreviewCard
                  key={project.id}
                  system={project}
                  isFirstCard={idx === 0}
                  headingTag="h2"
                />
              ))}
            </div>
          ) : (
            <div className="border border-[#9CA3AF] bg-white p-6 sm:p-8 lg:p-10 rounded-[2px] flex flex-col lg:flex-row lg:items-center justify-between gap-6 shadow-[0_1px_3px_rgba(0,0,0,0.04)]">
              <div className="space-y-2.5 max-w-3xl">
                <p className="mono-pixel text-[10px] sm:text-[11px] text-[#2563EB] font-semibold">
                  PIPELINE DE EXPERIMENTACIÓN &amp; DESARROLLO DE IA ACTIVO
                </p>
                <h2 className="font-display text-xl sm:text-2xl font-bold text-[#0A0A0A] tracking-[-0.01em]">
                  Nuevos desarrollos agénticos en etapa de construcción y validación
                </h2>
                <p className="text-xs sm:text-sm text-[#374151] leading-relaxed">
                  {section.emptyStateMessage} Cuando un desarrollo supera las compuertas operativas en producción, evoluciona directamente hacia el catálogo principal de sistemas verificados.
                </p>
              </div>

              <div className="flex flex-col sm:flex-row lg:flex-col items-start sm:items-center lg:items-end gap-3 shrink-0">
                <span className="mono-pixel text-[10px] px-3 py-1.5 bg-[#EAECEF] border border-[#CBD5E1] text-[#111827] rounded-[2px]">
                  CATÁLOGO EN CONSTRUCCIÓN
                </span>
                <Link
                  href="/#proyectos-destacados"
                  className="px-4 py-2.5 bg-[#0A0A0A] hover:bg-[#1F2937] text-white rounded-[2px] mono-label text-[11px] font-semibold transition-colors focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[#2563EB]"
                >
                  VER SISTEMAS EN PRODUCCIÓN →
                </Link>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
