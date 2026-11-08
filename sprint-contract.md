# Sprint Contract (Contrato de Ejecución de Tarea)

Este documento materializa la **Observabilidad de Proceso (Antes de Codificar)**. El Planificador y el Ejecutor (*Maker*) acuerdan el alcance exacto y los criterios verificables de éxito antes de modificar el sistema, evitando desviaciones de alcance (*Scope Creep*) o interpretaciones ambiguas.

---

## Estado Actual del Contrato (`WIP = 0` — Todas las Tareas `feat-001` a `feat-006` Completadas en `"done"`)
- **Última tarea completada (`done`):** `feat-006` (*Empaquetado Docker Multi-Stage para Ubuntu Home Lab, SEO dekolabs.org y Guía de Despliegue*).
- **Tarea activa (`in-progress`):** Ninguna (`WIP = 0`; 6/6 tareas del DAG completadas y verificadas al `100/100`).
- **Siguiente tarea secuencial lista para iniciar:** Ninguna pendiente en `feature_list.json` (lista para despliegue en el Ubuntu Linux Home Lab o nuevas iteraciones).
- **Especificación maestra de referencia:** `docs/product-specs/dekolabs-portfolio-spec.md`, `docs/design-docs/homelab-deployment.md`, `docs/RELIABILITY.md`, `docs/SECURITY.md` y `ARCHITECTURE.md` (Basadas en el prototipo Google Stitch `projects/10491405022475068698`).

## Justificación de Dependencias en `package.json` (Regla Dura #4 de `ARCHITECTURE.md`)
- **Runtime (`dependencies`)**:
  - `next` (`^15.2.0`), `react` (`^19.0.0`), `react-dom` (`^19.0.0`): Framework principal acordado con Sebastián para App Router, SSR/SSG, Route Handlers (`/api/health`, `/api/telemetry`, `/api/contact`), generación de rutas SEO (`robots.txt`, `sitemap.xml`) y empaquetado `output: 'standalone'` ultraligero en contenedor Docker (`node:22-alpine`) dentro del Ubuntu Linux Home Lab.
- **Desarrollo y Verificación (`devDependencies`)**:
  - `typescript`, `@types/node`, `@types/react`, `@types/react-dom`: Tipado estático estricto para validar contratos entre las 6 capas (`npm run typecheck`).
  - `tailwindcss`, `@tailwindcss/postcss`, `postcss`: Motor de estilos utility-first sin runtime JS para materializar los tokens del sistema de diseño *Atelier Monolith* (Modo Claro por defecto + Modo Oscuro).
  - `vitest`: Runner de pruebas unitarias rápido y determinista para validar las capas `Service`, `Runtime` y la configuración de despliegue/SEO dentro del presupuesto de tiempo del hook `Stop`.

## Alcance Incluido (`Fair game`) para `feat-006`
- Crear `Dockerfile` multi-stage de 3 etapas (`deps`, `builder`, `runner`) sobre `node:22-alpine`:
  - `NEXT_DOCKER_BUILD=1` en la etapa `builder` para preservar `.next/standalone/node_modules` dentro de la imagen de contenedor.
  - Usuario y grupo sin privilegios (`nodejs:1001` / `nextjs:1001`), telemetría de Next.js deshabilitada (`NEXT_TELEMETRY_DISABLED=1`), copia de `.next/standalone`, `.next/static` y `public` (si aplica).
  - `EXPOSE 3000` y `HEALTHCHECK` determinista contra `http://127.0.0.1:3000/api/health` verificando código HTTP 200.
  - Arranque directo con `CMD ["node", "server.js"]`.
- Crear `docker-compose.yml` para el Ubuntu Linux Home Lab:
  - Servicio `dekolabs-portfolio` (`container_name: dekolabs-portfolio`), `restart: unless-stopped`, `env_file: .env` (opcional/con defaults seguros), puerto `127.0.0.1:3000:3000`, límites de recursos (`mem_limit: 256m`, `memswap_limit: 256m`), `security_opt: ["no-new-privileges:true"]`, `healthcheck` alineado con `/api/health` y etiquetas listas para Reverse Proxy existente (Cloudflare Tunnel `cloudflared`, Traefik, Nginx o Caddy).
