# Sprint Contract (Contrato de Ejecución de Tarea)

Este documento materializa la **Observabilidad de Proceso (Antes de Codificar)**. El Planificador y el Ejecutor (*Maker*) acuerdan el alcance exacto y los criterios verificables de éxito antes de modificar el sistema, evitando desviaciones de alcance (*Scope Creep*) o interpretaciones ambiguas.

---

## Estado Actual del Contrato (`WIP = 0` — `feat-014` Completada; Siguiente en Cola: `feat-015`)
- **Última tarea completada (`done`):** `feat-014` (*Página de Inicio (`/`) Exclusiva para Sistemas en Producción y Nueva Página Pública Dedicada `/proyectos-ia`*).
- **Tarea activa (`in-progress`):** Ninguna (`WIP = 0`; `feat-014` verificada al `100/100` en las 3 puertas de `init.sh`).
- **Siguiente tarea secuencial lista para iniciar:** `feat-015` (*Pie de Página Oficial (`OfficialFooter`) con Copyright "Creado por Sebastian Jimenez 2026" y Botones de Redes Sociales (LinkedIn, Facebook, Instagram, WhatsApp)*).
- **Hoja de ruta secuencial declarada en el DAG (`feat-012 -> feat-013 -> feat-014 -> feat-015`):**
  1. **`feat-012`** (`done`, depende de `feat-011`): *Sistema Profesional de Login (`/admin/login`) con Sesión Firmada `HttpOnly`, Límite Anti-Fuerza Bruta y Cierre de Sesión*.
  2. **`feat-013`** (`done`, depende de `feat-012`): *Reestructuración del Administrador (`/admin/proyectos`) en 2 Vistas Separadas, Selector `<select>` de Sección y Evolución de IA a Producción*.
  3. **`feat-014`** (`done`, depende de `feat-013`): *Página de Inicio (`/`) Exclusiva para Sistemas en Producción y Nueva Página Pública Dedicada `/proyectos-ia`*.
  4. **`feat-015`** (`not-started`, depende de `feat-014`): *Pie de Página Oficial (`OfficialFooter`) con Copyright "Creado por Sebastian Jimenez 2026" y Botones de Redes Sociales (LinkedIn, Facebook, Instagram, WhatsApp)*.
- **Especificación maestra de referencia:** `docs/product-specs/dekolabs-portfolio-spec.md` (Sección 8), `docs/design-docs/homelab-deployment.md`, `docs/RELIABILITY.md`, `docs/SECURITY.md` y `ARCHITECTURE.md`.

## Justificación de Dependencias en `package.json` (Regla Dura #4 de `ARCHITECTURE.md`)
- **Runtime (`dependencies`) — Sin dependencias nuevas requeridas para `feat-012`..`feat-015`**:
  - `next` (`^15.2.0`), `react` (`^19.0.0`), `react-dom` (`^19.0.0`): App Router, SSR/SSG, Route Handlers (`/api/health`, `/api/telemetry`, `/api/contact`, `/api/admin/auth/login`, `/api/admin/auth/logout`, `/api/admin/systems`, `/api/admin/upload`, `/api/assets/[filename]`) y empaquetado `output: 'standalone'` sobre `node:22-alpine`.
  - `pg` (`^8.23.1`): Driver oficial de PostgreSQL para persistencia ACID hacia `dekolabs-db` (`pgvector/pgvector:pg17`).
  - *Nota de seguridad (`feat-012`)*: Toda la criptografía de login y sesión (`scryptSync`, `timingSafeEqual`, `createHmac("sha256", ...)`) utiliza el módulo nativo `node:crypto` de Node.js 22 sin añadir paquetes de terceros.
- **Desarrollo y Verificación (`devDependencies`)**:
  - `typescript`, `@types/node`, `@types/react`, `@types/react-dom`, `@types/pg`, `tailwindcss`, `@tailwindcss/postcss`, `postcss`, `vitest`.

---

## Alcance Incluido (`Fair game`) por Tarea Secuencial

### Fase 1 — `feat-012`: Sistema Profesional de Login (`/admin/login`) con Sesión Firmada `HttpOnly`
1. **Variables de Entorno y Configuración (`src/config/site.config.ts`, `.env.example`, `docker-compose.yml`)**:
   - Definir `ADMIN_USERNAME`, `ADMIN_PASSWORD` y `ADMIN_SESSION_SECRET` (con respaldo determinista exclusivamente fuera de producción para que `vitest` / `init.sh` funcionen en limpio, y política `Fail-Closed` en `NODE_ENV=production` si faltan o conservan el placeholder por defecto).
