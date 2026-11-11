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

## 7. Sistema Administrable del Catálogo sobre PostgreSQL + `pgvector` y Galería de 3 Vistas en Detalle (`feat-009`, `feat-010`, `feat-011`)

Por decisión de arquitectura y flujo de trabajo de Sebastián, el catálogo de proyectos pasa a ser **100% administrable desde interfaz web (`/admin/proyectos`)** respaldado por **PostgreSQL 17 (`pgvector/pgvector:pg17`)** en el `docker-compose.yml` del Ubuntu Linux Home Lab, dividido en **3 tareas atómicas secuenciales en el grafo DAG (`feat-009 -> feat-010 -> feat-011`)** para garantizar máxima calidad de implementación.

### 7.1 Clasificación Dual de Proyectos en la Página de Inicio (`catalogSection` — `feat-009`)
Todo proyecto del catálogo pertenece a una de dos secciones visibles en la página principal (`/`):
1. **`SISTEMAS EN PRODUCCIÓN` (`catalogSection: "production-systems"`, ancla `#proyectos-destacados`)**:
   - Destinada a los sistemas que ya están operando en producción (como el Proyecto 01 `DECO VINTAGE PLATFORM`).
2. **`MÁS PROYECTOS DE IA` (`catalogSection: "ai-projects"`, ancla `#mas-proyectos-ia`)**:
   - Destinada a los proyectos de IA, agentes autónomos y desarrollos experimentales que están siendo construidos.
   - Conectada directamente al botón `MAS PROYECTOS DE IA` de la barra de navegación superior fija y renderizada con el mismo diseño equilibrado de tarjetas de vista preliminar.

### 7.2 Retiro de KPIs/Consola en `/sistemas/[slug]` y Nueva Galería de 3 Imágenes Exclusivas (`galleryImages` — `feat-009`)
Dentro de la vista de información completa de cada proyecto (`src/ui/components/SystemDetailView.tsx`):
- **Se eliminan por completo**:
  1. La franja de **4 recuadros de métricas KPI (`M-01` a `M-04`)**.
  2. La sección **`01 // CONSOLA DE MANDO Y DIAGNÓSTICO EN TIEMPO REAL — Trazabilidad Operativa y Telemetría de Ejecución`** (`TTY // ...`).
- **Se coloca en su lugar la sección `01 // VISTAS DE INTERFAZ Y OPERACIÓN DEL SISTEMA` (`system.galleryImages`)**:
  - Exhibe **3 espacios de imagen independientes de la imagen de la tarjeta de inicio** (`slot: 1`, `slot: 2`, `slot: 3`), cada uno con su marco técnico *Atelier Monolith* (`VIEW 01`, `VIEW 02`, `VIEW 03`), título (`label`), imagen de alta resolución y pie de foto (`caption`).
  - Si un proyecto aún no tiene cargadas sus 3 imágenes de detalle (ya que Sebastián las subirá directamente desde el administrador en producción), muestra los 3 marcos técnicos estructurados listos para recibir las capturas desde `/admin/proyectos`.

### 7.3 Volumen Dedicado `/app/data/uploads` Compatible con `read_only: true` y APIs del Administrador (`feat-009` y `feat-010`)
Siguiendo la recomendación operativa para contenedores Next.js `standalone` con `read_only: true`:
- **Permisos y Puntos de Montaje en `Dockerfile` y `docker-compose.yml` (`feat-009`)**:
  - En `Dockerfile` (etapa `runner`, antes de `USER nextjs`), se crean los directorios `/app/data/uploads` y `/app/.next/cache` asignados a `nextjs:nodejs` (`uid=1001`, `gid=1001`).
  - En `docker-compose.yml`, el contenedor `dekolabs-portfolio` mantiene `read_only: true`, monta el volumen persistente nombrado `dekolabs_uploads:/app/data/uploads` (definido en `CATALOG_UPLOADS_DIR=/app/data/uploads`) y añade `/app/.next/cache:mode=1777,size=64m` en `tmpfs`. Así, toda imagen subida desde el PC de Sebastián se escribe en el volumen montado `/app/data/uploads` sin fallar por sistema de archivos de solo lectura y sin perderse al actualizar o recrear el contenedor.
