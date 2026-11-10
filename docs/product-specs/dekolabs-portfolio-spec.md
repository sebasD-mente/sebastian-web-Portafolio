# Especificación de Producto y Sistema Visual — `dekolabs.org`

- **Proyecto:** Portafolio Comercial y Galería de Sistemas en Producción de **Sebastián** (`sebastian-web-portafolio`)
- **Dominio Oficial:** `https://dekolabs.org`
- **Infraestructura Objetivo:** Contenedor Docker `standalone` (`node:22-alpine`) en **Ubuntu Linux Home Lab** detrás de Reverse Proxy existente hacia el puerto interno `3000`
- **Identidad Comercial:** 100% Marca Personal (**Sebastián — Principal Software & AI Architect**) bajo el dominio `dekolabs.org`
- **Referencia Visual Base:** Proyecto Google Stitch `projects/10491405022475068698` (*Minimalist Software Developer Portfolio* — Sistema de Diseño **Atelier Monolith**)

---

## 1. Propósito Comercial y Posicionamiento

`dekolabs.org` es la vitrina de ingeniería de software y arquitectura de agentes autónomos de **Sebastián**. Su diseño evita el formato de currículum genérico o agencia recargada y opera como una **galería técnica de sistemas reales en producción**:
1. **Protagonismo absoluto de los productos en producción:** Presentar la arquitectura, métricas operativas, diagramas de flujo, consola de telemetría e inspección de código real de cada sistema.
2. **Entorno de Orquestación de Agentes e Ingeniería de Arneses:** Demostrar cómo el stack tecnológico de Sebastián y su entorno de desarrollo gobernado por el **Arnés Camaleón Universal v2.1** (con separación *Maker-Checker* `one-shot`, protocolo MCP, validación de 6 capas y 3 puertas deterministas) multiplican la velocidad, seguridad y calidad en proyectos para clientes.
3. **Conversión Comercial Clara (Freelance / Contratos de Implementación / Advisory):** Facilitar que clientes, fundadores y líderes técnicos contraten a Sebastián de forma independiente para implementaciones *end-to-end*, despliegues de agentes IA, arquitecturas distribuidas o infraestructura auto-alojada.

---

## 2. Sistema de Diseño: *Atelier Monolith* (Extraído de Google Stitch)

Estética inspirada en el **Estilo Tipográfico Internacional Suizo** fusionado con instrumentación moderna de ingeniería: austero, hiper-enfocado, geométrico y sin adornos superfluos.

### 2.1 Paleta Cromática Dual (Modo Claro Predeterminado + Modo Oscuro)

El sitio arranca con el **Modo Claro (`class="light"`) como tema predeterminado**, proyectando limpieza editorial suiza, máxima legibilidad y sobriedad comercial desde el primer vistazo, e incluye un conmutador instantáneo al **Modo Oscuro (`class="dark"`)** en el Header.

| Token Semántico | Modo Claro (Default — `class="light"`) | Modo Oscuro (`class="dark"`) | Uso Arquitectónico |
| :--- | :--- | :--- | :--- |
| **`background` / `surface`** | `#FFFFFF` (Blanco Puro) | `#121314` / `#000000` (Obsidiana) | Lienzo base de la galería |
| **`surface-container-lowest`** | `#FFFFFF` / `#FAFAFA` | `#0D0E0F` / `#0A0A0A` | Fondos de marcos, tarjetas elevadas y barras de estado |
| **`surface-container-low`** | `#F3F4F6` / `#F4F4F5` | `#1B1C1C` / `#141414` | Tarjetas de sistemas en producción y paneles técnicos |
| **`surface-container-high`** | `#E5E7EB` | `#292A2A` | Chips de stack, divisores y botones secundarios |
| **`outline-variant`** | `#D1D5DB` / `#E5E5E5` (`1px solid`) | `#444748` / `#262626` (`1px solid`) | Hairlines de precisión (cero sombras difusas decorativas) |
| **`primary`** | `#0D0E0F` / `#0A0A0A` | `#FFFFFF` (Blanco Puro) | Titulares principales, CTAs primarios e inversión de alto contraste |
| **`on-surface-variant`** | `#4B5563` / `#525252` | `#C4C7C8` / `#A3A3A3` | Cuerpo editorial y descripciones técnicas |
| **`secondary` (Tech Blue)** | `#2563EB` | `#7BD0FF` / `#38BDF8` | Estados activos del runtime, trazas de arquitectura y enlaces técnicos |
| **`tertiary-fixed` (Emerald Pulse)** | `#059669` | `#6FFBBE` / `#10B981` | Indicadores de producción en vivo, SLOs cumplidos y nodos online |
| **`amber-notice`** | `#D97706` | `#F59E0B` | Nodos experimentales, builds canary o alertas operativas |

