# Sprint Contract (Contrato de Ejecución de Tarea)

Este documento materializa la **Observabilidad de Proceso (Antes de Codificar)**. El Planificador y el Ejecutor (*Maker*) acuerdan el alcance exacto y los criterios verificables de éxito antes de modificar el sistema, evitando desviaciones de alcance (*Scope Creep*) o interpretaciones ambiguas.

---

## Estado Actual del Contrato (`WIP = 0` — Tarea `feat-009` Planificada y Lista para Iniciar)
- **Última tarea completada (`done`):** `feat-008` (*Evolución de Raíz del Arnés: Event-Sourced DAG Deprecation con `deprecated_files` y Purga Física de Componentes Zombi*).
- **Tarea activa (`in-progress`):** Ninguna (`WIP = 0` al momento de la declaración; la sesión ejecutora debe cambiar `feat-009` a `"status": "in-progress"` antes de editar código).
- **Siguiente tarea secuencial lista para iniciar:** `feat-009` (*Sistema Administrable de Catálogo sobre PostgreSQL (RAG-Ready), Clasificación Dual y Galería de 3 Imágenes en Detalle*).
- **Especificación maestra de referencia:** `docs/product-specs/dekolabs-portfolio-spec.md` (Sección 7), `docs/design-docs/homelab-deployment.md`, `docs/RELIABILITY.md`, `docs/SECURITY.md` y `ARCHITECTURE.md`.

## Justificación de Dependencias en `package.json` (Regla Dura #4 de `ARCHITECTURE.md`)
- **Runtime (`dependencies`)**:
  - `next` (`^15.2.0`), `react` (`^19.0.0`), `react-dom` (`^19.0.0`): Framework principal acordado con Sebastián para App Router, SSR/SSG, Route Handlers (`/api/health`, `/api/telemetry`, `/api/contact`, `/api/admin/systems`, `/api/admin/upload`, `/api/assets/[filename]`), generación de rutas SEO (`robots.txt`, `sitemap.xml`) y empaquetado `output: 'standalone'` ultraligero en contenedor Docker (`node:22-alpine`) dentro del Ubuntu Linux Home Lab.
  - `pg` (`^8.13.0`): Driver oficial de PostgreSQL (`node-postgres`) para conectar la capa `Repo` (`src/repo/postgres-catalog.repo.ts`) mediante pool de conexiones y transacciones ACID (`BEGIN`/`COMMIT`/`ROLLBACK`) hacia el contenedor `dekolabs-db` (`pgvector/pgvector:pg17`) en el Ubuntu Linux Home Lab, dejando el esquema preparado con `rag_knowledge_document` para la futura fase de Agente RAG en vivo.
- **Desarrollo y Verificación (`devDependencies`)**:
  - `typescript`, `@types/node`, `@types/react`, `@types/react-dom`, `@types/pg`: Tipado estático estricto para validar contratos entre las 6 capas (`npm run typecheck`).
  - `tailwindcss`, `@tailwindcss/postcss`, `postcss`: Motor de estilos utility-first sin runtime JS para materializar los tokens del sistema de diseño *Atelier Monolith* (Modo Claro por defecto + Modo Oscuro).
  - `vitest`: Runner de pruebas unitarias rápido y determinista para validar las capas `Service`, `Runtime` y la configuración de despliegue/SEO dentro del presupuesto de tiempo del hook `Stop`.

## Alcance Incluido (`Fair game`) para `feat-009`

### 1. Infraestructura Docker y Variables de Entorno (`docker-compose.yml`, `.env.example`, `src/config/site.config.ts`)
- En `docker-compose.yml`:
  - Añadir el servicio `dekolabs-db` con imagen `pgvector/pgvector:pg17`, contenedor `dekolabs-db`, variables `POSTGRES_USER`, `POSTGRES_PASSWORD`, `POSTGRES_DB`, volumen persistente `dekolabs_pgdata:/var/lib/postgresql/data` y `healthcheck` con `pg_isready`.
  - En el servicio `dekolabs-portfolio`, añadir `depends_on: dekolabs-db: condition: service_healthy`, variables `DATABASE_URL`, `ADMIN_ACCESS_KEY` y `CATALOG_UPLOADS_DIR=/app/data/uploads`, y montar el volumen persistente `dekolabs_uploads:/app/data/uploads`.
- En `.env.example` y `src/config/site.config.ts`:
  - Declarar y exponer de forma segura la configuración de base de datos (`DATABASE_URL`), clave de administración (`ADMIN_ACCESS_KEY`, con fallback de desarrollo local solo cuando `NODE_ENV !== "production"`) y directorio de subidas (`CATALOG_UPLOADS_DIR`).