- **APIs CRUD y Servidor de Activos (`feat-010`)**:
  - `POST/PUT/DELETE /api/admin/systems`: Protegido por `ADMIN_ACCESS_KEY`, persiste el proyecto y sus 3 imágenes de detalle en PostgreSQL (`portfolio_systems` y `portfolio_system_gallery`).
  - `POST /api/admin/upload`: Valida tipo MIME (`image/png`, `image/jpeg`, `image/webp`), tamaño máximo y nombre seguro, escribe el binario en `CATALOG_UPLOADS_DIR` (`/app/data/uploads`) y devuelve la URI `/api/assets/<filename>`.
  - `GET /api/assets/[filename]`: Sirve las imágenes directamente desde `/app/data/uploads` con cabeceras `Content-Type` y `Cache-Control`, funcionando en tiempo real en Next.js `standalone` sin necesidad de recompilar ni tocar `/app/public`.

### 7.4 Panel Visual de Administración (`/admin/proyectos` — `feat-011`)
- **Ruta `/admin/proyectos` (`src/app/admin/proyectos/page.tsx` y `src/ui/components/CatalogAdminView.tsx`)**:
  - Permite **crear** un proyecto nuevo (con botón **"Cargar Molde Base (Deco Vintage)"** para pre-llenar la estructura), **editar** cualquier proyecto existente (incluyendo subir las 3 imágenes de detalle de `DECO VINTAGE PLATFORM` en producción) y **eliminar** proyectos.
  - Incluye: selector de categoría (`SISTEMAS EN PRODUCCIÓN` vs `MÁS PROYECTOS DE IA`), campos de la tarjeta de inicio, subida desde PC de la imagen de portada (`previewImageSrc`), **3 cargadores independientes desde PC para las 3 imágenes de la vista de detalle** (`VIEW 01`, `VIEW 02`, `VIEW 03` con `label` y `caption`), Ledger de despliegue, 3 etapas de pipeline, pestañas de código y 3 desafíos resueltos.

### 7.5 Persistencia PostgreSQL (`pgvector/pgvector:pg17`) en Ubuntu Home Lab + `Capability Seam` (`feat-009`)
- En `docker-compose.yml`, el servicio `dekolabs-db` ejecuta `pgvector/pgvector:pg17` con volumen persistente `dekolabs_pgdata` y red interna hacia `dekolabs-portfolio`.
- El repositorio en `src/repo/postgres-catalog.repo.ts` implementa el contrato sobre PostgreSQL (`pg.Pool`) creando de forma idempotente las tablas `portfolio_systems` (incluyendo la columna `rag_knowledge_document` preparada para la futura fase de Agente RAG en vivo) y `portfolio_system_gallery`, sembrando automáticamente el Proyecto 01 (`DECO VINTAGE PLATFORM`).
- Mediante el `Capability Seam` de la Capa 3 (`Repo`), cuando se ejecutan pruebas locales o `bash ./init.sh` en entornos sin contenedor PostgreSQL local activo, el proveedor opera limpiamente contra el respaldo local determinista sin bloquear las 3 puertas ni requerir parches.

---

## 8. Evolución Pre-GitHub v2.3 (`feat-012` a `feat-015`) — Login Profesional Seguro, Administrador en 2 Vistas con Ciclo de Evolución, Página `/proyectos-ia` y Pie de Página Oficial

Por revisión directa y decisiones de diseño de Sebastián previas a la publicación del repositorio en GitHub, se planifican y declaran **4 entregas secuenciales atómicas (`feat-012 -> feat-013 -> feat-014 -> feat-015`)** para profesionalizar el acceso, la ergonomía del administrador, la curaduría de la página principal y el cierre institucional del sitio.

### 8.1 Sistema Profesional y Seguro de Login Único (`feat-012`)
Se reemplaza el antiguo campo suelto `ADMIN_ACCESS_KEY` de la cabecera de `/admin/proyectos` por un **flujo real de autenticación y sesión de administrador** sin dependencias externas (`node:crypto`):
- **Credenciales y Secretos en Entorno (`.env` / `.env.example` / `docker-compose.yml`)**:
  - `ADMIN_USERNAME`: Identificador o correo del administrador único (ej. `admin@dekolabs.org`).
  - `ADMIN_PASSWORD`: Contraseña privada del administrador, comparada en servidor en tiempo constante (`scryptSync` / `timingSafeEqual`).
  - `ADMIN_SESSION_SECRET`: Clave criptográfica HMAC-SHA256 de alta entropía para firmar tokens de sesión sin estado (`sub`, `iat`, `exp`).
