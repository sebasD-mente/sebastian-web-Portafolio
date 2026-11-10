# Sprint Contract (Contrato de Ejecución de Tarea)

Este documento materializa la **Observabilidad de Proceso (Antes de Codificar)**. El Planificador y el Ejecutor (*Maker*) acuerdan el alcance exacto y los criterios verificables de éxito antes de modificar el sistema, evitando desviaciones de alcance (*Scope Creep*) o interpretaciones ambiguas.

---

## Estado Actual del Contrato (`WIP = 0` — `feat-001` a `feat-011` Completadas en `done`)
- **Última tarea completada (`done`):** `feat-011` (*Panel Visual del Administrador de Proyectos (`/admin/proyectos`) con Subida de 4 Imágenes, Selector de Categoría y Guía de Despliegue Home Lab*).
- **Tarea activa (`in-progress`):** Ninguna (`WIP = 0`; las 11 tareas del proyecto están en `"done"` y verificadas al `100/100`).
- **Historial secuencial del catálogo administrable (`feat-009`..`feat-011`):**
  1. **`feat-009`** (`done`): *Cimiento PostgreSQL (`pgvector` Ready), Volumen Docker `/app/data/uploads` (`read_only`-safe) y Vistas Públicas (2 Categorías en Home + Galería de 3 Imágenes en Detalle)*.
  2. **`feat-010`** (`done`): *Motor Backend del Administrador: APIs CRUD de Proyectos y Subida/Servidor de Imágenes en `/app/data/uploads` (`/api/admin/systems`, `/api/admin/upload`, `/api/assets/[filename]`)*.
  3. **`feat-011`** (`done`): *Panel Visual del Administrador de Proyectos (`/admin/proyectos`) con Subida de 4 Imágenes, Selector de Categoría y Guía de Despliegue Home Lab*.
- **Especificación maestra de referencia:** `docs/product-specs/dekolabs-portfolio-spec.md` (Sección 7), `docs/design-docs/homelab-deployment.md`, `docs/RELIABILITY.md`, `docs/SECURITY.md` y `ARCHITECTURE.md`.

## Justificación de Dependencias en `package.json` (Regla Dura #4 de `ARCHITECTURE.md`)
- **Runtime (`dependencies`)**:
  - `next` (`^15.2.0`), `react` (`^19.0.0`), `react-dom` (`^19.0.0`): Framework principal acordado con Sebastián para App Router, SSR/SSG, Route Handlers (`/api/health`, `/api/telemetry`, `/api/contact`, `/api/admin/systems`, `/api/admin/upload`, `/api/assets/[filename]`), generación de rutas SEO (`robots.txt`, `sitemap.xml`) y empaquetado `output: 'standalone'` ultraligero en contenedor Docker (`node:22-alpine`) dentro del Ubuntu Linux Home Lab.
  - `pg` (`^8.13.0`): Driver oficial de PostgreSQL (`node-postgres`) para conectar la capa `Repo` (`src/repo/postgres-catalog.repo.ts`) mediante pool de conexiones y transacciones ACID (`BEGIN`/`COMMIT`/`ROLLBACK`) hacia el contenedor `dekolabs-db` (`pgvector/pgvector:pg17`) en el Ubuntu Linux Home Lab, dejando el esquema preparado con `rag_knowledge_document` para la futura fase de Agente RAG en vivo.
- **Desarrollo y Verificación (`devDependencies`)**:
  - `typescript`, `@types/node`, `@types/react`, `@types/react-dom`, `@types/pg`: Tipado estático estricto para validar contratos entre las 6 capas (`npm run typecheck`).
  - `tailwindcss`, `@tailwindcss/postcss`, `postcss`: Motor de estilos utility-first sin runtime JS para materializar los tokens del sistema de diseño *Atelier Monolith* (Modo Claro por defecto + Modo Oscuro).
  - `vitest`: Runner de pruebas unitarias rápido y determinista para validar las capas `Service`, `Runtime` y la configuración de despliegue/SEO dentro del presupuesto de tiempo del hook `Stop`.

---

## Alcance Incluido (`Fair game`) por Tarea Secuencial

