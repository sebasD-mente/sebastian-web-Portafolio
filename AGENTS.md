# AGENTS.md

Este repositorio está gobernado por el **Arnés Camaleón Universal v2.1** para agentes autónomos de larga duración. Siguiendo el principio de **Codex**, este archivo es una **página de índice (~105 líneas)** centrada en invariantes y rutas de verificación, no una enciclopedia que microgestione la implementación. El objetivo es completar una sola tarea verificada a la vez y dejar el repositorio limpio y reiniciable (`restartable`).

## Startup Workflow

- **Before writing code** or modifying any project deliverable:
1. **Confirma el directorio de trabajo** con `pwd`.
2. **Lee este archivo (`AGENTS.md`)** de principio a fin (y cualquier `AGENTS.md` local del subdirectorio que vayas a tocar).
3. **Lee `harness.config.json`, `progress.md` y `session-handoff.md`** para conocer el perfil activo, el último estado verificado, riesgos y siguiente paso.
4. **Lee `feature_list.json`** para inspeccionar el estado (`status`) y prioridades de las tareas.
5. **Revisa los commits recientes** con `git log --oneline -5` (si el repositorio Git ya tiene historial).
6. **Ejecuta `bash ./init.sh`** para verificar que el entorno y la línea base están sanos.

> REGLA DE BLOQUEO INICIAL: Si `bash ./init.sh` falla al iniciar la sesión, DETENTE y repara primero la línea base antes de agregar alcance.

## Working Rules

- **Página de Índice e Invariantes sobre Microgestión (`Codex` / `Claude Code`)**: Mantén `AGENTS.md` conciso (~100–110 líneas) enfocado en restricciones innegociables y comandos de verificación (*"don't micromanage the implementation; focus on invariants"*). El detalle procedimental vive en `docs/` y `.agents/skills/` bajo demanda (`Organización -> Usuario -> Proyecto raíz -> Subdirectorio -> Override local *.local.md`).
- **El Arnés lo lleva el Agente y Autoconfigura `harness.config.json` el Día 1 (Interacción 100% Natural)**: Prohibido pedir ayuda técnica al usuario o exigirle editar archivos del arnés. Conversa con naturalidad y traduce los acuerdos hacia `harness.config.json`, `feature_list.json`, `sprint-contract.md`, `ARCHITECTURE.md`, `progress.md` y `session-handoff.md`, configurando `harness.config.json` automáticamente el Día 1 para cualquiera de los 3 escenarios:
  1. **Código Nuevo (`greenfield` / `auto`)**: Web/Node, Python (con `.venv` obligatorio y validación AST en `scripts/check-python.mjs`), PowerShell, Dart/Flutter o repositorios mixtos políglotas.
  2. **Repositorios Existentes (`brownfield`)**: Mapeando las carpetas reales en `harness.config.json` (`layerMap`) y usando el trinquete `maxLegacyLayerViolations` para no bloquear el arranque ni dar falsos verdes.
  3. **Tareas de No-Desarrollo (`non-dev`)**: Investigación, documentación, análisis o estrategia, activando la Puerta 3 Documental (`scripts/check-deliverables.mjs`: cero placeholders, cero enlaces rotos, sustancia verificable y fuentes).
- **Dos Marchas de Trabajo (`Modo Diario Ágil` por defecto vs `Modo Crítico / Loop`)**: El **Modo Diario Ágil** es el predeterminado para tareas normales (`WIP = 1` + `bash ./init.sh` + actualizar `feature_list.json` y `progress.md`, sin exigir `loop-state.md` ni *Checker* salvo cierre de hito o solicitud del usuario); el **Modo Crítico / Loop (`/goal`)** activa `loop-state.md` y el sub-agente *Checker* `one-shot` aislado.
- **One feature at a time (`WIP = 1`)**: Elige exactamente UNA tarea no terminada de `feature_list.json` cuyas `dependencies` estén en `done` con sus `required_files` físicos creados en disco, y cambia su estado a `in-progress` (prohibido superar `WIP = 1` o saltarse el orden secuencial DAG; usa `blocked` si un requisito externo impide avanzar).
- **Contrato Previo al Entregable (`sprint-contract.md`)**: Antes de ejecutar la tarea activa, actualiza `sprint-contract.md` con alcance incluido, exclusiones explícitas y criterios verificables.
- **Stay in scope**: Mantén todos tus cambios estrictamente dentro del alcance de la tarea activa sin refactorizar módulos ajenos. Registra peticiones nuevas en `feature_list.json` para ejecutarlas en orden.
- **Verification required & Prohibido debilitar reglas**: Nunca declares una tarea terminada por inspección visual; ejecuta los comandos reales de verificación (respetando `.venv` en Python y `0 CRLF`) y jamás borres, comentes ni relajes pruebas o validadores.
- **Separación estricta Maker-Checker (`zero-inheritance` y `One-Shot` por pasada)**: El *Maker* tiene prohibido editar o autoaprobarse en `evaluator-rubric.md`. **1 Checker = 1 sola auditoría (`one-shot`)**; toda auditoría o re-auditoría DEBE lanzar una instancia `invoke_subagent` completamente nueva con ventana virgen, quedando prohibido usar `send_message` hacia el `conversationId` de un *Checker* ya utilizado.

