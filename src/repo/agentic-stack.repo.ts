import type {
  AgenticStackProvider,
  AgenticWorkflowNode,
  CommercialDeliveryBlueprint,
  HarnessVerificationGate,
  MakerCheckerSpec,
  McpIntegrationBridge,
  StackCapabilityItem
} from "@/types/portfolio";

const MAKER_CHECKER_SPEC: MakerCheckerSpec = {
  protocolVersion: "Universal Chameleon Harness v2.1 · Zero-Inheritance",
  isolationMode: "1 Checker = 1 Auditoría One-Shot (Ventana Virgen Aislada)",
  rubricTarget: ">= 11/12 pts (evaluator-rubric.md · Fail-Closed)",
  circuitBreakerLocks: [
    "LOCK 01 // WIP = 1 estricto y orden secuencial DAG verificado en feature_list.json",
    "LOCK 02 // Prohibición mecánica de auto-aprobación del Maker en evaluator-rubric.md",
    "LOCK 03 // Bloqueo de reutilización de conversationId en sub-agentes Checker (One-Shot)",
    "LOCK 04 // Detección de regresión A<->B y reversión a último estado limpio (Ratchet)"
  ],
  summary:
    "Cada funcionalidad comercial se construye bajo un contrato formal previo (sprint-contract.md) y se audita mediante un agente evaluador independiente sin herencia de contexto conversacional, eliminando sesgos de confirmación antes de pasar a producción."
};

const WORKFLOW_NODES: AgenticWorkflowNode[] = [
  {
    step: "01",
    nodeId: "research",
    title: "Descubrimiento, Contexto & Sprint Contract",
    actorRole: "Planner / Research Node",
    isolationPolicy: "Write-Select-Compress-Isolate (Context Budget < 65%)",
    description:
      "Inspección determinista del repositorio, especificaciones de producto (Google Stitch / ADR) y definición formal del alcance e invariantes antes de escribir una sola línea de código.",
    deterministicArtifact: "sprint-contract.md + feature_list.json (WIP = 1)"
  },
  {
    step: "02",
    nodeId: "implement",
    title: "Ejecución Modular en 6 Capas Estrictas",
    actorRole: "Maker Agent (Constructor)",
    isolationPolicy: "Hooks PreToolUse / PostToolUse + Guardas Fail-Closed",
    description:
      "Implementación acotada estrictamente a la tarea activa respetando el flujo direccional Types -> Config -> Repo -> Service -> Runtime -> UI sin saltar capas ni introducir dependencias no autorizadas.",
    deterministicArtifact: "src/{types,config,repo,service,runtime,ui} + tests/"
  },
  {
    step: "03",
    nodeId: "verify",
    title: "Auditoría en 3 Puertas + Checker One-Shot",
    actorRole: "Harness Runner + Independent Checker",
    isolationPolicy: "Zero-Inheritance Subagent (Sin send_message reutilizado)",
    description:
      "Ejecución real de las 3 puertas aditivas (arquitectura 6 capas, score matemático 100/100, typecheck, tests unitarios y build standalone) seguida de evaluación independiente sobre rúbrica de 12 puntos.",
    deterministicArtifact: "evaluator-rubric.md + .agents/.runtime/hook-audit.jsonl"
  },
  {
    step: "04",
    nodeId: "human_approval",
    title: "Gobernanza Ejecutiva & Revisión de Hito",
    actorRole: "Sebastián (Principal Architect)",
    isolationPolicy: "Escalamiento estructurado ante decisiones de arquitectura",
    description:
      "Validación de alineación comercial, revisión de métricas de latencia/memoria y aprobación de cambios en contratos públicos o topología de despliegue.",
    deterministicArtifact: "progress.md + clean-state-checklist.md"
  },
  {
    step: "05",
    nodeId: "merge",
    title: "Consolidación Reiniciable & Despliegue Standalone",
    actorRole: "Release & Telemetry Pipeline",
    isolationPolicy: "0 CRLF · 0 UTF-8 BOM · Clean Working Tree",
    description:
      "Registro de evidencia ejecutable verificada, actualización del acta de entrega de turno y empaquetado listo para contenedor Docker Alpine en Ubuntu Linux Home Lab.",
    deterministicArtifact: "session-handoff.md + .next/standalone/server.js"
  }
];

