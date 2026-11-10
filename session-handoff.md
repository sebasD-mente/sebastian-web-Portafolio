# Session Handoff

## Current Objective
- **Goal:** Implementar y verificar al `100/100` la tarea **`feat-012`** (*Sistema Profesional de Login (`/admin/login`) con Sesión Firmada `HttpOnly`, Límite Anti-Fuerza Bruta y Cierre de Sesión*), dejando el repositorio en `clean-state` (`WIP = 0`) listo para `feat-013`.
- **Current status:** `clean-state` (`feat-001` a `feat-012` en `"done"`, `feat-013` a `feat-015` en `"not-started"`, `WIP = 0`; `Overall: 100/100`; `0 CRLF`; `0 UTF-8 BOM`; `43/43` tests unitarios en 11 suites PASS y build `standalone` OK)
- **Branch / commit:** `main` (`feat-012` implementada y verificada)

## Completed This Session
- [x] **Configuración y Criptografía Nativa (`node:crypto`)**:
  - Variables `ADMIN_USERNAME`, `ADMIN_PASSWORD` y `ADMIN_SESSION_SECRET` declaradas en `.env.example`, `docker-compose.yml` y `src/config/site.config.ts` con política `Fail-Closed` en `NODE_ENV=production`.
  - Servicio `src/service/admin-auth.service.ts` con comparación en tiempo constante (`scryptSync` + `timingSafeEqual`), tokens de sesión HMAC-SHA256 (`dekolabs_admin_session`, `HttpOnly; SameSite=Strict; Path=/; Max-Age=43200; Secure`) y rate-limiter anti-fuerza bruta por IP.
- [x] **Endpoints de Sesión y Autorización Dual**:
  - `POST /api/admin/auth/login` (`429 Too Many Requests` + `Retry-After`, logs `RuntimeLogEntry` redactando secretos) y `POST /api/admin/auth/logout` (`Max-Age=0`).
  - `isAdminRequestAuthorized` en `src/runtime/admin-catalog.handler.ts` acepta tanto la cookie firmada `dekolabs_admin_session` como `x-admin-key` / `Bearer`.
- [x] **Pantalla `/admin/login` y Limpieza de `/admin/proyectos`**:
  - Nueva vista `/admin/login` (`noindex, nofollow`) con firma `Sebastian J`, autofill semántico (`autocomplete="username"`, `autocomplete="current-password"`) y alternador accesible `MOSTRAR`/`OCULTAR`.
  - Protección Server-Side en `src/app/admin/proyectos/page.tsx` redirigiendo a `/admin/login` sin sesión válida y retiro total del campo `ADMIN_ACCESS_KEY` en `CatalogAdminView.tsx`, sustituido por indicador `SESIÓN ACTIVA · HTTPONLY` y botón `Cerrar Sesión`.
- [x] **Documentación y Pruebas (`43/43 PASS`)**:
  - Actualizada `docs/design-docs/homelab-deployment.md` y creadas/actualizadas las suites `tests/admin-auth-session.test.ts`, `tests/catalog-admin-ui.test.ts` y `tests/harness-deprecation-dag.test.ts`.

## Verification Evidence

| Check | Command | Result | Notes |
| :--- | :--- | :--- | :--- |
| Vigilante Arquitectónico y Higiene (Puerta 1) | `bash scripts/check-architecture.sh` | `PASS (Exit code 0)` | 6 capas en `src/` sin violaciones direccionales, `0 CRLF`, `0 BOM` |
| Validación de los 5 Subsistemas (Puerta 2) | `node scripts/validate-harness.mjs --min-score 100` | `PASS (100/100)` | `25/25` checks PASS (`feat-001`..`feat-012` en `done`, `WIP = 0`) |
| Build, Lint, Typecheck y Tests (Puerta 3) | `bash ./init.sh` | `PASS (Exit code 0)` | `tsc --noEmit` OK, `vitest run` (`43/43 PASS` en 11 suites) y `next build` (`standalone` OK con `/admin/login`) |

## Files Changed
- `.env.example`
- `docker-compose.yml`
- `next.config.ts`
- `package.json`
- `src/types/portfolio.ts`
- `src/config/site.config.ts`
- `src/service/admin-auth.service.ts`
- `src/runtime/admin-auth.handler.ts`
- `src/runtime/admin-catalog.handler.ts`
- `src/app/api/admin/auth/login/route.ts`
- `src/app/api/admin/auth/logout/route.ts`
- `src/app/admin/login/page.tsx`
- `src/ui/components/AdminLoginView.tsx`
- `src/app/admin/proyectos/page.tsx`
- `src/ui/components/CatalogAdminView.tsx`
- `docs/design-docs/homelab-deployment.md`
- `tests/admin-auth-session.test.ts`
- `tests/catalog-admin-ui.test.ts`
- `tests/harness-deprecation-dag.test.ts`
- `feature_list.json`
- `sprint-contract.md`
- `progress.md`
- `session-handoff.md`

## Decisions Made
- Verificación criptográfica nativa con `node:crypto` (`scryptSync`, `createHmac`, `timingSafeEqual`) sin añadir dependencias externas en `package.json`.
- Redirección completa post-login/post-logout (`window.location.assign`) para sincronizar de inmediato la cookie `HttpOnly` con los Server Components de Next.js 15.

## Blockers / Risks
- Ninguno activo.

## Next Session Startup
1. Confirmar `pwd` en `sebastian web Portafolio`.
2. Leer `AGENTS.md`, `harness.config.json`, `progress.md`, `session-handoff.md`, `sprint-contract.md` y `feature_list.json`.
3. Ejecutar `bash ./init.sh` para verificar que la línea base está en verde (`100/100`).

## Recommended Next Step
- Seleccionar únicamente **`feat-013`** en `feature_list.json`, pasarla a `"status": "in-progress"` (`WIP = 1`) y reestructurar `/admin/proyectos` en 2 vistas separadas con `<select name="catalogSection">` y botón `Evolucionar a Producción`.
