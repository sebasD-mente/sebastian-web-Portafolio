# Tema de Memoria: Reglas de Producción del Arnés Camaleón Universal y Entorno Local

- **Tipo Taxonómico**: `feedback` / `project` / `user`
- **Última Actualización**: 2026-11-07
- **Propósito**: Registrar preferencias operativas del usuario, convenciones de interacción natural y criterios de entorno que NO se deducen leyendo código de aplicación (cumpliendo el Gotcha #4).

---

## 1. Preferencias del Usuario y Autoconfiguración Camaleón Día 1 (`user` / `feedback`)

- **Interacción 100% Natural (`Agent-Owned Harness`)**: El usuario conversa siempre en lenguaje natural (ideas de producto, dudas de negocio, objetivos de investigación o solicitudes sobre un repositorio existente) sin tener que editar configuraciones técnicas ni listas JSON. El agente traduce de forma autónoma los acuerdos hacia `harness.config.json`, `feature_list.json`, `sprint-contract.md`, `progress.md` y `session-handoff.md`.
- **Autodetección Silenciosa de los 3 Escenarios el Día 1**: Sin pedirle soporte técnico al usuario, el agente inspecciona el workspace y el objetivo humano al arrancar para configurar el perfil adecuado (`auto`/`greenfield` para código nuevo o políglota, `brownfield` mapeando carpetas reales y fijando el trinquete de violaciones heredadas para no dar falsos verdes ni bloquear el inicio, o `non-dev` para investigación, estrategia y documentación verificada sin placeholders).
- **Cero Salto de Tareas (`Strict Sequential DAG` y `WIP = 1`)**: Cada tarea se ejecuta una por una respetando dependencias en `done` y sin crear documentos vacíos o prematuros (`Anti-Doc Bloat`).
- **Dos Marchas y Escalamiento Limpio**: Operar en **Modo Diario Ágil** por defecto y reservar el bucle `Maker-Checker` (`one-shot` virgen) para cierres de hito, arquitectura o `/goal`. Cuando haya que consultar una duda al usuario, usar `ask_question` dentro del turno (o dejar el árbol pasando `init.sh` con la tarea en `"status": "blocked"`) para no chocar con la compuerta `Stop`.

## 2. Ejecución Multiplataforma, Higiene `0 CRLF` y Aislamiento Python (`project` / `feedback`)

- **Punto de Entrada Único POSIX (`init.sh`)**: Se mantiene un solo punto de entrada POSIX para evitar *Split-Brain* entre sistemas operativos:
  - **Linux / macOS**: `bash ./init.sh`
  - **Windows PowerShell (vía Git Bash)**: `& "C:\Program Files\Git\bin\bash.exe" ./init.sh`
- **Higiene `LF` (`0 CRLF`) y `.venv` Local Obligatorio**: En Windows se preservan finales de línea `LF` puros para no corromper scripts POSIX, y en proyectos con Python jamás se ejecuta `pip install` en el intérprete global del sistema: todo paquete vive exclusivamente dentro del entorno virtual local `.venv` del proyecto.

## 3. Reglas Operativas de Memoria Persistente (`project` / `reference`)

- **Separación Memoria de Instrucción vs. Auto-Memoria**:
  - **Memoria de Instrucción (`AGENTS.md`, `docs/`)**: Versionada en Git; define las invariantes del sistema.
  - **Auto-Memoria (`memory/INDEX.md` + `memory/topics/*.md`)**: Escrita por el agente para retener preferencias, aprendizajes y contexto no derivable del repositorio.
- **Invariante de Guardado en Dos Pasos (`Two-Step Save Invariant` — Gotcha #1 y #15)**:
  1. **Paso 1**: Escribir o actualizar primero el archivo detallado en `memory/topics/<tema>.md`.
  2. **Paso 2**: Añadir o actualizar únicamente **una línea de gancho (`<= 120` caracteres)** en `memory/INDEX.md` apuntando al archivo de `memory/topics/`.
- **Orden de Prioridad de Instrucciones (Gotcha #2)**:
  - La regla más local siempre gana:
    `Organización` -> `Usuario Global` -> `Proyecto (AGENTS.md)` -> `Subdirectorio (AGENTS.md)` -> `Local Override (AGENTS.local.md / CLAUDE.local.md)`.
