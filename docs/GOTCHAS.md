# GOTCHAS.md (Tabla de Control de los 15 Gotchas de Producción, Auditoría de 25 Puntos y Estudios de Ablación)

Este documento reúne los **15 modos de fallo no obvios de producción (`15 Gotchas`)**, las trampas operativas adicionales neutralizadas en el **Arnés Camaleón Universal v2.1** (Web, Python `.venv`, `brownfield`, `non-dev`, Windows `0 CRLF` / `0 UTF-8 BOM` y hooks de Antigravity), la especificación de las **25 verificaciones mecánicas** de `scripts/validate-harness.mjs` (con su invariante `structuredHas`) y el protocolo operativo para ejecutar **Estudios de Ablación**.

---

## 1. Tabla de Control de los 15 Gotchas Críticos de Producción

Esta tabla documenta los 15 errores sutiles de sistemas agénticos reales y el mecanismo exacto con el que nuestro arnés los neutraliza:

| # | Gotcha (Trampa Oculta) | Qué pasa si caes en ella | Cómo lo previene nuestro Arnés | Artefacto / Candado en este Repo |
| :--- | :--- | :--- | :--- | :--- |
| **1** | **Los límites del índice de memoria cortan en silencio** | `memory/INDEX.md` se trunca al superar `200` líneas o `25 KB` y el agente pierde recuerdos recientes sin emitir error. | Escribir solo 1 línea de gancho (`<= 120` caracteres) en `memory/INDEX.md` y guardar el detalle en `memory/topics/*.md`. | `memory/INDEX.md` + `scripts/check-architecture.sh` (Sección 3) |
| **2** | **El orden de prioridad de archivos es contraintuitivo** | Una regla global de usuario u organización es ignorada en silencio cuando entra en conflicto con reglas más cercanas. | Respetar la jerarquía explícita donde lo más local gana siempre: `Local (*.local.md) > Subdirectorio (AGENTS.md) > Proyecto raíz (AGENTS.md) > Usuario > Organización`, ignorando `*.local.md` en `.gitignore`. | `.gitignore` + `memory/topics/harness-rules.md` + `AGENTS.md` |
| **3** | **Ventana de carrera al extraer memoria en segundo plano** | El usuario envía otro mensaje antes de que termine la extracción asíncrona o se duplica lo ya escrito por el agente. | Disparar solo tras respuesta final sin *tool calls* pendientes, fusionar (*coalesce*) peticiones concurrentes, aplicar **exclusión mutua** y **avanzar el cursor solo tras éxito**. | `docs/SECURITY.md` (Sección 1.2) + `AGENTS.md` (`End of Session`) |
| **4** | **Guardar contenido derivable en la memoria** | El agente memoriza detalles de arquitectura o código; mañana el repositorio cambia y la memoria miente (*Stale Memory Poisoning*). | Prohibir almacenar en `memory/` cualquier dato derivable directamente del repositorio (`git log`, rutas, esquemas o capas). | `memory/INDEX.md` + `memory/topics/harness-rules.md` |
| **5** | **Clasificar concurrencia por herramienta y no por llamada** | Marcar la terminal o MCP como "segura en paralelo" provoca que un comando mutador corra mientras otro lee archivos. | Clasificar cada invocación individualmente en runtime (incluyendo `call_mcp_tool` / `mcp_.*`): lecturas puras en paralelo; mutaciones estrictamente en serie. | `docs/SECURITY.md` (Sección 2.1) + `scripts/lib/harness-guards.mjs` |
| **6** | **La evaluación de permisos tiene efectos secundarios** | Cachear una decisión de permiso impide registrar denegaciones o escalar automáticamente el modo `auto -> ask`. | Evaluar permisos en fresco en cada llamada sensible y registrar cada veredicto en `.agents/.runtime/hook-audit.jsonl`; nunca cachear autorizaciones mutadoras. | `docs/SECURITY.md` (Sección 2.1 y 3.4) + `scripts/harness-hooks.mjs` |
| **7** | **El trabajo asíncrono casi nunca pasa por `"pending"`** | Un monitor espera ver tareas de fondo en `"pending"`, pero el runtime las registra directamente en `"running"`. | Usar **`Typed Prefixed IDs`** (`checker-003`), salida en disco y estados `running -> completed \| failed \| killed`, manteniendo en `feature_list.json` únicamente los 4 estados canónicos (`not-started`, `in-progress`, `blocked`, `done`). | `feature_list.json` + `scripts/feature-list.schema.json` + `docs/SECURITY.md` |
| **8** | **Hijos creados con `Fork` haciendo nuevos `Forks`** | Un sub-agente bifurcado vuelve a bifurcarse heredando todo el contexto y el coste explota exponencialmente; pero quitar la herramienta del prompt rompe la `prompt cache`. | Invariante de **un solo nivel**: **mantener la herramienta `fork` en el pool de definiciones del hijo** (preservando el prefijo de `prompt cache`), pero **bloquear su ejecución en tiempo de llamada (*at call time*)**. | `docs/SECURITY.md` (Sección 1.4) + `graph.md` (Sección 4) |
| **9** | **Constructores de contexto cacheados sin invalidación** | El agente edita un archivo pero el *context builder* memoizado sigue sirviendo la copia antigua toda la sesión. | Todo punto de mutación (`writeFile` / `editFile`) invalida su clave en caché y se re-verifica con `PostToolUse`, `Stop` y `bash ./init.sh`. | `docs/SECURITY.md` (Sección 1.1) + `.agents/hooks.json` |
| **10** | **La confianza de los Hooks es Todo-o-Nada** | En un workspace no confiable se desactivan todos los hooks en silencio, o evaluar hooks individuales abre brechas de seguridad. | Gobernar el arranque con el **`Bootstrap en 4 Etapas y Frontera de Confianza`**: no cargar secretos, escritura ni hooks antes del consentimiento (Etapa 3); sin confianza la sesión queda en solo lectura. | `docs/SECURITY.md` (Sección 3.2) + `.agents/hooks.json` + `init.sh` |
| **11** | **Limpiar resultados de sub-agentes antes de notificar al padre** | El recolector borra el resultado de una unidad terminada antes de que el coordinador padre alcance a leerlo (*race condition*). | Aplicar **`Two-Phase Eviction`**: (1) limpiar salida cruda en disco de forma *eager* al entrar en estado terminal, y (2) liberar el registro en memoria de forma *lazy* solo después de notificar al padre. | `docs/SECURITY.md` (Sección 3.2) + `graph.md` + `loop-state.md` |
| **12** | **Descripciones de Skills demasiado largas** | El listado de Skills trunca cada descripción a `~150` caracteres y las palabras clave al final nunca disparan la Skill. | Imponer un tope duro de `<= 150` caracteres en `description` del frontmatter YAML de cada `SKILL.md` colocando los disparadores distintivos al inicio. | `.agents/skills/maker-checker/SKILL.md` + `scripts/check-architecture.sh` |
| **13** | **El permiso por defecto de herramientas nuevas es `"Allow"`** | Conectar una nueva herramienta o servidor MCP sin política propia permite mutaciones silenciosas sin pasar por compuerta. | Modelo `Fail-Closed`: toda herramienta sensible o MCP nueva entra con permiso `ask`/`deny` y `PreToolUse` inspecciona recursivamente rutas y SQL/comandos en `call_mcp_tool`. | `docs/SECURITY.md` + `.agents/hooks.json` + `scripts/lib/harness-guards.mjs` |
| **14** | **La memoria de equipo requiere Auto-Memoria activa** | Deshabilitar la infraestructura base de auto-memoria desactiva también la capa compartida de memoria del equipo. | Mantener activa y validada en Puerta 1 la infraestructura base `memory/INDEX.md` + `memory/topics/*.md` antes de habilitar capas compartidas. | `init.sh` + `scripts/check-architecture.sh` |
| **15** | **Acumulación de archivos huérfanos en `memory/topics/`** | Una interrupción entre el Paso 1 (crear tema) y el Paso 2 (enlazar en índice) deja archivos huérfanos que consumen disco. | El vigilante `scripts/check-architecture.sh` barre `memory/topics/*.md` en cada corrida y falla con Bolígrafo Rojo si algún archivo no está referenciado en `memory/INDEX.md`. | `scripts/check-architecture.sh` (Sección 3) + `clean-state-checklist.md` |

