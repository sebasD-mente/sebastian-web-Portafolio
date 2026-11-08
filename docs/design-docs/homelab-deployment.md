# Guía Operativa de Despliegue — `dekolabs.org` en Ubuntu Linux Home Lab

- **Sistema:** Portafolio Comercial y Galería de Sistemas en Producción de **Sebastián** (`sebastian-web-portafolio`)
- **Dominio Público:** `https://dekolabs.org`
- **Nodo Objetivo:** `HOME-LAB: UBUNTU-NODE-01` (Ubuntu Server 24.04 LTS x86_64 · Docker Engine + Compose v2)
- **Imagen Runtime:** `dekolabs/sebastian-portfolio:2.1-standalone` (`node:22-alpine`, Next.js 15 `output: "standalone"`)
- **Puerto Interno del Contenedor:** `127.0.0.1:3000 -> :3000` (expuesto únicamente al Reverse Proxy local)

---

## 1. Arquitectura del Empaquetado Docker Multi-Stage

El `Dockerfile` implementa una tubería de 3 etapas deterministas sobre `node:22-alpine` para minimizar la superficie de ataque y mantener la huella de memoria RSS por debajo de `150 MB` en reposo/carga nominal:

```mermaid
flowchart LR
    Deps["Etapa 1: deps<br/>node:22-alpine<br/>npm ci determinista"] --> Builder["Etapa 2: builder<br/>NEXT_DOCKER_BUILD=1<br/>next build standalone"]
    Builder --> Runner["Etapa 3: runner<br/>Usuario no-root nextjs:1001<br/>CMD node server.js (:3000)"]
```

| Etapa | Base | Propósito e Invariantes de Seguridad |
| :--- | :--- | :--- |
| **`1. deps`** | `node:22-alpine` | Instala `libc6-compat` y ejecuta `npm ci` usando `package.json` y `package-lock.json` en caché aislada. |
| **`2. builder`** | `node:22-alpine` | Compila el proyecto con `NEXT_DOCKER_BUILD=1` y `NEXT_TELEMETRY_DISABLED=1`, preservando `.next/standalone/node_modules` únicamente para el empaquetado de imagen. |
| **`3. runner`** | `node:22-alpine` | Crea el grupo `nodejs (1001)` y el usuario sin privilegios `nextjs (1001)`, copia exclusivamente `.next/standalone`, `.next/static` y `public`, expone el puerto `3000` y activa el `HEALTHCHECK` nativo contra `http://127.0.0.1:3000/api/health`. |

---

## 2. Topología de Red y Conexión con el Reverse Proxy Existente

En el nodo **Ubuntu Linux Home Lab** de Sebastián, el contenedor `dekolabs-portfolio` publica su puerto en `127.0.0.1:3000:3000` y se une a la red bridge `homelab-edge`. Esto impide exposición directa del puerto `3000` hacia Internet y delega la terminación TLS/WAF al Reverse Proxy del Home Lab:

```mermaid
flowchart LR
    Client["Visitante / Cliente<br/>https://dekolabs.org"] --> Edge["Cloudflare Edge / TLS 1.3"]
    Edge --> Proxy["Reverse Proxy Home Lab<br/>(cloudflared / Traefik / Caddy / Nginx)"]
    Proxy -->|"http://127.0.0.1:3000<br/>o http://dekolabs-portfolio:3000"| App["Contenedor: dekolabs-portfolio<br/>Next.js 15 Standalone (nextjs:1001)"]
    App --> Health["GET /api/health<br/>GET /api/telemetry<br/>POST /api/contact"]
```

### 2.1 Opción A — Cloudflare Tunnel (`cloudflared`)
En `/etc/cloudflared/config.yml` o en el panel Zero Trust Tunnel del nodo Ubuntu:
```yaml
ingress:
  - hostname: dekolabs.org
    service: http://127.0.0.1:3000
  - hostname: www.dekolabs.org
    service: http://127.0.0.1:3000
  - service: http_status:404
```

### 2.2 Opción B — Traefik v3 (Etiquetas ya incluidas en `docker-compose.yml`)
El archivo `docker-compose.yml` ya declara las etiquetas `traefik.http.routers.dekolabs.rule=Host(\`dekolabs.org\`) || Host(\`www.dekolabs.org\`)` y `traefik.http.services.dekolabs.loadbalancer.server.port=3000` sobre la red `homelab-edge`.

### 2.3 Opción C — Caddy / Nginx
- **Caddyfile:**
  ```text
  dekolabs.org, www.dekolabs.org {
      encode zstd gzip
      reverse_proxy 127.0.0.1:3000
  }
  ```
- **Nginx (`/etc/nginx/sites-available/dekolabs.org.conf`):**
  ```nginx
  server {
      server_name dekolabs.org www.dekolabs.org;
      location / {
          proxy_pass http://127.0.0.1:3000;
          proxy_http_version 1.1;
          proxy_set_header Host $host;
          proxy_set_header X-Real-IP $remote_addr;
          proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
          proxy_set_header X-Forwarded-Proto $scheme;
      }
  }
  ```

---

## 3. Procedimiento Paso a Paso de Puesta en Marcha en Ubuntu Server

### Paso 1: Preparar variables de entorno
```bash
cp .env.example .env
```
> El archivo `.env` está protegido por `.gitignore` y por los hooks `PreToolUse` del arnés (`docs/SECURITY.md`). Incluso si no se crea `.env`, `docker-compose.yml` incluye `required: false` y valores por defecto seguros.

### Paso 2: Construir y levantar el contenedor en segundo plano
```bash
docker compose up -d --build
```

### Paso 3: Verificar el estado del contenedor y los endpoints de observabilidad
```bash
# 1. Confirmar que el contenedor está en estado Up (healthy)
docker compose ps

# 2. Verificar el endpoint de salud (/api/health) y su cabecera x-correlation-id
curl -i http://127.0.0.1:3000/api/health

# 3. Verificar la telemetría en vivo del Ubuntu Home Lab (/api/telemetry)
curl -s http://127.0.0.1:3000/api/telemetry | jq .

# 4. Verificar las rutas SEO generadas (robots.txt y sitemap.xml)
curl -s http://127.0.0.1:3000/robots.txt
curl -s http://127.0.0.1:3000/sitemap.xml
```

### Paso 4: Inspección de logs estructurados (`RuntimeLogEntry`)
Todas las peticiones a `/api/health`, `/api/telemetry` y `/api/contact` emiten líneas JSON en `stdout` con `timestamp`, `level`, `component`, `action`, `durationMs` y `correlationId`:
```bash
docker compose logs -f --tail=50 dekolabs-portfolio
```

---

## 4. Endurecimiento de Seguridad y Límites de Recursos en `docker-compose.yml`

- **Usuario sin privilegios (`USER nextjs`, UID `1001`):** El proceso `node server.js` nunca se ejecuta como `root`.
- **Sistema de archivos de solo lectura (`read_only: true` + `tmpfs: /tmp`):** Impide escrituras persistentes no autorizadas dentro de la capa del contenedor.
- **Bloqueo de escalación de privilegios (`security_opt: ["no-new-privileges:true"]`):** Protege el kernel del host Ubuntu ante binarios setuid/setgid.
- **Cuotas de memoria y CPU (`mem_limit: 256m`, `cpus: 1.0`):** Garantiza aislamiento de recursos frente al resto de servicios del Home Lab (`cloudflared`, `postgres`, `redis`, etc.).
