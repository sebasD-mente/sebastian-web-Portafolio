#!/usr/bin/env bash
set -euo pipefail

ROOT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")/.." && pwd)"
cd "$ROOT_DIR"

red_pen_error() {
  local err="$1"
  local why="$2"
  local fix="$3"
  echo "ERROR: $err"
  echo "POR QUÉ: $why"
  echo "SOLUCIÓN (FIX): $fix"
  exit 1
}

HARNESS_MODE="auto"
ALLOW_EMPTY_DIRS="false"
if [ -f "harness.config.json" ]; then
  cfg_meta="$(node -e '
    const fs = require("node:fs");
    const clean = (s) => String(s || "").replace(/[|\r\n]+/g, " ").trim();
    const fail = (err, why, fix) => {
      console.log(`FAIL|${clean(err)}|${clean(why)}|${clean(fix)}`);
      process.exit(0);
    };
    const isPlainObj = (v) => Boolean(v) && typeof v === "object" && !Array.isArray(v);
    const normRel = (s) => String(s || "").trim().replace(/\\/g, "/").replace(/^\.\/+/, "").replace(/^\/+|\/+$/g, "");
    const isValidRelSegs = (rawStr) => {
      if (typeof rawStr !== "string") return false;
      const trimmed = rawStr.trim();
      if (!trimmed || trimmed.startsWith("/") || trimmed.startsWith("\\") || /^[a-zA-Z]:/.test(trimmed) || trimmed.includes("\0")) return false;
      const n = normRel(trimmed);
      if (!n || n === "." || n === "..") return false;
      const segs = n.split("/");
      return segs.every((seg) => seg.length > 0 && seg !== "." && seg !== "..");
    };

    let raw;
    try {
      raw = JSON.parse(fs.readFileSync("harness.config.json", "utf8"));
    } catch (err) {
      fail(
        `JSON corrupto en \x27harness.config.json\x27 (${err.message}).`,
        "El vigilante arquitectónico requiere parsear \x27harness.config.json\x27 de forma determinista y Fail-Closed.",
        "Corrige la sintaxis JSON en \x27harness.config.json\x27 (llaves, comas y comillas dobles)."
      );
    }

    if (!isPlainObj(raw)) {
      fail(
        "La raíz de \x27harness.config.json\x27 debe ser un objeto JSON (no arreglo, escalar ni null).",
        "El contrato Camaleón exige un objeto estructurado en la raíz de \x27harness.config.json\x27.",
        "Reemplaza la raíz de \x27harness.config.json\x27 por un objeto JSON con \x27mode\x27, \x27layerMap\x27, \x27brownfield\x27, \x27python\x27 y \x27nonDev\x27."
      );
    }

    const ALLOWED_ROOT = new Set(["mode", "activeStacks", "layerMap", "brownfield", "python", "nonDev"]);
    for (const k of Object.keys(raw)) {
      if (!ALLOWED_ROOT.has(k)) {
        fail(
          `Clave raíz desconocida \x27${k}\x27 en \x27harness.config.json\x27.`,
          "La validación Fail-Closed rechaza propiedades desconocidas en \x27harness.config.json\x27 para impedir configuraciones silenciosamente ignoradas.",
          `Elimina o corrige \x27${k}\x27 en \x27harness.config.json\x27 (permitidas: mode, activeStacks, layerMap, brownfield, python, nonDev).`
        );
      }
    }

    const VALID_MODES = new Set(["auto", "greenfield", "brownfield", "non-dev"]);
    let mode = "auto";
    if (Object.prototype.hasOwnProperty.call(raw, "mode")) {
      if (typeof raw.mode !== "string" || !VALID_MODES.has(raw.mode)) {
        fail(
          `Valor inválido para \x27mode\x27 en \x27harness.config.json\x27 (${JSON.stringify(raw.mode)}).`,
          "El campo \x27mode\x27 solo acepta los 4 perfiles canónicos del arnés Camaleón.",
          "Configura \x27\"mode\"\x27 en \x27\"auto\"\x27, \x27\"greenfield\"\x27, \x27\"brownfield\"\x27 o \x27\"non-dev\"\x27 dentro de \x27harness.config.json\x27."
        );
      }
      mode = raw.mode;
    }

    if (raw.activeStacks !== undefined) {
      if (!Array.isArray(raw.activeStacks) || !raw.activeStacks.every((s) => typeof s === "string" && s.trim().length > 0)) {
        fail(
          "El campo \x27activeStacks\x27 en \x27harness.config.json\x27 debe ser un arreglo de strings no vacíos.",
          "Fail-Closed rechaza tipos inválidos en \x27activeStacks\x27.",
          "Define \x27\"activeStacks\": []\x27 (o una lista de strings no vacíos) en \x27harness.config.json\x27."
        );
      }
    }

    const VALID_LAYERS = new Set(["types", "config", "repo", "service", "runtime", "ui"]);
    const RESERVED_DIRS = new Set([
      ".git", "node_modules", ".venv", "venv", "env", "dist", "build", "coverage",
      ".next", ".astro", ".svelte-kit", "scripts", "docs", "memory", ".agents",
      "tests", "test", "__pycache__", "deliverables"
    ]);
    const FORBIDDEN_SINGLE_LAYER_DIRS = new Set([...RESERVED_DIRS, "src", "backend", "packages", "apps"]);

    const resolvedLists = {
      types: ["types", "schemas", "interfaces", "contracts", "domain"],
      config: ["config", "settings", "constants"],
      repo: ["repo", "repositories", "db", "data", "adapters", "clients", "models"],
      service: ["service", "services", "usecases", "core", "logic"],
      runtime: ["runtime", "server", "cli", "workers", "jobs", "api", "middleware"],
      ui: ["ui", "components", "pages", "views", "app", "routes", "templates", "screens"]
    };
    const explicitClaims = new Map();

    if (raw.layerMap !== undefined) {
      if (!isPlainObj(raw.layerMap)) {
        fail(
          "El bloque \x27layerMap\x27 en \x27harness.config.json\x27 debe ser un objeto JSON.",
          "layerMap asocia las 6 capas canónicas con los directorios reales del proyecto.",
          "Define \x27\"layerMap\"\x27 como objeto JSON usando las capas types, config, repo, service, runtime y ui."
        );
      }
      for (const [rawKey, rawVal] of Object.entries(raw.layerMap)) {
        if (typeof rawKey !== "string" || !rawKey.trim()) {
          fail(
            "Clave vacía en \x27layerMap\x27 dentro de \x27harness.config.json\x27.",
            "Toda clave de \x27layerMap\x27 debe ser una capa canónica o una ruta relativa válida.",
            "Elimina claves vacías dentro de \x27layerMap\x27 en \x27harness.config.json\x27."
          );
        }
        const cleanKey = normRel(rawKey);
        const lowerKey = cleanKey.toLowerCase();

        if (Array.isArray(rawVal)) {
          if (!VALID_LAYERS.has(lowerKey)) {
            fail(
              `Capa inexistente \x27layerMap.${rawKey}\x27 en \x27harness.config.json\x27.`,
              "En formato canónico { \"<capa>\": [\"dir\"] }, la clave debe ser una de las 6 capas válidas (types, config, repo, service, runtime, ui).",
              `Reemplaza \x27${rawKey}\x27 por una capa canónica válida (ej. \x27\"repo\": [\"db\"]\x27) en \x27harness.config.json\x27.`
            );
          }
          if (rawVal.length === 0) {
            fail(
              `El arreglo \x27layerMap.${rawKey}\x27 no puede estar vacío en \x27harness.config.json\x27.`,
              "Declarar un arreglo vacío en \x27layerMap\x27 es ambiguo o intenta desactivar una capa arquitectónica.",
              `Incluye al menos un directorio válido en \x27layerMap.${rawKey}\x27 o retira la clave para conservar los alias por defecto.`
            );
          }
          const items = [];
          for (const entry of rawVal) {
            if (!isValidRelSegs(entry)) {
              fail(
                `Directorio inválido ${JSON.stringify(entry)} dentro de \x27layerMap.${rawKey}\x27 en \x27harness.config.json\x27.`,
                "Cada entrada de \x27layerMap\x27 debe ser un string de ruta relativa limpia sin \x27..\x27 ni rutas absolutas.",
                `Corrige el valor en \x27layerMap.${rawKey}\x27 dentro de \x27harness.config.json\x27.`
              );
            }
            const cleanItem = normRel(entry);
            const lowItem = cleanItem.toLowerCase();
            if (VALID_LAYERS.has(lowItem) && lowItem !== lowerKey) {
              fail(
                `Colisión ambigua en \x27layerMap.${rawKey}\x27: no se puede reasignar el nombre canónico \x27${cleanItem}\x27 hacia \x27${lowerKey}\x27.`,
                "Los 6 nombres canónicos (types, config, repo, service, runtime, ui) están reservados a su propia capa para impedir cegar fronteras.",
                `Usa un alias propio en \x27layerMap.${rawKey}\x27 sin secuestrar la capa canónica \x27${cleanItem}\x27.`
              );
            }
            if (!cleanItem.includes("/") && FORBIDDEN_SINGLE_LAYER_DIRS.has(lowItem)) {
              fail(
                `Colisión ambigua en \x27layerMap.${rawKey}\x27: el directorio contenedor o reservado \x27${cleanItem}\x27 no puede mapearse como capa.`,
                "Mapear raíces contenedoras (src, backend, packages, apps) o carpetas del arnés (scripts, tests, docs) ciega el escáner de subcapas.",
                `Mapea subdirectorios de dominio específicos en lugar de \x27${cleanItem}\x27 dentro de \x27harness.config.json\x27.`
              );
            }
            if (explicitClaims.has(lowItem) && explicitClaims.get(lowItem) !== lowerKey) {
              fail(
                `Colisión ambigua en \x27layerMap\x27: \x27${cleanItem}\x27 está asignado simultáneamente a \x27${explicitClaims.get(lowItem)}\x27 y \x27${lowerKey}\x27.`,
                "Cada directorio mapeado debe pertenecer de forma inequívoca a una sola capa.",
                `Deja \x27${cleanItem}\x27 en una única capa dentro de \x27harness.config.json\x27.`
              );
            }
            explicitClaims.set(lowItem, lowerKey);
            items.push(cleanItem);
          }
          const claimedSet = new Set(items.map((x) => x.toLowerCase()));
          for (const other of VALID_LAYERS) {
            if (other !== lowerKey) {
              resolvedLists[other] = resolvedLists[other].filter((a) => !claimedSet.has(a.toLowerCase()));
            }
          }
          const curSet = new Set(resolvedLists[lowerKey].map((a) => a.toLowerCase()));
          for (const it of items) {
            if (!curSet.has(it.toLowerCase())) {
              resolvedLists[lowerKey].push(it);
              curSet.add(it.toLowerCase());
            }
          }
        } else if (typeof rawVal === "string") {
          const targetLayer = rawVal.trim().toLowerCase();
          if (!VALID_LAYERS.has(targetLayer)) {
            fail(
              `Capa destino inexistente \x27${rawVal}\x27 en \x27layerMap.${rawKey}\x27 dentro de \x27harness.config.json\x27.`,
              "En formato invertido { \"<dir>\": \"<capa>\" }, el valor debe ser una de las 6 capas canónicas (types, config, repo, service, runtime, ui).",
              `Cambia el valor de \x27layerMap.${rawKey}\x27 a una capa válida (types, config, repo, service, runtime o ui).`
            );
          }
          if (!isValidRelSegs(rawKey)) {
            fail(
              `Ruta inválida \x27${rawKey}\x27 en \x27layerMap\x27 dentro de \x27harness.config.json\x27.`,
              "Las claves de directorio en \x27layerMap\x27 deben ser rutas relativas limpias sin \x27..\x27 ni rutas absolutas.",
              `Corrige la clave \x27${rawKey}\x27 en \x27harness.config.json\x27.`
            );
          }
          if (VALID_LAYERS.has(lowerKey) && lowerKey !== targetLayer) {
            fail(
              `Colisión ambigua en \x27layerMap\x27: no se puede reasignar la capa canónica \x27${cleanKey}\x27 hacia \x27${targetLayer}\x27.`,
              "Los 6 nombres canónicos (types, config, repo, service, runtime, ui) no pueden redirigirse hacia otra capa.",
              `Mapea únicamente carpetas legadas o personalizadas hacia \x27${targetLayer}\x27.`
            );
          }
          if (!cleanKey.includes("/") && FORBIDDEN_SINGLE_LAYER_DIRS.has(lowerKey)) {
            fail(
              `Colisión ambigua en \x27layerMap\x27: el directorio contenedor o reservado \x27${cleanKey}\x27 no puede mapearse como capa.`,
              "Mapear raíces contenedoras (src, backend, packages, apps) o carpetas del arnés ciega la resolución de capas reales.",
              `Elimina \x27${cleanKey}\x27 de \x27layerMap\x27 y mapea las carpetas internas de negocio.`
            );
          }
          if (explicitClaims.has(lowerKey) && explicitClaims.get(lowerKey) !== targetLayer) {
            fail(
              `Colisión ambigua en \x27layerMap\x27: \x27${cleanKey}\x27 está asignado tanto a \x27${explicitClaims.get(lowerKey)}\x27 como a \x27${targetLayer}\x27.`,
              "Cada directorio mapeado debe corresponder a una única capa.",
              `Elimina la asignación duplicada de \x27${cleanKey}\x27 en \x27harness.config.json\x27.`
            );
          }
          explicitClaims.set(lowerKey, targetLayer);
          for (const other of VALID_LAYERS) {
            if (other !== targetLayer) {
              resolvedLists[other] = resolvedLists[other].filter((a) => a.toLowerCase() !== lowerKey);
            }
          }
          if (!resolvedLists[targetLayer].some((a) => a.toLowerCase() === lowerKey)) {
            resolvedLists[targetLayer].push(cleanKey);
          }
        } else {
          fail(
            `Tipo inválido en \x27layerMap.${rawKey}\x27 dentro de \x27harness.config.json\x27.`,
            "Cada entrada de \x27layerMap\x27 debe ser un arreglo no vacío de strings (formato canónico) o un string de capa válida (formato invertido).",
            `Corrige el tipo de \x27layerMap.${rawKey}\x27 en \x27harness.config.json\x27.`
          );
        }
      }
    }

    const bf = raw.brownfield;
    if (bf !== undefined) {
      if (!isPlainObj(bf)) {
        fail(
          "El bloque \x27brownfield\x27 en \x27harness.config.json\x27 debe ser un objeto JSON.",
          "Fail-Closed exige tipos exactos en la configuración de tolerancia brownfield.",
          "Define \x27\"brownfield\"\x27 como objeto JSON con enabled, allowUnmappedDirs, allowEmptyDirs y maxLegacyLayerViolations."
        );
      }
      const ALLOWED_BF = new Set(["enabled", "allowUnmappedDirs", "allowEmptyDirs", "maxLegacyLayerViolations"]);
      for (const k of Object.keys(bf)) {
        if (!ALLOWED_BF.has(k)) {
          fail(
            `Clave desconocida \x27brownfield.${k}\x27 en \x27harness.config.json\x27.`,
            "El bloque \x27brownfield\x27 solo admite enabled, allowUnmappedDirs, allowEmptyDirs y maxLegacyLayerViolations.",
            `Elimina o corrige \x27brownfield.${k}\x27 en \x27harness.config.json\x27.`
          );
        }
      }
      for (const bk of ["enabled", "allowUnmappedDirs", "allowEmptyDirs"]) {
        if (bf[bk] !== undefined && typeof bf[bk] !== "boolean") {
          fail(
            `Booleano mal tipado en \x27brownfield.${bk}\x27 (${JSON.stringify(bf[bk])}) dentro de \x27harness.config.json\x27.`,
            "Fail-Closed rechaza strings como \"false\"/\"true\" o enteros en banderas booleanas.",
            `Usa un booleano literal (true o false) en \x27brownfield.${bk}\x27.`
          );
        }
      }
      if (bf.maxLegacyLayerViolations !== undefined && (!Number.isInteger(bf.maxLegacyLayerViolations) || bf.maxLegacyLayerViolations < 0)) {
        fail(
          `Valor inválido en \x27brownfield.maxLegacyLayerViolations\x27 (${JSON.stringify(bf.maxLegacyLayerViolations)}): debe ser un entero >= 0.`,
          "El trinquete brownfield requiere un número entero no negativo de violaciones legadas permitidas.",
          "Configura \x27brownfield.maxLegacyLayerViolations\x27 con un entero >= 0 (ej. 0) en \x27harness.config.json\x27."
        );
      }
    }

    const py = raw.python;
    let effectivePyRoots = ["src", "app", "backend"];
    if (py !== undefined) {
      if (!isPlainObj(py)) {
        fail(
          "El bloque \x27python\x27 en \x27harness.config.json\x27 debe ser un objeto JSON.",
          "Fail-Closed exige tipos exactos en la configuración Python del arnés.",
          "Define \x27\"python\"\x27 como objeto JSON con requireVenvForPip, packageRoots y enforceAstChecks."
        );
      }
      const ALLOWED_PY = new Set(["requireVenvForPip", "packageRoots", "enforceAstChecks"]);
      for (const k of Object.keys(py)) {
        if (!ALLOWED_PY.has(k)) {
          fail(
            `Clave desconocida \x27python.${k}\x27 en \x27harness.config.json\x27.`,
            "El bloque \x27python\x27 solo admite requireVenvForPip, packageRoots y enforceAstChecks.",
            `Elimina o corrige \x27python.${k}\x27 en \x27harness.config.json\x27.`
          );
        }
      }
      for (const bk of ["requireVenvForPip", "enforceAstChecks"]) {
        if (py[bk] !== undefined && typeof py[bk] !== "boolean") {
          fail(
            `Booleano mal tipado en \x27python.${bk}\x27 (${JSON.stringify(py[bk])}) dentro de \x27harness.config.json\x27.`,
            "Las opciones booleanas de \x27python\x27 solo aceptan literales true o false.",
            `Cambia \x27python.${bk}\x27 a true o false en \x27harness.config.json\x27.`
          );
        }
      }
      if (py.packageRoots !== undefined) {
        if (!Array.isArray(py.packageRoots) || py.packageRoots.length === 0 || !py.packageRoots.every((r) => isValidRelSegs(r))) {
          fail(
            "El campo \x27python.packageRoots\x27 en \x27harness.config.json\x27 debe ser un arreglo no vacío de rutas relativas limpias.",
            "packageRoots define las raíces de paquetes Python sin rutas absolutas ni segmentos \x27..\x27.",
            "Configura \x27\"packageRoots\": [\"src\", \"app\", \"backend\"]\x27 en \x27harness.config.json\x27."
          );
        }
        for (const r of py.packageRoots) {
          const lowR = normRel(r).toLowerCase();
          if (RESERVED_DIRS.has(lowR)) {
            fail(
              `Raíz reservada inválida \x27${r}\x27 en \x27python.packageRoots\x27 dentro de \x27harness.config.json\x27.`,
              "Las carpetas internas del arnés o entornos (.venv, scripts, tests, docs, node_modules) no pueden declararse como packageRoots.",
              `Retira \x27${r}\x27 de \x27python.packageRoots\x27 en \x27harness.config.json\x27.`
            );
          }
        }
        effectivePyRoots = py.packageRoots.map((r) => normRel(r));
      }
    }

    const resolvedSegToLayer = new Map();
    for (const canon of VALID_LAYERS) {
      resolvedSegToLayer.set(canon, canon);
      for (const item of resolvedLists[canon]) {
        resolvedSegToLayer.set(item.toLowerCase(), canon);
      }
    }
    for (const pr of effectivePyRoots) {
      const lowPr = pr.toLowerCase();
      if (resolvedSegToLayer.has(lowPr)) {
        const mappedLayer = resolvedSegToLayer.get(lowPr);
        const isStandardAppDefault = lowPr === "app" && mappedLayer === "ui" && (!explicitClaims.has("app") || explicitClaims.get("app") === "ui");
        if (!isStandardAppDefault) {
          fail(
            `Colisión ambigua en \x27harness.config.json\x27: \x27${pr}\x27 figura simultáneamente en \x27python.packageRoots\x27 y como carpeta mapeada a la capa \x27${mappedLayer}\x27 en \x27layerMap\x27.`,
            "Declarar una carpeta mapeada de capa como packageRoot ciega o distorsiona la detección del flujo direccional de 6 capas.",
            `Usa raíces contenedoras separadas en \x27python.packageRoots\x27 (ej. src, backend) y deja \x27${pr}\x27 únicamente en \x27layerMap\x27.`
          );
        }
      }
    }

    const nd = raw.nonDev;
    if (nd !== undefined) {
      if (!isPlainObj(nd)) {
        fail(
          "El bloque \x27nonDev\x27 en \x27harness.config.json\x27 debe ser un objeto JSON.",
          "Fail-Closed exige tipos exactos en la configuración documental nonDev.",
          "Define \x27\"nonDev\"\x27 como objeto JSON con deliverableDirs, forbidPlaceholders, checkMarkdownLinks y minDeliverableWords."
        );
      }
      const ALLOWED_ND = new Set(["deliverableDirs", "forbidPlaceholders", "checkMarkdownLinks", "minDeliverableWords"]);
      for (const k of Object.keys(nd)) {
        if (!ALLOWED_ND.has(k)) {
          fail(
            `Clave desconocida \x27nonDev.${k}\x27 en \x27harness.config.json\x27.`,
            "El bloque \x27nonDev\x27 solo admite deliverableDirs, forbidPlaceholders, checkMarkdownLinks y minDeliverableWords.",
            `Elimina o corrige \x27nonDev.${k}\x27 en \x27harness.config.json\x27.`
          );
        }
      }
      if (nd.deliverableDirs !== undefined && (!Array.isArray(nd.deliverableDirs) || nd.deliverableDirs.length === 0 || !nd.deliverableDirs.every((d) => isValidRelSegs(d)))) {
        fail(
          "El campo \x27nonDev.deliverableDirs\x27 en \x27harness.config.json\x27 debe ser un arreglo no vacío de directorios relativos.",
          "deliverableDirs indica las carpetas de entregables auditadas en modo non-dev.",
          "Configura \x27\"deliverableDirs\": [\"deliverables\", \"content\", \"research\", \"reports\"]\x27 en \x27harness.config.json\x27."
        );
      }
      for (const bk of ["forbidPlaceholders", "checkMarkdownLinks"]) {
        if (nd[bk] !== undefined && typeof nd[bk] !== "boolean") {
          fail(
            `Booleano mal tipado en \x27nonDev.${bk}\x27 (${JSON.stringify(nd[bk])}) dentro de \x27harness.config.json\x27.`,
            "Fail-Closed rechaza strings como \"false\"/\"true\" en banderas booleanas de nonDev.",
            `Cambia \x27nonDev.${bk}\x27 a un booleano literal (true o false) en \x27harness.config.json\x27.`
          );
        }
      }
      if (nd.minDeliverableWords !== undefined && (!Number.isInteger(nd.minDeliverableWords) || nd.minDeliverableWords < 0)) {
        fail(
          `Valor inválido en \x27nonDev.minDeliverableWords\x27 (${JSON.stringify(nd.minDeliverableWords)}): debe ser un entero >= 0.`,
          "minDeliverableWords define el umbral mínimo entero de palabras reales en entregables cerrados.",
          "Configura \x27nonDev.minDeliverableWords\x27 con un entero >= 0 (ej. 15) en \x27harness.config.json\x27."
        );
      }
    }

    const allowEmpty = Boolean(bf?.allowEmptyDirs === true);
    console.log(`OK|${mode}|${allowEmpty ? "true" : "false"}`);
  ')"
  cfg_meta="${cfg_meta%$'\r'}"
  IFS="|" read -r cfg_status cfg_f1 cfg_f2 cfg_f3 <<< "$cfg_meta"
  if [ "$cfg_status" != "OK" ]; then
    red_pen_error \
      "${cfg_f1:-Configuración inválida en 'harness.config.json'.}" \
      "${cfg_f2:-El vigilante arquitectónico requiere leer 'harness.config.json' de forma determinista y Fail-Closed.}" \
      "${cfg_f3:-Verifica que 'harness.config.json' cumpla estrictamente el esquema de mode, layerMap, brownfield, python y nonDev.}"
  fi
  HARNESS_MODE="$cfg_f1"
  ALLOW_EMPTY_DIRS="$cfg_f2"
