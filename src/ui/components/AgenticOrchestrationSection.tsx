import React from "react";
import type {
  AgenticWorkflowNode,
  ArchitectureLayerSummary,
  HarnessVerificationGate,
  MakerCheckerSpec,
  McpIntegrationBridge
} from "@/types/portfolio";

export interface AgenticOrchestrationSectionProps {
  domain: string;
  architectureLayers: ArchitectureLayerSummary[];
  makerCheckerSpec: MakerCheckerSpec;
  workflowNodes: AgenticWorkflowNode[];
  verificationGates: HarnessVerificationGate[];
  mcpBridges: McpIntegrationBridge[];
}

export function AgenticOrchestrationSection({
  domain,
  architectureLayers,
  makerCheckerSpec,
  workflowNodes,
  verificationGates,
  mcpBridges
}: AgenticOrchestrationSectionProps) {
  return (
    <section
      id="orquestacion-agentica"
      aria-labelledby="agentic-orchestration-heading"
      className="border-b border-[var(--outline-variant)] py-20 bg-[var(--surface-container-lowest)]"
    >
      <div className="swiss-container space-y-14">
        {/* Section Header */}
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-end border-b border-[var(--outline-variant)] pb-8">
          <div className="lg:col-span-8 space-y-3">
            <div className="flex flex-wrap items-center gap-3">
              <span className="mono-label text-[var(--secondary)]">
                02 // AGENTIC ORCHESTRATION &amp; HARNESS ENGINEERING v2.1
              </span>
              <span className="hidden sm:inline text-[var(--outline-variant)]">
                |
              </span>
              <span className="mono-label px-2 py-0.5 border border-[var(--outline-variant)] bg-[var(--surface-container-low)] text-[var(--tertiary-fixed)] rounded-[2px]">
                ZERO-INHERITANCE · 100/100 DETERMINISTIC GATES
              </span>
            </div>
            <h2
              id="agentic-orchestration-heading"
              className="font-display text-3xl sm:text-4xl font-semibold tracking-tight text-[var(--primary)]"
            >
              Ingeniería de Arneses, Gobernanza de 6 Capas y Flujo Maker-Checker
            </h2>
            <p className="text-base text-[var(--on-surface-variant)] max-w-3xl leading-relaxed">
              Cada sistema comercial construido en{" "}
              <strong className="text-[var(--primary)] font-medium">
                {domain}
              </strong>{" "}
              opera bajo el{" "}
              <strong className="text-[var(--primary)] font-medium">
                Arnés Camaleón Universal v2.1
              </strong>
              : una arquitectura determinista que coordina agentes constructores
              y auditores independientes con candados mecánicos, protocolo MCP y
              verificación real antes de cada entrega a producción.
            </p>
          </div>

          <div className="lg:col-span-4 border border-[var(--outline-variant)] bg-[var(--surface-container-low)] p-4 rounded-[2px] space-y-2">
            <p className="mono-label text-[var(--secondary)]">
              PROTOCOLO ACTIVO EN REPOSITORIO
            </p>
            <p className="mono-code font-semibold text-[var(--primary)]">
              {makerCheckerSpec.protocolVersion}
            </p>
            <p className="mono-label text-[var(--tertiary-fixed)]">
              TARGET: {makerCheckerSpec.rubricTarget}
            </p>
          </div>
        </div>

        {/* Subsystem A: 6-Layer Strict Directional Architecture */}
        <div className="space-y-6">
          <div className="flex flex-col sm:flex-row sm:items-end justify-between gap-4">
            <div>
              <p className="mono-label text-[var(--secondary)]">
                SUBSISTEMA 02.A // ARQUITECTURA DIRECCIONAL DE 6 CAPAS
              </p>
              <h3 className="font-display text-xl sm:text-2xl font-semibold text-[var(--primary)] mt-1">
                Fronteras de Dominio Verificadas Mecánicamente
              </h3>
            </div>
            <p className="mono-label px-3 py-1.5 border border-[var(--outline-variant)] bg-[var(--surface-container-low)] text-[var(--primary)] rounded-[2px]">
              TYPES -&gt; CONFIG -&gt; REPO -&gt; SERVICE -&gt; RUNTIME -&gt; UI
            </p>
          </div>

          <ol
            role="list"
            className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4"
          >
            {architectureLayers.map((layer) => (
              <li
                key={layer.layer}
                className="border border-[var(--outline-variant)] bg-[var(--surface-container-low)] p-5 rounded-[2px] flex flex-col justify-between gap-4"
              >
                <div className="space-y-2.5">
                  <div className="flex items-center justify-between gap-2">
                    <span className="mono-label text-[var(--secondary)]">
                      CAPA 0{layer.order} // {layer.layer.toUpperCase()}
                    </span>
                    <code className="mono-label px-2 py-0.5 bg-[var(--surface-container-high)] text-[var(--primary)] rounded-[2px]">
                      {layer.folder}
                    </code>
                  </div>
                  <p className="text-sm text-[var(--primary)] font-medium leading-snug">
                    {layer.responsibility}
                  </p>
                </div>
                <p className="mono-label text-[var(--on-surface-variant)] border-t border-[var(--outline-variant)] pt-3">
                  INVARIANTE: {layer.invariantRule}
                </p>
              </li>
            ))}
          </ol>
        </div>

        {/* Subsystem B: 5-Node Graph Engineering & Maker-Checker One-Shot */}
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-start">
          {/* Left 7 Cols: 5-Node Execution Graph */}
          <div className="lg:col-span-7 space-y-5">
            <div>
              <p className="mono-label text-[var(--secondary)]">
                SUBSISTEMA 02.B // INGENIERÍA DE GRAFOS DE 5 NODOS (DAG)
              </p>
              <h3 className="font-display text-xl sm:text-2xl font-semibold text-[var(--primary)] mt-1">
                Ciclo de Entrega Determinista por Funcionalidad (WIP = 1)
              </h3>
            </div>

            <ol role="list" className="space-y-3">
              {workflowNodes.map((node) => (
                <li
                  key={node.nodeId}
                  className="border border-[var(--outline-variant)] bg-[var(--background)] p-5 rounded-[2px] space-y-3"
                >
                  <div className="flex flex-wrap items-center justify-between gap-2 border-b border-[var(--outline-variant)] pb-2.5">
                    <div className="flex items-center gap-2.5">
                      <span className="px-2 py-0.5 bg-[var(--primary)] text-[var(--background)] mono-label rounded-[2px]">
                        NODO {node.step}
                      </span>
                      <span className="mono-code font-semibold text-[var(--secondary)]">
                        {node.nodeId}
                      </span>
                    </div>
                    <span className="mono-label text-[var(--on-surface-variant)]">
                      ROL: {node.actorRole}
                    </span>
                  </div>

                  <div className="space-y-1.5">
                    <h4 className="font-display text-base font-semibold text-[var(--primary)]">
                      {node.title}
                    </h4>
                    <p className="text-sm text-[var(--on-surface-variant)] leading-relaxed">
                      {node.description}
                    </p>
                  </div>

                  <div className="flex flex-wrap items-center justify-between gap-2 pt-1">
                    <span className="mono-label text-[var(--tertiary-fixed)]">
                      POLÍTICA: {node.isolationPolicy}
                    </span>
                    <code className="mono-label px-2 py-0.5 border border-[var(--outline-variant)] bg-[var(--surface-container-low)] text-[var(--primary)] rounded-[2px]">
                      {node.deterministicArtifact}
                    </code>
                  </div>
                </li>
              ))}
            </ol>
          </div>

          {/* Right 5 Cols: Maker-Checker One-Shot & MCP Bridges */}
          <div className="lg:col-span-5 space-y-6">
            {/* Maker-Checker Card */}
            <div className="border border-[var(--outline-variant)] bg-[var(--surface-container-low)] p-6 rounded-[2px] space-y-4">
              <div className="space-y-1">
                <p className="mono-label text-[var(--tertiary-fixed)]">
                  SEPARACIÓN ESTRICTA MAKER-CHECKER · ONE-SHOT
                </p>
                <h3 className="font-display text-xl font-semibold text-[var(--primary)]">
                  Auditoría Aislada con Disyuntor de 4 Candados
                </h3>
              </div>

              <p className="text-sm text-[var(--on-surface-variant)] leading-relaxed">
                {makerCheckerSpec.summary}
              </p>

              <div className="border border-[var(--outline-variant)] bg-[var(--background)] p-3.5 rounded-[2px] space-y-1">
                <p className="mono-label text-[var(--secondary)]">
                  MODO DE AISLAMIENTO
                </p>
                <p className="mono-code text-xs text-[var(--primary)] font-medium">
                  {makerCheckerSpec.isolationMode}
                </p>
              </div>

              <div className="space-y-2">
                <p className="mono-label text-[var(--primary)]">
                  4-LOCK CIRCUIT BREAKER (FAIL-CLOSED):
                </p>
                <ul role="list" className="space-y-2">
                  {makerCheckerSpec.circuitBreakerLocks.map((lock) => (
                    <li
                      key={lock}
                      className="border-l-2 border-[var(--secondary)] pl-3 py-1 text-xs font-mono text-[var(--on-surface-variant)]"
                    >
                      {lock}
                    </li>
                  ))}
                </ul>
              </div>
            </div>

            {/* MCP Integration Bridges */}
            <div className="border border-[var(--outline-variant)] bg-[var(--surface-container-low)] p-6 rounded-[2px] space-y-4">
              <div>
                <p className="mono-label text-[var(--secondary)]">
                  MODEL CONTEXT PROTOCOL (MCP) &amp; NATIVE HOOKS
                </p>
                <h3 className="font-display text-xl font-semibold text-[var(--primary)] mt-1">
                  Puentes de Instrumentación Conectados
                </h3>
              </div>

              <ul role="list" className="space-y-3">
                {mcpBridges.map((bridge) => (
                  <li
                    key={bridge.id}
                    className="border border-[var(--outline-variant)] bg-[var(--background)] p-4 rounded-[2px] space-y-1.5"
                  >
                    <div className="flex items-center justify-between gap-2">
                      <span className="mono-label text-[var(--secondary)]">
                        {bridge.protocolCode}
                      </span>
                      <span className="mono-code text-xs font-semibold text-[var(--primary)]">
                        {bridge.serverName}
                      </span>
                    </div>
                    <p className="text-xs text-[var(--on-surface-variant)] leading-relaxed">
                      {bridge.purpose}
                    </p>
                    <p className="mono-label text-[var(--tertiary-fixed)] pt-1">
                      BOUNDARY: {bridge.securityBoundary}
                    </p>
                  </li>
                ))}
              </ul>
            </div>
          </div>
        </div>

        {/* Subsystem C: 3 Additive Verification Gates */}
        <div className="space-y-6">
          <div className="flex flex-col sm:flex-row sm:items-end justify-between gap-4">
            <div>
              <p className="mono-label text-[var(--tertiary-fixed)]">
                SUBSISTEMA 02.C // VERIFICACIÓN EN 3 PUERTAS ADITIVAS
              </p>
              <h3 className="font-display text-xl sm:text-2xl font-semibold text-[var(--primary)] mt-1">
                Compuertas de Calidad Ejecutables (Cero Inspección Visual Subjetiva)
              </h3>
            </div>
            <code className="mono-label px-3 py-1.5 border border-[var(--outline-variant)] bg-[var(--background)] text-[var(--tertiary-fixed)] rounded-[2px]">
              ENTRYPOINT: bash ./init.sh
            </code>
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
            {verificationGates.map((gate) => (
              <article
                key={gate.gateNumber}
                className="border border-[var(--outline-variant)] bg-[var(--surface-container-low)] p-6 rounded-[2px] flex flex-col justify-between gap-5"
              >
                <div className="space-y-4">
                  <div className="flex items-center justify-between gap-2 border-b border-[var(--outline-variant)] pb-3">
                    <span className="px-2.5 py-1 bg-[var(--primary)] text-[var(--background)] mono-label rounded-[2px]">
                      {gate.gateNumber}
                    </span>
                    <span className="mono-label text-[var(--tertiary-fixed)]">
                      FAIL-FAST GATE
                    </span>
                  </div>

                  <div className="space-y-1.5">
                    <h4 className="font-display text-lg font-semibold text-[var(--primary)]">
                      {gate.title}
                    </h4>
                    <p className="text-xs text-[var(--on-surface-variant)]">
                      {gate.focusArea}
                    </p>
                  </div>

                  <div className="border border-[var(--outline-variant)] bg-[var(--background)] p-2.5 rounded-[2px]">
                    <p className="mono-label text-[var(--secondary)] mb-1">
                      COMANDO DE VERIFICACIÓN
                    </p>
                    <code className="mono-code text-xs text-[var(--primary)] break-all">
                      $ {gate.command}
                    </code>
                  </div>

                  <ul role="list" className="space-y-2">
                    {gate.invariantsChecked.map((invariant) => (
                      <li
                        key={invariant}
                        className="flex items-start gap-2 text-xs text-[var(--on-surface-variant)] leading-relaxed"
                      >
                        <span
                          aria-hidden="true"
                          className="mono-label text-[var(--tertiary-fixed)] mt-0.5"
                        >
                          [OK]
                        </span>
                        <span>{invariant}</span>
                      </li>
                    ))}
                  </ul>
                </div>

                <div className="border-t border-[var(--outline-variant)] pt-3">
                  <p className="mono-label text-[var(--tertiary-fixed)]">
                    CRITERIO DE PASE: {gate.passThreshold}
                  </p>
                </div>
              </article>
            ))}
          </div>
        </div>
      </div>
    </section>
  );
}
