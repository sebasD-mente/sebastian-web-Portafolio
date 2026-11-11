# Sprint Contract (Contrato de Ejecución de Tarea)

Este documento materializa la **Observabilidad de Proceso (Antes de Codificar)**. El Planificador y el Ejecutor (*Maker*) acuerdan el alcance exacto y los criterios verificables de éxito antes de modificar el sistema, evitando desviaciones de alcance (*Scope Creep*) o interpretaciones ambiguas.

---

## Estado Actual del Contrato (`WIP = 0` — `feat-021` Completada y Verificada en `"done"`)
- **Última tarea completada (`done`):** `feat-021` (*Botón `'⚡ Importar JSON del Agente'` en `/admin/proyectos` (Autorrelleno en 1 Clic) y Botón Discreto de Engranaje hacia `/admin/login` en el Pie de Página*).
- **Tarea activa (`in-progress`):** Ninguna (`WIP = 0`; `feat-001` a `feat-021` en `"done"`).
- **Hoja de ruta secuencial declarada en el DAG (`feat-020 -> feat-021`):**
  1. **`feat-020`** (`done`, depende de `feat-019`): *Monitor de Telemetría en Tiempo Real del Servidor `serverdmente` (`HOME-LAB // SERVERDMENTE`) en el Hero y `/api/telemetry`*.
  2. **`feat-021`** (`done`, depende de `feat-020`): *Botón `'⚡ Importar JSON del Agente'` en `/admin/proyectos` (Autorrelleno en 1 Clic) y Botón Discreto de Engranaje hacia `/admin/login` en el Pie de Página*.
- **Especificación maestra de referencia:** `docs/product-specs/dekolabs-portfolio-spec.md` (Sección 9.5), `ARCHITECTURE.md` y Skill Global `~/.gemini/config/skills/dekolabs-project-extractor/SKILL.md`.

## Justificación de Dependencias en `package.json` (Regla Dura #4 de `ARCHITECTURE.md`)
- **Runtime (`dependencies`) — Sin dependencias nuevas requeridas para `feat-021`**:
  - `next` (`^15.2.0`), `react` (`^19.0.0`), `react-dom` (`^19.0.0`), `pg` (`^8.23.1`).

---

## Alcance Incluido (`Fair game`) para `feat-021`

### `feat-021`: Botón `'⚡ Importar JSON del Agente'` en `/admin/proyectos` + Engranaje Discreto hacia `/admin/login` en `OfficialFooter`
1. **Parser y Normalizador Puro (`parseAgentProjectJsonToDraft` en `src/ui/components/CatalogAdminView.tsx`)**:
   - Exportar `parseAgentProjectJsonToDraft(rawInput: string, fallbackOrder: string = "02"): { ok: true; draft: ProductionSystemUpsertInput } | { ok: false; error: string }`.
   - Limpiar delimitadores Markdown opcionales (````json ... ```` o ```` ... ````) si el usuario copió el bloque directamente desde la respuesta del agente.
   - Parsear con `JSON.parse` y verificar que sea un objeto válido con `title` y `summary` no vacíos.
   - Derivar `slug` mediante `slugifyProjectTitle(parsed.slug || parsed.title)` y normalizar la estructura completa usando `convertSystemToFormInput` para rellenar todos los campos de los Bloques A, B, C y D (`catalogSection`, `order`, `versionBadge`, `projectHeaderLabel`, `title`, `slug`, `categoryLabel`, `summary`, `stackTags`, `highlightedStackTag`, `architectureSpecs`, `liveUrl`, `featuredOnHome`, `previewImageSrc`, `galleryImages`, `subtitle`, `status`, `architecturalNarrative`, `deploymentLedger`, `pipelineStages`, `codeTabs`, `solvedChallenges`).
2. **Interfaz de Importación en `CatalogAdminView.tsx` (`viewMode === "form"`)**:
   - Añadir el botón **`⚡ Importar JSON del Agente`** en la cabecera de acciones del modo formulario.
   - Al hacer clic, mostrar/ocultar un panel accesible (`id="agent-json-import-panel"`) con `<textarea id="agent-project-json-textarea">`, mensaje de error en español cuando el JSON sea inválido, y botón **`Autorrellenar los 4 Bloques`** que actualice `formState`, limpie `fieldErrors`, cierre el panel y muestre confirmación en `statusBanner`.
3. **Botón Muy Discreto de Engranaje en `src/ui/components/OfficialFooter.tsx`**:
   - En la franja inferior institucional de `OfficialFooter.tsx` (al lado de `{footer.technicalNote}`), colocar un enlace minimalista `<a href="/admin/login" aria-label="Acceso de administrador" data-admin-login-trigger="true">` que contenga **únicamente un ícono vectorial SVG de engranaje pequeño (`w-3.5 h-3.5`, `aria-hidden="true"`)**, **sin texto visible y sin atributo `title`**, con estilo discreto (`text-[#9CA3AF] hover:text-[#4B5563] opacity-60 hover:opacity-100`).
4. **Pruebas Unitarias (`tests/postgres-catalog-and-gallery.test.ts` y `tests/official-footer.test.ts`)**:
   - En `tests/postgres-catalog-and-gallery.test.ts`: probar `parseAgentProjectJsonToDraft` (JSON limpio, bloque ````json`, y manejo de errores) y comprobar que `CatalogAdminView` en `initialViewMode="form"` renderiza el botón **`⚡ Importar JSON del Agente`**.
   - En `tests/official-footer.test.ts`: actualizar `expect(svgMatches).toHaveLength(5)` (4 íconos de redes + 1 engranaje discreto) y verificar que `OfficialFooter` renderiza `href="/admin/login"` con `data-admin-login-trigger="true"`, sin atributo `title` ni texto visible.

---

## Exclusiones Explícitas (Qué NO se va a tocar bajo ninguna circunstancia)
- **Prohibido crear o modificar `favicon.ico`**.
- **Prohibido poner texto visible o atributo `title` en el botón del engranaje del pie de página** (solo el ícono pequeño de engranaje con `aria-label` para lectores de pantalla).
- **Prohibido modificar el historial cerrado** de `feat-001` a `feat-020` en `feature_list.json`.
- **Prohibido violar las 6 capas**: `CatalogAdminView.tsx` y `OfficialFooter.tsx` pertenecen a `src/ui/components/` y no pueden importar desde `src/config/` ni `src/repo/`.

## Estándares de Verificación ("Hecho" significa exactamente esto)
1. Ejecutar estrictamente una sola tarea a la vez (`WIP = 1`) pasando `feat-021` a `in-progress` al iniciar.
2. `bash ./init.sh`, `bash scripts/check-architecture.sh` y `node scripts/validate-harness.mjs --min-score 100` devuelven código `0` y `Overall: 100/100` (`0 CRLF`, `0 UTF-8 BOM`).
