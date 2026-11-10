# Sprint Contract (Contrato de Ejecución de Tarea)

Este documento materializa la **Observabilidad de Proceso (Antes de Codificar)**. El Planificador y el Ejecutor (*Maker*) acuerdan el alcance exacto y los criterios verificables de éxito antes de modificar el sistema, evitando desviaciones de alcance (*Scope Creep*) o interpretaciones ambiguas.

---

## Estado Actual del Contrato (`WIP = 0` — `feat-020` Completada y Verificada al 100/100)
- **Última tarea completada (`done`):** `feat-020` (*Monitor de Telemetría en Tiempo Real del Servidor `serverdmente` (`HOME-LAB // SERVERDMENTE`) en el Hero y `/api/telemetry`*).
- **Tarea activa (`in-progress`):** Ninguna (`WIP = 0`; todas las tareas `feat-001` a `feat-020` están en `"done"`).
- **Hoja de ruta secuencial declarada en el DAG (`feat-017 -> feat-018 -> feat-019 -> feat-020`):**
  1. **`feat-017`** (`done`, depende de `feat-016`): *Enlaces Reales de Contacto (WhatsApp +502 40275763, Instagram, Facebook), Corrección Ortográfica (Navegación y Copyright 'Sebastián Jiménez') y Metadatos OpenGraph / Títulos sin Duplicación*.
  2. **`feat-018`** (`done`, depende de `feat-017`): *Corrección Quirúrgica en Vista de Detalle (`/sistemas/[slug]`): Desduplicación de Párrafo Inicial y Retiro de Botones Autoreferenciados*.
  3. **`feat-019`** (`done`, depende de `feat-018`): *Sección `#stack-tecnologico` ('En Construcción') en la Página de Inicio (`/`) Conectada al Menú Superior*.
  4. **`feat-020`** (`done`, depende de `feat-019`): *Monitor de Telemetría en Tiempo Real del Servidor `serverdmente` (`HOME-LAB // SERVERDMENTE`) en el Hero y `/api/telemetry`*.
- **Especificación maestra de referencia:** `docs/product-specs/dekolabs-portfolio-spec.md` (Sección 9.4), `docs/design-docs/homelab-deployment.md`, `docs/RELIABILITY.md`, `docs/SECURITY.md` y `ARCHITECTURE.md`.

## Justificación de Dependencias en `package.json` (Regla Dura #4 de `ARCHITECTURE.md`)
- **Runtime (`dependencies`) — Sin dependencias nuevas requeridas para `feat-020`**:
  - `next` (`^15.2.0`), `react` (`^19.0.0`), `react-dom` (`^19.0.0`), `pg` (`^8.23.1`).
  - *Nota técnica (`feat-020`)*: Todas las lecturas del Kernel Linux (`/sys/class/hwmon/`, `/sys/class/thermal/`, `/proc/meminfo`, `/sys/fs/cgroup/`, `statfsSync('/')`) usan exclusivamente los módulos nativos `node:os`, `node:fs` y `node:process` de Node.js 22 sin privilegios `root`.

---

## Alcance Incluido (`Fair game`) para `feat-020`

### Fase 4 — `feat-020`: Monitor de Telemetría en Tiempo Real del Servidor `serverdmente` (`HOME-LAB // SERVERDMENTE`)
1. **Contratos de Dominio (`src/types/portfolio.ts`)**:
   - Definir `ServerdmenteLiveGauge` y `ServerdmenteLiveMonitorData` con las 8 filas reales de `serverdmente`:
     - `headerTitle`: `"HOME-LAB // SERVERDMENTE"`
     - `statusBadge`: `"ONLINE · LIVE 5S"`
     - `hostAndKernel`: string (ej. `"Ubuntu 26.04 LTS · Linux 7.0.0-42 x86_64"`)
     - `cpuAndLoad`: string (ej. `"Core i5-1035G1 (4C/8T) · Load 0.01 / 0.04"`)
     - `thermalSensors`: `{ cpuTempC: number; nvmeTempC: number; label: string }` (ej. `"CPU 58.0°C · NVMe 50.9°C"`)
     - `hostMemory`: `{ usedGib: number; totalGib: number; usedPercent: number; label: string }` (ej. `"2.30 GiB / 14.81 GiB (15% Used)"`)
     - `containerCgroup`: `{ usedMib: number; limitMib: number; usedPercent: number; label: string }` (ej. `"48 MiB / 256 MiB (Next.js Standalone)"`)
     - `storageNvme`: `{ usedGb: number; totalGb: number; usedPercent: number; label: string }` (ej. `"KINGSTON 1TB NVMe · 60 GB / 915 GB (7%)"`)
     - `dataAndEdgeMesh`: string (`"pgvector:pg17 ONLINE · Tailscale WireGuard"`)
     - `hostUptime`: `{ uptimeHours: number; label: string }` (ej. `"8d 19h 12m (211.0h Continuous)"`)
     - `gauges`: 3 medidores (`THERMAL HEADROOM`, `HOST RAM USAGE`, `CONTAINER CGROUP QUOTA`)
   - Añadir `liveMonitor: ServerdmenteLiveMonitorData` a `HomeLabTelemetrySnapshot` y `getLiveMonitor(): ServerdmenteLiveMonitorData` a `HomeLabTelemetryProvider`.
