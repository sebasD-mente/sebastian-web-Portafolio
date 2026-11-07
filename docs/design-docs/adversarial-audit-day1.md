# Auditoría Adversarial y Endurecimiento Base (Día 1 — `sebastian-web-portafolio`)

- **Fecha:** 2026-11-07
- **Estado:** Verificado y Controlado (`12/12` vectores adversariales defendidos, `27/27` pruebas funcionales en verde, `Overall: 100/100`)
- **Alcance:** Evaluación sin complacencia de la arquitectura de `Plantilla-Maestra-Arnes`, pruebas de penetración/bypass sobre sus 4 pipelines ejecutables (`init.sh`, `scripts/check-architecture.sh`, `scripts/validate-harness.mjs`, `.agents/hooks.json` + `scripts/harness-hooks.mjs`) y registro de controles mecánicos y límites residuales.

---

## 1. Opinión Técnica Sin Complacencia sobre el Arnés

### 1.1 Fortalezas Reales (Por encima del promedio de la industria)
1. **Disciplina de Página de Índice (`AGENTS.md` ~100 líneas) y Carga en 3 Niveles**: Evita el error más común en repositorios agénticos (un `AGENTS.md` enciclopédico que diluye la atención del modelo y rompe la `prompt cache`).
2. **Formato de Bolígrafo Rojo (`ERROR + POR QUÉ + SOLUCIÓN`)**: Los fallos mecánicos le indican al agente exactamente cómo repararlos sin entrar en bucles de ensayo y error.
3. **Dos Marchas de Trabajo (`Modo Diario Ágil` vs `Modo Crítico / Loop`)**: Acierto crítico de diseño. Para un portafolio web, forzar rondas completas `Maker-Checker` en cada ajuste visual o de estilos destruiría la velocidad de iteración; reservar el bucle `Maker-Checker` (`one-shot` + `zero-inheritance`) para hitos, arquitectura o `/goal` mantiene un equilibrio sano costo/calidad.
4. **Separación Efímera `One-Shot` del Checker**: Prohibir `send_message` a un Evaluador ya utilizado neutraliza el sesgo de co-autoría y el anclaje conversacional.

### 1.2 Críticas Estructurales Directas (Dónde Había "Arquitectura de Papel" o Fricción Real)
1. **Brecha entre Documentación Aspiracional y Código Real (`docs/RELIABILITY.md` y `docs/SECURITY.md`)**:
   - *Diagnóstico*: La plantilla original proclamaba como invariantes activos cosas que **no existían en código**: logs estructurados `RuntimeLogEntry` con `correlationId`, auditoría inmutable *"Model-Visible Means Logged"* de cada decisión `allow`/`deny`, presupuesto duro en dólares/tokens (`$5 USD / 250k tokens`) y un embudo conectable de compactación de 5 niveles.
   - *Realidad técnica*: Los presupuestos de tokens/USD y la compactación de contexto viven dentro del motor propietario del IDE/CLI (Antigravity), **no** son consultables ni interceptables desde scripts locales del repositorio. Presentarlos como candados deterministas del repo generaba falsa sensación de seguridad.
   - *Acción tomada*: Se implementó escritura real de trazas `RuntimeLogEntry` JSONL (con redacción de secretos) en `.agents/.runtime/hook-audit.jsonl` para todas las decisiones de hooks, y se documentó explícitamente en la Sección 3 qué controles son **mecánicos/deterministas** y cuáles son **protocolares/dependientes del host**.
