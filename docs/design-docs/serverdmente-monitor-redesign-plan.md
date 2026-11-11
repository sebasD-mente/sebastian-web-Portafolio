# Plan Maestro de Rediseño: Monitor serverdmente, Home Limpia, Vistas Independientes y UX de Proyectos

**Fecha:** 2026-11-11  
**Autor:** Sebastián Jiménez & Antigravity  
**Estado:** Declarado en el Arnés (`feat-024`, `feat-025`, `feat-026`) · Listo para Ejecución

---

## 1. Decisiones Acordadas y Diagnóstico

### 1.1 Monitor en Tiempo Real `serverdmente` (Propuesta A Seleccionada y Ajustada)
- **Selección:** Se adopta la **Propuesta A (Modular Dashboard)** con tipografía `JetBrains Mono` (12.5px) y cifras tabulares (`tnum`).
- **Ajuste solicitado por Sebastián:**
  - Se retiran definitivamente los badges de `● pgvector:pg17 ONLINE` y `🔒 Tailscale WireGuard`.
  - En su lugar, se integra prominentemente el **tiempo de funcionamiento continuo del servidor** (`⏱ TIEMPO ACTIVO (UPTIME): 9d 15h 34m (231.6h continuo)`).
- **Resultado:** Cero textos cortados con `...`, barras de progreso integradas en sus métricas (sin redundancia), legible a distancia normal de monitor.
- **Captura generada:** `propuesta_a_modular.png`.

### 1.2 Página de Inicio Limpia (Home Minimalista)
- **Composición de `/`:** Queda exclusivamente compuesta por:
  1. El **Hero Editorial** de Sebastián.
  2. El **Monitor en Tiempo Real** (`HOME-LAB // serverdmente`).
  3. El **Pie de Página Oficial** (`OfficialFooter`).
- **Retiro de secciones de la Home:** Se eliminan de `src/app/page.tsx` el catálogo empotrado (`ProductionSystemsSection`) y la sección de stack (`TechStackSection`).

### 1.3 Nuevas Páginas y Navegación Independiente
- **Sistemas en Producción (`/sistemas`):**
  - Se crea la ruta `src/app/sistemas/page.tsx` como vista dedicada e independiente del catálogo de sistemas.
  - El botón `01 // SISTEMAS EN PRODUCCIÓN` de la barra superior apunta a `/sistemas`.
- **Habilidades y Stack Tecnológico (`/habilidades-y-stack`):**
  - Se crea la ruta `src/app/habilidades-y-stack/page.tsx`.
  - El botón `02` de la barra superior se actualiza tanto en título como en enlace a: `HABILIDADES Y STACK TECNOLÓGICO` (`href="/habilidades-y-stack"`).
- **Más Proyectos de IA (`/proyectos-ia`):**
  - Se mantiene como ruta dedicada (`03 // MÁS PROYECTOS DE IA`).

### 1.4 Rediseño del Pie de Página (Copyright Centrado)
- En `src/ui/components/OfficialFooter.tsx`, se retira el texto técnico del lado derecho (`footer.technicalNote`).
- La franja inferior muestra únicamente la fecha y la atribución centrada:
  ```
  © 2026 Creado por Sebastián Jiménez / Deko Labs
  ```
- Se conserva de forma discreta el botón de engranaje de acceso de administrador (`data-admin-login-trigger="true"`).

### 1.5 Nuevo Layout de Tarjetas de Proyectos y Separación Visual
- **Problema previo:** En la lista de proyectos, las tarjetas estaban muy juntas y sin diferenciación clara, dando la sensación de ser un único bloque monolítico continuo.
- **Solución implementada:**
  - **Mayor separación vertical:** Aumento sustancial del espaciado entre proyectos (`space-y-16 lg:space-y-24`) con sutiles divisores de ritmo visual.
  - **Título extraído a la izquierda (Layout Split Editorial):**
    - Columna izquierda (`lg:col-span-4` o sticky): Número de orden (`PROYECTO 01 // SISTEMAS EN PRODUCCIÓN`), Título grande en `Space Grotesk` (`DECO VINTAGE ARQUITECTURA`), subtítulo y badge de versión.
    - Columna derecha (`lg:col-span-8`): Tarjeta interactiva con vista previa de navegador, descripción, stack pills y botones de acción.
    - Al hacer scroll, la columna izquierda anuncia claramente la transición a un proyecto nuevo.
