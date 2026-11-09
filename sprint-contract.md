# Sprint Contract (Contrato de Ejecución de Tarea)

Este documento materializa la **Observabilidad de Proceso (Antes de Codificar)**. El Planificador y el Ejecutor (*Maker*) acuerdan el alcance exacto y los criterios verificables de éxito antes de modificar el sistema, evitando desviaciones de alcance (*Scope Creep*) o interpretaciones ambiguas.

---

## Estado Actual del Contrato (`WIP = 0` — `feat-008` Planificada y Lista para Ejecución en Sesión Limpia)
- **Última tarea completada (`done`):** `feat-007` (*Refinamiento Visual v2.2: Des-saturación de Vista Principal, Header Fijo con Logo Personal, Hero IA/ADK/RAG y Tarjeta Deco Vintage Platform*).
- **Tarea activa (`in-progress`):** Ninguna (`WIP = 0`; las 7 tareas `feat-001`..`feat-007` están en `"done"` y `feat-008` está en `"not-started"` lista para que la siguiente sesión limpia la active a `"in-progress"`).
- **Siguiente tarea secuencial lista para iniciar:** `feat-008` (*Evolución de Raíz del Arnés: Event-Sourced DAG Deprecation con `deprecated_files` y Purga Física de Componentes Zombi*).
- **Especificación maestra de referencia:** `docs/product-specs/dekolabs-portfolio-spec.md` (Secciones 5 y 6), `docs/design-docs/homelab-deployment.md`, `docs/RELIABILITY.md`, `docs/SECURITY.md` y `ARCHITECTURE.md`.

## Justificación de Dependencias en `package.json` (Regla Dura #4 de `ARCHITECTURE.md`)
- **Runtime (`dependencies`)**:
  - `next` (`^15.2.0`), `react` (`^19.0.0`), `react-dom` (`^19.0.0`): Framework principal acordado con Sebastián para App Router, SSR/SSG, Route Handlers (`/api/health`, `/api/telemetry`, `/api/contact`), generación de rutas SEO (`robots.txt`, `sitemap.xml`) y empaquetado `output: 'standalone'` ultraligero en contenedor Docker (`node:22-alpine`) dentro del Ubuntu Linux Home Lab.
- **Desarrollo y Verificación (`devDependencies`)**:
  - `typescript`, `@types/node`, `@types/react`, `@types/react-dom`: Tipado estático estricto para validar contratos entre las 6 capas (`npm run typecheck`).
  - `tailwindcss`, `@tailwindcss/postcss`, `postcss`: Motor de estilos utility-first sin runtime JS para materializar los tokens del sistema de diseño *Atelier Monolith* (Modo Claro por defecto + Modo Oscuro).
  - `vitest`: Runner de pruebas unitarias rápido y determinista para validar las capas `Service`, `Runtime` y la configuración de despliegue/SEO dentro del presupuesto de tiempo del hook `Stop`.

## Alcance Incluido (`Fair game`) para `feat-008`
1. **Esquema JSON Canónico (`scripts/feature-list.schema.json`)**:
   - Agregar la propiedad opcional `"deprecated_files"` en `properties` de cada ítem de `features`:
     ```json
     "deprecated_files": {
       "type": "array",
       "items": {
         "type": "string",
         "minLength": 1
       },
       "description": "Repo-relative files from ancestor features deprecated and physically removed by this feature"
     }
     ```
2. **Motor `Event-Sourced Pass-State Gating` en `scripts/lib/harness-utils.mjs`**:
   - Añadir `'deprecated_files'` a `ALLOWED_FEATURE_KEYS`.
   - Dentro de `validateFeatureListObject(parsed, root)` (después de verificar que no hay ciclos en el DAG con `findDependencyCycle`):
     - Validar que si `feature.deprecated_files !== undefined`, sea un arreglo (puede ser no vacío) donde cada elemento cumpla `isSafeRepoRelativePath(resolvedRoot, relPath)` y no tenga duplicados internos.
     - **Candado Anti-Trampa #1 (Prohibido Auto-Deprecarse)**: Verificar que ningún archivo normalizado de `feature.deprecated_files` esté presente en `feature.required_files` de la misma tarea. Si ocurre, retornar `{ valid: false, reason: ... }`.
     - **Candado Anti-Trampa #2 (Trazabilidad Ancestral en el DAG)**: Calcular para cada tarea el conjunto transitivo de sus ancestros en `dependencies`. Verificar que cada archivo en `feature.deprecated_files` haya sido declarado en `required_files` de al menos una tarea ancestral de `feature`. Si no pertenece a ningún ancestro del DAG, retornar `{ valid: false, reason: ... }`.
     - **Resolución Temporal de Existencia en Disco (`Pass-State Gating` Evolutivo)**:
       - Para cada tarea `feature` con `status === 'done'`, un archivo `relPath` de `feature.required_files` queda exento de existir físicamente en disco si existe al menos una tarea descendiente `desc` en el DAG (con `desc.status === 'in-progress'` o `desc.status === 'done'`) que incluya ese mismo archivo en `desc.deprecated_files` (salvo que una tarea descendiente posterior a `desc` lo haya vuelto a requerir en `required_files`).
     - **Candado Anti-Zombi (Verificación Inversa de Limpieza Real)**:
       - Para cada tarea `feature` con `status === 'done'` que declare `feature.deprecated_files`, cada archivo `relPath` en `feature.deprecated_files` (que no haya sido re-introducido en `required_files` por un descendiente posterior de `feature`) **NO debe existir físicamente en disco** (`!existsSync(path.resolve(resolvedRoot, relPath))`). Si el archivo todavía existe en disco, retornar `{ valid: false, reason: "feature '<id>' is marked done but deprecated file '<relPath>' still exists on disk (zombie file)" }`.
