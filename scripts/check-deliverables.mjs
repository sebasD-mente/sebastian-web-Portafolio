#!/usr/bin/env node
import fs from 'node:fs';
import path from 'node:path';

const VALID_MODES = new Set(['auto', 'greenfield', 'brownfield', 'non-dev']);
const CANONICAL_LAYERS = new Set(['types', 'config', 'repo', 'service', 'runtime', 'ui']);
const DELIVERABLE_TEXT_EXTS = new Set(['.md', '.txt', '.csv', '.html']);

const DEFAULT_NON_DEV = {
  deliverableDirs: ['deliverables', 'content', 'research', 'reports'],
  forbidPlaceholders: true,
  checkMarkdownLinks: true,
  minDeliverableWords: 15
};

function redPenExit(err, why, fix) {
  console.error(`ERROR: ${err}`);
  console.error(`POR QUÉ: ${why}`);
  console.error(`SOLUCIÓN (FIX): ${fix}`);
  process.exit(1);
}

function isPlainObject(val) {
  return Boolean(val) && typeof val === 'object' && !Array.isArray(val);
}

function isNonEmptyStringArray(val) {
  return Array.isArray(val) && val.every((item) => typeof item === 'string' && item.trim().length > 0);
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

function validateAndLoadConfig(rootDir) {
  const configPath = path.join(rootDir, 'harness.config.json');
  if (!fs.existsSync(configPath)) {
    return {
      exists: false,
      mode: 'auto',
      nonDev: { ...DEFAULT_NON_DEV }
    };
  }

  let parsed = null;
  try {
    parsed = JSON.parse(fs.readFileSync(configPath, 'utf8'));
  } catch (err) {
    redPenExit(
      `JSON mal formado en 'harness.config.json': ${err.message}.`,
      'La Puerta 3 requiere un archivo harness.config.json sintácticamente válido para configurar el modo Camaleón.',
      "Corrige la sintaxis JSON en 'harness.config.json' (comas, llaves o comillas dobles)."
    );
  }

  if (!isPlainObject(parsed)) {
    redPenExit(
      "La raíz de 'harness.config.json' debe ser un objeto JSON.",
      'El perfil Camaleón define propiedades estructuradas (mode, layerMap, brownfield, python, nonDev).',
      "Reemplaza el contenido raíz de 'harness.config.json' por un objeto JSON válido."
    );
  }

  const ALLOWED_ROOT_KEYS = new Set(['$schema', 'mode', 'activeStacks', 'layerMap', 'brownfield', 'python', 'nonDev']);
  for (const k of Object.keys(parsed)) {
    if (!ALLOWED_ROOT_KEYS.has(k)) {
      redPenExit(
        `Clave raíz desconocida '${k}' en 'harness.config.json'.`,
        'El esquema estricto de harness.config.json rechaza claves desconocidas para evitar errores tipográficos silenciosos.',
        `Elimina o corrige '${k}' en 'harness.config.json' (claves válidas: mode, activeStacks, layerMap, brownfield, python, nonDev).`
      );
    }
  }

  if (typeof parsed.mode !== 'string' || !VALID_MODES.has(parsed.mode)) {
    redPenExit(
      `Valor inválido para 'mode' en 'harness.config.json' (${JSON.stringify(parsed.mode)}).`,
      "El campo 'mode' solo admite uno de los 4 modos canónicos: 'auto', 'greenfield', 'brownfield' o 'non-dev'.",
      'Actualiza "mode" en harness.config.json a "auto", "greenfield", "brownfield" o "non-dev".'
    );
  }

  if (parsed.activeStacks !== undefined) {
    if (!Array.isArray(parsed.activeStacks) || !parsed.activeStacks.every((s) => typeof s === 'string')) {
      redPenExit(
        "El campo 'activeStacks' en 'harness.config.json' debe ser un arreglo de strings.",
        'activeStacks enumera opcionalmente los stacks activos detectados o fijados por el agente.',
        'Define "activeStacks": [] (o lista de strings como ["node", "python"]) en harness.config.json.'
      );
    }
  }

  if (parsed.layerMap !== undefined) {
    if (!isPlainObject(parsed.layerMap)) {
      redPenExit(
        "El bloque 'layerMap' en 'harness.config.json' debe ser un objeto JSON.",
        'layerMap mapea las 6 capas canónicas hacia nombres de carpetas del proyecto.',
        'Asegúrate de que "layerMap" sea un objeto con claves types, config, repo, service, runtime y ui.'
      );
    }
    for (const [k, v] of Object.entries(parsed.layerMap)) {
      const cleanKey = String(k || '').trim();
      const isCanonicalArray = CANONICAL_LAYERS.has(cleanKey.toLowerCase()) && isNonEmptyStringArray(v);
      const isReverseString = Boolean(cleanKey) && typeof v === 'string' && CANONICAL_LAYERS.has(v.trim().toLowerCase());
      if (!isCanonicalArray && !isReverseString) {
        redPenExit(
          `Entrada inválida 'layerMap.${k}' en 'harness.config.json'.`,
          'Cada entrada de layerMap debe usar el formato canónico { "<capa>": ["carpeta1", ...] } (types, config, repo, service, runtime, ui) o el mapeo directo { "<carpeta>": "<capa>" }.',
          `Corrige 'layerMap.${k}' en 'harness.config.json' usando las 6 capas canónicas y nombres de directorio no vacíos.`
        );
      }
    }
  }

  if (parsed.brownfield !== undefined) {
    if (!isPlainObject(parsed.brownfield)) {
      redPenExit(
        "El bloque 'brownfield' en 'harness.config.json' debe ser un objeto JSON.",
        'La configuración brownfield controla tolerancias graduales en repositorios heredados.',
        'Define "brownfield" como objeto JSON con enabled, allowUnmappedDirs, allowEmptyDirs y maxLegacyLayerViolations.'
      );
    }
    const ALLOWED_BF_KEYS = new Set(['enabled', 'allowUnmappedDirs', 'allowEmptyDirs', 'maxLegacyLayerViolations']);
    for (const k of Object.keys(parsed.brownfield)) {
      if (!ALLOWED_BF_KEYS.has(k)) {
        redPenExit(
          `Clave desconocida 'brownfield.${k}' en 'harness.config.json'.`,
          'El bloque brownfield solo admite enabled, allowUnmappedDirs, allowEmptyDirs y maxLegacyLayerViolations.',
          `Elimina o corrige 'brownfield.${k}' en 'harness.config.json'.`
        );
      }
    }
    for (const boolKey of ['enabled', 'allowUnmappedDirs', 'allowEmptyDirs']) {
      if (parsed.brownfield[boolKey] !== undefined && typeof parsed.brownfield[boolKey] !== 'boolean') {
        redPenExit(
          `El campo 'brownfield.${boolKey}' en 'harness.config.json' debe ser booleano.`,
          'Las banderas de modo brownfield deben ser true o false.',
          `Cambia 'brownfield.${boolKey}' a un valor booleano (true o false) en 'harness.config.json'.`
        );
      }
    }
    if (
      parsed.brownfield.maxLegacyLayerViolations !== undefined
      && (!Number.isInteger(parsed.brownfield.maxLegacyLayerViolations) || parsed.brownfield.maxLegacyLayerViolations < 0)
    ) {
      redPenExit(
        "El campo 'brownfield.maxLegacyLayerViolations' en 'harness.config.json' debe ser un entero >= 0.",
        'El umbral de violaciones heredadas representa un conteo exacto no negativo.',
        'Configura "maxLegacyLayerViolations" con un entero >= 0 (ej. 0) en harness.config.json.'
      );
    }
  }

  if (parsed.python !== undefined) {
    if (!isPlainObject(parsed.python)) {
      redPenExit(
        "El bloque 'python' en 'harness.config.json' debe ser un objeto JSON.",
        'El bloque python configura requireVenvForPip, packageRoots y enforceAstChecks.',
        'Define "python" como un objeto JSON válido en harness.config.json.'
      );
    }
    const ALLOWED_PY_KEYS = new Set(['requireVenvForPip', 'packageRoots', 'enforceAstChecks']);
    for (const k of Object.keys(parsed.python)) {
      if (!ALLOWED_PY_KEYS.has(k)) {
        redPenExit(
          `Clave desconocida 'python.${k}' en 'harness.config.json'.`,
          'El bloque python solo admite requireVenvForPip, packageRoots y enforceAstChecks.',
          `Elimina o corrige 'python.${k}' en 'harness.config.json'.`
        );
      }
    }
    for (const boolKey of ['requireVenvForPip', 'enforceAstChecks']) {
      if (parsed.python[boolKey] !== undefined && typeof parsed.python[boolKey] !== 'boolean') {
        redPenExit(
          `El campo 'python.${boolKey}' en 'harness.config.json' debe ser booleano.`,
          'Las opciones booleanas del inspector Python solo aceptan true o false.',
          `Corrige 'python.${boolKey}' a true o false en 'harness.config.json'.`
        );
      }
    }
    if (parsed.python.packageRoots !== undefined && !isNonEmptyStringArray(parsed.python.packageRoots)) {
      redPenExit(
        "El campo 'python.packageRoots' en 'harness.config.json' debe ser un arreglo de strings no vacíos.",
        'packageRoots indica las carpetas raíz de paquetes Python (ej. ["src", "app", "backend"]).',
        'Configura "packageRoots" como un arreglo de strings no vacíos en harness.config.json.'
      );
    }
  }

  if (parsed.nonDev !== undefined) {
    if (!isPlainObject(parsed.nonDev)) {
      redPenExit(
        "El bloque 'nonDev' en 'harness.config.json' debe ser un objeto JSON.",
        'El bloque nonDev gobierna las reglas de calidad documental y entregables no-código.',
        'Define "nonDev" como un objeto JSON válido en harness.config.json.'
      );
    }
    const ALLOWED_ND_KEYS = new Set(['deliverableDirs', 'forbidPlaceholders', 'checkMarkdownLinks', 'minDeliverableWords']);
    for (const k of Object.keys(parsed.nonDev)) {
      if (!ALLOWED_ND_KEYS.has(k)) {
        redPenExit(
          `Clave desconocida 'nonDev.${k}' en 'harness.config.json'.`,
          'El bloque nonDev solo admite deliverableDirs, forbidPlaceholders, checkMarkdownLinks y minDeliverableWords.',
          `Elimina o corrige 'nonDev.${k}' en 'harness.config.json'.`
        );
      }
    }
    if (parsed.nonDev.deliverableDirs !== undefined && !isNonEmptyStringArray(parsed.nonDev.deliverableDirs)) {
      redPenExit(
        "El campo 'nonDev.deliverableDirs' en 'harness.config.json' debe ser un arreglo de strings no vacíos.",
        'deliverableDirs define los directorios donde residen los entregables documentales.',
        'Configura "deliverableDirs" como un arreglo de strings no vacíos (ej. ["deliverables", "reports"]).'
      );
    }
    for (const boolKey of ['forbidPlaceholders', 'checkMarkdownLinks']) {
      if (parsed.nonDev[boolKey] !== undefined && typeof parsed.nonDev[boolKey] !== 'boolean') {
        redPenExit(
          `El campo 'nonDev.${boolKey}' en 'harness.config.json' debe ser booleano.`,
          'Las reglas de calidad documental esperan valores booleanos true o false.',
          `Actualiza 'nonDev.${boolKey}' a true o false en 'harness.config.json'.`
        );
      }
    }
    if (
      parsed.nonDev.minDeliverableWords !== undefined
      && (!Number.isInteger(parsed.nonDev.minDeliverableWords) || parsed.nonDev.minDeliverableWords < 0)
    ) {
      redPenExit(
        "El campo 'nonDev.minDeliverableWords' en 'harness.config.json' debe ser un entero >= 0.",
        'minDeliverableWords establece el mínimo de palabras reales exigido a entregables terminados en modo non-dev.',
        'Configura "minDeliverableWords" con un entero >= 0 (ej. 15) en harness.config.json.'
      );
    }
  }

  return {
    exists: true,
    mode: parsed.mode,
    nonDev: {
      deliverableDirs: parsed.nonDev?.deliverableDirs ?? DEFAULT_NON_DEV.deliverableDirs,
      forbidPlaceholders: parsed.nonDev?.forbidPlaceholders ?? DEFAULT_NON_DEV.forbidPlaceholders,
      checkMarkdownLinks: parsed.nonDev?.checkMarkdownLinks ?? DEFAULT_NON_DEV.checkMarkdownLinks,
      minDeliverableWords: parsed.nonDev?.minDeliverableWords ?? DEFAULT_NON_DEV.minDeliverableWords
    }
  };
}

function walkMarkdownFiles(dirPath, rootDir, out = []) {
  if (!fs.existsSync(dirPath)) return out;
  let stat = null;
  try {
    stat = fs.statSync(dirPath);
  } catch {
    return out;
  }
  if (!stat.isDirectory()) return out;

  for (const entry of fs.readdirSync(dirPath, { withFileTypes: true })) {
    if (entry.name === '.git' || entry.name === 'node_modules') continue;
    const full = path.join(dirPath, entry.name);
    if (entry.isDirectory()) {
      walkMarkdownFiles(full, rootDir, out);
    } else if (entry.isFile() && entry.name.toLowerCase().endsWith('.md')) {
      out.push(path.relative(rootDir, full).replace(/\\/g, '/'));
    }
  }
  return out;
}

function stripCodePreservingLines(content, ext) {
  if (ext === '.html') {
    return content
      .replace(/<(?:pre|code|script|style)\b[^>]*>[\s\S]*?<\/(?:pre|code|script|style)>/gi, (m) =>
        m.replace(/[^\n]/g, ' ')
      );
  }

  const lines = content.split('\n');
  let fenceChar = '';
  let fenceLen = 0;
  const cleanedLines = lines.map((line) => {
    const trimmed = line.trimStart();
    if (!fenceChar) {
      const m = trimmed.match(/^(`{3,}|~{3,})/);
      if (m) {
        fenceChar = m[1][0];
        fenceLen = m[1].length;
        return '';
      }
      // Strip inline code spans preserving rest of line
      return line.replace(/`+[^`]*`+/g, (span) => ' '.repeat(span.length));
    }
    const closeRe = new RegExp(`^\\${fenceChar}{${fenceLen},}\\s*$`);
    if (closeRe.test(trimmed)) {
      fenceChar = '';
      fenceLen = 0;
    }
    return '';
  });
  return cleanedLines.join('\n');
}

// Español-safe placeholder detector:
// NUNCA marca la palabra común española "todo" / "Todo" ("Todo funciona bien", "sobre todo", "TODO EL SISTEMA").
// Solo marca marcadores reales de trabajo incompleto:
// TODO:, [TODO], TODO(...), FIXME, TBD, [PENDIENTE], [POR COMPLETAR], [RELLENAR], [INSERTAR...], lorem ipsum.
const PLACEHOLDER_RULES = [
  { label: 'TODO:', re: /\bTODO\s*:/ },
  { label: '[TODO]', re: /\[\s*TODO(?:\b|[:\s\]])/ },
  { label: 'TODO(...)', re: /\bTODO\s*\(/ },
  { label: '<!-- TODO -->', re: /<!--\s*TODO\s*-->/ },
  { label: 'FIXME', re: /\bFIXME\b/ },
  { label: 'TBD', re: /\bTBD\b/ },
  { label: '[PENDIENTE / POR COMPLETAR / RELLENAR / INSERTAR]', re: /\[\s*(?:PENDIENTE|POR\s+COMPLETAR|RELLENAR|INSERTAR[^\]]*)\s*\]/i },
  { label: 'lorem ipsum', re: /\blorem\s+ipsum\b/i }
];

function checkPlaceholdersInFile(rootDir, relPath) {
  const fullPath = path.join(rootDir, relPath);
  if (!fs.existsSync(fullPath)) return;
  const ext = path.extname(relPath).toLowerCase();
  const raw = fs.readFileSync(fullPath, 'utf8');
  const stripped = stripCodePreservingLines(raw, ext);
  const lines = stripped.split('\n');

  for (let idx = 0; idx < lines.length; idx += 1) {
    const line = lines[idx];
    for (const rule of PLACEHOLDER_RULES) {
      const m = line.match(rule.re);
      if (m) {
        redPenExit(
          `Marcador incompleto '${m[0].trim()}' detectado en '${relPath}' (línea ${idx + 1}).`,
          'La Puerta 3 de calidad documental prohíbe entregar documentos con placeholders olvidados (TODO:, FIXME, TBD, [PENDIENTE], [POR COMPLETAR], [RELLENAR] o lorem ipsum).',
          `Reemplaza '${m[0].trim()}' en '${relPath}:${idx + 1}' por contenido definitivo verificado (o desactiva nonDev.forbidPlaceholders si es intencional).`
        );
      }
    }
  }
}

function normalizeLinkTarget(rawTarget) {
  let target = rawTarget.trim();
  if (!target) return null;
  if (target.startsWith('<')) {
    const closeIdx = target.indexOf('>');
    if (closeIdx > 0) {
      target = target.slice(1, closeIdx).trim();
    }
  } else {
    target = target.replace(/\s+(?:"[^"]*"|'[^']*'|\([^)]*\))\s*$/, '').trim();
  }

  if (!target || target.startsWith('#')) return null;
  if (/^(?:https?:|mailto:|tel:|data:|javascript:|conversation:|file:)/i.test(target)) return null;
  if (/^[a-zA-Z][a-zA-Z0-9+.-]*:/.test(target)) return null;

  const withoutHashOrQuery = target.split('#')[0].split('?')[0].trim();
  if (!withoutHashOrQuery) return null;

  try {
    return decodeURIComponent(withoutHashOrQuery);
  } catch {
    return withoutHashOrQuery;
  }
}

function checkMarkdownLinksInFile(rootDir, relPath) {
  const fullPath = path.join(rootDir, relPath);
  if (!fs.existsSync(fullPath) || path.extname(relPath).toLowerCase() !== '.md') return;
  const raw = fs.readFileSync(fullPath, 'utf8');
  const stripped = stripCodePreservingLines(raw, '.md');
  const lines = stripped.split('\n');
  const baseDir = path.dirname(fullPath);

  const inlineLinkRe = /!?\[[^\]]*\]\(([^)\n]+)\)/g;
  const refDefRe = /^[ ]{0,3}\[[^\]]+\]:\s*(\S+)/;

  for (let idx = 0; idx < lines.length; idx += 1) {
    const line = lines[idx];
    const candidates = [];

    for (const match of line.matchAll(inlineLinkRe)) {
      candidates.push(match[1]);
    }
    const refMatch = line.match(refDefRe);
    if (refMatch) {
      candidates.push(refMatch[1]);
    }

    for (const rawCand of candidates) {
      const cleanRel = normalizeLinkTarget(rawCand);
      if (!cleanRel) continue;
      const resolved = cleanRel.startsWith('/')
        ? path.join(rootDir, cleanRel.slice(1))
        : path.resolve(baseDir, cleanRel);

      if (!fs.existsSync(resolved)) {
        redPenExit(
          `Enlace local roto en '${relPath}' (línea ${idx + 1}): '${rawCand.trim()}' no existe en disco.`,
          'Todo enlace o imagen local en entregables Markdown debe apuntar a un archivo real existente en el proyecto.',
          `Corrige la ruta '${rawCand.trim()}' en '${relPath}:${idx + 1}' o crea el archivo destino '${path.relative(rootDir, resolved).replace(/\\/g, '/')}' antes de cerrar la tarea.`
        );
      }
    }
  }
}

function countRealWords(text, ext) {
  let cleaned = text.replace(/^---\r?\n[\s\S]*?\r?\n---\r?\n?/, ' ');
  if (ext === '.html') {
    cleaned = cleaned
      .replace(/<(?:script|style)\b[^>]*>[\s\S]*?<\/(?:script|style)>/gi, ' ')
      .replace(/<[^>]+>/g, ' ');
  }
  cleaned = cleaned.replace(/https?:\/\/\S+/g, ' ');
  const matches = cleaned.match(/[\p{L}\p{N}]+/gu);
  return matches ? matches.length : 0;
}

function loadDoneNonDevFiles(rootDir) {
  const flPath = path.join(rootDir, 'feature_list.json');
  if (!fs.existsSync(flPath)) return [];
  let parsed = null;
  try {
    parsed = JSON.parse(fs.readFileSync(flPath, 'utf8'));
  } catch {
    return [];
  }
  if (!Array.isArray(parsed?.features)) return [];

  const items = [];
  for (const feat of parsed.features) {
    if (!feat || feat.status !== 'done') continue;
    if (!Array.isArray(feat.required_files)) continue;
    for (const reqFile of feat.required_files) {
      if (typeof reqFile !== 'string' || !reqFile.trim()) continue;
      const norm = reqFile.trim().replace(/\\/g, '/');
      const ext = path.extname(norm).toLowerCase();
      if (DELIVERABLE_TEXT_EXTS.has(ext)) {
        items.push({ featureId: feat.id || 'unknown', relPath: norm, ext });
      }
    }
  }
  return items;
}

function main() {
  const { root, help } = parseCliArgs(process.argv.slice(2));
  if (help) {
    console.log('Usage: node scripts/check-deliverables.mjs [--root <dir>]');
    process.exit(0);
  }

  const cfg = validateAndLoadConfig(root);
  const { mode, nonDev } = cfg;

  const deliverableMdFiles = [];
  for (const dirRel of nonDev.deliverableDirs) {
    walkMarkdownFiles(path.join(root, dirRel), root, deliverableMdFiles);
  }

  const shouldInspectDeliverables = mode === 'non-dev' || deliverableMdFiles.length > 0;
  const inspectedSet = new Set();

  if (shouldInspectDeliverables) {
    for (const mdRel of deliverableMdFiles) {
      inspectedSet.add(mdRel);
    }

    const doneTaskFiles = mode === 'non-dev' ? loadDoneNonDevFiles(root) : [];
    for (const item of doneTaskFiles) {
      inspectedSet.add(item.relPath);
    }

    for (const relPath of [...inspectedSet].sort()) {
      if (nonDev.forbidPlaceholders !== false) {
        checkPlaceholdersInFile(root, relPath);
      }
      if (nonDev.checkMarkdownLinks !== false && path.extname(relPath).toLowerCase() === '.md') {
        checkMarkdownLinksInFile(root, relPath);
      }
    }

    if (mode === 'non-dev') {
      for (const item of doneTaskFiles) {
        const fullPath = path.join(root, item.relPath);
        if (!fs.existsSync(fullPath)) {
          redPenExit(
            `El entregable requerido '${item.relPath}' de la tarea terminada '${item.featureId}' no existe en disco.`,
            "En modo 'non-dev', toda tarea marcada como 'done' debe tener sus entregables físicos creados y verificados.",
            `Crea el archivo '${item.relPath}' con contenido completo o regresa '${item.featureId}' a estado 'in-progress'.`
          );
        }
        const wordCount = countRealWords(fs.readFileSync(fullPath, 'utf8'), item.ext);
        if (wordCount < nonDev.minDeliverableWords) {
          redPenExit(
            `Sustancia insuficiente en '${item.relPath}' (tarea '${item.featureId}'): contiene ${wordCount} palabra(s) reales (mínimo requerido: ${nonDev.minDeliverableWords}).`,
            "La Puerta 3 en modo 'non-dev' bloquea entregables vacíos o esquemáticos marcados prematuramente como 'done'.",
            `Desarrolla el contenido completo de '${item.relPath}' (>= ${nonDev.minDeliverableWords} palabras reales) antes de marcar '${item.featureId}' como 'done'.`
          );
        }
      }
    }
  }

  if (inspectedSet.size > 0) {
    console.log(`OK: Configuración Camaleón (modo: ${mode}) y calidad documental verificadas sobre ${inspectedSet.size} entregable(s).`);
  } else if (cfg.exists) {
    console.log(`OK: Configuración Camaleón válida (harness.config.json — modo: ${mode}).`);
  } else {
    console.log('OK: Verificador de entregables completado sin incidencias.');
  }
}

main();
