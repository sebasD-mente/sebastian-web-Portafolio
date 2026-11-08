# Sprint Contract (Contrato de Ejecución de Tarea)

Este documento materializa la **Observabilidad de Proceso (Antes de Codificar)**. El Planificador y el Ejecutor (*Maker*) acuerdan el alcance exacto y los criterios verificables de éxito antes de modificar el sistema, evitando desviaciones de alcance (*Scope Creep*) o interpretaciones ambiguas.

---

## Estado Actual del Contrato (`WIP = 0` — Arquitectura Estipulada; `feat-001` Lista para la Siguiente Sesión)
- **Tarea activa (`in-progress`):** Ninguna (`WIP = 0` al cierre de la sesión de diseño arquitectónico con Sebastián).
- **Siguiente tarea secuencial lista para iniciar:** `feat-001` (*Cimiento Next.js 15 Standalone, Sistema Visual Atelier Monolith y Esqueleto de 6 Capas*).
- **Especificación maestra de referencia:** `docs/product-specs/dekolabs-portfolio-spec.md` y `ARCHITECTURE.md` (Basadas en el prototipo Google Stitch `projects/10491405022475068698`).

## Alcance Incluido (`Fair game`) para `feat-001` (Al Cambiar su Estado a `in-progress`)
- Actualizar primero `feature_list.json` poniendo `"status": "in-progress"` en `feat-001` (`WIP = 1`).
- Crear la configuración base de Next.js 15 + TypeScript + Tailwind CSS + Vitest con `output: 'standalone'`:
  - `package.json`, `tsconfig.json`, `next.config.ts`, `postcss.config.mjs` (o configuración Tailwind equivalente) y `vitest.config.ts`.
- Implementar el esqueleto inicial verificable de las **6 capas estrictas** en `src/`:
  - `src/types/portfolio.ts` (`Types` — contratos base del portafolio, navegación, tema y telemetría ambiental).
  - `src/config/site.config.ts` (`Config` — metadatos del dominio `dekolabs.org`, marca personal **Sebastián — Principal Software & AI Architect** y tokens *Atelier Monolith*).
  - `src/repo/site.repo.ts` (`Repo` — proveedor inicial de configuración y estado ambiental).
  - `src/service/site.service.ts` (`Service` — casos de uso consumibles por `UI` sin saltar a `Config`/`Repo`).
  - `src/runtime/logger.ts` (`Runtime` — emisor JSON `RuntimeLogEntry` con `correlationId` y redacción de secretos).
  - `src/ui/components/AppShell.tsx` (`UI` — Ambient Telemetry Strip, Header fijo con conmutador Dark/Light y Footer técnico).
  - `src/app/layout.tsx`, `src/app/page.tsx` y `src/app/globals.css` (`UI` — fuentes `Inter`, `Space Grotesk` y `JetBrains Mono`, paleta *Atelier Monolith* `#121314` / `#0D0E0F` / `#FFFFFF` / `#7BD0FF` / `#6FFBBE`).
- Añadir pruebas unitarias iniciales de la capa `Service`/`Runtime` para que `npm test` pase en verde.

## Exclusiones Explícitas (Qué NO se va a tocar bajo ninguna circunstancia)
- Prohibido implementar en `feat-001` el catálogo completo de los 4 sistemas (`feat-002`), la ruta dinámica `/sistemas/[slug]` (`feat-003`), la sección de orquestación agéntica (`feat-004`), los endpoints `/api/telemetry` y `/api/contact` (`feat-005`) o los archivos Docker (`feat-006`).
- Prohibido que cualquier archivo en `src/app/` o `src/ui/` importe directamente desde `src/config/` o `src/repo/` (Regla Dura #2: `No Layer Skipping`).
- Prohibido debilitar, comentar o relajar validaciones en `init.sh`, `scripts/validate-harness.mjs`, `scripts/lib/harness-utils.mjs`, `scripts/check-architecture.sh` o `scripts/harness-hooks.mjs`.
- Prohibido que el agente Constructor (*Maker*) rellene `evaluator-rubric.md` o reutilice vía `send_message` un sub-agente *Checker* previo (`1 Checker = 1 sola auditoría / one-shot`).

## Estándares de Verificación ("Hecho" significa exactamente esto)
1. Todos los archivos declarados en `required_files` de `feat-001` existen físicamente en disco y no están vacíos (`0 CRLF` y `0 UTF-8 BOM` en todo el repositorio).
2. `bash ./init.sh`, `bash scripts/check-architecture.sh` y `node scripts/validate-harness.mjs --min-score 100` devuelven código `0` y `Overall: 100/100` ejecutando `typecheck`, `lint`, `test` y `build`.
3. En **Modo Crítico / Loop (`/goal`)** o cierres de hito, una instancia *Checker* `one-shot` completamente nueva (`zero-inheritance`) audita la entrega en `evaluator-rubric.md` con puntuación `>= 11/12` (`ACEPTAR`).