## Required Artifacts

- `.gitignore` — Protección de secretos (`.env*`), overrides locales (`*.local.md`), `.venv/`, telemetría (`.agents/.runtime/`), builds y temporales.
- `.gitattributes` — Garantía multiplataforma de fin de línea `LF` (`0 CRLF`) en `git clone` y `git worktree`, más reglas binarias para activos.
- `harness.config.json` — Perfil Camaleón autoconfigurado el Día 1 (`auto`/`greenfield`, `brownfield` con `layerMap` + `maxLegacyLayerViolations` y `non-dev`).
- `feature_list.json` — Fuente única de verdad para estado (`not-started`, `in-progress`, `blocked`, `done`), DAG, `verification` y `evidence`.
- `scripts/feature-list.schema.json` — Esquema JSON Draft-07 canónico con `Pass-State Gating` y campos `area`/`user_visible_behavior`.
- `progress.md` — Registro maestro de continuidad, decisiones (`por qué` + `Alternatives considered`) y estado actual.
- `init.sh` — Punto de entrada POSIX políglota aditivo para instalación y verificación en 3 puertas (`set -euo pipefail`).
- `session-handoff.md` — Acta de entrega de turno obligatoria al finalizar cada sesión.
- `clean-state-checklist.md` — Lista de verificación de las 5 dimensiones de estado limpio antes de cerrar sesión.
- `memory/INDEX.md` — Índice de Auto-Memoria en Dos Pasos (tope de 200 líneas / 25 KB) hacia `memory/topics/*.md`.
- `ARCHITECTURE.md` — Mapa de dominios, 6 capas (`Types -> Config -> Repo -> Service -> Runtime -> UI`), Perfiles Camaleón, `Capability Seams` y puntos calientes.
- `scripts/check-architecture.sh` — Vigilante mecánico de límites arquitectónicos, `0 CRLF`, JSON estricto, higiene `cleanup-scanner` y Bolígrafo Rojo.
- `scripts/check-python.mjs` — Verificador políglota de Python (aislamiento `.venv`, AST/sintaxis, fronteras de 6 capas y pruebas/linters).
- `scripts/check-deliverables.mjs` — Verificador de Puerta 3 Documental para modo `non-dev` (cero placeholders, cero enlaces rotos, sustancia y fuentes).
- `docs/RELIABILITY.md` — Observabilidad de Runtime: logs JSON `RuntimeLogEntry` con `correlationId`, `.agents/.runtime/hook-audit.jsonl` y 3 puertas aditivas.
- `sprint-contract.md` — Contrato formal de alcance (`Scope`), exclusiones explícitas y criterios de éxito previos a la ejecución.
- `evaluator-rubric.md` — Rúbrica objetiva de 0 a 12 puntos (Código y `non-dev`) exclusiva para el Agente Evaluador (*Checker*) `one-shot` bajo `zero-inheritance`.
- `docs/QUALITY_SCORE.md` — Semáforo de salud (`A-D`) por dominio/capa, instantánea `v2.1-universal-chameleon` y registro de Estudios de Ablación.
- `docs/SECURITY.md` — Presupuesto (`Write-Select-Compress-Isolate`), `Fail-Closed`, candado anti-`pip` global, `Turn Event Pipeline`, Bootstrap y `Model-Visible Means Logged`.
- `.agents/hooks.json` — Candados deterministas nativos de ciclo de vida (`PreToolUse`, `PostToolUse` y `Stop`, incluyendo herramientas MCP).
- `scripts/harness-hooks.mjs` — Runner Node.js multiplataforma (`stdin`/`stdout` JSON) de hooks nativos, auditoría `hook-audit.jsonl` y Candado 3 `one-shot`.
- `scripts/lib/harness-guards.mjs` — Políticas puras `Fail-Closed` de rutas protegidas, anti-`pip` global, comandos destructivos, aislamiento de rúbrica y `Checker`.
- `docs/design-docs/adversarial-audit-day1.md` — Reporte de auditoría adversarial Día 1 y evolución Camaleón v2.0.
- `goal.md` — Loop Basado en Objetivo (`/goal`) con 3 categorías de archivos y Disyuntor de 4 Candados (`4-Lock Circuit Breaker`).
- `maker-prompt.md` — Instrucciones operativas por ronda para el Agente Constructor (*Maker*).
- `checker-prompt.md` — Instrucciones operativas para el Agente Evaluador Independiente (*Checker*) `one-shot` bajo `zero-inheritance`.
- `loop-state.md` — Memoria entre rondas, mecanismo de Trinquete (*Ratchet*) y monitor de disyuntores.
- `.agents/skills/maker-checker/SKILL.md` — Skill bajo demanda del bucle `Maker-Checker` con `description <= 150` caracteres (`Gotcha #12`).
- `graph.md` — Ingeniería de Grafos de 5 nodos (`research -> implement -> verify -> human_approval -> merge`), `error_layer` y patrones `Coordinator`, `Fork` y `Swarm`.
- `docs/GOTCHAS.md` — Tabla de los 15 Gotchas críticos de producción, auditoría de las 25 verificaciones (`structuredHas`) y protocolo de Estudios de Ablación.
- `docs/product-specs/dekolabs-portfolio-spec.md` — Especificación de producto, sistema de diseño *Atelier Monolith* (Google Stitch) y arquitectura de 6 capas para `dekolabs.org`.