fi

echo "--- [Vigilante Arquitectónico] 1. Verificando Mapa de Dominios y Modelo de 6 Capas en ARCHITECTURE.md (modo: $HARNESS_MODE) ---"
if [ ! -f "ARCHITECTURE.md" ]; then
  red_pen_error \
    "No se encontró 'ARCHITECTURE.md' en la raíz del proyecto." \
    "El arnés requiere un mapa explícito de dominios (y el flujo direccional de 6 capas en proyectos de código) para evitar desorden estructural." \
    "Crea 'ARCHITECTURE.md' en la raíz con 'Mapa de Dominios' (y las 6 capas si el proyecto es de software)."
fi

if [ "$HARNESS_MODE" = "non-dev" ]; then
  if ! grep -Fq "Mapa de Dominios" "ARCHITECTURE.md"; then
    red_pen_error \
      "Falta la sección obligatoria 'Mapa de Dominios' dentro de 'ARCHITECTURE.md' (modo 'non-dev')." \
      "Incluso en proyectos de investigación, documentación o análisis ('non-dev'), el arnés exige definir las áreas y entregables del dominio en 'ARCHITECTURE.md'." \
      "Añade la sección 'Mapa de Dominios' en 'ARCHITECTURE.md' describiendo la estructura de entregables y fuentes del proyecto."
  fi
else
  for section in "Mapa de Dominios" "Modelo Estricto de Capas" "Reglas Duras de Dependencia" "Capability Seams" "Interfaces Transversales" "Puntos Calientes Actuales" "Types" "Config" "Repo" "Service" "Runtime" "UI"; do
    if ! grep -Fq "$section" "ARCHITECTURE.md"; then
      red_pen_error \
        "Falta la sección o capa obligatoria '$section' dentro de 'ARCHITECTURE.md'." \
        "El modelo arquitectónico de OpenAI y DeepSeek exige documentar el mapa de dominios, el flujo de 6 capas (Types -> Config -> Repo -> Service -> Runtime -> UI), Capability Seams, Interfaces Transversales y Puntos Calientes Actuales." \
        "Añade '$section' en 'ARCHITECTURE.md' respetando la estructura canónica del arnés (o configura '\"mode\": \"non-dev\"' en 'harness.config.json' si no es un proyecto de código)."
    fi
  done
fi

