# QUALITY_SCORE.md (Mapa de Salud, Estabilidad y Evolución del Sistema)

Este documento proporciona **Observabilidad de Proceso a Largo Plazo**. Mientras `evaluator-rubric.md` responde *"¿Hizo buen trabajo el agente en esta sesión?"*, `docs/QUALITY_SCORE.md` responde *"¿El repositorio se está fortaleciendo o debilitando con el tiempo?"*, permitiendo que cualquier sesión nueva identifique de inmediato qué dominios o capas son sólidos (`A`) y cuáles requieren atención prioritaria (`C` o `D`).

**Cadencia de Actualización:**
- Después de cada sesión o entrega significativa.
- Antes y después de ejecutar comparaciones de benchmark o estudios de ablación.
- Después de pases de limpieza estructural, reducción del trinquete `maxLegacyLayerViolations` o simplificación del arnés.
- Al incorporar un nuevo agente, stack políglota, herramienta o modelo base al flujo de trabajo.

**Escala de Calificación:**
- **A**: Toda la verificación pasando, límites arquitectónicos impuestos mecánicamente, legible para el agente y tests/validadores estables.
- **B**: Funcionando correctamente con brechas menores de cobertura, legibilidad o documentación.
- **C**: Parcialmente funcional, difícil de entender para el agente o con inestabilidad notable en tests (*flaky*).
- **D**: Roto, inseguro o estructuralmente confuso (prioridad máxima de reparación antes de expandir alcance).

---

## 1. Dominios del Proyecto / Flujo de Trabajo

| Dominio / Área | Calificación (A-D) | Verificación | Legibilidad para el Agente | Estabilidad de Tests | Brechas Principales | Última Actualización |
| :--- | :--- | :--- | :--- | :--- | :--- | :--- |
| **Aplicación / Entregables (`app`)** | B | Puerta 3 Camaleón aditiva lista (`init.sh` + `check-python.mjs` + `check-deliverables.mjs`) | Alta (`harness.config.json`, `ARCHITECTURE.md`, 6 capas y 3 perfiles definidos) | N/A (plantilla Día 1 limpia; lista para código políglota, `brownfield` o `non-dev`) | Autoconfigurar `harness.config.json` e iniciar `feat-001` al abrir un proyecto real | 2026-11-07 |
| **Gobernanza, Instrucciones y Grafos (`instructions`)** | A | Pasa `bash ./init.sh` (`5/5`), `0 CRLF` y `scripts/check-architecture.sh` | Alta (`AGENTS.md` conciso ~105L con 29 artefactos reales, `ARCHITECTURE.md`, `goal.md`, `maker-prompt.md`, `checker-prompt.md`, `SKILL.md`, `graph.md`) | Estable (`100%` determinista, `0` fallos intermitentes) | Ninguna | 2026-11-07 |
| **Estado, Alcance y Ciclo de Vida (`state`, `scope`, `lifecycle`)** | A | Pasa `node scripts/validate-harness.mjs --min-score 100` (`15/15`) en paridad total con `feature-list.schema.json` | Alta (`feature_list.json`, `scripts/feature-list.schema.json`, `progress.md`, `session-handoff.md`, `sprint-contract.md`, `loop-state.md`, `clean-state-checklist.md`) | Estable (`Pass-State Gating` con `evidence >= 10` chars, cero `../`, `WIP <= 1` y DAG sin ciclos) | Ninguna | 2026-11-07 |
| **Auto-Memoria Persistente (`memory`)** | A | Pasa `bash scripts/check-architecture.sh` (Sección 3) | Alta (`memory/INDEX.md <= 200L / 25KB` + `memory/topics/harness-rules.md` alineados con autoconfiguración Camaleón Día 1 y `.venv`) | Estable (guardado en dos pasos y detector de huérfanos determinista) | Ninguna | 2026-11-07 |
| **Verificación, Seguridad y Observabilidad Dual (`verification`)** | A | Pasa las 3 Puertas (`100/100`), `0 CRLF`, candado anti-`pip` global, cobertura MCP/shell y trazas `.agents/.runtime/hook-audit.jsonl` | Alta (`.gitignore`, `.gitattributes`, `harness.config.json`, `scripts/lib/harness-guards.mjs`, `scripts/check-python.mjs`, `scripts/check-deliverables.mjs`, `evaluator-rubric.md`, `docs/SECURITY.md`, `docs/RELIABILITY.md`, `docs/GOTCHAS.md`) | Estable (`25/25` checks + vectores adversariales defendidos + rúbrica dual Código / `non-dev`) | Ninguna | 2026-11-07 |

