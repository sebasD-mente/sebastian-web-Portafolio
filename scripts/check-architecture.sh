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
  if ! cfg_meta="$(node -e '
    const fs = require("node:fs");
    const raw = JSON.parse(fs.readFileSync("harness.config.json", "utf8"));
    if (!raw || typeof raw !== "object" || Array.isArray(raw)) process.exit(2);
    const mode = typeof raw.mode === "string" && raw.mode.trim() ? raw.mode.trim() : "auto";
    const validModes = new Set(["auto", "greenfield", "brownfield", "non-dev"]);
    if (!validModes.has(mode)) process.exit(3);
    if (raw.layerMap !== undefined && (!raw.layerMap || typeof raw.layerMap !== "object" || Array.isArray(raw.layerMap))) process.exit(4);
    const bf = raw.brownfield;
    if (bf !== undefined && (!bf || typeof bf !== "object" || Array.isArray(bf))) process.exit(5);
    if (bf?.maxLegacyLayerViolations !== undefined && (!Number.isInteger(bf.maxLegacyLayerViolations) || bf.maxLegacyLayerViolations < 0)) process.exit(6);
    if (bf?.allowEmptyDirs !== undefined && typeof bf.allowEmptyDirs !== "boolean") process.exit(7);
    const py = raw.python;
    if (py !== undefined && (!py || typeof py !== "object" || Array.isArray(py))) process.exit(8);
    if (py?.packageRoots !== undefined && (!Array.isArray(py.packageRoots) || !py.packageRoots.every((r) => typeof r === "string" && r.trim().length > 0))) process.exit(9);
    const allowEmpty = Boolean(bf?.allowEmptyDirs === true || raw.allowEmptyDirs === true);
    console.log(`${mode}|${allowEmpty ? "true" : "false"}`);
  ' 2>/dev/null)"; then
    red_pen_error \
      "Configuración inválida en 'harness.config.json' (JSON corrupto o tipos fuera de contrato en mode/layerMap/brownfield/python)." \
      "El vigilante arquitectónico camaleón requiere leer 'harness.config.json' de forma determinista y Fail-Closed." \
      "Verifica que 'harness.config.json' sea JSON válido con 'mode' en 'auto' | 'greenfield' | 'brownfield' | 'non-dev' y tipos correctos."
  fi
  cfg_meta="${cfg_meta%$'\r'}"
  IFS="|" read -r HARNESS_MODE ALLOW_EMPTY_DIRS <<< "$cfg_meta"
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