### 2.2 Tipografía de Doble Motor y Escala

- **Titulares y Cuerpo Editorial (`Inter` / `Space Grotesk`):**
  - `display-xl`: `4.5rem` (`72px`), `line-height: 4.75rem`, `letter-spacing: -0.04em`, `font-weight: 600` (Móvil: `2.75rem`).
  - `headline-lg`: `2.5rem` (`40px`), `line-height: 2.75rem`, `letter-spacing: -0.03em`, `font-weight: 500` (Móvil: `1.75rem`).
  - `headline-md`: `1.5rem` (`24px`), `line-height: 1.875rem`, `letter-spacing: -0.02em`, `font-weight: 500`.
  - `body-lg` (`1.125rem`) / `body-md` (`0.9375rem`) / `body-sm` (`0.8125rem`).
- **Telemetría, Código y Metadatos (`JetBrains Mono`):**
  - `mono-code`: `0.875rem` (`14px`), `line-height: 1.375rem`, `font-feature-settings: "tnum"`.
  - `mono-label`: `0.6875rem` (`11px`), `uppercase`, `letter-spacing: 0.06em`, `font-weight: 500` para etiquetas de estado, hashes de commit, latencias y tags del stack.

### 2.3 Retícula Suiza y Geometría

- **Contenedor Máximo:** `1440px` centrado con márgenes adaptativos (`1.25rem` móvil, `2.5rem` tablet, `4rem` desktop).
- **Retícula:** 12 columnas en desktop (`gap: 2.5rem` / `40px`), 8 en tablet (`24px`), 4 en móvil (`16px`).
- **Bordes y Esquinas:** Esquinas geométricas controladas (`2px` a `4px` en botones, chips y tarjetas) delimitadas por bordes `1px solid` y cabeceras con oclusión esmerilada (`backdrop-filter: blur(12px)`).

---

## 3. Mapa de Pantallas y Módulos Funcionales (Basado en Pantallas de Stitch)

### 3.1 Barra Superior de Telemetría y Header Fijo
- **Ambient Telemetry Strip:** Indicador en vivo del nodo `HOME-LAB: UBUNTU-NODE-01 · ONLINE`, latencia de red, SLO de disponibilidad y revisión desplegada en `dekolabs.org`.
- **Header Principal:** Monograma + `SEBASTIÁN // Principal Software & AI Architect`, navegación por secciones (`Sistemas en Producción`, `Orquestación Agéntica & Stack`, `Telemetría Home Lab`, `Contacto`), badge pulsante `AVAILABLE FOR FREELANCE & IMPLEMENTATION CONTRACTS`, conmutador instantáneo Dark/Light y botón primario `Contratar / Hablemos`.

### 3.2 Hero Editorial + Tarjeta `KERNEL & HOME LAB TELEMETRY` + Franja de Benchmarks
- **Columna Izquierda (8 cols):** Posicionamiento de Sebastián diseñando sistemas en producción de alta resiliencia, arquitecturas de agentes autónomos e infraestructura moderna lista para escalar. Doble CTA: `Explorar Sistemas en Producción` y `Discutir Proyecto`.
- **Columna Derecha (4 cols):** Tarjeta de telemetría en vivo con métricas operativas del entorno (contenedores activos, latencia P99, puertas del arnés `100/100`, uptime en Ubuntu Home Lab) y gráfico SVG sparkline.
- **Franja de 4 KPIs Industriales:** Resumen cuantitativo del impacto técnico y garantías de entrega.