### 2. Contratos de Dominio en Capa 1 (`src/types/portfolio.ts`)
- Definir:
  - `CatalogSectionId = "production-systems" | "ai-projects"` (donde `"production-systems"` ubica el proyecto en **SISTEMAS EN PRODUCCIÓN** `#proyectos-destacados`, y `"ai-projects"` ubica el proyecto en **MÁS PROYECTOS DE IA** `#mas-proyectos-ia`).
  - `SystemGalleryImage`: `{ slot: 1 | 2 | 3; src: string; alt: string; label: string; caption: string; }` para representar las **3 imágenes exclusivas de la vista de detalle** (distintas de la imagen de la tarjeta del inicio `previewImageSrc`).
  - Extender `ProductionSystem` con `catalogSection?: CatalogSectionId` (por defecto `"production-systems"` para `DECO VINTAGE PLATFORM`), `galleryImages?: SystemGalleryImage[]` y `ragKnowledgeDocument?: string`.
  - Definir `ProductionSystemUpsertInput` y métodos asíncronos/sincrónicos de mutación en el repositorio/servicio para crear, editar y eliminar proyectos.

### 3. Persistencia PostgreSQL (`pgvector` Ready) + `Capability Seam` en Capa 3 (`src/repo/postgres-catalog.repo.ts` y `src/repo/systems.repo.ts`)
- Implementar en `src/repo/postgres-catalog.repo.ts`:
  - Inicialización DDL idempotente en PostgreSQL:
    - Tabla `portfolio_systems` (almacenando todos los campos del modelo + `catalog_section` + `rag_knowledge_document` auto-ensamblado con el resumen, narrativa, stack, etapas, specs y desafíos del proyecto listo para vectorizar en la fase RAG).
    - Tabla `portfolio_system_gallery` (`system_id`, `slot_number CHECK (slot_number IN (1, 2, 3))`, `image_src`, `image_alt`, `view_label`, `caption`, `PRIMARY KEY (system_id, slot_number)`).
  - Auto-seed idempotente del Proyecto 01 (`DECO VINTAGE PLATFORM` en `catalog_section = 'production-systems'`) cuando la tabla `portfolio_systems` está vacía.
  - Operaciones CRUD transaccionales (`listSystems`, `getSystemBySlug`, `upsertSystem`, `deleteSystemBySlug`).
  - **Capability Seam Resiliente**: Cuando `DATABASE_URL` está configurada (en producción en el Ubuntu Home Lab), opera contra PostgreSQL (`pg.Pool`); cuando `DATABASE_URL` no está definida (en pruebas locales en Windows o durante `bash ./init.sh`), opera limpiamente contra el respaldo local en memoria/disco sin fallar ni bloquear `init.sh`.

### 4. Clasificación Dual en la Página de Inicio (`src/app/page.tsx` y `src/ui/components/ProductionSystemsSection.tsx`)
- En la página de inicio (`src/app/page.tsx`) deben existir y renderizarse las **dos secciones de categorías del catálogo**:
  1. **SISTEMAS EN PRODUCCIÓN** (`id="proyectos-destacados"`): Muestra las tarjetas de todos los proyectos con `catalogSection === "production-systems"` (actualmente `DECO VINTAGE PLATFORM` y los que Sebastián agregue en producción).
  2. **MÁS PROYECTOS DE IA** (`id="mas-proyectos-ia"`): Conectada al botón `MAS PROYECTOS DE IA` del Header fijo; muestra las tarjetas de todos los proyectos con `catalogSection === "ai-projects"` (proyectos de IA en construcción/desarrollo) con la misma estética equilibrada *Atelier Monolith* (y un estado vacío sobrio cuando aún no se hayan cargado proyectos en esa categoría).

### 5. Retiro de KPIs/Consola y Nueva Galería de 3 Imágenes en `/sistemas/[slug]` (`src/ui/components/SystemDetailView.tsx`)
- En `src/ui/components/SystemDetailView.tsx`:
  - **Retirar por completo** las dos secciones marcadas por Sebastián en la captura:
    1. La sección `3. System 4-KPI Grid` (los 4 recuadros `M-01` a `M-04`: `+540 Obras`, `99.9% SLA`, `Zero OOM`, `Stateless`).
    2. La sección `4. Command & Diagnostic Console` (`01 // CONSOLA DE MANDO Y DIAGNÓSTICO EN TIEMPO REAL — Trazabilidad Operativa y Telemetría de Ejecución`).
  - **Colocar en su lugar** la nueva sección **`01 // VISTAS DE INTERFAZ Y OPERACIÓN DEL SISTEMA`**:
    - Muestra los **3 espacios de imagen (`VIEW 01`, `VIEW 02`, `VIEW 03`)** correspondientes a `system.galleryImages` (diferentes a la imagen de la tarjeta de inicio).
    - Cuando una ranura (`1`, `2` o `3`) tiene imagen cargada (`src` no vacío), muestra la imagen en su marco técnico con etiqueta superior, pie de foto y opción de ver en grande; cuando aún no tiene imagen cargada (porque Sebastián las subirá directamente desde el administrador en producción), muestra el marco técnico *Atelier Monolith* limpio indicando la ranura (`VIEW 01`, `VIEW 02`, `VIEW 03`) lista para imagen.
  - **Conservar intactas** todas las demás secciones de `SystemDetailView.tsx` (Breadcrumb, Hero + Deployment Metadata Ledger, Topología de 3 Etapas del Pipeline, Tabla Técnica + Inspector de Código y 3 Desafíos de Ingeniería Resueltos).