# Verificación mecánica políglota en Node.js (Web ESM/CJS/Astro/Vue/Svelte/MDX + Python multi-root + layerMap + Brownfield Ratchet)
if [ "$HARNESS_MODE" != "non-dev" ]; then
  src_layer_result="$(node -e '
    const fs = require("node:fs");
    const path = require("node:path");

    let cfg = {};
    if (fs.existsSync("harness.config.json")) {
      cfg = JSON.parse(fs.readFileSync("harness.config.json", "utf8")) || {};
    }

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
    if (cfg.layerMap && typeof cfg.layerMap === "object" && !Array.isArray(cfg.layerMap)) {
      for (const [rawKey, rawVal] of Object.entries(cfg.layerMap)) {
        const cleanKey = String(rawKey || "").trim().replace(/\\/g, "/").replace(/^\/+|\/+$/g, "");
        if (!cleanKey) continue;
        const lowerKey = cleanKey.toLowerCase();
        if (Array.isArray(rawVal) && VALID_LAYERS.has(lowerKey)) {
          const items = rawVal
            .map((item) => String(item || "").trim().replace(/\\/g, "/").replace(/^\/+|\/+$/g, ""))
            .filter(Boolean);
          const claimedLower = new Set(items.map((x) => x.toLowerCase()));
          for (const other of VALID_LAYERS) {
            if (other !== lowerKey) {
              BASE_LAYER_LISTS[other] = BASE_LAYER_LISTS[other].filter((a) => !claimedLower.has(a.toLowerCase()));
            }
          }
          BASE_LAYER_LISTS[lowerKey] = items;
          for (const it of items) customTopDirs.push(it.split("/")[0]);
          continue;
        }
        const layer = String(rawVal || "").trim().toLowerCase();
        if (!VALID_LAYERS.has(layer)) continue;
        for (const other of VALID_LAYERS) {
          BASE_LAYER_LISTS[other] = BASE_LAYER_LISTS[other].filter((a) => a.toLowerCase() !== lowerKey);
        }
        directOverrides.push([cleanKey, layer]);
        customTopDirs.push(cleanKey.split("/")[0]);
      }
    }

    const DIR_TO_LAYER = {};
    const PATH_PREFIX_TO_LAYER = [];
    for (const canon of VALID_LAYERS) {
      DIR_TO_LAYER[canon] = canon;
      for (const item of BASE_LAYER_LISTS[canon]) {
        if (item.includes("/")) PATH_PREFIX_TO_LAYER.push([item, canon]);
        else { DIR_TO_LAYER[item] = canon; DIR_TO_LAYER[item.toLowerCase()] = canon; }
      }
    }
    for (const [cleanKey, layer] of directOverrides) {
      if (cleanKey.includes("/")) PATH_PREFIX_TO_LAYER.push([cleanKey, layer]);
      else { DIR_TO_LAYER[cleanKey] = layer; DIR_TO_LAYER[cleanKey.toLowerCase()] = layer; }
    }
    PATH_PREFIX_TO_LAYER.sort((a, b) => b[0].length - a[0].length);

    const maxLegacyLayerViolations = Number.isInteger(cfg?.brownfield?.maxLegacyLayerViolations) && cfg.brownfield.maxLegacyLayerViolations >= 0
      ? cfg.brownfield.maxLegacyLayerViolations
      : (Number.isInteger(cfg?.maxLegacyLayerViolations) && cfg.maxLegacyLayerViolations >= 0 ? cfg.maxLegacyLayerViolations : 0);

    const pyRootsCfg = Array.isArray(cfg?.python?.packageRoots)
      ? cfg.python.packageRoots
      : ["src", "app", "backend"];
    const sanitizedPyRoots = pyRootsCfg
      .map((r) => String(r || "").trim().replace(/\\/g, "/").replace(/^\.\/+/, "").replace(/^\/+|\/+$/g, ""))
      .filter((r) => r && r !== "." && !r.startsWith("..") && !r.includes("/"));

    const packageRootsList = Array.from(new Set(["src", "app", "backend", ...sanitizedPyRoots]));
    const RESERVED_HARNESS_DIRS = new Set([
      "scripts", "docs", "memory", ".agents", "node_modules", ".git",
      ".venv", "venv", "env", "dist", "build", "tests", "test", "deliverables"
    ]);
    const extraMappedRoots = customTopDirs.filter((d) => d && !d.startsWith(".") && !RESERVED_HARNESS_DIRS.has(d.toLowerCase()));
    const candidateRoots = Array.from(new Set([...packageRootsList, ...extraMappedRoots]));
    const KNOWN_ROOTS = new Set(packageRootsList);
    const ALL_SEGMENTS = new Set(Object.keys(DIR_TO_LAYER));
    const escapeRe = (s) => s.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
    const segAlt = Array.from(ALL_SEGMENTS).map(escapeRe).join("|");
    const rootAlt = Array.from(KNOWN_ROOTS).map(escapeRe).join("|");
    const LAYER_SEG_RE = segAlt ? new RegExp("(^|/)(" + segAlt + ")(/|$)") : /(?!)/;
    const ALIAS_RE = segAlt ? new RegExp("^[@#](" + segAlt + ")(\\/.*|$)") : /(?!)/;
    const INTERNAL_PREFIX_RE = new RegExp("^(?:\\.\\/|\\.\\.\\/|@\\/|~\\/|#\\/|" + (rootAlt ? "(?:" + rootAlt + ")\\/|" : "") + "\\.\\.?$)");
    const STRIP_ROOT_RE = rootAlt ? new RegExp("^(" + rootAlt + ")\\/(.+)$") : null;

    const CODE_EXT_RE = /\.(?:[cm]?js|tsx?|jsx|astro|vue|svelte|mdx|py)$/i;
    const SFC_HTML_EXT = new Set([".astro", ".vue", ".svelte", ".mdx"]);
    const SKIP_DIRS = new Set([
      "node_modules", ".git", "dist", "build", ".next", ".astro", ".svelte-kit",
      ".venv", "venv", "env", "__pycache__", ".pytest_cache", ".mypy_cache", ".ruff_cache"
    ]);

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

    function isInternalPyRootSeg(firstSeg) {
      return KNOWN_ROOTS.has(firstSeg) || ALL_SEGMENTS.has(firstSeg);
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
            if (rest) specs.push({ raw: mod, spec: prefix + rest, isPyInternal: true });
            else for (const n of names) specs.push({ raw: `${mod} import ${n}`, spec: prefix + n.replace(/\./g, "/"), isPyInternal: true });
          } else {
            const parts = mod.split(".");
            const firstSeg = parts[0];
            if (!isInternalPyRootSeg(firstSeg)) continue;
            if (parts.length === 1 && KNOWN_ROOTS.has(firstSeg)) {
              for (const n of names) specs.push({ raw: `${mod}.${n}`, spec: `${firstSeg}/${n.replace(/\./g, "/")}`, isPyInternal: true });
            } else {
              specs.push({ raw: mod, spec: mod.replace(/\./g, "/"), isPyInternal: true });
            }
          }
        }
        for (const m of clean.matchAll(/^\s*import\s+([^\n;]+)/gm)) {
          for (const item of m[1].split(",")) {
            const mod = item.trim().split(/\s+as\s+/)[0].trim();
            if (!mod) continue;
            const firstSeg = mod.split(".")[0];
            if (isInternalPyRootSeg(firstSeg)) {
              specs.push({ raw: mod, spec: mod.replace(/\./g, "/"), isPyInternal: true });
            }
          }
        }
      } else {
        const preClean = SFC_HTML_EXT.has(ext) ? code.replace(/<!--[\s\S]*?-->/g, "") : code;
        const clean = stripJsComments(preClean);
        for (const m of clean.matchAll(/\b(?:import|export)\s+(?:type\s+)?(?:[^;\x27"`]*?\s+from\s+)[\x27"]([^\x27"]+)[\x27"]/g)) {
          specs.push({ raw: m[1], spec: m[1], isPyInternal: false });
        }
        for (const m of clean.matchAll(/\bimport\s+[\x27"]([^\x27"]+)[\x27"]/g)) {
          specs.push({ raw: m[1], spec: m[1], isPyInternal: false });
        }
        for (const m of clean.matchAll(/\b(?:import|require)\s*\(\s*[\x27"`]([^\x27"`$]+)[\x27"`]\s*\)/g)) {
          specs.push({ raw: m[1], spec: m[1], isPyInternal: false });
        }
      }
      return specs;
    }

    function walkFiles(dir, out = []) {
      if (!fs.existsSync(dir) || !fs.statSync(dir).isDirectory()) return out;
      const entries = fs.readdirSync(dir, { withFileTypes: true }).sort((a, b) => a.name.localeCompare(b.name));
      for (const entry of entries) {
        if (SKIP_DIRS.has(entry.name)) continue;
        const full = path.join(dir, entry.name);
        if (entry.isDirectory()) walkFiles(full, out);
        else if (entry.isFile() && CODE_EXT_RE.test(entry.name)) out.push(full);
      }
      return out;
    }

    function inferLayerByPrefix(relPosixPath) {
      for (const [prefix, layer] of PATH_PREFIX_TO_LAYER) {
        if (relPosixPath === prefix || relPosixPath.startsWith(prefix + "/")) return layer;
      }
      return "";
    }

    function inferLayerFromSegments(segs) {
      for (const s of segs) {
        if (ALL_SEGMENTS.has(s)) return DIR_TO_LAYER[s];
        const low = s.toLowerCase();
        if (ALL_SEGMENTS.has(low)) return DIR_TO_LAYER[low];
      }
      return "";
    }

    const roots = candidateRoots.filter((r) => fs.existsSync(r) && fs.statSync(r).isDirectory());
    const seenViolations = new Set();
    const violations = [];

    for (const scanRoot of roots) {
      for (const filePath of walkFiles(scanRoot)) {
        const ext = path.extname(filePath).toLowerCase();
        const relFilePosix = filePath.replace(/\\/g, "/");
        const fileRelDirFromRepo = path.dirname(relFilePosix);
        const relDirInRoot = path.relative(scanRoot, path.dirname(filePath)).replace(/\\/g, "/");

        let sourceLayer = inferLayerByPrefix(fileRelDirFromRepo)
          || inferLayerByPrefix(relDirInRoot)
          || inferLayerFromSegments(relDirInRoot.split("/").filter(Boolean));
        if (!sourceLayer && !KNOWN_ROOTS.has(scanRoot) && ALL_SEGMENTS.has(scanRoot)) {
          sourceLayer = DIR_TO_LAYER[scanRoot];
        }
        if (!sourceLayer && scanRoot === "app" && ext !== ".py" && ALL_SEGMENTS.has("app")) {
          sourceLayer = DIR_TO_LAYER.app;
        }
        if (!sourceLayer) continue;

        const forbiddenSet = FORBIDDEN_BY_LAYER[sourceLayer];
        const extracted = extractSpecifiers(fs.readFileSync(filePath, "utf8"), ext);

        for (const item of extracted) {
          const rawSpec = item.raw;
          const spec = item.spec.trim().replace(/\\/g, "/").split(/[?#]/)[0];
          const aliasMatch = spec.match(ALIAS_RE);
          const isInternal = item.isPyInternal || Boolean(aliasMatch) || INTERNAL_PREFIX_RE.test(spec);
          if (!isInternal) continue;

          let normalized = "";
          let strippedRoot = "";
          let fullTargetRel = "";

          if (aliasMatch) {
            normalized = aliasMatch[1] + (aliasMatch[2] || "");
          } else if (spec.startsWith(".")) {
            const joined = path.posix.normalize(path.posix.join(fileRelDirFromRepo, spec)).replace(/^(?:\.\.\/)+/, "");
            fullTargetRel = joined;
            const rm = STRIP_ROOT_RE ? joined.match(STRIP_ROOT_RE) : null;
            if (rm) {
              strippedRoot = rm[1];
              normalized = rm[2];
            } else {
              normalized = joined;
            }
          } else {
            const dealiased = path.posix.normalize(spec.replace(/^(?:@\/|~\/|#\/)/, ""));
            fullTargetRel = dealiased;
            const rm = STRIP_ROOT_RE ? dealiased.match(STRIP_ROOT_RE) : null;
            if (rm) {
              strippedRoot = rm[1];
              normalized = rm[2];
            } else {
              normalized = dealiased;
            }
          }

          let targetLayer = (fullTargetRel && inferLayerByPrefix(fullTargetRel))
            || inferLayerByPrefix(normalized)
            || ((LAYER_SEG_RE.test(normalized) || LAYER_SEG_RE.test(spec))
              ? inferLayerFromSegments(normalized.split("/").filter(Boolean))
              : "");

          if (!targetLayer && strippedRoot === "app" && ext !== ".py" && ALL_SEGMENTS.has("app")) {
            targetLayer = DIR_TO_LAYER.app;
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
    }

    if (violations.length > maxLegacyLayerViolations) {
      const first = violations[0];
      console.log(`FAIL|${violations.length}|${maxLegacyLayerViolations}|${first.file}|${first.src}|${first.dst}|${first.spec}`);
    } else if (maxLegacyLayerViolations > 0) {
      console.log(`WARN|${violations.length}|${maxLegacyLayerViolations}`);
    }
  ')"
  src_layer_result="${src_layer_result%$'\r'}"
  if [ -n "$src_layer_result" ]; then
    IFS="|" read -r v_status v_count v_max v_file v_src v_dst v_spec <<< "$src_layer_result"
    if [ "$v_status" = "FAIL" ]; then
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
  index_lines="$(wc -l < "memory/INDEX.md" | tr -d '[:space:]')"
  index_bytes="$(wc -c < "memory/INDEX.md" | tr -d '[:space:]')"
  if [ "$index_lines" -gt 200 ] || [ "$index_bytes" -gt 25600 ]; then
    red_pen_error \
      "'memory/INDEX.md' excede el límite estricto ($index_lines líneas / $index_bytes bytes; máximo permitido: 200 líneas o 25600 bytes)." \
      "Gotcha #1: Superar las 200 líneas o 25 KB provoca truncamiento silencioso del índice de memoria al cargarse en el contexto del agente." \
      "Mueve las explicaciones detalladas a archivos dentro de 'memory/topics/*.md' y deja únicamente 1 línea de gancho por tema en 'memory/INDEX.md'."
  fi

  if [ -d "memory/topics" ]; then
    for topic_file in memory/topics/*.md; do
      [ -e "$topic_file" ] || continue
      topic_name="$(basename "$topic_file")"
      if ! grep -Fq "$topic_name" "memory/INDEX.md"; then
        red_pen_error \
          "Archivo de memoria huérfano detectado: '$topic_file' no está enlazado en 'memory/INDEX.md'." \
          "Gotcha #15 (Invariante de Guardado en Dos Pasos): Todo archivo creado en 'memory/topics/' debe tener su gancho de 1 línea registrado en 'memory/INDEX.md'." \
          "Añade un enlace de 1 línea hacia 'topics/$topic_name' en la sección 'Temas Activos' de 'memory/INDEX.md' o elimina el archivo huérfano."
      fi
    done
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

if [ -f ".agents/skills/maker-checker/SKILL.md" ]; then
  if ! node -e '
    const fs = require("node:fs");
    const text = fs.readFileSync(".agents/skills/maker-checker/SKILL.md", "utf8");
    const match = text.match(/^---\r?\n([\s\S]*?)\r?\n---/);
    if (!match) process.exit(1);
    const descLine = match[1].split(/\r?\n/).find((l) => l.trim().startsWith("description:"));
    if (!descLine) process.exit(1);
    const desc = descLine.replace(/^description:\s*/, "").trim().replace(/^["\x27]|["\x27]$/g, "");
    if (desc.length === 0 || desc.length > 150) process.exit(1);
  ' >/dev/null 2>&1; then
    red_pen_error \
      "La descripción en el frontmatter de '.agents/skills/maker-checker/SKILL.md' no existe o supera los 150 caracteres." \
      "Gotcha #12: El catálogo de Skills trunca las descripciones a ~150 caracteres; si es más larga, el agente nunca activa la Skill." \
      "Acorta el campo 'description' del frontmatter YAML en '.agents/skills/maker-checker/SKILL.md' a <= 150 caracteres colocando las palabras clave disparadoras al inicio."
  fi
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
    "Un fallo de sintaxis en el runner de hooks rompe PreToolUse, PostToolUse y Stop en tiempo de ejecución." \
    "Ejecuta 'node --check scripts/harness-hooks.mjs' y corrige cualquier error de sintaxis ESM."
fi

hooks_lines="$(wc -l < "scripts/harness-hooks.mjs" | tr -d '[:space:]')"
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
    "auditPrinciple", "protectedPaths", "hooks"
  ]);
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

  const isValidHandler = (h, expectedSubcmd) => {
    if (!h || typeof h !== "object" || Array.isArray(h)) return false;
    if (!Object.keys(h).every((k) => allowedHandlerKeys.has(k))) return false;
    if (h.type !== undefined && h.type !== "command") return false;
    if (typeof h.command !== "string" || !h.command.includes("../scripts/harness-hooks.mjs")) return false;
    if (!new RegExp("\\b" + expectedSubcmd + "\\b").test(h.command)) return false;
    if (h.timeout !== undefined && (!Number.isInteger(h.timeout) || h.timeout <= 0)) return false;
    return true;
  };

  let preEntries = [];
  let postEntries = [];
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
    if (!entry.hooks.every((h) => isValidHandler(h, "pre-tool-use"))) process.exit(1);
  }

  for (const reqTool of ["write_file", "edit_file", "run_command", "send_message"]) {
    if (!preEntries.some((e) => matchesTool(e.matcher, reqTool))) process.exit(1);
  }

  for (const entry of postEntries) {
    if (!entry || typeof entry !== "object" || Array.isArray(entry)) process.exit(1);
    if (!Object.keys(entry).every((k) => k === "matcher" || k === "hooks")) process.exit(1);
    if (typeof entry.matcher !== "string" || !Array.isArray(entry.hooks) || entry.hooks.length === 0) process.exit(1);
    if (!entry.hooks.every((h) => isValidHandler(h, "post-tool-use"))) process.exit(1);
  }

  for (const reqTool of ["write_file", "edit_file"]) {
    if (!postEntries.some((e) => matchesTool(e.matcher, reqTool))) process.exit(1);
  }

  // Stop en Antigravity es Plano (Flat): lista directa de handlers sin matcher ni hooks anidados
  if (!stopEntries.every((h) => isValidHandler(h, "stop"))) {
    process.exit(1);
  }
' >/dev/null 2>&1; then
  red_pen_error \
    "El archivo '.agents/hooks.json' no cumple el contrato nativo real de Antigravity (PreToolUse/PostToolUse agrupados con matcher+hooks, Stop plano e invocación a '../scripts/harness-hooks.mjs')." \
    "Antigravity parsea '.agents/hooks.json' bajo codificación protojson estricta desde cwd = .agents/ (rechazando campos raíz ajenos como '\$schema' o 'hooks' y exigiendo Stop plano sin 'matcher')." \
    "Define un grupo raíz (ej. 'harness-safety-gate') con 'PreToolUse' (cubriendo write_file, edit_file, run_command y send_message), 'PostToolUse' (agrupado) y 'Stop' (lista plana de handlers) invocando 'node ../scripts/harness-hooks.mjs <evento>'."
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
done < <(awk '/^## Required Artifacts/{flag=1; next} /^## /{flag=0} flag && /^- `[^`]+`/{sub(/^- `/, ""); sub(/`.*$/, ""); print}' AGENTS.md)

if [ ! -f "scripts/feature-list.schema.json" ]; then
  red_pen_error \
    "Falta el archivo de esquema 'scripts/feature-list.schema.json'." \
    "El arnés exige un JSON Schema canónico con los 4 estados (not-started, in-progress, blocked, done), soporte para area/user_visible_behavior y Pass-State Gating." \
    "Crea o restaura 'scripts/feature-list.schema.json' siguiendo el estándar Draft-07 del arnés."
fi

if ! node -e '
  const fs = require("node:fs");
  const path = require("node:path");
  const schema = JSON.parse(fs.readFileSync("scripts/feature-list.schema.json", "utf8"));
  if (schema?.additionalProperties !== false) process.exit(1);
  const itemsSchema = schema?.properties?.features?.items;
  if (itemsSchema?.additionalProperties !== false) process.exit(1);
  const itemProps = itemsSchema?.properties;
  const itemsRequired = itemsSchema?.required;
  const baseRequired = ["id", "name", "description", "status", "dependencies", "required_files", "verification"];
  if (!Array.isArray(itemsRequired) || !baseRequired.every((req) => itemsRequired.includes(req))) {
    process.exit(1);
  }
  const statusEnum = itemProps?.status?.enum;
  const canonical = ["not-started", "in-progress", "blocked", "done"];
  if (!Array.isArray(statusEnum) || statusEnum.length !== 4 || !canonical.every((s) => statusEnum.includes(s))) {
    process.exit(1);
  }
  if (!itemProps?.area || !itemProps?.user_visible_behavior) {
    process.exit(1);
  }
  const doneMinLen = itemsSchema?.allOf?.[0]?.then?.properties?.evidence?.minLength;
  if (typeof doneMinLen !== "number" || doneMinLen < 10) {
    process.exit(1);
  }
  if (fs.existsSync("feature_list.json")) {
    const resolvedRoot = path.resolve(".");
    const data = JSON.parse(fs.readFileSync("feature_list.json", "utf8"));
    const allowedRoot = new Set(Object.keys(schema.properties || {}));
    const allowedItem = new Set(Object.keys(itemProps));
    if (!data || typeof data !== "object" || Array.isArray(data) || !Array.isArray(data.features) || data.features.length === 0) {
      process.exit(1);
    }
    if (!Object.keys(data).every((k) => allowedRoot.has(k))) process.exit(1);
    const idRe = new RegExp(itemProps.id.pattern);
    for (const f of data.features) {
      if (!f || typeof f !== "object" || Array.isArray(f)) process.exit(1);
      if (!Object.keys(f).every((k) => allowedItem.has(k))) process.exit(1);
      if (!baseRequired.every((req) => f[req] !== undefined)) process.exit(1);
      if (typeof f.id !== "string" || !idRe.test(f.id)) process.exit(1);
      if (typeof f.name !== "string" || f.name.trim().length === 0) process.exit(1);
      if (!statusEnum.includes(f.status)) process.exit(1);
      if (!Array.isArray(f.required_files) || f.required_files.length === 0) process.exit(1);
      for (const relPath of f.required_files) {
        if (typeof relPath !== "string" || !relPath.trim() || path.isAbsolute(relPath) || path.posix.isAbsolute(relPath) || path.win32.isAbsolute(relPath) || /^[a-zA-Z]:/.test(relPath)) {
          process.exit(1);
        }
        const full = path.resolve(resolvedRoot, relPath);
        const rel = path.relative(resolvedRoot, full);
        if (!rel || rel === "." || rel === ".." || rel.startsWith("../") || rel.startsWith("..\\") || path.isAbsolute(rel)) {
          process.exit(1);
        }
        if (f.status === "done" && (!fs.existsSync(full) || !fs.statSync(full).isFile() || fs.statSync(full).size <= 0)) {
          process.exit(1);
        }
      }
      if (f.status === "done" && (typeof f.evidence !== "string" || f.evidence.trim().length < 10)) process.exit(1);
    }
  }
' >/dev/null 2>&1; then
  red_pen_error \
    "Violación de esquema entre 'scripts/feature-list.schema.json' y 'feature_list.json'." \
    "El rastreador de tareas debe exigir los 7 campos obligatorios en items.required, additionalProperties: false, los 4 estados canónicos, rutas internas seguras en required_files y evidencia ejecutable (>= 10 caracteres) + archivos físicos no vacíos en 'done'." \
    "Verifica que 'scripts/feature-list.schema.json' conserve items.required completo + minLength: 10 en done y que 'feature_list.json' cumpla estrictamente ese esquema."
fi

echo "--- [Vigilante Arquitectónico] 5. Escáner de Higiene y Estado Limpio (cleanup-scanner: .gitignore, .gitattributes, 0 CRLF, JSON, secretos, artefactos y árbol fuente) ---"
if [ ! -f ".gitattributes" ] || ! grep -Fq "eol=lf" ".gitattributes"; then
  red_pen_error \
    "Violación de portabilidad multiplataforma: falta '.gitattributes' o no impone 'eol=lf' en la raíz." \
    "En Windows con core.autocrlf=true, un 'git clone' o 'git worktree' sin '.gitattributes' convierte los scripts POSIX (.sh) y artefactos a CRLF rompiendo el invariante 0 CRLF de sprint-contract.md." \
    "Crea o restaura '.gitattributes' con '* text=auto eol=lf' y reglas explícitas 'eol=lf' para *.sh, *.mjs, *.json y *.md."
fi

crlf_script="$(node -e '
  const fs = require("node:fs");
  const path = require("node:path");
  const targets = ["init.sh", ".agents/hooks.json", "harness.config.json"];
  for (const dir of ["scripts", "scripts/lib"]) {
    if (!fs.existsSync(dir)) continue;
    for (const f of fs.readdirSync(dir)) {
      const p = path.join(dir, f);
      if (fs.statSync(p).isFile()) targets.push(p);
    }
  }
  for (const t of targets) {
    if (fs.existsSync(t) && fs.statSync(t).isFile() && fs.readFileSync(t).includes(13)) {
      console.log(t.replace(/\\/g, "/"));
      process.exit(0);
    }
  }
')"
crlf_script="${crlf_script%$'\r'}"
if [ -n "$crlf_script" ]; then
  red_pen_error \
    "Saltos de línea CRLF detectados en el artefacto ejecutable o de configuración '$crlf_script'." \
    "Los scripts POSIX, runners y manifiestos del arnés deben mantenerse en LF puro (0 CRLF) para funcionar de forma idéntica en Windows, Linux, WSL y contenedores CI." \
    "Normaliza '$crlf_script' a LF puro eliminando los bytes '\\r' (0x0D)."
fi

invalid_json_file="$(node -e '
  const fs = require("node:fs");
  const path = require("node:path");
  const skipDirs = new Set([
    ".git", "node_modules", "dist", "build", ".next", ".astro", ".svelte-kit",
    "coverage", ".venv", "venv", "env", "__pycache__", ".pytest_cache", ".mypy_cache", ".ruff_cache"
  ]);
  const jsoncRe = /(?:^|\/)(?:[jt]sconfig(?:\.[^/]+)?\.json|\.vscode\/.*\.json)$/i;
  function walk(dir, depth) {
    if (depth > 4 || !fs.existsSync(dir)) return null;
    for (const e of fs.readdirSync(dir, { withFileTypes: true })) {
      if (skipDirs.has(e.name)) continue;
      const full = path.join(dir, e.name);
      const rel = full.replace(/\\/g, "/");
      if (e.isDirectory()) {
        const hit = walk(full, depth + 1);
        if (hit) return hit;
      } else if (e.isFile() && e.name.toLowerCase().endsWith(".json") && !jsoncRe.test(rel)) {
        try { JSON.parse(fs.readFileSync(full, "utf8")); } catch (err) { return `${rel}|${err.message}`; }
      }
    }
    return null;
  }
  const bad = walk(".", 0);
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
done < <(find . -maxdepth 4 -type f -name ".env*" -not -path "./.git/*" -not -path "./node_modules/*" -not -path "./.venv/*" -not -path "./venv/*" -not -path "./env/*" 2>/dev/null || true)

temp_files="$(find . -maxdepth 4 -type f \( -name "*.tmp" -o -name "*.bak" -o -name "*.swp" -o -name "*~" \) -not -path "./.git/*" -not -path "./node_modules/*" -not -path "./dist/*" -not -path "./build/*" -not -path "./.venv/*" -not -path "./venv/*" -not -path "./env/*" 2>/dev/null || true)"
if [ -n "$temp_files" ]; then
  red_pen_error \
    "Se detectaron archivos temporales, de respaldo o swap en el repositorio: $temp_files" \
    "La Dimensión 4 de clean-state-checklist.md prohíbe dejar artefactos temporales (*.tmp, *.bak, *.swp, *~) que contaminen la siguiente sesión." \
    "Elimina los archivos temporales listados ('rm <archivo>') antes de ejecutar la verificación."
fi

for nb_tree in "src" "app" "backend" "deliverables" "notebooks"; do
  if [ -d "$nb_tree" ]; then
    nb_ckpts="$(find "$nb_tree" -maxdepth 5 -type d -name ".ipynb_checkpoints" -not -path "*/node_modules/*" -not -path "*/.venv/*" -not -path "*/venv/*" -not -path "*/env/*" 2>/dev/null || true)"
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
    src_logs="$(find "$src_tree" -maxdepth 4 -type f -name "*.log" -not -path "*/node_modules/*" -not -path "*/.venv/*" -not -path "*/venv/*" -not -path "*/env/*" 2>/dev/null || true)"
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
fi

echo "OK: Límites arquitectónicos, invariantes de 6 capas, Auto-Memoria, Seguridad e higiene estructural verificados sin violaciones."