### 3.3 Catálogo Operacional: 4 Sistemas en Producción (`#proyectos-destacados`)
Estructura exacta del prototipo Stitch (`c3fb19d306f343d2bb456385f9a6f7c6` y `e8864088bfaa4c509d449223f881e21c`):
1. **Sistema Principal 01 (Layout 12 cols — 7 Media / 5 Especificación):** Vista previa de alta resolución con píldora de métricas en vivo, desglose de stack en `JetBrains Mono`, especificaciones de arquitectura y botones hacia `Probar Sistema en Vivo` y `Detalle de Arquitectura (/sistemas/[slug])`.
2. **Sistema Principal 02 (Layout 12 cols invertido — 5 Especificación / 7 Media):** Segundo sistema estrella en producción con métricas de latencia/integridad y acceso a su caso de estudio profundo.
3. **Fila Secundaria Split (2 Columnas iguales — Sistema 03 y Sistema 04):**
   - **Sistema 03 (Orquestación de Agentes IA & Harness Engineering):** Plataforma/entorno de agentes autónomos con grafo DAG, protocolo MCP y verificación determinista.
   - **Sistema 04 (Infraestructura, Datos & Tooling en Producción):** Herramienta de infraestructura y automatización de alto rendimiento.

### 3.4 Vista de Detalle Técnico Profundo (`/sistemas/[slug]`)
Basada fielmente en la pantalla `606e1d34c8cd4d3f8f0f4b26306dcb56` de Stitch:
- **Breadcrumb de Telemetría:** Retorno al catálogo + estado del nodo + badge de verificación.
- **Hero del Sistema + Ledger de Metadata de Despliegue:** Arquitectura, Commit SHA, Host OS (`Ubuntu Linux / Docker Engine`), estado de métricas y enlaces a demo en vivo y repositorio.
- **Grid de 4 KPIs del Sistema:** Throughput, latencia, capa de ejecución y huella de memoria.
- **Consola de Mando y Diagnóstico:** Ventana técnica con captura/telemetría de alta resolución del sistema.
- **Topología del Pipeline y Mecánica de Arquitectura:** Diagrama esquemático vectorial/alta resolución acompañado de las **3 Etapas del Pipeline** (`ETAPA 01`, `ETAPA 02`, `ETAPA 03`).
- **Matriz del Stack Técnico + Inspector Interactivo de Código con Pestañas:** Tabla de capas/dependencias a la izquierda y visor de código en solo lectura con selector de pestañas funcionales a la derecha.
- **3 Desafíos de Ingeniería Resueltos:** Tarjetas numeradas (`01`, `02`, `03`) explicando el problema técnico, la solución arquitectónica y el resultado medible.

### 3.5 Módulo Especial: *Agentic Orchestration, Stack & Harness Engineering*
- Demostración interactiva de cómo Sebastián construye software combinando un stack full-stack/cloud robusto con **orquestación de agentes autónomos**:
  - **Arquitectura de 6 Capas (`Types -> Config -> Repo -> Service -> Runtime -> UI`)**: Explicación visual de cómo cada entrega mantiene fronteras limpias verificadas mecánicamente.
  - **Flujo Maker-Checker (`One-Shot` + `Zero-Inheritance`) y MCP**: Cómo los agentes constructores y auditores independientes aceleran el desarrollo sin sacrificar seguridad ni calidad.
  - **Capacidades del Stack para Clientes**: Cómo este entorno permite entregar MVPs en producción, integraciones de IA, automatización de procesos y sistemas empresariales en tiempos récord bajo contratos de implementación o modalidad freelance.

### 3.6 Terminal Interactiva & Stream de Telemetría del Ubuntu Home Lab
- Consola en vivo (`TTY` stream) e indicadores conectados a `/api/telemetry` y `/api/health`:
  - Muestra el estado real del contenedor ejecutándose en el **Home Lab con Ubuntu Linux** (`uptime`, memoria del proceso Node, versión del runtime, estado de nodos/contenedores configurados y latencia), con fallback determinista libre de errores cuando se previsualiza fuera del cluster.

### 3.7 CTA de Contratación y Modalidades de Colaboración Comercial
- Sección ejecutiva para iniciar conversación o agendar sesión técnica con Sebastián:
  - Modalidades claras: **Contratos de Implementación End-to-End**, **Desarrollo de Sistemas y Agentes IA**, **Arquitectura & Self-Hosting / Home Lab Cloud**, y **Consultoría / Freelance Especializado**.
  - Canal de contacto directo y validación estructurada.

