#!/usr/bin/env node
import { spawnSync } from 'node:child_process';
import fs from 'node:fs';
import path from 'node:path';

const SKIP_DIRS = new Set([
  '.git',
  'node_modules',
  '.venv',
  'venv',
  'env',
  'dist',
  'build',
  '__pycache__',
  '.pytest_cache',
  '.mypy_cache',
  '.ruff_cache'
]);

const DEFAULT_LAYER_MAP = {
  types: ['types', 'schemas', 'interfaces', 'contracts', 'domain'],
  config: ['config', 'settings', 'constants'],
  repo: ['repo', 'repositories', 'db', 'data', 'adapters', 'clients', 'models'],
  service: ['service', 'services', 'usecases', 'core', 'logic'],
  runtime: ['runtime', 'server', 'cli', 'workers', 'jobs', 'api', 'middleware'],
  ui: ['ui', 'components', 'pages', 'views', 'app', 'routes', 'templates', 'screens']
};

const DEFAULT_PACKAGE_ROOTS = ['src', 'app', 'backend'];

function redPenExit(err, why, fix) {
  console.error(`ERROR: ${err}`);
  console.error(`POR QUÉ: ${why}`);
  console.error(`SOLUCIÓN (FIX): ${fix}`);
  process.exit(1);
}

function parseCliArgs(argv) {
  let root = process.cwd();
  let help = false;
  for (let i = 0; i < argv.length; i += 1) {
    const arg = argv[i];
    if (arg === '--help' || arg === '-h') {
      help = true;
    } else if (arg === '--root' || arg === '--target') {
      if (argv[i + 1]) {
        root = argv[i + 1];
        i += 1;
      }
    } else if (arg.startsWith('--root=')) {
      root = arg.slice('--root='.length);
    } else if (arg.startsWith('--target=')) {
      root = arg.slice('--target='.length);
    } else if (!arg.startsWith('-')) {
      root = arg;
    }
  }
  return { root: path.resolve(root), help };
}

function collectPythonFiles(rootDir) {
  const results = [];
  function walk(currentDir) {
    let entries = [];
    try {
      entries = fs.readdirSync(currentDir, { withFileTypes: true });
    } catch {
      return;
    }
    for (const entry of entries) {
      if (SKIP_DIRS.has(entry.name) || entry.name.endsWith('.egg-info')) continue;
      const fullPath = path.join(currentDir, entry.name);
      if (entry.isDirectory()) {
        walk(fullPath);
      } else if (entry.isFile() && entry.name.toLowerCase().endsWith('.py')) {
        results.push(path.relative(rootDir, fullPath).replace(/\\/g, '/'));
      }
    }
  }
  walk(rootDir);
  return results.sort();
}

function locatePython3(rootDir) {
  const candidates = [
    { bin: path.join(rootDir, '.venv', 'Scripts', 'python.exe'), args: [], localFile: true },
    { bin: path.join(rootDir, '.venv', 'bin', 'python'), args: [], localFile: true },
    { bin: path.join(rootDir, 'venv', 'Scripts', 'python.exe'), args: [], localFile: true },
    { bin: path.join(rootDir, 'venv', 'bin', 'python'), args: [], localFile: true },
    { bin: 'python3', args: [], localFile: false },
    { bin: 'python', args: [], localFile: false },
    { bin: 'py', args: ['-3'], localFile: false }
  ];

  for (const cand of candidates) {
    if (cand.localFile && !fs.existsSync(cand.bin)) continue;
    const probe = spawnSync(
      cand.bin,
      [...cand.args, '-c', 'import sys; assert sys.version_info[0] >= 3'],
      { cwd: rootDir, encoding: 'utf8', stdio: 'ignore', timeout: 10000 }
    );
    if (!probe.error && probe.status === 0) {
      return cand;
    }
  }
  return null;
}