2. **Choque entre las 6 Capas Estrictas y Frameworks Web Modernos**:
   - *Diagnóstico*: `check-architecture.sh` solo inspeccionaba literalmente `src/{types,config,repo,service,runtime,ui}` y extensiones `.js/.ts/.tsx/.jsx/.py`. En un portafolio web con **Next.js (`src/app/`, `app/`), Astro (`src/pages/`, `.astro`), Vue (`.vue`), Svelte (`src/routes/`, `.svelte`) o carpetas `src/components/`**, el escáner ignoraba el **100% de los archivos** reportando falso verde.
   - *Acción tomada*: `check-architecture.sh` ahora escanea `src/` y `app/`, soporta `.astro`, `.vue`, `.svelte` y `.mdx`, detecta `import(\`...\`)` con *template literals*, reconoce alias `@repo/*`/`#config/*` y mapea superficies web (`components`, `pages`, `views`, `app`, `routes`) a las reglas de `UI` (permitiendo importar componentes y servicios, pero bloqueando saltos directos a `config` o `repo`).
3. **Ilusión de `stderr` en `PostToolUse` bajo Antigravity**:
   - *Diagnóstico*: En el motor nativo de Antigravity, cuando `PostToolUse` devuelve `{}` con código `0`, lo escrito en `process.stderr` **no se inyecta en el prompt del modelo**. Si un agente rompía `package.json`, `PostToolUse` no lo frenaba.
   - *Acción tomada*: `check-architecture.sh` (Puerta 1) valida ahora la sintaxis de todos los archivos `.json` estrictos del árbol (excluyendo `tsconfig*.json`/`jsconfig*.json` que usan JSONC), y `Stop` ejecuta siempre Puerta 1 antes de permitir cerrar el turno.
4. **Riesgo de Bloqueo y Latencia en el Hook `Stop` al Crecer el Proyecto Web**:
   - *Diagnóstico*: `init.sh` ejecutaba `npm install` incondicionalmente en cada corrida cuando existía `package.json`. Invocado desde `Stop` (`timeout: 60s`), `npm install + typecheck + lint + test + build` en Windows NTFS puede superar los `55s`, matando el proceso y atrapando al agente en un bucle infinito `"decision": "continue"`.
   - *Acción tomada*: `init.sh` solo ejecuta `$PM install` automáticamente cuando falta `node_modules/` (arranque en frío) o cuando se pide `HARNESS_FORCE_INSTALL=1`, y `Stop` pasa `HARNESS_SKIP_INSTALL=1`.

---

## 2. Matriz de las 12 Pruebas Adversariales Ejecutadas (`Antes vs. Después`)

