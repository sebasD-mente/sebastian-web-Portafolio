#!/usr/bin/env node
import { spawnSync } from 'node:child_process';
import fs from 'node:fs';
import path from 'node:path';
import { validateHarnessConfig } from './lib/harness-utils.mjs';

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
  const res = validateHarnessConfig(rootDir);
  if (!res.ok) {
    redPenExit(res.error, res.why, res.fix);
  }
  const cfg = res.config;
  return {
    mode: cfg.mode,
    layerMap: cfg.layerMap,
    directLayerEntries: cfg.directLayerEntries,
    appExplicitlyMapped: cfg.appExplicitlyMapped,
    packageRoots: cfg.python.packageRoots,
    enforceAstChecks: cfg.python.enforceAstChecks,
    maxLegacyLayerViolations: cfg.brownfield.maxLegacyLayerViolations
  };
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
app_explicitly_mapped = bool(payload.get("appExplicitlyMapped", False))
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
    r"(?:^|(?:Bearer|Token|Basic)\s+)(?:"
    r"sk-proj-[A-Za-z0-9_-]{10,}|"
    r"sk-[A-Za-z0-9_-]{10,}|"
    r"sk_live_[A-Za-z0-9]{10,}|"
    r"gh[pousr]_[A-Za-z0-9]{12,}|"
    r"github_pat_[A-Za-z0-9_]{12,}|"
    r"AIza[0-9A-Za-z_-]{16,}|"
    r"AKIA[0-9A-Z]{12,}|"
    r"-----BEGIN (?:RSA |EC |OPENSSH |DSA )?PRIVATE KEY-----"
    r")"
)

SECRET_VAR_RE = re.compile(
    r"^(?:[A-Za-z0-9]+_)*(?:API_KEY|APIKEY|API_SECRET|SECRET_KEY|ACCESS_TOKEN|AUTH_TOKEN|BEARER_TOKEN|PRIVATE_KEY|CLIENT_SECRET|JWT_SECRET|WEBHOOK_SECRET|PASSWORD|PASSWD)$",
    re.IGNORECASE,
)

DB_URL_VAR_RE = re.compile(
    r"^(?:[A-Za-z0-9]+_)*(?:DATABASE_URL|DB_URL|SQLALCHEMY_DATABASE_URI|REDIS_URL|MONGO_URI|MONGODB_URI|DSN)$",
    re.IGNORECASE,
)

URL_CRED_RE = re.compile(r"^[a-zA-Z0-9+.-]+://([^:/@\s]+):([^@\s]+)@")
AUTH_SCHEME_PREFIX_RE = re.compile(r"^(?:Bearer|Token|Basic)\s+", re.IGNORECASE)

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


def raw_detect_layer(parts_seq):
    if not parts_seq:
        return None
    joined = "/".join(p.lower() for p in parts_seq)
    for pref, canon in prefix_to_layer:
        if joined == pref or joined.startswith(pref + "/"):
            return canon
    for seg in parts_seq:
        canon = alias_to_layer.get(seg.lower())
        if canon:
            return canon
    return None


def strip_pkg_root(parts):
    if len(parts) > 1 and parts[0] in package_roots_set:
        sub_layer = raw_detect_layer(parts[1:])
        if sub_layer is not None:
            return parts[1:]
        first_low = parts[0].lower()
        is_mapped_layer_dir = (
            first_low in alias_to_layer
            or any(pref == first_low for pref, _ in prefix_to_layer)
        )
        if not is_mapped_layer_dir or (first_low == "app" and not app_explicitly_mapped):
            return parts[1:]
    return parts


def detect_layer(parts):
    if not parts:
        return None
    full_joined = "/".join(p.lower() for p in parts)
    for pref, canon in prefix_to_layer:
        if full_joined == pref or full_joined.startswith(pref + "/"):
            return canon
    trimmed = strip_pkg_root(parts)
    return raw_detect_layer(trimmed)


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


def reconstruct_joined_str(jnode):
    parts = []
    lit_chunks = []
    for part in jnode.values:
        if isinstance(part, ast.Constant) and isinstance(part.value, str):
            parts.append(part.value)
            lit_chunks.append(part.value)
        elif isinstance(part, ast.FormattedValue) and isinstance(part.value, ast.Constant) and isinstance(part.value.value, str):
            parts.append(part.value.value)
            lit_chunks.append(part.value.value)
        else:
            parts.append("{expr}")
    return "".join(parts), lit_chunks


