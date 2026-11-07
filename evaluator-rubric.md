# Evaluator Rubric (Rúbrica de Evaluación Independiente — Solo para Agente Checker Aislado)

> REGLA DE AISLAMIENTO (`zero-inheritance` + `one-shot`): Prohibido editar o rellenar esta rúbrica en la misma sesión de chat que implementó los cambios (*Maker*, bloqueado mecánicamente en `PreToolUse`) o reutilizar vía `send_message` a un Evaluador previo.
> Esta evaluación debe ser ejecutada exclusivamente por un Agente Evaluador (*Checker*) efímero de un solo uso (`one-shot`) en una ventana de contexto limpia (`zero-inheritance`) o por un revisor humano.

## Protocolo de Aislamiento Físico del Checker (`Zero-Inheritance` y `One-Shot`)

1. **Ventana de Contexto Nueva y Aislada (`Zero-Inheritance`)**: La evaluación debe ejecutarse en una sesión independiente o mediante un Sub-agente Evaluador aislado que **NO herede el historial conversacional ni el razonamiento interno del Maker**.
2. **Entradas Objetivas Únicamente**: El Evaluador solo inspecciona la configuración y contratos (`harness.config.json`, `sprint-contract.md`, `feature_list.json`), los archivos reales en disco / diferencias (`git status`, `git diff`), la ejecución real en vivo de `bash ./init.sh` (más `node scripts/check-python.mjs` o `node scripts/check-deliverables.mjs` según el perfil) y esta rúbrica.
3. **Postura Escéptica y Regla Dura de Calibración**:
   - *"Tu trabajo es encontrar fallos con evidencia; aprobar un código con pruebas huecas o un documento con relleno superficial es tu fracaso."*
   - **Regla Dura de Calibración en Verificación**: Dar **0 puntos** en la Dimensión 2 (`Verificación`) si el Evaluador no ejecutó `bash ./init.sh` en su propia sesión aislada y pegó la salida exacta verificada.
4. **Instancia Efímera de Un Solo Uso (`One-Shot / one-shot`) — Prohibida la Re-Auditoría en la Misma Sesión**:
   - **Un Checker = Una Sola Auditoría (`one-shot` / *Stateless per Pass*)**: Queda explícitamente anulada para el rol Evaluador cualquier regla genérica de continuar sub-agentes existentes. Cada auditoría inicial o re-auditoría tras corregir un hallazgo **DEBE** invocar una instancia completamente nueva (`invoke_subagent` `one-shot` con ventana virgen); el *Maker* tiene estrictamente prohibido enviar `send_message` al `conversationId` de un Evaluador ya utilizado.
   - **Prohibido ofrecer re-auditoría y orden imperativa de rechazo ante `send_message`**: El Evaluador tiene prohibido despedirse ofreciendo *"envíame un mensaje cuando lo corrijas para re-auditar"* y debe cerrar su dictamen recordando que cualquier re-auditoría exige una **nueva instancia `one-shot` desde cero**. Si recibe un `send_message` pidiendo re-evaluar cambios o volver a calificar esta rúbrica en la misma sesión, tiene **orden imperativa de rechazar la solicitud sin calificar** respondiendo con Bolígrafo Rojo (`ERROR` / `POR QUÉ` / `SOLUCIÓN (FIX)`) que exija lanzar un `invoke_subagent` nuevo (`one-shot`).

---

## Protocolo de Calibración Dual (Código Políglota/Brownfield y Entregables `non-dev`)

De fábrica, los modelos tienden a ser jueces indulgentes: aprueban pruebas unitarias tautológicas (`expect(true).toBe(true)`) en tareas de código o prosa genérica sin fuentes verificables en tareas de no-desarrollo (`non-dev`). Para alinear el Agente *Checker* con el estándar humano real, aplica este rigor dual durante **3 a 5 rondas de calibración**:

1. **Identificar el Perfil Camaleón (`harness.config.json`)**:
   - **En Desarrollo (`auto`, `greenfield`, `brownfield`)**: Exigir pruebas reales que fallen si se rompe la lógica, aislamiento `.venv` y AST limpio en Python (`scripts/check-python.mjs`), respeto de las 6 capas en Web/Node/Python/Políglota y cero incremento sobre `maxLegacyLayerViolations` en `brownfield`.
   - **En No-Desarrollo (`non-dev`)**: Exigir paso en verde de `node scripts/check-deliverables.mjs`, exactitud factual comprobable, trazabilidad explícita de fuentes/datos, ausencia absoluta de `[PENDIENTE]`/`TODO`/`TBD`/relleno verboso sin sustancia, integridad de enlaces/imágenes y utilidad real frente al objetivo humano.
