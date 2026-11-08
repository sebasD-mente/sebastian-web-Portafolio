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

### 2.1 Paleta Cromática Dual (Modo Oscuro Predeterminado + Modo Claro)

| Token Semántico | Modo Oscuro (Default — `class="dark"`) | Modo Claro (`class="light"`) | Uso Arquitectónico |
| :--- | :--- | :--- | :--- |
| **`background` / `surface`** | `#121314` / `#000000` (Obsidiana) | `#FFFFFF` (Blanco Puro) | Lienzo base de la galería |
| **`surface-container-lowest`** | `#0D0E0F` / `#0A0A0A` | `#FFFFFF` / `#FAFAFA` | Fondos de terminales, barras de telemetría y marcos |
| **`surface-container-low`** | `#1B1C1C` / `#141414` | `#F3F4F6` / `#F4F4F5` | Tarjetas de sistemas en producción y paneles técnicos |
| **`surface-container-high`** | `#292A2A` | `#E5E7EB` | Chips de stack, divisores y botones secundarios |
| **`outline-variant`** | `#444748` / `#262626` (`1px solid`) | `#D1D5DB` / `#E5E5E5` (`1px solid`) | Hairlines de precisión (cero sombras difusas decorativas) |
| **`primary`** | `#FFFFFF` (Blanco Puro) | `#0D0E0F` / `#0A0A0A` | Titulares principales, CTAs primarios e inversión de alto contraste |
| **`on-surface-variant`** | `#C4C7C8` / `#A3A3A3` | `#4B5563` / `#525252` | Cuerpo editorial y descripciones técnicas |
| **`secondary` (Electric Ice Blue)** | `#7BD0FF` / `#38BDF8` | `#2563EB` | Estados activos del runtime, trazas de arquitectura y enlaces técnicos |
| **`tertiary-fixed` (Emerald Pulse)** | `#6FFBBE` / `#10B981` | `#059669` | Indicadores de producción en vivo, SLOs cumplidos y nodos online |
| **`amber-notice`** | `#F59E0B` | `#D97706` | Nodos experimentales, builds canary o alertas operativas |

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
3. **`src/repo/` (`Repo`)**: Catálogo estructurado de los sistemas en producción, especificaciones de casos de estudio, datos del stack/arnés agéntico y adaptador de lectura de métricas del host/contenedor Linux (`os`, `process`, o endpoint interno del Home Lab).
4. **`src/service/` (`Service`)**: Casos de uso y lógica de dominio pura (`getProductionSystems`, `getSystemBySlug`, `getAgenticCapabilities`, `buildHomeLabTelemetryReport`, `validateContactInquiry`).
5. **`src/runtime/` (`Runtime`)**: Controladores de rutas API (`/api/health`, `/api/telemetry`, `/api/contact`) y adaptador de logging estructurado `RuntimeLogEntry` con `correlationId`.
6. **`src/ui/` y `src/app/` (`UI`)**: Componentes visuales *Atelier Monolith* (`src/ui/components/`) y rutas del App Router de Next.js (`src/app/page.tsx`, `src/app/sistemas/[slug]/page.tsx`, `src/app/api/...`), consumiendo exclusivamente `src/service/`, `src/runtime/` y `src/types/`.