echo "--- [Vigilante Arquitectónico] 2. Verificando Flujo Direccional de Capas (Prohibido ir hacia atrás o saltar capas) ---"
# Verificación sobre las capas actuales del arnés (scripts/lib = Repo/Service vs scripts/validate-harness.mjs y scripts/harness-hooks.mjs = Runtime)
for lib_file in scripts/lib/*.mjs; do
  [ -e "$lib_file" ] || continue
  if grep -Eq "validate-harness\.mjs|harness-hooks\.mjs|process\.exit\(" "$lib_file"; then
    red_pen_error \
      "Violación de capa en '$lib_file': una capa inferior (Repo/Service en scripts/lib/) importa de Runtime ('validate-harness.mjs' / 'harness-hooks.mjs') o invoca 'process.exit('." \
      "La Regla Dura #1 de ARCHITECTURE.md prohíbe dependencias hacia atrás (Repo/Service nunca puede depender de Runtime)." \
      "Elimina la referencia a Runtime o 'process.exit(' en '$lib_file' y devuelve un objeto de resultado para que la capa Runtime decida el código de salida."
  fi
done

# Verificación mecánica políglota en Node.js (Monorepos + Web ESM/CJS/Template Imports/Astro/Vue/Svelte/MDX + Python + layerMap + Brownfield Ratchet + allowUnmappedDirs)
if [ "$HARNESS_MODE" != "non-dev" ]; then
  src_layer_result="$(node -e '
    const fs = require("node:fs");
    const path = require("node:path");
    const cleanField = (s) => String(s || "").replace(/[|\r\n]+/g, " ").trim();

    let cfg = {};
    if (fs.existsSync("harness.config.json")) {
      cfg = JSON.parse(fs.readFileSync("harness.config.json", "utf8")) || {};
    }

    const cfgMode = typeof cfg.mode === "string" && cfg.mode.trim() ? cfg.mode.trim() : "auto";
    const VALID_LAYERS = new Set(["types", "config", "repo", "service", "runtime", "ui"]);
    const FORBIDDEN_BY_LAYER = {
      types: new Set(["config", "repo", "service", "runtime", "ui"]),
      config: new Set(["repo", "service", "runtime", "ui"]),
      repo: new Set(["service", "runtime", "ui"]),
      service: new Set(["runtime", "ui"]),
      runtime: new Set(["ui"]),
      ui: new Set(["config", "repo"])
    };

    const BASE_LAYER_LISTS = {
      types: ["types", "schemas", "interfaces", "contracts", "domain"],
      config: ["config", "settings", "constants"],
      repo: ["repo", "repositories", "db", "data", "adapters", "clients", "models"],
      service: ["service", "services", "usecases", "core", "logic"],
      runtime: ["runtime", "server", "cli", "workers", "jobs", "api", "middleware"],
      ui: ["ui", "components", "pages", "views", "app", "routes", "templates", "screens"]
    };

    const directOverrides = [];
    const customTopDirs = [];
    const customClaimedSegs = new Set();
    if (cfg.layerMap && typeof cfg.layerMap === "object" && !Array.isArray(cfg.layerMap)) {
      for (const [rawKey, rawVal] of Object.entries(cfg.layerMap)) {
        const cleanKey = String(rawKey || "").trim().replace(/\\/g, "/").replace(/^\.\/+/, "").replace(/^\/+|\/+$/g, "");
        if (!cleanKey) continue;
        const lowerKey = cleanKey.toLowerCase();
        if (Array.isArray(rawVal) && VALID_LAYERS.has(lowerKey)) {
          const items = rawVal
            .map((item) => String(item || "").trim().replace(/\\/g, "/").replace(/^\.\/+/, "").replace(/^\/+|\/+$/g, ""))
            .filter(Boolean);
          const claimedLower = new Set(items.map((x) => x.toLowerCase()));
          for (const other of VALID_LAYERS) {
            if (other !== lowerKey) {
              BASE_LAYER_LISTS[other] = BASE_LAYER_LISTS[other].filter((a) => !claimedLower.has(a.toLowerCase()));
            }
          }
          const existingLower = new Set(BASE_LAYER_LISTS[lowerKey].map((a) => a.toLowerCase()));
          for (const it of items) {
            if (!existingLower.has(it.toLowerCase())) {
              BASE_LAYER_LISTS[lowerKey].push(it);
              existingLower.add(it.toLowerCase());
            }
            customTopDirs.push(it.split("/")[0]);
            if (!it.includes("/")) customClaimedSegs.add(it.toLowerCase());
          }
          continue;
        }
        const layer = String(rawVal || "").trim().toLowerCase();
        if (!VALID_LAYERS.has(layer)) continue;
        for (const other of VALID_LAYERS) {
          if (other !== layer) {
            BASE_LAYER_LISTS[other] = BASE_LAYER_LISTS[other].filter((a) => a.toLowerCase() !== lowerKey);
          }
        }
        directOverrides.push([cleanKey, layer]);
        customTopDirs.push(cleanKey.split("/")[0]);
        if (!cleanKey.includes("/")) customClaimedSegs.add(lowerKey);
      }
    }

    const DIR_TO_LAYER = {};
    const PATH_PREFIX_TO_LAYER = [];
    for (const canon of VALID_LAYERS) {
      for (const item of BASE_LAYER_LISTS[canon]) {
        if (item.includes("/")) PATH_PREFIX_TO_LAYER.push([item.toLowerCase(), canon]);
        else { DIR_TO_LAYER[item] = canon; DIR_TO_LAYER[item.toLowerCase()] = canon; }
      }
      DIR_TO_LAYER[canon] = canon;
    }
    for (const [cleanKey, layer] of directOverrides) {
      if (cleanKey.includes("/")) PATH_PREFIX_TO_LAYER.push([cleanKey.toLowerCase(), layer]);
      else { DIR_TO_LAYER[cleanKey] = layer; DIR_TO_LAYER[cleanKey.toLowerCase()] = layer; }
    }
    for (const canon of VALID_LAYERS) {
      DIR_TO_LAYER[canon] = canon;
    }
    PATH_PREFIX_TO_LAYER.sort((a, b) => b[0].length - a[0].length);

    const maxLegacyLayerViolations = Number.isInteger(cfg?.brownfield?.maxLegacyLayerViolations) && cfg.brownfield.maxLegacyLayerViolations >= 0
      ? cfg.brownfield.maxLegacyLayerViolations
      : 0;
    const enforceMappedDirs = (cfgMode === "brownfield" || cfg?.brownfield?.enabled === true)
      && cfg?.brownfield?.allowUnmappedDirs === false;

    const pyRootsCfg = Array.isArray(cfg?.python?.packageRoots)
      ? cfg.python.packageRoots
      : ["src", "app", "backend"];
    const sanitizedPyRoots = pyRootsCfg
      .map((r) => String(r || "").trim().replace(/\\/g, "/").replace(/^\.\/+/, "").replace(/^\/+|\/+$/g, ""))
      .filter((r) => r && r !== "." && !r.startsWith(".."));

    const packageRootsList = Array.from(new Set(["src", "app", "backend", ...sanitizedPyRoots]));
    const SKIP_CODE_DIRS = new Set([
      ".git", "node_modules", ".venv", "venv", "env", "dist", "build", "coverage",
      ".next", ".astro", ".svelte-kit", "scripts", "docs", "memory", ".agents",
      "tests", "test", "__pycache__", ".pytest_cache", ".mypy_cache", ".ruff_cache"
    ]);
    const KNOWN_ROOTS = new Set(packageRootsList);
    const KNOWN_ROOTS_LOWER = new Set(packageRootsList.map((r) => r.toLowerCase()));
    const extraMappedRoots = customTopDirs.filter((d) => d && !d.startsWith(".") && !SKIP_CODE_DIRS.has(d) && !SKIP_CODE_DIRS.has(d.toLowerCase()));
    const extraMappedRootsLower = new Set(extraMappedRoots.map((d) => d.toLowerCase()));

    const REPO_TOP_DIRS_LOWER = new Set();
    try {
      for (const ent of fs.readdirSync(".", { withFileTypes: true })) {
        if (ent.isDirectory() && !ent.name.startsWith(".") && !SKIP_CODE_DIRS.has(ent.name) && !SKIP_CODE_DIRS.has(ent.name.toLowerCase())) {
          REPO_TOP_DIRS_LOWER.add(ent.name.toLowerCase());
        }
      }
    } catch {}

    const ALL_SEGMENTS = new Set(Object.keys(DIR_TO_LAYER));
    const ALL_SEGMENTS_LOWER = new Set(Array.from(ALL_SEGMENTS).map((s) => s.toLowerCase()));
    const escapeRe = (s) => s.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
    const segAlt = Array.from(ALL_SEGMENTS).map(escapeRe).join("|");
    const ALIAS_RE = segAlt ? new RegExp("^[@#](" + segAlt + ")(\\/.*|$)", "i") : /(?!)/;

    const CODE_EXT_RE = /\.(?:[cm]?js|tsx?|jsx|astro|vue|svelte|mdx|py)$/i;
    const SFC_HTML_EXT = new Set([".astro", ".vue", ".svelte", ".mdx"]);

    function stripJsComments(code) {
      let out = "", i = 0, quote = "";
      while (i < code.length) {
        const ch = code[i], next = code[i + 1];
        if (quote) {
          out += ch;
          if (ch === "\\" && i + 1 < code.length) { out += code[++i]; }
          else if (ch === quote) { quote = ""; }
          i += 1;
          continue;
        }
        if (ch === "\"" || ch === "\x27" || ch === "`") { quote = ch; out += ch; i += 1; continue; }
        if (ch === "/" && next === "/") {
          while (i < code.length && code[i] !== "\n") i += 1;
          continue;
        }
        if (ch === "/" && next === "*") {
          i += 2;
          while (i < code.length && !(code[i] === "*" && code[i + 1] === "/")) {
            if (code[i] === "\n") out += "\n";
            i += 1;
          }
          i += 2;
          continue;
        }
        out += ch;
        i += 1;
      }
      return out;
    }

    function stripPyComments(code) {
      return code
        .replace(/\"\"\"[\s\S]*?\"\"\"|\x27\x27\x27[\s\S]*?\x27\x27\x27/g, "")
        .split(/\r?\n/)
        .map((line) => {
          let out = "", q = "";
          for (let i = 0; i < line.length; i += 1) {
            const ch = line[i];
            if (q) { out += ch; if (ch === "\\" && i + 1 < line.length) out += line[++i]; else if (ch === q) q = ""; continue; }
            if (ch === "\"" || ch === "\x27") { q = ch; out += ch; continue; }
            if (ch === "#") break;
            out += ch;
          }
          return out;
        })
        .join("\n");
    }

    function isInternalFirstSeg(firstSeg) {
      const low = String(firstSeg || "").toLowerCase();
      return KNOWN_ROOTS_LOWER.has(low) || ALL_SEGMENTS_LOWER.has(low) || extraMappedRootsLower.has(low) || REPO_TOP_DIRS_LOWER.has(low);
    }

    function extractSpecifiers(code, ext) {
      const specs = [];
      if (ext === ".py") {
        const clean = stripPyComments(code);
        const fromRe = /^\s*from\s+(\.+[A-Za-z0-9_.]*|[A-Za-z_][A-Za-z0-9_]*(?:\.[A-Za-z_][A-Za-z0-9_]*)*)\s+import\s+(?:\(([\s\S]*?)\)|([^\n;]+))/gm;
        for (const m of clean.matchAll(fromRe)) {
          const mod = m[1];
          const rawNames = (m[2] !== undefined ? m[2] : m[3] || "");
          const names = rawNames
            .replace(/[()\\]/g, " ")
            .split(",")
            .map((s) => s.trim().split(/\s+as\s+/)[0].trim())
            .filter((s) => s && s !== "*");
          if (mod.startsWith(".")) {
            const dots = (mod.match(/^\.+/) || [""])[0].length;
            const rest = mod.slice(dots).replace(/\./g, "/");
            const prefix = dots === 1 ? "./" : "../".repeat(dots - 1);
            if (rest) specs.push({ raw: mod, spec: prefix + rest, isPyInternal: true, isDirPrefix: false });
            else for (const n of names) specs.push({ raw: `${mod} import ${n}`, spec: prefix + n.replace(/\./g, "/"), isPyInternal: true, isDirPrefix: false });
          } else {
            const parts = mod.split(".");
            const firstSeg = parts[0];
            if (!isInternalFirstSeg(firstSeg)) continue;
            if (parts.length === 1 && KNOWN_ROOTS_LOWER.has(firstSeg.toLowerCase())) {
              for (const n of names) specs.push({ raw: `${mod}.${n}`, spec: `${firstSeg}/${n.replace(/\./g, "/")}`, isPyInternal: true, isDirPrefix: false });
            } else {
              specs.push({ raw: mod, spec: mod.replace(/\./g, "/"), isPyInternal: true, isDirPrefix: false });
            }
          }
        }
        for (const m of clean.matchAll(/^\s*import\s+([^\n;]+)/gm)) {
          for (const item of m[1].split(",")) {
            const mod = item.trim().split(/\s+as\s+/)[0].trim();
            if (!mod) continue;
            const firstSeg = mod.split(".")[0];
            if (isInternalFirstSeg(firstSeg)) {
              specs.push({ raw: mod, spec: mod.replace(/\./g, "/"), isPyInternal: true, isDirPrefix: false });
            }
          }
        }
      } else {
        const preClean = SFC_HTML_EXT.has(ext) ? code.replace(/<!--[\s\S]*?-->/g, "") : code;
        const clean = stripJsComments(preClean);
        for (const m of clean.matchAll(/\b(?:import|export)\s+(?:type\s+)?(?:[^;\x27"`]*?\s+from\s+)[\x27"]([^\x27"]+)[\x27"]/g)) {
          specs.push({ raw: m[1], spec: m[1], isPyInternal: false, isDirPrefix: m[1].endsWith("/") });
        }
        for (const m of clean.matchAll(/\bimport\s+[\x27"]([^\x27"]+)[\x27"]/g)) {
          specs.push({ raw: m[1], spec: m[1], isPyInternal: false, isDirPrefix: m[1].endsWith("/") });
        }
        for (const m of clean.matchAll(/\b(?:import|require)\s*\(\s*([\x27"`])([^\x27"`$]+)\1\s*(?:,[\s\S]*?)?\)/g)) {
          specs.push({ raw: m[2], spec: m[2], isPyInternal: false, isDirPrefix: m[2].endsWith("/") });
        }
        for (const m of clean.matchAll(/\b(?:import|require)\s*\(\s*`([^`$]*)\$\{/g)) {
          const staticPrefix = m[1].trim();
          if (staticPrefix) {
            specs.push({
              raw: `${staticPrefix}\${...}`,
              spec: staticPrefix,
              isPyInternal: false,
              isDirPrefix: staticPrefix.endsWith("/")
            });
          }
        }
        for (const m of clean.matchAll(/\b(?:import|require)\s*\(\s*([\x27"`])([^\x27"`$]+)\1\s*\+/g)) {
          const staticPrefix = m[2].trim();
          if (staticPrefix) {
            specs.push({
              raw: `${staticPrefix}+...`,
              spec: staticPrefix,
              isPyInternal: false,
              isDirPrefix: staticPrefix.endsWith("/")
            });
          }
        }
      }
      return specs;
    }

    function walkProjectCodeFiles(dir, out = []) {
      if (!fs.existsSync(dir)) return out;
      let entries = [];
      try {
        entries = fs.readdirSync(dir, { withFileTypes: true }).sort((a, b) => a.name.localeCompare(b.name));
      } catch {
        return out;
      }
      for (const entry of entries) {
        if (SKIP_CODE_DIRS.has(entry.name) || SKIP_CODE_DIRS.has(entry.name.toLowerCase()) || entry.name.endsWith(".egg-info")) continue;
        const full = path.join(dir, entry.name);
        if (entry.isDirectory()) walkProjectCodeFiles(full, out);
        else if (entry.isFile() && CODE_EXT_RE.test(entry.name)) out.push(full);
      }
      return out;
    }

    function inferLayerFromDirPosix(dirPosix, ext) {
      if (!dirPosix || dirPosix === ".") return "";
      const norm = dirPosix.replace(/\\/g, "/").replace(/^\.\/+/, "").replace(/^\/+|\/+$/g, "");
      if (!norm || norm === ".") return "";
      const lowNorm = norm.toLowerCase();

      let bestPrefixLayer = "";
      let bestEndIdx = -1;
      let bestLen = -1;
      for (const [pref, layer] of PATH_PREFIX_TO_LAYER) {
        let endIdx = -1;
        if (lowNorm === pref) endIdx = lowNorm.length;
        else if (lowNorm.endsWith("/" + pref)) endIdx = lowNorm.length;
        else {
          const needle = "/" + pref + "/";
          const lastPos = lowNorm.lastIndexOf(needle);
          if (lastPos !== -1) endIdx = lastPos + 1 + pref.length;
          else if (lowNorm.startsWith(pref + "/")) endIdx = pref.length;
        }
        if (endIdx > bestEndIdx || (endIdx === bestEndIdx && pref.length > bestLen)) {
          bestEndIdx = endIdx;
          bestLen = pref.length;
          bestPrefixLayer = layer;
        }
      }
      if (bestPrefixLayer) return bestPrefixLayer;

      const segs = norm.split("/").filter(Boolean);
      for (let i = segs.length - 1; i >= 0; i -= 1) {
        const seg = segs[i];
        const low = seg.toLowerCase();
        if (low === "app" && KNOWN_ROOTS_LOWER.has("app") && ext === ".py") continue;
        if (i === 0 && KNOWN_ROOTS_LOWER.has(low) && low !== "app") continue;
        if (DIR_TO_LAYER[seg]) return DIR_TO_LAYER[seg];
        if (DIR_TO_LAYER[low]) return DIR_TO_LAYER[low];
      }
      return "";
    }

    function isInternalJsSpec(spec, aliasMatch) {
      if (aliasMatch) return true;
      if (/^(?:\.\/|\.\.\/|@\/|~\/|#\/|\.\.?$)/.test(spec)) return true;
      if (spec.includes(":")) return false;
      const cleanSpec = spec.replace(/\/+$/, "");
      if (cleanSpec.includes("/")) {
        const first = cleanSpec.split("/")[0];
        if (first.startsWith("@")) return false;
        return isInternalFirstSeg(first);
      }
      return customClaimedSegs.has(cleanSpec.toLowerCase());
    }

    const allFiles = walkProjectCodeFiles(".");
    const seenViolations = new Set();
    const violations = [];
    const unmappedFiles = [];

    for (const filePath of allFiles) {
      const ext = path.extname(filePath).toLowerCase();
      const relFilePosix = path.relative(".", filePath).replace(/\\/g, "/");
      const fileRelDirFromRepo = path.posix.dirname(relFilePosix);

      const sourceLayer = inferLayerFromDirPosix(fileRelDirFromRepo, ext);
      if (!sourceLayer) {
        if (enforceMappedDirs && fileRelDirFromRepo !== "." && !KNOWN_ROOTS_LOWER.has(fileRelDirFromRepo.toLowerCase())) {
          unmappedFiles.push({ file: relFilePosix, dir: fileRelDirFromRepo });
        }
        continue;
      }

      const forbiddenSet = FORBIDDEN_BY_LAYER[sourceLayer];
      const extracted = extractSpecifiers(fs.readFileSync(filePath, "utf8"), ext);

      for (const item of extracted) {
        const rawSpec = item.raw;
        const spec = item.spec.trim().replace(/\\/g, "/").split(/[?#]/)[0];
        if (!spec) continue;
        const aliasMatch = spec.match(ALIAS_RE);
        const isInternal = item.isPyInternal || isInternalJsSpec(spec, aliasMatch);
        if (!isInternal) continue;

        let targetRel = "";
        if (aliasMatch) {
          targetRel = aliasMatch[1] + (aliasMatch[2] || "");
        } else if (spec.startsWith(".")) {
          targetRel = path.posix.normalize(path.posix.join(fileRelDirFromRepo, spec)).replace(/^(?:\.\.\/)+/, "");
        } else {
          targetRel = path.posix.normalize(spec.replace(/^(?:@\/|~\/|#\/)/, ""));
        }

        const hadTrailingSlash = item.isDirPrefix || spec.endsWith("/") || targetRel.endsWith("/");
        const cleanTarget = targetRel.replace(/\/+$/, "");
        if (!cleanTarget || cleanTarget === ".") continue;

        let isDirTarget = hadTrailingSlash;
        if (!isDirTarget) {
          try {
            if (fs.existsSync(cleanTarget) && fs.statSync(cleanTarget).isDirectory()) isDirTarget = true;
          } catch {}
        }

        let targetLayer = "";
        if (isDirTarget) {
          targetLayer = inferLayerFromDirPosix(cleanTarget, ext);
        } else {
          const dirPart = path.posix.dirname(cleanTarget);
          if (dirPart && dirPart !== ".") {
            targetLayer = inferLayerFromDirPosix(dirPart, ext);
          }
          if (!targetLayer && !CODE_EXT_RE.test(cleanTarget)) {
            targetLayer = inferLayerFromDirPosix(cleanTarget, ext);
          }
        }

        if (targetLayer && targetLayer !== sourceLayer && forbiddenSet.has(targetLayer)) {
          const key = `${relFilePosix}|${sourceLayer}|${targetLayer}|${rawSpec}`;
          if (!seenViolations.has(key)) {
            seenViolations.add(key);
            violations.push({ file: relFilePosix, src: sourceLayer, dst: targetLayer, spec: rawSpec });
          }
        }
      }
    }

    if (unmappedFiles.length > 0) {
      const firstU = unmappedFiles[0];
      console.log(`UNMAPPED|${unmappedFiles.length}|${cleanField(firstU.file)}|${cleanField(firstU.dir)}`);
    } else if (violations.length > maxLegacyLayerViolations) {
      const first = violations[0];
      console.log(`FAIL|${violations.length}|${maxLegacyLayerViolations}|${cleanField(first.file)}|${cleanField(first.src)}|${cleanField(first.dst)}|${cleanField(first.spec)}`);
    } else if (maxLegacyLayerViolations > 0) {
      console.log(`WARN|${violations.length}|${maxLegacyLayerViolations}`);
    }
  ')"
  src_layer_result="${src_layer_result%$'\r'}"
  if [ -n "$src_layer_result" ]; then
    IFS="|" read -r v_status v_count v_max v_file v_src v_dst v_spec <<< "$src_layer_result"
    if [ "$v_status" = "UNMAPPED" ]; then
      red_pen_error \
        "Directorio de código no mapeado detectado en modo brownfield estricto ('allowUnmappedDirs: false'): '$v_count' archivo(s) fuera de 'layerMap' (ejemplo: '$v_max' en '$v_file')." \
        "Cuando 'brownfield.allowUnmappedDirs' es 'false', todo módulo de código fuera de raíz, 'tests/' y 'scripts/' debe pertenecer explícitamente a una de las 6 capas." \
        "Registra el directorio '$v_file' dentro de 'layerMap' en 'harness.config.json' o reubica '$v_max' en su capa correspondiente."
    elif [ "$v_status" = "FAIL" ]; then
      if [ "$v_src" = "ui" ]; then
        red_pen_error \
          "Salto ilegal de capas en '$v_file': la capa UI importa '$v_spec' hacia '$v_dst' (Detectadas $v_count violaciones; tope permitido: $v_max)." \
          "La Regla Dura #2 de ARCHITECTURE.md permite a UI consumir contratos puros de Types, pero prohíbe saltar Service/Runtime para acceder directamente a Config o Repo." \
          "Enruta el acceso a datos o configuración desde '$v_file' a través de un servicio o adaptador expuesto en 'service/' o 'runtime/'."
      else
        red_pen_error \
          "Violación direccional en '$v_file': la capa '$v_src' importa '$v_spec' desde una capa superior ('$v_dst') (Detectadas $v_count violaciones; tope permitido: $v_max)." \
          "La Regla Dura #1 de ARCHITECTURE.md exige respetar estrictamente el flujo 'Types -> Config -> Repo -> Service -> Runtime -> UI' sin dependencias hacia atrás." \
          "Elimina la importación '$v_spec' en '$v_file' o invierte la dependencia mediante contratos puros en 'types/'."
      fi
    elif [ "$v_status" = "WARN" ]; then
      echo "AVISO [Brownfield Ratchet]: Detectadas $v_count violaciones legadas dentro del tope permitido ($v_count <= $v_max). Prohibido subir este techo; redúcelo en 'harness.config.json' conforme refactorices."
    fi
  fi
fi

echo "--- [Vigilante Arquitectónico] 3. Verificando Invariantes de Auto-Memoria (Gotcha #1 y #15) ---"
if [ -f "memory/INDEX.md" ]; then
  mem_check="$(node -e '
    const fs = require("node:fs");
    const path = require("node:path");
    const clean = (s) => String(s || "").replace(/[|\r\n]+/g, " ").trim();
    const fail = (err, why, fix) => {
      console.log(`FAIL|${clean(err)}|${clean(why)}|${clean(fix)}`);
      process.exit(0);
    };

    const repoRoot = path.resolve(".");
    const memDir = path.resolve("memory");
    const buf = fs.readFileSync("memory/INDEX.md");
    const indexBytes = buf.length;
    const rawContent = buf.toString("utf8");
    const normContent = rawContent.replace(/\r\n/g, "\n").replace(/\r/g, "\n");
    const indexLines = normContent.length === 0
      ? 0
      : (normContent.endsWith("\n") ? normContent.slice(0, -1) : normContent).split("\n").length;

    if (indexLines > 200 || indexBytes > 25600) {
      fail(
        `\x27memory/INDEX.md\x27 excede el límite estricto (${indexLines} líneas / ${indexBytes} bytes; máximo permitido: 200 líneas o 25600 bytes).`,
        "Gotcha #1: Superar las 200 líneas o 25 KB provoca truncamiento silencioso del índice de memoria al cargarse en el contexto del agente.",
        "Mueve las explicaciones detalladas a archivos dentro de \x27memory/topics/*.md\x27 y deja únicamente 1 línea de gancho por tema en \x27memory/INDEX.md\x27."
      );
    }

    function stripCodeSpansAndFences(md) {
      const lines = md.split("\n");
      let fence = "";
      return lines.map((line) => {
        const trimmed = line.trimStart();
        if (!fence) {
          const m = trimmed.match(/^(`{3,}|~{3,})/);
          if (m) { fence = m[1]; return ""; }
          return line.replace(/`+[^`]*`+/g, (sp) => " ".repeat(sp.length));
        }
        if (trimmed.startsWith(fence[0].repeat(fence.length)) && new RegExp("^" + fence[0] + "{" + fence.length + ",}\\s*$").test(trimmed)) {
          fence = "";
        }
        return "";
      }).join("\n");
    }

    function normalizeMdTarget(rawTarget) {
      let t = String(rawTarget || "").trim();
      if (!t) return null;
      if (t.startsWith("<")) {
        const close = t.indexOf(">");
        if (close > 0) t = t.slice(1, close).trim();
      } else {
        t = t.replace(/\s+(?:"[^"]*"|\x27[^\x27]*\x27|\([^)]*\))\s*$/, "").trim();
      }
      if (!t || t.startsWith("#")) return null;
      if (/^[a-zA-Z][a-zA-Z0-9+.-]*:/.test(t)) return null;
      const base = t.split("#")[0].split("?")[0].trim();
      if (!base) return null;
      try { return decodeURIComponent(base); } catch { return base; }
    }

    const strippedIndex = stripCodeSpansAndFences(normContent.replace(/<!--[\s\S]*?-->/g, ""));
    const strippedLines = strippedIndex.split("\n");
    const inlineLinkRe = /!?\[[^\]]*\]\(([^)\n]+)\)/g;
    const refDefRe = /^[ ]{0,3}\[[^\]]+\]:\s*(\S+)/;

    for (let i = 0; i < strippedLines.length; i += 1) {
      const line = strippedLines[i];
      const targets = [];
      for (const m of line.matchAll(inlineLinkRe)) targets.push(m[1]);
      const rm = line.match(refDefRe);
      if (rm) targets.push(rm[1]);

      for (const rawT of targets) {
        const relTarget = normalizeMdTarget(rawT);
        if (!relTarget) continue;
        const resolved = relTarget.startsWith("/")
          ? path.resolve(repoRoot, relTarget.slice(1))
          : path.resolve(memDir, relTarget);
        const relToRepo = path.relative(repoRoot, resolved);
        if (!relToRepo || relToRepo.startsWith("..") || path.isAbsolute(relToRepo)) {
          fail(
            `Enlace relativo fuera de alcance en \x27memory/INDEX.md\x27 (línea ${i + 1}): \x27${rawT.trim()}\x27 escapa de la raíz del repositorio.`,
            "Los enlaces de Auto-Memoria deben apuntar exclusivamente a artefactos reales dentro del repositorio.",
            `Corrige el enlace \x27${rawT.trim()}\x27 en \x27memory/INDEX.md:${i + 1}\x27.`
          );
        }
        if (!fs.existsSync(resolved) || !fs.statSync(resolved).isFile()) {
          fail(
            `Enlace roto en \x27memory/INDEX.md\x27 (línea ${i + 1}): \x27${rawT.trim()}\x27 no apunta a un archivo existente en disco.`,
            "Gotcha #15: Todo enlace registrado en \x27memory/INDEX.md\x27 debe respaldarse con su archivo real en \x27memory/topics/\x27.",
            `Crea \x27${relToRepo.replace(/\\/g, "/")}\x27 con contenido real o elimina el enlace muerto en \x27memory/INDEX.md:${i + 1}\x27.`
          );
        }
        if (fs.statSync(resolved).size <= 0) {
          fail(
            `Archivo de memoria vacío (0 bytes) referenciado en \x27memory/INDEX.md\x27 (línea ${i + 1}): \x27${relToRepo.replace(/\\/g, "/")}\x27.`,
            "Los temas enlazados desde \x27memory/INDEX.md\x27 deben contener contexto sustantivo real y nunca quedar en 0 bytes.",
            `Escribe el detalle completo en \x27${relToRepo.replace(/\\/g, "/")}\x27 o retira el enlace en \x27memory/INDEX.md\x27.`
          );
        }
      }
    }

    const topicsRoot = path.join(memDir, "topics");
    if (fs.existsSync(topicsRoot) && fs.statSync(topicsRoot).isDirectory()) {
      const topicFiles = [];
      const walkTopics = (dir) => {
        const entries = fs.readdirSync(dir, { withFileTypes: true }).sort((a, b) => a.name.localeCompare(b.name));
        for (const ent of entries) {
          const full = path.join(dir, ent.name);
          if (ent.isDirectory()) walkTopics(full);
          else if (ent.isFile() && ent.name.toLowerCase().endsWith(".md")) topicFiles.push(full);
        }
      };
      walkTopics(topicsRoot);

      const indexNoComments = normContent.replace(/<!--[\s\S]*?-->/g, "");
      const escapeRe = (s) => s.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");

      for (const tf of topicFiles) {
        const relFromTopics = path.relative(topicsRoot, tf).replace(/\\/g, "/");
        const relFromRepo = `memory/topics/${relFromTopics}`;
        if (fs.statSync(tf).size <= 0) {
          fail(
            `Archivo de memoria vacío (0 bytes) detectado en \x27${relFromRepo}\x27.`,
            "Gotcha #15 prohíbe dejar archivos vacíos o truncados dentro de \x27memory/topics/\x27.",
            `Completa el contenido de \x27${relFromRepo}\x27 y enlázalo en \x27memory/INDEX.md\x27, o elimínalo.`
          );
        }
        const expectedRef = `topics/${relFromTopics}`;
        const exactRefRe = new RegExp(
          "(?:^|[\\s(\"\\x27`<\\[])(?:\\.\\/)?" + escapeRe(expectedRef) + "(?:$|[\\s)\"\\x27`>#?\\].,;:])",
          "m"
        );
        if (!exactRefRe.test(indexNoComments)) {
          fail(
            `Archivo de memoria huérfano detectado: \x27${relFromRepo}\x27 no está enlazado con su ruta exacta \x27${expectedRef}\x27 en \x27memory/INDEX.md\x27.`,
            "Gotcha #15 (Invariante de Guardado en Dos Pasos): Todo archivo en \x27memory/topics/**\x27 debe tener su enlace exacto \x27topics/<ruta>\x27 registrado en \x27memory/INDEX.md\x27.",
            `Añade un enlace de 1 línea hacia \x27${expectedRef}\x27 en \x27memory/INDEX.md\x27 o elimina el archivo huérfano \x27${relFromRepo}\x27.`
          );
        }
      }
    }
    console.log("OK");
  ')"
  mem_check="${mem_check%$'\r'}"
  if [ "$mem_check" != "OK" ]; then
    IFS="|" read -r _ m_err m_why m_fix <<< "$mem_check"
    red_pen_error "$m_err" "$m_why" "$m_fix"
  fi
fi

echo "--- [Vigilante Arquitectónico] 4. Verificando Cero Enlaces Muertos en Required Artifacts, Observabilidad Dual, Seguridad, Loop Engineering, Graph Engineering y Limpieza de Archivos Temporales ---"
for obs_file in "docs/RELIABILITY.md" "sprint-contract.md" "evaluator-rubric.md" "docs/QUALITY_SCORE.md" "docs/SECURITY.md" "goal.md" "maker-prompt.md" "checker-prompt.md" "loop-state.md" "graph.md" "docs/GOTCHAS.md"; do
  if [ -f "$obs_file" ]; then
    case "$obs_file" in
      "docs/RELIABILITY.md")
        if ! grep -Fq "correlationId" "$obs_file"; then
          red_pen_error \
            "Falta el campo obligatorio 'correlationId' en 'docs/RELIABILITY.md'." \
            "El estándar de Observabilidad de Runtime de ARCHITECTURE.md exige trazabilidad de principio a fin en los logs JSON estructurados." \
            "Documenta el esquema JSON con 'timestamp', 'level', 'component', 'action', 'durationMs', 'input', 'output'/'error' y 'correlationId' en 'docs/RELIABILITY.md'."
        fi
        ;;
      "evaluator-rubric.md")
        if ! grep -Fq "zero-inheritance" "$obs_file" || ! grep -Fqi "one-shot" "$obs_file"; then
          red_pen_error \
            "Falta la regla de aislamiento 'zero-inheritance' o la cláusula 'one-shot' en 'evaluator-rubric.md'." \
            "La regla de separación Maker-Checker de AGENTS.md prohíbe estrictamente autoaprobarse en la misma sesión o reutilizar un Evaluador previo vía send_message." \
            "Incluye las cláusulas de aislamiento 'zero-inheritance' y 'one-shot' junto a la tabla de 0 a 12 puntos en 'evaluator-rubric.md'."
        fi
        ;;
      "docs/QUALITY_SCORE.md")
        if ! grep -Fq "Estudios de Ablación" "$obs_file"; then
          red_pen_error \
            "Falta la sección 'Estudios de Ablación' en 'docs/QUALITY_SCORE.md'." \
            "La Observabilidad de Proceso a Largo Plazo exige llevar un registro empírico de simplificación del arnés junto al semáforo de salud A-D." \
            "Añade la tabla 'Registro de Simplificación del Arnés (Estudios de Ablación)' en 'docs/QUALITY_SCORE.md'."
        fi
        ;;
      "docs/SECURITY.md")
        for sec_term in "Write-Select-Compress-Isolate" "Fail-Closed" "Model-Visible Means Logged"; do
          if ! grep -Fq "$sec_term" "$obs_file"; then
            red_pen_error \
              "Falta el concepto obligatorio '$sec_term' dentro de 'docs/SECURITY.md'." \
              "La arquitectura de seguridad del arnés (AGENTS.md y ARCHITECTURE.md) exige documentar las 4 operaciones del presupuesto de contexto, el modelo Fail-Closed con clasificación por llamada y el principio Model-Visible Means Logged." \
              "Añade la sección correspondiente a '$sec_term' en 'docs/SECURITY.md'."
          fi
        done
        ;;
      "goal.md")
        for goal_term in "Circuit Breakers" "Candado 1" "Candado 2" "Candado 3" "Candado 4"; do
          if ! grep -Fq "$goal_term" "$obs_file"; then
            red_pen_error \
              "Falta el candado o sección obligatoria '$goal_term' dentro de 'goal.md'." \
              "La especificación de Loop Engineering de AGENTS.md prohíbe loops sin un Disyuntor de 4 Candados (Max Rounds, Budget/Time, Stagnation y Anti-Oscillation A<->B)." \
              "Añade '$goal_term' en la sección 'Circuit Breakers' de 'goal.md'."
          fi
        done
        ;;
      "maker-prompt.md")
        for maker_term in "Fair game" "Implementation Summary"; do
          if ! grep -Fq "$maker_term" "$obs_file"; then
            red_pen_error \
              "Falta el término obligatorio '$maker_term' dentro de 'maker-prompt.md'." \
              "El protocolo Maker-Checker (goal.md y sprint-contract.md) exige que el Agente Maker opere dentro de 'Fair game' y entregue un reporte estructurado al Checker." \
              "Añade '$maker_term' en 'maker-prompt.md'."
          fi
        done
        if ! grep -Fqi "one-shot" "$obs_file"; then
          red_pen_error \
            "Falta la cláusula 'one-shot' dentro de 'maker-prompt.md'." \
            "La invariante One-Shot Ephemeral Checker de AGENTS.md prohíbe reutilizar sub-agentes Evaluadores vía send_message y exige lanzar una instancia nueva por auditoría." \
            "Añade la exigencia 'one-shot' (prohibición de send_message a Checkers previos) en 'maker-prompt.md'."
        fi
        ;;
      "checker-prompt.md")
        if ! grep -Fq "zero-inheritance" "$obs_file" || ! grep -Fqi "one-shot" "$obs_file"; then
          red_pen_error \
            "Falta la cláusula 'zero-inheritance' o 'one-shot' dentro de 'checker-prompt.md'." \
            "La separación Maker-Checker (AGENTS.md y evaluator-rubric.md) exige que el Agente Checker audite en una instancia efímera de un solo uso (one-shot) sin compartir historial con el Maker ni ofrecer re-auditoría." \
            "Añade las exigencias 'zero-inheritance' y 'one-shot' en 'checker-prompt.md'."
        fi
        ;;
      "loop-state.md")
        if ! grep -Fq "Ratchet" "$obs_file"; then
          red_pen_error \
            "Falta el mecanismo 'Ratchet' (Trinquete) dentro de 'loop-state.md'." \
            "La especificación de Loop Engineering (goal.md) exige rastrear el avance del trinquete y el monitor de disyuntores entre rondas en 'loop-state.md'." \
            "Incluye el seguimiento de 'Net Passing Checks (Ratchet)' en 'loop-state.md'."
        fi
        ;;
      "graph.md")
        for graph_term in "research" "implement" "verify" "human_approval" "merge" "error_layer" "Coordinator" "Fork" "Swarm"; do
          if ! grep -Fq "$graph_term" "$obs_file"; then
            red_pen_error \
              "Falta el nodo, campo o patrón obligatorio '$graph_term' dentro de 'graph.md'." \
              "La especificación de Ingeniería de Grafos (AGENTS.md y ARCHITECTURE.md) exige definir el grafo de 5 nodos (research -> implement -> verify -> human_approval -> merge), el routing condicional por 'error_layer' y los 3 patrones Multi-Agente (Coordinator, Fork, Swarm)." \
              "Añade la especificación de '$graph_term' en 'graph.md'."
          fi
        done
        ;;
      "docs/GOTCHAS.md")
        for gotcha_term in "15 Gotchas" "structuredHas" "Estudios de Ablación"; do
          if ! grep -Fq "$gotcha_term" "$obs_file"; then
            red_pen_error \
              "Falta la sección o término obligatorio '$gotcha_term' dentro de 'docs/GOTCHAS.md'." \
              "El estándar de verificación del arnés (AGENTS.md) exige documentar la tabla de los 15 Gotchas críticos de producción, la regla 'structuredHas' de las 25 verificaciones y el protocolo de Estudios de Ablación." \
              "Añade '$gotcha_term' en 'docs/GOTCHAS.md'."
          fi
        done
        ;;
    esac
  fi
done

if [ -d ".agents/skills" ]; then
  skills_check="$(node -e '
    const fs = require("node:fs");
    const path = require("node:path");
    const clean = (s) => String(s || "").replace(/[|\r\n]+/g, " ").trim();
    const fail = (err, why, fix) => {
      console.log(`FAIL|${clean(err)}|${clean(why)}|${clean(fix)}`);
      process.exit(0);
    };

    const skillFiles = [];
    const walkSkills = (dir) => {
      for (const ent of fs.readdirSync(dir, { withFileTypes: true }).sort((a, b) => a.name.localeCompare(b.name))) {
        const full = path.join(dir, ent.name);
        if (ent.isDirectory()) walkSkills(full);
        else if (ent.isFile() && ent.name === "SKILL.md") skillFiles.push(full.replace(/\\/g, "/"));
      }
    };
    walkSkills(".agents/skills");

    function extractYamlDescription(fm) {
      const lines = fm.split(/\r?\n/);
      const idx = lines.findIndex((l) => /^description\s*:/.test(l));
      if (idx === -1) return null;
      const rawRest = lines[idx].replace(/^description\s*:\s*/, "");
      const trimmedRest = rawRest.trim();

      // 1. Escalares de bloque YAML: >, >-, >+, |, |-, |+
      if (/^[|>][+-]?\d*(?:\s+#.*)?$/.test(trimmedRest)) {
        const isFolded = trimmedRest.startsWith(">");
        const collected = [];
        for (let j = idx + 1; j < lines.length; j += 1) {
          const ln = lines[j];
          if (ln.trim() === "") {
            collected.push("");
            continue;
          }
          if (/^[\t ]+/.test(ln)) {
            collected.push(ln);
          } else {
            break;
          }
        }
        const nonEmpty = collected.filter((l) => l.trim() !== "");
        if (nonEmpty.length === 0) return "";
        const minIndent = Math.min(...nonEmpty.map((l) => (l.match(/^[\t ]*/) || [""])[0].length));
        const stripped = collected.map((l) => (l.length >= minIndent ? l.slice(minIndent) : l.trim()));
        if (isFolded) {
          return stripped.map((s) => s.trim()).filter(Boolean).join(" ").trim();
        }
        return stripped.join("\n").trim();
      }

      // 2. Comillas dobles o simples (una o varias líneas)
      if (trimmedRest.startsWith("\"") || trimmedRest.startsWith("\x27")) {
        const q = trimmedRest[0];
        let acc = trimmedRest.slice(1);
        let j = idx;
        while (true) {
          let out = "";
          let closed = false;
          for (let k = 0; k < acc.length; k += 1) {
            const ch = acc[k];
            if (q === "\"" && ch === "\\" && k + 1 < acc.length) {
              out += acc[k + 1];
              k += 1;
              continue;
            }
            if (q === "\x27" && ch === "\x27" && acc[k + 1] === "\x27") {
              out += "\x27";
              k += 1;
              continue;
            }
            if (ch === q) {
              closed = true;
              break;
            }
            out += ch;
          }
          if (closed) return out.replace(/\s+/g, " ").trim();
          j += 1;
          if (j >= lines.length) return null;
          acc += " " + lines[j].trim();
        }
      }

      // 3. Escalar plano YAML (una línea o continuación indentada en líneas subsiguientes)
      const parts = trimmedRest ? [trimmedRest] : [];
      for (let j = idx + 1; j < lines.length; j += 1) {
        const ln = lines[j];
        if (ln.trim() === "") continue;
        if (/^[\t ]+/.test(ln)) {
          parts.push(ln.trim());
        } else {
          break;
        }
      }
      return parts.join(" ").trim();
    }

    for (const sf of skillFiles) {
      const text = fs.readFileSync(sf, "utf8");
      const fmMatch = text.match(/^---\r?\n([\s\S]*?)\r?\n---(?:\r?\n|$)/);
      if (!fmMatch) {
        fail(
          `Frontmatter YAML ausente o mal formado en \x27${sf}\x27.`,
          "Toda Skill en \x27.agents/skills/**/SKILL.md\x27 requiere un frontmatter YAML delimitado por \x27---\x27 con \x27name\x27 y \x27description\x27.",
          `Añade un bloque frontmatter YAML válido al inicio de \x27${sf}\x27.`
        );
      }
      const fm = fmMatch[1];
      const nameLine = fm.split(/\r?\n/).find((l) => /^name\s*:/.test(l));
      const skillName = nameLine ? nameLine.replace(/^name\s*:\s*/, "").trim().replace(/^["\x27]|["\x27]$/g, "") : "";
      if (!skillName) {
        fail(
          `Falta el campo \x27name\x27 en el frontmatter YAML de \x27${sf}\x27.`,
          "El catálogo de Skills requiere un identificador \x27name\x27 no vacío en cada archivo SKILL.md.",
          `Define \x27name: <identificador>\x27 en el frontmatter de \x27${sf}\x27.`
        );
      }
      const desc = extractYamlDescription(fm);
      if (desc === null || desc.length === 0 || desc.length > 150) {
        const lenInfo = desc === null ? "ausente" : `${desc.length} caracteres`;
        fail(
          `La descripción en el frontmatter de \x27${sf}\x27 es inválida (${lenInfo}; permitido: 1..150 caracteres, incluyendo bloques YAML \x27>\x27 y \x27|\x27).`,
          "Gotcha #12: El catálogo de Skills trunca descripciones mayores a 150 caracteres, impidiendo la activación bajo progressive disclosure.",
          `Acorta el campo \x27description\x27 del frontmatter YAML en \x27${sf}\x27 a <= 150 caracteres con las palabras clave disparadoras al inicio.`
        );
      }
    }
    console.log("OK");
  ')"
  skills_check="${skills_check%$'\r'}"
  if [ "$skills_check" != "OK" ]; then
    IFS="|" read -r _ sk_err sk_why sk_fix <<< "$skills_check"
    red_pen_error "$sk_err" "$sk_why" "$sk_fix"
  fi
