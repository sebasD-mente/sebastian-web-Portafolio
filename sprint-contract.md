# Sprint Contract (Contrato de Ejecución de Tarea)

Este documento materializa la **Observabilidad de Proceso (Antes de Codificar)**. El Planificador y el Ejecutor (*Maker*) acuerdan el alcance exacto y los criterios verificables de éxito antes de modificar el sistema, evitando desviaciones de alcance (*Scope Creep*) o interpretaciones ambiguas.

---

## Estado Actual del Contrato (`WIP = 0` — `feat-004` Completada; `feat-005` Lista para Iniciar)
- **Última tarea completada (`done`):** `feat-004` (*Módulo de Orquestación de Agentes IA, Harness Engineering v2.1 y Matriz de Stack Comercial*).
- **Tarea activa (`in-progress`):** Ninguna (`WIP = 0`).
- **Siguiente tarea secuencial lista para iniciar:** `feat-005` (*Telemetría Ubuntu Home Lab (`/api/telemetry`), Terminal Interactiva en Vivo y Canal de Contratación*).
- **Especificación maestra de referencia:** `docs/product-specs/dekolabs-portfolio-spec.md` y `ARCHITECTURE.md` (Basadas en el prototipo Google Stitch `projects/10491405022475068698`).

## Justificación de Dependencias en `package.json` (Regla Dura #4 de `ARCHITECTURE.md`)
- **Runtime (`dependencies`)**:
  - `next` (`^15.2.0`), `react` (`^19.0.0`), `react-dom` (`^19.0.0`): Framework principal acordado con Sebastián para App Router, SSR/SSG y empaquetado `output: 'standalone'` ultraligero en contenedor Docker (`node:22-alpine`) dentro del Ubuntu Linux Home Lab.
- **Desarrollo y Verificación (`devDependencies`)**:
  - `typescript`, `@types/node`, `@types/react`, `@types/react-dom`: Tipado estático estricto para validar contratos entre las 6 capas (`npm run typecheck`).
  - `tailwindcss`, `@tailwindcss/postcss`, `postcss`: Motor de estilos utility-first sin runtime JS para materializar los tokens del sistema de diseño *Atelier Monolith* (Modo Claro por defecto + Modo Oscuro).
  - `vitest`: Runner de pruebas unitarias rápido y determinista para validar las capas `Service` y `Runtime` dentro del presupuesto de tiempo del hook `Stop`.

## Alcance Incluido (`Fair game`) para `feat-004`
- Extender `src/types/portfolio.ts` con los contratos de dominio para Orquestación Agéntica, Harness Engineering v2.1 y Matriz de Stack Comercial (`AgenticWorkflowNode`, `HarnessVerificationGate`, `McpIntegrationBridge`, `StackCapabilityCategory`, `StackCapabilityItem`, `CommercialDeliveryBlueprint`, `AgenticStackSnapshot`, `AgenticStackProvider`).
- Implementar `src/repo/agentic-stack.repo.ts` bajo `Capability Seams` conteniendo los datos deterministas del flujo Maker-Checker `One-Shot` (`Zero-Inheritance`), las 3 Puertas Aditivas del Arnés Camaleón Universal v2.1, los puentes MCP de desarrollo/auditoría, la matriz completa del stack tecnológico por dominios y los casos de uso comerciales para clientes (MVPs end-to-end, sistemas de agentes IA, data fabrics e infraestructura auto-alojada).
- Implementar `src/service/agentic-stack.service.ts` exponiendo casos de uso puros (`getAgenticStackSnapshot`, `getStackCapabilitiesByCategory`, `getHarnessVerificationGates`, `getCommercialDeliveryBlueprints`) que combinan la arquitectura de 6 capas con la suite de orquestación agéntica sin acoplar la capa `UI` a `Repo` ni `Config`.
- Implementar `src/ui/components/AgenticOrchestrationSection.tsx` enlazado a `#orquestacion-agentica` mostrando:
  1. Visualización direccional de las 6 capas (`Types -> Config -> Repo -> Service -> Runtime -> UI`) con sus invariantes mecánicos.
  2. Topología del bucle **Maker-Checker One-Shot (`Zero-Inheritance`)** + disyuntor de 4 candados (`4-Lock Circuit Breaker`) + protocolo MCP.
  3. Las **3 Puertas Deterministas del Arnés Camaleón v2.1** (Puerta 1 Estática/Arquitectura, Puerta 2 Comportamiento `100/100`, Puerta 3 Sistema Completo).
- Implementar `src/ui/components/TechStackMatrix.tsx` con:
  1. Filtro accesible por dominio del stack (`aria-pressed` en botones nativos `<button>`) y tabla responsiva accesible (`<div tabIndex={0} role="region" aria-labelledby="...">`, `<table>`, `<caption>`, `<th scope="col">`, `<th scope="row">` y encabezados `sticky`).
  2. Tarjetas de **Blueprints de Entrega Comercial** orientadas a clientes (modalidades freelance / contratos de implementación end-to-end, entregables verificables y SLOs).
- Integrar `AgenticOrchestrationSection` y `TechStackMatrix` en `src/app/page.tsx` consumiendo datos exclusivamente desde `src/service/`.
- Implementar `tests/agentic-stack.service.test.ts` validando todos los contratos, el flujo de 5 nodos + Maker-Checker, las 3 puertas del arnés, el filtrado por categoría de la matriz del stack y los blueprints comerciales.

## Exclusiones Explícitas (Qué NO se va a tocar bajo ninguna circunstancia)
- Prohibido implementar en `feat-004` los endpoints `/api/health`, `/api/telemetry` y `/api/contact` o los componentes `LiveTerminalSection.tsx` y `ContactAdvisorySection.tsx` (`feat-005`), así como los archivos Docker (`feat-006`).
- Prohibido que cualquier archivo en `src/app/` o `src/ui/` importe directamente desde `src/config/` o `src/repo/` (Regla Dura #2: `No Layer Skipping`).
- Prohibido debilitar, comentar o relajar validaciones en `init.sh`, `scripts/validate-harness.mjs`, `scripts/lib/harness-utils.mjs`, `scripts/check-architecture.sh` o `scripts/harness-hooks.mjs`.
- Prohibido que el agente Constructor (*Maker*) rellene `evaluator-rubric.md` o reutilice vía `send_message` un sub-agente *Checker* previo (`1 Checker = 1 sola auditoría / one-shot`).

## Estándares de Verificación ("Hecho" significa exactamente esto)
1. Todos los archivos declarados en `required_files` de `feat-004` (`src/repo/agentic-stack.repo.ts`, `src/service/agentic-stack.service.ts`, `src/ui/components/AgenticOrchestrationSection.tsx`, `src/ui/components/TechStackMatrix.tsx`, `tests/agentic-stack.service.test.ts`) existen físicamente en disco y no están vacíos (`0 CRLF` y `0 UTF-8 BOM` en todo el repositorio).
2. `bash ./init.sh`, `bash scripts/check-architecture.sh` y `node scripts/validate-harness.mjs --min-score 100` devuelven código `0` y `Overall: 100/100` ejecutando `typecheck`, `lint`, `test` y `build`.
3. En **Modo Crítico / Loop (`/goal`)** o cierres de hito, una instancia *Checker* `one-shot` completamente nueva (`zero-inheritance`) audita la entrega en `evaluator-rubric.md` con puntuación `>= 11/12` (`ACEPTAR`).
