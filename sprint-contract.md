# Sprint Contract (Contrato de Ejecución de Tarea)

Este documento materializa la **Observabilidad de Proceso (Antes de Codificar)**. El Planificador y el Ejecutor (*Maker*) acuerdan el alcance exacto y los criterios verificables de éxito antes de modificar el sistema, evitando desviaciones de alcance (*Scope Creep*) o interpretaciones ambiguas.

---

## Estado Actual del Contrato (`WIP = 1` — `feat-027` En Ejecución)
- **Última tarea completada (`done`):** `feat-026` (*Nuevo Layout de Proyectos (Título a la Izquierda, Mayor Distancia y Micro-interacción Hover con Borde Iluminado en Azul)*).
- **Tarea activa (`in-progress`):** `feat-027` (*Rediseño Unificado de Tarjetas de Proyectos: Scroll Fluido Natural, Fondo Blanco Delimitador, Título Superior Destacado y Foto Enlazada en Sistemas y Proyectos IA*).
- **Hoja de ruta secuencial declarada en el DAG (`feat-025 -> feat-026 -> feat-027`):**
  1. **`feat-025`** (`done`, verificada al 100/100): *Página de Inicio Limpia (Hero + Monitor + Footer), Vistas Independientes (`/sistemas`, `/habilidades-y-stack`) y Pie de Página Centrado*.
  2. **`feat-026`** (`done`, verificada al 100/100): *Nuevo Layout de Proyectos (Título a la Izquierda, Mayor Distancia y Micro-interacción Hover con Borde Iluminado en Azul)*.
  3. **`feat-027`** (`in-progress`, depende de `feat-026`): *Rediseño Unificado de Tarjetas de Proyectos: Scroll Fluido Natural, Fondo Blanco Delimitador, Título Superior Destacado y Foto Enlazada en Sistemas y Proyectos IA*.
- **Especificación maestra de referencia:** Solicitud del usuario con captura adjunta de mockup técnico, `feature_list.json` y `ARCHITECTURE.md`.

---

## Alcance Incluido (`Fair game`) para `feat-027`

### `feat-027`: Rediseño Unificado de Tarjetas de Proyectos y Enlace en Foto
1. **Eliminación del Comportamiento Split-Sticky y Desfase de Scroll**:
   - Eliminar `lg:sticky`, `lg:top-28` y la separación de scroll dividida entre título y tarjeta para que la navegación sea 100% continua y natural en toda la página.
2. **Diferenciación Clara entre Proyectos con Fondo Blanco y Título Superior Destacado**:
   - Cada proyecto se presenta como un bloque delimitado con fondo blanco (`bg-white border border-[#CBD5E1] p-6 sm:p-8 lg:p-10 rounded-[2px] shadow-sm`) o tarjeta blanca que lo separa con nitidez visual del fondo general `#F8F9FA`.
   - El título del proyecto se ubica en la parte superior izquierda de cada bloque, con tipografía display mayúscula, audaz y destacada (`<HeadingTag className="font-display text-2xl sm:text-3xl lg:text-[2.25rem] font-extrabold uppercase tracking-[-0.02em] text-[#0A0A0A] leading-tight">`).
3. **Estructura de Tarjeta Técnica de 2 Secciones (Horizontal en Desktop)**:
   - **Lado Izquierdo (Preview / Marco de Navegador - ~60%)**:
     - Barra superior estilo navegador con punto verde neón de estado en vivo y URL en mayúsculas (`WWW.DECOVINTAGE.ONLINE` o `system.liveUrl`).
     - **Foto Grande Cliqueable**: Envuelta en un enlace `<a>` con `href={system.liveUrl}`, `target="_blank"`, `rel="noopener noreferrer"`, `cursor-pointer`, hover suave con zoom y feedback visual para que al hacer clic dirija al sitio web en vivo igual que el botón primario.
   - **Lado Derecho (Panel de Especificaciones y Botones - ~40%)**:
     - Barra superior técnica con categoría/orden (`PROJECT {order} // {category}`) a la izquierda y badge de versión a la derecha con separador.
     - Resumen técnico legible (`system.summary`).
     - Chips de stack tecnológico con fondo blanco y borde fino (con el tag destacado acentuado en azul).
     - Caja de especificaciones de arquitectura y disponibilidad.
     - Botones de acción al pie: `PROBAR SISTEMA EN VIVO ↗` (negro sólido) y `{} ARQUITECTURA & REPO` (blanco con borde).
4. **Unificación Idéntica entre Secciones**:
   - La misma estructura de `ProjectPreviewCard` se aplica tanto en `/sistemas` (Sistemas en Producción) como en `/proyectos-ia` (Más Proyectos de IA).
5. **Sincronización de Pruebas y Certificación en 3 Puertas**:
   - Actualizar `tests/ai-projects-page.test.ts`, `tests/postgres-catalog-and-gallery.test.ts` y `tests/systems.service.test.ts` eliminando las aserciones de `lg:sticky` e incorporando las nuevas aserciones del layout continuo y enlace en la foto.
   - Superar `bash ./init.sh` al 100/100.

---

## Exclusiones Explícitas (Qué NO se va a tocar bajo ninguna circunstancia)
- **Prohibido alterar variables de entorno ni configuraciones de Docker/PostgreSQL**.
- **Prohibido romper las 6 capas** (`src/ui/` no importa de `src/repo/` ni `src/config/`).
- **Prohibido debilitar o relajar pruebas**.

## Estándares de Verificación ("Hecho" significa exactamente esto)
1. `WIP = 1` estrictamente con `feat-027` en `in-progress`.
2. `bash ./init.sh`, `bash scripts/check-architecture.sh` y `node scripts/validate-harness.mjs --min-score 100` devuelven código `0` y `Overall: 100/100` (`0 CRLF`, `0 UTF-8 BOM`).
3. Todas las suites de pruebas pasan al 100% (57+ tests).
