# Sprint Contract (Contrato de Ejecución de Tarea)

Este documento materializa la **Observabilidad de Proceso (Antes de Codificar)**. El Planificador y el Ejecutor (*Maker*) acuerdan el alcance exacto y los criterios verificables de éxito antes de modificar el sistema, evitando desviaciones de alcance (*Scope Creep*) o interpretaciones ambiguas.

---

## Estado Actual del Contrato (`WIP = 0` — `feat-017` Completada y `feat-018` Lista para Iniciar)
- **Última tarea completada (`done`):** `feat-017` (*Enlaces Reales de Contacto (WhatsApp +502 40275763, Instagram, Facebook), Corrección Ortográfica (Navegación y Copyright 'Sebastián Jiménez') y Metadatos OpenGraph / Títulos sin Duplicación*).
- **Tarea activa (`in-progress`):** Ninguna (`WIP = 0` al cierre de `feat-017`; la siguiente tarea secuencial es **`feat-018`**).
- **Siguiente tarea secuencial lista para iniciar:** **`feat-018`** (*Corrección Quirúrgica en Vista de Detalle (`/sistemas/[slug]`): Desduplicación de Párrafo Inicial y Retiro de Botones Autoreferenciados*).
- **Hoja de ruta secuencial declarada en el DAG (`feat-017 -> feat-018 -> feat-019`):**
  1. **`feat-017`** (`done`, depende de `feat-016`): *Enlaces Reales de Contacto (WhatsApp +502 40275763, Instagram, Facebook), Corrección Ortográfica (Navegación y Copyright 'Sebastián Jiménez') y Metadatos OpenGraph / Títulos sin Duplicación*.
  2. **`feat-018`** (`not-started`, depende de `feat-017`): *Corrección Quirúrgica en Vista de Detalle (`/sistemas/[slug]`): Desduplicación de Párrafo Inicial y Retiro de Botones Autoreferenciados*.
  3. **`feat-019`** (`not-started`, depende de `feat-018`): *Sección `#stack-tecnologico` ('En Construcción') en la Página de Inicio (`/`) Conectada al Menú Superior*.
- **Especificación maestra de referencia:** `docs/product-specs/dekolabs-portfolio-spec.md` (Sección 9), `docs/design-docs/homelab-deployment.md`, `docs/RELIABILITY.md`, `docs/SECURITY.md` y `ARCHITECTURE.md`.

## Justificación de Dependencias en `package.json` (Regla Dura #4 de `ARCHITECTURE.md`)
- **Runtime (`dependencies`) — Sin dependencias nuevas requeridas para `feat-017`..`feat-019`**:
  - `next` (`^15.2.0`), `react` (`^19.0.0`), `react-dom` (`^19.0.0`), `pg` (`^8.23.1`).
- **Desarrollo y Verificación (`devDependencies`)**:
  - `typescript`, `@types/node`, `@types/react`, `@types/react-dom`, `@types/pg`, `tailwindcss`, `@tailwindcss/postcss`, `postcss`, `vitest`.

---

## Alcance Incluido (`Fair game`) por Tarea Secuencial

### Fase 1 — `feat-017`: Enlaces Reales de Contacto, Corrección Ortográfica y Metadatos OpenGraph / Títulos sin Duplicación
1. **Enlaces Reales por Defecto en `src/config/site.config.ts` (`DEFAULT_SOCIAL_LINKS_URLS`) y `.env.example`**:
   - `whatsapp`: `"https://wa.me/50240275763"` (`+502 40275763`)
   - `instagram`: `"https://www.instagram.com/sebastian.1969c/"`
   - `facebook`: `"https://www.facebook.com/sebastian.jimenez.561437"`
   - `linkedin`: `"https://www.linkedin.com/in/sebastian-jimenez-dekolabs"`
2. **Corrección Ortográfica en Navegación y Copyright (`src/config/site.config.ts` y `src/ui/components/AppShell.tsx`)**:
   - Actualizar `SITE_NAVIGATION` (`src/config/site.config.ts`) y `renderTwoLineNavLabel` (`src/ui/components/AppShell.tsx`) con tildes correctas:
     - `"STACK TECNOLÓGICO"` (`STACK` / `TECNOLÓGICO`)
     - `"MÁS PROYECTOS DE IA"` (`MÁS PROYECTOS` / `DE IA`)
   - Actualizar en `src/config/site.config.ts`:
     - `OFFICIAL_AUTHOR_CREDIT = "Creado por Sebastián Jiménez"`
     - `OFFICIAL_COPYRIGHT_NOTICE = "© 2026 · Creado por Sebastián Jiménez"` (sin duplicar `2026` y con tildes en `Sebastián Jiménez`).
3. **Metadatos `<title>` Sin Sufijo Repetido e Imagen OpenGraph (`src/app/layout.tsx`, `src/app/proyectos-ia/page.tsx`, `src/app/sistemas/[slug]/page.tsx`)**:
   - En `src/app/proyectos-ia/page.tsx`: `title: "Más Proyectos de IA — Google ADK & Sistemas RAG"` (sin concatenar `| Sebastián J — dekolabs.org` para no duplicar con `title.template` de `src/app/layout.tsx`).
   - En `src/app/sistemas/[slug]/page.tsx`: `title: deepDive.system.title` (y `title: "Sistema No Encontrado"` en el caso 404).
   - En `src/app/layout.tsx` y `src/app/sistemas/[slug]/page.tsx`: incluir `openGraph.images` y `twitter.images` (`/assets/deco-vintage-preview.png` y `deepDive.system.previewImageSrc`).