const VERIFICATION_GATES: HarnessVerificationGate[] = [
  {
    gateNumber: "PUERTA 01",
    title: "Vigilante Estático, Higiene y Fronteras de 6 Capas",
    command: "bash scripts/check-architecture.sh",
    focusArea: "Integridad estructural, dirección de dependencias y seguridad estática",
    invariantsChecked: [
      "Flujo unidireccional estricto Types -> Config -> Repo -> Service -> Runtime -> UI",
      "Cero saltos de capa (UI jamás importa directamente de Repo o Config)",
      "0 finales de línea CRLF, 0 UTF-8 BOM, JSON estricto y cero archivos temporales",
      "Enlace íntegro de todos los Required Artifacts en AGENTS.md y topes de Auto-Memoria"
    ],
    passThreshold: "Exit code 0 · 0 violaciones de capa · 0 secretos expuestos"
  },
  {
    gateNumber: "PUERTA 02",
    title: "Auditoría Matemática de los 5 Subsistemas & DAG",
    command: "node scripts/validate-harness.mjs --min-score 100",
    focusArea: "Gobernanza de estado, regla WIP=1 y Pass-State Gating",
    invariantsChecked: [
      "Puntuación perfecta 25/25 en Instructions, State, Verification, Scope y Lifecycle",
      "Verificación física en disco de todos los required_files para tareas completadas",
      "Orden secuencial DAG respetado sin saltar dependencias ni exceder WIP <= 1",
      "Evidencia ejecutable real registrada en feature_list.json y progress.md"
    ],
    passThreshold: "Overall: 100/100 (25/25 checks PASS)"
  },
  {
    gateNumber: "PUERTA 03",
    title: "Sincronización End-to-End: Typecheck, Tests & Build Standalone",
    command: "bash ./init.sh",
    focusArea: "Compilación de producción, pruebas unitarias y artefacto desplegable",
    invariantsChecked: [
      "Tipado estático estricto en todo el árbol TypeScript (tsc --noEmit)",
      "Suite de pruebas unitarias deterministas en Vitest para capas Service y Runtime",
      "Compilación Next.js 15 App Router con prerenderizado SSG de rutas dinámicas",
      "Generación verificada de .next/standalone/server.js para contenedor Ubuntu Home Lab"
    ],
    passThreshold: "100% Tests PASS · Build Standalone verificado (<150MB RAM target)"
  }
];

const MCP_BRIDGES: McpIntegrationBridge[] = [
  {
    id: "mcp-stitch",
    protocolCode: "MCP // DESIGN-SYSTEM",
    serverName: "Google Stitch MCP Server",
    purpose:
      "Extracción directa de tokens cromáticos Atelier Monolith, retícula suiza de 12 columnas y geometría de pantallas de alta precisión.",
    securityBoundary: "Solo lectura de especificaciones visuales verificadas"
  },
  {
    id: "mcp-devtools",
    protocolCode: "MCP // RUNTIME-AUDIT",
    serverName: "Chrome DevTools & A11y MCP",
    purpose:
      "Inspección de árbol de accesibilidad WAI-ARIA, contraste WCAG AA/AAA, trazas de rendimiento Core Web Vitals (LCP/INP/CLS) y red.",
    securityBoundary: "Sandbox de navegador local aislado por sesión"
  },
  {
    id: "mcp-harness-guards",
    protocolCode: "HOOKS // FAIL-CLOSED",
    serverName: "Harness Native Lifecycle Locks",
    purpose:
      "Interceptación determinista PreToolUse, PostToolUse y Stop que bloquea comandos destructivos, pip global y auto-edición de rúbricas.",
    securityBoundary: "Auditoría inmutable en .agents/.runtime/hook-audit.jsonl"
  },
  {
    id: "mcp-data-cloud",
    protocolCode: "MCP // DATA-INFRA",
    serverName: "Postgres, BigQuery & Cloud Tooling",
    purpose:
      "Inspección de esquemas relacionales, linaje de pipelines analíticos y validación de consultas parametrizadas para sistemas de datos.",
    securityBoundary: "Credenciales acotadas por entorno y cero secretos en código"
  }
];