2. **Comparar contra juicio humano (`0-2` por dimensión)**: Contrastar punto por punto dónde el *Checker* fue permisivo o arbitrario frente a la revisión humana.
3. **Endurecer criterios ambiguos**: Convertir cualquier brecha repetida en umbral explícito de esta rúbrica o en regla mecánica dentro de `scripts/check-architecture.sh`, `scripts/check-python.mjs` o `scripts/check-deliverables.mjs`.
4. **Re-ejecutar en limpio (`one-shot`) y registrar**: Verificar la alineación en una instancia nueva y dejar trazabilidad en la tabla siguiente.

### Registro de Calibración del Evaluador (`Calibration Log`)

| Ronda | Tarea / Hito Evaluado | Puntuación Checker vs. Humano | Divergencia Detectada | Ajuste Aplicado a la Rúbrica / Verificador |
| :--- | :--- | :--- | :--- | :--- |
| **0 (Baseline v2.0)** | Inicialización Camaleón Universal Día 1 | `N/A` (pendiente primera auditoría del proyecto) | Ninguna | Protocolo `One-Shot`, `Zero-Inheritance`, bloqueo `PreToolUse` de auto-edición Maker y criterios duales (`Código` + `non-dev`) activos desde Día 1 |

---

## Tabla de Calificación Objetiva (0 a 12 Puntos) — Pendiente Primera Auditoría `One-Shot`

| Dimensión | Pregunta de Control Dual (`Código Políglota / Brownfield` vs. `Entregables non-dev`) | Puntuación (0, 1 o 2) | Evidencia / Notas |
| :--- | :--- | :---: | :--- |
| **1. Corrección y Sustancia** | **Código:** ¿Cumple al 100% el comportamiento de `sprint-contract.md` sin mocks falsos? **Non-Dev:** ¿Responde al objetivo humano con exactitud factual, profundidad analítica y fuentes verificables sin relleno superficial? (0=No/Alucinación, 1=Parcial, 2=Completo) | **-** | Pendiente de ejecución por sub-agente Checker `one-shot` aislado |
| **2. Verificación Ejecutable** | ¿Pasaron en vivo `bash ./init.sh` y los validadores del perfil (`check-python.mjs` en Python, tests no tautológicos en código, `check-deliverables.mjs` con cero enlaces/imágenes rotas en `non-dev`) ejecutados por el propio Checker? *(Regla dura: 0 si no ejecutó `init.sh`)* | **-** | Pendiente de ejecución por sub-agente Checker `one-shot` aislado |
| **3. Disciplina de Alcance** | ¿El cambio se mantuvo estrictamente dentro de `sprint-contract.md` y `WIP = 1`, sin tocar archivos `Hands off`, sin contaminar el entorno global (`pip` fuera de `.venv`) ni inflar documentos fuera de alcance (`Anti-Doc Bloat`)? | **-** | Pendiente de ejecución por sub-agente Checker `one-shot` aislado |
| **4. Fiabilidad e Integridad** | **Código:** ¿Maneja casos borde, rutas `Fail-Closed`, errores estructurados y limpieza de temporales? **Non-Dev:** ¿Hay cero `[PENDIENTE]`/`TODO`/`TBD`, cifras consistentes entre tablas/secciones y afirmaciones respaldadas por evidencia trazable? | **-** | Pendiente de ejecución por sub-agente Checker `one-shot` aislado |
| **5. Mantenibilidad y Estructura** | **Código:** ¿Respeta las 6 capas de `ARCHITECTURE.md` (Web/Python/`layerMap`), el trinquete `maxLegacyLayerViolations` y `0 CRLF`? **Non-Dev:** ¿Presenta jerarquía clara, escaneable, cero enlaces muertos, `0 CRLF` y formato accionable? | **-** | Pendiente de ejecución por sub-agente Checker `one-shot` aislado |
| **6. Preparación de Entrega** | ¿Están sincronizados `harness.config.json`, `feature_list.json` (`evidence >= 10` chars y `required_files` reales), `progress.md`, `loop-state.md` (si aplica) y `session-handoff.md` en `clean-state`? | **-** | Pendiente de ejecución por sub-agente Checker `one-shot` aislado |

**Puntuación Total:** `Pendiente / 12`

## Veredicto Final del Checker Independiente
- [ ] **ACEPTAR** (Puntuación 11-12 y ninguna dimensión en 0)
- [ ] **REVISAR / DEVOLVER AL GENERADOR** (Puntuación 7-10 o falta evidencia ejecutable / trazabilidad documental)
- [ ] **BLOQUEAR** (Puntuación <= 6, rompió la línea base, introdujo pruebas/citas falsas o dejó placeholders)

## Seguimiento y Correcciones Exigidas (Con formato ERROR / POR QUÉ / SOLUCIÓN)

Ninguna (plantilla limpia lista para la primera auditoría `one-shot` en contexto aislado `zero-inheritance`).