---

## 4. Arquitectura de 6 Capas en Next.js 15 (`src/`)

Para cumplir al 100% con `scripts/check-architecture.sh` (cero saltos de capa `UI -> Repo` o `UI -> Config` y cero dependencias hacia atrás):

1. **`src/types/` (`Types`)**: Contratos TypeScript puros (`ProductionSystem`, `SystemMetric`, `PipelineStage`, `CodeSnippetTab`, `SolvedChallenge`, `AgenticWorkflowNode`, `StackCapability`, `HomeLabTelemetrySnapshot`, `ContactInquiry`).
2. **`src/config/` (`Config`)**: Configuración validada del sitio (`dekolabs.org`), metadatos SEO de Sebastián, tokens de tema *Atelier Monolith* y lectura segura de variables de entorno del contenedor Ubuntu.
3. **`src/repo/` (`Repo`)**: Catálogo estructurado y desacoplado de los sistemas en producción (diseñado como fuente de datos limpia para que Sebastián pueda reemplazar o agregar progresivamente fotos reales, capturas, textos, métricas y proyectos sin tocar la lógica ni romper componentes visuales), especificaciones de casos de estudio, datos del stack/arnés agéntico y adaptador de lectura de métricas del host/contenedor Linux (`os`, `process`, o endpoint interno del Home Lab).
4. **`src/service/` (`Service`)**: Casos de uso y lógica de dominio pura (`getProductionSystems`, `getSystemBySlug`, `getAgenticCapabilities`, `buildHomeLabTelemetryReport`, `validateContactInquiry`).
5. **`src/runtime/` (`Runtime`)**: Controladores de rutas API (`/api/health`, `/api/telemetry`, `/api/contact`) y adaptador de logging estructurado `RuntimeLogEntry` con `correlationId`.
6. **`src/ui/` y `src/app/` (`UI`)**: Componentes visuales *Atelier Monolith* (`src/ui/components/`) y rutas del App Router de Next.js (`src/app/page.tsx`, `src/app/sistemas/[slug]/page.tsx`, `src/app/api/...`), consumiendo exclusivamente `src/service/`, `src/runtime/` y `src/types/`.

---

## 5. Refinamiento Visual v2.2 (`feat-007`) — Des-saturación Editorial, Header Fijo con Logo Personal y Proyecto 01 `DECO VINTAGE PLATFORM`

Por decisión de diseño de Sebastián, la vista principal (`src/app/page.tsx`) se depura radicalmente para eliminar la saturación de información de prototipo y concentrarse exclusivamente en los elementos gráficos y textuales aprobados en la captura de referencia (`C:\Users\sebas\Pictures\Screenshots\Captura de pantalla 2026-11-08 181423.png`).

### 5.1 Activos Gráficos Oficiales (Origen -> Destino en `public/assets/`)
- **Logo de Firma Personal**:
  - Origen: `C:\Users\sebas\Documents\Antigravity Files\ARCHIVOS PORTAFOLIO\lOGO SEBASTIAN J.png`
  - Destino en repositorio: `public/assets/logo-sebastian-j.png` (`Sebastian J — AI Developer & Agentic Builder`).
- **Captura del Proyecto 01 (Deco Vintage Platform)**:
  - Origen: `C:\Users\sebas\Documents\Antigravity Files\ARCHIVOS PORTAFOLIO\TARJETA PRO 1.png`
  - Destino en repositorio: `public/assets/deco-vintage-preview.png`.