### Fase 1 — `feat-009`: Cimiento PostgreSQL (`pgvector` Ready), Volumen Docker `/app/data/uploads` (`read_only`-safe) y Vistas Públicas
1. **Infraestructura Docker Compatible con `read_only: true` (`Dockerfile`, `docker-compose.yml`, `.env.example`, `src/config/site.config.ts`)**:
   - En `Dockerfile` (etapa `runner`, antes de `USER nextjs`), crear `/app/data/uploads` y `/app/.next/cache` asignados a `nextjs:nodejs` (`uid=1001`, `gid=1001`):
     ```dockerfile
     RUN mkdir -p /app/data/uploads /app/.next/cache \
       && chown -R nextjs:nodejs /app/data /app/.next/cache
     ```
     *Por qué*: En `docker-compose.yml`, `dekolabs-portfolio` corre con `read_only: true` y usuario no-root `nextjs`. Pre-crear el punto de montaje `/app/data/uploads` con propietario `nextjs:nodejs` garantiza que el volumen montado permita escribir las imágenes subidas desde el administrador en producción sin errores `EACCES` ni `EROFS`, y sin perderse al actualizar el contenedor.
   - En `docker-compose.yml`:
     - Añadir el servicio `dekolabs-db` (`image: pgvector/pgvector:pg17`, `container_name: dekolabs-db`, `POSTGRES_USER`, `POSTGRES_PASSWORD`, `POSTGRES_DB`, volumen persistente `dekolabs_pgdata:/var/lib/postgresql/data` y `healthcheck` con `pg_isready`).
     - En `dekolabs-portfolio`, añadir `depends_on: dekolabs-db: condition: service_healthy`, variables `DATABASE_URL`, `ADMIN_ACCESS_KEY` y `CATALOG_UPLOADS_DIR: "/app/data/uploads"`, montar el volumen `dekolabs_uploads:/app/data/uploads` y agregar `/app/.next/cache:mode=1777,size=64m` en `tmpfs`, conservando intactas todas las invariantes verificadas por `tests/deployment-config.test.ts`.
2. **Contratos y Persistencia PostgreSQL con `Capability Seam` (`src/types/portfolio.ts`, `src/repo/postgres-catalog.repo.ts`, `src/repo/systems.repo.ts`, `src/service/systems.service.ts`)**:
   - Definir `CatalogSectionId = "production-systems" | "ai-projects"`, `SystemGalleryImage` (`slot: 1 | 2 | 3`, `src`, `alt`, `label`, `caption`) y `ProductionSystemUpsertInput`.
   - En `src/repo/postgres-catalog.repo.ts`, crear de forma idempotente las tablas `portfolio_systems` (con `catalog_section` y `rag_knowledge_document`) y `portfolio_system_gallery` (`FOREIGN KEY (system_id) REFERENCES portfolio_systems(id) ON DELETE CASCADE`), sembrar el Proyecto 01 (`DECO VINTAGE PLATFORM`) cuando esté vacía y proveer operaciones CRUD transaccionales.
   - Mantener el `Capability Seam` para que cuando `DATABASE_URL` no esté activa en pruebas locales o `init.sh`, opere limpiamente contra el almacén local determinista.
3. **Las 2 Secciones de Categorías en el Home (`src/app/page.tsx` y `src/ui/components/ProductionSystemsSection.tsx`)**:
   - Renderizar en `/` tanto **SISTEMAS EN PRODUCCIÓN** (`id="proyectos-destacados"`, proyectos con `catalogSection === "production-systems"` y `featuredOnHome === true`) como **MÁS PROYECTOS DE IA** (`id="mas-proyectos-ia"`, proyectos con `catalogSection === "ai-projects"` y `featuredOnHome === true`, conectada al botón `MAS PROYECTOS DE IA` del Header).
4. **Retiro de KPIs/Consola y Galería de 3 Imágenes en `/sistemas/[slug]` (`src/ui/components/SystemDetailView.tsx`)**:
   - Eliminar por completo la sección `3. System 4-KPI Grid` (`M-01..M-04`) y la sección `4. Command & Diagnostic Console` (`01 // CONSOLA DE MANDO Y DIAGNÓSTICO EN TIEMPO REAL`).
   - Colocar en su lugar la sección **`01 // VISTAS DE INTERFAZ Y OPERACIÓN DEL SISTEMA`** con los **3 espacios para imágenes de detalle (`VIEW 01`, `VIEW 02`, `VIEW 03`)** diferentes a la foto de la tarjeta de inicio.
5. **Pruebas Unitarias (`tests/postgres-catalog-and-gallery.test.ts`)**:
   - Validar las 2 categorías del Home, la normalización de las 3 ranuras de galería, el documento RAG y la configuración Docker (`pgvector/pgvector:pg17` + `/app/data/uploads`).

---

