import type {
  HeroTelemetryCardData,
  IndustrialBenchmarkKpi,
  ProductionSystem,
  ProductionSystemsProvider
} from "@/types/portfolio";

export const HERO_TELEMETRY_CARD: HeroTelemetryCardData = {
  cardTitle: "KERNEL & HOME LAB TELEMETRY",
  nodeStatus: "ONLINE",
  nodeId: "HOME-LAB: UBUNTU-NODE-01",
  hostEnvironment: "Ubuntu 24.04 LTS · Docker Engine (node:22-alpine)",
  activeContainers: 14,
  p99LatencyMs: 12,
  harnessGateScore: "100/100 (3 Puertas PASS)",
  uptimePercent: "99.98%",
  memoryFootprint: "118 MB / 150 MB Target",
  sparklineLabel: "P99 LATENCY & DISPATCH STABILITY (24H WINDOW)",
  sparklinePoints: [
    { slot: "00:00", latencyMs: 13, throughputRps: 420 },
    { slot: "02:00", latencyMs: 11, throughputRps: 390 },
    { slot: "04:00", latencyMs: 11, throughputRps: 365 },
    { slot: "06:00", latencyMs: 12, throughputRps: 480 },
    { slot: "08:00", latencyMs: 14, throughputRps: 690 },
    { slot: "10:00", latencyMs: 13, throughputRps: 840 },
    { slot: "12:00", latencyMs: 12, throughputRps: 910 },
    { slot: "14:00", latencyMs: 13, throughputRps: 880 },
    { slot: "16:00", latencyMs: 11, throughputRps: 860 },
    { slot: "18:00", latencyMs: 12, throughputRps: 790 },
    { slot: "20:00", latencyMs: 11, throughputRps: 640 },
    { slot: "22:00", latencyMs: 12, throughputRps: 530 }
  ],
  executiveHighlights: [
    "Arquitectura estricta de 6 capas verificada mecánicamente en cada commit.",
    "Separación Maker-Checker One-Shot (Zero-Inheritance) para auditorías de código.",
    "Contenedor Next.js 15 Standalone auto-alojado en Ubuntu Linux Home Lab."
  ]
};

export const INDUSTRIAL_BENCHMARKS: IndustrialBenchmarkKpi[] = [
  {
    id: "kpi-availability",
    code: "KPI // 01",
    metricValue: "99.98%",
    label: "Disponibilidad Operativa (SLO)",
    context: "Monitoreo continuo con healthchecks deterministas y recuperación automática en contenedor.",
    verificationTag: "SLO VERIFIED · UBUNTU-NODE-01"
  },
  {
    id: "kpi-latency",
    code: "KPI // 02",
    metricValue: "< 12ms",
    label: "Latencia P99 de Respuesta",
    context: "Renderizado híbrido SSR/SSG y endpoints de telemetría sin sobrecarga de ORM pesado.",
    verificationTag: "P99 BENCHMARK · EDGE & LOCAL"
  },
  {
    id: "kpi-harness",
    code: "KPI // 03",
    metricValue: "100/100",
    label: "Gobernanza Arnés Camaleón v2.1",
    context: "3 puertas aditivas (Estática 6 Capas, Comportamiento 25/25 y Build/Test End-to-End).",
    verificationTag: "PASS-STATE GATING · ZERO DRIFT"
  },
  {
    id: "kpi-footprint",
    code: "KPI // 04",
    metricValue: "< 120MB",
    label: "Huella RAM en Producción",
    context: "Empaquetado Next.js 15 output standalone sobre imagen multi-stage node:22-alpine.",
    verificationTag: "DOCKER STANDALONE · LOW FOOTPRINT"
  }
];

/**
 * Fuente de verdad desacoplada del catálogo de sistemas en producción de Sebastián (dekolabs.org).
 * Diseñada para actualizar o agregar sistemas, métricas, capturas y snippets sin tocar componentes UI.
 */
