# Contexto de Proyecto y Referencias — Portafolio Comercial `dekolabs.org`

- **Tipo de Memoria:** `project` + `reference`
- **Última actualización:** 2026-11-07

## 1. Decisiones de Identidad y Negocio (Acordadas con Sebastián)

- **Marca Personal 100%**: El sitio web representa directamente a **Sebastián (`Principal Software & AI Architect`)** operando bajo su dominio propio `https://dekolabs.org` (reemplazando cualquier mención al nombre placeholder *"Alexis Vance"* del prototipo de Stitch).
- **Objetivo Comercial Principal**: Presentar los proyectos y sistemas reales en producción de Sebastián, su entorno de **orquestación de agentes autónomos e ingeniería de arneses (Universal Chameleon Harness v2.1)** y las capacidades de su stack tecnológico para captar clientes en modalidad **freelance independiente**, **contratos de implementación end-to-end** o **consultoría de arquitectura**.

## 2. Referencia Externa en Google Stitch (MCP `stitch`)

- **Project ID:** `10491405022475068698` (`projects/10491405022475068698`)
- **Título en Stitch:** *Minimalist Software Developer Portfolio*
- **Design System:** **Atelier Monolith** (Estilo Tipográfico Internacional Suizo, **Modo Claro predeterminado `#FFFFFF` / `#F3F4F6`** + conmutador a Modo Oscuro `#121314` / `#0D0E0F`, tipografías `Inter`, `Space Grotesk` y `JetBrains Mono`, acentos `#2563EB` / `#7BD0FF` y `#059669` / `#6FFBBE`).
- **Evolución Incremental de Contenido y Diseño:** El prototipo de Stitch es un punto de partida vivo; la arquitectura de 6 capas separa los datos/imágenes (`src/repo/`) de los componentes (`src/ui/`) para que Sebastián pueda pulir el diseño, cambiar secciones e incorporar progresivamente las fotos, capturas y métricas reales de sus proyectos en cualquier momento sin fricción.
- **Pantallas Clave en Stitch:**
  - `projects/10491405022475068698/screens/c3fb19d306f343d2bb456385f9a6f7c6` — Home / Sistemas en Producción (Tema Oscuro).
  - `projects/10491405022475068698/screens/e8864088bfaa4c509d449223f881e21c` — Home / Sistemas en Producción (Tema Claro).
  - `projects/10491405022475068698/screens/606e1d34c8cd4d3f8f0f4b26306dcb56` — Vista de Detalle Técnico Profundo (`/sistemas/[slug]`).

## 3. Infraestructura de Despliegue (Ubuntu Linux Home Lab)

- **Host:** Servidor propio en el **Home Lab de Sebastián** corriendo **Ubuntu Linux**.
- **Empaquetado:** Contenedor Docker multi-stage con **Next.js 15 (`output: 'standalone'`)** sobre `node:22-alpine` escuchando en el puerto interno `3000`.
- **Exposición de Red:** El contenedor se conecta al **Reverse Proxy existente** del Home Lab (Cloudflare Tunnel / Traefik / Nginx Proxy Manager / Caddy) que enruta el tráfico HTTPS de `dekolabs.org` hacia el puerto `3000` del contenedor.