- **Pantalla Dedicada `/admin/login` (`src/app/admin/login/page.tsx` y `src/ui/components/AdminLoginView.tsx`)**:
  - Diseño suizo *Atelier Monolith* (`robots: { index: false, follow: false }`) con logo de firma `Sebastian J`, formulario limpio de `Usuario / Email` + `Contraseña` (con alternador Mostrar/Ocultar), mensajes claros de validación y redirección automática hacia `/admin/proyectos` al iniciar sesión.
- **Endpoints de Sesión y Seguridad Anti-Fuerza Bruta (`src/service/admin-auth.service.ts` y `src/runtime/admin-auth.handler.ts`)**:
  - `POST /api/admin/auth/login`: Aplica límite de intentos por IP (`rate-limit`, devolviendo `429 Too Many Requests` tras exceder el umbral en ventana móvil), verifica credenciales bajo política `Fail-Closed`, emite cookie `dekolabs_admin_session` con banderas `HttpOnly; SameSite=Strict; Path=/; Max-Age=43200` (+ `Secure` en `NODE_ENV=production`) y registra `RuntimeLogEntry` con `correlationId` redactando credenciales.
  - `POST /api/admin/auth/logout`: Revoca/expira inmediatamente la cookie (`Max-Age=0`).
- **Protección Server-Side de `/admin/proyectos` y Limpieza de Cabecera**:
  - `src/app/admin/proyectos/page.tsx` valida la cookie firmada en el servidor antes de entregar cualquier HTML del administrador; si no hay sesión válida, redirige de inmediato a `/admin/login`.
  - Dentro de `CatalogAdminView.tsx` **se elimina por completo** la barra del campo de clave `ADMIN_ACCESS_KEY` y el botón `SINCRONIZAR CATÁLOGO`, dejando un indicador sobrio de sesión activa y el botón **`Cerrar Sesión`**.
  - `src/runtime/admin-catalog.handler.ts` autoriza peticiones que presenten la cookie firmada válida `dekolabs_admin_session` (flujo navegador) y mantiene compatibilidad con `x-admin-key` / `Bearer` para pruebas automatizadas de API.

### 8.2 División del Administrador en 2 Vistas Separadas, Selector `<select>` y Evolución de Proyectos (`feat-013`)
Se reorganiza la experiencia de `/admin/proyectos` (`src/ui/components/CatalogAdminView.tsx`) para eliminar la saturación visual de abrir el formulario gigante automáticamente:
1. **Vista 1 — Entrada al Administrador (Listado de Tarjetas + 1 Solo Botón de Creación)**:
   - Al entrar a `/admin/proyectos`, Sebastián visualiza **únicamente los proyectos ya creados con sus tarjetas** (agrupados en `PROYECTOS EN PRODUCCIÓN` y `MÁS PROYECTOS DE IA`) y **un único botón principal `+ Crear Nuevo Proyecto`** en la parte superior (eliminando el par confuso de botones `+ Nuevo en Producción` / `+ Nuevo Proyecto de IA`).
   - Cada tarjeta conserva sus indicadores (`orden`, `slug`, miniatura/estado, `X/3 fotos detalle`) y acciones rápidas (`Editar`, `Ver ↗`, `Eliminar`).
2. **Vista 2 — Formulario de Creación / Edición (Bajo Demanda)**:
   - Se abre **exclusivamente** al hacer clic en `+ Crear Nuevo Proyecto` o en `Editar` sobre un proyecto existente.
   - Incluye en su barra superior el botón **`← Volver a Proyectos Creados`** (y el botón auxiliar `Cargar Molde Base (Deco Vintage)` cuando se crea un proyecto nuevo), regresando a la Vista 1 una vez guardado el proyecto.
3. **Selector Desplegable `<select>` de Sección y Retiro de las Cajas Radio Antiguas**:
   - Se **elimina por completo** el bloque de dos cajas grandes de radio (`UBICACIÓN DEL PROYECTO EN LA PÁGINA DE INICIO (CATALOGSECTION) *`).
   - En su lugar, el formulario incorpora un **selector desplegable `<select>` limpio** (`Sección / Etapa del Proyecto`) con las dos etapas del catálogo: `Más Proyectos de IA` (`"ai-projects"`) y `Proyectos en Producción` (`"production-systems"`).
4. **Ciclo de Evolución de Proyecto (`Más Proyectos de IA` → `Proyectos en Producción`)**:
   - Como el ciclo natural de cada desarrollo inicia en `Más Proyectos de IA` y madura hacia `Proyectos en Producción`, cada tarjeta listada bajo `MÁS PROYECTOS DE IA` en la Vista 1 incluye un botón directo **`Evolucionar a Producción ↗`** que promueve el proyecto en un clic hacia `Proyectos en Producción` mediante `PUT /api/admin/systems` (además de poder cambiarse en cualquier momento desde el `<select>` al editar).

