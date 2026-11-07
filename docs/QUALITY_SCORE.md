# QUALITY_SCORE.md (Mapa de Salud, Estabilidad y Evolución del Sistema)

Este documento proporciona **Observabilidad de Proceso a Largo Plazo**. Mientras `evaluator-rubric.md` responde *"¿Hizo buen trabajo el agente en esta sesión?"*, `docs/QUALITY_SCORE.md` responde *"¿El repositorio se está fortaleciendo o debilitando con el tiempo?"*, permitiendo que cualquier sesión nueva identifique de inmediato qué dominios o capas son sólidos (`A`) y cuáles requieren atención prioritaria (`C` o `D`).

**Cadencia de Actualización:**
- Después de cada sesión o entrega significativa.
- Antes y después de ejecutar comparaciones de benchmark o estudios de ablación.
- Después de pases de limpieza estructural o simplificación del arnés.
- Al incorporar un nuevo agente, herramienta o modelo base al flujo de trabajo.

**Escala de Calificación:**
- **A**: Toda la verificación pasando, límites arquitectónicos impuestos mecánicamente, legible para el agente y tests estables.
- **B**: Funcionando correctamente con brechas menores de cobertura, legibilidad o documentación.
- **C**: Parcialmente funcional, difícil de entender para el agente o con inestabilidad notable en tests (*flaky*).
- **D**: Roto, inseguro o estructuralmente confuso (prioridad máxima de reparación antes de expandir alcance).

---

## 1. Dominios del Proyecto / Flujo de Trabajo

| Dominio / Área | Calificación (A-D) | Verificación | Legibilidad para el Agente | Estabilidad de Tests | Brechas Principales | Última Actualización |
| :--- | :--- | :--- | :--- | :--- | :--- | :--- |
| **Aplicación / Producto (`app`)** | B | Puerta 3 multi-stack lista en `init.sh` (pendiente primer módulo en `src/`) | Alta (`ARCHITECTURE.md`, 6 capas y `Capability Seams` definidos) | N/A (sin suite de aplicación aún; arnés base estable) | Inicializar primer dominio de negocio cuando arranque un producto | 2026-10-30 |
| **Gobernanza, Instrucciones y Grafos (`instructions`)** | A | Pasa `bash ./init.sh` (`5/5`) y `scripts/check-architecture.sh` | Alta (`AGENTS.md` conciso en `100L`, `ARCHITECTURE.md`, `goal.md`, `maker-prompt.md`, `checker-prompt.md`, `SKILL.md`, `graph.md`) | Estable (`100%` determinista, `0` fallos intermitentes) | Ninguna | 2026-10-30 |
| **Estado, Alcance y Ciclo de Vida (`state`, `scope`, `lifecycle`)** | A | Pasa `node scripts/validate-harness.mjs --min-score 100` (`15/15`) y esquema JSON | Alta (`feature_list.json`, `scripts/feature-list.schema.json`, `progress.md`, `session-handoff.md`, `sprint-contract.md`, `loop-state.md`, `clean-state-checklist.md`) | Estable (`Pass-State Gating`, `WIP <= 1` y DAG con detección estática DFS de ciclos) | Ninguna | 2026-10-30 |
| **Auto-Memoria Persistente (`memory`)** | A | Pasa `bash scripts/check-architecture.sh` (Sección 3) | Alta (`memory/INDEX.md <= 200L / 25KB` + `memory/topics/harness-rules.md` alineados en 5 niveles y nota multiplataforma) | Estable (guardado en dos pasos y detector de huérfanos determinista) | Ninguna | 2026-10-30 |
| **Verificación, Seguridad y Observabilidad Dual (`verification`)** | A | Pasa las 3 Puertas (`100/100`), `cleanup-scanner`, Bolígrafo Rojo y hooks nativos en vivo (`< 15 ms` en `PostToolUse`) | Alta (`.gitignore`, `docs/RELIABILITY.md`, `docs/SECURITY.md`, `.agents/hooks.json`, `scripts/harness-hooks.mjs`, `evaluator-rubric.md`, `docs/QUALITY_SCORE.md`, `docs/GOTCHAS.md`) | Estable (`25/25` checks + `274` aserciones en memoria en `43 ms` + `4` smoke tests CLI `PASS`) | Ninguna | 2026-10-30 |