fi

if [ -f ".agents/skills/maker-checker/SKILL.md" ]; then
  if ! grep -Fqi "one-shot" ".agents/skills/maker-checker/SKILL.md"; then
    red_pen_error \
      "Falta la cláusula 'one-shot' dentro de '.agents/skills/maker-checker/SKILL.md'." \
      "El protocolo Maker-Checker exige instancias Checker efímeras de un solo uso (one-shot) y prohíbe reutilizar un Evaluador vía send_message." \
      "Documenta la regla 'one-shot' y la prohibición de send_message hacia Checkers previos en '.agents/skills/maker-checker/SKILL.md'."
  fi
fi

if [ ! -f ".agents/hooks.json" ] || [ ! -s "scripts/harness-hooks.mjs" ]; then
  red_pen_error \
    "Falta '.agents/hooks.json' o el runner ejecutable 'scripts/harness-hooks.mjs' (o está vacío)." \
    "El modelo Fail-Closed de docs/SECURITY.md exige hooks nativos reales respaldados por 'scripts/harness-hooks.mjs' para ejecutar en Windows, macOS y Linux desde cwd = .agents/." \
    "Crea o restaura '.agents/hooks.json' y 'scripts/harness-hooks.mjs' siguiendo el contrato stdin/stdout JSON de Antigravity."