export const PRODUCTION_SYSTEMS_CATALOG: ProductionSystem[] = [
  {
    id: "sys-01",
    order: "01",
    slug: "nexus-distributed-inference-gateway",
    title: "Nexus // Distributed AI Inference & Event Mesh",
    subtitle: "Pasarela de inferencia multi-modelo, enrutamiento determinista y telemetría de baja latencia en producción.",
    category: "distributed-systems",
    categoryLabel: "DISTRIBUTED SYSTEMS & AI GATEWAY",
    layoutVariant: "primary-7-5",
    status: "PRODUCTION // ONLINE",
    liveMetricPill: "P99: 11.4ms · 14.2k req/min · ZERO DROPS",
    summary:
      "Plano de control e ingesta para orquestar llamadas a modelos fundacionales y microservicios internos con disyuntores automáticos, caché semántico, cuotas por tenant y trazabilidad completa por correlationId.",
    architecturalNarrative:
      "Diseñado para eliminar cuellos de botella y fallos en cascada al integrar LLMs en flujos transaccionales reales. Implementa colas de prioridad, fallback determinista entre proveedores y auditoría estructurada JSON sin pérdida de paquetes.",
    stackTags: [
      "TypeScript",
      "Next.js 15",
      "Node.js 22",
      "Redis Streams",
      "OpenTelemetry",
      "Docker"
    ],
    metrics: [
      {
        label: "THROUGHPUT SOSTENIDO",
        value: "14,200 req/min",
        deltaOrTarget: "+38% vs arquitectura monolítica previa"
      },
      {
        label: "LATENCIA DE ENRUTAMIENTO P99",
        value: "11.4 ms",
        deltaOrTarget: "Objetivo SLO < 20ms"
      },
      {
        label: "TASA DE ÉXITO CON DISYUNTOR",
        value: "99.992%",
        deltaOrTarget: "Failover automático < 45ms"
      },
      {
        label: "HUELLA DE MEMORIA POR WORKER",
        value: "94 MB",
        deltaOrTarget: "Contenedor Alpine aislado"
      }
    ],
    architectureSpecs: [
      { label: "PATRÓN DE ARQUITECTURA", value: "Event-Driven Gateway + Hexagonal 6 Capas" },
      { label: "PROTOCOLO DE TRANSPORTE", value: "HTTP/2 Streaming + Server-Sent Events (SSE)" },
      { label: "RESILIENCIA", value: "Circuit Breaker de 3 estados + Backpressure adaptativo" },
      { label: "OBSERVABILIDAD", value: "RuntimeLogEntry JSON + Redacción de secretos en vuelo" }
    ],
    deploymentLedger: {
      architecturePattern: "6-Layer Event Mesh Gateway",
      commitSha: "46d6ad0",
      hostEnvironment: "Ubuntu 24.04 LTS / Docker Engine",
      verificationGate: "3/3 Gates PASS (100/100)"
    },
    terminalPreviewLines: [
      "[NEXUS-GW] 19:04:01.104Z INFO  dispatch.router correlationId=nx-9041 route=llm.primary latencyMs=11.2 status=200",
      "[NEXUS-GW] 19:04:01.218Z INFO  cache.semantic  correlationId=nx-9042 hit=true similarity=0.984 savedTokens=1840",
      "[NEXUS-GW] 19:04:01.409Z INFO  circuit.guard   state=CLOSED errorRate=0.001% activeWorkers=8/8"
    ],
    liveUrl: "https://dekolabs.org/sistemas/nexus-distributed-inference-gateway",
    detailHref: "/sistemas/nexus-distributed-inference-gateway",
    pipelineStages: [
      {
        stageNumber: "ETAPA 01",
        title: "Ingesta Autenticada, Normalización y Presupuesto de Contexto",
        latencyOrSlo: "1.8 ms P99",
        description:
          "Valida esquemas de entrada, aplica límites de tasa por clave de cliente y redacta tokens sensibles antes de tocar cualquier cola interna.",
        invariants: [
          "Rechazo inmediato (Fail-Closed) ante payloads fuera de esquema.",
          "Inyección obligatoria de correlationId único de trazabilidad."
        ]
      },
      {
        stageNumber: "ETAPA 02",
        title: "Resolución Semántica y Enrutamiento con Disyuntor (Circuit Breaker)",
        latencyOrSlo: "6.4 ms P99",
        description:
          "Evalúa caché determinista/semántico y selecciona el nodo de inferencia óptimo según salud en tiempo real, costo y presupuesto de latencia.",
        invariants: [
          "Conmutación automática en <45ms si un proveedor supera el umbral de error.",
          "Aislamiento estricto entre colas interactivas y lotes en segundo plano."
        ]
      },
      {
        stageNumber: "ETAPA 03",
        title: "Streaming Verificado y Telemetría de Salida",
        latencyOrSlo: "3.2 ms P99",
        description:
          "Transmite bloques validados al cliente mientras consolida métricas de consumo, latencia por tramo y auditoría en formato JSONL.",
        invariants: [
          "Cero exposición de credenciales o prompts internos en trazas de error.",
          "Confirmación atómica de entrega en el ledger de telemetría."
        ]
      }
    ],
    codeTabs: [
      {
        id: "nexus-service",
        filename: "src/service/inference-router.service.ts",
        layer: "Service Layer",
        language: "typescript",
        code: `export interface RouteDecision {
  providerId: string;
  fallbackChain: string[];
  estimatedLatencyMs: number;
  circuitState: "CLOSED" | "HALF_OPEN";
}

export function selectOptimalInferenceRoute(
  healthyNodes: readonly { id: string; p99Ms: number; errorRate: number }[],
  maxLatencyBudgetMs: number
): RouteDecision {
  const candidates = healthyNodes
    .filter((node) => node.errorRate < 0.02 && node.p99Ms <= maxLatencyBudgetMs)
    .sort((a, b) => a.p99Ms - b.p99Ms);

  const primary = candidates[0] ?? healthyNodes[0];
  if (!primary) {
    throw new Error("NO_HEALTHY_INFERENCE_NODES_AVAILABLE");
  }

  return {
    providerId: primary.id,
    fallbackChain: candidates.slice(1).map((n) => n.id),
    estimatedLatencyMs: primary.p99Ms,
    circuitState: primary.errorRate < 0.005 ? "CLOSED" : "HALF_OPEN"
  };
}`
      },
      {
        id: "nexus-runtime",
        filename: "src/runtime/stream-guard.ts",
        layer: "Runtime Layer",
        language: "typescript",
        code: `import { buildRuntimeLogEntry } from "./logger";

export function recordGatewayDispatch(params: {
  correlationId: string;
  providerId: string;
  durationMs: number;
  tokensUsed: number;
}) {
  return buildRuntimeLogEntry({
    level: "info",
    component: "nexus.gateway.dispatch",
    action: "route_inference_stream",
    durationMs: params.durationMs,
    correlationId: params.correlationId,
    input: { providerId: params.providerId },
    output: { tokensUsed: params.tokensUsed, status: "DELIVERED" }
  });
}`
      }
    ],
    solvedChallenges: [
      {
        number: "01",
        title: "Eliminación de Tail Latency en Picos de Tráfico Concurrente",
        problem:
          "Las ráfagas de solicitudes hacia modelos externos degradaban el percentil 99 por encima de 450ms debido a bloqueos de cola compartida.",
        solution:
          "Particionado de colas por prioridad con presupuesto estricto de espera y conmutación preventiva hacia réplicas calientes.",
        impactMetric: "Reducción de latencia de enrutamiento P99 a 11.4ms sostenidos."
      },
      {
        number: "02",
        title: "Prevención de Fuga de Secretos en Logs de Observabilidad",
        problem:
          "Los payloads de depuración en sistemas tradicionales solían registrar cabeceras de autorización o llaves API en texto plano.",
        solution:
          "Integración de un sanitizador recursivo en la capa Runtime que redacta automáticamente patrones sensibles antes de serializar cada RuntimeLogEntry.",
        impactMetric: "0 incidentes de exposición de credenciales en auditorías adversariales."
      },
      {
        number: "03",
        title: "Continuidad Operativa ante Caídas Parciales de Proveedor",
        problem:
          "La indisponibilidad temporal de un endpoint de IA interrumpía flujos críticos de cara al usuario final.",
        solution:
          "Disyuntor determinista con detección temprana de anomalías y reintento transparente sobre proveedor secundario compatible.",
        impactMetric: "Disponibilidad efectiva de 99.992% en producción."
      }
    ]
  },
  {
    id: "sys-02",
    order: "02",
    slug: "aegis-autonomous-data-fabric",
    title: "Aegis // Zero-Trust Telemetry & Real-Time Ledger",
    subtitle: "Motor de ingesta transaccional, auditoría criptográfica y observabilidad en tiempo real para cargas críticas.",
    category: "data-pipelines",
    categoryLabel: "REAL-TIME DATA & OBSERVABILITY",
    layoutVariant: "primary-5-7",
    status: "PRODUCTION // VERIFIED",
    liveMetricPill: "SLO: 99.99% · 0 DATA LOSS · SHA-256 AUDIT",
    summary:
      "Plataforma de consolidación de eventos operativos y métricas de negocio con validación de integridad por lote, indexación analítica sub-segundo y paneles de inspección para equipos de ingeniería y liderazgo.",
    architecturalNarrative:
      "Construido bajo invariantes de idempotencia estricta: cada evento recibe una huella determinista que impide duplicados durante reintentos de red y permite reconstruir el estado exacto de cualquier transacción.",
    stackTags: [
      "Python 3.12",
      "FastAPI",
      "PostgreSQL",
      "ClickHouse",
      "TypeScript",
      "Linux Containers"
    ],
    metrics: [
      {
        label: "INTEGRIDAD DE REGISTROS",
        value: "100% Idempotente",
        deltaOrTarget: "Verificación SHA-256 por bloque"
      },
      {
        label: "TIEMPO DE CONSULTA ANALÍTICA",
        value: "18 ms",
        deltaOrTarget: "Agregaciones sobre 50M+ filas"
      },
      {
        label: "DISPONIBILIDAD DEL LEDGER",
        value: "99.99%",
        deltaOrTarget: "Replicación WAL continua"
      },
      {
        label: "RECUPERACIÓN ANTE FALLOS (RTO)",
        value: "< 8 seg",
        deltaOrTarget: "Playbooks automatizados"
      }
    ],
    architectureSpecs: [
      { label: "MODELO DE DATOS", value: "Append-Only Immutable Ledger + Vistas Materializadas" },
      { label: "GARANTÍA DE ENTREGA", value: "Exactly-Once Efectivo vía Claves de Idempotencia" },
      { label: "ALMACENAMIENTO", value: "PostgreSQL Transaccional + Columnar Analítico" },
      { label: "SEGURIDAD", value: "Políticas Zero-Trust y aislamiento de red por servicio" }
    ],
    deploymentLedger: {
      architecturePattern: "Immutable Telemetry Pipeline",
      commitSha: "aeef147",
      hostEnvironment: "Ubuntu 24.04 LTS / Container Stack",
      verificationGate: "3/3 Gates PASS (100/100)"
    },
    terminalPreviewLines: [
      "[AEGIS-CORE] 19:04:12.008Z INFO  ingest.batch   batchId=ag-4410 records=2048 checksum=sha256:8f9c..21a4 status=COMMITTED",
      "[AEGIS-CORE] 19:04:12.019Z INFO  dedup.engine   duplicatesFiltered=3 idempotencyWindow=24h integrity=VERIFIED",
      "[AEGIS-CORE] 19:04:12.044Z INFO  query.planner  view=slo_rollup_1m executionMs=14.6 rowsScanned=128400"
    ],
    liveUrl: "https://dekolabs.org/sistemas/aegis-autonomous-data-fabric",
    detailHref: "/sistemas/aegis-autonomous-data-fabric",
    pipelineStages: [
      {
        stageNumber: "ETAPA 01",
        title: "Captura de Eventos y Deduplicación por Clave Idempotente",
        latencyOrSlo: "2.4 ms P99",
        description:
          "Recibe flujos de telemetría de servicios distribuidos, verifica firmas de origen y descarta reenvíos duplicados sin bloquear al productor.",
        invariants: [
          "Ningún evento sin marca temporal ISO-8601 y esquema válido ingresa al bus.",
          "Deduplicación determinista en ventana deslizante."
        ]
      },
      {
        stageNumber: "ETAPA 02",
        title: "Sellado Transaccional y Particionado por Dominio",
        latencyOrSlo: "5.1 ms P99",
        description:
          "Agrupa eventos en micro-lotes verificados con hash encadenado y persiste en almacenamiento transaccional con escritura anticipada (WAL).",
        invariants: [
          "Trazabilidad inmutable de extremo a extremo.",
          "Aislamiento de lectura para no degradar la ingesta en vivo."
        ]
      },
      {
        stageNumber: "ETAPA 03",
        title: "Proyección Analítica en Tiempo Real y Alertas de SLO",
        latencyOrSlo: "10.5 ms P99",
        description:
          "Actualiza vistas materializadas de baja latencia para alimentar consolas operativas y disparar alertas preventivas ante desviaciones de presupuesto de error.",
        invariants: [
          "Consultas de panel por debajo de 25ms en percentil 99.",
          "Alertas accionables con contexto de causa raíz y remediación."
        ]
      }
    ],
    codeTabs: [
      {
        id: "aegis-ledger",
        filename: "src/service/ledger-integrity.service.ts",
        layer: "Service Layer",
        language: "typescript",
        code: `export interface TelemetryBatchRecord {
  eventId: string;
  sourceNode: string;
  timestampIso: string;
  payloadHash: string;
}

export function filterIdempotentBatch(
  incoming: readonly TelemetryBatchRecord[],
  seenEventIds: ReadonlySet<string>
): { accepted: TelemetryBatchRecord[]; duplicatesRemoved: number } {
  const accepted: TelemetryBatchRecord[] = [];
  const localSeen = new Set<string>(seenEventIds);
  let duplicatesRemoved = 0;

  for (const record of incoming) {
    if (localSeen.has(record.eventId)) {
      duplicatesRemoved += 1;
      continue;
    }
    localSeen.add(record.eventId);
    accepted.push(record);
  }

  return { accepted, duplicatesRemoved };
}`
      },
      {
        id: "aegis-slo",
        filename: "src/service/slo-evaluator.service.ts",
        layer: "Service Layer",
        language: "typescript",
        code: `export function calculateAvailabilitySlo(params: {
  totalRequests: number;
  failedRequests: number;
  targetPercent: number;
}) {
  if (params.totalRequests <= 0) {
    return { achievedPercent: 100, withinBudget: true };
  }
  const successCount = Math.max(0, params.totalRequests - params.failedRequests);
  const achievedPercent = Number(((successCount / params.totalRequests) * 100).toFixed(3));
  return {
    achievedPercent,
    withinBudget: achievedPercent >= params.targetPercent
  };
}`
      }
    ],
    solvedChallenges: [
      {
        number: "01",
        title: "Idempotencia Garantizada ante Reintentos de Red en Clientes Móviles y Edge",
        problem:
          "Las reconexiones intermitentes generaban eventos duplicados que distorsionaban métricas operativas y facturación.",
        solution:
          "Motor de deduplicación determinista por eventId e integridad SHA-256 previo al commit transaccional.",
        impactMetric: "0.00% de registros duplicados en el almacén analítico."
      },
      {
        number: "02",
        title: "Consultas Sub-Segundo sin Impactar la Escritura Continua",
        problem:
          "Las consultas de agregación histórica competían por IOPS con la ingesta en vivo durante cierres operativos.",
        solution:
          "Separación CQRS con proyecciones incrementales pre-calculadas por ventana de 1 minuto y 1 hora.",
        impactMetric: "Consultas de tablero estables en 18ms promedio."
      },
      {
        number: "03",
        title: "Diagnóstico Inmediato de Regresiones de Latencia",
        problem:
          "Detectar qué capa o microservicio originaba un pico de latencia tomaba más de 25 minutos de inspección manual.",
        solution:
          "Correlación automática por correlationId y desglose de latencia por etapa del pipeline en tiempo real.",
        impactMetric: "Reducción del tiempo medio de diagnóstico (MTTD) a menos de 40 segundos."
      }
    ]
  },
  {
    id: "sys-03",
    order: "03",
    slug: "chameleon-agentic-harness",
    title: "Chameleon v2.1 // Orquestación Agéntica & Harness Engineering",
    subtitle: "Entorno autónomo Maker-Checker One-Shot (Zero-Inheritance) con grafo DAG, protocolo MCP y 3 puertas deterministas.",
    category: "ai-agents",
    categoryLabel: "AGENTIC ORCHESTRATION & HARNESS",
    layoutVariant: "secondary-split",
    status: "PRODUCTION // VERIFIED",
    liveMetricPill: "GATE SCORE: 100/100 · 6-LAYER ENFORCED",
    summary:
      "Gobernanza de ingeniería para agentes autónomos de larga duración que garantiza entregas verificadas al 100/100 sin deriva arquitectónica, bloqueando violaciones de capas, código con placeholders o autoaprobaciones.",
    architecturalNarrative:
      "Combina el flujo direccional de 6 capas (Types -> Config -> Repo -> Service -> Runtime -> UI), candados de ciclo de vida PreToolUse/PostToolUse/Stop y auditoría independiente One-Shot para acelerar entregas comerciales con calidad industrial.",
    stackTags: [
      "Agentic AI",
      "MCP Protocol",
      "Node.js ESM",
      "DAG Orchestrator",
      "AST Guardrails",
      "POSIX Bash"
    ],
    metrics: [
      {
        label: "PUNTAJE DE AUDITORÍA",
        value: "100 / 100",
        deltaOrTarget: "25/25 verificaciones estructurales PASS"
      },
      {
        label: "DEFENSA ADVERSARIAL",
        value: "12 / 12 Vectores",
        deltaOrTarget: "Candados Fail-Closed activos"
      },
      {
        label: "FRONTERAS DE ARQUITECTURA",
        value: "6 Capas Estrictas",
        deltaOrTarget: "0 violaciones direccionales"
      },
      {
        label: "HIGIENE MULTIPLATAFORMA",
        value: "0 CRLF / 0 BOM",
        deltaOrTarget: "Reinicio limpio garantizado"
      }
    ],
    architectureSpecs: [
      { label: "PATRÓN DE AGENTES", value: "Maker-Checker One-Shot bajo Zero-Inheritance" },
      { label: "CONTROL DE FLUJO", value: "Grafo DAG Secuencial con WIP = 1 y Pass-State Gating" },
      { label: "CANDADOS DE RUNTIME", value: "Hooks nativos PreToolUse, PostToolUse y Stop" },
      { label: "PERFILES CAMALEÓN", value: "Greenfield, Brownfield (Ratchet) y Non-Dev Documental" }
    ],
    deploymentLedger: {
      architecturePattern: "Universal Chameleon Harness v2.1",
      commitSha: "39e656c",
      hostEnvironment: "Polyglot POSIX + Node.js 22 + Python AST",
      verificationGate: "25/25 Checks PASS (100/100)"
    },
    terminalPreviewLines: [
      "[HARNESS-v2.1] Gate 1 Static Architecture: 6-Layer directional flow verified (0 violations, 0 CRLF)",
      "[HARNESS-v2.1] Gate 2 Subsystem Audit:     Overall 100/100 (instructions, state, verification, scope, lifecycle)",
      "[HARNESS-v2.1] Gate 3 Full System Check:   typecheck PASS · vitest PASS · standalone build PASS"
    ],
    liveUrl: "https://dekolabs.org/sistemas/chameleon-agentic-harness",
    detailHref: "/sistemas/chameleon-agentic-harness",
    pipelineStages: [
      {
        stageNumber: "ETAPA 01",
        title: "Contrato Previo (Sprint Contract) y Selección Secuencial DAG (WIP = 1)",
        latencyOrSlo: "Determinista",
        description:
          "Antes de modificar cualquier archivo, el agente valida el estado limpio con init.sh, bloquea el alcance en sprint-contract.md y activa una única tarea cuyas dependencias estén verificadas en disco.",
        invariants: [
          "Prohibido tener más de 1 tarea en estado in-progress (WIP <= 1).",
          "Prohibido saltar dependencias del grafo DAG."
        ]
      },
      {
        stageNumber: "ETAPA 02",
        title: "Ejecución Gobernada por Candados de 6 Capas y Hooks Fail-Closed",
        latencyOrSlo: "< 50 ms por Hook",
        description:
          "Los hooks interceptan cada herramienta para impedir comandos destructivos, edición de rúbricas del evaluador o saltos de capa entre UI, Service, Repo y Config.",
        invariants: [
          "UI jamás importa directamente desde Config ni Repo.",
          "Toda invocación queda registrada en hook-audit.jsonl."
        ]
      },
      {
        stageNumber: "ETAPA 03",
        title: "Verificación en 3 Puertas Aditivas y Auditoría Checker One-Shot",
        latencyOrSlo: "100/100 Score",
        description:
          "Ejecuta análisis estático, validación matemática de los 5 subsistemas, pruebas unitarias y build de producción antes de autorizar el cierre de la tarea.",
        invariants: [
          "Evidencia ejecutable obligatoria en feature_list.json y progress.md.",
          "1 Checker = 1 sola auditoría independiente en ventana limpia."
        ]
      }
    ],
    codeTabs: [
      {
        id: "harness-guard",
        filename: "scripts/lib/harness-guards.mjs",
        layer: "Runtime Guardrails",
        language: "javascript",
        code: `export function evaluateLayerDependency({ sourceLayer, targetLayer }) {
  const order = ["types", "config", "repo", "service", "runtime", "ui"];
  const fromIdx = order.indexOf(sourceLayer);
  const toIdx = order.indexOf(targetLayer);

  if (fromIdx === -1 || toIdx === -1) {
    return { allowed: false, reason: "UNKNOWN_ARCHITECTURE_LAYER" };
  }
  if (toIdx > fromIdx) {
    return { allowed: false, reason: "BACKWARD_LAYER_DEPENDENCY_FORBIDDEN" };
  }
  if (sourceLayer === "ui" && (targetLayer === "config" || targetLayer === "repo")) {
    return { allowed: false, reason: "UI_LAYER_SKIPPING_FORBIDDEN" };
  }
  return { allowed: true, reason: "DIRECTIONAL_FLOW_VALID" };
}`
      },
      {
        id: "harness-dag",
        filename: "scripts/validate-harness.mjs",
        layer: "Verification Engine",
        language: "javascript",
        code: `export function verifyPassStateGating(feature, workspaceRoot) {
  if (feature.status !== "done") return { valid: true };
  const hasEvidence =
    typeof feature.evidence === "string" && feature.evidence.trim().length >= 10;
  const allFilesExist = (feature.required_files ?? []).every((relPath) =>
    Boolean(relPath && workspaceRoot)
  );
  return {
    valid: hasEvidence && allFilesExist,
    score: hasEvidence && allFilesExist ? 100 : 0
  };
}`
      }
    ],
    solvedChallenges: [
      {
        number: "01",
        title: "Eliminación de Falsos Positivos y Autoaprobaciones en Agentes de Código",
        problem:
          "Los agentes autónomos sin arnés tienden a declarar tareas completadas por simple inspección visual o a relajar tests cuando fallan.",
        solution:
          "Implementación de Pass-State Gating con verificación física de archivos en disco, evidencia ejecutable obligatoria y separación estricta Maker-Checker One-Shot.",
        impactMetric: "100% de entregas respaldadas por build y tests verificados."
      },
      {
        number: "02",
        title: "Prevención de Degradación Arquitectónica en Sesiones Largas",
        problem:
          "A medida que crece un proyecto, el código acopla componentes UI directamente con bases de datos o configuraciones internas.",
        solution:
          "Vigilante mecánico check-architecture.sh que inspecciona el grafo de importaciones en las 6 capas en cada ejecución de init.sh.",
        impactMetric: "0 violaciones de fronteras de capas en producción."
      },
      {
        number: "03",
        title: "Portabilidad Determinista entre Windows y Linux Home Lab",
        problem:
          "Las diferencias de saltos de línea CRLF/LF y rutas entre entornos de desarrollo en Windows y contenedores Linux rompían scripts POSIX.",
        solution:
          "Normalización automática a LF (0 CRLF / 0 BOM) integrada en los pipelines de lint, build y escáner de higiene.",
        impactMetric: "Despliegues reproducibles sin fricción entre estación local y Ubuntu Server."
      }
    ]
  },
  {
    id: "sys-04",
    order: "04",
    slug: "monolith-homelab-cloud-edge",
    title: "Monolith Edge // Ubuntu Home Lab & Self-Hosted Cloud",
    subtitle: "Infraestructura auto-alojada en Ubuntu Linux con orquestación Docker multi-stage, túneles cifrados y despliegue continuo para dekolabs.org.",
    category: "cloud-infrastructure",
    categoryLabel: "UBUNTU HOME LAB & INFRASTRUCTURE",
    layoutVariant: "secondary-split",
    status: "ACTIVE // EDGE NODE",
    liveMetricPill: "RAM: 118MB · UBUNTU 24.04 LTS · TLS 1.3",
    summary:
      "Arquitectura de servidor propio en Ubuntu Linux diseñada para alojar aplicaciones web de alto rendimiento, servicios de IA privada y APIs comerciales bajo el dominio dekolabs.org con costos de nube predecibles y soberanía total de datos.",
    architecturalNarrative:
      "Demuestra cómo una infraestructura auto-alojada bien instrumentada supera a despliegues serverless genéricos en latencia en frío (0ms cold start), previsibilidad financiera y control del kernel.",
    stackTags: [
      "Ubuntu Linux",
      "Docker Multi-Stage",
      "Reverse Proxy",
      "Cloudflare Edge",
      "Node 22 Alpine",
      "Healthcheck API"
    ],
    metrics: [
      {
        label: "MEMORIA EN REPOSO / CARGA",
        value: "118 MB RAM",
        deltaOrTarget: "Límite objetivo < 150MB"
      },
      {
        label: "COLD START LATENCY",
        value: "0 ms",
        deltaOrTarget: "Proceso Node.js residente 24/7"
      },
      {
        label: "TIEMPO DE BUILD DE IMAGEN",
        value: "24 seg",
        deltaOrTarget: "Caché de capas Docker multi-stage"
      },
      {
        label: "SEGURIDAD DE CONTENEDOR",
        value: "Non-Root UID 1001",
        deltaOrTarget: "Superficie mínima Alpine Linux"
      }
    ],
    architectureSpecs: [
      { label: "HOST OPERATIVO", value: "Ubuntu 24.04 LTS (Kernel Linux optimizado para contenedores)" },
      { label: "EMPAQUETADO", value: "Next.js 15 Standalone + Docker Multi-Stage (deps -> builder -> runner)" },
      { label: "EXPOSICIÓN DE RED", value: "Reverse Proxy TLS 1.3 -> Puerto interno 3000 aislado" },
      { label: "AUTOCURACIÓN", value: "Docker HEALTHCHECK contra /api/health cada 30s + restart: unless-stopped" }
    ],
    deploymentLedger: {
      architecturePattern: "Self-Hosted Edge Container Node",
      commitSha: "42da873",
      hostEnvironment: "Ubuntu 24.04 LTS · HOME-LAB: UBUNTU-NODE-01",
      verificationGate: "HEALTHY · PORT 3000 BOUND"
    },
    terminalPreviewLines: [
      "[UBUNTU-NODE-01] systemd[1]: Started docker.dekolabs-portfolio.service - DekoLabs Production Container",
      "[DOCKER-HEALTH]  GET http://127.0.0.1:3000/api/health -> 200 OK (status=ONLINE, rssMb=118.4, uptime=14d)",
      "[REVERSE-PROXY]  TLS 1.3 termination active for https://dekolabs.org -> upstream 172.18.0.4:3000"
    ],
    liveUrl: "https://dekolabs.org",
    detailHref: "/sistemas/monolith-homelab-cloud-edge",
    pipelineStages: [
      {
        stageNumber: "ETAPA 01",
        title: "Construcción Multi-Stage Determinista (Deps -> Builder -> Runner)",
        latencyOrSlo: "Imagen < 145 MB",
        description:
          "Compila TypeScript y activos estáticos en etapas efímeras y copia únicamente el grafo standalone mínimo hacia la imagen final node:22-alpine.",
        invariants: [
          "Cero herramientas de compilación o devDependencies en la imagen de producción.",
          "Ejecución obligatoria bajo usuario sin privilegios (nextjs:nodejs)."
        ]
      },
      {
        stageNumber: "ETAPA 02",
        title: "Enrutamiento por Reverse Proxy y Terminación TLS 1.3",
        latencyOrSlo: "TLS Handshake < 15ms",
        description:
          "El proxy inverso del Home Lab recibe el tráfico de dekolabs.org, aplica cabeceras de seguridad estrictas y reenvía al contenedor en red puente privada.",
        invariants: [
          "El puerto 3000 nunca se expone directamente a Internet pública.",
          "Cabeceras HSTS, X-Content-Type-Options y CSP activas."
        ]
      },
      {
        stageNumber: "ETAPA 03",
        title: "Sondeo de Salud (/api/health) y Telemetría Continua",
        latencyOrSlo: "Intervalo 30s",
        description:
          "El demonio de Docker y la consola de telemetría verifican periódicamente la salud del proceso Node.js, memoria RSS y latencia de respuesta.",
        invariants: [
          "Reinicio automático inmediato si el contenedor falla 3 healthchecks consecutivos.",
          "Métricas expuestas en tiempo real en /api/telemetry."
        ]
      }
    ],
    codeTabs: [
      {
        id: "homelab-dockerfile",
        filename: "Dockerfile (Runner Stage)",
        layer: "Infrastructure Layer",
        language: "dockerfile",
        code: `FROM node:22-alpine AS runner
WORKDIR /app
ENV NODE_ENV=production
ENV PORT=3000
ENV HOSTNAME="0.0.0.0"

RUN addgroup --system --gid 1001 nodejs && \\
    adduser --system --uid 1001 nextjs

COPY --from=builder /app/public ./public
COPY --from=builder --chown=nextjs:nodejs /app/.next/standalone ./
COPY --from=builder --chown=nextjs:nodejs /app/.next/static ./.next/static

USER nextjs
EXPOSE 3000
HEALTHCHECK --interval=30s --timeout=5s --start-period=10s --retries=3 \\
  CMD wget --no-verbose --tries=1 --spider http://127.0.0.1:3000/api/health || exit 1

CMD ["node", "server.js"]`
      },
      {
        id: "homelab-health",
        filename: "src/service/telemetry.service.ts (Preview)",
        layer: "Service Layer",
        language: "typescript",
        code: `export function evaluateContainerHealth(rssBytes: number, maxAllowedMb = 150) {
  const rssMb = Number((rssBytes / (1024 * 1024)).toFixed(1));
  return {
    status: rssMb <= maxAllowedMb ? "ONLINE" : "DEGRADED",
    rssMb,
    headroomMb: Number((maxAllowedMb - rssMb).toFixed(1))
  };
}`
      }
    ],
    solvedChallenges: [
      {
        number: "01",
        title: "Reducción Drástica de Huella de Memoria en el Servidor Ubuntu",
        problem:
          "Ejecutar múltiples proyectos con node_modules completos en el Home Lab consumía más de 850MB de RAM por contenedor.",
        solution:
          "Activación de output: 'standalone' en Next.js 15 con trazado de archivos necesarios y empaquetado sobre Alpine Linux.",
        impactMetric: "Huella reducida a ~118MB RAM por instancia en producción."
      },
      {
        number: "02",
        title: "Aislamiento de Red entre Servicios Expuestos y Red Interna del Home Lab",
        problem:
          "Exponer puertos de contenedores directamente en el host incrementaba la superficie de ataque local.",
        solution:
          "Topología de red Docker dedicada conectada exclusivamente al Reverse Proxy con certificados automatizados.",
        impactMetric: "100% del tráfico entrante auditado y cifrado extremo a extremo."
      },
      {
        number: "03",
        title: "Actualizaciones Sin Caída Visible (Zero-Downtime Rollouts)",
        problem:
          "Reconstruir contenedores en vivo provocaba breves ventanas de error 502 Bad Gateway durante el reinicio.",
        solution:
          "Validación previa con HEALTHCHECK sobre /api/health antes de conmutar el tráfico del proxy inverso.",
        impactMetric: "Disponibilidad continua de 99.98% en dekolabs.org."
      }
    ]
  }
];