### 8.3 Página de Inicio Exclusiva para Producción (`/`) y Página Dedicada `/proyectos-ia` (`feat-014`)
- **Depuración de la Página Inicial (`/`)**:
  - En `src/app/page.tsx` y `src/ui/components/ProductionSystemsSection.tsx` **se retira por completo la sección `MÁS PROYECTOS DE IA` (`#mas-proyectos-ia`)**. La página de inicio muestra únicamente el `HeroSection` y la sección **`SISTEMAS EN PRODUCCIÓN`**.
- **Nueva Ruta Pública `/proyectos-ia` (`src/app/proyectos-ia/page.tsx` y `src/ui/components/AiProjectsCatalogView.tsx`)**:
  - El enlace **`MAS PROYECTOS DE IA`** del Header superior (`AppShell.tsx` / `site.config.ts`) pasa a dirigir a `/proyectos-ia` (mientras los enlaces de ancla usan `/#proyectos-destacados`, `/#stack-tecnologico` y `/#contacto` para navegar limpiamente desde cualquier ruta).
  - `/proyectos-ia` exhibe con el mismo diseño de tarjetas *Atelier Monolith* todos los proyectos activos en la etapa `Más Proyectos de IA` (`catalogSection === "ai-projects"`), revalidándose automáticamente cuando un proyecto se crea, edita o evoluciona a Producción.

### 8.4 Pie de Página Oficial (`OfficialFooter`) con Copyright y Botones de Redes Sociales (`feat-015`)
- **Componente Global `src/ui/components/OfficialFooter.tsx` integrado en `AppShell.tsx`**:
  - **Copyright Oficial**: Incluye de forma visible la leyenda oficial con ortografía corregida (`feat-017`):
    > **`© 2026 · Creado por Sebastián Jiménez`**
  - **Sección de Redes Sociales y Contacto Directo**: Botones estilizados bajo estética *Atelier Monolith* con iconografía vectorial SVG accesible (`target="_blank"`, `rel="noopener noreferrer"`) para las 4 plataformas solicitadas:
    1. **LinkedIn** (`https://www.linkedin.com/in/sebastian-jimenez-dekolabs`)
    2. **Facebook** (`https://www.facebook.com/sebastian.jimenez.561437`)
    3. **Instagram** (`https://www.instagram.com/sebastian.1969c/`)
    4. **WhatsApp** (`https://wa.me/50240275763` — `+502 40275763`)
  - **Configuración Desacoplada en 6 Capas**: Las URLs de las 4 redes quedan parametrizadas en `src/config/site.config.ts` y `.env.example` (`NEXT_PUBLIC_SOCIAL_LINKEDIN_URL`, `NEXT_PUBLIC_SOCIAL_FACEBOOK_URL`, `NEXT_PUBLIC_SOCIAL_INSTAGRAM_URL`, `NEXT_PUBLIC_SOCIAL_WHATSAPP_URL`), fluyendo por `src/repo/site.repo.ts` y `src/service/site.service.ts` hacia `AppShell.tsx` y `OfficialFooter.tsx`.

---

## 9. Pulido Post-Despliegue en Producción v2.4 (`feat-017` a `feat-019`) — Enlaces Reales de Redes, Ortografía, Desduplicación Quirúrgica en Detalle y Sección `#stack-tecnologico` en Construcción

Tras la auditoría en vivo sobre `https://dekolabs.org/`, se declaran **3 tareas secuenciales quirúrgicas (`feat-017 -> feat-018 -> feat-019`)** para ejecución inmediata por cualquier agente bajo el arnés, dejando explícitamente reservado para la siguiente fase de codiseño con Sebastián el **Monitor Real del Servidor (`KERNEL & HOME LAB TELEMETRY`)** y el **`favicon.ico` personalizado**.

### 9.1 Enlaces Reales de Contacto (WhatsApp, Instagram, Facebook), Pulido Ortográfico y Metadatos OpenGraph / Títulos (`feat-017`)
1. **Enlaces Oficiales Reales por Defecto en `src/config/site.config.ts` (`DEFAULT_SOCIAL_LINKS_URLS`) y `.env.example`**:
   - **WhatsApp (`+502 40275763`)**: `https://wa.me/50240275763`
   - **Instagram**: `https://www.instagram.com/sebastian.1969c/`
   - **Facebook**: `https://www.facebook.com/sebastian.jimenez.561437`
   - **LinkedIn**: `https://www.linkedin.com/in/sebastian-jimenez-dekolabs`
