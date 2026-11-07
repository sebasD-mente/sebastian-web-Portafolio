# Sprint Contract (Contrato de Ejecución de Tarea)

Este documento materializa la **Observabilidad de Proceso (Antes de Codificar)**. El Planificador y el Ejecutor (*Maker*) acuerdan el alcance exacto y los criterios verificables de éxito antes de modificar el sistema, evitando desviaciones de alcance (*Scope Creep*) o interpretaciones ambiguas.

---

## Estado Actual del Contrato (`WIP = 0` — `feat-001` Pendiente de Iniciar)
- **Tarea activa (`in-progress`):** Ninguna (`WIP = 0`).
- **Siguiente tarea secuencial:** `feat-001` (*Inicializar línea base y primer módulo del proyecto*).

## Alcance Incluido (`Fair game`)
- Listar aquí los archivos o módulos exactos que se crearán o modificarán antes de codificar la tarea activa.

## Exclusiones Explícitas (Qué NO se va a tocar bajo ninguna circunstancia)
- Prohibido modificar módulos fuera del alcance de la tarea activa (`WIP = 1`).
- Prohibido debilitar, comentar o relajar validaciones en `init.sh`, `scripts/validate-harness.mjs`, `scripts/lib/harness-utils.mjs`, `scripts/check-architecture.sh` o `scripts/harness-hooks.mjs`.
- Prohibido que el agente Constructor (*Maker*) rellene `evaluator-rubric.md` o reutilice vía `send_message` un sub-agente *Checker* previo (`1 Checker = 1 sola auditoría / one-shot`).

## Estándares de Verificación ("Hecho" significa exactamente esto)
1. Todos los archivos declarados en `required_files` de la tarea activa existen físicamente en disco y no están vacíos (`0 CRLF` en scripts/artefactos del arnés).
2. `bash ./init.sh`, `bash scripts/check-architecture.sh` y `node scripts/validate-harness.mjs --min-score 100` devuelven código `0` y `Overall: 100/100`.
3. En **Modo Crítico / Loop (`/goal`)** o cierres de hito, una instancia *Checker* `one-shot` completamente nueva (`zero-inheritance`) audita la entrega en `evaluator-rubric.md` con puntuación `>= 11/12` (`ACEPTAR`).