2. **Motor Criptográfico y Protección Anti-Fuerza Bruta (`src/types/portfolio.ts`, `src/service/admin-auth.service.ts`, `src/runtime/admin-auth.handler.ts`)**:
   - Comparación en tiempo constante (`timingSafeEqual` / `scryptSync`) de usuario y contraseña.
   - Emisión y verificación de token firmado HMAC-SHA256 (`dekolabs_admin_session`) con expiración (`Max-Age=43200`, `HttpOnly`, `SameSite=Strict`, `Path=/`, y `Secure` en producción).
   - Rate-limit en memoria por IP en `POST /api/admin/auth/login` (`429 Too Many Requests` tras superar el umbral de intentos fallidos) y cierre de sesión limpio en `POST /api/admin/auth/logout` (`Max-Age=0`), registrando `RuntimeLogEntry` con `correlationId` y redacción de secretos.
   - En `src/runtime/admin-catalog.handler.ts`, `isAdminRequestAuthorized` acepta **tanto** la cookie firmada válida `dekolabs_admin_session` (flujo web) **como** `x-admin-key` / `Bearer` (compatibilidad 100% con `tests/admin-api-and-uploads.test.ts`).
3. **Pantalla `/admin/login` y Limpieza de `/admin/proyectos` (`src/app/admin/login/page.tsx`, `src/ui/components/AdminLoginView.tsx`, `src/app/admin/proyectos/page.tsx`, `src/ui/components/CatalogAdminView.tsx`)**:
   - Vista dedicada `/admin/login` (`noindex, nofollow`) con estética *Atelier Monolith*, logo personal `Sebastian J`, campos de Usuario y Contraseña (con botón Mostrar/Ocultar) y redirección a `/admin/proyectos`.
   - Verificación Server-Side en `/admin/proyectos` redirigiendo a `/admin/login` si no hay sesión válida (manejando `cookies()` de `next/headers` de forma segura cuando se invoca fuera de contexto HTTP en Vitest).
   - Eliminación total del bloque `CLAVE DE ACCESO ADMINISTRADOR (ADMIN_ACCESS_KEY) *` y `SINCRONIZAR CATÁLOGO` en `CatalogAdminView.tsx`, sustituido por badge de sesión activa y botón **`Cerrar Sesión`**.
4. **Sincronización de Documentación y Tests**:
   - Actualizar `docs/design-docs/homelab-deployment.md`, crear `tests/admin-auth-session.test.ts`, actualizar `tests/catalog-admin-ui.test.ts` y registrar `AdminLoginView.tsx` en `activeComponents` de `tests/harness-deprecation-dag.test.ts`.

---

### Fase 2 — `feat-013`: Administrador en 2 Vistas Separadas, Selector `<select>` y Evolución a Producción
1. **Separación Estricta en 2 Vistas (`src/ui/components/CatalogAdminView.tsx`)**:
   - **Vista 1 (`viewMode = "list"`, vista inicial por defecto al entrar a `/admin/proyectos`)**:
     - Retira los dos botones `+ Nuevo en Producción` y `+ Nuevo Proyecto de IA`, dejando **un único botón primario `+ Crear Nuevo Proyecto`** en el encabezado.
     - Muestra únicamente las tarjetas de los proyectos existentes (agrupadas en `PROYECTOS EN PRODUCCIÓN` y `MÁS PROYECTOS DE IA`), sin abrir el formulario automáticamente.
   - **Vista 2 (`viewMode = "form"`, abierta solo al pulsar `+ Crear Nuevo Proyecto` o `Editar`)**:
     - Incluye botón **`← Volver a Proyectos Creados`** (y `Cargar Molde Base (Deco Vintage)` al crear proyecto nuevo), conserva los 4 bloques y los 4 cargadores de imagen, y regresa al listado al guardar.
2. **Selector `<select>` Limpio y Ciclo de Evolución (`src/service/systems.service.ts`, `src/ui/components/CatalogAdminView.tsx`)**:
   - **Eliminar por completo** las dos cajas grandes de radio `UBICACIÓN DEL PROYECTO EN LA PÁGINA DE INICIO (CATALOGSECTION) *` de Bloque A y colocar un **`<select name="catalogSection">`** limpio (`Proyectos en Producción` vs `Más Proyectos de IA`).
   - Añadir en cada tarjeta de `MÁS PROYECTOS DE IA` (Vista 1) el botón directo **`Evolucionar a Producción`** que promueve el proyecto a `"production-systems"` vía `PUT /api/admin/systems`.
3. **Pruebas (`tests/catalog-admin-ui.test.ts`)**:
   - Soportar `initialViewMode?: "list" | "form"` (default `"list"`) en `CatalogAdminViewProps` para verificar determinísticamente con `renderToStaticMarkup` que la entrada por defecto solo muestra las tarjetas + el botón único `Crear Nuevo Proyecto` + `Evolucionar a Producción`, y que la vista de formulario muestra el `<select name="catalogSection">` sin rastro de las cajas radio antiguas.

