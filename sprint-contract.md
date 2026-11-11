# Sprint Contract (Contrato de Ejecución de Tarea)

Este documento materializa la **Observabilidad de Proceso (Antes de Codificar)**. El Planificador y el Ejecutor (*Maker*) acuerdan el alcance exacto y los criterios verificables de éxito antes de modificar el sistema, evitando desviaciones de alcance (*Scope Creep*) o interpretaciones ambiguas.

---

## Estado Actual del Contrato (`WIP = 1` — `feat-024` En Ejecución)
- **Última tarea completada (`done`):** `feat-023` (*Fuente Única de Verdad para Redes Sociales en `src/config/site.config.ts` (Sin Variables `NEXT_PUBLIC_SOCIAL_*` en `.env`) y Perfil Oficial de LinkedIn (`sebastian-jimenez-aibuilder`)*).
- **Tarea activa (`in-progress`):** `feat-024` (*Rediseño Ergonómico del Monitor en Tiempo Real serverdmente (Modular Dashboard con Uptime, JetBrains Mono y Cero Ellipsis)*).
- **Hoja de ruta secuencial declarada en el DAG (`feat-024 -> feat-025 -> feat-026`):**
  1. **`feat-024`** (`in-progress`, depende de `feat-023`): *Rediseño Ergonómico del Monitor en Tiempo Real serverdmente (Modular Dashboard con Uptime, JetBrains Mono y Cero Ellipsis)*.
  2. **`feat-025`** (`not-started`, depende de `feat-024`): *Página de Inicio Limpia (Hero + Monitor + Footer), Vistas Independientes (`/sistemas`, `/habilidades-y-stack`) y Pie de Página Centrado*.
  3. **`feat-026`** (`not-started`, depende de `feat-025`): *Nuevo Layout de Proyectos (Título a la Izquierda, Mayor Distancia y Micro-interacción Hover con Borde Iluminado en Azul)*.
- **Especificación maestra de referencia:** `docs/design-docs/serverdmente-monitor-redesign-plan.md` (Fase 1), `ARCHITECTURE.md` y `preview_a.html`.

---

## Alcance Incluido (`Fair game`) para `feat-024`

### `feat-024`: Rediseño Ergonómico del Monitor en Tiempo Real `serverdmente`
1. **Tipografía y Estilo Base (`src/ui/components/HeroSection.tsx`)**:
   - Migrar de la antigua tipografía `Share Tech Mono` (`mono-pixel`) a `JetBrains Mono` (`font-mono-tech`, cifras tabulares `tnum`, 12-13px).
   - Eliminar clases destructivas de `uppercase` forzado y `truncate` con puntos suspensivos (`...`).
   - Contenedor con borde `#cbd5e1`, hover `#2563eb`, `rounded-[10px]`, padding `p-4 sm:p-[18px]` y sombra sutil `shadow-[0_4px_14px_rgba(0,0,0,0.05)]`.
2. **Encabezado y 4 Micro-Bloques Temáticos (Propuesta A)**:
   - **Header**: Título `NODE TELEMETRY` (subtítulo) y `HOME-LAB // serverdmente` (título principal con minúsculas naturales en `serverdmente`) + badge `ONLINE · 5S` / `ONLINE · LIVE 5S` con punto verde pulsante.
   - **Bloque 1 (Host OS & Hardware)**: `HOST OS & KERNEL`, modelo de CPU, versión de distribución (`Ubuntu 24.04/26.04 LTS · Linux ...`), Carga CPU en 1m/5m y estado `ÓPTIMO`.
   - **Bloque 2 (Temperaturas & Disipación)**: `TEMPERATURA & DISIPACIÓN`, sensores CPU y NVMe con barra integrada `progressbar` con `aria-label`, `aria-valuenow`, `aria-valuemin=0` y `aria-valuemax=100`.
   - **Bloque 3 (RAM & Next.js Cgroup en 2 columnas)**: Grid de 2 columnas para `HOST RAM` y `CGROUP NEXT.JS` con valores en GiB/MiB y sus barras de progreso individuales.
   - **Bloque 4 (Almacenamiento NVMe + Uptime Continuo)**: `ALMACENAMIENTO NVMe` con porcentaje y barra integrada, y en la base de la tarjeta la sección de Uptime (`⏱ TIEMPO ACTIVO (UPTIME): ...`) en reemplazo de los badges de red `pgvector` y `tailscale`.
3. **Pruebas y Accesibilidad (`tests/telemetry-and-contact.test.ts`)**:
   - Actualizar las aserciones sobre `HeroSection` y `HomePage` para validar los 4 micro-bloques temáticos, barras de progreso accesibles (`role="progressbar"`), Uptime y verificar la ausencia de textos cortados con `...` o clases `truncate`.
   - Mantener intactas las pruebas de kernel, API de telemetría y contacto.

---

## Exclusiones Explícitas (Qué NO se va a tocar bajo ninguna circunstancia)
- **Prohibido tocar o alterar variables de entorno de llaves, contraseñas, sesiones o base de datos** (`ADMIN_*`, `POSTGRES_*`, `DATABASE_URL`, `CATALOG_UPLOADS_DIR`, `HOMELAB_*`).
- **Prohibido modificar el alcance de `feat-025` y `feat-026`** (creación de `/sistemas`, `/habilidades-y-stack` y layout split de proyectos corresponden a sus respectivas tareas del DAG).
- **Prohibido alterar la estructura del repositorio ni romper las 6 capas** (`src/ui/` no importa de `src/repo/` ni `src/config/`).

## Estándares de Verificación ("Hecho" significa exactamente esto)
1. Ejecutar estrictamente una sola tarea a la vez (`WIP = 1`) con `feat-024` en `in-progress`.
2. `bash ./init.sh`, `bash scripts/check-architecture.sh` y `node scripts/validate-harness.mjs --min-score 100` devuelven código `0` y `Overall: 100/100` (`0 CRLF`, `0 UTF-8 BOM`).
3. La suite de pruebas de telemetría y la suite global (`vitest run`) pasan al 100% (57+ tests).