function loadPythonHarnessConfig(rootDir) {
  const configPath = path.join(rootDir, 'harness.config.json');
  const baseLists = Object.fromEntries(Object.entries(DEFAULT_LAYER_MAP).map(([k, v]) => [k, [...v]]));
  const directLayerEntries = [];
  const resolved = {
    mode: 'auto',
    layerMap: baseLists,
    directLayerEntries,
    packageRoots: [...DEFAULT_PACKAGE_ROOTS],
    enforceAstChecks: true,
    maxLegacyLayerViolations: 0
  };

  if (!fs.existsSync(configPath)) return resolved;

  let parsed = null;
  try {
    parsed = JSON.parse(fs.readFileSync(configPath, 'utf8'));
  } catch (err) {
    redPenExit(
      `El archivo 'harness.config.json' contiene JSON inválido (${err.message}).`,
      'El inspector Python necesita leer la configuración Camaleón para resolver packageRoots, layerMap y tolerancia brownfield.',
      "Corrige la sintaxis JSON de 'harness.config.json' en la raíz del proyecto."
    );
  }

  if (parsed && typeof parsed === 'object' && !Array.isArray(parsed)) {
    if (typeof parsed.mode === 'string') resolved.mode = parsed.mode;
    if (parsed.layerMap && typeof parsed.layerMap === 'object' && !Array.isArray(parsed.layerMap)) {
      const validCanon = new Set(Object.keys(DEFAULT_LAYER_MAP));
      for (const [rawKey, rawVal] of Object.entries(parsed.layerMap)) {
        const cleanKey = String(rawKey || '').trim().replace(/\\/g, '/').replace(/^\/+|\/+$/g, '');
        if (!cleanKey) continue;
        const lowerKey = cleanKey.toLowerCase();
        if (Array.isArray(rawVal) && validCanon.has(lowerKey)) {
          const items = rawVal.filter((x) => typeof x === 'string' && x.trim()).map((x) => x.trim().replace(/\\/g, '/').replace(/^\/+|\/+$/g, ''));
          const claimedLower = new Set(items.map((x) => x.toLowerCase()));
          for (const other of validCanon) {
            if (other !== lowerKey) {
              resolved.layerMap[other] = resolved.layerMap[other].filter((a) => !claimedLower.has(a.toLowerCase()));
            }
          }
          resolved.layerMap[lowerKey] = items;
        } else if (typeof rawVal === 'string' && validCanon.has(rawVal.trim().toLowerCase())) {
          const target = rawVal.trim().toLowerCase();
          for (const other of validCanon) {
            resolved.layerMap[other] = resolved.layerMap[other].filter((a) => a.toLowerCase() !== lowerKey);
          }
          directLayerEntries.push([cleanKey, target]);
        }
      }
    }
    if (parsed.python && typeof parsed.python === 'object' && !Array.isArray(parsed.python)) {
      if (Array.isArray(parsed.python.packageRoots)) {
        resolved.packageRoots = parsed.python.packageRoots.filter((x) => typeof x === 'string' && x.trim());
      }
      if (typeof parsed.python.enforceAstChecks === 'boolean') {
        resolved.enforceAstChecks = parsed.python.enforceAstChecks;
      }
    }
    if (parsed.brownfield && typeof parsed.brownfield === 'object' && !Array.isArray(parsed.brownfield)) {
      if (Number.isInteger(parsed.brownfield.maxLegacyLayerViolations) && parsed.brownfield.maxLegacyLayerViolations >= 0) {
        resolved.maxLegacyLayerViolations = parsed.brownfield.maxLegacyLayerViolations;
      }
    }
  }

  return resolved;
}