2. **Corrección Ortográfica en Navegación y Pie de Página (`src/config/site.config.ts` y `src/ui/components/AppShell.tsx`)**:
   - En `SITE_NAVIGATION` (`src/config/site.config.ts`) y `renderTwoLineNavLabel` (`src/ui/components/AppShell.tsx`), corregir las tildes de los ítems `02` y `03`:
     - `"STACK TECNOLÓGICO"` (en dos líneas: `STACK` / `TECNOLÓGICO`)
     - `"MÁS PROYECTOS DE IA"` (en dos líneas: `MÁS PROYECTOS` / `DE IA`)
   - En `src/config/site.config.ts`, corregir la leyenda de copyright eliminando la repetición del año `2026` y agregando las tildes en el nombre de Sebastián:
     - `OFFICIAL_AUTHOR_CREDIT = "Creado por Sebastián Jiménez"`
     - `OFFICIAL_COPYRIGHT_NOTICE = "© 2026 · Creado por Sebastián Jiménez"`
3. **Eliminación de Títulos `<title>` Duplicados e Inyección de `og:image` (`src/app/layout.tsx`, `src/app/proyectos-ia/page.tsx`, `src/app/sistemas/[slug]/page.tsx`)**:
   - Evitar que las subpáginas concatenen manualmente `| Sebastián — dekolabs.org` sobre el `title.template` de `src/app/layout.tsx`:
     - En `src/app/proyectos-ia/page.tsx`: `title: "Más Proyectos de IA — Google ADK & Sistemas RAG"`
     - En `src/app/sistemas/[slug]/page.tsx`: `title: deepDive.system.title` (y `"Sistema No Encontrado"` en 404)
   - Añadir `openGraph.images` y `twitter.images` apuntando a `/assets/deco-vintage-preview.png` en `src/app/layout.tsx` (y a `deepDive.system.previewImageSrc` en `src/app/sistemas/[slug]/page.tsx`) para previsualización social en WhatsApp y LinkedIn.

### 9.2 Corrección Quirúrgica en `/sistemas/[slug]`: Párrafo Inicial Sin Duplicación y Navegación Inferior Sin Autoreferencia (`feat-018`)
1. **Desduplicación del Resumen Inicial en `deco-vintage-platform` (`src/repo/systems.repo.ts`, `src/service/systems.service.ts`, `src/ui/components/SystemDetailView.tsx`)**:
   - En `src/repo/systems.repo.ts`, el campo `summary` de `deco-vintage-platform` no debe repetir la primera oración idéntica a `subtitle`, sino iniciar directamente con el cuerpo técnico complementario (*"Diseñada con procesamiento de imágenes en memoria mediante semáforos de concurrencia libvips, persistencia relacional con paginación por cursores, motor autoritativo de cotizaciones a medida e inyección SSR dinámica para indexación social en tiempo real."*).
   - Además, crear e invocar una función pura `deduplicateSystemSummary(subtitle: string, summary: string): string` en `src/service/systems.service.ts` (y aplicarla en `getProductionSystemDeepDiveBySlug`, `getProductionSystemDeepDiveBySlugAsync` y `SystemDetailView.tsx`) para que, si un registro proveniente de PostgreSQL (`dekolabs-db`) aún conserva el prefijo repetido de `subtitle` dentro de `summary`, se recorte limpiamente en tiempo de lectura sin mostrar dos párrafos idénticos seguidos.
2. **Ocultación de Tarjetas `SISTEMA ANTERIOR` / `SIGUIENTE SISTEMA` Autoreferenciadas (`src/ui/components/SystemDetailView.tsx`)**:
   - Cuando el catálogo cuenta con un único sistema (o cuando `previousSystem.slug === system.slug`), `SystemDetailView.tsx` **NO debe renderizar** las dos tarjetas que se apuntan a sí mismas (`← SISTEMA ANTERIOR (01): DECO VINTAGE PLATFORM` y `SIGUIENTE SISTEMA (01) →: DECO VINTAGE PLATFORM`).
   - En su lugar, cuando `previousSystem.slug === system.slug`, renderiza una banda limpia de retorno y conversión con `← VOLVER A SISTEMAS EN PRODUCCIÓN` (`href="/#proyectos-destacados"`) y `SOLICITAR IMPLEMENTACIÓN SIMILAR →` (`href="/#contacto"`). Si existen 2 o más sistemas distintos en el catálogo (`previousSystem.slug !== system.slug`), se muestran las tarjetas de navegación secuencial.

