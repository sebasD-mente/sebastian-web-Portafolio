# Sprint Contract (Contrato de Ejecución de Tarea)

Este documento materializa la **Observabilidad de Proceso (Antes de Codificar)**. El Planificador y el Ejecutor (*Maker*) acuerdan el alcance exacto y los criterios verificables de éxito antes de modificar el sistema, evitando desviaciones de alcance (*Scope Creep*) o interpretaciones ambiguas.

---

## Estado Actual del Contrato (`WIP = 0` — `feat-005` Completada; `feat-006` Lista para Iniciar)
- **Última tarea completada (`done`):** `feat-005` (*Telemetría Ubuntu Home Lab (`/api/telemetry`), Terminal Interactiva en Vivo y Canal de Contratación*).
- **Tarea activa (`in-progress`):** Ninguna (`WIP = 0`).
- **Siguiente tarea secuencial lista para iniciar:** `feat-006` (*Empaquetado Docker Multi-Stage para Ubuntu Home Lab, SEO dekolabs.org y Guía de Despliegue*).
- **Especificación maestra de referencia:** `docs/product-specs/dekolabs-portfolio-spec.md`, `docs/RELIABILITY.md` y `ARCHITECTURE.md` (Basadas en el prototipo Google Stitch `projects/10491405022475068698`).

## Justificación de Dependencias en `package.json` (Regla Dura #4 de `ARCHITECTURE.md`)
- **Runtime (`dependencies`)**:
  - `next` (`^15.2.0`), `react` (`^19.0.0`), `react-dom` (`^19.0.0`): Framework principal acordado con Sebastián para App Router, SSR/SSG, Route Handlers (`/api/health`, `/api/telemetry`, `/api/contact`) y empaquetado `output: 'standalone'` ultraligero en contenedor Docker (`node:22-alpine`) dentro del Ubuntu Linux Home Lab.
- **Desarrollo y Verificación (`devDependencies`)**:
  - `typescript`, `@types/node`, `@types/react`, `@types/react-dom`: Tipado estático estricto para validar contratos entre las 6 capas (`npm run typecheck`).
  - `tailwindcss`, `@tailwindcss/postcss`, `postcss`: Motor de estilos utility-first sin runtime JS para materializar los tokens del sistema de diseño *Atelier Monolith* (Modo Claro por defecto + Modo Oscuro).
  - `vitest`: Runner de pruebas unitarias rápido y determinista para validar las capas `Service` y `Runtime` dentro del presupuesto de tiempo del hook `Stop`.