---

## 2. Capas Arquitectónicas (`Types -> Config -> Repo -> Service -> Runtime -> UI`)

| Capa | Calificación (A-D) | Enforcement de Límites | Legibilidad para el Agente | Brechas Principales | Última Actualización |
| :--- | :--- | :--- | :--- | :--- | :--- |
| **Definiciones (`Types`)** | A | Vigilado mecánicamente por `scripts/check-architecture.sh` | Alta (`src/types/`, `scripts/feature-list.schema.json` y `GraphState` con *Reducers*) | Ninguna | 2026-10-30 |
| **Ajustes (`Config`)** | A | Vigilado mecánicamente por `scripts/check-architecture.sh` | Alta (`src/config/`, `.gitignore`, políticas `Fail-Closed` y *feature flags*) | Ninguna | 2026-10-30 |
| **Datos / Archivos (`Repo`)** | A | Vigilado mecánicamente por `scripts/check-architecture.sh` | Alta (`src/repo/`, funciones I/O aisladas y `Service Providers`) | Ninguna | 2026-10-30 |
| **Lógica (`Service`)** | A | Vigilado mecánicamente por `scripts/check-architecture.sh` (`sin process.exit`) | Alta (`src/service/` y validadores puros en `scripts/lib/harness-utils.mjs`) | Ninguna | 2026-10-30 |
| **Ejecución (`Runtime`)** | A | Orquesta las 3 puertas con `set -euo pipefail`, hooks nativos `<= 280L` y *Bootstrap* en 4 etapas | Alta (`src/runtime/`, `init.sh`, `scripts/check-architecture.sh`, `scripts/validate-harness.mjs`, `scripts/harness-hooks.mjs`) | Ninguna | 2026-10-30 |
| **Salida / Interfaz (`UI`)** | A | Sin saltos directos a `Config`/`Repo` (`UI -> Types` permitido) + protocolo 5 estados y Chrome DevTools | Alta (`src/ui/`, reportes CLI/HTML y bucle `ANTES/DESPUÉS` en `docs/RELIABILITY.md`) | Ninguna | 2026-10-30 |

---

## 3. Instantáneas de Benchmark y Registro de Simplificación (Estudios de Ablación)

Las instantáneas de benchmark y los estudios de ablación operan como un único ciclo empírico: se toma una instantánea de línea base (`3.1`), se pone a prueba o simplifica un componente en aislamiento y se registra la evidencia y la decisión (`Mantener` o `Eliminar`) en la tabla de ablación (`3.2`), manteniendo sincronizada esta **Sección 3** con el protocolo de `docs/GOTCHAS.md`.

### 3.1 Instantáneas de Benchmark (`Benchmark Snapshots`)

Esta tabla compara empíricamente las variantes sucesivas del arnés sobre el mismo conjunto de criterios objetivos para medir si los cambios aumentan la tasa de completitud y reducen reintentos y defectos escapados:

| Fecha | Variante del Harness | Tasa de Completitud | Reintentos | Defectos Antes de Revisión | Notas |
| :--- | :--- | :--- | :--- | :--- | :--- |
| 2026-11-03 | `baseline-day1` (`Plantilla-Maestra-Arnes` recertificada) | `100%` en Puertas 1-3 (`25/25 PASS`) | `0` | `0` | Arnés base inicializado con hooks nativos `<= 280L` (`PostToolUse < 1 ms`), Dos Marchas de Trabajo y candado `One-Shot Checker` |
| 2026-11-07 | `hardened-day1-audit` (`sebastian-web-portafolio` endurecido tras auditoría adversarial) | `100%` en Puertas 1-3 (`25/25 PASS` + `12/12` vectores adversariales defendidos + `27/27` matriz funcional) | `0` | `0` | Cerradas 10 brechas adversariales (`ADV-01..08`, `ADV-10..12`): protección MCP, `.gitattributes` `0 CRLF`, Puerta 1 en `Stop`, soporte `.astro/.vue/.svelte/src/components` y paridad total de esquema |