### 5.2 Emparejamiento Tipográfico Fiel a la Captura
Para lograr la máxima similitud visual con la captura refinada por Sebastián:
1. **Titular Hero (`h1`)**: `Space Grotesk` / `Inter` (`font-weight: 700`, `tracking: -0.03em`, `line-height: 1.08`), sin etiquetas superiores ni adornos.
2. **Títulos Industriales en Mayúsculas (`SISTEMAS EN PRODUCCIÓN`, `DECO VINTAGE PLATFORM`)**: `Space Grotesk` (`font-weight: 700/800`, `uppercase`, `tracking: -0.02em`).
3. **Cuerpo Editorial (Subtítulo del Hero y Descripción de Tarjeta)**: `Inter` (`font-weight: 400`, lectura limpia y balanceada en `#374151` / `#4B5563`).
4. **Botones de Navegación Superior (`SISTEMAS EN PRODUCCIÓN`, `STACK TECNOLOGICO`, `MAS PROYECTOS DE IA`)**: Fuente monoespaciada técnica (`JetBrains Mono` / `Space Mono`, `uppercase`, `letter-spacing: 0.05em`, centrada en 2 líneas).
5. **Etiquetas de Telemetría y Encabezados de Tarjeta (`KERNEL & HOME LAB TELEMETRY`, `NODE ID`, `PROJECT 01 // ...`, `v3.4.0 PRODUCTION`)**: Fuente técnica pixel/monoespaciada (`Silkscreen` / `Share Tech Mono` + `JetBrains Mono`) que replica la estética de instrumentación de la captura.

### 5.3 Barra Superior Fija (`AppShell.tsx`)
- **Eliminación de Ruido**: Se elimina de la vista la barra superior `Ambient Telemetry Strip`, el monograma `SB // DL`, el badge `AVAILABLE FOR FREELANCE` y el botón `THEME // LIGHT`.
- **Comportamiento**: Fija en la parte superior al hacer scroll (`sticky top-0 z-50 w-full bg-[#F8F9FA]/95 backdrop-blur-md border-b border-[#E5E7EB]`).
- **Estructura Exacta (Izquierda a Derecha)**:
  1. **Logo**: Imagen `/assets/logo-sebastian-j.png` a la izquierda.
  2. **Enlaces de Navegación (Textos Exactos)**:
     - `SISTEMAS EN PRODUCCIÓN` (`href="#proyectos-destacados"`)
     - `STACK TECNOLOGICO` (`href="#stack-tecnologico"`)
     - `MAS PROYECTOS DE IA` (`href="#mas-proyectos-ia"`)
  3. **Botón Primario Derecho**: Botón sólido negro (`#0A0A0A`) con texto blanco en mayúsculas y esquinas biseladas/redondeadas:
     - `CONTRATAR / HABLEMOS` (`href="#contacto"`)
- **Franjas Separadoras**: Franja horizontal gris claro (`bg-[#EAECEF]`) entre el Header y el Hero, y entre el Hero y `SISTEMAS EN PRODUCCIÓN`.

### 5.4 Sección Hero Des-saturada (`HeroSection.tsx`)
- **Columna Izquierda (8 cols — Sin badges superiores, sin cajas `INVARIANT // VERIFIED` y sin botones CTA inferiores)**:
  - **Título Principal (`h1`) — Texto Exacto**:
    > `Construyo aplicaciones con IA implícita, agentes autónomos con Google ADK y sistemas RAG listos para producción.`
  - **Párrafo Descriptivo (`p`) — Texto Exacto**:
    > `Construyo software apoyado en un entorno profesional de agentes de código gobernados por un arnés de ingeniería de alto estándar. Combino desarrollo de agentes inteligentes, pruebas de modelos locales en aplicaciones no exploradas y administración de mi propio Home Lab`
- **Columna Derecha (4 cols — Monitor `KERNEL & HOME LAB TELEMETRY`)**:
  - Único componente que conserva mocks de prueba mientras se conecta el monitor en tiempo real definitivo.
  - Enmarcado en un contenedor exterior blanco con borde fino (`1px solid`) y panel interior gris claro (`#F3F4F6`) con las métricas (`NODE ID`, `HOST OS`, `ACTIVE CONTAINERS`, `P99 LATENCY`, `HARNESS SCORE`, `MEMORY RSS`, `DEFAULT THEME`) y el gráfico sparkline SVG (`00:00 UTC` · `SLO 99.98%` · `NOW // LIVE`).

