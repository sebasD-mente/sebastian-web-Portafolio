# Sprint Contract (Contrato de Ejecución de Tarea)

Este documento materializa la **Observabilidad de Proceso (Antes de Codificar)**. El Planificador y el Ejecutor (*Maker*) acuerdan el alcance exacto y los criterios verificables de éxito antes de modificar el sistema, evitando desviaciones de alcance (*Scope Creep*) o interpretaciones ambiguas.

---

## Estado Actual del Contrato (`WIP = 0` — `feat-003` Completada; `feat-004` Lista para Iniciar)
- **Última tarea completada (`done`):** `feat-003` (*Vista de Detalle Técnico Profundo por Sistema (`/sistemas/[slug]`) e Inspector de Código*).
- **Tarea activa (`in-progress`):** Ninguna (`WIP = 0`).
- **Siguiente tarea secuencial lista para iniciar:** `feat-004` (*Módulo de Orquestación de Agentes IA, Harness Engineering v2.1 y Matriz de Stack Comercial*).
- **Especificación maestra de referencia:** `docs/product-specs/dekolabs-portfolio-spec.md` y `ARCHITECTURE.md` (Basadas en el prototipo Google Stitch `projects/10491405022475068698`).

## Justificación de Dependencias en `package.json` (Regla Dura #4 de `ARCHITECTURE.md`)
- **Runtime (`dependencies`)**:
  - `next` (`^15.2.0`), `react` (`^19.0.0`), `react-dom` (`^19.0.0`): Framework principal acordado con Sebastián para App Router, SSR/SSG y empaquetado `output: 'standalone'` ultraligero en contenedor Docker (`node:22-alpine`) dentro del Ubuntu Linux Home Lab.
- **Desarrollo y Verificación (`devDependencies`)**:
  - `typescript`, `@types/node`, `@types/react`, `@types/react-dom`: Tipado estático estricto para validar contratos entre las 6 capas (`npm run typecheck`).
  - `tailwindcss`, `@tailwindcss/postcss`, `postcss`: Motor de estilos utility-first sin runtime JS para materializar los tokens del sistema de diseño *Atelier Monolith* (Modo Claro por defecto + Modo Oscuro).
  - `vitest`: Runner de pruebas unitarias rápido y determinista para validar las capas `Service` y `Runtime` dentro del presupuesto de tiempo del hook `Stop`.

## Alcance Incluido (`Fair game`) para `feat-003`
- Extender o refinar `src/service/systems.service.ts` para exponer casos de uso de detalle profundo (`getAllProductionSystemSlugs`, `getProductionSystemDeepDiveBySlug` con navegación al sistema anterior/siguiente del catálogo).
- Implementar la ruta dinámica SSG/SSR `src/app/sistemas/[slug]/page.tsx` con `generateStaticParams` y `generateMetadata`, envolviendo la vista en `AppShell` y consumiendo únicamente `src/service/systems.service.ts`, `src/service/site.service.ts` y `src/types/portfolio.ts`.
- Implementar `src/ui/components/CodeInspectorTabs.tsx` como componente cliente accesible (`role="tablist"`, `role="tab"`, `role="tabpanel"`) para inspeccionar las pestañas de código en solo lectura (`readonly`) de cada sistema.
- Implementar `src/ui/components/SystemDetailView.tsx` fiel a la pantalla de detalle de Google Stitch (`606e1d34c8cd4d3f8f0f4b26306dcb56`):
  1. Barra breadcrumb de telemetría (retorno al catálogo + estado del nodo + badge de verificación).
  2. Hero del sistema + Ledger de Metadata de Despliegue (`architecturePattern`, `commitSha`, `hostEnvironment`, `verificationGate` y enlaces).
  3. Grid de 4 KPIs del sistema (`metrics`).
  4. Consola de Mando y Diagnóstico (ventana técnica con `terminalPreviewLines` y telemetría operativa del sistema).
  5. Diagrama estructural con las 3 Etapas del Pipeline (`ETAPA 01`, `ETAPA 02`, `ETAPA 03` e invariantes).
  6. Matriz de especificaciones técnicas (`architectureSpecs` + `stackTags`) junto al Inspector Interactivo de Código (`CodeInspectorTabs`).
  7. Sección de 3 Desafíos de Ingeniería Resueltos (`01`, `02`, `03` con problema, solución e impacto medible) y navegación hacia otros sistemas del catálogo.
- Implementar `tests/system-detail.test.ts` validando la resolución de todos los `slug` estáticos, el contrato de `getProductionSystemDeepDiveBySlug`, la integridad de las 3 etapas del pipeline, las pestañas de código y los 3 desafíos resueltos para los 4 sistemas.

## Exclusiones Explícitas (Qué NO se va a tocar bajo ninguna circunstancia)
- Prohibido implementar en `feat-003` la sección dedicada completa de `AgenticOrchestrationSection` (`feat-004`), los endpoints `/api/telemetry` y `/api/contact` (`feat-005`) o los archivos Docker (`feat-006`).
- Prohibido que cualquier archivo en `src/app/` o `src/ui/` importe directamente desde `src/config/` o `src/repo/` (Regla Dura #2: `No Layer Skipping`).
- Prohibido debilitar, comentar o relajar validaciones en `init.sh`, `scripts/validate-harness.mjs`, `scripts/lib/harness-utils.mjs`, `scripts/check-architecture.sh` o `scripts/harness-hooks.mjs`.
- Prohibido que el agente Constructor (*Maker*) rellene `evaluator-rubric.md` o reutilice vía `send_message` un sub-agente *Checker* previo (`1 Checker = 1 sola auditoría / one-shot`).

## Estándares de Verificación ("Hecho" significa exactamente esto)
1. Todos los archivos declarados en `required_files` de `feat-003` (`src/app/sistemas/[slug]/page.tsx`, `src/ui/components/SystemDetailView.tsx`, `src/ui/components/CodeInspectorTabs.tsx`, `tests/system-detail.test.ts`) existen físicamente en disco y no están vacíos (`0 CRLF` y `0 UTF-8 BOM` en todo el repositorio).
2. `bash ./init.sh`, `bash scripts/check-architecture.sh` y `node scripts/validate-harness.mjs --min-score 100` devuelven código `0` y `Overall: 100/100` ejecutando `typecheck`, `lint`, `test` y `build` (prerenderizando las 4 rutas estáticas `/sistemas/[slug]`).
3. En **Modo Crítico / Loop (`/goal`)** o cierres de hito, una instancia *Checker* `one-shot` completamente nueva (`zero-inheritance`) audita la entrega en `evaluator-rubric.md` con puntuación `>= 11/12` (`ACEPTAR`).