fi

if ! node --check "scripts/harness-hooks.mjs" >/dev/null 2>&1; then
  red_pen_error \
    "Error de sintaxis JavaScript en 'scripts/harness-hooks.mjs'." \
    "Un fallo de sintaxis en el runner de hooks rompe PreInvocation, PreToolUse, PostToolUse y Stop en tiempo de ejecución." \
    "Ejecuta 'node --check scripts/harness-hooks.mjs' y corrige cualquier error de sintaxis ESM."
fi

hooks_lines="$(node -e '
  const fs = require("node:fs");
  const s = fs.readFileSync("scripts/harness-hooks.mjs", "utf8").replace(/\r\n/g, "\n").replace(/\r/g, "\n");
  console.log(s.length === 0 ? 0 : (s.endsWith("\n") ? s.slice(0, -1) : s).split("\n").length);
')"
hooks_lines="${hooks_lines%$'\r'}"
if [ "$hooks_lines" -gt 280 ]; then
  red_pen_error \
    "'scripts/harness-hooks.mjs' excede el tope máximo de concisión ($hooks_lines líneas; máximo permitido: 280 líneas)." \
    "El runner de hooks debe mantenerse ligero, legible y libre de sobre-ingeniería para arrancar en milisegundos en cada llamada." \
    "Simplifica 'scripts/harness-hooks.mjs' para mantenerlo en <= 280 líneas conservando sus garantías de seguridad."