### 1.1 Resumen de las 3 Invariantes Finas de Runtime (`Memoria`, `Bootstrap` y `Prompt Cache`)

1. **Exclusión Mutua y Cursor Atómico en Memoria (`Gotcha #3`)**: La extracción en segundo plano nunca compite con escrituras explícitas del turno principal; si falla, el cursor no avanza para reintentar esos mensajes en el siguiente turno.
2. **Bootstrap Ordenado en 4 Etapas con `Trust Boundary`, `Typed Prefixed IDs` y `Two-Phase Eviction` (`Gotchas #7, #10, #11`)**: `Stage 1 (Minimal Context)` -> `Stage 2 (Read-Only Safe Tools)` -> `Stage 3 (Trust Boundary Crossed)` -> `Stage 4 (Telemetry, Secrets, Write Tools & Hooks)`.
3. **Bloqueo en Tiempo de Llamada (`Call-Time Guard`) para Preservar `Prompt Cache` en `Fork` (`Gotcha #8`)**: La definición de `fork` permanece visible en el pool del hijo pero el runtime rechaza cualquier llamada recursiva al ejecutarse.

### 1.2 Trampas Operativas Adicionales Neutralizadas en `v2.1-universal-chameleon`

- **`stderr` silencioso en `PostToolUse` y árbol Git limpio en `Stop` (Antigravity)**: Cuando `PostToolUse` termina con código `0`, `stderr` no frena al modelo; y si `Stop` solo corría `init.sh` ante cambios sin comitear, violaciones ya comiteadas, entregables `non-dev` incompletos o `.tmp`/`.env*` ignorados escapaban. Por eso `check-architecture.sh` valida todos los `.json` estrictos en Puerta 1 y `Stop` ejecuta **siempre las 3 Puertas (`HARNESS_SKIP_INSTALL=1 bash ./init.sh`, `timeout: 45s`)** tanto con árbol sucio como con árbol limpio (`git status --porcelain` vacío).
- **Alias de escritura del IDE, claves genéricas de ruta y normalización NTFS en `PreToolUse`**: Un matcher parcial o una lista fija de campos permitía evadir candados usando alias del IDE (`write_to_file`, `replace_file_content`, `multi_replace_file_content`, `apply_patch`), claves genéricas de ruta (`filePath`, `TargetFile`, `destination`, `filename`) o sufijos NTFS (`evaluator-rubric.md.`, `.env::$DATA`). Ahora `.agents/hooks.json` registra `"matcher": "*"` en `PreToolUse` y `PreInvocation` plano, mientras `scripts/lib/harness-guards.mjs` aplica red `Fail-Closed` sobre verbos mutantes, extracción generalizada de rutas y normalización NTFS antes de evaluar rutas protegidas o `evaluator-rubric.md`.
- **Falsos verdes en proyectos Web modernos, Políglotas, `brownfield` y `non-dev`**: Un `if / elif` excluyente en `init.sh` ocultaba backends Python cuando existía `package.json`, y escanear solo `src/ui/` ignoraba `.astro/.vue/.svelte`, `components/` o carpetas legadas. Ahora `harness.config.json` (validado centralizadamente por `validateHarnessConfig` en las 3 puertas) gobierna 3 perfiles Camaleón con Puerta 3 aditiva (`check-python.mjs` + `check-deliverables.mjs`) y trinquete `maxLegacyLayerViolations` para deuda *Brownfield*.
- **Contaminación con `pip` global y conversión silenciosa a `CRLF` / `UTF-8 BOM` en Windows**: `PreToolUse` bloquea cualquier `pip install` fuera de `.venv` local, y `.gitattributes` (`* text=auto eol=lf`) junto al escáner binario de Puerta 1 en `check-architecture.sh` verifican **`0 CRLF` (`0x0D`) y `0 UTF-8 BOM` (`0xEF 0xBB 0xBF`)** en todos los archivos de texto del repositorio.
- **Archivos nuevos no rastreados (`??`) tras un `discard` / Rollback del Ratchet**: Como `git clean -fd` y `rm -rf` están bloqueados por seguridad en `PreToolUse`, `git restore --worktree --staged .` solo revierte archivos ya rastreados; el protocolo de `discard` (`loop-state.md`) exige revisar `git status --porcelain` y borrar individualmente con `rm <archivo>` cada archivo nuevo no rastreado creado en la iteración fallida.
- **Pausa para preguntar al usuario con árbol roto**: Terminar el turno en texto plano (`NO_TOOL_CALL`) mientras falla una puerta activa `"decision": "continue"` en `Stop`. Para escalar dudas legítimas, usa la herramienta `ask_question` dentro del turno o deja el árbol en verde marcando `"status": "blocked"`.