4. **Sincronización de Pruebas**:
   - Actualizar `tests/official-footer.test.ts`, `tests/site.service.test.ts` y `tests/ai-projects-page.test.ts`.

---

### Fase 2 — `feat-018`: Corrección Quirúrgica en `/sistemas/[slug]` (Desduplicación de Párrafo Inicial y Navegación Inferior)
1. **Desduplicación de `subtitle` y `summary` (`src/repo/systems.repo.ts`, `src/service/systems.service.ts`, `src/ui/components/SystemDetailView.tsx`)**:
   - En `src/repo/systems.repo.ts`, quitar de `summary` en `deco-vintage-platform` la primera frase repetida (`"Plataforma e-commerce full-stack e infraestructura multimedia sin estado para comercialización y cotización dinámica de cuadros decorativos (+540 obras)."`), dejando que `summary` empiece directamente con `"Diseñada con procesamiento de imágenes en memoria mediante semáforos de concurrencia libvips..."`.
   - Exportar en `src/service/systems.service.ts` la función pura `deduplicateSystemSummary(subtitle: string, summary: string): string` y aplicarla en `getProductionSystemDeepDiveBySlug`, `getProductionSystemDeepDiveBySlugAsync` y `SystemDetailView.tsx` para que, aunque el registro provenga de PostgreSQL (`dekolabs-db`) con el texto antiguo, nunca se muestre repetido.
2. **Retiro de Botones `SISTEMA ANTERIOR` / `SIGUIENTE SISTEMA` Autoreferenciados (`src/ui/components/SystemDetailView.tsx`)**:
   - Cuando `previousSystem.slug === system.slug` (solo 1 sistema en el catálogo), ocultar las 2 tarjetas que se apuntan a sí mismas y renderizar una barra limpia con `← VOLVER A SISTEMAS EN PRODUCCIÓN` (`href="/#proyectos-destacados"`) y `SOLICITAR IMPLEMENTACIÓN SIMILAR →` (`href="/#contacto"`).
   - Conservar las tarjetas `SISTEMA ANTERIOR` / `SIGUIENTE SISTEMA` cuando `previousSystem.slug !== system.slug` (2 o más sistemas).
3. **Pruebas (`tests/system-detail.test.ts`)**:
   - Verificar con `renderToStaticMarkup(SystemDetailView)` que para 1 sistema no hay párrafo repetido ni botones autoreferenciados, y que para 2+ sistemas sí se renderiza la navegación cíclica.

---

### Fase 3 — `feat-019`: Sección `#stack-tecnologico` ("En Construcción") en la Página de Inicio (`/`)
1. **Componente `src/ui/components/TechStackSection.tsx` e Integración en `src/app/page.tsx`**:
   - Crear `src/ui/components/TechStackSection.tsx` con `<section id="stack-tecnologico" aria-labelledby="tech-stack-heading">`, estética *Atelier Monolith*, etiqueta `02 // ARQUITECTURA & HERRAMIENTAS`, título `STACK TECNOLÓGICO`, badge **`SECCIÓN EN CONSTRUCCIÓN`** y tarjeta descriptiva de curaduría técnica.
   - Integrar `<TechStackSection />` en `src/app/page.tsx` debajo de `<ProductionSystemsSection />`.
2. **Pruebas (`tests/harness-deprecation-dag.test.ts` y `tests/ai-projects-page.test.ts`)**:
   - Registrar `'TechStackSection.tsx'` en `activeComponents` de `tests/harness-deprecation-dag.test.ts` y verificar en `tests/ai-projects-page.test.ts` que `HomePage` renderiza `id="stack-tecnologico"` y `"SECCIÓN EN CONSTRUCCIÓN"`.

---

## Exclusiones Explícitas (Qué NO se va a tocar bajo ninguna circunstancia en `feat-017`..`feat-019`)
- **Prohibido tocar el cuadro `KERNEL & HOME LAB TELEMETRY` (`HERO_TELEMETRY_CARD` / `HeroSection.tsx`)**: reservado explícitamente para diseñarlo entre Sebastián y el agente principal en la siguiente fase.
- **Prohibido crear o modificar `favicon.ico`**: Sebastián está diseñando el favicon oficial y lo entregará en la siguiente fase.
- **Prohibido modificar el historial cerrado** de `feat-001` a `feat-016` en `feature_list.json`.
- **Prohibido violar las 6 capas**: ningún archivo en `src/app/` ni en `src/ui/` puede importar directamente desde `src/config/` o `src/repo/`.

## Estándares de Verificación ("Hecho" significa exactamente esto)
1. Ejecutar estrictamente una sola tarea a la vez (`WIP = 1`) respetando el orden secuencial `feat-017 -> feat-018 -> feat-019` y actualizando `sprint-contract.md` al activar cada tarea.
2. `bash ./init.sh`, `bash scripts/check-architecture.sh` y `node scripts/validate-harness.mjs --min-score 100` devuelven código `0` y `Overall: 100/100` (`0 CRLF`, `0 UTF-8 BOM`).
