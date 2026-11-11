# Sprint Contract (Contrato de Ejecución de Tarea)

Este documento materializa la **Observabilidad de Proceso (Antes de Codificar)**. El Planificador y el Ejecutor (*Maker*) acuerdan el alcance exacto y los criterios verificables de éxito antes de modificar el sistema, evitando desviaciones de alcance (*Scope Creep*) o interpretaciones ambiguas.

---

## Estado Actual del Contrato (`WIP = 0` — `feat-023` Completada y Verificada en `done`)
- **Última tarea completada (`done`):** `feat-023` (*Fuente Única de Verdad para Redes Sociales en `src/config/site.config.ts` (Sin Variables `NEXT_PUBLIC_SOCIAL_*` en `.env`) y Perfil Oficial de LinkedIn (`sebastian-jimenez-aibuilder`)*).
- **Tarea activa (`in-progress`):** Ninguna (`WIP = 0`; `feat-001` a `feat-023` en `"done"`).
- **Hoja de ruta secuencial declarada en el DAG (`feat-022 -> feat-023`):**
  1. **`feat-022`** (`done`, depende de `feat-021`): *Pipeline de Optimización Automática de Imágenes a WebP (`<= 1920x1200 px`, Calidad `0.86`) antes de Subir en `/admin/proyectos`*.
  2. **`feat-023`** (`done`, depende de `feat-022`): *Fuente Única de Verdad para Redes Sociales en `src/config/site.config.ts` (Sin Variables `NEXT_PUBLIC_SOCIAL_*` en `.env`) y Perfil Oficial de LinkedIn (`sebastian-jimenez-aibuilder`)*.
- **Especificación maestra de referencia:** `docs/product-specs/dekolabs-portfolio-spec.md` (Sección 9.7) y `ARCHITECTURE.md`.

---

## Alcance Incluido (`Fair game`) para `feat-023`

### `feat-023`: Fuente Única de Verdad para Redes Sociales en `src/config/site.config.ts` y Perfil Oficial de LinkedIn
1. **Actualización de `DEFAULT_SOCIAL_LINKS_URLS` en `src/config/site.config.ts`**:
   - Actualizar `linkedin` a `"https://www.linkedin.com/in/sebastian-jimenez-aibuilder/"`.
   - Conservar `facebook` (`"https://www.facebook.com/sebastian.jimenez.561437"`), `instagram` (`"https://www.instagram.com/sebastian.1969c/"`) y `whatsapp` (`"https://wa.me/50240275763"`).
2. **Retiro de `process.env.NEXT_PUBLIC_SOCIAL_*` en `getOfficialFooterConfig` (`src/config/site.config.ts`)**:
   - En `getOfficialFooterConfig(overrides?: SocialLinksEnvOverrides)`, resolver cada URL únicamente con `overrides?.<platform>Url` (si se pasa por parámetro) o con `DEFAULT_SOCIAL_LINKS_URLS.<platform>`, sin consultar `process.env.NEXT_PUBLIC_SOCIAL_*`.
3. **Limpieza de `.env.example` (Conservando Intactas Todas las Llaves y Secretos)**:
   - Eliminar de `.env.example` únicamente las 4 variables `NEXT_PUBLIC_SOCIAL_*`.
   - Mantener 100% intactas `ADMIN_USERNAME`, `ADMIN_PASSWORD`, `ADMIN_SESSION_SECRET`, `ADMIN_ACCESS_KEY`, `POSTGRES_USER`, `POSTGRES_PASSWORD`, `POSTGRES_DB`, `DATABASE_URL`, `CATALOG_UPLOADS_DIR` y `HOMELAB_*`.
4. **Pruebas Unitarias (`tests/official-footer.test.ts`)**:
   - Actualizar las aserciones de `DEFAULT_SOCIAL_LINKS_URLS.linkedin` a `"https://www.linkedin.com/in/sebastian-jimenez-aibuilder/"`.
   - Verificar que `.env.example` NO contiene `NEXT_PUBLIC_SOCIAL_` pero sí conserva `ADMIN_PASSWORD`, `ADMIN_SESSION_SECRET`, `ADMIN_ACCESS_KEY` y `DATABASE_URL`.
   - Verificar que aunque `process.env.NEXT_PUBLIC_SOCIAL_*` tenga valores antiguos en el entorno, `getOfficialFooterSnapshot()` los ignora por completo y devuelve `DEFAULT_SOCIAL_LINKS_URLS`.

---

## Exclusiones Explícitas (Qué NO se va a tocar bajo ninguna circunstancia)
- **Prohibido tocar o alterar cualquier variable de entorno de llaves, contraseñas, sesiones o base de datos** (`ADMIN_*`, `POSTGRES_*`, `DATABASE_URL`, `CATALOG_UPLOADS_DIR`, `HOMELAB_*`).
- **Prohibido modificar el historial cerrado** de `feat-001` a `feat-022` en `feature_list.json`.
- **Prohibido violar las 6 capas**.

## Estándares de Verificación ("Hecho" significa exactamente esto)
1. Ejecutar estrictamente una sola tarea a la vez (`WIP = 1`) pasando `feat-023` a `in-progress` al iniciar.
2. `bash ./init.sh`, `bash scripts/check-architecture.sh` y `node scripts/validate-harness.mjs --min-score 100` devuelven código `0` y `Overall: 100/100` (`0 CRLF`, `0 UTF-8 BOM`).
