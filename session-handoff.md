# Session Handoff

## Current Objective
- **Goal:** Implementar y verificar al `100/100` la tarea **`feat-013`** (*Reestructuración del Administrador (`/admin/proyectos`) en 2 Vistas Separadas, Selector `<select>` de Sección y Evolución de IA a Producción*), dejando el repositorio en `clean-state` (`WIP = 0`) listo para `feat-014`.
- **Current status:** `clean-state` (`feat-001` a `feat-013` en `"done"`, `feat-014` a `feat-015` en `"not-started"`, `WIP = 0`; `Overall: 100/100`; `0 CRLF`; `0 UTF-8 BOM`; `44/44` tests unitarios en 11 suites PASS y build `standalone` OK)
- **Branch / commit:** `main` (`feat-013` implementada y verificada)

## Completed This Session
- [x] **División de `/admin/proyectos` en 2 Vistas Independientes (`src/ui/components/CatalogAdminView.tsx`)**:
  - **Vista 1 (`viewMode = "list"`, predeterminada)**: Muestra únicamente las tarjetas agrupadas en `PROYECTOS EN PRODUCCIÓN` y `MÁS PROYECTOS DE IA`, con un **único botón primario `+ Crear Nuevo Proyecto`** en la cabecera (retirando `+ Nuevo en Producción`, `+ Nuevo Proyecto de IA`, `+ Añadir` y `+ Añadir IA`, y evitando abrir el formulario automáticamente).
  - **Vista 2 (`viewMode = "form"`, bajo demanda)**: Se abre solo al pulsar `+ Crear Nuevo Proyecto` o `Editar`, incluye `← Volver a Proyectos Creados` y `Cargar Molde Base (Deco Vintage)` (en creación), transfiere el foco al encabezado activo y vuelve al listado tras guardar.
- [x] **Selector `<select name="catalogSection">` y Eliminación de Cajas Radio**:
  - Eliminadas al `100%` las antiguas cajas grandes de radio `UBICACIÓN DEL PROYECTO EN LA PÁGINA DE INICIO (CATALOGSECTION) *`.
  - Incorporado `<select id="project-catalog-section-select" name="catalogSection">` con opciones `Proyectos en Producción` (`"production-systems"`) y `Más Proyectos de IA` (`"ai-projects"`), `aria-describedby` y bordes de alto contraste (`>= 3:1`).
- [x] **Ciclo de Evolución de Proyectos (`Más Proyectos de IA` → `Proyectos en Producción`)**:
  - Funciones `upgradeVersionBadgeForProduction`, `buildPromotedToProductionInput` y `promoteCatalogSystemToProductionAsync` en `src/service/systems.service.ts`.
  - Botón directo **`Evolucionar a Producción ↗`** en cada tarjeta de `MÁS PROYECTOS DE IA` que ejecuta `PUT /api/admin/systems` con `catalogSection: "production-systems"` y actualiza la badge de versión.
- [x] **Pruebas Automatizadas (`44/44 PASS`)**:
  - Actualizada `tests/catalog-admin-ui.test.ts` verificando Vista 1 (`list`), Vista 2 (`form`), `<select name="catalogSection">`, ausencia total de radios antiguos y evolución de IA a Producción en servicio y API.

## Verification Evidence

| Check | Command | Result | Notes |
| :--- | :--- | :--- | :--- |
| Vigilante Arquitectónico y Higiene (Puerta 1) | `bash scripts/check-architecture.sh` | `PASS (Exit code 0)` | 6 capas en `src/` sin violaciones direccionales, `0 CRLF`, `0 BOM` |
| Validación de los 5 Subsistemas (Puerta 2) | `node scripts/validate-harness.mjs --min-score 100` | `PASS (100/100)` | `25/25` checks PASS (`feat-001`..`feat-013` en `done`, `WIP = 0`) |
| Build, Lint, Typecheck y Tests (Puerta 3) | `bash ./init.sh` | `PASS (Exit code 0)` | `tsc --noEmit` OK, `vitest run` (`44/44 PASS` en 11 suites) y `next build` (`standalone` OK) |

## Files Changed
- `src/service/systems.service.ts`
- `src/ui/components/CatalogAdminView.tsx`
- `tests/catalog-admin-ui.test.ts`
- `feature_list.json`
- `sprint-contract.md`
- `progress.md`
- `session-handoff.md`

## Decisions Made
- Mantener `CatalogAdminView.tsx` (`"use client"`) importando exclusivamente contratos puros de `@/types/portfolio` para no arrastrar `pg` al bundle del navegador, exponiendo las operaciones de promoción tanto en `src/service/systems.service.ts` (servidor) como en `buildPromoteToProductionPayload` (cliente hacia `PUT /api/admin/systems`).
- Renderizado condicional exclusivo entre `list` y `form` con gestión programática de foco en el encabezado de cada vista.

## Blockers / Risks
- Ninguno activo.

## Next Session Startup
1. Confirmar `pwd` en `sebastian web Portafolio`.
2. Leer `AGENTS.md`, `harness.config.json`, `progress.md`, `session-handoff.md`, `sprint-contract.md` y `feature_list.json`.
3. Ejecutar `bash ./init.sh` para verificar que la línea base está en verde (`100/100`).

## Recommended Next Step
- Seleccionar únicamente **`feat-014`** en `feature_list.json`, pasarla a `"status": "in-progress"` (`WIP = 1`) y separar las vistas públicas dejando `/` exclusivamente para `SISTEMAS EN PRODUCCIÓN` y creando la nueva ruta pública `/proyectos-ia`.