## Progressive Expansion (Anti-Doc Bloat — SOP `encode-knowledge-into-repo`)

Codifica decisiones externas **bajo demanda** creando solo el artefacto necesario (y enlázalo en `Required Artifacts` recién después de crearlo con contenido real):
- **Producto y diseño**: `docs/product-specs/`, `docs/PRODUCT_SENSE.md`, `docs/design-docs/` y `docs/FRONTEND.md`.
- **Planes, referencias y derivados**: `docs/exec-plans/{active,completed}/`, `docs/exec-plans/tech-debt-tracker.md`, `docs/references/*-llms.txt` y `docs/generated/`.

## Definition of Done

- **Compuerta de cierre (`done` only when / done only when)**: Una tarea está terminada SOLO cuando TODAS las siguientes condiciones se cumplen:
- [ ] El comportamiento de código o entregable `non-dev` objetivo está implementado por completo sin placeholders ni violaciones de alcance.
- [ ] Los pasos listados en `verification` de la tarea y `bash ./init.sh` se ejecutaron realmente (tests, lint, type-check, build, `check-python.mjs` o `check-deliverables.mjs`).
- [ ] La evidencia ejecutable (`Verification Evidence`: comando exacto y salida obtenida) quedó registrada en `evidence` (`>= 10` caracteres) de `feature_list.json` y en `progress.md`.
- [ ] El repositorio permanece limpio y reiniciable (`restartable`) desde la ruta de inicio estándar (`0 CRLF`, cero temporales).

## Verification Commands

```bash
bash ./init.sh                                     # Verificación completa en 3 puertas aditivas (test, verify, lint, type, build)
bash scripts/check-architecture.sh                 # Vigilante mecánico de 6 capas, Perfiles Camaleón, 0 CRLF y Bolígrafo Rojo
node scripts/validate-harness.mjs --min-score 100  # Auditoría matemática 100/100 (WIP=1, DAG y Pass-State Gating)
```
- `bash ./init.sh` (ejecuta Puerta 1 Estática/Arquitectura, Puerta 2 Comportamiento `100/100` y Puerta 3 Políglota/Documental: `check-python.mjs`, `check-deliverables.mjs`, build/test)
- `bash scripts/check-architecture.sh` (verifica `ARCHITECTURE.md`, `harness.config.json`, 6 capas, enlaces en `Required Artifacts` y `cleanup-scanner`)
- `node scripts/validate-harness.mjs --min-score 100` (verifica `100/100` en los 5 subsistemas del arnés)

## Escalation

Si encuentras cualquiera de estas situaciones, escala de forma estructurada (usando `ask_question` dentro del turno o dejando el árbol limpio con `"status": "blocked"`):
- **Architecture decisions**: Consulta `ARCHITECTURE.md` y `harness.config.json`; si requiere alterar límites de capas o invariantes, consulta al usuario antes de codificar.
- **Unclear requirements**: Revisa `feature_list.json`, `sprint-contract.md` y `docs/product-specs/` (si existe); si persiste la ambigüedad, pregunta al usuario con `ask_question`.
- **Repeated test failures**: Respeta los disyuntores de `goal.md` / `loop-state.md`, documenta el diagnóstico en `progress.md`, marca `"status": "blocked"` si depende de un bloqueo externo y solicita revisión humana.
- **Scope ambiguity**: Relee `feature_list.json` (`Definition of Done`) y `sprint-contract.md`; anota alcance adicional como tarea futura sin romper `WIP = 1`.

## End of Session

- **Before ending** a session or when context usage reaches 65%:
1. Ejecuta `bash ./init.sh` y confirma que el estado es limpio (`clean state`).
2. Actualiza `progress.md` con lo completado, decisiones tomadas, archivos modificados y evidencia.
3. Actualiza `feature_list.json` con el estado real y el campo `evidence` documentado.
4. Actualiza `session-handoff.md` registrando bloqueos (`Blockers`), archivos tocados y el siguiente paso recomendado (`Recommended Next Step`).
5. Elimina cualquier archivo temporal (`*.tmp`, `*.bak`, `*.swp`) y realiza un `git commit` descriptivo cuando sea seguro reanudar.