fi

if ! node -e '
  const fs = require("node:fs");
  const parsed = JSON.parse(fs.readFileSync(".agents/hooks.json", "utf8"));
  if (!parsed || typeof parsed !== "object" || Array.isArray(parsed)) process.exit(1);

  const forbiddenRootKeys = new Set([
    "$schema", "project", "securityModel", "classificationPolicy",
    "auditPrinciple", "protectedPaths", "hooks", "UserPromptSubmit"
  ]);
  // Eventos nativos exclusivos de Antigravity (UserPromptSubmit y eventos de otras plataformas están prohibidos)
  const allowedGroupKeys = new Set([
    "enabled", "SessionStart", "PreToolUse", "PostToolUse",
    "PreInvocation", "PostInvocation", "Stop"
  ]);
  const allowedHandlerKeys = new Set(["type", "command", "timeout"]);

  const groupNames = Object.keys(parsed);
  if (groupNames.length === 0) process.exit(1);
  if (groupNames.some((k) => forbiddenRootKeys.has(k))) process.exit(1);

  const matchesTool = (matcher, tool) => {
    if (matcher === "*" || matcher === "") return true;
    try {
      return new RegExp(matcher).test(tool);
    } catch {
      return false;
    }
  };

  const isValidHandler = (h, expectedSubcmdPattern) => {
    if (!h || typeof h !== "object" || Array.isArray(h)) return false;
    if (!Object.keys(h).every((k) => allowedHandlerKeys.has(k))) return false;
    if (h.type !== undefined && h.type !== "command") return false;
    if (typeof h.command !== "string" || !h.command.includes("../scripts/harness-hooks.mjs")) return false;
    if (!new RegExp("\\b(?:" + expectedSubcmdPattern + ")\\b", "i").test(h.command)) return false;
    if (h.timeout !== undefined && (!Number.isInteger(h.timeout) || h.timeout <= 0)) return false;
    return true;
  };

  let preEntries = [];
  let postEntries = [];
  let preInvocationEntries = [];
  let sessionStartEntries = [];
  let postInvocationEntries = [];
  let stopEntries = [];

  for (const name of groupNames) {
    const group = parsed[name];
    if (!group || typeof group !== "object" || Array.isArray(group)) process.exit(1);
    if (!Object.keys(group).every((k) => allowedGroupKeys.has(k))) process.exit(1);
    if (group.enabled !== undefined && typeof group.enabled !== "boolean") process.exit(1);
    if (group.enabled === false) continue;

    if (group.PreToolUse !== undefined) {
      if (!Array.isArray(group.PreToolUse)) process.exit(1);
      preEntries.push(...group.PreToolUse);
    }
    if (group.PostToolUse !== undefined) {
      if (!Array.isArray(group.PostToolUse)) process.exit(1);
      postEntries.push(...group.PostToolUse);
    }
    if (group.PreInvocation !== undefined) {
      if (!Array.isArray(group.PreInvocation) || group.PreInvocation.length === 0) process.exit(1);
      preInvocationEntries.push(...group.PreInvocation);
    }
    if (group.SessionStart !== undefined) {
      if (!Array.isArray(group.SessionStart) || group.SessionStart.length === 0) process.exit(1);
      sessionStartEntries.push(...group.SessionStart);
    }
    if (group.PostInvocation !== undefined) {
      if (!Array.isArray(group.PostInvocation) || group.PostInvocation.length === 0) process.exit(1);
      postInvocationEntries.push(...group.PostInvocation);
    }
    if (group.Stop !== undefined) {
      if (!Array.isArray(group.Stop)) process.exit(1);
      stopEntries.push(...group.Stop);
    }
  }

  if (preEntries.length === 0 || postEntries.length === 0 || stopEntries.length === 0) {
    process.exit(1);
  }

  for (const entry of preEntries) {
    if (!entry || typeof entry !== "object" || Array.isArray(entry)) process.exit(1);
    if (!Object.keys(entry).every((k) => k === "matcher" || k === "hooks")) process.exit(1);
    if (typeof entry.matcher !== "string" || !Array.isArray(entry.hooks) || entry.hooks.length === 0) process.exit(1);
    if (!entry.hooks.every((h) => isValidHandler(h, "pre-tool-use|pretooluse"))) process.exit(1);
  }

  for (const reqTool of ["write_file", "edit_file", "run_command", "send_message"]) {
    if (!preEntries.some((e) => matchesTool(e.matcher, reqTool))) process.exit(1);
  }

  for (const entry of postEntries) {
    if (!entry || typeof entry !== "object" || Array.isArray(entry)) process.exit(1);
    if (!Object.keys(entry).every((k) => k === "matcher" || k === "hooks")) process.exit(1);
    if (typeof entry.matcher !== "string" || !Array.isArray(entry.hooks) || entry.hooks.length === 0) process.exit(1);
    if (!entry.hooks.every((h) => isValidHandler(h, "post-tool-use|posttooluse"))) process.exit(1);
  }

  for (const reqTool of ["write_file", "edit_file"]) {
    if (!postEntries.some((e) => matchesTool(e.matcher, reqTool))) process.exit(1);
  }

  // PreInvocation, SessionStart, PostInvocation y Stop en Antigravity son Planos (Flat): lista directa de handlers sin matcher
  if (!preInvocationEntries.every((h) => isValidHandler(h, "pre-invocation|preinvocation"))) {
    process.exit(1);
  }
  if (!sessionStartEntries.every((h) => isValidHandler(h, "session-start|sessionstart"))) {
    process.exit(1);
  }
  if (!postInvocationEntries.every((h) => isValidHandler(h, "post-invocation|postinvocation"))) {
    process.exit(1);
  }
  if (!stopEntries.every((h) => isValidHandler(h, "stop"))) {
    process.exit(1);
  }
' >/dev/null 2>&1; then
  red_pen_error \
    "El archivo '.agents/hooks.json' no cumple el contrato nativo real de Antigravity (PreToolUse/PostToolUse agrupados con matcher+hooks, PreInvocation/Stop planos e invocación a '../scripts/harness-hooks.mjs'; prohibido 'UserPromptSubmit')." \
    "Antigravity parsea '.agents/hooks.json' bajo codificación protojson estricta desde cwd = .agents/ (rechazando eventos de otras plataformas como 'UserPromptSubmit', campos raíz ajenos como '\$schema' o 'hooks' y exigiendo PreInvocation/Stop planos sin 'matcher')." \
    "Define un grupo raíz (ej. 'harness-safety-gate') con 'PreToolUse', 'PostToolUse', opcionalmente 'PreInvocation' (plano) y 'Stop' (plano) invocando 'node ../scripts/harness-hooks.mjs <evento>'."
fi

while IFS= read -r artifact_path; do
  artifact_path="${artifact_path%$'\r'}"
  [ -z "$artifact_path" ] && continue
  if [ ! -e "$artifact_path" ]; then
    red_pen_error \
      "Enlace muerto en AGENTS.md: el artefacto requerido '$artifact_path' no existe físicamente en disco." \
      "La regla Anti-Doc Bloat prohíbe enlazar documentos en AGENTS.md antes de que hayan sido creados con información real." \
      "Crea el archivo '$artifact_path' con contenido real o retira el enlace prematuro de la sección 'Required Artifacts' en 'AGENTS.md'."
  fi
  if [ -d "$artifact_path" ]; then
    if [ -z "$(ls -A "$artifact_path" 2>/dev/null)" ]; then
      red_pen_error \
        "Directorio requerido vacío en AGENTS.md: '$artifact_path' no contiene archivos." \
        "La regla Anti-Doc Bloat prohíbe declarar artefactos vacíos en 'Required Artifacts'." \
        "Añade contenido real dentro de '$artifact_path' o retira la entrada prematura de 'AGENTS.md'."
    fi
  elif [ ! -f "$artifact_path" ] || [ ! -s "$artifact_path" ]; then
    red_pen_error \
      "Artefacto requerido vacío (0 bytes) en AGENTS.md: '$artifact_path' tiene tamaño 0 bytes." \
      "Todo artefacto listado en '## Required Artifacts' de AGENTS.md debe existir y tener contenido real (> 0 bytes)." \
      "Escribe el contenido completo correspondiente en '$artifact_path' o retira el enlace vacío de 'AGENTS.md'."
  fi
done < <(awk '/^## Required Artifacts/{flag=1; next} /^## /{flag=0} flag && /^- `[^`]+`/{sub(/^- `/, ""); sub(/`.*$/, ""); print}' AGENTS.md)

if [ ! -f "scripts/feature-list.schema.json" ]; then
  red_pen_error \
    "Falta el archivo de esquema 'scripts/feature-list.schema.json'." \
    "El arnés exige un JSON Schema canónico con los 4 estados (not-started, in-progress, blocked, done), soporte para area/user_visible_behavior y Pass-State Gating." \
    "Crea o restaura 'scripts/feature-list.schema.json' siguiendo el estándar Draft-07 del arnés."
fi

