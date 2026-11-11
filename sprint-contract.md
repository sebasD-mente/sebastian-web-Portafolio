# Sprint Contract (Contrato de Ejecución de Tarea)

Este documento materializa la **Observabilidad de Proceso (Antes de Codificar)**. El Planificador y el Ejecutor (*Maker*) acuerdan el alcance exacto y los criterios verificables de éxito antes de modificar el sistema, evitando desviaciones de alcance (*Scope Creep*) o interpretaciones ambiguas.

---

## Estado Actual del Contrato (`WIP = 0` — `feat-022` Declarada y Lista para Ejecución)
- **Última tarea completada (`done`):** `feat-021` (*Botón `'⚡ Importar JSON del Agente'` en `/admin/proyectos` (Autorrelleno en 1 Clic) y Botón Discreto de Engranaje hacia `/admin/login` en el Pie de Página*).
- **Siguiente tarea planificada (`not-started`):** `feat-022` (*Pipeline de Optimización Automática de Imágenes a WebP (`<= 1920x1200 px`, Calidad `0.86`) en `/admin/proyectos` y Bloqueo de URLs Placeholder Heredadas en `.env`*).
- **Tarea activa (`in-progress`):** Ninguna (`WIP = 0`; el agente ejecutor debe pasar `feat-022` a `in-progress` al iniciar su turno).
- **Hoja de ruta secuencial declarada en el DAG (`feat-021 -> feat-022`):**
  1. **`feat-021`** (`done`, depende de `feat-020`): *Botón `'⚡ Importar JSON del Agente'` en `/admin/proyectos` (Autorrelleno en 1 Clic) y Botón Discreto de Engranaje hacia `/admin/login` en el Pie de Página*.
  2. **`feat-022`** (`not-started`, depende de `feat-021`): *Pipeline de Optimización Automática de Imágenes a WebP (`<= 1920x1200 px`, Calidad `0.86`) en `/admin/proyectos` y Bloqueo de URLs Placeholder Heredadas en `.env`*.
- **Especificación maestra de referencia:** `docs/product-specs/dekolabs-portfolio-spec.md` (Sección 9.6) y `ARCHITECTURE.md`.

## Justificación de Dependencias en `package.json` (Regla Dura #4 de `ARCHITECTURE.md`)
- **Runtime (`dependencies`) — Sin dependencias nuevas requeridas para `feat-022`**:
  - `next` (`^15.2.0`), `react` (`^19.0.0`), `react-dom` (`^19.0.0`), `pg` (`^8.23.1`).

---

## Alcance Incluido (`Fair game`) para `feat-022`

### `feat-022`: Pipeline de Optimización Automática de Imágenes a WebP (`<= 1920x1200 px`, Calidad `0.86`) + Bloqueo de URLs Placeholder Antiguas en `.env`
1. **Funciones Puras de Dimensionamiento y Formato (`src/ui/components/CatalogAdminView.tsx`)**:
   - Exportar `MAX_OPTIMIZED_IMAGE_WIDTH = 1920`, `MAX_OPTIMIZED_IMAGE_HEIGHT = 1200` y `WEBP_COMPRESSION_QUALITY = 0.86`.
   - Exportar `computeOptimizedImageDimensions(width: number, height: number, maxWidth = 1920, maxHeight = 1200): { width: number; height: number; wasResized: boolean }`.
   - Exportar `replaceFileExtensionWithWebp(filename: string): string` y `formatOptimizationSummary(originalBytes: number, optimizedBytes: number, width: number, height: number): string`.
2. **Compresor WebP en el Navegador (`optimizeImageFileForUpload` en `src/ui/components/CatalogAdminView.tsx`)**:
   - Exportar `optimizeImageFileForUpload(file: File): Promise<{ file: File; originalBytes: number; optimizedBytes: number; width: number; height: number; optimizationSummary: string }>`.
   - Integrar `optimizeImageFileForUpload(file)` al inicio de `uploadImageFileToServer(file)` antes de enviar el `FormData` a `/api/admin/upload`.
   - Ampliar `UploadSlotStatus` con `optimizationSummary?: string | null` y mostrar en las 4 ranuras (Portada + `VIEW 01..03`) la guía **`1920×1200 px (16:10) · Auto-WebP 86%`** y el resumen del ahorro logrado.
3. **Bloqueo de URLs Placeholder Antiguas del `.env` en `src/config/site.config.ts`**:
   - Exportar `LEGACY_PLACEHOLDER_SOCIAL_URLS` (`https://www.facebook.com/dekolabs`, `https://www.instagram.com/dekolabs`, `https://wa.me/573000000000`, ignorando mayúsculas y slash final).
   - En `resolveSafeSocialUrl(rawValue, fallbackUrl)`, si `rawValue` coincide con cualquiera de los placeholders antiguos en `LEGACY_PLACEHOLDER_SOCIAL_URLS`, descartarlo y devolver `fallbackUrl` (`DEFAULT_SOCIAL_LINKS_URLS`: WhatsApp `https://wa.me/50240275763`, Instagram `https://www.instagram.com/sebastian.1969c/`, Facebook `https://www.facebook.com/sebastian.jimenez.561437`).
4. **Pruebas Unitarias (`tests/catalog-admin-ui.test.ts` y `tests/official-footer.test.ts`)**:
   - En `tests/catalog-admin-ui.test.ts`: verificar `computeOptimizedImageDimensions`, `replaceFileExtensionWithWebp`, `formatOptimizationSummary`, `optimizeImageFileForUpload` y la guía `1920×1200 px (16:10) · Auto-WebP 86%`.
   - En `tests/official-footer.test.ts`: verificar que si `process.env.NEXT_PUBLIC_SOCIAL_FACEBOOK_URL = "https://www.facebook.com/dekolabs"`, `NEXT_PUBLIC_SOCIAL_INSTAGRAM_URL = "https://www.instagram.com/dekolabs"` y `NEXT_PUBLIC_SOCIAL_WHATSAPP_URL = "https://wa.me/573000000000"`, `getOfficialFooterSnapshot()` los ignora y retorna las URLs reales de Sebastián.

---

## Exclusiones Explícitas (Qué NO se va a tocar bajo ninguna circunstancia)
- **Prohibido renombrar o borrar `/assets/deco-vintage-preview.png`**.
- **Prohibido modificar el historial cerrado** de `feat-001` a `feat-021` en `feature_list.json`.
- **Prohibido violar las 6 capas**: `CatalogAdminView.tsx` pertenece a `src/ui/components/` y no puede importar desde `src/config/` ni `src/repo/`.

## Estándares de Verificación ("Hecho" significa exactamente esto)
1. Ejecutar estrictamente una sola tarea a la vez (`WIP = 1`) pasando `feat-022` a `in-progress` al iniciar.
2. `bash ./init.sh`, `bash scripts/check-architecture.sh` y `node scripts/validate-harness.mjs --min-score 100` devuelven código `0` y `Overall: 100/100` (`0 CRLF`, `0 UTF-8 BOM`).
