# Session Handoff

## Current Objective
- **Goal:** Implementar y verificar al `100/100` la tarea **`feat-014`** (*Página de Inicio (`/`) Exclusiva para Sistemas en Producción y Nueva Página Pública Dedicada `/proyectos-ia`*), dejando el repositorio en `clean-state` (`WIP = 0`) listo para `feat-015`.
- **Current status:** `clean-state` (`feat-001` a `feat-014` en `"done"`, `feat-015` en `"not-started"`, `WIP = 0`; `Overall: 100/100`; `0 CRLF`; `0 UTF-8 BOM`; `49/49` tests unitarios en 12 suites PASS y build `standalone` OK)
- **Branch / commit:** `main` (`feat-014` implementada y verificada)

## Completed This Session
- [x] **Curaduría Exclusiva de la Página de Inicio (`/` — `src/app/page.tsx` y `src/ui/components/ProductionSystemsSection.tsx`)**:
  - Retirada por completo la sección `MÁS PROYECTOS DE IA` (`#mas-proyectos-ia`) de `/` y `ProductionSystemsSection.tsx`, dejando en la portada únicamente `HeroSection` y `SISTEMAS EN PRODUCCIÓN` (`#proyectos-destacados`).
- [x] **Nueva Ruta Pública Dedicada `/proyectos-ia` (`src/app/proyectos-ia/page.tsx` y `src/ui/components/AiProjectsCatalogView.tsx`)**:
  - Creada ruta `force-dynamic` con metadatos canónicos, barra de retorno a `/#proyectos-destacados`, encabezado `<h1>MÁS PROYECTOS DE IA</h1>`, tarjetas *Atelier Monolith* (`<h2>`) reutilizando `ProjectPreviewCard` y estado vacío sobrio cuando no hay proyectos publicados en incubación.
- [x] **Navegación Global y Revalidación Instantánea (`src/types/portfolio.ts`, `src/config/site.config.ts`, `src/ui/components/AppShell.tsx`, `src/runtime/admin-catalog.handler.ts`)**:
  - `SITE_NAVIGATION` dirige `MAS PROYECTOS DE IA` a `/proyectos-ia` y los enlaces de sección a `/#proyectos-destacados`, `/#stack-tecnologico` y `/#contacto` (conservando intactos sus `label` e indicando `aria-current="page"` en `/proyectos-ia`).
  - `safeRevalidateCatalogPaths` incluye `revalidatePath("/proyectos-ia")` para reflejar de inmediato altas, ediciones, bajas y evoluciones de IA a Producción tanto en `/proyectos-ia` como en `/`.
- [x] **Pruebas Automatizadas (`49/49 PASS`)**:
  - Creada `tests/ai-projects-page.test.ts` y actualizadas `tests/postgres-catalog-and-gallery.test.ts` y `tests/harness-deprecation-dag.test.ts`.

## Verification Evidence

| Check | Command | Result | Notes |
| :--- | :--- | :--- | :--- |
| Vigilante Arquitectónico y Higiene (Puerta 1) | `bash scripts/check-architecture.sh` | `PASS (Exit code 0)` | 6 capas en `src/` sin violaciones direccionales, `0 CRLF`, `0 BOM` |
| Validación de los 5 Subsistemas (Puerta 2) | `node scripts/validate-harness.mjs --min-score 100` | `PASS (100/100)` | `25/25` checks PASS (`feat-001`..`feat-014` en `done`, `WIP = 0`) |
| Build, Lint, Typecheck y Tests (Puerta 3) | `bash ./init.sh` | `PASS (Exit code 0)` | `tsc --noEmit` OK, `vitest run` (`49/49 PASS` en 12 suites) y `next build` (`standalone` OK con `/proyectos-ia`) |

## Files Changed
- `src/types/portfolio.ts`
- `src/config/site.config.ts`
- `src/runtime/admin-catalog.handler.ts`
- `src/app/page.tsx`
- `src/app/proyectos-ia/page.tsx`
- `src/ui/components/AppShell.tsx`
- `src/ui/components/ProductionSystemsSection.tsx`
- `src/ui/components/AiProjectsCatalogView.tsx`
- `tests/ai-projects-page.test.ts`
- `tests/postgres-catalog-and-gallery.test.ts`
- `tests/harness-deprecation-dag.test.ts`
- `feature_list.json`
- `sprint-contract.md`
- `progress.md`
- `session-handoff.md`

## Decisions Made
- Reutilizar `ProjectPreviewCard` entre `ProductionSystemsSection.tsx` y `AiProjectsCatalogView.tsx` con `headingTag` configurable (`"h3"` en `/` bajo `<h2>` y `"h2"` en `/proyectos-ia` bajo `<h1>`) para evitar saltos de jerarquía de encabezados y mantener fidelidad visual *Atelier Monolith*.
- Ampliar `CatalogSectionDescriptor` con `routeHref` conservando `anchorId` para compatibilidad total con las suites existentes.

## Blockers / Risks
- Ninguno activo.

## Next Session Startup
1. Confirmar `pwd` en `sebastian web Portafolio`.
2. Leer `AGENTS.md`, `harness.config.json`, `progress.md`, `session-handoff.md`, `sprint-contract.md` y `feature_list.json`.
3. Ejecutar `bash ./init.sh` para verificar que la línea base está en verde (`100/100`).

## Recommended Next Step
- Seleccionar únicamente **`feat-015`** en `feature_list.json`, pasarla a `"status": "in-progress"` (`WIP = 1`) e implementar `OfficialFooter.tsx` integrado globalmente en `AppShell.tsx` con los 4 enlaces sociales (LinkedIn, Facebook, Instagram, WhatsApp) y el copyright `"Creado por Sebastian Jimenez 2026"`.