2. **Lectores Reales del Kernel Linux en `src/repo/telemetry.repo.ts`**:
   - Leer en tiempo real (con `try/catch` `Fail-Safe` y respaldo determinista de `serverdmente` cuando se ejecuta fuera de Linux/en Vitest):
     - `/etc/os-release` + `os.release()` / `os.arch()`.
     - `os.cpus()` + `os.loadavg()`.
     - `/sys/class/hwmon/hwmon*` (`coretemp` / `nvme`) y `/sys/class/thermal/thermal_zone*` (`x86_pkg_temp`) dividiendo miligrados entre `1000`.
     - `/proc/meminfo` (`MemTotal` y `MemAvailable`).
     - `/sys/fs/cgroup/memory.current` y `/sys/fs/cgroup/memory.max` (con fallback a `process.memoryUsage().rss` y `256 MiB`).
     - `fs.statfsSync('/')` para calcular el uso real del SSD NVMe Kingston 1TB.
     - `os.uptime()` para formatear días, horas, minutos y horas totales continuas del servidor físico.
3. **Servicio y Endpoint HTTP (`src/service/telemetry.service.ts` y `src/runtime/telemetry.handler.ts`)**:
   - Exportar `getServerdmenteLiveMonitor()` en `src/service/telemetry.service.ts` e incluir `liveMonitor` en `getHomeLabTelemetrySnapshot()` y `GET /api/telemetry` (`Cache-Control: no-store, max-age=0`).
4. **Componente Visual en Vivo (`src/ui/components/HeroSection.tsx` y `src/app/page.tsx`)**:
   - **Retirar al 100%** del cuadro derecho de `HeroSection.tsx` las filas `DEFAULT THEME`, `HARNESS SCORE`, `ACTIVE CONTAINERS: 14 NODES` y el gráfico estático de 24h.
   - Renderizar el encabezado `HOME-LAB // SERVERDMENTE` (`ONLINE · LIVE 5S`), las 8 filas reales de `serverdmente` y las 3 barras de progreso técnicas inferiores (`THERMAL HEADROOM`, `HOST RAM USAGE`, `CONTAINER CGROUP QUOTA`).
   - Implementar polling ligero cada `5000 ms` en cliente (`useEffect`) hacia `/api/telemetry` para actualizar los indicadores en vivo en el navegador.
5. **Pruebas (`tests/telemetry-and-contact.test.ts`)**:
   - Verificar que `getHomeLabTelemetrySnapshot().liveMonitor` y `GET /api/telemetry` exponen el objeto `liveMonitor` completo, y que `renderToStaticMarkup(HeroSection)` incluye las 8 filas reales de `serverdmente` y las 3 barras de progreso sin contener `DEFAULT THEME` ni `HARNESS SCORE`.

---

## Exclusiones Explícitas (Qué NO se va a tocar bajo ninguna circunstancia)
- **Prohibido crear o modificar `favicon.ico`**: Sebastián está diseñando el favicon oficial y lo entregará posteriormente.
- **Prohibido eliminar `getHeroTelemetryCardData` o `buildSparklineSvgGeometry`** de `src/service/systems.service.ts` para conservar compatibilidad 100% con `tests/systems.service.test.ts`.
- **Prohibido modificar el historial cerrado** de `feat-001` a `feat-019` en `feature_list.json`.
- **Prohibido violar las 6 capas**: ningún archivo en `src/app/` ni en `src/ui/` puede importar directamente desde `src/config/` o `src/repo/`.

## Estándares de Verificación ("Hecho" significa exactamente esto)
1. Ejecutar estrictamente una sola tarea a la vez (`WIP = 1`) actualizando `sprint-contract.md` al activar `feat-020`.
2. `bash ./init.sh`, `bash scripts/check-architecture.sh` y `node scripts/validate-harness.mjs --min-score 100` devuelven código `0` y `Overall: 100/100` (`0 CRLF`, `0 UTF-8 BOM`).