const STACK_CAPABILITIES: StackCapabilityItem[] = [
  {
    id: "stack-agentic-harness",
    technology: "Universal Chameleon Harness v2.1 & Multi-Agent DAGs",
    category: "ai-agentic",
    categoryLabel: "IA & Orquestación Agéntica",
    architecturalLayer: "Cross-Layer",
    productionRole:
      "Gobernanza de agentes autónomos de larga duración con separación Maker-Checker One-Shot y disyuntor de 4 candados.",
    commercialUseCase:
      "Automatización de ingeniería de software, agentes operativos empresariales y flujos auditables sin alucinaciones.",
    verificationStandard: "3 Puertas Deterministas · Score 100/100",
    statusBadge: "VERIFIED // HARNESS"
  },
  {
    id: "stack-llm-gateway",
    technology: "Gemini API / OpenAI / Anthropic + Model Context Protocol (MCP)",
    category: "ai-agentic",
    categoryLabel: "IA & Orquestación Agéntica",
    architecturalLayer: "Service",
    productionRole:
      "Enrutamiento multimodal con validación de esquemas JSON estrictos, herramientas tipadas, caché semántico y fallback multi-proveedor.",
    commercialUseCase:
      "Copilotos verticales, extracción documental estructurada, agentes de soporte técnico y motores de decisión en tiempo real.",
    verificationStandard: "Contratos Zod/JSON Schema + Trazabilidad correlationId",
    statusBadge: "PRODUCTION // CORE"
  },
  {
    id: "stack-python-ai",
    technology: "Python 3.12 · FastAPI · AsyncIO · PySpark / Dataform",
    category: "ai-agentic",
    categoryLabel: "IA & Orquestación Agéntica",
    architecturalLayer: "Runtime",
    productionRole:
      "Microservicios de inferencia, pipelines ELT de datos e ingesta analítica con validación AST mecánica y aislamiento .venv.",
    commercialUseCase:
      "Pipelines de datos hacia BigQuery/Postgres, motores RAG de baja latencia y automatización de back-office.",
    verificationStandard: "check-python.mjs AST + Fronteras de 6 Capas",
    statusBadge: "PRODUCTION // CORE"
  },
  {
    id: "stack-ts-node",
    technology: "TypeScript 5.8 (Strict) · Node.js 22 LTS",
    category: "distributed-backend",
    categoryLabel: "Backend Distribuido & APIs",
    architecturalLayer: "Service",
    productionRole:
      "Núcleo de lógica de dominio, servicios HTTP/SSE de alta concurrencia y validación de invariantes en tiempo de compilación.",
    commercialUseCase:
      "Plataformas SaaS B2B, pasarelas de pagos/telemetría, integraciones ERP/CRM y APIs de misión crítica.",
    verificationStandard: "tsc --noEmit (strict: true) + Vitest Unit Suite",
    statusBadge: "PRODUCTION // CORE"
  },
  {
    id: "stack-rust-edge",
    technology: "Rust (Tokio / Axum) & Go Micro-workers",
    category: "distributed-backend",
    categoryLabel: "Backend Distribuido & APIs",
    architecturalLayer: "Runtime",
    productionRole:
      "Proxies de inferencia distribuida, limitadores de tasa (rate-limiters) sin pausas de GC y demonios de telemetría de huella mínima.",
    commercialUseCase:
      "Gateways de ultra-baja latencia (<15ms P99), colectores de eventos de alto volumen y servicios embebidos en Linux.",
    verificationStandard: "Zero-copy memory safety + Benchmarks de carga P99",
    statusBadge: "ENTERPRISE // READY"
  },
  {
    id: "stack-postgres-redis",
    technology: "PostgreSQL 16 · pgvector · Redis / Streams",
    category: "distributed-backend",
    categoryLabel: "Backend Distribuido & APIs",
    architecturalLayer: "Repo",
    productionRole:
      "Persistencia transaccional ACID, búsqueda vectorial híbrida, colas de trabajos idempotentes y control de concurrencia optimista.",
    commercialUseCase:
      "Libros mayores financieros (ledgers), catálogos multi-tenant, memoria semántica de agentes y sincronización de eventos.",
    verificationStandard: "Capability Seams + Migraciones deterministas",
    statusBadge: "PRODUCTION // CORE"
  },
  {
    id: "stack-nextjs-react",
    technology: "Next.js 15 (App Router · Standalone) & React 19",
    category: "frontend-design",
    categoryLabel: "Frontend Suizo & Sistemas UI",
    architecturalLayer: "UI",
    productionRole:
      "Renderizado híbrido SSR/SSG de carga instantánea, Server Components y empaquetado standalone autónomo para contenedores ligeros.",
    commercialUseCase:
      "Portales de clientes de alto rendimiento, consolas operativas en tiempo real, dashboards ejecutivos y vitrinas comerciales.",
    verificationStandard: "Next Build Standalone + First Load JS ~110 kB",
    statusBadge: "PRODUCTION // CORE"
  },
  {
    id: "stack-atelier-tailwind",
    technology: "Tailwind CSS v4 · Sistema Visual Atelier Monolith · WAI-ARIA",
    category: "frontend-design",
    categoryLabel: "Frontend Suizo & Sistemas UI",
    architecturalLayer: "UI",
    productionRole:
      "Arquitectura de tokens CSS semánticos (Modo Claro predeterminado + Modo Oscuro), tipografía suiza y componentes accesibles por teclado.",
    commercialUseCase:
      "Sistemas de diseño corporativos, interfaces técnicas de alta densidad informativa y cumplimiento de estándares WCAG AA.",
    verificationStandard: "0 Runtime CSS Overhead + Navegación Teclado / Screen Reader",
    statusBadge: "VERIFIED // HARNESS"
  },
  {
    id: "stack-ubuntu-docker",
    technology: "Ubuntu Linux 24.04 LTS · Docker Multi-Stage (node:22-alpine)",
    category: "cloud-homelab",
    categoryLabel: "Infraestructura, Cloud & Home Lab",
    architecturalLayer: "Runtime",
    productionRole:
      "Contenedorización endurecida con usuario no-root, huella de memoria <150MB RAM, healthchecks nativos y operación 24/7 en Home Lab.",
    commercialUseCase:
      "Despliegues soberanos auto-alojados (Self-Hosted), reducción drástica de costos cloud y entornos de staging/producción reproducibles.",
    verificationStandard: "HEALTHCHECK /api/health + Aislamiento de contenedores",
    statusBadge: "PRODUCTION // CORE"
  },
  {
    id: "stack-reverse-proxy-cloud",
    technology: "Cloudflare Tunnels / Traefik / Nginx · GCP (Cloud Run & BigQuery)",
    category: "cloud-homelab",
    categoryLabel: "Infraestructura, Cloud & Home Lab",
    architecturalLayer: "Config",
    productionRole:
      "Terminación TLS 1.3, túneles Zero-Trust sin abrir puertos públicos, balanceo de carga y escalamiento híbrido Home Lab <-> Cloud.",
    commercialUseCase:
      "Exposición segura de servicios internos (dekolabs.org), arquitecturas híbridas privadas y analítica cloud escalable.",
    verificationStandard: "SLO 99.98% + Logs estructurados RuntimeLogEntry",
    statusBadge: "ENTERPRISE // READY"
  }
];