| ID | Vector Adversarial Probado | Estado Original | Causa Raíz Detectada | Control Mecánico Implementado | Estado Actual |
| :--- | :--- | :---: | :--- | :--- | :---: |
| **`ADV-01`** | Escritura a `.env` vía MCP (`call_mcp_tool` -> `filesystem:write_file`) | **VULNERABLE** | `.agents/hooks.json` no incluía `call_mcp_tool\|mcp_.*` y `extractToolContext` ignoraba argumentos anidados MCP. | Matcher ampliado en `.agents/hooks.json` + extracción recursiva de rutas y queries SQL/shell MCP en `scripts/lib/harness-guards.mjs`. | **DEFENDIDO** |
| **`ADV-02`** | Escritura a `.env` o `.git/` por shell (`echo > .env`, `Set-Content .env`, `cp`, `node -e`) | **VULNERABLE** | `PreToolUse` solo verificaba rutas protegidas en `write_file`/`edit_file`, nunca en `run_command`. | Regla `touchesProtectedViaShell` en `harness-guards.mjs` que bloquea redirecciones, `Set-Content`/`Out-File`/`tee`, `cp`/`mv` y `node`/`python` inline hacia `.env*` o `.git/`. | **DEFENDIDO** |
| **`ADV-03`** | Escritura a variantes `.envrc`/`.env-local` y rutas de sistema (`C:\Windows`, `~/.ssh`, `/etc`) | **VULNERABLE** | `isProtectedTargetPath` solo miraba `.env` y `.env.*`, omitiendo `.env*` sin punto y rutas del OS prometidas en `SECURITY.md`. | `isProtectedTargetPath` y `check-architecture.sh` cubren `.env*` completo (salvo `.env.example`/`.sample`/`.template`) + `/etc`, `/usr`, `C:/Windows`, `~/.ssh`. | **DEFENDIDO** |
| **`ADV-04`** | Auto-edición de `evaluator-rubric.md` desde sesión *Maker* | **VULNERABLE** | Ningún hook verificaba `isCheckerSession` al editar `evaluator-rubric.md`. | `PreToolUse` bloquea (`deny`) ediciones a `evaluator-rubric.md` cuando `!isCheckerSession(payload)` (salvo override humano explícito `HARNESS_ALLOW_RUBRIC_EDIT=1`). | **DEFENDIDO** |
| **`ADV-05`** | Aliases destructivos en PowerShell/`cmd`/Git (`ri -r -fo`, `rd /s /q`, `git push origin +main`, `rmSync`) | **VULNERABLE** | `DESTRUCTIVE_CHECKS` solo buscaba `Remove-Item -Recurse -Force` literal y `--force`/`-f` en `git push`. | Ampliado a aliases PowerShell (`ri`/`del`/`rd` con `-r`/`-fo`/`-Confirm:$false`), `cmd` (`/s /q`), `+refspec`, `git branch -D`, `git checkout -f`, `rmSync` y `shutil.rmtree`. | **DEFENDIDO** |
| **`ADV-06`** | Bypass del Candado 3 (`send_message` a Checker lanzado con `TypeName: "research"`) | **VULNERABLE** | El regex `nonChecker` unía `TypeName` y `Role`, por lo que `TypeName: "research"` anulaba la detección de `Role: "Independent Checker"`. | `classifyInvokeSpec` evalúa primero `Role` y `Prompt` como Checker con soporte automático a `transcript_full.jsonl` si hay `truncated_fields`. | **DEFENDIDO** |
| **`ADV-07`** | Bypass del hook `Stop` con violación de 6 capas ya comiteada o `.tmp`/`.env.production` ignorados | **VULNERABLE** | Si `git status --porcelain` salía vacío (`""`), `Stop` retornaba `stop` sin correr `check-architecture.sh`. | `evaluateStopGate` ejecuta **siempre** Puerta 1 (`scripts/check-architecture.sh`) incluso con árbol Git limpio, y `./init.sh` completo cuando hay cambios sin confirmar. | **DEFENDIDO** |
| **`ADV-08`** | Saltos de capa `UI -> Repo` en `src/components/`, `.astro`/`.vue`/`.svelte` e `import(\`../repo/db\`)` | **VULNERABLE** | Escáner limitado a 6 nombres exactos de carpeta, sin extensiones SFC web ni backticks en `import()`. | Escáner ampliado en `scripts/check-architecture.sh` a `src/` + `app/`, carpetas UI web, `.astro/.vue/.svelte/.mdx`, alias `@repo/*` y template literals estáticos. | **DEFENDIDO** |
| **`ADV-09`** | Compatibilidad de `init.sh` y `check-architecture.sh` con `"type": "module"` en Node v26 | **DEFENDIDO** | `node -e` mantiene semántica CommonJS por defecto incluso con `"type": "module"` en `package.json`. | Verificado empíricamente sobre Node.js `v26.5.1` con rutas con espacios. | **DEFENDIDO** |
| **`ADV-10`** | Conversión silenciosa a `CRLF` al hacer `git clone` en Windows (`core.autocrlf=true`) | **VULNERABLE** | Faltaba `.gitattributes` versionado; `core.autocrlf=false` en `.git/config` es solo local y no viaja en `git clone`. | Creado `.gitattributes` forzando `* text=auto eol=lf` + binario para assets web, y validado mecánicamente (`0 CRLF`) en `scripts/check-architecture.sh`. | **DEFENDIDO** |
| **`ADV-11`** | Divergencia de esquema en `validate-harness.mjs`, *path traversal* `../` en `required_files` y `evidence: "ok"` | **VULNERABLE** | `harness-utils.mjs` aceptaba estados heredados (`passing`), claves extra, rutas fuera del repo (`../`) y evidencia de 1 carácter. | `validateFeatureListObject` unificado al 100% con `feature-list.schema.json`: 4 estados canónicos, sin `../` fuera de `root`, `isFile() && size > 0` y `evidence >= 10` caracteres. | **DEFENDIDO** |
| **`ADV-12`** | Fragilidad por tope de líneas en `scripts/harness-hooks.mjs` (`279/280` líneas) | **VULNERABLE** | A 1 sola línea de romper Puerta 1 (`> 280L`) y con lógica minificada difícil de auditar. | Modularizado respetando las 6 capas: lógica pura de políticas en `scripts/lib/harness-guards.mjs` (`Service`) y orquestador limpio en `scripts/harness-hooks.mjs` (`Runtime`, `< 200L`). | **DEFENDIDO** |