---

## 2. Las 25 Verificaciones Exactas del Arnés (`validate-harness.mjs`)

El script `scripts/validate-harness.mjs` audita matemáticamente el arnés sobre **100 puntos** divididos en **5 subsistemas $\times$ 5 verificaciones objetivas**:

1. **Subsistema 1 — Instrucciones (`instructions`: 5/5)**:
   - Existe `AGENTS.md` en la raíz (página de índice concisa ~105 líneas centrada en invariantes).
   - Documenta estructuradamente el flujo de arranque (`Startup Workflow` / `Before writing code`).
   - Documenta estructuradamente la Definición de Terminado (`Definition of Done` / `done only when`).
   - Expone los comandos de verificación (`Verification Commands`, `./init.sh`, `test`, `verify`).
   - Enruta hacia los artefactos de estado (`feature_list.json` y `progress.md`).
2. **Subsistema 2 — Estado (`state`: 5/5)**:
   - Existe `feature_list.json` en la raíz.
   - `feature_list.json` cumple en paridad total el esquema `scripts/feature-list.schema.json`: contiene al menos una tarea (`N >= 1`), acepta exclusivamente los 4 estados canónicos (`not-started`, `in-progress`, `blocked`, `done`), prohíbe claves extra y *path traversal* (`../`) fuera de la raíz, exige **Pass-State Gating** (`evidence >= 10` caracteres en `done`) y verifica que cada ruta de `required_files` sea un archivo físico con tamaño `> 0`.
   - Existe `progress.md` en la raíz.
   - `progress.md` incluye encabezados de reinicio (`Current State`, `What's Done`, `What's Next`).
   - `session-handoff.md` captura `Blockers`, `Files Changed` y `Next Session` / `Recommended Next Step`.