### 3.2 Registro de Simplificación del Arnés (Estudios de Ablación)

> **Propósito**: Cada componente del arnés codifica un supuesto sobre lo que el modelo aún no garantiza por sí solo. Para verificar periódicamente si una restricción sigue aportando valor: (1) toma una instantánea de este documento (`3.1`), (2) desactiva temporalmente un único componente en un entorno aislado, (3) ejecuta el benchmark, (4) toma otra instantánea y (5) compara y registra aquí la decisión (`docs/GOTCHAS.md`).

| Fecha | Componente / Regla Puesta a Prueba | Comando / Experimento de Ablación Ejecutado | Resultado Empírico al Quitarlo / Violarlo | Decisión Final |
| :--- | :--- | :--- | :--- | :--- |
| 2026-10-28 | Vigilante de enlaces muertos en `AGENTS.md` (`scripts/check-architecture.sh`) | Prueba de referencia en `Required Artifacts` hacia ruta inexistente | Bloquea en Puerta 1 con Bolígrafo Rojo si se enlaza un archivo aún no creado (`degraded` sin el candado) | **Mantener** |
| 2026-10-28 | Detector de archivos huérfanos en `memory/topics/` (`Gotcha #15`) | Prueba de archivo en `memory/topics/` no registrado en `memory/INDEX.md` | Bloquea en Puerta 1 con `Exit code 1` evitando pérdida de memoria en dos pasos (`degraded` sin el candado) | **Mantener** |
| 2026-10-28 | Compuerta `Pass-State Gating` en `feature_list.json` (`scripts/lib/harness-utils.mjs`) | Prueba de tarea en `done` sin `evidence` o sin `required_files` físicos | Reduce el puntaje por debajo de `100/100` y rechaza el cierre falso en Puerta 2 (`degraded` sin el candado) | **Mantener** |
| 2026-10-30 | Bloqueo de dependencias `blocked` en el DAG (`scripts/lib/harness-utils.mjs`) | Prueba aislada marcando una dependencia como `blocked` e iniciando la tarea hija | Impide saltar dependencias bloqueadas reduciendo `scope` bajo `5/5` (`degraded` sin el candado) | **Mantener** |
| 2026-11-07 | Ejecución de Puerta 1 en `Stop` incluso con `git status --porcelain` vacío (`ADV-07`) | Sandbox con violación `types -> ui` comiteada + `.tmp` y `.env.production` ignorados | Sin este control, `Stop` devolvía `stop` omitiendo `check-architecture.sh`; con el control devuelve `continue` con Bolígrafo Rojo (`12/12 defended`) | **Mantener** |
| 2026-11-07 | Cobertura MCP (`call_mcp_tool`), `.env*`, shell y aislamiento de `evaluator-rubric.md` (`ADV-01..06`) | Batería adversarial de 6 vectores de evasión en `PreToolUse` | Cierra escrituras a `.env` por MCP/shell, aliases PowerShell/`cmd`, auto-edición de rúbrica por Maker y bypass `TypeName: "research"` en Candado 3 | **Mantener** |
| 2026-11-07 | Escáner de 6 capas para stacks web (`.astro/.vue/.svelte`, `src/components/`, `app/`) y `.gitattributes` (`ADV-08`, `ADV-10`) | Sandbox con componentes web saltando a `src/repo` + `git clone` fresco en Windows con `core.autocrlf=true` | Elimina falsos verdes en proyectos frontend modernos y garantiza `0 CRLF` al clonar en Windows | **Mantener** |