const PYTHON_AST_INSPECTOR = String.raw`
import ast
import json
import os
import re
import sys

payload = json.loads(sys.stdin.read())
root = payload["root"]
files = payload["files"]
layer_map = payload["layerMap"]
direct_entries = payload.get("directLayerEntries", [])
package_roots = payload["packageRoots"]
check_layers = payload["checkLayers"]

package_roots_set = set(package_roots)
stdlib_names = getattr(sys, "stdlib_module_names", frozenset())

alias_to_layer = {}
prefix_to_layer = []
for canon in ("types", "config", "repo", "service", "runtime", "ui"):
    alias_to_layer[canon] = canon
    for alias in layer_map.get(canon, []):
        if isinstance(alias, str) and alias.strip():
            clean_alias = alias.strip().strip("/")
            if "/" in clean_alias:
                prefix_to_layer.append((clean_alias.lower(), canon))
            else:
                alias_to_layer[clean_alias.lower()] = canon

for raw_prefix, canon in direct_entries:
    clean_p = raw_prefix.strip().strip("/")
    if not clean_p:
        continue
    if "/" in clean_p:
        prefix_to_layer.append((clean_p.lower(), canon))
    else:
        alias_to_layer[clean_p.lower()] = canon

prefix_to_layer.sort(key=lambda item: len(item[0]), reverse=True)

FORBIDDEN = {
    "types": {"config", "repo", "service", "runtime", "ui"},
    "config": {"repo", "service", "runtime", "ui"},
    "repo": {"service", "runtime", "ui"},
    "service": {"runtime", "ui"},
    "runtime": {"ui"},
    "ui": {"config", "repo"},
}

PLACEHOLDER_SUBSTRINGS = (
    "changeme",
    "change_me",
    "change-me",
    "example",
    "dummy",
    "placeholder",
    "redacted",
    "your_",
    "your-",
    "replace_me",
    "replace-me",
    "insert_",
    "todo",
    "tbd",
    "fixme",
    "fake",
    "mock",
    "sample",
    "test_key",
    "test-key",
    "xxx",
    "***",
)

REAL_SECRET_PREFIX_RE = re.compile(
    r"^(?:Bearer\s+)?(?:"
    r"sk-[A-Za-z0-9_-]{10,}|"
    r"sk_live_[A-Za-z0-9]{10,}|"
    r"ghp_[A-Za-z0-9]{12,}|"
    r"github_pat_[A-Za-z0-9_]{12,}|"
    r"AIza[0-9A-Za-z_-]{16,}|"
    r"AKIA[0-9A-Z]{12,}|"
    r"-----BEGIN (?:RSA |EC |OPENSSH |DSA )?PRIVATE KEY-----"
    r")"
)

SECRET_VAR_RE = re.compile(
    r"^(?:[A-Za-z0-9]+_)*(?:API_KEY|APIKEY|SECRET_KEY|ACCESS_TOKEN|AUTH_TOKEN|PRIVATE_KEY|CLIENT_SECRET)$",
    re.IGNORECASE,
)

DB_URL_VAR_RE = re.compile(
    r"^(?:[A-Za-z0-9]+_)*(?:DATABASE_URL|DB_URL|SQLALCHEMY_DATABASE_URI|REDIS_URL|MONGO_URI|MONGODB_URI)$",
    re.IGNORECASE,
)

URL_CRED_RE = re.compile(r"^[a-zA-Z0-9+.-]+://([^:/@\s]+):([^@\s]+)@")

DUMMY_DB_PASSWORDS = {
    "postgres",
    "root",
    "password",
    "pass",
    "admin",
    "test",
    "guest",
    "user",
    "secret",
    "local",
    "dev",
}


def is_placeholder_value(val, min_len=8):
    s = val.strip()
    if not s or len(s) < min_len:
        return True
    low = s.lower()
    if low in ("none", "null", "true", "false", "default", "secret", "password", "api_key", "apikey"):
        return True
    if low.startswith(("$", "%", "{{")) or (low.startswith("<") and low.endswith(">")):
        return True
    if re.match(r"^<[^>]+>$", low):
        return True
    for tok in PLACEHOLDER_SUBSTRINGS:
        if tok in low:
            return True
    return False


def strip_pkg_root(parts):
    if len(parts) > 1 and parts[0] in package_roots_set:
        return parts[1:]
    return parts


def detect_layer(parts):
    full_joined = "/".join(p.lower() for p in parts)
    trimmed = strip_pkg_root(parts)
    trimmed_joined = "/".join(p.lower() for p in trimmed)
    for pref, canon in prefix_to_layer:
        if full_joined == pref or full_joined.startswith(pref + "/") or trimmed_joined == pref or trimmed_joined.startswith(pref + "/"):
            return canon
    for seg in trimmed:
        canon = alias_to_layer.get(seg.lower())
        if canon:
            return canon
    return None


def is_local_top(top_seg):
    if not top_seg:
        return False
    if top_seg in package_roots_set:
        return True
    if os.path.exists(os.path.join(root, top_seg)) or os.path.isfile(os.path.join(root, top_seg + ".py")):
        return True
    for pr in package_roots:
        pr_dir = os.path.join(root, pr)
        if os.path.isdir(pr_dir):
            if os.path.exists(os.path.join(pr_dir, top_seg)) or os.path.isfile(os.path.join(pr_dir, top_seg + ".py")):
                return True
    if top_seg.lower() in alias_to_layer and top_seg not in stdlib_names:
        return True
    return False


def is_leaf_py_module(parts):
    if not parts:
        return False
    direct = os.path.join(root, *parts) + ".py"
    if os.path.isfile(direct) and not os.path.isdir(os.path.join(root, *parts)):
        return True
    for pr in package_roots:
        cand = os.path.join(root, pr, *parts) + ".py"
        if os.path.isfile(cand) and not os.path.isdir(os.path.join(root, pr, *parts)):
            return True
    return False


def extract_target_names(target):
    names = []
    if isinstance(target, ast.Name):
        names.append(target.id)
    elif isinstance(target, ast.Attribute):
        names.append(target.attr)
    elif isinstance(target, ast.Subscript):
        sl = target.slice
        if type(sl).__name__ == "Index":
            sl = sl.value
        if isinstance(sl, ast.Constant) and isinstance(sl.value, str):
            names.append(sl.value)
    elif isinstance(target, (ast.Tuple, ast.List)):
        for elt in target.elts:
            names.extend(extract_target_names(elt))
    return names


syntax_errors = []
layer_violations = []
secret_findings = []

for rel_path in files:
    full_path = os.path.join(root, *rel_path.split("/"))
    try:
        with open(full_path, "r", encoding="utf-8-sig") as fh:
            source = fh.read()
    except Exception as exc:
        syntax_errors.append({"file": rel_path, "line": 1, "msg": f"No se pudo leer UTF-8: {exc}"})
        continue

    try:
        tree = ast.parse(source, filename=rel_path)
    except (SyntaxError, ValueError) as exc:
        lineno = getattr(exc, "lineno", 1) or 1
        msg = getattr(exc, "msg", str(exc))
        syntax_errors.append({"file": rel_path, "line": int(lineno), "msg": str(msg)})
        continue

    raw_parts = [p for p in rel_path.split("/") if p]
    dir_parts = raw_parts[:-1]
    in_tests_dir = any(p.lower() in ("tests", "test") for p in dir_parts)

    # B. Flujo direccional de 6 capas
    if check_layers and not in_tests_dir:
        file_stem = os.path.splitext(raw_parts[-1])[0]
        source_parts = dir_parts + ([] if file_stem == "__init__" else [file_stem])
        source_layer = detect_layer(source_parts)

        if source_layer:
            forbidden_targets = FORBIDDEN[source_layer]
            for node in ast.walk(tree):
                if isinstance(node, ast.Import):
                    for alias in node.names:
                        mod_parts = [p for p in alias.name.split(".") if p]
                        if mod_parts and is_local_top(mod_parts[0]):
                            target_layer = detect_layer(mod_parts)
                            if target_layer and target_layer != source_layer and target_layer in forbidden_targets:
                                layer_violations.append({
                                    "file": rel_path,
                                    "line": getattr(node, "lineno", 1),
                                    "sourceLayer": source_layer,
                                    "targetLayer": target_layer,
                                    "spec": f"import {alias.name}",
                                })
                elif isinstance(node, ast.ImportFrom):
                    mod_parts = [p for p in (node.module or "").split(".") if p]
                    level = node.level or 0
                    if level > 0:
                        up = level - 1
                        base = dir_parts[: max(0, len(dir_parts) - up)]
                        base_mod = base + mod_parts
                        target_layer = detect_layer(base_mod)
                        if target_layer:
                            if target_layer != source_layer and target_layer in forbidden_targets:
                                dots = "." * level
                                layer_violations.append({
                                    "file": rel_path,
                                    "line": getattr(node, "lineno", 1),
                                    "sourceLayer": source_layer,
                                    "targetLayer": target_layer,
                                    "spec": f"from {dots}{node.module or ''} import ...",
                                })
                        elif not is_leaf_py_module(base_mod):
                            for alias in node.names:
                                if alias.name == "*":
                                    continue
                                tl = detect_layer(base_mod + [alias.name])
                                if tl and tl != source_layer and tl in forbidden_targets:
                                    dots = "." * level
                                    layer_violations.append({
                                        "file": rel_path,
                                        "line": getattr(node, "lineno", 1),
                                        "sourceLayer": source_layer,
                                        "targetLayer": tl,
                                        "spec": f"from {dots}{node.module or ''} import {alias.name}",
                                    })
                    else:
                        if mod_parts and is_local_top(mod_parts[0]):
                            target_layer = detect_layer(mod_parts)
                            if target_layer:
                                if target_layer != source_layer and target_layer in forbidden_targets:
                                    layer_violations.append({
                                        "file": rel_path,
                                        "line": getattr(node, "lineno", 1),
                                        "sourceLayer": source_layer,
                                        "targetLayer": target_layer,
                                        "spec": f"from {node.module} import ...",
                                    })
                            elif not is_leaf_py_module(mod_parts):
                                for alias in node.names:
                                    if alias.name == "*":
                                        continue
                                    tl = detect_layer(mod_parts + [alias.name])
                                    if tl and tl != source_layer and tl in forbidden_targets:
                                        layer_violations.append({
                                            "file": rel_path,
                                            "line": getattr(node, "lineno", 1),
                                            "sourceLayer": source_layer,
                                            "targetLayer": tl,
                                            "spec": f"from {node.module} import {alias.name}",
                                        })

    # C. Detección de secretos quemados obvios en AST (fuera de tests/)
    if not in_tests_dir:
        for node in ast.walk(tree):
            targets = []
            val_node = None
            if isinstance(node, ast.Assign):
                for t in node.targets:
                    targets.extend(extract_target_names(t))
                val_node = node.value
            elif isinstance(node, ast.AnnAssign) and node.value is not None:
                targets.extend(extract_target_names(node.target))
                val_node = node.value

            if not targets or not (isinstance(val_node, ast.Constant) and isinstance(val_node.value, str)):
                continue

            raw_val = val_node.value.strip()
            if not raw_val:
                continue

            lineno = getattr(node, "lineno", 1)
            for var_name in targets:
                if REAL_SECRET_PREFIX_RE.search(raw_val) and not is_placeholder_value(raw_val, min_len=10):
                    secret_findings.append({
                        "file": rel_path,
                        "line": lineno,
                        "var": var_name,
                        "kind": "prefijo de credencial real detectado",
                    })
                    break

                if DB_URL_VAR_RE.match(var_name):
                    m = URL_CRED_RE.match(raw_val)
                    if m:
                        pwd = m.group(2)
                        if pwd.lower() not in DUMMY_DB_PASSWORDS and not is_placeholder_value(pwd, min_len=4):
                            secret_findings.append({
                                "file": rel_path,
                                "line": lineno,
                                "var": var_name,
                                "kind": "credenciales literales embebidas en URL de conexión",
                            })
                            break

                if SECRET_VAR_RE.match(var_name):
                    if (
                        not is_placeholder_value(raw_val, min_len=8)
                        and " " not in raw_val
                        and not re.match(r"^[A-Z][A-Z0-9_]+$", raw_val)
                        and not raw_val.startswith(("/", "./", "../"))
                    ):
                        secret_findings.append({
                            "file": rel_path,
                            "line": lineno,
                            "var": var_name,
                            "kind": "asignación literal dura en variable sensible",
                        })
                        break

print(json.dumps({
    "syntaxErrors": syntax_errors,
    "layerViolations": layer_violations,
    "secretFindings": secret_findings,
}))
`;