3. **Subsistema 3 — Verificación (`verification`: 5/5)**:
   - Existe el punto de entrada POSIX `init.sh` en la raíz.
   - `init.sh` activa fallo rápido (`set -euo pipefail`).
   - Se documenta el comando de pruebas (`test` / `validate-harness.mjs` / `check-python.mjs` / `check-deliverables.mjs`).
   - Se documenta la validación estática y arquitectónica (`check-architecture.sh` / `lint` / `type` / `build`).
   - Se exige y verifica evidencia ejecutable (`Verification Evidence` / `command and output`).
4. **Subsistema 4 — Alcance (`scope`: 5/5)**:
   - `AGENTS.md` impone `One feature at a time` y `feature_list.json` cumple `WIP <= 1`.
   - `feature_list.json` rastrea `dependencies` y respeta el orden secuencial DAG sin ciclos ni saltos (bloqueando tareas hijas si una dependencia está en `not-started`, `in-progress` o `blocked`).
   - Cada tarea tiene un campo `status` explícito dentro de los 4 estados canónicos.
   - `AGENTS.md` documenta la frontera de alcance (`Stay in scope`) y el protocolo `Escalation`.
   - `Definition of Done` actúa como compuerta de cierre de alcance.
5. **Subsistema 5 — Ciclo de Vida (`lifecycle`: 5/5)**:
   - Existe el script de inicio `init.sh`.
   - `AGENTS.md` define el protocolo estructurado `End of Session` (`Before ending`).
   - Existe `session-handoff.md` en la raíz.
   - `progress.md` y `session-handoff.md` contienen los marcadores de reinicio (`Last Updated`, `Current Objective`, `Recommended Next Step`).
   - Está documentada la ruta de estado limpio y reiniciable (`restartable`, `clean state`).