### 5.5 Limpieza de la Vista Principal (`src/app/page.tsx`)
- Se dejan de renderizar en `src/app/page.tsx` todos los bloques de prototipo que saturaban la vista (`BenchmarksStrip`, los 3 sistemas de prototipo adicionales en el Home, `AgenticOrchestrationSection`, `TechStackMatrix`, `LiveTerminalSection` y `ContactAdvisorySection`).
- **Nota de Gobernanza del Arnés**: Los archivos físicos de esos componentes se conservan en `src/ui/components/` para respetar el `Pass-State Gating` de `required_files` en `feat-001`..`feat-006`, pero `src/app/page.tsx` solo monta `AppShell`, `HeroSection` y `ProductionSystemsSection`.

### 5.6 Sección `SISTEMAS EN PRODUCCIÓN` y Tarjeta de Vista Preliminar (`DECO VINTAGE PLATFORM`)
- **Título de Sección**: Únicamente `SISTEMAS EN PRODUCCIÓN` en mayúsculas bold, sin pre-título `01 // CATÁLOGO...`, sin párrafo secundario y sin barra de filtros.
- **Tarjeta `PROJECT 01` (Layout 12 columnas: 7 cols Vista Previa / 5 cols Especificación Técnica Equilibrada)**:
  - **Columna Izquierda (7 cols)**: Marco de ventana blanco con borde `1px solid`, barra superior con punto verde (`#22C55E`) a la izquierda e imagen `/assets/deco-vintage-preview.png` (`TARJETA PRO 1.png`).
  - **Columna Derecha (5 cols, fondo `#EAECEF` / `#F3F4F6`, tipografía y espaciado impecablemente equilibrados)**:
    - **Header izquierdo (Categoría)**: `PROJECT 01 // E-COMMERCE & CLOUD MEDIA ENGINE` (en azul técnico `#2563EB`)
    - **Badge derecho (Versión)**: `v3.4.0 PRODUCTION` (en píldora rectangular gris `#D5D9DF`)
    - **Título**: `DECO VINTAGE PLATFORM`
    - **Descripción (Resumen de stack y servicios)**:
      `Plataforma e-commerce full-stack e infraestructura multimedia sin estado para comercialización y cotización dinámica de cuadros decorativos (+540 obras). Diseñada con procesamiento de imágenes en memoria mediante semáforos de concurrencia libvips, persistencia relacional con paginación por cursores, motor autoritativo de cotizaciones a medida e inyección SSR dinámica para indexación social en tiempo real.`
    - **Tags de Stack Tecnológico (Pills)**:
      - `NODE.JS + EXPRESS 5`
      - `REACT 18 + VITE`
      - `POSTGRESQL + PRISMA 6`
      - `SHARP (LIBVIPS RAM)`
      - `GOOGLE CLOUD STORAGE` *(Pill destacado en azul)*
      - `ZOD + ZERO-TRUST`
    - **Recuadro de Métricas / Arquitectura**:
      - `ARQUITECTURA: Stateless Cloud-Native / Zero Split-Brain`
      - `DISPONIBILIDAD: 99.9% SLA Activo (VPS Docker + GCS CDN)`
    - **Botones**:
      - `PROBAR SISTEMA EN VIVO ↗` → `https://www.decovintage.online`
      - `{} ARQUITECTURA & REPO` → Abre el Blueprint detallado (`/sistemas/deco-vintage-platform`).

---

## 6. Evolución de Raíz del Arnés v2.2 (`feat-008`) — Historial Inmutable (`Event-Sourced DAG`), `deprecated_files` y Eliminación Física de Código Zombi

Por decisión arquitectónica de Sebastián, se resuelve de raíz el problema de acumulación de archivos obsoletos tras refactorizaciones o cambios drásticos de interfaz, sin alterar jamás el historial de tareas cerradas (`feat-001`..`feat-007`) y sin abrir brechas para que un agente haga trampa.

### 6.1 Reglas Mecánicas del Motor `Event-Sourced Pass-State Gating` (`scripts/lib/harness-utils.mjs` y `scripts/feature-list.schema.json`)
1. **Historial Inmutable (`Append-Only`)**: Las tareas en estado `"done"` (`feat-001` a `feat-007`) conservan intactos sus arreglos `required_files` y su `evidence` como registro histórico auditable.
2. **Propiedad Declarativa `deprecated_files` en `feature_list.json`**:
   - Cada tarea en `features` puede declarar opcionalmente `"deprecated_files": ["ruta/relativa/archivo.tsx", ...]`.
   - Todas las rutas en `deprecated_files` deben ser rutas relativas seguras dentro del repositorio (`isSafeRepoRelativePath`) y normalizarse para comparación canónica (`path.resolve(resolvedRoot, relPath)`).