---

## 2. Capas Arquitectónicas (`Types -> Config -> Repo -> Service -> Runtime -> UI`)

| Capa | Calificación (A-D) | Enforcement de Límites | Legibilidad para el Agente | Brechas Principales | Última Actualización |
| :--- | :--- | :--- | :--- | :--- | :--- |
| **Definiciones (`Types`)** | A | Vigilado mecánicamente por `scripts/check-architecture.sh` y `scripts/check-python.mjs` | Alta (`src/types/`, `scripts/feature-list.schema.json`, contrato `harness.config.json` y `GraphState`) | Ninguna | 2026-11-07 |
| **Ajustes (`Config`)** | A | Vigilado mecánicamente por `scripts/check-architecture.sh` (JSON estricto y `0 CRLF`) | Alta (`src/config/`, `harness.config.json`, `.gitignore`, `.gitattributes` y políticas `Fail-Closed`) | Ninguna | 2026-11-07 |
| **Datos / Archivos (`Repo`)** | A | Vigilado mecánicamente por `scripts/check-architecture.sh` y `scripts/check-python.mjs` | Alta (`src/repo/`, funciones I/O aisladas en `scripts/lib/harness-utils.mjs` y fuentes verificables en `non-dev`) | Ninguna | 2026-11-07 |
| **Lógica (`Service`)** | A | Vigilado mecánicamente (`sin process.exit` en `scripts/lib/*.mjs`) | Alta (`scripts/lib/harness-utils.mjs` y políticas puras `Fail-Closed` en `scripts/lib/harness-guards.mjs`) | Ninguna | 2026-11-07 |
| **Ejecución (`Runtime`)** | A | Orquesta 3 puertas aditivas (`set -euo pipefail`), `harness-hooks.mjs <= 280L` y trazas `hook-audit.jsonl` | Alta (`init.sh`, `scripts/check-architecture.sh`, `scripts/validate-harness.mjs`, `scripts/check-python.mjs`, `scripts/check-deliverables.mjs`, `scripts/harness-hooks.mjs`) | Ninguna | 2026-11-07 |
| **Salida / Interfaz (`UI`)** | A | Sin saltos a `Config`/`Repo` en Web (`.astro/.vue/.svelte`, `components`, `pages`, `app`), CLI y entregables `non-dev` | Alta (`src/ui/`, reportes Bolígrafo Rojo, protocolo Chrome DevTools y Puerta 3 Documental) | Ninguna | 2026-11-07 |

---

## 3. Instantáneas de Benchmark y Registro de Simplificación (Estudios de Ablación)

Las instantáneas de benchmark y los estudios de ablación operan como un único ciclo empírico: se toma una instantánea de línea base (`3.1`), se pone a prueba o simplifica un componente en aislamiento y se registra la evidencia y la decisión (`Mantener` o `Eliminar`) en la tabla de ablación (`3.2`), manteniendo sincronizada esta **Sección 3** con el protocolo de `docs/GOTCHAS.md`.

### 3.1 Instantáneas de Benchmark (`Benchmark Snapshots`)

Esta tabla compara empíricamente las variantes sucesivas del arnés sobre criterios objetivos verificables:

| Fecha | Variante del Harness | Tasa de Completitud | Reintentos | Defectos Antes de Revisión | Notas |
| :--- | :--- | :--- | :--- | :--- | :--- |
| 2026-11-03 | `baseline-day1` (`Plantilla-Maestra-Arnes` inicial) | `100%` en Puertas 1-3 (`25/25 PASS`) | `0` | `0` | Arnés base con hooks nativos `<= 280L`, Dos Marchas de Trabajo y candado `One-Shot Checker` |
| 2026-11-07 | `v2.0-universal-chameleon` (Arnés Camaleón Universal endurecido) | `100%` en Puertas 1-3 (`25/25 PASS`, `0 CRLF`, `12/12` vectores adversariales defendidos) | `0` | `0` | Autoconfiguración Día 1 (`harness.config.json`), Puerta 3 aditiva (`check-python.mjs` `.venv`/AST + `check-deliverables.mjs` `non-dev`), `brownfield` Ratchet, candado anti-`pip` global, protección MCP/shell, aislamiento de rúbrica y telemetría `.agents/.runtime/hook-audit.jsonl` |