### 6. Panel de Administración (`/admin/proyectos`) y Subida de Imágenes en Producción (`src/app/admin/proyectos/page.tsx`, `src/ui/components/CatalogAdminView.tsx`, `src/runtime/admin-catalog.handler.ts`, `src/app/api/admin/systems/route.ts`, `src/app/api/admin/upload/route.ts`, `src/app/api/assets/[filename]/route.ts`)
- Construir el panel `/admin/proyectos` permitiendo a Sebastián (sin tocar código):
  - **Seleccionar la Categoría de Destino (`catalogSection`)**: `SISTEMAS EN PRODUCCIÓN` (proyectos en producción) o `MÁS PROYECTOS DE IA` (proyectos de IA en construcción).
  - **Crear un proyecto nuevo**, **editar un proyecto existente** (por ejemplo, abrir `DECO VINTAGE PLATFORM` en producción y subirle sus 3 imágenes de detalle) o **eliminar un proyecto**.
  - **Botón "Cargar Molde Base (Deco Vintage)"** para pre-llenar la estructura de etapas/código/desafíos al crear un proyecto nuevo y solo cambiar los textos necesarios.
  - **Subida de Archivos de Imagen desde el Navegador (`/api/admin/upload` -> `/api/assets/[filename]`)**:
    - Subida de la **Imagen de Portada de la Tarjeta de Inicio** (`previewImageSrc`).
    - Subida independiente de las **3 Imágenes de la Vista de Detalle** (`galleryImages` slots `1`, `2` y `3`, cada una con su `label` y `caption`).
    - Validación estricta de tipo MIME (`image/png`, `image/jpeg`, `image/webp`), límite de tamaño y nombre de archivo seguro (` Fail-Closed`).
    - Al guardar cambios en `/api/admin/systems`, invocar `revalidatePath("/")` y `revalidatePath("/sistemas/" + slug)` para que los cambios se reflejen de inmediato en producción.

## Exclusiones Explícitas (Qué NO se va a tocar bajo ninguna circunstancia)
- **Prohibido precargar o inventar imágenes falsas** para las 3 ranuras de detalle de `DECO VINTAGE PLATFORM`: Sebastián las subirá directamente desde `/admin/proyectos` una vez desplegado en producción.
- **Prohibido eliminar las categorías del Home**: `SISTEMAS EN PRODUCCIÓN` (`#proyectos-destacados`) y `MÁS PROYECTOS DE IA` (`#mas-proyectos-ia`) son las dos secciones donde se ubican los proyectos según su estado.
- **Prohibido violar las 6 capas**: ningún archivo en `src/app/` (incluyendo `src/app/api/**/route.ts` y `src/app/admin/proyectos/page.tsx`) ni en `src/ui/` puede importar desde `src/config/` o `src/repo/`.
- **Prohibido modificar el historial** de `feat-001` a `feat-008` en `feature_list.json`.

## Estándares de Verificación ("Hecho" significa exactamente esto)
1. Todos los archivos en `required_files` de `feat-009` existen en disco con `0 CRLF` y `0 UTF-8 BOM`.
2. La suite `tests/admin-catalog.test.ts` verifica: creación, edición y eliminación de proyectos, filtrado por `catalogSection` (`"production-systems"` vs `"ai-projects"`), validación de las 3 imágenes de detalle (`galleryImages`), generación de `ragKnowledgeDocument`, protección por `ADMIN_ACCESS_KEY` y subida/lectura segura de imágenes.
3. `bash ./init.sh`, `bash scripts/check-architecture.sh` y `node scripts/validate-harness.mjs --min-score 100` devuelven código `0` y `Overall: 100/100`.
4. `feat-009` pasa a estado `"done"` con evidencia verificable (`>= 10` caracteres) y el árbol queda en `CLEAN STATE`.