3. **Candado Anti-Trampa #1 (Prohibido Auto-Deprecarse)**:
   - Ningún archivo listado en `feature.deprecated_files` puede figurar simultáneamente en `feature.required_files` de la misma tarea.
4. **Candado Anti-Trampa #2 (Trazabilidad Ancestral en el DAG)**:
   - Todo archivo listado en `feature.deprecated_files` debe haber sido introducido previamente en `required_files` por al menos una tarea **ancestral** (alcanzable transitivamente siguiendo `dependencies`) de `feature`. Un agente jamás puede deprecar archivos ajenos al linaje del DAG ni inventar rutas inexistentes en el historial.
5. **Resolución Temporal de Existencia en Disco (`Pass-State Gating` Evolutivo)**:
   - Para cualquier tarea `F` en `"done"`, cada archivo `P` en `F.required_files` debe existir físicamente en disco (`existsSync(P) && isFile() && size > 0`), **EXCEPTO** cuando exista una tarea descendiente `D` en el DAG (con `D.status === "in-progress"` o `D.status === "done"`) que declare `P` en `D.deprecated_files` (y ninguna tarea posterior a `D` haya vuelto a requerir `P` en `required_files`).
6. **Candado Anti-Zombi (Verificación Inversa de Limpieza Real)**:
   - Cuando una tarea `D` está en `"done"` y declara un archivo `P` en `D.deprecated_files` (sin que una tarea descendiente posterior a `D` lo haya re-creado en `required_files`), el validador exige que `P` **NO exista físicamente en disco** (`!existsSync(P)`). Si el archivo sigue en el disco, `validate-harness.mjs` falla reportando que `D` declaró deprecar `P` pero dejó un archivo zombi en el árbol fuente.

### 6.2 Purga Física de los 5 Componentes Zombi de Prototipo en `feat-008`
Al activar el nuevo motor en `feat-008`, se declaran en `"deprecated_files"` de `feat-008` y se eliminan físicamente del repositorio (`git rm`):
1. `src/ui/components/BenchmarksStrip.tsx` (proveniente de `feat-002`)
2. `src/ui/components/AgenticOrchestrationSection.tsx` (proveniente de `feat-004`)
3. `src/ui/components/TechStackMatrix.tsx` (proveniente de `feat-004`)
4. `src/ui/components/LiveTerminalSection.tsx` (proveniente de `feat-005`)
5. `src/ui/components/ContactAdvisorySection.tsx` (proveniente de `feat-005`)

---

## 7. Sistema Administrable del Catálogo sobre PostgreSQL + `pgvector` y Galería de 3 Vistas en Detalle (`feat-009`)

Por decisión de arquitectura y flujo de trabajo de Sebastián, el catálogo de proyectos pasa a ser **100% administrable desde interfaz web (`/admin/proyectos`)** respaldado por **PostgreSQL 17 (`pgvector/pgvector:pg17`)** en el `docker-compose.yml` del Ubuntu Linux Home Lab, de modo que una vez desplegado en producción, Sebastián pueda crear y actualizar proyectos y subir sus imágenes directamente desde el navegador sin tocar código fuente.

### 7.1 Clasificación Dual de Proyectos en la Página de Inicio (`catalogSection`)
Todo proyecto del catálogo pertenece a una de dos secciones visibles en la página principal (`/`):
1. **`SISTEMAS EN PRODUCCIÓN` (`catalogSection: "production-systems"`, ancla `#proyectos-destacados`)**:
   - Destinada a los sistemas que ya están operando en producción (como el Proyecto 01 `DECO VINTAGE PLATFORM`).
2. **`MÁS PROYECTOS DE IA` (`catalogSection: "ai-projects"`, ancla `#mas-proyectos-ia`)**:
   - Destinada a los proyectos de IA, agentes autónomos y desarrollos experimentales que están siendo construidos.
   - Conectada directamente al botón `MAS PROYECTOS DE IA` de la barra de navegación superior fija y renderizada con el mismo diseño equilibrado de tarjetas de vista preliminar.