const COMMERCIAL_BLUEPRINTS: CommercialDeliveryBlueprint[] = [
  {
    id: "blueprint-end-to-end",
    code: "MOD-01 // END-TO-END IMPLEMENTATION",
    title: "Sistemas Web & Plataformas en Producción Llave en Mano",
    engagementModel: "Contrato por Hitos Verificados / Proyecto Cerrado",
    targetTimeline: "2 a 6 semanas por sistema operativo",
    summary:
      "Diseño, arquitectura de 6 capas, desarrollo full-stack (Next.js 15 / TypeScript / PostgreSQL) y despliegue contenedorizado listo para recibir tráfico real.",
    includedDeliverables: [
      "Código fuente modular en 6 capas con 0 deuda de tipos y suite de pruebas automatizadas",
      "Interfaz de precisión bajo estética suiza (Modo Claro + Oscuro) optimizada para conversión y velocidad",
      "Empaquetado Docker multi-stage listo para VPS Linux, Home Lab o Cloud Run"
    ],
    qualityGuarantee: "Certificación 100/100 en las 3 Puertas del Arnés antes de cada entrega"
  },
  {
    id: "blueprint-agentic-ai",
    code: "MOD-02 // AGENTIC AI & HARNESS ENGINEERING",
    title: "Orquestación de Agentes IA & Automatización Determinista",
    engagementModel: "Implementación Especializada / Retainer Técnico",
    targetTimeline: "2 a 4 semanas desde prototipo hasta producción",
    summary:
      "Integración de agentes autónomos, flujos Maker-Checker, servidores MCP personalizados y pasarelas LLM con control estricto de costos, seguridad y calidad.",
    includedDeliverables: [
      "Arquitectura de agentes con validación determinista de salidas y guardas Fail-Closed",
      "Integración segura con bases de datos, APIs internas y herramientas operativas vía MCP",
      "Observabilidad completa con trazas correlationId, métricas de latencia y evaluación sobre rúbrica"
    ],
    qualityGuarantee: "Cero ejecución de herramientas sin validación de esquema y trazabilidad JSON"
  },
  {
    id: "blueprint-infra-homelab",
    code: "MOD-03 // SOVEREIGN INFRASTRUCTURE & CLOUD",
    title: "Infraestructura Auto-Alojada (Linux / Docker) & Optimización Cloud",
    engagementModel: "Consultoría de Arquitectura & Ejecución Hands-On",
    targetTimeline: "1 a 3 semanas de migración o endurecimiento",
    summary:
      "Configuración de clusters ligeros en Ubuntu Linux, contenedores standalone de bajo consumo (<150MB RAM), Reverse Proxy Zero-Trust y pipelines CI/CD reproducibles.",
    includedDeliverables: [
      "Dockerfiles multi-stage optimizados, docker-compose de producción y healthchecks automáticos",
      "Configuración de túneles seguros, TLS 1.3, caché estático y telemetría de salud en vivo",
      "Documentación operativa de recuperación ante desastres y transferencia total de control"
    ],
    qualityGuarantee: "Huella de recursos auditada y disponibilidad objetivo >= 99.9%"
  }
];

