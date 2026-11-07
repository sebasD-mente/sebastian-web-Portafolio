#!/usr/bin/env node
import fs from 'node:fs';
import path from 'node:path';
import { validateHarnessConfig } from './lib/harness-utils.mjs';

const DELIVERABLE_TEXT_EXTS = new Set(['.md', '.txt', '.csv', '.html']);
const SCANNABLE_DELIVERABLE_EXTS = new Set(['.md', '.html', '.txt']);

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

function validateAndLoadConfig(rootDir) {
  const res = validateHarnessConfig(rootDir);
  if (!res.ok) {
    redPenExit(res.error, res.why, res.fix);
  }
  return {
    exists: res.config.exists,
    mode: res.config.mode,
    nonDev: res.config.nonDev
  };
}

function walkDeliverableFiles(dirPath, rootDir, out = []) {
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
      walkDeliverableFiles(full, rootDir, out);
    } else if (entry.isFile() && SCANNABLE_DELIVERABLE_EXTS.has(path.extname(entry.name).toLowerCase())) {
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
      const m = trimmed.match(/^(`{3,})(?!.*`)|^(~{3,})/);
      if (m) {
        const fence = m[1] || m[2];
        fenceChar = fence[0];
        fenceLen = fence.length;
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
// NUNCA marca la palabra común española "todo" / "Todo" ("Todo funciona bien", "sobre todo", "TODO EL EQUIPO").
// Solo marca marcadores reales de trabajo incompleto:
// TODO:, [TODO], TODO(...), FIXME (insensible a mayúsculas), TBD (insensible a mayúsculas),
// [PENDIENTE], [POR COMPLETAR], [RELLENAR], [INSERTAR...], lorem ipsum y comentarios HTML <!-- PENDIENTE / TODO / FIXME / TBD -->.
const PLACEHOLDER_RULES = [
  { label: 'TODO:', re: /\bTODO\s*:/ },
  { label: '[TODO]', re: /\[\s*TODO\s*(?:\]|:)/ },
  { label: 'TODO(...)', re: /\bTODO\s*\(/ },
  { label: 'FIXME', re: /\bFIXME\b/i },
  { label: 'TBD', re: /\bTBD\b/i },
  { label: '[PENDIENTE / POR COMPLETAR / RELLENAR / INSERTAR]', re: /\[\s*(?:PENDIENTE|POR\s+COMPLETAR|RELLENAR|INSERTAR[^\]]*)\s*\]/i },
  { label: 'lorem ipsum', re: /\blorem\s+ipsum\b/i }
];

const HTML_COMMENT_UPPER_TODO_RE = /\bTODO\b/;
const HTML_COMMENT_PLACEHOLDER_RE = /\b(?:FIXME|TBD|PENDIENTE|POR\s+COMPLETAR|RELLENAR|INSERTAR)\b/i;

function checkPlaceholdersInFile(rootDir, relPath) {
  const fullPath = path.join(rootDir, relPath);
  if (!fs.existsSync(fullPath)) return;
  const ext = path.extname(relPath).toLowerCase();
  const raw = fs.readFileSync(fullPath, 'utf8');
  const stripped = stripCodePreservingLines(raw, ext);

  for (const commentMatch of stripped.matchAll(/<!--([\s\S]*?)-->/g)) {
    const commentBody = commentMatch[1];
    const hit = commentBody.match(HTML_COMMENT_UPPER_TODO_RE) || commentBody.match(HTML_COMMENT_PLACEHOLDER_RE);
    if (hit) {
      const tokenOffset = commentMatch.index + 4 + (hit.index || 0);
      const lineNum = stripped.slice(0, tokenOffset).split('\n').length;
      redPenExit(
        `Marcador incompleto '${hit[0].trim()}' oculto en comentario HTML dentro de '${relPath}' (línea ${lineNum}).`,
        'La Puerta 3 de calidad documental prohíbe dejar placeholders pendientes incluso dentro de comentarios HTML <!-- ... -->.',
        `Resuelve y elimina el comentario con '${hit[0].trim()}' en '${relPath}:${lineNum}' antes de entregar el documento.`
      );
    }
  }

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
    const closeIdx = target.lastIndexOf('>');
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

function findClosingLinkParenAfterDest(line, startIdx) {
  let p = startIdx;
  while (p < line.length && (line[p] === ' ' || line[p] === '\t')) p += 1;
  if (p < line.length && line[p] === ')') return p;
  if (p >= line.length || p === startIdx) return -1;

  const q = line[p];
  if (q === '"' || q === "'") {
    p += 1;
    while (p < line.length && line[p] !== q) {
      if (line[p] === '\\') p += 2;
      else p += 1;
    }
    if (p >= line.length) return -1;
    p += 1;
  } else if (q === '(') {
    p += 1;
    while (p < line.length && line[p] !== ')') {
      if (line[p] === '\\') p += 2;
      else p += 1;
    }
    if (p >= line.length) return -1;
    p += 1;
  } else {
    return -1;
  }

  while (p < line.length && (line[p] === ' ' || line[p] === '\t')) p += 1;
  return p < line.length && line[p] === ')' ? p : -1;
}

function extractMarkdownLinkTargets(line) {
  const candidates = [];
  const refDefRe = /^[ ]{0,3}\[[^\]]+\]:\s*(<[^>\n]+>|\S+)/;
  const refMatch = line.match(refDefRe);
  if (refMatch) {
    candidates.push(refMatch[1]);
  }

  for (let i = 0; i < line.length; i += 1) {
    if (line[i] === '\\') {
      i += 1;
      continue;
    }
    if (line[i] !== '[') continue;

    let bracketDepth = 1;
    let j = i + 1;
    while (j < line.length && bracketDepth > 0) {
      if (line[j] === '\\') {
        j += 2;
        continue;
      }
      if (line[j] === '<' && /\]\(\s*$/.test(line.slice(i + 1, j))) {
        const closeAngle = line.indexOf('>', j + 1);
        if (closeAngle !== -1) {
          j = closeAngle + 1;
          continue;
        }
      }
      if (line[j] === '[') bracketDepth += 1;
      else if (line[j] === ']') bracketDepth -= 1;
      j += 1;
    }

    if (bracketDepth !== 0 || j >= line.length || line[j] !== '(') continue;

    let k = j + 1;
    while (k < line.length && (line[k] === ' ' || line[k] === '\t')) k += 1;
    if (k >= line.length) continue;

    if (line[k] === '<') {
      let m = k + 1;
      while (m < line.length && line[m] !== '>') {
        if (line[m] === '\\') m += 2;
        else m += 1;
      }
      if (m < line.length && line[m] === '>' && findClosingLinkParenAfterDest(line, m + 1) !== -1) {
        candidates.push(line.slice(k, m + 1));
      }
    } else {
      let parenDepth = 0;
      let m = k;
      while (m < line.length) {
        const ch = line[m];
        if (ch === '\\') {
          m += 2;
          continue;
        }
        if (ch === ' ' || ch === '\t') break;
        if (ch === '(') {
          parenDepth += 1;
          m += 1;
          continue;
        }
        if (ch === ')') {
          if (parenDepth === 0) break;
          parenDepth -= 1;
          m += 1;
          continue;
        }
        m += 1;
      }
      if (m > k && findClosingLinkParenAfterDest(line, m) !== -1) {
        candidates.push(line.slice(k, m));
      }
    }
  }

  return candidates;
}

function checkMarkdownLinksInFile(rootDir, relPath) {
  const fullPath = path.join(rootDir, relPath);
  if (!fs.existsSync(fullPath) || path.extname(relPath).toLowerCase() !== '.md') return;
  const raw = fs.readFileSync(fullPath, 'utf8');
  const stripped = stripCodePreservingLines(raw, '.md');
  const lines = stripped.split('\n');
  const baseDir = path.dirname(fullPath);

  for (let idx = 0; idx < lines.length; idx += 1) {
    const candidates = extractMarkdownLinkTargets(lines[idx]);
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
  let cleaned = String(text || '').replace(/\r\n?/g, '\n');
  // 1. Frontmatter YAML inicial
  cleaned = cleaned.replace(/^---\n[\s\S]*?\n---(?:\n|$)/, ' ');
  // 2. Bloques no-prosa HTML (<script>, <style>, <pre>, <code>)
  cleaned = cleaned.replace(/<(?:script|style|pre|code)\b[^>]*>[\s\S]*?<\/(?:script|style|pre|code)>/gi, ' ');
  // 3. Bloques de código cercados (``` y ~~~) y spans de código inline (`[^`]*`)
  cleaned = stripCodePreservingLines(cleaned, ext === '.html' ? '.html' : '.md');
  cleaned = cleaned.replace(/`[^`]*`/g, ' ');
  // 4. Comentarios HTML (<!-- ... -->)
  cleaned = cleaned.replace(/<!--[\s\S]*?-->/g, ' ');
  // 5. Destinos de enlaces/imágenes Markdown, referencias y URLs (https?://, mailto:)
  cleaned = cleaned
    .replace(/^[ ]{0,3}\[[^\]]+\]:\s*(?:<[^>\n]+>|\S+).*$/gm, ' ')
    .replace(/(\]\()(?:\s*<[^>\n]*>|\s*[^)\n]*)(\))/g, '$1$2')
    .replace(/https?:\/\/\S+/gi, ' ')
    .replace(/mailto:\S+/gi, ' ');
  // 6. Etiquetas HTML residuales (<[^>]+>) y separadores Markdown
  cleaned = cleaned
    .replace(/<[^>]+>/g, ' ')
    .replace(/^\s*(?:[-*_]\s*){3,}$/gm, ' ')
    .replace(/^\s*\|?(?:\s*:?-{2,}:?\s*\|)+\s*(?::?-{2,}:?\s*)?$/gm, ' ');

  const matches = cleaned.match(/[\p{L}\p{N}]+/gu);
  return matches ? matches.length : 0;
}

function loadTrackedNonDevFiles(rootDir) {
  const flPath = path.join(rootDir, 'feature_list.json');
  if (!fs.existsSync(flPath)) return { active: [], done: [] };
  let parsed = null;
  try {
    parsed = JSON.parse(fs.readFileSync(flPath, 'utf8'));
  } catch {
    return { active: [], done: [] };
  }
  if (!Array.isArray(parsed?.features)) return { active: [], done: [] };

  const active = [];
  const done = [];
  for (const feat of parsed.features) {
    if (!feat || (feat.status !== 'done' && feat.status !== 'in-progress')) continue;
    if (!Array.isArray(feat.required_files)) continue;
    for (const reqFile of feat.required_files) {
      if (typeof reqFile !== 'string' || !reqFile.trim()) continue;
      const norm = reqFile.trim().replace(/\\/g, '/');
      const ext = path.extname(norm).toLowerCase();
      if (DELIVERABLE_TEXT_EXTS.has(ext)) {
        const entry = { featureId: feat.id || 'unknown', relPath: norm, ext };
        if (feat.status === 'done') {
          done.push(entry);
        } else {
          active.push(entry);
        }
      }
    }
  }
  return { active, done };
}

function main() {
  const { root, help } = parseCliArgs(process.argv.slice(2));
  if (help) {
    console.log('Usage: node scripts/check-deliverables.mjs [--root <dir>]');
    process.exit(0);
  }

  const cfg = validateAndLoadConfig(root);
  const { mode, nonDev } = cfg;

  const deliverableFiles = [];
  for (const dirRel of nonDev.deliverableDirs) {
    walkDeliverableFiles(path.join(root, dirRel), root, deliverableFiles);
  }

  const shouldInspectDeliverables = mode === 'non-dev' || deliverableFiles.length > 0;
  const inspectedSet = new Set();

  if (shouldInspectDeliverables) {
    for (const docRel of deliverableFiles) {
      inspectedSet.add(docRel);
    }

    const tracked = mode === 'non-dev' ? loadTrackedNonDevFiles(root) : { active: [], done: [] };
    for (const item of tracked.active) {
      if (fs.existsSync(path.join(root, item.relPath))) {
        inspectedSet.add(item.relPath);
      }
    }
    for (const item of tracked.done) {
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
      for (const item of tracked.done) {
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