> [!IMPORTANT]
> **Invariante `structuredHas` (Por qué el Formato Importa)**
> `scripts/lib/harness-utils.mjs` evalúa las reglas de `AGENTS.md`, `progress.md` y `session-handoff.md` mediante la función `structuredHas`: **solo reconoce reglas expresadas en encabezados Markdown (`##`), listas (`-` o `1.`), tablas (`|`) o etiquetas en negrita al inicio de línea (`**...**`)** (además de bloques de código). Esconder reglas operativas dentro de párrafos largos de prosa hace que tanto el validador como el LLM las pasen por alto.

---

## 3. Protocolo de Estudios de Ablación y Simplificación Continua

Un arnés de ingeniería no solo agrega defensas; también **se poda empíricamente** cuando la evolución de los modelos vuelve redundante una restricción.

### Procedimiento en 4 Pasos para Ejecutar un Estudio de Ablación
1. **Línea Base (`Baseline Snapshot`)**: Confirma que `bash ./init.sh` y `node scripts/validate-harness.mjs --min-score 100` están en `100/100` y revisa `docs/QUALITY_SCORE.md`.
2. **Aislamiento de Variable (`Single-Component Ablation`)**: En un directorio temporal aislado (nunca sobre el árbol principal), desactiva **exactamente un componente o candado** a la vez.
3. **Ejecución del Benchmark Mecánico y Adversarial**: Corre `node scripts/validate-harness.mjs`, `bash scripts/check-architecture.sh` y los vectores de `PreToolUse`/`Stop`, midiendo el impacto en el puntaje y en los diagnósticos de Bolígrafo Rojo.
4. **Decisión Basada en Evidencia y Registro**:
   - **Si la seguridad, determinismo o puntaje caen**: Queda demostrado el valor marginal positivo del componente. **Restáuralo** y regístralo con decisión **Mantener** en la Sección 3 de `docs/QUALITY_SCORE.md`.
   - **Si todo permanece idéntico sin él**: Elimina el componente redundante para reducir el *Discovery Cost* y documenta la simplificación en `docs/QUALITY_SCORE.md`.

---

## 4. Las 4 Etapas Progresivas del Arnés y Expansión Bajo Demanda (Anti-`Doc Bloat`)

El arnés estructura sus capacidades en 4 etapas de madurez sin caer en `Doc Bloat` (ningún documento opcional en `docs/` se enlaza en `Required Artifacts` de `AGENTS.md` antes de existir físicamente con contenido real):

1. **Etapa 1 — Paquete Mínimo Vital y Perfil Camaleón (Día 1)**: `.gitignore`, `.gitattributes` (`0 CRLF`), `harness.config.json` (autoconfigurado para `greenfield`/`auto`, `brownfield` o `non-dev`), `AGENTS.md`, `feature_list.json`, `scripts/feature-list.schema.json`, `progress.md`, `session-handoff.md` e `init.sh` validados a `100/100`.
2. **Etapa 2 — Continuidad, Higiene y Memoria en Dos Pasos**: Verificación de arranque en frío, checklist de 5 dimensiones (`clean-state-checklist.md`) y Auto-Memoria (`memory/INDEX.md` + `memory/topics/harness-rules.md`).
3. **Etapa 3 — Arquitectura Camaleón en 6 Capas, Puertas Políglotas/Documentales, Observabilidad y Seguridad `Fail-Closed`**: `ARCHITECTURE.md`, `scripts/check-architecture.sh`, `scripts/check-python.mjs`, `scripts/check-deliverables.mjs`, `docs/RELIABILITY.md`, `sprint-contract.md`, `evaluator-rubric.md`, `docs/QUALITY_SCORE.md`, `docs/SECURITY.md`, `.agents/hooks.json`, `scripts/harness-hooks.mjs` y `scripts/lib/harness-guards.mjs`.
4. **Etapa 4 — Loops Autónomos, Grafos de 5 Nodos y Superficie Avanzada Bajo Demanda**: `goal.md`, `maker-prompt.md`, `checker-prompt.md`, `loop-state.md`, `.agents/skills/maker-checker/SKILL.md`, `graph.md`, `docs/GOTCHAS.md` y creación bajo demanda de `docs/product-specs/`, `docs/design-docs/`, `docs/exec-plans/`, `docs/FRONTEND.md`, `docs/references/*-llms.txt` y `docs/generated/`.