def has_embedded_url_secret(raw_val):
    m_url = URL_CRED_RE.match(raw_val)
    if not m_url:
        return False
    pwd = m_url.group(2)
    pwd_literal = pwd.replace("{expr}", "").strip()
    if len(pwd_literal) < 4:
        return False
    if pwd_literal.lower() in DUMMY_DB_PASSWORDS:
        return False
    if is_placeholder_value(pwd_literal, min_len=4):
        return False
    return True


syntax_errors = []
layer_violations = []
seen_layer_violations = set()
secret_findings = []


def record_layer_violation(rel_file, lineno, src_layer, dst_layer, module_spec, display_spec):
    dedup_key = (rel_file, src_layer, dst_layer, module_spec)
    if dedup_key in seen_layer_violations:
        return
    seen_layer_violations.add(dedup_key)
    layer_violations.append({
        "file": rel_file,
        "line": lineno,
        "sourceLayer": src_layer,
        "targetLayer": dst_layer,
        "moduleSpec": module_spec,
        "spec": display_spec,
    })


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
        source_layer = detect_layer(dir_parts) or detect_layer(source_parts)

        if source_layer:
            forbidden_targets = FORBIDDEN[source_layer]
            for node in ast.walk(tree):
                if isinstance(node, ast.Import):
                    for alias in node.names:
                        mod_parts = [p for p in alias.name.split(".") if p]
                        if mod_parts and is_local_top(mod_parts[0]):
                            target_layer = detect_layer(mod_parts)
                            if target_layer and target_layer != source_layer and target_layer in forbidden_targets:
                                record_layer_violation(
                                    rel_path,
                                    getattr(node, "lineno", 1),
                                    source_layer,
                                    target_layer,
                                    alias.name,
                                    f"import {alias.name}",
                                )
                elif isinstance(node, ast.ImportFrom):
                    mod_parts = [p for p in (node.module or "").split(".") if p]
                    level = node.level or 0
                    if level > 0:
                        up = level - 1
                        base = dir_parts[: max(0, len(dir_parts) - up)]
                        base_mod = base + mod_parts
                        target_layer = detect_layer(base_mod)
                        dots = "." * level
                        if target_layer:
                            if target_layer != source_layer and target_layer in forbidden_targets:
                                record_layer_violation(
                                    rel_path,
                                    getattr(node, "lineno", 1),
                                    source_layer,
                                    target_layer,
                                    f"{dots}{node.module or ''}",
                                    f"from {dots}{node.module or ''} import ...",
                                )
                        elif not is_leaf_py_module(base_mod):
                            for alias in node.names:
                                if alias.name == "*":
                                    continue
                                tl = detect_layer(base_mod + [alias.name])
                                if tl and tl != source_layer and tl in forbidden_targets:
                                    mod_spec = f"{dots}{node.module}.{alias.name}" if node.module else f"{dots} import {alias.name}"
                                    record_layer_violation(
                                        rel_path,
                                        getattr(node, "lineno", 1),
                                        source_layer,
                                        tl,
                                        mod_spec,
                                        f"from {dots}{node.module or ''} import {alias.name}",
                                    )
                    else:
                        if mod_parts and is_local_top(mod_parts[0]):
                            target_layer = detect_layer(mod_parts)
                            if target_layer:
                                if target_layer != source_layer and target_layer in forbidden_targets:
                                    record_layer_violation(
                                        rel_path,
                                        getattr(node, "lineno", 1),
                                        source_layer,
                                        target_layer,
                                        node.module or "",
                                        f"from {node.module} import ...",
                                    )
                            elif not is_leaf_py_module(mod_parts):
                                for alias in node.names:
                                    if alias.name == "*":
                                        continue
                                    tl = detect_layer(mod_parts + [alias.name])
                                    if tl and tl != source_layer and tl in forbidden_targets:
                                        record_layer_violation(
                                            rel_path,
                                            getattr(node, "lineno", 1),
                                            source_layer,
                                            tl,
                                            f"{node.module}.{alias.name}",
                                            f"from {node.module} import {alias.name}",
                                        )

    # C. Detección de secretos quemados en AST: asignaciones, firmas def/async def, f-strings, kwargs, dicts y tokens de alta certeza (fuera de tests)
    lower_fname = raw_parts[-1].lower()
    is_test_file = in_tests_dir or lower_fname.startswith("test_") or lower_fname.endswith("_test.py")
    if not is_test_file:
        flagged_const_ids = set()

        def mark_node_flagged(vnode):
            flagged_const_ids.add(id(vnode))
            if isinstance(vnode, ast.JoinedStr):
                for sub in ast.walk(vnode):
                    flagged_const_ids.add(id(sub))

        def inspect_named_secret(var_name, val_node, fallback_lineno, context_kind="asignación literal dura en variable sensible"):
            if not isinstance(var_name, str) or not var_name.strip():
                return False

            is_fstring = False
            if isinstance(val_node, ast.Constant) and isinstance(val_node.value, str):
                raw_val = val_node.value.strip()
            elif isinstance(val_node, ast.JoinedStr):
                reconstructed, _ = reconstruct_joined_str(val_node)
                raw_val = reconstructed.strip()
                is_fstring = True
            else:
                return False

            if not raw_val:
                return False
            lineno = getattr(val_node, "lineno", None) or fallback_lineno or 1

            m_tok = REAL_SECRET_PREFIX_RE.search(raw_val)
            if m_tok and not is_placeholder_value(m_tok.group(0), min_len=10):
                mark_node_flagged(val_node)
                secret_findings.append({
                    "file": rel_path,
                    "line": lineno,
                    "var": var_name,
                    "kind": "prefijo de credencial real detectado",
                })
                return True

            if has_embedded_url_secret(raw_val):
                mark_node_flagged(val_node)
                secret_findings.append({
                    "file": rel_path,
                    "line": lineno,
                    "var": var_name,
                    "kind": "credenciales literales embebidas en URL de conexión",
                })
                return True

            if SECRET_VAR_RE.match(var_name):
                if raw_val.startswith(("/", "./", "../", "http://", "https://")):
                    return False
                stripped_auth = AUTH_SCHEME_PREFIX_RE.sub("", raw_val).strip()
                if not stripped_auth or " " in stripped_auth:
                    return False
                if not is_fstring:
                    if (
                        not is_placeholder_value(stripped_auth, min_len=8)
                        and not re.match(r"^[A-Z][A-Z0-9_]+$", stripped_auth)
                    ):
                        mark_node_flagged(val_node)
                        secret_findings.append({
                            "file": rel_path,
                            "line": lineno,
                            "var": var_name,
                            "kind": context_kind,
                        })
                        return True
                else:
                    non_expr_parts = [
                        seg.strip("_-:./")
                        for seg in stripped_auth.split("{expr}")
                        if seg.strip("_-:./")
                    ]
                    for seg in non_expr_parts:
                        if (
                            not is_placeholder_value(seg, min_len=8)
                            and not re.match(r"^[A-Z][A-Z0-9_]+$", seg)
                        ):
                            mark_node_flagged(val_node)
                            secret_findings.append({
                                "file": rel_path,
                                "line": lineno,
                                "var": var_name,
                                "kind": f"{context_kind} (f-string con secreto literal)",
                            })
                            return True
            return False

        for node in ast.walk(tree):
            node_line = getattr(node, "lineno", 1)
            if isinstance(node, ast.Assign):
                targets = []
                for t in node.targets:
                    targets.extend(extract_target_names(t))
                for var_name in targets:
                    if inspect_named_secret(var_name, node.value, node_line, "asignación literal dura en variable sensible"):
                        break
            elif isinstance(node, ast.AnnAssign) and node.value is not None:
                for var_name in extract_target_names(node.target):
                    if inspect_named_secret(var_name, node.value, node_line, "asignación literal dura en variable sensible"):
                        break
            elif isinstance(node, (ast.FunctionDef, ast.AsyncFunctionDef, ast.Lambda)):
                pos_args = list(getattr(node.args, "posonlyargs", [])) + list(node.args.args)
                pos_defaults = list(node.args.defaults)
                if pos_defaults:
                    for arg_obj, default_node in zip(pos_args[-len(pos_defaults):], pos_defaults):
                        if default_node is not None:
                            inspect_named_secret(
                                arg_obj.arg,
                                default_node,
                                getattr(default_node, "lineno", node_line),
                                "valor por defecto literal en parámetro sensible de función",
                            )
                for arg_obj, default_node in zip(node.args.kwonlyargs, node.args.kw_defaults):
                    if default_node is not None:
                        inspect_named_secret(
                            arg_obj.arg,
                            default_node,
                            getattr(default_node, "lineno", node_line),
                            "valor por defecto literal en parámetro keyword-only sensible",
                        )
            elif isinstance(node, ast.keyword) and isinstance(node.arg, str):
                inspect_named_secret(node.arg, node.value, node_line, "argumento keyword literal en parámetro sensible")
            elif isinstance(node, ast.Dict):
                for k_node, v_node in zip(node.keys, node.values):
                    if isinstance(k_node, ast.Constant) and isinstance(k_node.value, str) and v_node is not None:
                        inspect_named_secret(
                            k_node.value,
                            v_node,
                            getattr(k_node, "lineno", node_line),
                            "valor literal duro en clave sensible de diccionario",
                        )
            elif isinstance(node, ast.Call):
                if (
                    isinstance(node.func, ast.Attribute)
                    and node.func.attr in ("getenv", "get", "setdefault")
                    and len(node.args) >= 1
                    and isinstance(node.args[0], ast.Constant)
                    and isinstance(node.args[0].value, str)
                ):
                    default_arg = node.args[1] if len(node.args) >= 2 else None
                    if default_arg is None:
                        for kw in node.keywords:
                            if kw.arg == "default":
                                default_arg = kw.value
                                break
                    if default_arg is not None:
                        inspect_named_secret(
                            node.args[0].value,
                            default_arg,
                            getattr(default_arg, "lineno", node_line),
                            "valor fallback literal en variable sensible de entorno",
                        )

        for node in ast.walk(tree):
            if isinstance(node, ast.JoinedStr) and id(node) not in flagged_const_ids:
                reconstructed, _ = reconstruct_joined_str(node)
                raw_val = reconstructed.strip()
                if not raw_val:
                    continue
                m_tok = REAL_SECRET_PREFIX_RE.search(raw_val)
                if m_tok and not is_placeholder_value(m_tok.group(0), min_len=12):
                    mark_node_flagged(node)
                    secret_findings.append({
                        "file": rel_path,
                        "line": getattr(node, "lineno", 1),
                        "var": "<f-string>",
                        "kind": "prefijo de token de alta certeza detectado en f-string",
                    })
                elif has_embedded_url_secret(raw_val):
                    mark_node_flagged(node)
                    secret_findings.append({
                        "file": rel_path,
                        "line": getattr(node, "lineno", 1),
                        "var": "<f-string>",
                        "kind": "credenciales literales embebidas en URL de conexión (f-string)",
                    })
            elif isinstance(node, ast.Constant) and isinstance(node.value, str) and id(node) not in flagged_const_ids:
                raw_val = node.value.strip()
                if not raw_val:
                    continue
                m_tok = REAL_SECRET_PREFIX_RE.search(raw_val)
                if m_tok and not is_placeholder_value(m_tok.group(0), min_len=12):
                    secret_findings.append({
                        "file": rel_path,
                        "line": getattr(node, "lineno", 1),
                        "var": "<literal>",
                        "kind": "prefijo de token de alta certeza detectado en constante string",
                    })
                elif has_embedded_url_secret(raw_val):
                    secret_findings.append({
                        "file": rel_path,
                        "line": getattr(node, "lineno", 1),
                        "var": "<literal>",
                        "kind": "credenciales literales embebidas en URL de conexión",
                    })

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

  const cfg = loadPythonHarnessConfig(root);

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

  const checkLayers = !(cfg.mode === 'non-dev' || cfg.enforceAstChecks === false);

  const payload = JSON.stringify({
    root,
    files: pyFiles,
    layerMap: cfg.layerMap,
    directLayerEntries: cfg.directLayerEntries,
    appExplicitlyMapped: cfg.appExplicitlyMapped,
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