3. **Declaración de `deprecated_files` en `feat-008` (`feature_list.json`) y Purga Física de los 5 Archivos Zombi**:
   - Añadir en el objeto `feat-008` dentro de `feature_list.json`:
     ```json
     "deprecated_files": [
       "src/ui/components/BenchmarksStrip.tsx",
       "src/ui/components/AgenticOrchestrationSection.tsx",
       "src/ui/components/TechStackMatrix.tsx",
       "src/ui/components/LiveTerminalSection.tsx",
       "src/ui/components/ContactAdvisorySection.tsx"
     ]
     ```
   - Eliminar físicamente esos 5 archivos del árbol fuente y del índice Git usando un comando seguro permitido por los hooks (`git rm src/ui/components/BenchmarksStrip.tsx src/ui/components/AgenticOrchestrationSection.tsx src/ui/components/TechStackMatrix.tsx src/ui/components/LiveTerminalSection.tsx src/ui/components/ContactAdvisorySection.tsx`).
   - **Dejar 100% intactos** los bloques históricos `feat-001` a `feat-007` en `feature_list.json`.
4. **Suite de Pruebas Unitarias del Nuevo Motor (`tests/harness-deprecation-dag.test.ts`)**:
   - Crear `tests/harness-deprecation-dag.test.ts` importando `validateFeatureListObject` desde `../scripts/lib/harness-utils.mjs` y probando:
     1. El propio `feature_list.json` del repositorio pasa `validateFeatureListObject` con `valid: true` teniendo `feat-001`..`feat-007` intactos y los 5 componentes deprecados en `feat-008` ya eliminados del disco.
     2. Bloqueo `Fail-Closed` del **Candado Anti-Zombi**: si una tarea `"done"` declara un archivo existente en `deprecated_files`, `validateFeatureListObject` devuelve `valid: false`.
     3. Bloqueo `Fail-Closed` del **Candado Anti-Trampa #1 (Auto-Deprecación)**: si una tarea incluye el mismo archivo en `required_files` y `deprecated_files`, devuelve `valid: false`.
     4. Bloqueo `Fail-Closed` del **Candado Anti-Trampa #2 (Sin Linaje Ancestral)**: si una tarea intenta deprecar un archivo que no pertenece al `required_files` de ningún ancestro en el DAG, devuelve `valid: false`.

## Exclusiones Explícitas (Qué NO se va a tocar bajo ninguna circunstancia)
- **Prohibido modificar el historial** (`required_files`, `description` o `evidence`) de las tareas cerradas `feat-001` a `feat-007` en `feature_list.json`.
- Prohibido usar `rm -rf` o `Remove-Item -Recurse -Force` (bloqueados por el hook `PreToolUse`); usar `git rm <archivo>` para eliminar los 5 archivos `.tsx` deprecados.
- Prohibido que cualquier archivo en `src/app/` o `src/ui/` importe directamente desde `src/config/` o `src/repo/` (Regla Dura #2: `No Layer Skipping`).
- Prohibido que el agente Constructor (*Maker*) rellene `evaluator-rubric.md` o reutilice vía `send_message` un sub-agente *Checker* previo (`1 Checker = 1 sola auditoría / one-shot`).

## Estándares de Verificación ("Hecho" significa exactamente esto)
1. Los 5 componentes visuales zombi de prototipo ya no existen en `src/ui/components/` y los 3 archivos en `required_files` de `feat-008` existen y pasan todas las validaciones (`0 CRLF` y `0 UTF-8 BOM`).
2. `bash ./init.sh`, `bash scripts/check-architecture.sh` y `node scripts/validate-harness.mjs --min-score 100` devuelven código `0` y `Overall: 100/100` ejecutando `typecheck`, `lint`, `test` (7 suites) y `build`.
3. `feat-008` pasa a estado `"done"` con evidencia verificable (`>= 10` caracteres) y el árbol queda limpio (`clean-state`).