### 9.3 Sección `#stack-tecnologico` ("En Construcción") en la Página de Inicio (`/`) (`feat-019`)
1. **Componente `src/ui/components/TechStackSection.tsx` integrado en `src/app/page.tsx`**:
   - Añadir la sección semántica `<section id="stack-tecnologico" aria-labelledby="tech-stack-heading">` en la página de inicio (`/`) debajo de `ProductionSystemsSection` (`#proyectos-destacados`).
   - Diseñada bajo estética suiza *Atelier Monolith* con encabezado `02 // ARQUITECTURA & HERRAMIENTAS`, título `STACK TECNOLÓGICO`, badge visible **`SECCIÓN EN CONSTRUCCIÓN`** y tarjeta informativa sobria indicando que el mapa detallado de tecnologías, agentes autónomos (Google ADK, MCP), pipelines RAG (`PostgreSQL + pgvector`) e infraestructura Linux Home Lab se encuentra actualmente en construcción y curaduría técnica.
   - Garantiza que el botón **`STACK TECNOLÓGICO`** (`href="/#stack-tecnologico"`) de la barra de navegación superior funcione en todas las páginas sin enlaces muertos.

### 9.4 Monitor en Tiempo Real del Servidor `serverdmente` (`HOME-LAB // SERVERDMENTE`) en el Hero y `/api/telemetry` (`feat-020`)
Con base en la auditoría de hardware, sensores y cgroups v2 del nodo real **`serverdmente`** (`Ubuntu 26.04.1 LTS · Linux 7.0.0-42-generic x86_64`, `Intel Core i5-1035G1 4C/8T`, `14.81 GiB RAM`, `KINGSTON SNV2S1000G 1TB NVMe`, `dekolabs-db pgvector:pg17`, malla `Traefik Edge HTTP/3 -> Tailscale WireGuard -> 127.0.0.1:3000`), se reemplaza el cuadro estático antiguo del Hero por un **Monitor en Tiempo Real de `serverdmente`**:
1. **Eliminación Total de Filas Filtradas del Arnés/Configuración en `HeroSection.tsx`**:
   - Quedan **100% eliminadas** del cuadro derecho del Hero las filas `DEFAULT THEME`, `HARNESS SCORE: 100/100 (3 Puertas PASS)`, `ACTIVE CONTAINERS: 14 NODES` y el gráfico estático ficticio `24H WINDOW`.
2. **Lectura Real desde el Kernel Linux sin Privilegios Root (`src/repo/telemetry.repo.ts`)**:
   - Desde dentro del contenedor `dekolabs-portfolio` (`uid=1001(nextjs)`, `read_only: true`), el repositorio lee en tiempo real (con `try/catch` y respaldo determinista de `serverdmente` cuando corre en Windows/CI):
     - **`HOST & KERNEL`**: `/etc/os-release` + `os.release()` / `os.arch()` (ej. `Ubuntu 26.04 LTS · Linux 7.0.0-42 x86_64`).
     - **`CPU & LOAD`**: `os.cpus()` + `os.loadavg()` (ej. `Core i5-1035G1 (4C/8T) · Load 0.01 / 0.04`).
     - **`THERMAL SENSORS`**: `/sys/class/hwmon/hwmon*/temp*_input` y `/sys/class/thermal/thermal_zone*/temp` (ej. `CPU 58.0°C · NVMe 50.9°C`).
     - **`HOST MEMORY`**: `/proc/meminfo` (`MemTotal` y `MemAvailable`) (ej. `2.30 GiB / 14.81 GiB (15% Used)`).
     - **`CONTAINER CGROUP`**: `/sys/fs/cgroup/memory.current` y `/sys/fs/cgroup/memory.max` + `process.memoryUsage().rss` (ej. `48 MiB / 256 MiB (Next.js Standalone)`).
     - **`STORAGE (NVME)`**: `fs.statfsSync('/')` (ej. `KINGSTON 1TB NVMe · 60 GB / 915 GB (7%)`).
     - **`DATA & EDGE MESH`**: `pgvector:pg17 ONLINE · Tailscale WireGuard`.
     - **`HOST UPTIME`**: `os.uptime()` formateado en vivo (ej. `8d 19h 12m (211.0h Continuous)`).
