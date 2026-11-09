# Sprint Contract (Contrato de Ejecución de Tarea)

Este documento materializa la **Observabilidad de Proceso (Antes de Codificar)**. El Planificador y el Ejecutor (*Maker*) acuerdan el alcance exacto y los criterios verificables de éxito antes de modificar el sistema, evitando desviaciones de alcance (*Scope Creep*) o interpretaciones ambiguas.

---

## Estado Actual del Contrato (`WIP = 0` — `feat-001` a `feat-007` Completadas y Verificadas en `done`)
- **Última tarea completada (`done`):** `feat-007` (*Refinamiento Visual v2.2: Des-saturación de Vista Principal, Header Fijo con Logo Personal, Hero IA/ADK/RAG y Tarjeta Deco Vintage Platform*).
- **Tarea activa (`in-progress`):** Ninguna (`WIP = 0`; las 7 tareas `feat-001`..`feat-007` están en `"done"`).
- **Siguiente tarea secuencial lista para iniciar:** Ninguna pendiente en `feature_list.json` (lista para agregar el Proyecto 02 o conectar el monitor en tiempo real cuando Sebastián lo indique).
- **Especificación maestra de referencia:** `docs/product-specs/dekolabs-portfolio-spec.md` (Sección 5), `docs/design-docs/homelab-deployment.md`, `docs/RELIABILITY.md`, `docs/SECURITY.md` y `ARCHITECTURE.md`.
- **Captura de referencia visual aprobada por Sebastián:** `C:\Users\sebas\Pictures\Screenshots\Captura de pantalla 2026-11-08 181423.png`.

## Justificación de Dependencias en `package.json` (Regla Dura #4 de `ARCHITECTURE.md`)
- **Runtime (`dependencies`)**:
  - `next` (`^15.2.0`), `react` (`^19.0.0`), `react-dom` (`^19.0.0`): Framework principal acordado con Sebastián para App Router, SSR/SSG, Route Handlers (`/api/health`, `/api/telemetry`, `/api/contact`), generación de rutas SEO (`robots.txt`, `sitemap.xml`) y empaquetado `output: 'standalone'` ultraligero en contenedor Docker (`node:22-alpine`) dentro del Ubuntu Linux Home Lab.
- **Desarrollo y Verificación (`devDependencies`)**:
  - `typescript`, `@types/node`, `@types/react`, `@types/react-dom`: Tipado estático estricto para validar contratos entre las 6 capas (`npm run typecheck`).
  - `tailwindcss`, `@tailwindcss/postcss`, `postcss`: Motor de estilos utility-first sin runtime JS para materializar los tokens del sistema de diseño *Atelier Monolith* (Modo Claro por defecto + Modo Oscuro).
  - `vitest`: Runner de pruebas unitarias rápido y determinista para validar las capas `Service`, `Runtime` y la configuración de despliegue/SEO dentro del presupuesto de tiempo del hook `Stop`.

## Alcance Incluido (`Fair game`) para `feat-007`
1. **Activos Gráficos Oficiales (`public/assets/`)**:
   - Copiar `C:\Users\sebas\Documents\Antigravity Files\ARCHIVOS PORTAFOLIO\lOGO SEBASTIAN J.png` hacia `public/assets/logo-sebastian-j.png`.
   - Copiar `C:\Users\sebas\Documents\Antigravity Files\ARCHIVOS PORTAFOLIO\TARJETA PRO 1.png` hacia `public/assets/deco-vintage-preview.png`.
2. **Tipografía Similar a la Captura (`src/app/layout.tsx` y `src/app/globals.css`)**:
   - Cargar en `src/app/layout.tsx` y configurar en `src/app/globals.css`:
     - `Space Grotesk` (`600`, `700`) + `Inter` (`400`, `500`, `600`, `700`, `800`) para el titular Hero, títulos en mayúsculas (`SISTEMAS EN PRODUCCIÓN`, `DECO VINTAGE PLATFORM`) y cuerpo editorial.
     - `JetBrains Mono` / `Space Mono` (`400`, `500`, `600`) para los botones del Header, pills de stack y botones de acción.
     - `Silkscreen` / `Share Tech Mono` (combinada con `JetBrains Mono` en clase `.mono-pixel` / `.mono-label`) para las etiquetas del monitor de telemetría (`KERNEL & HOME LAB TELEMETRY`, `NODE ID`, `HOST OS`, `P99 LATENCY...`) y el encabezado de tarjeta (`PROJECT 01 // ...`, `v3.4.0 PRODUCTION`).
