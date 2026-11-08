"use client";

import React, { useState } from "react";
import type {
  CommercialDeliveryBlueprint,
  StackCapabilityCategoryId,
  StackCapabilityCategoryOption,
  StackCapabilityItem
} from "@/types/portfolio";

export interface TechStackMatrixProps {
  categories: StackCapabilityCategoryOption[];
  capabilities: StackCapabilityItem[];
  commercialBlueprints: CommercialDeliveryBlueprint[];
}

export function TechStackMatrix({
  categories,
  capabilities,
  commercialBlueprints
}: TechStackMatrixProps) {
  const [selectedCategory, setSelectedCategory] =
    useState<StackCapabilityCategoryId>("all");

  const filteredCapabilities =
    selectedCategory === "all"
      ? capabilities
      : capabilities.filter((item) => item.category === selectedCategory);

  const activeCategoryLabel =
    categories.find((cat) => cat.id === selectedCategory)?.label ??
    "Matriz Completa";

  return (
    <section
      id="matriz-stack-comercial"
      aria-labelledby="tech-stack-matrix-heading"
      className="border-b border-[var(--outline-variant)] py-20 bg-[var(--background)]"
    >
      <div className="swiss-container space-y-14">
        {/* Header + Filter Controls */}
        <div className="flex flex-col lg:flex-row lg:items-end justify-between gap-6 border-b border-[var(--outline-variant)] pb-8">
          <div className="space-y-3 max-w-3xl">
            <p className="mono-label text-[var(--secondary)]">
              02.D // MATRIZ DEL STACK TECNOLÓGICO &amp; CAPACIDADES COMERCIALES
            </p>
            <h2
              id="tech-stack-matrix-heading"
              className="font-display text-3xl sm:text-4xl font-semibold tracking-tight text-[var(--primary)]"
            >
              Stack de Producción Disponible para Contratos End-to-End y Freelance
            </h2>
            <p className="text-base text-[var(--on-surface-variant)] leading-relaxed">
              Especificación transparente de tecnologías, capas arquitectónicas y
              estándares de verificación con los que Sebastián diseña, construye
              y despliega software comercial de misión crítica.
            </p>
          </div>

          {/* Accessible Category Filter Buttons */}
          <div
            role="group"
            aria-label="Filtrar matriz de stack por dominio técnico"
            className="flex flex-wrap items-center gap-2"
          >
            {categories.map((cat) => {
              const isSelected = selectedCategory === cat.id;
              return (
                <button
                  key={cat.id}
                  type="button"
                  aria-pressed={isSelected}
                  onClick={() => setSelectedCategory(cat.id)}
                  className={`min-h-9 px-3.5 py-2 border rounded-[2px] mono-label transition-colors cursor-pointer focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[var(--secondary)] ${
                    isSelected
                      ? "border-[var(--primary)] bg-[var(--primary)] text-[var(--background)]"
                      : "border-[var(--outline-variant)] bg-[var(--surface-container-low)] text-[var(--primary)] hover:bg-[var(--surface-container-high)]"
                  }`}
                >
                  {cat.code} // {cat.label} ({cat.count})
                </button>
              );
            })}
          </div>
        </div>

        {/* Responsive Accessible Data Table */}
        <div className="space-y-3">
          <div className="flex flex-wrap items-center justify-between gap-2">
            <p className="mono-label text-[var(--on-surface-variant)]">
              FILTRO ACTIVO:{" "}
              <strong className="text-[var(--primary)]">
                {activeCategoryLabel.toUpperCase()}
              </strong>{" "}
              · MOSTRANDO {filteredCapabilities.length} DE {capabilities.length}{" "}
              CAPACIDADES
            </p>
            <span className="mono-label text-[var(--tertiary-fixed)]">
              SCROLL HORIZONTAL Y TECLADO HABILITADO (TABINDEX=0)
            </span>
          </div>

          <div
            tabIndex={0}
            role="region"
            aria-labelledby="commercial-stack-table-caption"
            className="overflow-x-auto border border-[var(--outline-variant)] bg-[var(--surface-container-lowest)] rounded-[2px] focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[var(--secondary)]"
          >
            <table className="w-full text-left border-collapse min-w-[880px]">
              <caption
                id="commercial-stack-table-caption"
                className="sr-only"
              >
                Matriz del stack tecnológico de Sebastián para proyectos comerciales ({activeCategoryLabel})
              </caption>
              <thead className="sticky top-0 z-10 bg-[var(--surface-container-low)] border-b border-[var(--outline-variant)]">
                <tr>
                  <th
                    scope="col"
                    className="p-4 mono-label text-[var(--primary)] border-r border-[var(--outline-variant)] w-[24%]"
                  >
                    Tecnología &amp; Dominio
                  </th>
                  <th
                    scope="col"
                    className="p-4 mono-label text-[var(--primary)] border-r border-[var(--outline-variant)] w-[12%]"
                  >
                    Capa (6-Layer)
                  </th>
                  <th
                    scope="col"
                    className="p-4 mono-label text-[var(--primary)] border-r border-[var(--outline-variant)] w-[26%]"
                  >
                    Rol en Producción
                  </th>
                  <th
                    scope="col"
                    className="p-4 mono-label text-[var(--primary)] border-r border-[var(--outline-variant)] w-[24%]"
                  >
                    Caso de Uso para Clientes
                  </th>
                  <th
                    scope="col"
                    className="p-4 mono-label text-[var(--primary)] w-[14%]"
                  >
                    Verificación &amp; Estado
                  </th>
                </tr>
              </thead>
              <tbody className="divide-y divide-[var(--outline-variant)]">
                {filteredCapabilities.map((item) => (
                  <tr
                    key={item.id}
                    className="hover:bg-[var(--surface-container-low)]/60 transition-colors"
                  >
                    <th
                      scope="row"
                      className="sticky left-0 z-[1] bg-[var(--surface-container-lowest)] p-4 align-top border-r border-[var(--outline-variant)]"
                    >
                      <div className="space-y-1">
                        <p className="font-display text-sm font-semibold text-[var(--primary)]">
                          {item.technology}
                        </p>
                        <p className="mono-label text-[var(--secondary)]">
                          {item.categoryLabel}
                        </p>
                      </div>
                    </th>
                    <td className="p-4 align-top border-r border-[var(--outline-variant)]">
                      <code className="mono-label px-2 py-1 border border-[var(--outline-variant)] bg-[var(--surface-container-low)] text-[var(--primary)] rounded-[2px]">
                        {item.architecturalLayer}
                      </code>
                    </td>
                    <td className="p-4 align-top text-xs text-[var(--on-surface-variant)] leading-relaxed border-r border-[var(--outline-variant)]">
                      {item.productionRole}
                    </td>
                    <td className="p-4 align-top text-xs text-[var(--primary)] leading-relaxed border-r border-[var(--outline-variant)]">
                      {item.commercialUseCase}
                    </td>
                    <td className="p-4 align-top space-y-1.5">
                      <span className="inline-block mono-label px-2 py-0.5 border border-[var(--outline-variant)] bg-[var(--surface-container-low)] text-[var(--tertiary-fixed)] rounded-[2px]">
                        {item.statusBadge}
                      </span>
                      <p className="mono-label text-[var(--on-surface-variant)]">
                        {item.verificationStandard}
                      </p>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>

        {/* Commercial Delivery Blueprints */}
        <div className="space-y-6 pt-4">
          <div className="flex flex-col sm:flex-row sm:items-end justify-between gap-4">
            <div>
              <p className="mono-label text-[var(--secondary)]">
                02.E // MODALIDADES DE EJECUCIÓN PARA CLIENTES &amp; EQUIPOS
              </p>
              <h3 className="font-display text-2xl font-semibold text-[var(--primary)] mt-1">
                Blueprints de Contratación e Implementación Técnica
              </h3>
            </div>
            <a
              href="#contacto"
              className="inline-flex items-center gap-2 px-4 py-2.5 bg-[var(--primary)] text-[var(--background)] rounded-[2px] mono-label hover:opacity-90 transition-opacity"
            >
              SOLICITAR PROPUESTA TÉCNICA -&gt;
            </a>
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
            {commercialBlueprints.map((blueprint) => (
              <article
                key={blueprint.id}
                className="border border-[var(--outline-variant)] bg-[var(--surface-container-low)] p-6 rounded-[2px] flex flex-col justify-between gap-6"
              >
                <div className="space-y-4">
                  <div className="flex items-center justify-between gap-2 border-b border-[var(--outline-variant)] pb-3">
                    <span className="mono-label text-[var(--secondary)]">
                      {blueprint.code}
                    </span>
                    <span className="mono-label px-2 py-0.5 bg-[var(--surface-container-high)] text-[var(--primary)] rounded-[2px]">
                      {blueprint.targetTimeline}
                    </span>
                  </div>

                  <div className="space-y-2">
                    <h4 className="font-display text-xl font-semibold text-[var(--primary)]">
                      {blueprint.title}
                    </h4>
                    <p className="mono-label text-[var(--tertiary-fixed)]">
                      MODALIDAD: {blueprint.engagementModel}
                    </p>
                    <p className="text-sm text-[var(--on-surface-variant)] leading-relaxed">
                      {blueprint.summary}
                    </p>
                  </div>

                  <div className="space-y-2 pt-1">
                    <p className="mono-label text-[var(--primary)]">
                      ENTREGABLES INCLUIDOS:
                    </p>
                    <ul role="list" className="space-y-2">
                      {blueprint.includedDeliverables.map((deliverable) => (
                        <li
                          key={deliverable}
                          className="flex items-start gap-2 text-xs text-[var(--on-surface-variant)] leading-relaxed"
                        >
                          <span
                            aria-hidden="true"
                            className="mono-label text-[var(--secondary)] mt-0.5"
                          >
                            +
                          </span>
                          <span>{deliverable}</span>
                        </li>
                      ))}
                    </ul>
                  </div>
                </div>

                <div className="border-t border-[var(--outline-variant)] pt-3 flex items-center justify-between gap-2">
                  <span className="mono-label text-[var(--tertiary-fixed)]">
                    GARANTÍA: {blueprint.qualityGuarantee}
                  </span>
                </div>
              </article>
            ))}
          </div>
        </div>
      </div>
    </section>
  );
}