### 7.2 Retiro de KPIs/Consola en `/sistemas/[slug]` y Nueva Galería de 3 Imágenes Exclusivas (`galleryImages`)
Dentro de la vista de información completa de cada proyecto (`src/ui/components/SystemDetailView.tsx`):
- **Se eliminan por completo**:
  1. La franja de **4 recuadros de métricas KPI (`M-01` a `M-04`)**.
  2. La sección **`01 // CONSOLA DE MANDO Y DIAGNÓSTICO EN TIEMPO REAL — Trazabilidad Operativa y Telemetría de Ejecución`** (`TTY // ...`).
- **Se coloca en su lugar la sección `01 // VISTAS DE INTERFAZ Y OPERACIÓN DEL SISTEMA` (`system.galleryImages`)**:
  - Exhibe **3 espacios de imagen independientes de la imagen de la tarjeta de inicio** (`slot: 1`, `slot: 2`, `slot: 3`), cada uno con su marco técnico *Atelier Monolith* (`VIEW 01`, `VIEW 02`, `VIEW 03`), título (`label`), imagen de alta resolución (con opción de ampliación/lightbox) y pie de foto (`caption`).
  - Si un proyecto aún no tiene cargadas sus 3 imágenes de detalle (ya que se subirán directamente desde el administrador en producción), muestra los 3 marcos técnicos estructurados listos para recibir las capturas desde `/admin/proyectos`.

### 7.3 Panel de Administración (`/admin/proyectos`) y Subida de Imágenes en Producción
- **Ruta `/admin/proyectos` protegida por `ADMIN_ACCESS_KEY`**:
  - Permite **crear** un proyecto nuevo (con opción de pre-cargar la plantilla estructural de `DECO VINTAGE PLATFORM`), **editar** cualquier proyecto existente (incluyendo subir o cambiar las 3 imágenes de detalle de `DECO VINTAGE PLATFORM`) y **eliminar** proyectos.
  - Incluye todos los campos del modelo: selector de categoría (`SISTEMAS EN PRODUCCIÓN` vs `MÁS PROYECTOS DE IA`), orden (`01`, `02`...), header izquierdo, badge de versión, título, slug, descripción de tarjeta, tags de stack + selector de tag destacado en azul, especificaciones de arquitectura/disponibilidad, URL en vivo, cargador de imagen de portada (tarjeta Home), **3 cargadores independientes para las 3 imágenes de la vista de detalle**, Ledger de despliegue, 3 etapas de pipeline, pestañas de código y 3 desafíos resueltos.
- **Servidor de Activos Subidos (`/api/assets/[filename]`)**:
  - Las imágenes subidas desde el administrador se almacenan en el volumen persistente `CATALOG_UPLOADS_DIR` (`/app/data/uploads` en el contenedor Ubuntu) y se sirven dinámicamente vía `/api/assets/[filename]` para que se visualicen al instante en Next.js `standalone` sin reconstruir la imagen Docker.

### 7.4 Persistencia PostgreSQL (`pgvector/pgvector:pg17`) en Ubuntu Home Lab + `Capability Seam`
- En `docker-compose.yml`, el servicio `dekolabs-db` ejecuta `pgvector/pgvector:pg17` con volumen persistente `dekolabs_pgdata` y red interna hacia `dekolabs-portfolio`.
- El repositorio en `src/repo/` implementa el contrato sobre PostgreSQL (`pg.Pool`) creando de forma idempotente las tablas `portfolio_systems` (incluyendo la columna `rag_knowledge_document` preparada para la futura fase de Agente RAG en vivo) y `portfolio_system_gallery` (las 3 imágenes de detalle por proyecto), sembrando automáticamente el Proyecto 01 (`DECO VINTAGE PLATFORM`).
- Mediante el `Capability Seam` de la Capa 3 (`Repo`), cuando se ejecutan pruebas locales o `bash ./init.sh` en entornos sin contenedor PostgreSQL local activo, el proveedor opera limpiamente contra el respaldo local determinista sin bloquear las 3 puertas ni requerir parches.
