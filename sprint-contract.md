# Sprint Contract (Contrato de Ejecución de Tarea)

Este documento materializa la **Observabilidad de Proceso (Antes de Codificar)**. El Planificador y el Ejecutor (*Maker*) acuerdan el alcance exacto y los criterios verificables de éxito antes de modificar el sistema, evitando desviaciones de alcance (*Scope Creep*) o interpretaciones ambiguas.

---

## Estado Actual del Contrato (`WIP = 0` — `feat-001` Completada; `feat-002` Lista para Iniciar)
- **Última tarea completada (`done`):** `feat-001` (*Cimiento Next.js 15 Standalone, Sistema Visual Atelier Monolith y Esqueleto de 6 Capas*).
- **Tarea activa (`in-progress`):** Ninguna (`WIP = 0`).
- **Siguiente tarea secuencial lista para iniciar:** `feat-002` (*Hero Editorial, Tarjeta de Telemetría en Vivo y Catálogo de 4 Sistemas en Producción*).
- **Especificación maestra de referencia:** `docs/product-specs/dekolabs-portfolio-spec.md` y `ARCHITECTURE.md` (Basadas en el prototipo Google Stitch `projects/10491405022475068698`).

## Justificación de Dependencias en `package.json` (Regla Dura #4 de `ARCHITECTURE.md`)
- **Runtime (`dependencies`)**:
  - `next` (`^15.2.0`), `react` (`^19.0.0`), `react-dom` (`^19.0.0`): Framework principal acordado con Sebastián para App Router, SSR/SSG y empaquetado `output: 'standalone'` ultraligero en contenedor Docker (`node:22-alpine`) dentro del Ubuntu Linux Home Lab.
- **Desarrollo y Verificación (`devDependencies`)**:
  - `typescript`, `@types/node`, `@types/react`, `@types/react-dom`: Tipado estático estricto para validar contratos entre las 6 capas (`npm run typecheck`).
  - `tailwindcss`, `@tailwindcss/postcss`, `postcss`: Motor de estilos utility-first sin runtime JS para materializar los tokens del sistema de diseño *Atelier Monolith* (Modo Claro por defecto + Modo Oscuro).
  - `vitest`: Runner de pruebas unitarias rápido y determinista para validar las capas `Service` y `Runtime` dentro del presupuesto de tiempo del hook `Stop`.

## Alcance Incluido (`Fair game`) para `feat-002` (Al Cambiar su Estado a `in-progress`)
- Actualizar primero `feature_list.json` poniendo `"status": "in-progress"` en `feat-002` (`WIP = 1`).
- Extender los contratos en `src/types/portfolio.ts` para el catálogo de los 4 sistemas en producción, métricas operativas y benchmarks industriales.
- Crear `src/repo/systems.repo.ts`, `src/service/systems.service.ts`, `src/ui/components/HeroSection.tsx`, `src/ui/components/BenchmarksStrip.tsx`, `src/ui/components/ProductionSystemsSection.tsx` y `tests/systems.service.test.ts`, e integrarlos en `src/app/page.tsx`.

## Exclusiones Explícitas (Qué NO se va a tocar bajo ninguna circunstancia)
- Prohibido implementar en `feat-001` el catálogo completo de los 4 sistemas (`feat-002`), la ruta dinámica `/sistemas/[slug]` (`feat-003`), la sección de orquestación agéntica (`feat-004`), los endpoints `/api/telemetry` y `/api/contact` (`feat-005`) o los archivos Docker (`feat-006`).
- Prohibido que cualquier archivo en `src/app/` o `src/ui/` importe directamente desde `src/config/` o `src/repo/` (Regla Dura #2: `No Layer Skipping`).
- Prohibido debilitar, comentar o relajar validaciones en `init.sh`, `scripts/validate-harness.mjs`, `scripts/lib/harness-utils.mjs`, `scripts/check-architecture.sh` o `scripts/harness-hooks.mjs`.
- Prohibido que el agente Constructor (*Maker*) rellene `evaluator-rubric.md` o reutilice vía `send_message` un sub-agente *Checker* previo (`1 Checker = 1 sola auditoría / one-shot`).

## Estándares de Verificación ("Hecho" significa exactamente esto)
1. Todos los archivos declarados en `required_files` de `feat-001` existen físicamente en disco y no están vacíos (`0 CRLF` y `0 UTF-8 BOM` en todo el repositorio).
2. `bash ./init.sh`, `bash scripts/check-architecture.sh` y `node scripts/validate-harness.mjs --min-score 100` devuelven código `0` y `Overall: 100/100` ejecutando `typecheck`, `lint`, `test` y `build`.
3. En **Modo Crítico / Loop (`/goal`)** o cierres de hito, una instancia *Checker* `one-shot` completamente nueva (`zero-inheritance`) audita la entrega en `evaluator-rubric.md` con puntuación `>= 11/12` (`ACEPTAR`).