- **Captura generada:** `propuesta_proyectos_layout.png`.

### 1.6 Micro-interacciones y Efectos Hover
- Para dar dinamismo visual al sitio sin perder sobriedad:
  - Al pasar el cursor (hover) por las tarjetas de los proyectos: leve elevación (`hover:-translate-y-0.5`), sombreado suave (`hover:shadow-[0_12px_30px_-8px_rgba(37,99,235,0.18)]`) y la línea exterior del marco se ilumina con el azul característico de la barra de navegación (`#2563EB`).
  - Botones y enlaces con transiciones fluidas (`transition-all duration-300`).

---

## 2. Tareas Declaradas en el Arnés (`feature_list.json`)

| ID | Nombre | Área | Prioridad | Dependencias | Estado |
| :--- | :--- | :--- | :--- | :--- | :--- |
| **`feat-024`** | Rediseño Ergonómico del Monitor en Tiempo Real `serverdmente` (Modular con Uptime, JetBrains Mono y Cero Ellipsis) | `hero-live-telemetry` | P0 | `feat-023` | `not-started` |
| **`feat-025`** | Página de Inicio Limpia (Hero + Monitor + Footer), Vistas Independientes (`/sistemas`, `/habilidades-y-stack`) y Pie Centrado | `site-navigation-and-clean-home` | P1 | `feat-024` | `not-started` |
| **`feat-026`** | Nuevo Layout de Proyectos (Título a la Izquierda, Mayor Distancia y Micro-interacción Hover con Borde Iluminado en Azul) | `projects-showcase-ux-redesign` | P1 | `feat-025` | `not-started` |

---

## 3. Hoja de Ruta de Ejecución Secuencial

### Fase 1: `feat-024` (Monitor serverdmente)
1. Modificar `src/ui/components/HeroSection.tsx`:
   - Reemplazar estructura de filas apretadas por los 4 micro-bloques de la Propuesta A.
   - Usar `JetBrains Mono` a 12.5px con `tnum` y mayúsculas/minúsculas naturales.
   - Retirar badges de `pgvector` y `tailscale`, integrando el Uptime en la parte inferior.
2. Actualizar `tests/telemetry-and-contact.test.ts` asegurando que las aserciones validen el nuevo marcado.
3. Ejecutar `bash ./init.sh` y certificar la puerta de salida.

### Fase 2: `feat-025` (Home Limpia, Vistas Independientes y Footer)
1. Crear `src/app/sistemas/page.tsx` con `ProductionSystemsSection`.
2. Crear `src/app/habilidades-y-stack/page.tsx` con `TechStackSection`.
3. Actualizar `SITE_NAVIGATION` en `src/config/site.config.ts` (`HABILIDADES Y STACK TECNOLÓGICO`).
4. Limpiar `src/app/page.tsx` dejando únicamente `<HeroSection />`.
5. Modificar `src/ui/components/OfficialFooter.tsx` centrando el copyright y retirando la nota técnica derecha.
6. Alinear tests en `tests/official-footer.test.ts`, `tests/site.service.test.ts` y `tests/telemetry-and-contact.test.ts`.

### Fase 3: `feat-026` (Layout de Proyectos y Efecto Hover)
1. Modificar `src/ui/components/ProductionSystemsSection.tsx` y `src/ui/components/AiProjectsCatalogView.tsx`:
   - Implementar el layout split de 2 columnas (Título a la izquierda + Tarjeta a la derecha).
   - Aplicar `space-y-16 lg:space-y-24`.
   - Incorporar efecto hover con borde iluminado en `#2563EB` y sombreado suave.
2. Actualizar tests en `tests/postgres-catalog-and-gallery.test.ts`, `tests/ai-projects-page.test.ts` y `tests/systems.service.test.ts`.
3. Verificación final de suite completa con `bash ./init.sh` al 100/100.