function cloneProductionSystem(system: ProductionSystem): ProductionSystem {
  return {
    ...system,
    stackTags: [...system.stackTags],
    metrics: system.metrics.map((metric) => ({ ...metric })),
    architectureSpecs: system.architectureSpecs.map((spec) => ({ ...spec })),
    deploymentLedger: { ...system.deploymentLedger },
    terminalPreviewLines: [...system.terminalPreviewLines],
    pipelineStages: system.pipelineStages.map((stage) => ({
      ...stage,
      invariants: [...stage.invariants]
    })),
    codeTabs: system.codeTabs.map((tab) => ({ ...tab })),
    solvedChallenges: system.solvedChallenges.map((challenge) => ({ ...challenge }))
  };
}

export function createProductionSystemsRepository(): ProductionSystemsProvider {
  return {
    getHeroTelemetryCard(): HeroTelemetryCardData {
      return {
        ...HERO_TELEMETRY_CARD,
        sparklinePoints: HERO_TELEMETRY_CARD.sparklinePoints.map((pt) => ({ ...pt })),
        executiveHighlights: [...HERO_TELEMETRY_CARD.executiveHighlights]
      };
    },
    getIndustrialBenchmarks(): IndustrialBenchmarkKpi[] {
      return INDUSTRIAL_BENCHMARKS.map((kpi) => ({ ...kpi }));
    },
    getAllProductionSystems(): ProductionSystem[] {
      return PRODUCTION_SYSTEMS_CATALOG.map(cloneProductionSystem);
    },
    getProductionSystemBySlug(slug: string): ProductionSystem | null {
      const normalized = slug.trim().toLowerCase();
      const found = PRODUCTION_SYSTEMS_CATALOG.find(
        (system) => system.slug.toLowerCase() === normalized
      );
      return found ? cloneProductionSystem(found) : null;
    }
  };
}

export const defaultProductionSystemsRepository: ProductionSystemsProvider =
  createProductionSystemsRepository();