fl_check="$(node -e '
  const fs = require("node:fs");
  const path = require("node:path");
  const clean = (s) => String(s || "").replace(/[|\r\n]+/g, " ").trim();
  const fail = (err, why, fix) => {
    console.log(`FAIL|${clean(err)}|${clean(why)}|${clean(fix)}`);
    process.exit(0);
  };

  let schema;
  try {
    schema = JSON.parse(fs.readFileSync("scripts/feature-list.schema.json", "utf8"));
  } catch (err) {
    fail(
      `JSON inválido en \x27scripts/feature-list.schema.json\x27 (${err.message}).`,
      "El esquema Draft-07 del rastreador de tareas debe ser JSON válido.",
      "Corrige la sintaxis JSON en \x27scripts/feature-list.schema.json\x27."
    );
  }

  if (schema?.additionalProperties !== false) {
    fail(
      "Falta \x27additionalProperties: false\x27 en la raíz de \x27scripts/feature-list.schema.json\x27.",
      "El esquema de feature_list.json debe bloquear propiedades raíz arbitrarias.",
      "Restaura \x27\"additionalProperties\": false\x27 en \x27scripts/feature-list.schema.json\x27."
    );
  }
  const itemsSchema = schema?.properties?.features?.items;
  if (itemsSchema?.additionalProperties !== false) {
    fail(
      "Falta \x27additionalProperties: false\x27 en \x27features.items\x27 dentro de \x27scripts/feature-list.schema.json\x27.",
      "Cada feature debe validarse contra un conjunto cerrado de campos canónicos.",
      "Restaura \x27\"additionalProperties\": false\x27 en \x27features.items\x27 de \x27scripts/feature-list.schema.json\x27."
    );
  }
  const itemProps = itemsSchema?.properties;
  const itemsRequired = itemsSchema?.required;
  const baseRequired = ["id", "name", "description", "status", "dependencies", "required_files", "verification"];
  if (!Array.isArray(itemsRequired) || !baseRequired.every((req) => itemsRequired.includes(req))) {
    fail(
      "Faltan campos obligatorios en \x27features.items.required\x27 de \x27scripts/feature-list.schema.json\x27.",
      "El contrato exige id, name, description, status, dependencies, required_files y verification.",
      "Restaura los 7 campos obligatorios en \x27scripts/feature-list.schema.json\x27."
    );
  }
  const statusEnum = itemProps?.status?.enum;
  const canonical = ["not-started", "in-progress", "blocked", "done"];
  if (!Array.isArray(statusEnum) || statusEnum.length !== 4 || !canonical.every((s) => statusEnum.includes(s))) {
    fail(
      "El enum de \x27status\x27 en \x27scripts/feature-list.schema.json\x27 no coincide con los 4 estados canónicos.",
      "Solo se permiten not-started, in-progress, blocked y done.",
      "Restaura \x27[\"not-started\", \"in-progress\", \"blocked\", \"done\"]\x27 en \x27scripts/feature-list.schema.json\x27."
    );
  }
  if (!itemProps?.area || !itemProps?.user_visible_behavior) {
    fail(
      "Faltan las propiedades \x27area\x27 o \x27user_visible_behavior\x27 en \x27scripts/feature-list.schema.json\x27.",
      "El esquema canónico debe soportar trazabilidad de dominio y comportamiento observable.",
      "Restaura \x27area\x27 y \x27user_visible_behavior\x27 en \x27scripts/feature-list.schema.json\x27."
    );
  }
  const doneEvProp = itemsSchema?.allOf?.[0]?.then?.properties?.evidence;
  const doneMinLen = doneEvProp?.minLength;
  const donePattern = doneEvProp?.pattern;
  if (typeof doneMinLen !== "number" || doneMinLen < 10 || typeof donePattern !== "string" || !donePattern.includes("\\S")) {
    fail(
      "El Pass-State Gating de \x27evidence\x27 para \x27status === \"done\"\x27 en \x27scripts/feature-list.schema.json\x27 debe exigir \x27minLength >= 10\x27 y \x27pattern: \"\\\\S\"\x27.",
      "Sin \x27pattern: \"\\\\S\"\x27, una cadena de 10 espacios en blanco evadiría la validación pura de JSON Schema.",
      "Asegura \x27\"minLength\": 10\x27 y \x27\"pattern\": \"\\\\S\"\x27 dentro de \x27allOf[0].then.properties.evidence\x27 en \x27scripts/feature-list.schema.json\x27."
    );
  }

  if (fs.existsSync("feature_list.json")) {
    const resolvedRoot = path.resolve(".");
    let data;
    try {
      data = JSON.parse(fs.readFileSync("feature_list.json", "utf8"));
    } catch (err) {
      fail(
        `JSON corrupto en \x27feature_list.json\x27 (${err.message}).`,
        "feature_list.json es la fuente única de verdad del estado de tareas y debe ser JSON válido.",
        "Corrige la sintaxis JSON en \x27feature_list.json\x27."
      );
    }
    const allowedRoot = new Set(Object.keys(schema.properties || {}));
    const allowedItem = new Set(Object.keys(itemProps));
    if (!data || typeof data !== "object" || Array.isArray(data) || !Array.isArray(data.features) || data.features.length === 0) {
      fail(
        "Estructura inválida en \x27feature_list.json\x27: la raíz debe ser un objeto con un arreglo no vacío \x27features\x27.",
        "El arnés requiere al menos una tarea estructurada en \x27feature_list.json\x27.",
        "Define un objeto raíz con \x27\"features\": [ ... ]\x27 en \x27feature_list.json\x27."
      );
    }
    for (const rk of Object.keys(data)) {
      if (!allowedRoot.has(rk)) {
        fail(
          `Propiedad raíz no permitida \x27${rk}\x27 en \x27feature_list.json\x27.`,
          "scripts/feature-list.schema.json impone additionalProperties: false en la raíz.",
          `Elimina \x27${rk}\x27 de \x27feature_list.json\x27.`
        );
      }
    }
    if (data.project !== undefined && (typeof data.project !== "string" || data.project.trim().length === 0)) {
      fail(
        "El campo opcional \x27project\x27 en \x27feature_list.json\x27 debe ser un string no vacío.",
        "El identificador de proyecto no puede quedar vacío cuando se declara.",
        "Asigna un nombre no vacío a \x27project\x27 o retira la propiedad de \x27feature_list.json\x27."
      );
    }

    const idRe = new RegExp(itemProps.id.pattern);
    const seenIds = new Set();
    const inProgressIds = [];

    for (let idx = 0; idx < data.features.length; idx += 1) {
      const f = data.features[idx];
      if (!f || typeof f !== "object" || Array.isArray(f)) {
        fail(
          `Entrada inválida en \x27feature_list.json\x27 (índice ${idx}): cada elemento de \x27features\x27 debe ser un objeto.`,
          "El esquema exige objetos de tarea estructurados.",
          `Corrige el elemento en \x27features[${idx}]\x27 dentro de \x27feature_list.json\x27.`
        );
      }
      const labelId = typeof f.id === "string" && f.id.trim() ? f.id.trim() : `features[${idx}]`;
      for (const fk of Object.keys(f)) {
        if (!allowedItem.has(fk)) {
          fail(
            `Propiedad desconocida \x27${fk}\x27 en la tarea \x27${labelId}\x27 de \x27feature_list.json\x27.`,
            "features.items impone additionalProperties: false.",
            `Elimina \x27${fk}\x27 de la tarea \x27${labelId}\x27 en \x27feature_list.json\x27.`
          );
        }
      }
      for (const req of baseRequired) {
        if (f[req] === undefined) {
          fail(
            `Falta el campo obligatorio \x27${req}\x27 en la tarea \x27${labelId}\x27 de \x27feature_list.json\x27.`,
            "Toda tarea debe declarar id, name, description, status, dependencies, required_files y verification.",
            `Añade \x27${req}\x27 a la tarea \x27${labelId}\x27 en \x27feature_list.json\x27.`
          );
        }
      }
      if (typeof f.id !== "string" || !idRe.test(f.id)) {
        fail(
          `ID de tarea inválido \x27${String(f.id)}\x27 en \x27feature_list.json\x27 (debe cumplir kebab-case en minúsculas, ej. feat-001).`,
          "Los IDs deterministas garantizan integridad referencial en el grafo DAG de dependencias.",
          `Renombra el ID \x27${String(f.id)}\x27 a formato kebab-case en minúsculas (ej. \x27feat-001\x27).`
        );
      }
      if (seenIds.has(f.id)) {
        fail(
          `ID de tarea duplicado \x27${f.id}\x27 detectado en \x27feature_list.json\x27.`,
          "Cada tarea en \x27feature_list.json\x27 debe poseer un identificador único para no corromper el DAG ni el seguimiento de estado.",
          `Asigna un ID único a cada tarea duplicada \x27${f.id}\x27 en \x27feature_list.json\x27.`
        );
      }
      seenIds.add(f.id);

      if (typeof f.name !== "string" || f.name.trim().length === 0) {
        fail(
          `La tarea \x27${f.id}\x27 tiene el campo \x27name\x27 vacío o inválido en \x27feature_list.json\x27.`,
          "Toda tarea requiere un nombre descriptivo no vacío.",
          `Completa \x27name\x27 en la tarea \x27${f.id}\x27.`
        );
      }
      if (typeof f.description !== "string" || f.description.trim().length === 0) {
        fail(
          `La tarea \x27${f.id}\x27 tiene el campo \x27description\x27 vacío o inválido en \x27feature_list.json\x27.`,
          "Toda tarea requiere una descripción clara del entregable esperado.",
          `Completa \x27description\x27 en la tarea \x27${f.id}\x27.`
        );
      }
      if (!statusEnum.includes(f.status)) {
        fail(
          `Estado inválido \x27${String(f.status)}\x27 en la tarea \x27${f.id}\x27 de \x27feature_list.json\x27.`,
          "Solo se admiten los 4 estados canónicos: not-started, in-progress, blocked y done.",
          `Actualiza \x27status\x27 de \x27${f.id}\x27 a uno de los 4 estados canónicos.`
        );
      }
      if (f.status === "in-progress") {
        inProgressIds.push(f.id);
      }
      if (!Array.isArray(f.dependencies) || !f.dependencies.every((d) => typeof d === "string" && d.trim().length > 0)) {
        fail(
          `Campo \x27dependencies\x27 inválido en la tarea \x27${f.id}\x27 de \x27feature_list.json\x27.`,
          "dependencies debe ser un arreglo de IDs de tareas (vacío si no tiene dependencias previas).",
          `Corrige \x27dependencies\x27 en la tarea \x27${f.id}\x27.`
        );
      }
      if (!Array.isArray(f.verification) || f.verification.length === 0 || !f.verification.every((v) => typeof v === "string" && v.trim().length > 0)) {
        fail(
          `Campo \x27verification\x27 vacío o inválido en la tarea \x27${f.id}\x27 de \x27feature_list.json\x27.`,
          "Toda tarea debe declarar al menos un comando ejecutable de verificación.",
          `Añade comandos reales de verificación en \x27verification\x27 para la tarea \x27${f.id}\x27.`
        );
      }
      if (!Array.isArray(f.required_files) || f.required_files.length === 0) {
        fail(
          `La tarea \x27${f.id}\x27 debe declarar al menos un entregable en \x27required_files\x27 dentro de \x27feature_list.json\x27.`,
          "Pass-State Gating verifica entregables físicos reales en disco antes de permitir \x27done\x27.",
          `Añade las rutas relativas requeridas en \x27required_files\x27 de la tarea \x27${f.id}\x27.`
        );
      }
      for (const relPath of f.required_files) {
        if (typeof relPath !== "string" || !relPath.trim() || relPath.includes("\0") || path.isAbsolute(relPath) || path.posix.isAbsolute(relPath) || path.win32.isAbsolute(relPath) || /^[a-zA-Z]:/.test(relPath)) {
          fail(
            `Ruta inválida o absoluta \x27${String(relPath)}\x27 en \x27required_files\x27 de la tarea \x27${f.id}\x27.`,
            "required_files solo acepta rutas relativas internas al repositorio.",
            `Reemplaza \x27${String(relPath)}\x27 en la tarea \x27${f.id}\x27 por una ruta relativa dentro del repositorio.`
          );
        }
        const full = path.resolve(resolvedRoot, relPath);
        const rel = path.relative(resolvedRoot, full);
        if (!rel || rel === "." || rel === ".." || rel.startsWith("../") || rel.startsWith("..\\") || path.isAbsolute(rel)) {
          fail(
            `Escape de directorio en \x27required_files\x27 de la tarea \x27${f.id}\x27: \x27${relPath}\x27 sale de la raíz del repositorio.`,
            "Pass-State Gating prohíbe referenciar archivos fuera del workspace.",
            `Corrige \x27${relPath}\x27 en la tarea \x27${f.id}\x27 para que apunte a un archivo interno del proyecto.`
          );
        }
        if (f.status === "done") {
          if (!fs.existsSync(full)) {
            fail(
              `Pass-State Gating fallido en tarea \x27${f.id}\x27 (status=\x27done\x27): el archivo requerido \x27${relPath}\x27 no existe en disco.`,
              "Prohibido marcar una tarea como \x27done\x27 si alguno de sus entregables físicos declarados en \x27required_files\x27 no existe.",
              `Crea el entregable real \x27${relPath}\x27 o regresa la tarea \x27${f.id}\x27 a \x27in-progress\x27.`
            );
          }
          const st = fs.statSync(full);
          if (!st.isFile() || st.size <= 0) {
            fail(
              `Pass-State Gating fallido en tarea \x27${f.id}\x27 (status=\x27done\x27): el archivo requerido \x27${relPath}\x27 no es un archivo regular o está vacío (0 bytes).`,
              "Todo entregable requerido de una tarea \x27done\x27 debe ser un archivo físico con tamaño > 0 bytes.",
              `Escribe el contenido real en \x27${relPath}\x27 o regresa la tarea \x27${f.id}\x27 a \x27in-progress\x27.`
            );
          }
        }
      }
      if (f.status === "done") {
        if (typeof f.evidence !== "string" || !/\S/.test(f.evidence) || f.evidence.trim().length < 10) {
          const curLen = typeof f.evidence === "string" ? f.evidence.trim().length : 0;
          fail(
            `Pass-State Gating fallido en tarea \x27${f.id}\x27 (status=\x27done\x27): \x27evidence\x27 es insuficiente (${curLen} caracteres útiles; mínimo requerido: 10 con contenido no vacío).`,
            "AGENTS.md exige registrar el comando ejecutado y la salida real verificada en \x27evidence\x27 antes de cerrar una tarea como \x27done\x27.",
            `Ejecuta la verificación real de \x27${f.id}\x27 y documenta comando + resultado (>= 10 caracteres no vacíos) en \x27evidence\x27.`
          );
        }
      }
    }

    if (inProgressIds.length > 1) {
      fail(
        `Violación de límite WIP <= 1 en \x27feature_list.json\x27: hay ${inProgressIds.length} tareas simultáneas en \x27in-progress\x27 (${inProgressIds.join(", ")}).`,
        "La regla One-Feature-at-a-Time de AGENTS.md permite como máximo 1 tarea activa (\x27in-progress\x27) en todo momento.",
        `Deja únicamente una tarea activa en \x27in-progress\x27 y regresa las demás (${inProgressIds.slice(1).join(", ")}) a \x27not-started\x27 o \x27blocked\x27.`
      );
    }

    for (const f of data.features) {
      for (const depId of f.dependencies) {
        if (depId === f.id || !seenIds.has(depId)) {
          fail(
            `Dependencia inválida \x27${depId}\x27 en la tarea \x27${f.id}\x27 dentro de \x27feature_list.json\x27.`,
            "Toda dependencia en \x27dependencies\x27 debe referenciar el \x27id\x27 existente de otra tarea distinta en \x27feature_list.json\x27.",
            `Corrige \x27dependencies\x27 en la tarea \x27${f.id}\x27.`
          );
        }
      }
    }
  }
  console.log("OK");
')"
fl_check="${fl_check%$'\r'}"
if [ "$fl_check" != "OK" ]; then
  IFS="|" read -r _ fl_err fl_why fl_fix <<< "$fl_check"
  red_pen_error "$fl_err" "$fl_why" "$fl_fix"
fi

echo "--- [Vigilante Arquitectónico] 5. Escáner de Higiene y Estado Limpio (cleanup-scanner: .gitignore, .gitattributes, 0 CRLF / 0 BOM, JSON, secretos, artefactos y árbol fuente) ---"
if [ ! -f ".gitattributes" ] || ! grep -Fq "eol=lf" ".gitattributes"; then
  red_pen_error \
    "Violación de portabilidad multiplataforma: falta '.gitattributes' o no impone 'eol=lf' en la raíz." \
    "En Windows con core.autocrlf=true, un 'git clone' o 'git worktree' sin '.gitattributes' convierte los scripts POSIX (.sh) y artefactos a CRLF rompiendo el invariante 0 CRLF de sprint-contract.md." \
    "Crea o restaura '.gitattributes' con '* text=auto eol=lf' y reglas explícitas 'eol=lf' para *.sh, *.mjs, *.json y *.md."
fi

encoding_issue="$(node -e '
  const fs = require("node:fs");
  const path = require("node:path");
  const skipDirs = new Set([
    ".git", "node_modules", ".venv", "venv", "env", "dist", "build",
    "coverage", ".next", ".astro", ".svelte-kit", "__pycache__",
    ".pytest_cache", ".mypy_cache", ".ruff_cache"
  ]);
  const textExts = new Set([
    ".sh", ".mjs", ".cjs", ".js", ".ts", ".tsx", ".jsx", ".astro",
    ".vue", ".svelte", ".mdx", ".py", ".ps1", ".json", ".md",
    ".yaml", ".yml", ".toml"
  ]);
  const exactTextNames = new Set([
    ".gitattributes", ".gitignore", ".editorconfig",
    ".env.example", ".env.sample", ".env.template"
  ]);

  function walk(dir) {
    let entries = [];
    try {
      entries = fs.readdirSync(dir, { withFileTypes: true }).sort((a, b) => a.name.localeCompare(b.name));
    } catch {
      return null;
    }
    for (const e of entries) {
      if (skipDirs.has(e.name)) continue;
      const full = path.join(dir, e.name);
      const rel = path.relative(".", full).replace(/\\/g, "/");
      if (rel === ".agents/.runtime" || rel.startsWith(".agents/.runtime/")) continue;
      if (e.isDirectory()) {
        const hit = walk(full);
        if (hit) return hit;
      } else if (e.isFile()) {
        const ext = path.extname(e.name).toLowerCase();
        if (!textExts.has(ext) && !exactTextNames.has(e.name)) continue;
        const buf = fs.readFileSync(full);
        if (buf.length >= 3 && buf[0] === 0xef && buf[1] === 0xbb && buf[2] === 0xbf) {
          return `BOM|${rel}`;
        }
        if (buf.includes(0x0d)) {
          return `CRLF|${rel}`;
        }
      }
    }
    return null;
  }

  const bad = walk(".");
  if (bad) console.log(bad);
')"
encoding_issue="${encoding_issue%$'\r'}"
if [ -n "$encoding_issue" ]; then
  IFS="|" read -r enc_kind enc_path <<< "$encoding_issue"
  if [ "$enc_kind" = "BOM" ]; then
    red_pen_error \
      "Marca de orden de bytes UTF-8 BOM (0xEF 0xBB 0xBF) detectada al inicio de '$enc_path'." \
      "Un UTF-8 BOM rompe shebangs POSIX ('#!/usr/bin/env bash'), herramientas CLI estrictas y el invariante binario multiplataforma del arnés." \
      "Guarda '$enc_path' como UTF-8 puro sin BOM (elimina los 3 bytes iniciales 0xEF 0xBB 0xBF) conservando saltos de línea LF."
  else
    red_pen_error \
      "Retorno de carro CR/CRLF (byte 0x0D) detectado en el archivo de texto '$enc_path'." \
      "Todos los scripts, código fuente, documentos y configuraciones del repositorio deben mantenerse en LF puro (0 CRLF) en Windows, macOS, Linux y CI." \
      "Normaliza '$enc_path' a LF puro eliminando todos los bytes '\\r' (0x0D)."
  fi
fi