### Fase 2 — `feat-010`: Motor Backend del Administrador (`/api/admin/systems`, `/api/admin/upload`, `/api/assets/[filename]`)
1. **Controlador Runtime (`src/runtime/admin-catalog.handler.ts`) y Rutas API (`src/app/api/admin/systems/route.ts`, `src/app/api/admin/upload/route.ts`, `src/app/api/assets/[filename]/route.ts`)**:
   - Autenticación `Fail-Closed` validando `ADMIN_ACCESS_KEY` (`401 Unauthorized` si falta o no coincide) con logs estructurados `RuntimeLogEntry` (`correlationId`).
   - CRUD completo (`GET`, `POST`, `PUT`, `DELETE` en `/api/admin/systems`) validando categoría (`"production-systems"` vs `"ai-projects"`), campos de tarjeta, las 3 imágenes de detalle (`galleryImages` slots `1, 2, 3`) y campos del blueprint, ejecutando `revalidatePath("/")` y `revalidatePath("/sistemas/" + slug)`.
   - Subida de imágenes desde el PC (`POST /api/admin/upload`) hacia `CATALOG_UPLOADS_DIR` (`/app/data/uploads` en producción) validando MIME (`image/png`, `image/jpeg`, `image/webp`), tamaño (`<= 10 MB`) y nombre seguro, retornando `/api/assets/<filename>`.
   - Servidor de activos (`GET /api/assets/[filename]`) que transmite los archivos desde `CATALOG_UPLOADS_DIR` bloqueando cualquier intento de *path traversal* (`..`, `/`, `\`).
2. **Pruebas de Integración (`tests/admin-api-and-uploads.test.ts`)**:
   - Probar rechazo `401`, creación de proyectos en ambas categorías (`SISTEMAS EN PRODUCCIÓN` y `MÁS PROYECTOS DE IA`), edición de las 3 imágenes de detalle, borrado y ciclo completo de subida y lectura de imagen en directorio dedicado.

---

### Fase 3 — `feat-011`: Panel Visual del Administrador de Proyectos (`/admin/proyectos`) y Guía de Despliegue
1. **Interfaz del Administrador (`src/app/admin/proyectos/page.tsx` y `src/ui/components/CatalogAdminView.tsx`)**:
   - Panel completo en `/admin/proyectos` donde Sebastián puede:
     - Desbloquear con su `ADMIN_ACCESS_KEY`.
     - Ver los proyectos actuales separados por **`SISTEMAS EN PRODUCCIÓN`** y **`MÁS PROYECTOS DE IA`**, seleccionarlos para **Editar**, **Eliminar** o **Crear Nuevo Proyecto** (con botón **"Cargar Molde Base (Deco Vintage)"**).
     - Elegir la categoría del proyecto (`SISTEMAS EN PRODUCCIÓN` o `MÁS PROYECTOS DE IA`).
     - Subir desde su PC la **imagen de portada de la tarjeta de inicio** (`previewImageSrc`) y las **3 imágenes exclusivas de la vista de detalle** (`VIEW 01`, `VIEW 02`, `VIEW 03` con su etiqueta y pie de foto).
     - Editar todos los textos de la tarjeta, pills de stack (y cuál va en azul), métricas de arquitectura/disponibilidad, URL en vivo, Ledger de despliegue, 3 etapas del pipeline, pestañas de código y 3 desafíos resueltos.
2. **Documentación y Pruebas (`docs/design-docs/homelab-deployment.md` y `tests/catalog-admin-ui.test.ts`)**:
   - Actualizar `docs/design-docs/homelab-deployment.md` con la guía operativa del contenedor `dekolabs-db` (`pgvector/pgvector:pg17`), el volumen `/app/data/uploads` bajo `read_only: true`, la variable `ADMIN_ACCESS_KEY` y el flujo de uso de `/admin/proyectos`.
   - Verificar con `tests/catalog-admin-ui.test.ts`.

---

## Exclusiones Explícitas (Qué NO se va a tocar bajo ninguna circunstancia)
- **Prohibido precargar o inventar imágenes falsas** para las 3 ranuras de detalle de `DECO VINTAGE PLATFORM`: Sebastián las subirá directamente desde `/admin/proyectos` una vez desplegado en producción.
- **Prohibido guardar imágenes subidas dentro de `/app/public/`**: en producción el contenedor tiene `read_only: true`; todo archivo subido debe escribirse exclusivamente en `CATALOG_UPLOADS_DIR` (`/app/data/uploads`, volumen Docker `dekolabs_uploads`) y servirse por `/api/assets/[filename]`.
- **Prohibido violar las 6 capas**: ningún archivo en `src/app/` ni en `src/ui/` puede importar desde `src/config/` o `src/repo/`.
- **Prohibido modificar el historial** de `feat-001` a `feat-008` en `feature_list.json` ni relajar pruebas existentes en `tests/`.

## Estándares de Verificación ("Hecho" significa exactamente esto)
1. En cada una de las 3 tareas (`feat-009`, `feat-010`, `feat-011`), respetar `WIP = 1` (ejecutar y cerrar en `"done"` `feat-009` antes de iniciar `feat-010`, y cerrar `feat-010` antes de iniciar `feat-011`).
2. `bash ./init.sh`, `bash scripts/check-architecture.sh` y `node scripts/validate-harness.mjs --min-score 100` devuelven código `0` y `Overall: 100/100` (`0 CRLF`, `0 UTF-8 BOM`).