export class StaticAgenticStackRepository implements AgenticStackProvider {
  getMakerCheckerSpec(): MakerCheckerSpec {
    return {
      ...MAKER_CHECKER_SPEC,
      circuitBreakerLocks: [...MAKER_CHECKER_SPEC.circuitBreakerLocks]
    };
  }

  getWorkflowNodes(): AgenticWorkflowNode[] {
    return WORKFLOW_NODES.map((node) => ({ ...node }));
  }

  getVerificationGates(): HarnessVerificationGate[] {
    return VERIFICATION_GATES.map((gate) => ({
      ...gate,
      invariantsChecked: [...gate.invariantsChecked]
    }));
  }

  getMcpBridges(): McpIntegrationBridge[] {
    return MCP_BRIDGES.map((bridge) => ({ ...bridge }));
  }

  getStackCapabilities(): StackCapabilityItem[] {
    return STACK_CAPABILITIES.map((item) => ({ ...item }));
  }

  getCommercialBlueprints(): CommercialDeliveryBlueprint[] {
    return COMMERCIAL_BLUEPRINTS.map((blueprint) => ({
      ...blueprint,
      includedDeliverables: [...blueprint.includedDeliverables]
    }));
  }
}

export const defaultAgenticStackRepository: AgenticStackProvider =
  new StaticAgenticStackRepository();