invalid_json_file="$(node -e '
  const fs = require("node:fs");
  const path = require("node:path");
  const skipDirs = new Set([
    ".git", "node_modules", "dist", "build", ".next", ".astro", ".svelte-kit",
    "coverage", ".venv", "venv", "env", "__pycache__", ".pytest_cache", ".mypy_cache", ".ruff_cache"
  ]);
  const jsoncRe = /(?:^|\/)(?:[jt]sconfig(?:\.[^/]+)?\.json|\.vscode\/.*\.json)$/i;
  function walk(dir) {
    if (!fs.existsSync(dir)) return null;
    for (const e of fs.readdirSync(dir, { withFileTypes: true }).sort((a, b) => a.name.localeCompare(b.name))) {
      if (skipDirs.has(e.name)) continue;
      const full = path.join(dir, e.name);
      const rel = path.relative(".", full).replace(/\\/g, "/");
      if (rel === ".agents/.runtime" || rel.startsWith(".agents/.runtime/")) continue;
      if (e.isDirectory()) {
        const hit = walk(full);
        if (hit) return hit;
      } else if (e.isFile() && e.name.toLowerCase().endsWith(".json") && !jsoncRe.test(rel)) {
        try { JSON.parse(fs.readFileSync(full, "utf8")); } catch (err) { return `${rel}|${String(err.message || err).replace(/[|\r\n]+/g, " ")}`; }
      }
    }
    return null;
  }
  const bad = walk(".");
  if (bad) console.log(bad);
')"
invalid_json_file="${invalid_json_file%$'\r'}"
if [ -n "$invalid_json_file" ]; then
  IFS="|" read -r bad_json_path bad_json_err <<< "$invalid_json_file"
  red_pen_error \
    "Archivo JSON corrupto en el repositorio: '$bad_json_path' ($bad_json_err)." \
    "En Antigravity, stderr de PostToolUse no detiene el turno; Puerta 1 actúa como red de seguridad dura para impedir JSON inválido en manifiestos o configuraciones." \
    "Corrige el error de sintaxis JSON en '$bad_json_path' antes de continuar."
fi

non_py_secret="$(node -e '
  const fs = require("node:fs");
  const path = require("node:path");
  const skipDirs = new Set([
    ".git", "node_modules", ".venv", "venv", "env", "dist", "build",
    "coverage", ".next", ".astro", ".svelte-kit", "scripts", "tests",
    "test", "docs", ".agents", "memory", "__pycache__",
    ".pytest_cache", ".mypy_cache", ".ruff_cache"
  ]);
  const targetExtRe = /\.(?:[cm]?js|tsx?|jsx|astro|vue|svelte|ps1)$/i;
  const testFileRe = /\.(?:test|spec|tests)\.[^.]+$/i;
  const secretRules = [
    { kind: "OpenAI API Key (sk-proj-...)", re: /\bsk-proj-[A-Za-z0-9_-]{12,}/ },
    { kind: "Stripe Live Secret Key (sk_live_...)", re: /\bsk_live_[A-Za-z0-9]{12,}/ },
    { kind: "GitHub Token (ghp_/gho_/ghu_/ghs_/ghr_...)", re: /\bgh[pousr]_[A-Za-z0-9_]{20,}/ },
    { kind: "GitHub Fine-Grained PAT (github_pat_...)", re: /\bgithub_pat_[A-Za-z0-9_]{20,}/ },
    { kind: "AWS Access Key ID (AKIA...)", re: /\bAKIA[0-9A-Z]{16}\b/ },
    { kind: "Google API Key (AIza...)", re: /\bAIza[0-9A-Za-z_-]{30,}/ },
    { kind: "Clave Privada PEM (BEGIN PRIVATE KEY)", re: /-----BEGIN [A-Z ]*PRIVATE KEY-----/ }
  ];

  function walk(dir) {
    let entries = [];
    try {
      entries = fs.readdirSync(dir, { withFileTypes: true }).sort((a, b) => a.name.localeCompare(b.name));
    } catch {
      return null;
    }
    for (const e of entries) {
      if (skipDirs.has(e.name) || skipDirs.has(e.name.toLowerCase())) continue;
      const full = path.join(dir, e.name);
      if (e.isDirectory()) {
        const hit = walk(full);
        if (hit) return hit;
      } else if (e.isFile() && targetExtRe.test(e.name) && !testFileRe.test(e.name)) {
        const rel = path.relative(".", full).replace(/\\/g, "/");
        const lines = fs.readFileSync(full, "utf8").split(/\r?\n/);
        for (let idx = 0; idx < lines.length; idx += 1) {
          const ln = lines[idx];
          for (const rule of secretRules) {
            if (rule.re.test(ln)) {
              return `${rel}|${idx + 1}|${rule.kind}`;
            }
          }
        }
      }
    }
    return null;
  }

  const found = walk(".");
  if (found) console.log(found);
')"
non_py_secret="${non_py_secret%$'\r'}"
if [ -n "$non_py_secret" ]; then
  IFS="|" read -r sec_file sec_line sec_kind <<< "$non_py_secret"
  red_pen_error \
    "Secreto literal de alta certeza detectado en '$sec_file' (línea $sec_line): $sec_kind." \
    "docs/SECURITY.md prohíbe quemar llaves API, tokens de acceso o claves privadas PEM en archivos JS/TS/Frontend/PowerShell del repositorio." \
    "Elimina la credencial literal de '$sec_file:$sec_line', cárgala desde variables de entorno en la capa Config y rota el secreto si fue expuesto."
fi

if [ ! -f ".gitignore" ]; then
  red_pen_error \
    "Violación estructural: no se encontró '.gitignore' en la raíz del proyecto." \
    "La Dimensión 4 de clean-state-checklist.md y docs/SECURITY.md exigen proteger secretos (.env*), overrides locales (*.local.md), dependencias (node_modules/), builds (dist/, build/) y temporales (*.tmp, *.bak, *.swp)." \
    "Crea un archivo '.gitignore' en la raíz que ignore .env*, *.local.md, node_modules/, dist/, build/, *.tmp, *.bak y *.swp."
fi

for gitignore_req in '\.env' '\*\.local\.md' 'node_modules' 'dist' 'build' '\*\.tmp' '\*\.bak' '\*\.swp'; do
  if ! grep -Eq "^[[:space:]]*${gitignore_req}" ".gitignore"; then
    red_pen_error \
      "Cobertura incompleta en '.gitignore': falta una regla que proteja el patrón '${gitignore_req}'." \
      "Un '.gitignore' incompleto expone secretos, configuraciones locales (Gotcha #2), artefactos de build o archivos de intercambio del editor." \
      "Añade la entrada correspondiente a '${gitignore_req}' dentro de '.gitignore'."
  fi
done

while IFS= read -r env_file; do
  [ -z "$env_file" ] && continue
  env_base="$(basename "$env_file")"
  case "$env_base" in
    .env.example|.env.sample|.env.template) continue ;;
  esac
  if [ -d ".git" ] && command -v git >/dev/null 2>&1; then
    if git ls-files --error-unmatch "$env_file" >/dev/null 2>&1 || ! git check-ignore -q "$env_file"; then
      red_pen_error \
        "Archivo de entorno sensible '$env_file' detectado en el árbol sin cobertura efectiva de '.gitignore' (o rastreado en Git)." \
        "docs/SECURITY.md y el escáner de estado limpio prohíben versionar o dejar desprotegidos archivos '.env*' que pueden contener secretos." \
        "Asegúrate de que '$env_file' esté cubierto por '.gitignore' y retíralo del índice de Git con 'git rm --cached $env_file' (usa '.env.example' para plantillas sin secretos)."
    fi
  elif grep -Eq "^[[:space:]]*!${env_base//./\\.}[[:space:]]*$" ".gitignore"; then
    red_pen_error \
      "Archivo de entorno sensible '$env_file' está explícitamente des-ignorado ('!$env_base') en '.gitignore'." \
      "docs/SECURITY.md prohíbe exponer archivos '.env*' reales fuera de las plantillas seguras (.env.example, .env.sample, .env.template)." \
      "Elimina la excepción '!$env_base' de '.gitignore' o renombra la plantilla sin secretos a '.env.example'."
  fi
done < <(find . \( -name ".git" -o -name "node_modules" -o -name ".venv" -o -name "venv" -o -name "env" -o -name "dist" -o -name "build" \) -prune -o -type f -name ".env*" -print 2>/dev/null || true)

temp_files="$(find . \( -name ".git" -o -name "node_modules" -o -name ".venv" -o -name "venv" -o -name "env" -o -name "dist" -o -name "build" \) -prune -o -type f \( -name "*.tmp" -o -name "*.bak" -o -name "*.orig" -o -name "*.swp" -o -name "*~" -o -name "WIP.md" -o -name "IN_PROGRESS.md" \) -print 2>/dev/null || true)"
if [ -n "$temp_files" ]; then
  red_pen_error \
    "Se detectaron archivos temporales, de respaldo, swap o borradores WIP en el repositorio: $temp_files" \
    "La Dimensión 4 de clean-state-checklist.md prohíbe dejar artefactos temporales (*.tmp, *.bak, *.orig, *.swp, *~, WIP.md, IN_PROGRESS.md) a cualquier profundidad que contaminen la siguiente sesión." \
    "Elimina individualmente los archivos temporales listados ('rm <archivo>') antes de ejecutar la verificación."
fi

for nb_tree in "src" "app" "backend" "deliverables" "notebooks"; do
  if [ -d "$nb_tree" ]; then
    nb_ckpts="$(find "$nb_tree" \( -name "node_modules" -o -name ".venv" -o -name "venv" -o -name "env" \) -prune -o -type d -name ".ipynb_checkpoints" -print 2>/dev/null || true)"
    if [ -n "$nb_ckpts" ]; then
      red_pen_error \
        "Se detectaron directorios '.ipynb_checkpoints' huérfanos en '$nb_tree/': $nb_ckpts" \
        "Los checkpoints automáticos de Jupyter fuera de entornos ignorados contaminan el árbol fuente o los entregables con borradores no auditados." \
        "Elimina los directorios '.ipynb_checkpoints' de '$nb_tree/' y asegúrate de ignorar '.ipynb_checkpoints/' en '.gitignore'."
    fi
  fi
done

for src_tree in "src" "lib" "app" "backend"; do
  if [ -d "$src_tree" ]; then
    src_logs="$(find "$src_tree" \( -name "node_modules" -o -name ".venv" -o -name "venv" -o -name "env" \) -prune -o -type f -name "*.log" -print 2>/dev/null || true)"
    if [ -n "$src_logs" ]; then
      red_pen_error \
        "Se detectaron archivos de log de depuración dentro del árbol de código fuente ('$src_tree/'): $src_logs" \
        "El escáner de limpieza prohíbe mezclar trazas '*.log' con módulos de código fuente en 'src/', 'lib/', 'app/' o 'backend/'." \
        "Elimina los archivos '*.log' de '$src_tree/' y dirige los logs de runtime a stdout o a un directorio externo ignorado."
    fi
  fi
done

session_artifacts="$(find . -maxdepth 1 -type f \( -name "WIP.md" -o -name "IN_PROGRESS.md" -o -name "scratch.*" -o -name "debug.*" -o -name "temp.*" -o -name "test-manual.*" \) 2>/dev/null || true)"
if [ -n "$session_artifacts" ]; then
  red_pen_error \
    "Se detectaron artefactos de sesión incompleta o depuración manual en la raíz: $session_artifacts" \
    "clean-state-checklist.md exige canalizar el estado únicamente en 'progress.md', 'feature_list.json' y 'session-handoff.md', sin dejar archivos 'WIP.md', 'IN_PROGRESS.md', 'scratch.*', 'debug.*' o 'temp.*'." \
    "Transfiere cualquier nota relevante a 'progress.md' o 'session-handoff.md' y elimina los artefactos temporales de la raíz."
fi

for build_in_src in "src/dist" "src/build" "lib/dist" "lib/build" "app/dist" "app/build" "backend/dist" "backend/build"; do
  if [ -d "$build_in_src" ]; then
    red_pen_error \
      "Violación estructural crítica: directorio de salida compilada '$build_in_src/' mezclado dentro del árbol fuente." \
      "Mezclar artefactos compilados ('dist/' o 'build/') dentro de 'src/', 'lib/', 'app/' o 'backend/' contamina las búsquedas del agente y rompe los límites de capas." \
      "Elimina '$build_in_src/' y configura la herramienta de compilación para emitir salidas en 'dist/' o 'build/' en la raíz del proyecto."
  fi
done

nested_nm="$(find . -mindepth 2 -maxdepth 4 -type d -name "node_modules" -not -path "./node_modules/*" -not -path "./.git/*" -not -path "./.venv/*" -not -path "./venv/*" -not -path "./env/*" 2>/dev/null || true)"
if [ -n "$nested_nm" ]; then
  red_pen_error \
    "Violación estructural crítica: directorio 'node_modules' anidado detectado fuera de la raíz: $nested_nm" \
    "Tener 'node_modules' dentro de 'src/', 'lib/', 'app/' o 'tests/' genera resoluciones de dependencias fantasma y ensucia el árbol fuente." \
    "Elimina los directorios 'node_modules' anidados y gestiona las dependencias desde la raíz del proyecto."
fi

if [ "$ALLOW_EMPTY_DIRS" != "true" ]; then
  for common_dir in "src" "lib" "app" "backend" "deliverables" "test" "tests" "docs"; do
    if [ -d "$common_dir" ] && [ -z "$(ls -A "$common_dir" 2>/dev/null)" ]; then
      red_pen_error \
        "Directorio vacío residual detectado: '$common_dir/'." \
        "El escáner de higiene de sesión marca directorios vacíos como trabajo incompleto o estructura fantasma que desorienta a la siguiente sesión." \
        "Elimina el directorio vacío '$common_dir/' o incorpora los archivos reales correspondientes al alcance activo (o habilita 'brownfield.allowEmptyDirs: true' en 'harness.config.json' en repositorios legados)."
    fi
  done

  for deep_dir in "src" "app" "backend" "lib" "packages"; do
    if [ -d "$deep_dir" ]; then
      empty_nested="$(find "$deep_dir" \( -name ".git" -o -name "node_modules" -o -name ".venv" -o -name "venv" -o -name "env" -o -name "dist" -o -name "build" -o -name "__pycache__" \) -prune -o -type d -empty -print 2>/dev/null | head -n 1 || true)"
      if [ -n "$empty_nested" ]; then
        red_pen_error \
          "Directorio vacío residual detectado recursivamente en árbol fuente: '$empty_nested/'." \
          "Con 'allowEmptyDirs: false', no se permiten subcarpetas vacías huérfanas dentro de '$deep_dir/' que desorienten la navegación por capas." \
          "Elimina el directorio vacío '$empty_nested/' o añade los módulos reales correspondientes (o activa 'brownfield.allowEmptyDirs: true' en 'harness.config.json' si es legado requerido)."
      fi
    fi
  done
fi

echo "OK: Límites arquitectónicos, invariantes de 6 capas, Auto-Memoria, Seguridad e higiene estructural verificados sin violaciones."