### 3.2 Registro de Simplificación del Arnés (Estudios de Ablación)

> **Propósito**: Cada componente del arnés codifica un supuesto sobre lo que el modelo aún no garantiza por sí solo. Para verificar periódicamente si una restricción sigue aportando valor: (1) toma una instantánea de este documento (`3.1`), (2) desactiva temporalmente un único componente en un entorno aislado, (3) ejecuta el benchmark, (4) toma otra instantánea y (5) compara y registra aquí la decisión (`docs/GOTCHAS.md`).

| Fecha | Componente / Regla Puesta a Prueba | Comando / Experimento de Ablación Ejecutado | Resultado Empírico al Quitarlo / Violarlo | Decisión Final |
| :--- | :--- | :--- | :--- | :--- |
| 2026-10-28 | Vigilante de enlaces muertos en `AGENTS.md` (`scripts/check-architecture.sh`) | Prueba de referencia en `Required Artifacts` hacia ruta inexistente | Bloquea en Puerta 1 con Bolígrafo Rojo si se enlaza un archivo aún no creado (`degraded` sin el candado) | **Mantener** |
| 2026-10-28 | Detector de archivos huérfanos en `memory/topics/` (`Gotcha #15`) | Prueba de archivo en `memory/topics/` no registrado en `memory/INDEX.md` | Bloquea en Puerta 1 con `Exit code 1` evitando pérdida de memoria en dos pasos (`degraded` sin el candado) | **Mantener** |
| 2026-10-28 | Compuerta `Pass-State Gating` en `feature_list.json` (`scripts/lib/harness-utils.mjs`) | Prueba de tarea en `done` sin `evidence >= 10` chars o sin `required_files` físicos | Reduce el puntaje bajo `100/100` y rechaza cierres falsos o rutas `../` en Puerta 2 (`degraded` sin el candado) | **Mantener** |
| 2026-10-30 | Bloqueo de dependencias `blocked` en el DAG (`scripts/lib/harness-utils.mjs`) | Prueba aislada marcando una dependencia como `blocked` e iniciando la tarea hija | Impide saltar dependencias bloqueadas reduciendo `scope` bajo `5/5` (`degraded` sin el candado) | **Mantener** |
| 2026-11-07 | Ejecución obligatoria de Puerta 1 + Puerta 2 en `Stop` incluso con `git status --porcelain` vacío | Sandbox con violación de capas comiteada + `.tmp` y `.env.production` ignorados | Sin este control, `Stop` devolvía `stop` omitiendo `check-architecture.sh`; con el control devuelve `continue` con Bolígrafo Rojo | **Mantener** |
| 2026-11-07 | Cobertura MCP (`call_mcp_tool`), shell, candado anti-`pip` global y aislamiento de `evaluator-rubric.md` (`scripts/lib/harness-guards.mjs`) | Batería adversarial en `PreToolUse` (escritura `.env` vía MCP/shell, `pip install` global, edición Maker de rúbrica y `TypeName: "research"` en Checker) | Bloquea con `deny` las rutas de evasión sin falsos positivos en comandos legítimos ni en `.venv` local | **Mantener** |
| 2026-11-07 | Perfiles Camaleón (`harness.config.json`), Puerta 3 aditiva (`check-python.mjs` + `check-deliverables.mjs`) y `.gitattributes` (`0 CRLF`) | Pruebas en repos mixtos Node+Python, vistas `.astro/.vue/.svelte`, deuda `brownfield` y entregables `non-dev` con placeholders/enlaces rotos | Elimina falsos verdes en stacks modernos, protege entornos Python, audita entregables no-dev y garantiza `0 CRLF` al clonar en Windows | **Mantener** |