3. **Barra Superior Fija al Hacer Scroll (`src/ui/components/AppShell.tsx` y `src/config/site.config.ts`)**:
   - Eliminar de la vista la `Ambient Telemetry Strip` superior, el monograma `SB // DL`, el badge `AVAILABLE FOR FREELANCE` y el conmutador `THEME // LIGHT`.
   - Dejar el Header fijo al hacer scroll (`sticky top-0 z-50 w-full bg-[#F8F9FA]/95 backdrop-blur-md border-b border-[#E5E7EB]`):
     - **Izquierda**: Logo `/assets/logo-sebastian-j.png` (`Sebastian J — AI Developer & Agentic Builder`).
     - **Centro**: Únicamente los 3 botones/enlaces de navegación con los textos exactos de la captura:
       1. `SISTEMAS EN PRODUCCIÓN` (`href="#proyectos-destacados"`)
       2. `STACK TECNOLOGICO` (`href="#stack-tecnologico"`)
       3. `MAS PROYECTOS DE IA` (`href="#mas-proyectos-ia"`)
     - **Derecha**: Únicamente el botón sólido negro (`#0A0A0A`) con texto blanco en mayúsculas:
       - `CONTRATAR / HABLEMOS` (`href="#contacto"`)
   - Incluir la franja horizontal gris suave (`bg-[#EAECEF]`) separando el Header del Hero y el Hero de `SISTEMAS EN PRODUCCIÓN`.
4. **Sección Hero Des-saturada (`src/ui/components/HeroSection.tsx` y `src/config/site.config.ts`)**:
   - **Columna Izquierda (`lg:col-span-8`)**:
     - Eliminar pills superiores, cajas `INVARIANT // VERIFIED` y botones CTA inferiores.
     - **Título `h1` exacto**: `"Construyo aplicaciones con IA implícita, agentes autónomos con Google ADK y sistemas RAG listos para producción."`
     - **Subtítulo `p` exacto**: `"Construyo software apoyado en un entorno profesional de agentes de código gobernados por un arnés de ingeniería de alto estándar. Combino desarrollo de agentes inteligentes, pruebas de modelos locales en aplicaciones no exploradas y administración de mi propio Home Lab"`
   - **Columna Derecha (`lg:col-span-4`)**:
     - Monitor `KERNEL & HOME LAB TELEMETRY` como único lugar con mocks de prueba temporalmente, envuelto en un marco exterior blanco (`bg-white border border-[#9CA3AF]/70 p-3`) y panel interior gris claro (`bg-[#F3F4F6] border border-[#D1D5DB] p-4`) con las métricas y sparkline SVG fieles a la captura.
5. **Limpieza de Saturación en Vista Principal (`src/app/page.tsx`)**:
   - Renderizar en `src/app/page.tsx` únicamente `AppShell`, `HeroSection` y `ProductionSystemsSection` (dejando de montar `BenchmarksStrip`, `AgenticOrchestrationSection`, `TechStackMatrix`, `LiveTerminalSection` y `ContactAdvisorySection` en la portada, pero manteniendo sus archivos en `src/ui/components/` para preservar `required_files` de tareas anteriores).