function main() {
  const { root, help } = parseCliArgs(process.argv.slice(2));
  if (help) {
    console.log('Usage: node scripts/check-python.mjs [--root <dir>]');
    process.exit(0);
  }

  const pyFiles = collectPythonFiles(root);
  if (pyFiles.length === 0) {
    process.exit(0);
  }

  const pyCmd = locatePython3(root);
  if (!pyCmd) {
    redPenExit(
      `Se detectaron ${pyFiles.length} archivo(s) '.py' en '${root}', pero no hay ningún intérprete Python 3 funcional disponible.`,
      'El inspector AST de Python requiere un binario real de Python 3 (.venv, venv, python3, python o py -3) y descarta stubs vacíos como el de Microsoft Store.',
      "Instala Python 3 real o crea el entorno virtual del proyecto ('python -m venv .venv') antes de ejecutar 'bash ./init.sh'."
    );
  }

  const cfg = loadPythonHarnessConfig(root);
  const checkLayers = !(cfg.mode === 'non-dev' || cfg.enforceAstChecks === false);

  const payload = JSON.stringify({
    root,
    files: pyFiles,
    layerMap: cfg.layerMap,
    directLayerEntries: cfg.directLayerEntries,
    packageRoots: cfg.packageRoots,
    checkLayers
  });

  const run = spawnSync(pyCmd.bin, [...pyCmd.args, '-c', PYTHON_AST_INSPECTOR], {
    cwd: root,
    input: payload,
    encoding: 'utf8',
    env: { ...process.env, PYTHONIOENCODING: 'utf-8', PYTHONUTF8: '1' },
    maxBuffer: 16 * 1024 * 1024,
    timeout: 30000
  });

  if (run.error || run.status !== 0) {
    const detail = (run.stderr || run.stdout || String(run.error || 'fallo desconocido')).trim();
    redPenExit(
      `Fallo al ejecutar el inspector AST de Python (${detail}).`,
      'No se pudo completar el análisis estático con el módulo estándar ast de Python.',
      'Verifica que la instalación de Python 3 incluya la librería estándar completa y reintenta.'
    );
  }

  let report = null;
  try {
    report = JSON.parse(run.stdout.trim());
  } catch (err) {
    redPenExit(
      `Salida inválida del inspector AST de Python (${err.message}).`,
      'El subproceso Python devolvió una respuesta no parseable como JSON.',
      'Ejecuta manualmente el intérprete Python del entorno para descartar hooks de sitecustomize que impriman texto extra en stdout.'
    );
  }

  if (Array.isArray(report.syntaxErrors) && report.syntaxErrors.length > 0) {
    const first = report.syntaxErrors[0];
    redPenExit(
      `Error de sintaxis Python en '${first.file}' (línea ${first.line}): ${first.msg}.`,
      'Todo archivo Python del repositorio debe compilar limpiamente bajo ast.parse antes de superar la Puerta 3.',
      `Corrige la sintaxis en '${first.file}:${first.line}' y vuelve a ejecutar 'node scripts/check-python.mjs'.`
    );
  }

  if (Array.isArray(report.secretFindings) && report.secretFindings.length > 0) {
    const first = report.secretFindings[0];
    redPenExit(
      `Secreto quemado detectado en '${first.file}' (línea ${first.line}, variable '${first.var}'): ${first.kind}.`,
      'docs/SECURITY.md prohíbe almacenar credenciales, llaves API o tokens literales directamente en el código fuente.',
      `Extrae '${first.var}' hacia variables de entorno ('os.getenv("${first.var}")') y documenta solo un placeholder seguro en '.env.example'.`
    );
  }

  const violations = Array.isArray(report.layerViolations) ? report.layerViolations : [];
  if (checkLayers && violations.length > cfg.maxLegacyLayerViolations) {
    const first = violations[0];
    if (first.sourceLayer === 'ui') {
      redPenExit(
        `Salto ilegal de capas Python en '${first.file}' (línea ${first.line}): la capa 'ui' ejecuta '${first.spec}' hacia '${first.targetLayer}' (${violations.length} violación(es), máximo permitido: ${cfg.maxLegacyLayerViolations}).`,
        'El modelo de 6 capas (types -> config -> repo -> service -> runtime -> ui) permite a UI importar types, service, runtime o ui, pero prohíbe saltar directamente a config o repo.',
        `Enruta el acceso desde '${first.file}' a través de un caso de uso o adaptador en las capas 'service' o 'runtime'.`
      );
    }
    redPenExit(
      `Violación direccional de capas Python en '${first.file}' (línea ${first.line}): la capa inferior '${first.sourceLayer}' ejecuta '${first.spec}' hacia la capa superior '${first.targetLayer}' (${violations.length} violación(es), máximo permitido: ${cfg.maxLegacyLayerViolations}).`,
      "ARCHITECTURE.md exige respetar estrictamente el flujo 'types -> config -> repo -> service -> runtime -> ui' sin dependencias hacia atrás.",
      `Invierte la dependencia extrayendo contratos compartidos hacia la capa 'types' o mueve la lógica a una capa superior.`
    );
  }
  if (checkLayers && cfg.maxLegacyLayerViolations > 0 && violations.length > 0) {
    console.log(`AVISO [Brownfield Ratchet Python]: Detectadas ${violations.length} violaciones legadas dentro del tope permitido (${violations.length} <= ${cfg.maxLegacyLayerViolations}).`);
  }

  console.log(`OK: Inspector AST Python verificado sobre ${pyFiles.length} archivo(s) .py.`);
}

main();