3. **Medidores Técnicos en Vivo y Polling Cada 5 Segundos (`src/ui/components/HeroSection.tsx` y `GET /api/telemetry`)**:
   - Encabezado **`HOME-LAB // SERVERDMENTE`** con badge pulsante **`ONLINE · LIVE 5S`**.
   - Bloque inferior con **3 barras de progreso técnicas en tiempo real**:
     1. **`THERMAL HEADROOM`**: Temperatura de CPU (`°C / 100°C`) y NVMe (`°C / 78°C`).
     2. **`HOST RAM USAGE`**: Porcentaje y GiB usados sobre los `14.81 GiB` del host.
     3. **`CONTAINER CGROUP QUOTA`**: Porcentaje y MiB usados sobre el límite duro de `256 MiB` del contenedor.
   - En el navegador, `HeroSection.tsx` realiza polling ligero cada `5000 ms` contra `GET /api/telemetry` (`Cache-Control: no-store`) para refrescar los valores reales en vivo sin recargar la página.

### 9.5 Importación en Un Clic desde la Skill Global `/dekolabs-project-extractor` en `/admin/proyectos` y Botón Discreto de Engranaje hacia `/admin/login` en el Pie de Página (`feat-021`)
Para conectar la **Skill Global de Antigravity** (`~/.gemini/config/skills/dekolabs-project-extractor/SKILL.md`) con el panel `/admin/proyectos` y facilitar el acceso discreto del administrador desde cualquier página pública, `feat-021` incorpora dos mejoras:
1. **Función Pura de Normalización y Parseo (`parseAgentProjectJsonToDraft` en `src/ui/components/CatalogAdminView.tsx`)**:
   - Recibe `rawInput: string` y `fallbackOrder: string = "02"`.
   - Limpia automáticamente delimitadores Markdown opcionales (````json ... ````) por si el administrador copió el bloque completo desde el chat del agente.
   - Valida que el JSON sea un objeto válido con `title` y `summary` no vacíos, deriva `slug` con `slugifyProjectTitle` si no viene explícito, y normaliza la estructura completa mediante `convertSystemToFormInput` para garantizar que los **4 bloques (Bloques A, B, C y D)** queden rellenos sin campos huérfanos.
2. **Botón y Panel/Modal `⚡ Importar JSON del Agente` en la Vista de Formulario (`CatalogAdminView.tsx`)**:
   - En la barra superior de la Vista 2 (`viewMode === "form"`), muestra el botón **`⚡ Importar JSON del Agente`**.
   - Al pulsarlo, despliega un cuadro accesible (`id="agent-json-import-panel"`) con un `<textarea id="agent-project-json-textarea">` y el botón **`Autorrellenar los 4 Bloques`** (además de poder abrirse directamente visible o colapsable).
   - Al confirmar un JSON válido, autorrellena de golpe todos los campos de los Bloques A, B, C y D en `formState`, limpia `fieldErrors` y muestra confirmación en `statusBanner`, dejando al administrador únicamente la tarea de subir las 4 fotos desde su PC y pulsar **Publicar Proyecto**.
3. **Botón Muy Discreto de Engranaje en `OfficialFooter.tsx` hacia `/admin/login` (Sin Texto Visible ni `title`)**:
   - En la franja inferior institucional de `src/ui/components/OfficialFooter.tsx` (junto a `{footer.technicalNote}`), añadir un enlace minimalista `<a href="/admin/login" aria-label="Acceso de administrador" data-admin-login-trigger="true">` que contenga **únicamente un ícono vectorial SVG de engranaje pequeño (`w-3.5 h-3.5`)**, con color neutro atenuado (`text-[#9CA3AF] hover:text-[#4B5563] opacity-60 hover:opacity-100`), **sin texto visible y sin atributo `title`**, para que pase desapercibido al público pero permita a Sebastián entrar a `/admin/login` con un clic desde el pie de página.

### 9.6 Pipeline de Optimización Automática de Imágenes a WebP (`<= 1920×1200 px`, Calidad `0.86`) antes de Subir en `/admin/proyectos` (`feat-022`)
Para eliminar la demora al subir imágenes pesadas (`.png` / `.jpg` de varios megabytes) a través del túnel Edge -> WireGuard -> `serverdmente` y garantizar que todas las imágenes servidas en el portafolio estén optimizadas en formato `.webp`:
1. **Funciones Puras de Escalado Proporcional y Metadatos de Optimización en `src/ui/components/CatalogAdminView.tsx`**:
   - Exportar las constantes `MAX_OPTIMIZED_IMAGE_WIDTH = 1920`, `MAX_OPTIMIZED_IMAGE_HEIGHT = 1200` y `WEBP_COMPRESSION_QUALITY = 0.86`.
   - Exportar `computeOptimizedImageDimensions(width: number, height: number, maxWidth?: number, maxHeight?: number): { width: number; height: number; wasResized: boolean }` para escalar proporcionalmente cualquier imagen que supere `1920×1200 px` sin recortar ni deformar su relación de aspecto original (`16:10` o `16:9`).
   - Exportar `replaceFileExtensionWithWebp(filename: string): string` y `formatOptimizationSummary(originalBytes: number, optimizedBytes: number, width: number, height: number): string` (ej. `"Optimizada a WEBP (1920×1200 · 4200 KB → 118 KB · -97%)"`).