6. **Sección `SISTEMAS EN PRODUCCIÓN` y Tarjeta `DECO VINTAGE PLATFORM` (`src/ui/components/ProductionSystemsSection.tsx`, `src/repo/systems.repo.ts`, `src/service/systems.service.ts`, `src/types/portfolio.ts`)**:
   - **Encabezado de Sección**: Únicamente el título `SISTEMAS EN PRODUCCIÓN` en mayúsculas bold (sin subtítulos ni filtros).
   - **Exhibición en Home**: Mostrar en la sección de portada la tarjeta de `DECO VINTAGE PLATFORM` (`slug: "deco-vintage-platform"`) con diseño de 12 columnas (`7 cols` ventana de imagen izquierda con barra superior y punto verde + `/assets/deco-vintage-preview.png`; `5 cols` panel derecho en `#EAECEF` / `#F3F4F6` impecablemente equilibrado):
     - **Header izquierdo (Categoría)**: `PROJECT 01 // E-COMMERCE & CLOUD MEDIA ENGINE` (en azul `#2563EB`)
     - **Badge derecho (Versión)**: `v3.4.0 PRODUCTION` (en badge gris `#D5D9DF`)
     - **Título**: `DECO VINTAGE PLATFORM`
     - **Descripción**: `"Plataforma e-commerce full-stack e infraestructura multimedia sin estado para comercialización y cotización dinámica de cuadros decorativos (+540 obras). Diseñada con procesamiento de imágenes en memoria mediante semáforos de concurrencia libvips, persistencia relacional con paginación por cursores, motor autoritativo de cotizaciones a medida e inyección SSR dinámica para indexación social en tiempo real."`
     - **Tags de Stack Tecnológico (Pills)**:
       - `NODE.JS + EXPRESS 5`
       - `REACT 18 + VITE`
       - `POSTGRESQL + PRISMA 6`
       - `SHARP (LIBVIPS RAM)`
       - `GOOGLE CLOUD STORAGE` *(Pill destacado en azul)*
       - `ZOD + ZERO-TRUST`
     - **Recuadro de Métricas / Arquitectura**:
       - `ARQUITECTURA: Stateless Cloud-Native / Zero Split-Brain`
       - `DISPONIBILIDAD: 99.9% SLA Activo (VPS Docker + GCS CDN)`
     - **Botones**:
       - `PROBAR SISTEMA EN VIVO ↗` → `https://www.decovintage.online`
       - `{} ARQUITECTURA & REPO` → `/sistemas/deco-vintage-platform` (Blueprint detallado).
7. **Sincronización de Suite de Pruebas (`tests/*.test.ts`)**:
   - Actualizar `tests/site.service.test.ts`, `tests/systems.service.test.ts`, `tests/system-detail.test.ts` y `tests/deployment-config.test.ts` para reflejar los nuevos textos del Hero/Navegación y el proyecto `01` (`deco-vintage-platform`) manteniendo las 6 suites en verde (`24/24 PASS`).

## Exclusiones Explícitas (Qué NO se va a tocar bajo ninguna circunstancia)
- **Prohibido borrar del disco** cualquier archivo listado en `required_files` de `feat-001` a `feat-006` (ej. `src/ui/components/BenchmarksStrip.tsx`, `src/ui/components/AgenticOrchestrationSection.tsx`, `src/ui/components/TechStackMatrix.tsx`, `src/ui/components/LiveTerminalSection.tsx`, `src/ui/components/ContactAdvisorySection.tsx`), ya que `validate-harness.mjs` verifica su existencia física en disco para las tareas en `"done"`. Solo deben dejar de renderizarse en `src/app/page.tsx`.
- Prohibido que cualquier archivo en `src/app/` o `src/ui/` importe directamente desde `src/config/` o `src/repo/` (Regla Dura #2: `No Layer Skipping`).
- Prohibido debilitar, comentar o relajar validaciones en `init.sh`, `scripts/validate-harness.mjs`, `scripts/lib/harness-utils.mjs`, `scripts/check-architecture.sh` o `scripts/harness-hooks.mjs`.
- Prohibido que el agente Constructor (*Maker*) rellene `evaluator-rubric.md` o reutilice vía `send_message` un sub-agente *Checker* previo (`1 Checker = 1 sola auditoría / one-shot`).

## Estándares de Verificación ("Hecho" significa exactamente esto)
1. Todos los 16 archivos declarados en `required_files` de `feat-007` existen físicamente en disco y están actualizados (`0 CRLF` y `0 UTF-8 BOM` en todo el repositorio).
2. `bash ./init.sh`, `bash scripts/check-architecture.sh` y `node scripts/validate-harness.mjs --min-score 100` devuelven código `0` y `Overall: 100/100` ejecutando `typecheck`, `lint`, `test` y `build`.
3. `feat-007` pasa a estado `"done"` con evidencia verificable (`>= 10` caracteres) y el árbol queda limpio (`clean-state`).
