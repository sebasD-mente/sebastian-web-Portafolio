# Sprint Contract (Contrato de Ejecución de Tarea)

Este documento materializa la **Observabilidad de Proceso (Antes de Codificar)**. El Planificador y el Ejecutor (*Maker*) acuerdan el alcance exacto y los criterios verificables de éxito antes de modificar el sistema, evitando desviaciones de alcance (*Scope Creep*) o interpretaciones ambiguas.

---

## Estado Actual del Contrato (`WIP = 1` — `feat-025` En Ejecución)
- **Última tarea completada (`done`):** `feat-024` (*Rediseño Ergonómico del Monitor en Tiempo Real `serverdmente` (Modular Dashboard con Uptime, JetBrains Mono y Cero Ellipsis)*).
- **Tarea activa (`in-progress`):** `feat-025` (*Página de Inicio Limpia (Hero + Monitor + Footer), Vistas Independientes (`/sistemas`, `/habilidades-y-stack`) y Pie de Página Centrado*).
- **Hoja de ruta secuencial declarada en el DAG (`feat-024 -> feat-025 -> feat-026`):**
  1. **`feat-024`** (`done`, verificada al 100/100): *Rediseño Ergonómico del Monitor en Tiempo Real serverdmente*.
  2. **`feat-025`** (`in-progress`, depende de `feat-024`): *Página de Inicio Limpia (Hero + Monitor + Footer), Vistas Independientes (`/sistemas`, `/habilidades-y-stack`) y Pie de Página Centrado*.
  3. **`feat-026`** (`not-started`, depende de `feat-025`): *Nuevo Layout de Proyectos (Título a la Izquierda, Mayor Distancia y Micro-interacción Hover con Borde Iluminado en Azul)*.
- **Especificación maestra de referencia:** `docs/design-docs/serverdmente-monitor-redesign-plan.md` (Fase 2), `feature_list.json` y `ARCHITECTURE.md`.

---

## Alcance Incluido (`Fair game`) para `feat-025`

### `feat-025`: Desacople de Home, Vistas Dedicadas y Pie Centrado
1. **Página de Inicio Limpia (`src/app/page.tsx`)**:
   - Retirar de la vista principal `/` el catálogo empotrado `ProductionSystemsSection` y la sección de stack `TechStackSection`.
   - Conservar exclusivamente el `HeroSection` con el monitor en tiempo real de `serverdmente`, `AppShell` y `OfficialFooter`.
2. **Vista Independiente de Sistemas en Producción (`src/app/sistemas/page.tsx`)**:
   - Crear la ruta `/sistemas` que aloja de forma exclusiva `ProductionSystemsSection` con los sistemas en producción.
   - Configuración `dynamic = "force-dynamic"` y metadatos SEO limpios (`title: "Sistemas en Producción — Infraestructura & Software"`).
3. **Vista Independiente de Habilidades y Stack (`src/app/habilidades-y-stack/page.tsx`)**:
   - Crear la ruta `/habilidades-y-stack` que aloja `TechStackSection`.
   - Configuración `dynamic = "force-dynamic"` y metadatos SEO limpios (`title: "Habilidades y Stack Tecnológico — Arquitectura & Herramientas"`).
4. **Navegación Superior Modular (`src/ui/components/Navbar.tsx` & `src/config/site.config.ts`)**:
   - Crear el componente `Navbar.tsx` en `src/ui/components/` e integrarlo en `AppShell.tsx`.
   - Actualizar `SITE_NAVIGATION` en `src/config/site.config.ts`:
     - `01 // SISTEMAS EN PRODUCCIÓN` -> `href: "/sistemas"`.
     - `02 // HABILIDADES Y STACK TECNOLÓGICO` -> `href: "/habilidades-y-stack"`.
     - `03 // MÁS PROYECTOS DE IA` -> `href: "/proyectos-ia"`.
   - Actualizar `primaryCtaHref: "/sistemas"`.
5. **Pie de Página Institucional con Copyright Centrado (`src/ui/components/OfficialFooter.tsx` & `src/config/site.config.ts`)**:
   - Actualizar el copyright oficial a: `© 2026 · Creado por Sebastián Jiménez / Deko Labs`.
   - Retirar el texto técnico derecho (`footer.technicalNote`) en la franja inferior de `OfficialFooter.tsx`.
   - Centrar el texto de copyright y conservar el acceso discreto de engranaje de administrador (`data-admin-login-trigger="true"`).
6. **Sincronización de Suites de Prueba**:
   - Actualizar `tests/official-footer.test.ts`, `tests/site.service.test.ts`, `tests/ai-projects-page.test.ts` y `tests/harness-deprecation-dag.test.ts` para verificar la nueva arquitectura y cumplir con las 3 puertas de `init.sh` al 100/100.

---

## Exclusiones Explícitas (Qué NO se va a tocar bajo ninguna circunstancia)
- **Prohibido tocar o alterar variables de entorno de llaves, contraseñas, sesiones o base de datos** (`ADMIN_*`, `POSTGRES_*`, `DATABASE_URL`, `CATALOG_UPLOADS_DIR`, `HOMELAB_*`).
- **Prohibido modificar el alcance de `feat-026`** (el rediseño editorial split y efectos hover de las tarjetas de proyectos corresponden estrictamente a `feat-026`).
- **Prohibido alterar la jerarquía arquitectónica de 6 capas** (`src/ui/` y `src/app/` solo importan de `src/service/`, `src/runtime/`, `src/ui/` y `src/types/`).

## Estándares de Verificación ("Hecho" significa exactamente esto)
1. Ejecutar estrictamente una sola tarea a la vez (`WIP = 1`) con `feat-025` en `in-progress`.
2. `bash ./init.sh`, `bash scripts/check-architecture.sh` y `node scripts/validate-harness.mjs --min-score 100` devuelven código `0` y `Overall: 100/100` (`0 CRLF`, `0 UTF-8 BOM`).
3. Todas las suites de pruebas pasan al 100% (57+ tests).
