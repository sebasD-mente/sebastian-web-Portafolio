import React from "react";
import Link from "next/link";

export function TechStackSection() {
  return (
    <section
      id="stack-tecnologico"
      aria-labelledby="tech-stack-heading"
      className="py-10 sm:py-14 lg:py-16 bg-[#F8F9FA] border-t border-[#E5E7EB]"
    >
      <div className="swiss-container space-y-7 sm:space-y-8">
        <div className="flex flex-wrap items-end justify-between gap-4">
          <div className="space-y-2">
            <span className="mono-pixel text-[10px] sm:text-[11px] text-[#2563EB] font-semibold tracking-wider block">
              02 // ARQUITECTURA &amp; HERRAMIENTAS
            </span>
            <h2
              id="tech-stack-heading"
              className="font-display text-3xl sm:text-4xl lg:text-[2.65rem] font-extrabold uppercase tracking-[-0.02em] text-[#0A0A0A] leading-[1.06]"
            >
              STACK TECNOLÓGICO
            </h2>
          </div>

          <span className="inline-flex items-center gap-2 px-3 py-1.5 bg-[#EAECEF] border border-[#CBD5E1] text-[#111827] rounded-[2px] mono-pixel text-[10px]">
            <span
              aria-hidden="true"
              className="h-2 w-2 rounded-full bg-[#2563EB]"
            />
            SECCIÓN EN CONSTRUCCIÓN
          </span>
        </div>

        <div className="border border-[#9CA3AF] bg-white p-6 sm:p-8 lg:p-10 rounded-[2px] flex flex-col lg:flex-row lg:items-center justify-between gap-6 shadow-[0_1px_3px_rgba(0,0,0,0.04)]">
          <div className="space-y-3 max-w-3xl">
            <p className="mono-pixel text-[10px] sm:text-[11px] text-[#2563EB] font-semibold">
              CURADURÍA TÉCNICA DE CAPACIDADES COMERCIALES &amp; AGÉNTICAS
            </p>
            <h3 className="font-display text-xl sm:text-2xl font-bold text-[#0A0A0A] tracking-[-0.01em]">
              Matriz interactiva de arquitectura e infraestructura en preparación
            </h3>
            <p className="text-xs sm:text-sm text-[#374151] leading-relaxed">
              Esta sección se encuentra actualmente en construcción y curaduría
              técnica para documentar en detalle el stack de producción:
              orquestación de agentes autónomos con Google ADK y MCP, pipelines
              RAG híbridos sobre PostgreSQL 17 + pgvector, aplicaciones
              full-stack en Next.js 15 / TypeScript / Python e infraestructura
              autoalojada en Linux Home Lab.
            </p>
          </div>

          <div className="flex flex-col sm:flex-row lg:flex-col items-start sm:items-center lg:items-end gap-3 shrink-0">
            <span className="mono-pixel text-[10px] px-3 py-1.5 bg-[#F8FAFC] border border-[#CBD5E1] text-[#4B5563] rounded-[2px]">
              GOOGLE ADK · MCP · PGVECTOR · LINUX
            </span>
            <Link
              href="/#contacto"
              className="px-4 py-2.5 bg-[#0A0A0A] hover:bg-[#1F2937] text-white rounded-[2px] mono-label text-[11px] font-semibold transition-colors focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[#2563EB]"
            >
              CONSULTAR DISPONIBILIDAD TÉCNICA →
            </Link>
          </div>
        </div>
      </div>
    </section>
  );
}