---

## 3. Límites Residuales Documentados y Controles Operativos

Ningún arnés basado en scripts locales es omnipotente. Estos son los **4 límites residuales reales** que no deben maquillarse y cómo quedan controlados en este proyecto:

1. **Ofuscación Deliberada en Shell (`run_command`)**:
   - *Límite*: Un parser estático sin sandbox a nivel kernel no puede predecir comandos construidos dinámicamente en base64, variables concatenadas o scripts externos arbitrarios.
   - *Control*: El arnés protege contra errores accidentales o atajos típicos de agentes LLM (`rm -rf`, `ri -r -fo`, `git reset --hard`, redirecciones a `.env`), mientras el aislamiento de credenciales reales depende de **no almacenar secretos de producción en el disco local del repo** (usar variables de entorno del proveedor de hosting como Vercel/Cloudflare/Netlify en despliegue).
2. **Pausa para Preguntar al Usuario con Árbol Roto (`Stop` Gate vs Escalation)**:
   - *Límite*: Si el agente deja un archivo a medias que rompe `init.sh` o `check-architecture.sh` y termina el turno con texto plano (`NO_TOOL_CALL`) para hacer una pregunta al usuario, el hook `Stop` le devolverá `"decision": "continue"` exigiéndole dejar las puertas en verde antes de detenerse.
   - *Control*: Para pausar legítimamente ante una duda de requisitos (`Escalation`), el agente debe usar la herramienta interactiva `ask_question` (que ocurre dentro del turno antes de `NO_TOOL_CALL`) o dejar el árbol compilando limpio con la tarea en `"status": "blocked"` y la duda documentada en `progress.md` / `session-handoff.md`.
3. **Presupuesto de Tokens/USD y Compactación (`Candado 2` y `COMPRESS`)**:
   - *Límite*: Los scripts Node/Bash del repositorio no tienen acceso al contador interno de tokens facturados de la sesión de Antigravity.
   - *Control*: El `Candado 1` (máximo 15 rondas), `Candado 3` (estancamiento 3 rondas) y `Candado 4` (anti-oscilación) se rastrean determinísticamente en `loop-state.md`; para sesiones largas el usuario o agente activa `/compact` o cierra sesión (`End of Session`) al notar degradación de contexto.
4. **Calidad Semántica de las Pruebas y de `evidence`**:
   - *Límite*: `Pass-State Gating` verifica mecánicamente que `required_files` existan con tamaño `> 0`, que `evidence` tenga al menos 10 caracteres y que `init.sh` devuelva `0`, pero un script estático no juzga por sí solo si un test unitario es tautológico (`expect(true).toBe(true)`).
   - *Control*: En cierres de hito o **Modo Crítico (`/goal`)**, el sub-agente **Checker `one-shot` aislado** inspecciona `git diff` y audita la calidad real de las pruebas bajo `evaluator-rubric.md` antes de consolidar el avance.