2. **Compresor WebP Instantáneo en el Navegador (`optimizeImageFileForUpload` en `CatalogAdminView.tsx`)**:
   - Antes de enviar el archivo por red en `uploadImageFileToServer(file: File)`, procesar la imagen en memoria en el navegador usando `<canvas>` con `imageSmoothingEnabled = true` e `imageSmoothingQuality = "high"`, codificándola a `image/webp` con calidad `0.86` (`canvas.toBlob`).
   - Empaquetar el resultado en un nuevo `File([blob], replaceFileExtensionWithWebp(file.name), { type: "image/webp" })` para que por internet viaje únicamente el `.webp` ligero (~80–160 KB en lugar de 4–8 MB), haciendo la subida prácticamente instantánea (< 0.3s) y guardándola ya en `.webp` dentro de `/app/data/uploads`.
   - Conservar fallback seguro `try/catch`: si se ejecuta en entorno sin Canvas (SSR/Vitest) o si la imagen ya es un `.webp` más liviano y dentro de `1920×1200`, usar el archivo de forma segura sin fallar.
3. **Guía de Medidas Exactas (`1920×1200 px · 16:10`) y Resumen de Ahorro en la UI (`CatalogAdminView.tsx`)**:
   - Ampliar `UploadSlotStatus` con `optimizationSummary?: string | null`.
   - Mostrar en los encabezados de la Imagen 1 de 4 (Portada) y de las 3 Imágenes de Detalle (`VIEW 01`, `VIEW 02`, `VIEW 03`) la guía de medida ideal (`1920×1200 px (16:10) · Auto-WebP 86%`) y, tras cada subida, mostrar el badge con el resumen real de compresión (`optimizationSummary`).

### 9.7 Fuente Única de Verdad para Redes Sociales en `src/config/site.config.ts` (Sin Variables `NEXT_PUBLIC_SOCIAL_*` en `.env`) y Perfil Real de LinkedIn (`feat-023`)
Los enlaces públicos de redes sociales del pie de página (`OfficialFooter`) no son secretos ni variables de infraestructura, por lo que no deben leerse desde `.env` (evitando así que archivos `.env` antiguos del servidor pisen la configuración real versionada en Git):
1. **Actualización de `DEFAULT_SOCIAL_LINKS_URLS` en `src/config/site.config.ts`**:
   - Establecer como fuente única de verdad en `src/config/site.config.ts`:
     - `linkedin`: `"https://www.linkedin.com/in/sebastian-jimenez-aibuilder/"`
     - `facebook`: `"https://www.facebook.com/sebastian.jimenez.561437"`
     - `instagram`: `"https://www.instagram.com/sebastian.1969c/"`
     - `whatsapp`: `"https://wa.me/50240275763"`
2. **Eliminación de `process.env.NEXT_PUBLIC_SOCIAL_*` en `getOfficialFooterConfig` (`src/config/site.config.ts`) y en `.env.example`**:
   - En `getOfficialFooterConfig(overrides?: SocialLinksEnvOverrides)`, resolver cada red usando únicamente `overrides?.<red>Url` (cuando se pasa explícitamente por argumento en tests) o directamente `DEFAULT_SOCIAL_LINKS_URLS.<red>`, sin leer `process.env.NEXT_PUBLIC_SOCIAL_*`.
   - En `.env.example`, retirar las 4 líneas `NEXT_PUBLIC_SOCIAL_*`, manteniendo 100% intactas todas las variables de servidor, base de datos (`POSTGRES_*`, `DATABASE_URL`), autenticación y llaves (`ADMIN_USERNAME`, `ADMIN_PASSWORD`, `ADMIN_SESSION_SECRET`, `ADMIN_ACCESS_KEY`, `CATALOG_UPLOADS_DIR`, `HOMELAB_*`).
