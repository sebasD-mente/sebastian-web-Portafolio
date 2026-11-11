# Sprint Contract (Contrato de Ejecución de Tarea)

Este documento materializa la **Observabilidad de Proceso (Antes de Codificar)**. El Planificador y el Ejecutor (*Maker*) acuerdan el alcance exacto y los criterios verificables de éxito antes de modificar el sistema, evitando desviaciones de alcance (*Scope Creep*) o interpretaciones ambiguas.

---

## Estado Actual del Contrato (`WIP = 1` — `feat-026` En Ejecución)
- **Última tarea completada (`done`):** `feat-025` (*Página de Inicio Limpia (Hero + Monitor + Footer), Vistas Independientes (`/sistemas`, `/habilidades-y-stack`) y Pie de Página Centrado*).
- **Tarea activa (`in-progress`):** `feat-026` (*Nuevo Layout de Proyectos (Título a la Izquierda, Mayor Distancia y Micro-interacción Hover con Borde Iluminado en Azul)*).
- **Hoja de ruta secuencial declarada en el DAG (`feat-024 -> feat-025 -> feat-026`):**
  1. **`feat-024`** (`done`, verificada al 100/100): *Rediseño Ergonómico del Monitor en Tiempo Real serverdmente*.
  2. **`feat-025`** (`done`, verificada al 100/100): *Página de Inicio Limpia (Hero + Monitor + Footer), Vistas Independientes (`/sistemas`, `/habilidades-y-stack`) y Pie de Página Centrado*.
  3. **`feat-026`** (`in-progress`, depende de `feat-025`): *Nuevo Layout de Proyectos (Título a la Izquierda, Mayor Distancia y Micro-interacción Hover con Borde Iluminado en Azul)*.
- **Especificación maestra de referencia:** `docs/design-docs/serverdmente-monitor-redesign-plan.md` (Fase 3), `feature_list.json` y `ARCHITECTURE.md`.

---

## Alcance Incluido (`Fair game`) para `feat-026`

### `feat-026`: Nuevo Layout de Proyectos y Micro-interacción Hover
1. **Reestructuración en Layout Split Editorial de 2 Columnas (`src/ui/components/ProductionSystemsSection.tsx` & `ProjectPreviewCard`)**:
   - Rediseñar `ProjectPreviewCard` como un layout split de 2 columnas (`grid grid-cols-1 lg:grid-cols-12 gap-8 lg:gap-12 items-start`).
   - **Columna izquierda (`col-span-12 lg:col-span-4 lg:sticky lg:top-28 self-start space-y-4`)**:
     - Número de orden y categoría (`headerCategory` en `mono-pixel text-[11px] sm:text-[12px] text-[#2563EB] font-bold`).
     - Título prominente del proyecto (`<HeadingTag className="font-display text-2xl sm:text-3xl lg:text-[2.25rem] font-extrabold uppercase tracking-[-0.02em] text-[#0A0A0A] leading-[1.08]">`).
     - Badge de versión (`versionBadge`) e indicador de estado.
     - Subtítulo narrativo del sistema si está definido (`system.subtitle`).
   - **Columna derecha (`col-span-12 lg:col-span-8`)**:
     - Tarjeta interactiva técnica completa que aloja el marco de ventana de navegador con punto verde, screenshot en proporción adecuada, panel técnico de resumen, pills de stack tecnológico (con destacado azul), especificaciones de arquitectura/disponibilidad y botones de acción directos (`PROBAR SISTEMA EN VIVO ↗` y `{}` `ARQUITECTURA & REPO`).
2. **Mayor Separación Vertical y Divisores de Ritmo Visual**:
   - Aumentar el espaciado entre proyectos a `space-y-16 lg:space-y-24` tanto en `ProductionSystemsSection.tsx` como en `AiProjectsCatalogView.tsx`.
   - Incluir divisores sutiles (`border-t border-[#CBD5E1]` / `border-[#E5E7EB]`) entre tarjetas consecutivas para marcar la cadencia visual.
3. **Micro-interacciones Hover y Bordes Iluminados en Azul (`#2563EB`)**:
   - Aplicar a la tarjeta de la derecha clases de elevación y luz perimetral: `transition-all duration-300 hover:-translate-y-0.5 hover:border-[#2563EB] hover:shadow-[0_12px_30px_-8px_rgba(37,99,235,0.18)]`.
   - Transiciones fluidas en los botones de acción (`transition-all duration-300 hover:shadow-md`).
4. **Sincronización y Ampliación de Suites de Prueba**:
   - Actualizar `tests/postgres-catalog-and-gallery.test.ts`, `tests/ai-projects-page.test.ts` y `tests/systems.service.test.ts` para verificar la presencia de la estructura split, la separación vertical y los tokens de hover.
   - Superar las 3 puertas de `bash ./init.sh` al 100/100.

---

## Exclusiones Explícitas (Qué NO se va a tocar bajo ninguna circunstancia)
- **Prohibido alterar variables de entorno de llaves, contraseñas, sesiones o base de datos** (`ADMIN_*`, `POSTGRES_*`, `DATABASE_URL`, `CATALOG_UPLOADS_DIR`, `HOMELAB_*`).
- **Prohibido romper las 6 capas** (`src/ui/` solo importa de `src/types/` y componentes UI; no importa de `src/repo/` ni `src/config/`).
- **Prohibido eliminar o debilitar pruebas existentes en `tests/`**.

## Estándares de Verificación ("Hecho" significa exactamente esto)
1. Ejecutar estrictamente una sola tarea a la vez (`WIP = 1`) con `feat-026` en `in-progress`.
2. `bash ./init.sh`, `bash scripts/check-architecture.sh` y `node scripts/validate-harness.mjs --min-score 100` devuelven código `0` y `Overall: 100/100` (`0 CRLF`, `0 UTF-8 BOM`).
3. Todas las suites de pruebas pasan al 100% (57+ tests).