---

### Fase 3 — `feat-014`: Página de Inicio (`/`) Solo Producción y Nueva Página `/proyectos-ia`
1. **Curaduría de `/` y Creación de `/proyectos-ia` (`src/app/page.tsx`, `src/ui/components/ProductionSystemsSection.tsx`, `src/app/proyectos-ia/page.tsx`, `src/ui/components/AiProjectsCatalogView.tsx`)**:
   - Quitar por completo la sección `MÁS PROYECTOS DE IA` (`#mas-proyectos-ia`) de `ProductionSystemsSection.tsx` y `src/app/page.tsx` para que la página inicial muestre exclusivamente `HeroSection` y `SISTEMAS EN PRODUCCIÓN`.
   - Construir `src/app/proyectos-ia/page.tsx` (`force-dynamic`) y `src/ui/components/AiProjectsCatalogView.tsx` exhibiendo los proyectos con `catalogSection === "ai-projects"`.
2. **Navegación y Revalidación (`src/config/site.config.ts`, `src/types/portfolio.ts`, `src/runtime/admin-catalog.handler.ts`, `src/ui/components/AppShell.tsx`)**:
   - Enlazar el botón `MAS PROYECTOS DE IA` del Header a `/proyectos-ia` y usar `/#proyectos-destacados`, `/#stack-tecnologico` y `/#contacto` en los demás enlaces para navegar limpiamente desde cualquier ruta (conservando intactos los `label` verificados por `tests/site.service.test.ts`).
   - Incluir `revalidatePath("/proyectos-ia")` en `safeRevalidateCatalogPaths`.
3. **Pruebas**:
   - Crear `tests/ai-projects-page.test.ts`, sincronizar `tests/postgres-catalog-and-gallery.test.ts` (verificando que `ProductionSystemsSection.tsx` ya no incluye `#mas-proyectos-ia` y que `AiProjectsCatalogView.tsx` sí renderiza `MÁS PROYECTOS DE IA`) y añadir `AiProjectsCatalogView.tsx` en `tests/harness-deprecation-dag.test.ts`.

---

### Fase 4 — `feat-015`: Pie de Página Oficial (`OfficialFooter`) con Copyright y Redes Sociales
1. **Contratos y Configuración en 6 Capas (`src/types/portfolio.ts`, `src/config/site.config.ts`, `.env.example`, `src/repo/site.repo.ts`, `src/service/site.service.ts`)**:
   - Parametrizar las URLs de **LinkedIn**, **Facebook**, **Instagram** y **WhatsApp** (`NEXT_PUBLIC_SOCIAL_LINKEDIN_URL`, `NEXT_PUBLIC_SOCIAL_FACEBOOK_URL`, `NEXT_PUBLIC_SOCIAL_INSTAGRAM_URL`, `NEXT_PUBLIC_SOCIAL_WHATSAPP_URL`) y exponer `OfficialFooterData` vía `getSiteFoundationSnapshot().footer`.
2. **Componente `src/ui/components/OfficialFooter.tsx` en `AppShell.tsx`**:
   - Sección de botones sociales con íconos SVG vectoriales accesibles para **LinkedIn**, **Facebook**, **Instagram** y **WhatsApp**.
   - Leyenda oficial de copyright conteniendo literalmente **`Creado por Sebastian Jimenez 2026`**.
3. **Pruebas**:
   - Crear `tests/official-footer.test.ts` y registrar `OfficialFooter.tsx` en `activeComponents` de `tests/harness-deprecation-dag.test.ts`.

---

## Exclusiones Explícitas (Qué NO se va a tocar bajo ninguna circunstancia)
- **Prohibido modificar el historial cerrado** de `feat-001` a `feat-011` en `feature_list.json`.
- **Prohibido violar las 6 capas**: ningún archivo en `src/app/` ni en `src/ui/` puede importar directamente desde `src/config/` o `src/repo/`.
- **Prohibido agregar dependencias innecesarias en `package.json`**: usar `node:crypto` nativo para `feat-012` e íconos SVG limpios para `feat-015`.
- **Prohibido guardar imágenes subidas en `/app/public/`**: toda subida continúa en `CATALOG_UPLOADS_DIR` (`/app/data/uploads`) compatible con `read_only: true`.

## Estándares de Verificación ("Hecho" significa exactamente esto)
1. Ejecutar estrictamente una sola tarea a la vez (`WIP = 1`) respetando el orden secuencial `feat-012 -> feat-013 -> feat-014 -> feat-015` y actualizando `sprint-contract.md` al activar cada tarea.
2. `bash ./init.sh`, `bash scripts/check-architecture.sh` y `node scripts/validate-harness.mjs --min-score 100` devuelven código `0` y `Overall: 100/100` (`0 CRLF`, `0 UTF-8 BOM`).