- Crear `.dockerignore` excluyendo `.git`, `node_modules`, `.next`, `coverage`, `.venv`, `.env*` (excepto `.env.example`), `.agents/.runtime` y artefactos temporales para acelerar el build y proteger secretos.
- Crear `.env.example` documentando las variables de entorno del contenedor en el Ubuntu Home Lab (`NODE_ENV`, `PORT`, `HOSTNAME`, `NEXT_TELEMETRY_DISABLED`, `HOMELAB_NODE_ID`, `HOMELAB_PUBLIC_DOMAIN`, `HOMELAB_DEPLOYED_REVISION`) sin incluir secretos reales.
- Implementar `src/app/robots.ts` y `src/app/sitemap.ts` consumiendo exclusivamente servicios de `src/service/` (`getSiteMetadataSummary`, `getAllProductionSystemSlugs`) sin saltar capas hacia `src/config/` o `src/repo/`.
- Enriquecer los metadatos SEO en `src/app/layout.tsx` (`openGraph`, `twitter`, `alternates.canonical`, `robots`) usando `getSiteMetadataSummary()` desde `src/service/site.service.ts`.
- Crear `docs/design-docs/homelab-deployment.md` con la arquitectura del contenedor Multi-Stage, topología de red en el Ubuntu Server 24.04 LTS, integración con Reverse Proxy (`cloudflared` / Traefik / Caddy / Nginx), comandos de operación, verificación de salud (`/api/health`, `/api/telemetry`) y procedimiento de actualización zero-downtime.
- Enlazar `docs/design-docs/homelab-deployment.md` en la sección `## Required Artifacts` de `AGENTS.md` una vez creado el archivo con contenido real.
- Crear `tests/deployment-config.test.ts` verificando la generación de `robots.ts` y `sitemap.ts` (incluyendo la URL canónica `https://dekolabs.org` y los 4 slugs de `/sistemas/[slug]`), además de las invariantes de seguridad y producción de `Dockerfile`, `docker-compose.yml`, `.dockerignore`, `.env.example` y `docs/design-docs/homelab-deployment.md`.

## Exclusiones Explícitas (Qué NO se va a tocar bajo ninguna circunstancia)
- Prohibido que cualquier archivo en `src/app/` o `src/ui/` (incluyendo `src/app/robots.ts`, `src/app/sitemap.ts` y `src/app/layout.tsx`) importe directamente desde `src/config/` o `src/repo/` (Regla Dura #2: `No Layer Skipping`).
- Prohibido crear archivos `.env` con secretos reales o des-ignorar `.env` en `.gitignore` (solo `.env.example` está permitido).
- Prohibido debilitar, comentar o relajar validaciones en `init.sh`, `scripts/validate-harness.mjs`, `scripts/lib/harness-utils.mjs`, `scripts/check-architecture.sh` o `scripts/harness-hooks.mjs`.
- Prohibido que el agente Constructor (*Maker*) rellene `evaluator-rubric.md` o reutilice vía `send_message` un sub-agente *Checker* previo (`1 Checker = 1 sola auditoría / one-shot`).

## Estándares de Verificación ("Hecho" significa exactamente esto)
1. Todos los 8 archivos declarados en `required_files` de `feat-006` existen físicamente en disco y no están vacíos (`0 CRLF` y `0 UTF-8 BOM` en todo el repositorio).
2. `bash ./init.sh`, `bash scripts/check-architecture.sh` y `node scripts/validate-harness.mjs --min-score 100` devuelven código `0` y `Overall: 100/100` ejecutando `typecheck`, `lint`, `test` y `build`.
3. Todas las 6 tareas (`feat-001` a `feat-006`) de `feature_list.json` quedan en estado `"done"` con evidencia verificable (`>= 10` caracteres) y el árbol limpio (`clean-state`).