## Alcance Incluido (`Fair game`) para `feat-005`
- Extender `src/types/portfolio.ts` con los contratos de dominio para Telemetría del Ubuntu Home Lab, Terminal Interactiva en Vivo y Canal de Contratación Comercial (`HomeLabContainerStatus`, `HomeLabRuntimeMetrics`, `TerminalCommandPreset`, `HomeLabTelemetrySnapshot`, `HomeLabHealthReport`, `HomeLabTelemetryProvider`, `EngagementModalityId`, `EngagementModalityOption`, `ContactInquiryInput`, `ContactFieldErrors`, `ContactValidationResult`, `ContactSubmissionReceipt`).
- Implementar `src/repo/telemetry.repo.ts` bajo `Capability Seams` leyendo métricas reales del proceso/contenedor Node.js (`process.uptime()`, `process.memoryUsage()`, `process.version`, `os.platform()`, `os.release()`, `os.arch()`, `os.loadavg()`) combinadas con metadatos deterministas del nodo Ubuntu Home Lab (`HOME-LAB: UBUNTU-NODE-01`, contenedores activos, comandos de diagnóstico TTY y estado de puertas del arnés).
- Implementar `src/service/telemetry.service.ts` exponiendo casos de uso puros (`getHomeLabTelemetrySnapshot`, `getHomeLabHealthReport`, `executeTerminalCommand`) para agregar telemetría, evaluar SLOs de memoria/latencia y responder comandos de la terminal interactiva (`status`, `containers`, `gates`, `network`, `help`).
- Implementar `src/service/contact.service.ts` exponiendo validación determinista y sanitización de consultas comerciales (`getEngagementModalities`, `validateContactInquiry`, `createContactSubmissionReceipt`) con reglas estrictas de nombre, email corporativo/personal, modalidad de contratación, resumen técnico de proyecto y protección honeypot anti-spam.
- Implementar `src/runtime/telemetry.handler.ts` y `src/runtime/contact.handler.ts` emitiendo logs estructurados `RuntimeLogEntry` con `correlationId` y `redactSecrets` (`src/runtime/logger.ts`) y cabeceras `x-correlation-id` + `Cache-Control: no-store`.
- Implementar los endpoints de Next.js App Router `src/app/api/health/route.ts`, `src/app/api/telemetry/route.ts` y `src/app/api/contact/route.ts` delegando exclusivamente en `src/runtime/` sin importar directamente de `src/repo/` ni `src/config/`.
- Implementar `src/ui/components/LiveTerminalSection.tsx` (enlazado a `#telemetria-homelab`) con stream TTY interactivo, botones de comandos de diagnóstico en vivo, refresco manual contra `/api/telemetry` y anuncios accesibles (`aria-live="polite"`).
- Implementar `src/ui/components/ContactAdvisorySection.tsx` (enlazado a `#contacto`) con selector accesible de modalidades de colaboración (`<fieldset>` + `<legend>` + `<input type="radio">` para 4 opciones exclusivas), hints encima de los inputs (`aria-describedby`), validación diferida tras interacción (`:user-invalid` + sincronización de `aria-invalid` en `blur`/`input`/`submit`), indicadores de error no basados solo en color y envío a `/api/contact`.
- Integrar `LiveTerminalSection` y `ContactAdvisorySection` en `src/app/page.tsx` reemplazando los placeholders de anclaje por las secciones completas.
- Implementar `tests/telemetry-and-contact.test.ts` probando los servicios de telemetría y contacto, los manejadores HTTP de `src/runtime/` (`handleHealthGet`, `handleTelemetryGet`, `handleContactPost`) y las rutas `/api/health`, `/api/telemetry` y `/api/contact`.

## Exclusiones Explícitas (Qué NO se va a tocar bajo ninguna circunstancia)
- Prohibido crear o modificar en `feat-005` los artefactos de contenedorización y SEO de `feat-006` (`Dockerfile`, `docker-compose.yml`, `.dockerignore`, `.env.example`, `src/app/robots.ts`, `src/app/sitemap.ts`, `docs/design-docs/homelab-deployment.md`).
- Prohibido que cualquier archivo en `src/app/` o `src/ui/` (incluyendo `src/app/api/**/route.ts`) importe directamente desde `src/config/` o `src/repo/` (Regla Dura #2: `No Layer Skipping`).
- Prohibido debilitar, comentar o relajar validaciones en `init.sh`, `scripts/validate-harness.mjs`, `scripts/lib/harness-utils.mjs`, `scripts/check-architecture.sh` o `scripts/harness-hooks.mjs`.
- Prohibido que el agente Constructor (*Maker*) rellene `evaluator-rubric.md` o reutilice vía `send_message` un sub-agente *Checker* previo (`1 Checker = 1 sola auditoría / one-shot`).

## Estándares de Verificación ("Hecho" significa exactamente esto)
1. Todos los 11 archivos declarados en `required_files` de `feat-005` existen físicamente en disco y no están vacíos (`0 CRLF` y `0 UTF-8 BOM` en todo el repositorio).
2. `bash ./init.sh`, `bash scripts/check-architecture.sh` y `node scripts/validate-harness.mjs --min-score 100` devuelven código `0` y `Overall: 100/100` ejecutando `typecheck`, `lint`, `test` y `build`.
3. En **Modo Crítico / Loop (`/goal`)** o cierres de hito, una instancia *Checker* `one-shot` completamente nueva (`zero-inheritance`) audita la entrega en `evaluator-rubric.md` con puntuación `>= 11/12` (`ACEPTAR`).
