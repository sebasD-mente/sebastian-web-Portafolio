import crypto from 'node:crypto';
import fs from 'node:fs';
import path from 'node:path';

export const SAFE_ENV_TEMPLATES = new Set(['.env.example', '.env.sample', '.env.template']);
const WRITE_EDIT_TOOLS = new Set([
  'write_file', 'edit_file', 'write', 'edit', 'multiedit', 'notebookedit',
  'create_file', 'replace_file_content', 'multi_replace_file_content',
  'write_to_file', 'str_replace_editor', 'str_replace_based_edit_tool', 'edit_notebook', 'apply_patch'
]);
// Claves de ruta reconocidas en argumentos de herramientas (IDE Antigravity, Claude Code, Codex, MCP).
const TARGET_PATH_KEYS = [
  'TargetFile', 'targetFile', 'target_file', 'AbsolutePath', 'absolutePath', 'file_path', 'filePath',
  'path', 'Path', 'notebook_path', 'notebookPath', 'File', 'file'
];
const PATCH_TEXT_KEYS = ['input', 'Input', 'patch', 'Patch', 'diff', 'Diff', 'command', 'Command', 'CommandLine'];
// Red de seguridad Fail-Closed: alias desconocidos con verbo mutante se tratan como escritura.
const GENERIC_MUTATING_TOOL_RE = /write|edit|replace|create|patch|save|move|copy|delete|remove|rename/i;
const COMMAND_TOOLS = new Set(['run_command', 'bash', 'execute_command', 'shell']);
const SEND_MESSAGE_TOOLS = new Set(['send_message', 'sendmessage']);
const WRAPPER_VERBS = new Set([
  'bash', 'sh', 'zsh', 'dash', 'ksh', 'cmd', 'pwsh', 'powershell',
  'eval', 'iex', 'invoke-expression', 'psql', 'mysql', 'sqlite3', 'sqlcmd'
]);
const PRINT_VERBS = new Set(['echo', 'printf', 'write-output', 'write-host']);
const MCP_MUTATING_TOOL_RE = /(?:write|edit|append|move|copy|create|delete|remove|patch|rename|replace)/i;
const MCP_EXEC_TOOL_RE = /(?:^|[_.-])(?:query\w*|exec\w*|run\w*|bash|shell|eval|sql\w*)(?:$|[_.-])/i;
const JSONC_PATH_RE = /(?:^|\/)(?:[jt]sconfig(?:\.[^/]+)?\.json|\.(?:vscode|devcontainer)\/.*\.json)$/i;
const EXPLICIT_CHECKER_ID_RE = /(?:^|[-_:])(checker|evaluator|evaluador|independent-checker)(?:$|[-_:\d])/i;
const CHECKER_ROLE_RE = /\b(?:checker|evaluator|evaluador(?:a)?|independent[-_\s]*checker|independent[-_\s]*auditor|auditor(?:a)?\s+independiente|inspector(?:a)?)\b/i;
const EXPLICIT_NON_CHECKER_ROLE_RE = /^(?:codebase\s+researcher|research(?:er)?|explorer|worker|maker|coder|flutter_a11y\w*|image-generator)$/i;

const MD_OPT = '[*_`"\']*';
export const CHECKER_PROMPT_RE = new RegExp(
  [
    `\\beres\\s+(?:(?:un|una|el|la)\\s+)?(?:${MD_OPT}(?:nuev[oa]|ef[ií]mer[oa]|aislad[oa])${MD_OPT}\\s+)*(?:${MD_OPT}(?:instancia|sesi[oó]n|sub-?agente|agente)${MD_OPT}\\s+(?:de\\s+|del\\s+)?)?(?:${MD_OPT}(?:sub-?agente|agente)${MD_OPT}\\s+)?${MD_OPT}(?:independent[-_\\s]+|one-?shot[-_\\s]+)*(?:checker|evaluador(?:a)?|evaluator|auditor(?:a)?\\s+independiente|inspector(?:a)?\\s+independiente)(?:\\s+independiente)?\\b`,
    `\\byou\\s+are\\s+(?:(?:an?|the)\\s+)?(?:${MD_OPT}(?:new|fresh|isolated|ephemeral|one-?shot)${MD_OPT}\\s+)*(?:${MD_OPT}(?:instance\\s+of(?:\\s+(?:an?|the))?|sub-?agent|agent)${MD_OPT}\\s+)?${MD_OPT}(?:independent[-_\\s]+|one-?shot[-_\\s]+)*(?:checker|evaluator|independent\\s+auditor|independent\\s+inspector)\\b`,
    `\\b(?:act[uú]a|actuar|act|acting)\\s+(?:como|as)\\s+(?:(?:un|una|el|la|an?|the)\\s+)?(?:${MD_OPT}(?:nuev[oa]|new|instancia\\s+de|sub-?agente|agente|sub-?agent|agent)${MD_OPT}\\s+)*${MD_OPT}(?:independent[-_\\s]+|one-?shot[-_\\s]+)*(?:checker|evaluador(?:a)?|evaluator|auditor(?:a)?\\s+independiente|inspector(?:a)?\\s+independiente|independent\\s+auditor|independent\\s+inspector)\\b`,
    `(?:^|\\n)\\s*(?:#+\\s*)?(?:\\*\\*)?(?:tu\\s+rol|rol|your\\s+role|role)(?:\\*\\*)?\\s*:\\s*${MD_OPT}(?:(?:el|la|un|una|the|an?)\\s+)?(?:(?:sub-?agente|agente|sub-?agent|agent)\\s+)?${MD_OPT}(?:independent[-_\\s]+|one-?shot[-_\\s]+)*(?:checker|evaluador(?:a)?|evaluator|auditor(?:a)?\\s+independiente|inspector(?:a)?\\s+independiente|independent\\s+auditor|independent\\s+inspector)\\b`,
    `(?:^|\\n)\\s*#\\s*checker\\s+agent\\s+prompt\\b`
  ].join('|'),
  'im'
);
const CHECKER_INITIAL_DOC_RE = /\b(?:siguiendo|sigue|seg[uú]n|bajo|conforme\s+a|ejecuta(?:ndo)?|lee(?:\s+y\s+ejecuta)?|aplicando|follow(?:ing)?|per|read(?:\s+and\s+execute)?|using)\s+[`'"]*checker-prompt\.md[`'"]*/i;
const CHECKER_ROLE_HINT_RE = /\b(?:checker|auditor(?:a)?|auditor[ií]a|evaluador(?:a)?|evaluator|inspector(?:a)?)\b/i;
const EXPLICIT_MAKER_IDENTITY_RE = /\beres\s+(?:(?:un|una|el|la)\s+)?[*_`"\']*(?:cirujano|maker|constructor|implementador|frontend|backend|developer|engineer|ingeniero|coordinador)\b|\byou\s+are\s+(?:(?:an?|the)\s+)?[*_`"\']*(?:maker|builder|developer|engineer|coordinator)\b/i;

const REAUDIT_MESSAGE_RE = /\b(?:re-?audit\w*|re-?evalu\w*|volver\s+a\s+auditar|volver\s+a\s+calificar|segunda\s+pasada|sigue\s+checker-prompt\.md)\b|\b(?:audita(?:r)?|califica(?:r)?|punt[uú]a(?:r)?|rellena(?:r)?|actualiza(?:r)?|eval[uú]a(?:r)?|revisa(?:r)?)\b[\s\S]{0,120}\bevaluator-rubric\.md\b/i;
const VENV_SEG_RE = /^(?:\.?venv[\w.-]*|[\w.-]*[-_.]venv[\w.-]*|virtualenv[\w.-]*|\.virtualenvs|env|envs|[\w.-]*[-_.]env|conda|miniconda\d*|anaconda\d*|mambaforge|miniforge\d*|\.conda|\.poetry|pypoetry|pipenv|pipx|\.tox|\.nox|\.hatch|__pypackages__)$/i;
const STRICT_LOCAL_VENV_SEG_RE = /^(?:\.?venv(?:[-_.][\w.-]*)?|[\w.-]*[-_.]venv)$/i;
const ACTIVATE_SCRIPT_RE = /[/\\](?:bin|Scripts)[/\\]activate(?:\.(?:ps1|bat|cmd|fish|csh|sh))?$/i;
const PIP_VALUE_OPTS_RE = /^--(?:log|local-log|proxy|retries|timeout|default-timeout|exists-action|trusted-host|cert|client-cert|cache-dir)$/i;
const SHELL_TOKEN_RE = /(?:[^\s"']+|'(?:\\.|[^'\\])*'|"(?:\\.|[^"\\])*")+/g;

export const redPenReason = (error, why, fix) => `ERROR: ${error}\nPOR QUÉ: ${why}\nSOLUCIÓN (FIX): ${fix}`;

export function isJsoncPath(rawPath) {
  if (typeof rawPath !== 'string' || !rawPath.trim()) return false;
  return JSONC_PATH_RE.test(rawPath.trim().replace(/\\/g, '/'));
}

export function redactSecrets(value, maxLen = 300) {
  const raw = typeof value === 'string' ? value : JSON.stringify(value ?? '');
  return raw
    .replace(/([a-zA-Z][a-zA-Z0-9+.-]*:\/\/[^:\s/"'\\]+:)([^@\s/"'\\]+)(@)/g, '$1[REDACTED]$3')
    .replace(/\b(Bearer\s+)[A-Za-z0-9._~+/=-]{8,}/gi, '$1[REDACTED]')
    .replace(/((?:api[_-]?key|[\w-]*token|[\w-]*secret|password|passwd|authorization|cookie)(?:\\?['"])?\s*[:=]\s*)(?:\\?['"])?(?:Bearer\s+)?[^\s'",;}\\]+(?:\\?['"])?/gi, '$1[REDACTED]')
    .replace(/\b(?:github_pat_[A-Za-z0-9_]+|gh[pousr]_[A-Za-z0-9_]+|AKIA[0-9A-Z]{16}|ASIA[0-9A-Z]{16}|sk_live_[A-Za-z0-9]+|sk_test_[A-Za-z0-9]+|rk_live_[A-Za-z0-9]+|sk-[A-Za-z0-9_-]{16,}|AIza[0-9A-Za-z_-]{20,}|xox[baprs]-[A-Za-z0-9-]+|npm_[A-Za-z0-9]{16,})\b/g, '[REDACTED]')
    .slice(0, maxLen);
}

export function resolveBashConfig(env = process.env, platform = process.platform) {
  if (platform === 'win32') {
    const cands = [
      env.GIT_BASH_PATH,
      'C:\\Program Files\\Git\\bin\\bash.exe',
      'C:\\Program Files (x86)\\Git\\bin\\bash.exe',
      env.LOCALAPPDATA ? path.join(env.LOCALAPPDATA, 'Programs', 'Git', 'bin', 'bash.exe') : ''
    ].filter(Boolean);
    const hit = cands.find((c) => fs.existsSync(c));
    if (hit) {
      const gitRoot = path.resolve(path.dirname(hit), '..');
      return {
        bashBin: hit,
        extraPathDirs: [path.join(gitRoot, 'bin'), path.join(gitRoot, 'usr', 'bin')].filter((d) => fs.existsSync(d))
      };
    }
  }
  return { bashBin: 'bash', extraPathDirs: [] };
}

export function appendAuditLog(targetRoot, action, startMs, inputSummary, outputObj, errorMsg = null, payload = {}) {
  try {
    const logDir = path.join(targetRoot, '.agents', '.runtime');
    fs.mkdirSync(logDir, { recursive: true });
    const entry = {
      timestamp: new Date().toISOString(),
      level: errorMsg ? 'error' : 'info',
      component: 'HarnessHooks',
      action,
      durationMs: Math.max(0, Date.now() - startMs),
      input: redactSecrets(inputSummary, 300),
      output: outputObj ?? null,
      error: errorMsg ? { message: redactSecrets(errorMsg, 1000) } : null,
      correlationId: String(payload?.conversationId || `hook-${crypto.randomUUID().slice(0, 8)}`)
    };
    fs.appendFileSync(path.join(logDir, 'hook-audit.jsonl'), `${JSON.stringify(entry)}\n`, 'utf8');
  } catch { /* never fail hook on telemetry I/O */ }
}

function collectMcpPaths(obj, out = []) {
  if (!obj || typeof obj !== 'object') return out;
  const pathKeys = [...TARGET_PATH_KEYS, 'source', 'destination', 'target'];
  for (const k of pathKeys) {
    if (typeof obj[k] === 'string' && obj[k].trim()) out.push(obj[k].trim());
  }
  if (Array.isArray(obj.paths)) {
    for (const p of obj.paths) if (typeof p === 'string' && p.trim()) out.push(p.trim());
  }
  if (Array.isArray(obj.files)) {
    for (const f of obj.files) {
      if (typeof f === 'string' && f.trim()) out.push(f.trim());
      else if (f && typeof f === 'object') collectMcpPaths(f, out);
    }
  }
  return out;
}

// Extrae rutas de parches estilo apply_patch (*** Update/Add/Delete File, *** Move to) y unified diff (--- a/, +++ b/).
export function extractPatchPaths(patchText) {
  const text = String(patchText || '');
  if (!text.trim()) return [];
  const out = [];
  const isEnvelope = /\*\*\* Begin Patch/.test(text);
  for (const rawLine of text.split(/\r?\n/)) {
    const line = rawLine.trimEnd();
    let m = line.match(/^\*\*\*\s*(?:Update|Add|Delete)\s+File:\s*(.+)$/i) || line.match(/^\*\*\*\s*Move\s+to:\s*(.+)$/i);
    if (!m && !isEnvelope) m = line.match(/^(?:---|\+\+\+)\s+(?:[ab]\/)?(.+)$/);
    if (!m) continue;
    const p = m[1].split('\t')[0].trim();
    if (p && p !== '/dev/null') out.push(p);
  }
  return out;
}

function collectPatchTexts(args, rawArgString) {
  const texts = [];
  if (rawArgString) texts.push(rawArgString);
  for (const k of PATCH_TEXT_KEYS) {
    const v = args[k];
    if (typeof v === 'string') texts.push(v);
    else if (Array.isArray(v)) texts.push(v.filter((x) => typeof x === 'string').join('\n'));
  }
  return texts;
}

export function extractToolContext(payload = {}, stdinEmpty = false, env = process.env) {
  const tc = payload?.toolCall || payload?.preToolHookArgs?.toolCall || payload?.toolHookArgs?.toolCall || null;
  const toolName = String(tc?.name ?? payload?.toolName ?? payload?.tool_name ?? '').trim();
  const lowerName = toolName.toLowerCase();
  let args = tc?.args ?? tc?.arguments ?? payload?.toolArgs ?? payload?.tool_input ?? payload?.input ?? {};
  let rawArgString = '';
  if (typeof args === 'string') { try { args = JSON.parse(args); } catch { rawArgString = args; args = {}; } }
  if (!args || typeof args !== 'object') args = {};

  const rawTargets = TARGET_PATH_KEYS
    .map((k) => (typeof args[k] === 'string' ? args[k].trim() : ''))
    .filter(Boolean);
  if (Array.isArray(args.edits)) {
    for (const ed of args.edits) {
      if (ed && typeof ed === 'object') collectMcpPaths(ed, rawTargets);
    }
  }
  const cmdKey = ['CommandLine', 'command', 'cmd', 'Command'].find((k) => typeof args[k] === 'string' && args[k].trim());
  let commandLine = cmdKey ? args[cmdKey] : '';
  let isWriteEdit = WRITE_EDIT_TOOLS.has(lowerName);
  let isCommand = COMMAND_TOOLS.has(lowerName);
  const isMcpTool = lowerName === 'call_mcp_tool' || lowerName.startsWith('mcp_');

  if (isMcpTool) {
    const mcpTool = String(args.ToolName ?? args.toolName ?? lowerName).trim();
    let mcpArgs = args.Arguments ?? args.arguments ?? args;
    if (typeof mcpArgs === 'string') { try { mcpArgs = JSON.parse(mcpArgs); } catch { mcpArgs = {}; } }
    if (MCP_MUTATING_TOOL_RE.test(mcpTool)) {
      isWriteEdit = true;
      collectMcpPaths(mcpArgs, rawTargets);
    }
    if (MCP_EXEC_TOOL_RE.test(mcpTool) && mcpArgs && typeof mcpArgs === 'object') {
      const execVal = ['sql', 'Sql', 'SQL', 'query', 'Query', 'statement', 'Statement', 'command', 'CommandLine', 'Command', 'code', 'Code', 'cmd', 'script']
        .map((k) => (typeof mcpArgs[k] === 'string' ? mcpArgs[k].trim() : ''))
        .find(Boolean);
      if (execVal) {
        isCommand = true;
        commandLine = execVal;
      }
    }
  }

  const isSendMessage = SEND_MESSAGE_TOOLS.has(lowerName);
  if (lowerName && !isWriteEdit && !isCommand && !isSendMessage && !isMcpTool && GENERIC_MUTATING_TOOL_RE.test(lowerName)) {
    isWriteEdit = true;
    collectMcpPaths(args, rawTargets);
  }
  if (isWriteEdit && !isMcpTool && lowerName.includes('patch')) {
    for (const txt of collectPatchTexts(args, rawArgString)) rawTargets.push(...extractPatchPaths(txt));
  }

  const recipient = String(args.Recipient ?? args.recipient ?? args.to ?? args.conversationId ?? '').trim();
  const message = String(args.Message ?? args.message ?? args.content ?? '').trim();
  let usedEnvFallback = false;

  if ((stdinEmpty || !toolName) && typeof env.TOOL_TARGET_PATH === 'string' && env.TOOL_TARGET_PATH.trim()) {
    isWriteEdit = true;
    usedEnvFallback = true;
    rawTargets.push(env.TOOL_TARGET_PATH.trim());
  }
  if ((stdinEmpty || !toolName) && typeof env.TOOL_COMMAND === 'string' && env.TOOL_COMMAND.trim()) {
    isCommand = true;
    usedEnvFallback = true;
    if (!commandLine) commandLine = env.TOOL_COMMAND;
  }

  const targetPaths = Array.from(new Set(rawTargets.filter(Boolean)));
  return { toolName, lowerName, args, isWriteEdit, isCommand, isSendMessage, targetPaths, commandLine, recipient, message, usedEnvFallback };
}

export function isProtectedTargetPath(rawPath) {
  if (typeof rawPath !== 'string' || !rawPath.trim()) return { blocked: false, reason: null };
  const unquoted = unquoteToken(rawPath.trim());
  if (!unquoted) return { blocked: false, reason: null };
  const normalized = unquoted.replace(/\\/g, '/');
  const lowerFull = normalized.toLowerCase();

  if (
    /^\/(?:etc|usr|bin|sbin|boot)(?:\/|$)/.test(lowerFull)
    || /^[a-z]:\/(?:windows|system32)(?:\/|$)/.test(lowerFull)
    || /^(?:\$env:(?:windir|systemroot)|%(?:windir|systemroot)%)(?:\/|$)/.test(lowerFull)
    || /(?:^|\/|~\/)\.ssh(?:\/|$)/.test(lowerFull)
  ) {
    return { blocked: true, category: 'ruta crítica del sistema (/etc, /usr, C:/Windows, ~/.ssh)', target: rawPath };
  }

  const segments = normalized.split('/').filter((s) => s && s !== '.');
  for (let i = 0; i < segments.length; i += 1) {
    const lower = segments[i].toLowerCase();
    if (lower === '.git') return { blocked: true, category: '.git/**', target: rawPath };
    if (lower === 'node_modules') return { blocked: true, category: 'node_modules/**', target: rawPath };
    if ((lower === '.env' || lower.startsWith('.env')) && !(i === segments.length - 1 && SAFE_ENV_TEMPLATES.has(lower))) {
      return { blocked: true, category: '.env* (secretos)', target: rawPath };
    }
  }
  return { blocked: false, reason: null };
}

export function isRubricTarget(rawPath) {
  if (typeof rawPath !== 'string' || !rawPath.trim()) return false;
  const clean = unquoteToken(rawPath.trim()).replace(/\\/g, '/').replace(/\/+$/, '');
  const base = clean.split('/').pop()?.toLowerCase() || '';
  return base === 'evaluator-rubric.md';
}

function unescapeQuotes(str) {
  return String(str || '').replace(/\\(["'`\\])/g, '$1').replace(/`(["'])/g, '$1');
}

function unquoteToken(tok) {
  const s = String(tok || '').trim();
  if (!s) return '';
  if ((s.startsWith('"') && s.endsWith('"') && s.length >= 2) || (s.startsWith("'") && s.endsWith("'") && s.length >= 2) || (s.startsWith('`') && s.endsWith('`') && s.length >= 2)) {
    return unescapeQuotes(s.slice(1, -1)).trim();
  }
  let out = '', q = '';
  for (let i = 0; i < s.length; i += 1) {
    const ch = s[i];
    if (q === "'") { if (ch === "'") q = ''; else out += ch; continue; }
    if (q === '"') {
      if (ch === '\\' && i + 1 < s.length) { out += s[++i]; continue; }
      if (ch === '"') { q = ''; continue; }
      out += ch;
      continue;
    }
    if (ch === "'" || ch === '"') { q = ch; continue; }
    out += ch;
  }
  return out.trim();
}

function splitTopClauses(cmd) {
  const out = [];
  let cur = '', quote = '', depth = 0;
  for (let i = 0; i < cmd.length; i += 1) {
    const ch = cmd[i];
    if (quote === "'") { cur += ch; if (ch === "'") quote = ''; continue; }
    if (ch === '\\' && i + 1 < cmd.length) { cur += ch + cmd[++i]; continue; }
    if (quote === '"') { cur += ch; if (ch === '"') quote = ''; continue; }
    if (ch === "'" || ch === '"') { quote = ch; cur += ch; continue; }
    if (ch === '(') { depth += 1; cur += ch; continue; }
    if (ch === ')' && depth > 0) { depth -= 1; cur += ch; continue; }
    const fdRedir = ch === '&' && (cmd[i - 1] === '>' || cmd[i - 1] === '<' || cmd[i + 1] === '>');
    if (depth === 0 && !fdRedir && (ch === ';' || ch === '\n' || ch === '&' || ch === '|')) {
      let sep = ch;
      if ((ch === '&' || ch === '|') && cmd[i + 1] === ch) sep += cmd[++i];
      if (cur.trim()) out.push({ text: cur.trim(), sep });
      cur = '';
      continue;
    }
    cur += ch;
  }
  if (cur.trim()) out.push({ text: cur.trim(), sep: '' });
  return out;
}

function unwrapOuterParens(s) {
  if (!s.startsWith('(') || !s.endsWith(')')) return null;
  let quote = '', depth = 0;
  for (let i = 0; i < s.length; i += 1) {
    const ch = s[i];
    if (quote === "'") { if (ch === "'") quote = ''; continue; }
    if (ch === '\\' && i + 1 < s.length) { i += 1; continue; }
    if (quote === '"') { if (ch === '"') quote = ''; continue; }
    if (ch === "'" || ch === '"') { quote = ch; continue; }
    if (ch === '(') depth += 1;
    else if (ch === ')' && --depth === 0) return i === s.length - 1 ? s.slice(1, -1).trim() : null;
  }
  return null;
}

function baseNameOfVerb(rawVerb) {
  return unquoteToken(rawVerb).replace(/\\/g, '/').split('/').pop().toLowerCase().replace(/\.(?:exe|cmd|bat)$/i, '');
}

function extractVerbName(text) {
  const m = text.match(/^(?:'([^']+)'|"((?:\\.|[^"\\])+)"|([^\s"']+))/);
  return baseNameOfVerb(m ? (m[1] ?? m[2] ?? m[3] ?? '') : '');
}

function parseWrappersAndEnv(seg, initialVenv = false, initialUvSystem = false) {
  const rawTokens = seg.replace(/^\{\s+/, '').replace(/\s*\}\s*$/, '').match(SHELL_TOKEN_RE) || [];
  let idx = 0, clauseVenv = initialVenv, clauseUvSystem = initialUvSystem, lookupOnly = false;
  while (idx < rawTokens.length) {
    const raw = unquoteToken(rawTokens[idx]);
    const base = baseNameOfVerb(raw);
    if (raw === '&' || raw === '--') { idx += 1; continue; }
    if (/^[A-Za-z_]\w*=/.test(raw)) {
      const eqPos = raw.indexOf('=');
      const k = raw.slice(0, eqPos);
      const cleanVal = unquoteToken(raw.slice(eqPos + 1));
      if (k === 'VIRTUAL_ENV') clauseVenv = Boolean(cleanVal);
      if (k === 'UV_SYSTEM_PYTHON') clauseUvSystem = /^(?:1|true)$/i.test(cleanVal);
      idx += 1;
      continue;
    }
    if (base === 'sudo') {
      clauseVenv = false;
      idx += 1;
      while (idx < rawTokens.length) {
        const f = unquoteToken(rawTokens[idx]);
        if (f === '--') { idx += 1; break; }
        if (f === '-u' || f === '--user' || f === '-g' || f === '--group') { idx += 2; continue; }
        if (f.startsWith('-')) { idx += 1; continue; }
        break;
      }
      continue;
    }
    if (base === 'env') {
      idx += 1;
      while (idx < rawTokens.length) {
        const ef = unquoteToken(rawTokens[idx]);
        if (ef === '--') { idx += 1; break; }
        if (ef === '-' || ef === '-i' || ef === '--ignore-environment') { clauseVenv = false; idx += 1; continue; }
        if (ef === '-u' || ef === '--unset') {
          if (unquoteToken(rawTokens[idx + 1] || '') === 'VIRTUAL_ENV') clauseVenv = false;
          idx += 2;
          continue;
        }
        if (ef.startsWith('--unset=')) {
          if (ef.slice(8) === 'VIRTUAL_ENV') clauseVenv = false;
          idx += 1;
          continue;
        }
        if (ef === '-C' || ef === '--chdir') { idx += 2; continue; }
        if (ef.startsWith('--chdir=')) { idx += 1; continue; }
        if (ef === '-S' || ef === '--split-string' || ef.startsWith('--split-string=') || (ef.startsWith('-S') && ef.length > 2)) {
          let splitCmd = '';
          if (ef === '-S' || ef === '--split-string') {
            splitCmd = unquoteToken(rawTokens[idx + 1] || '');
            idx += 2;
          } else if (ef.startsWith('--split-string=')) {
            splitCmd = unquoteToken(ef.slice(15));
            idx += 1;
          } else {
            splitCmd = unquoteToken(ef.slice(2));
            idx += 1;
          }
          const trailing = rawTokens.slice(idx).join(' ');
          const combined = [splitCmd, trailing].filter(Boolean).join(' ').trim();
          return { stripped: combined, rawTokens: combined.match(SHELL_TOKEN_RE) || [], idx: 0, clauseVenv, clauseUvSystem, lookupOnly: false, splitExpanded: combined };
        }
        if (ef.startsWith('-') && !ef.includes('=')) { idx += 1; continue; }
        break;
      }
      continue;
    }
    if (base === 'command') {
      idx += 1;
      while (idx < rawTokens.length) {
        const cf = unquoteToken(rawTokens[idx]);
        if (cf === '--') { idx += 1; break; }
        if (/^-[p]*[vV]/.test(cf)) { lookupOnly = true; idx += 1; continue; }
        if (cf.startsWith('-')) { idx += 1; continue; }
        break;
      }
      continue;
    }
    if (base === 'nohup') {
      idx += 1;
      if (unquoteToken(rawTokens[idx] || '') === '--') idx += 1;
      continue;
    }
    if (base === 'nice') {
      idx += 1;
      while (idx < rawTokens.length) {
        const nf = unquoteToken(rawTokens[idx]);
        if (nf === '--') { idx += 1; break; }
        if (nf === '-n' || nf === '--adjustment') { idx += 2; continue; }
        if (/^-(?:\d+|\+\d+|-\d+)$/.test(nf) || nf.startsWith('--adjustment=')) { idx += 1; continue; }
        break;
      }
      continue;
    }
    break;
  }
  return { stripped: rawTokens.slice(idx).join(' '), rawTokens, idx, clauseVenv, clauseUvSystem, lookupOnly, splitExpanded: null };
}

function stripLeadingWrappers(seg) {
  return parseWrappersAndEnv(seg).stripped;
}

function maskQuotesPreservingRedirs(s) {
  let out = '', i = 0, expectRedirTarget = false;
  while (i < s.length) {
    const ch = s[i];
    if (/\s/.test(ch)) { out += ch; i += 1; continue; }
    if (ch === "'" || ch === '"') {
      let end = i + 1;
      while (end < s.length) {
        if (ch === '"' && s[end] === '\\' && end + 1 < s.length) { end += 2; continue; }
        if (s[end] === ch) { end += 1; break; }
        end += 1;
      }
      const lit = s.slice(i, end);
      out += expectRedirTarget ? lit : '""';
      expectRedirTarget = false;
      i = end;
      continue;
    }
    const redirMatch = s.slice(i).match(/^(?:(?:\d+|&)?(?:>>|>\|?)(?!&))/);
    if (redirMatch && (i === 0 || !/[-=]/.test(s[i - 1]))) {
      out += redirMatch[0];
      expectRedirTarget = true;
      i += redirMatch[0].length;
      continue;
    }
    let end = i;
    while (end < s.length && !/\s/.test(s[end]) && s[end] !== "'" && s[end] !== '"') {
      if (s[end] === '>' && (end === 0 || !/[-=]/.test(s[end - 1]))) break;
      end += 1;
    }
    const word = s.slice(i, end);
    if (/^\d+$/.test(word) && s[end] === '>') {
      out += word;
      i = end;
      continue;
    }
    out += word;
    if (word && s[end] !== "'" && s[end] !== '"') expectRedirTarget = false;
    i = end;
  }
  return out;
}

export function collectActiveClauses(raw, depth = 0) {
  if (typeof raw !== 'string' || !raw.trim() || depth > 6) return [];
  const clauses = [];
  for (const m of raw.replace(/'[^']*'/g, "''").matchAll(/\$\(([^)]+)\)|`([^`]+)`/g)) {
    clauses.push(...collectActiveClauses(m[1] || m[2], depth + 1));
  }
  const parts = splitTopClauses(raw);
  for (let idx = 0; idx < parts.length; idx += 1) {
    const seg = parts[idx].text.trim();
    const inner = unwrapOuterParens(seg);
    if (inner !== null) { clauses.push(...collectActiveClauses(inner, depth + 1)); continue; }
    if (parts[idx].sep === '|' && /^(?:'[^']*'|"(?:\\.|[^"\\])*")$/.test(seg) && parts[idx + 1]) {
      const nextVerb = extractVerbName(parts[idx + 1].text.trim());
      if (WRAPPER_VERBS.has(nextVerb)) clauses.push(...collectActiveClauses(unquoteToken(seg), depth + 1));
      continue;
    }
    const parsed = parseWrappersAndEnv(seg);
    if (parsed.lookupOnly) continue;
    if (parsed.splitExpanded !== null) {
      clauses.push(...collectActiveClauses(parsed.splitExpanded, depth + 1));
      continue;
    }
    const stripped = parsed.stripped;
    if (!stripped) continue;
    const verb = extractVerbName(stripped);
    if (PRINT_VERBS.has(verb)) {
      clauses.push(maskQuotesPreservingRedirs(stripped));
    } else if (verb === 'git' && /\bcommit\b/i.test(stripped)) {
      clauses.push(stripped.replace(/(-[a-zA-Z]*m|--message(?:=|\s+))\s*(?:'[^']*'|"(?:\\.|[^"\\])*")/g, '$1 ""'));
    } else if (WRAPPER_VERBS.has(verb)) {
      const outerMasked = maskQuotesPreservingRedirs(stripped);
      if (/(?:^|\s)(?:\d+|&)?>>?/.test(outerMasked)) clauses.push(outerMasked);
      for (const qm of stripped.matchAll(/'((?:\\.|[^'\\])*)'|"((?:\\.|[^"\\])*)"/g)) {
        const qBody = qm[1] !== undefined ? qm[1] : unescapeQuotes(qm[2]);
        clauses.push(...collectActiveClauses(qBody, depth + 1));
      }
      const tail = stripped.replace(/^(?:'[^']+'|"[^"]+"|\S+)\s+(?:(?:-\w+|\/[ckq]|--(?:command|execute))\s+)*/i, '');
      if (tail && tail !== stripped && !/^['"]/.test(tail)) clauses.push(...collectActiveClauses(tail, depth + 1));
    } else {
      clauses.push(stripped);
    }
  }
  return clauses;
}

function extractNestedStringLiterals(text, depth = 0, out = []) {
  if (typeof text !== 'string' || !text || depth > 2) return out;
  const litRe = /"((?:\\.|`"|[^"\\])*)"|'((?:\\.|[^'\\])*)'|`((?:\\.|[^`\\])*)`/g;
  for (const m of text.matchAll(litRe)) {
    const rawInner = m[1] ?? m[2] ?? m[3] ?? '';
    const unescaped = unescapeQuotes(rawInner);
    if (unescaped) {
      out.push(unescaped);
      if (/["'`]/.test(unescaped)) {
        extractNestedStringLiterals(unescaped, depth + 1, out);
      }
    }
  }
  return out;
}

function splitTopLevelCallArgs(argsText) {
  const args = [];
  let cur = '', q = '', depth = 0;
  for (let i = 0; i < argsText.length; i += 1) {
    const ch = argsText[i];
    if (q === "'") { cur += ch; if (ch === "'") q = ''; continue; }
    if (q === '"') {
      cur += ch;
      if (ch === '\\' && i + 1 < argsText.length) { cur += argsText[++i]; continue; }
      if (ch === '"') q = '';
      continue;
    }
    if (ch === "'" || ch === '"') { q = ch; cur += ch; continue; }
    if (ch === '(' || ch === '[' || ch === '{') { depth += 1; cur += ch; continue; }
    if ((ch === ')' || ch === ']' || ch === '}') && depth > 0) { depth -= 1; cur += ch; continue; }
    if (ch === ',' && depth === 0) { args.push(cur.trim()); cur = ''; continue; }
    cur += ch;
  }
  if (cur.trim()) args.push(cur.trim());
  return args;
}

export function extractShellWriteTargets(clause) {
  const targets = [];
  if (typeof clause !== 'string' || !clause.trim()) return targets;

  // 1. Quote-aware shell redirection targets (>, >>, 1>, 2>, &>, >|)
  let i = 0, q = '';
  while (i < clause.length) {
    const ch = clause[i];
    if (q === "'") { if (ch === "'") q = ''; i += 1; continue; }
    if (q === '"') {
      if (ch === '\\' && i + 1 < clause.length) { i += 2; continue; }
      if (ch === '"') q = '';
      i += 1;
      continue;
    }
    if (ch === "'" || ch === '"') { q = ch; i += 1; continue; }
    const rm = clause.slice(i).match(/^(?:(\d+|&))?(>>|>\|?)(?!&)/);
    if (rm && (!rm[1] || i === 0 || /[\s;|&(]/.test(clause[i - 1])) && (i === 0 || !/[-=]/.test(clause[i - 1]))) {
      i += rm[0].length;
      while (i < clause.length && /\s/.test(clause[i])) i += 1;
      let tok = '', tq = '';
      while (i < clause.length) {
        const tc = clause[i];
        if (tq === "'") { tok += tc; if (tc === "'") tq = ''; i += 1; continue; }
        if (tq === '"') {
          tok += tc;
          if (tc === '\\' && i + 1 < clause.length) { tok += clause[++i]; i += 1; continue; }
          if (tc === '"') tq = '';
          i += 1;
          continue;
        }
        if (tc === "'" || tc === '"') { tq = tc; tok += tc; i += 1; continue; }
        if (/[\s|;&<>()]/.test(tc)) break;
        tok += tc;
        i += 1;
      }
      const clean = unquoteToken(tok);
      if (clean && !/^&\d+$/.test(clean)) targets.push(clean);
      continue;
    }
    i += 1;
  }

  const rawTokens = clause.match(SHELL_TOKEN_RE) || [];
  const tokens = rawTokens.map(unquoteToken);
  const verb = baseNameOfVerb(tokens[0] || '');

  // 2. tee / Tee-Object
  if (verb === 'tee' || verb === 'tee-object') {
    for (let k = 1; k < tokens.length; k += 1) {
      const t = tokens[k];
      if (/^-(?:FilePath|LiteralPath|Path)(?::(.*))?$/i.test(t)) {
        const m = t.match(/^-[^:]+:(.*)$/);
        targets.push(m ? m[1] : (tokens[++k] || ''));
      } else if (/^-(?:Variable|Encoding)$/i.test(t)) {
        k += 1;
      } else if (!t.startsWith('-')) {
        targets.push(t);
      }
    }
  }

  // 3. PowerShell Set-Content / Add-Content / Out-File / New-Item
  if (/^(?:set-content|add-content|out-file|new-item|sc|ac|ni)$/i.test(verb)) {
    let foundNamedPath = false;
    const positional = [];
    for (let k = 1; k < tokens.length; k += 1) {
      const t = tokens[k];
      const namedPath = t.match(/^-(?:Path|LiteralPath|FilePath|LP|PSPath)(?::(.*))?$/i);
      if (namedPath) {
        foundNamedPath = true;
        targets.push(namedPath[1] !== undefined ? namedPath[1] : (tokens[++k] || ''));
      } else if (/^-(?:Value|Encoding|Filter|Include|Exclude|ItemType|Type|Credential|Delimiter|Stream)$/i.test(t)) {
        k += 1;
      } else if (!t.startsWith('-')) {
        positional.push(t);
      }
    }
    if (!foundNamedPath && positional[0]) targets.push(positional[0]);
  }

  // 4. Copy-Item / Move-Item / cp / mv / cpi / mi / copy / move
  if (/^(?:cp|mv|copy-item|move-item|cpi|mi|copy|move|install)$/i.test(verb)) {
    const positional = [];
    for (let k = 1; k < tokens.length; k += 1) {
      const t = tokens[k];
      const destFlag = t.match(/^(?:-(?:Destination|Dest)(?::(.*))?|(?:-t|--target-directory)(?:=(.*))?)$/i);
      if (destFlag) {
        const inlineVal = destFlag[1] ?? destFlag[2];
        targets.push(inlineVal !== undefined ? inlineVal : (tokens[++k] || ''));
      } else if (/^-(?:Path|LiteralPath|LP|Filter|Include|Exclude|Credential)$/i.test(t)) {
        k += 1;
      } else if (!t.startsWith('-') && !(verb === 'copy' && /^\/[a-z]/i.test(t))) {
        positional.push(t);
      }
    }
    if (positional.length > 0) targets.push(positional[positional.length - 1]);
  }

  // 5. sed -i / perl -i / dd of=...
  if ((verb === 'sed' || verb === 'perl') && tokens.slice(1).some((t) => /^-(?:[A-Za-z]*i|--in-place)/i.test(t))) {
    const nonFlags = tokens.slice(1).filter((t) => !t.startsWith('-'));
    if (nonFlags.length > 0) targets.push(nonFlags[nonFlags.length - 1]);
  }
  if (verb === 'dd') {
    for (const t of tokens.slice(1)) {
      if (t.toLowerCase().startsWith('of=')) targets.push(unquoteToken(t.slice(3)));
    }
  }
  if (/^(?:rm|unlink|del|erase|remove-item|ri|clear-content|clc|truncate)$/i.test(verb)) {
    for (let k = 1; k < tokens.length; k += 1) {
      const t = tokens[k];
      const named = t.match(/^-(?:Path|LiteralPath|LP|PSPath)(?::(.*))?$/i);
      if (named) targets.push(named[1] !== undefined ? named[1] : (tokens[++k] || ''));
      else if (/^(?:-(?:s|r|-size|-reference)|-(?:Filter|Include|Exclude|Stream|Credential))$/i.test(t)) k += 1;
      else if (!t.startsWith('-') && !(/^\/[a-z]/i.test(t) && (verb === 'del' || verb === 'erase'))) targets.push(t);
    }
  }

  // 6. PowerShell .NET [IO.File]::Write* / [System.IO.StreamWriter]::* / New-Object IO.StreamWriter
  const dotnetRe = /\[(?:System\.)?IO\.(File|StreamWriter)\]::\s*(WriteAllText|WriteAllLines|WriteAllBytes|AppendAllText|AppendAllLines|AppendText|Copy|Move|Delete|Create|CreateText|OpenWrite|Open|Replace|new)\s*\(([\s\S]*?)\)/gi;
  for (const dm of clause.matchAll(dotnetRe)) {
    const method = dm[2].toLowerCase();
    const callArgs = splitTopLevelCallArgs(dm[3]);
    const relevantArgs = method === 'copy'
      ? [callArgs[1]]
      : (method === 'move' || method === 'replace' ? [callArgs[0], callArgs[1]] : [callArgs[0]]);
    for (const argExpr of relevantArgs.filter(Boolean)) {
      const lits = extractNestedStringLiterals(argExpr);
      if (lits.length > 0) targets.push(...lits);
      else targets.push(unquoteToken(argExpr));
    }
  }
  for (const nm of clause.matchAll(/\bNew-Object\s+(?:-TypeName\s+)?['"]?(?:System\.)?IO\.StreamWriter['"]?\s*(?:\(([^)]*)\)|(?:-ArgumentList\s+)?([^\s;|)]+))/gi)) {
    const rawArg = nm[1] !== undefined ? splitTopLevelCallArgs(nm[1])[0] : nm[2];
    if (rawArg) {
      const lits = extractNestedStringLiterals(rawArg);
      targets.push(...(lits.length > 0 ? lits : [unquoteToken(rawArg)]));
    }
  }

  // 7. Inline JS / Python / Bun / Deno file mutation (including escaped quotes \".env\")
  const hasInlineMutator = /^(?:node|python(?:\d+(?:\.\d+)*)?|py|bun|deno|ruby|perl)$/i.test(verb)
    && (
      /\b(?:writeFile(?:Sync)?|appendFile(?:Sync)?|copyFile(?:Sync)?|cpSync|rename(?:Sync)?|unlink(?:Sync)?|rmSync|rmdirSync|rmdir|createWriteStream|writeTextFile(?:Sync)?|write_text|write_bytes)\b/.test(clause)
      || /\b(?:shutil\.(?:copy\w*|move)|os\.(?:replace|rename|remove|unlink)|Bun\.write)\s*\(/.test(clause)
      || /\bopen(?:Sync)?\s*\([\s\S]*?(?:,\s*(?:\\?['"])[wax+]|mode\s*=\s*(?:\\?['"])[wax+]|\.write\s*\()/.test(clause)
    );
  if (hasInlineMutator) {
    targets.push(...extractNestedStringLiterals(clause));
  }

  return targets.map((t) => t.trim()).filter(Boolean);
}

function touchesProtectedViaShell(clause) {
  return extractShellWriteTargets(clause).some((t) => isProtectedTargetPath(t).blocked);
}

export function touchesRubricViaShell(rawCommand) {
  for (const seg of collectActiveClauses(rawCommand)) {
    if (extractShellWriteTargets(seg).some((t) => isRubricTarget(t))) return true;
  }
  return false;
}

const DESTRUCTIVE_CHECKS = [
  ['rm -rf', (s) => /\brm(?:\.exe)?\b/i.test(s) && (/(?:^|\s)-[a-z]*(?:r[a-z]*f|f[a-z]*r)[a-z]*(?=\s|$)/i.test(s) || (/(?:^|\s)(?:-[a-z]*r[a-z]*|--recursive)(?=\s|$)/i.test(s) && /(?:^|\s)(?:-[a-z]*f[a-z]*|--force)(?=\s|$)/i.test(s)))],
  ['PowerShell Remove-Item/alias recursivo forzado', (s) => /\b(?:Remove-Item|ri|rm|rmdir|rd|del|erase)\b/i.test(s) && /(?:^|\s)-(?:Recurse|r)\b/i.test(s) && /(?:^|\s)(?:-(?:Force|fo)\b|-Confirm:\$false)/i.test(s)],
  ['cmd rd/rmdir/del /s /q', (s) => /\b(?:rmdir|rd|del|erase)\b/i.test(s) && /(?:^|\s)\/s(?=\s|\/|$)/i.test(s) && /(?:^|\s)\/q(?=\s|\/|$)/i.test(s)],
  ['borrado recursivo inline (fs.rmSync / fs.rmdirSync / shutil.rmtree)', (s) => /\b(?:rmSync|rm|rmdirSync|rmdir)\s*\([\s\S]*?(?:\\?['"])?\brecursive\b(?:\\?['"])?\s*:\s*(?:true|!0|1)\b/.test(s) || /\bshutil\.rmtree\s*\(/.test(s)],
  ['git reset --hard', (s) => /\bgit(?:\.exe)?\b.*\breset\b.*(?:^|\s)--hard(?=\s|$)/i.test(s)],
  ['git checkout -f / --force', (s) => /\bgit(?:\.exe)?\b.*\bcheckout\b.*(?:^|\s)(?:-f|--force)(?=\s|$)/i.test(s)],
  ['git branch -D', (s) => /\bgit(?:\.exe)?\b.*\bbranch\b.*(?:^|\s)-D(?=\s|$)/.test(s)],
  ['git push --force / -f / +refspec', (s) => /\bgit(?:\.exe)?\b.*\bpush\b/.test(s) && (/(?:^|\s)(?:--force|-[a-zA-Z]*f[a-zA-Z]*)(?=\s|$)/.test(s) || /\bpush\b(?:\s+\S+)*\s+\+[A-Za-z0-9_./-]+(?=\s|$)/.test(s))],
  ['git clean -fd / -fdx', (s) => /\bgit(?:\.exe)?\b.*\bclean\b/i.test(s) && (/(?:^|\s)-[a-z]*(?:f[a-z]*d|d[a-z]*f)[a-z]*(?=\s|$)/i.test(s) || (/(?:^|\s)(?:-[a-z]*f[a-z]*|--force)(?=\s|$)/i.test(s) && /(?:^|\s)-[a-z]*d[a-z]*(?=\s|$)/i.test(s)))],
  ['DROP TABLE', (s) => /\bDROP\s+TABLE\b/i.test(s)],
  ['DROP DATABASE', (s) => /\bDROP\s+DATABASE\b/i.test(s)],
  ['DROP SCHEMA', (s) => /\bDROP\s+SCHEMA\b/i.test(s)],
  ['TRUNCATE', (s) => /\bTRUNCATE\s+TABLE\b/i.test(s) || /\bTRUNCATE\s+(?!-)[A-Za-z_"`\[][\w"`\[\].]*\s*;?\s*$/i.test(s)],
  ['DELETE FROM sin WHERE', (s) => /\bDELETE\s+FROM\b/i.test(s) && !/\bWHERE\b/i.test(s)],
  ['prisma destructivo (migrate reset / --force-reset / --accept-data-loss)', (s) => /\bprisma(?:\.exe|\.cmd)?\b/i.test(s) && (/\bmigrate\s+reset\b/i.test(s) || (/\bdb\s+push\b/i.test(s) && /(?:^|\s)--(?:force-reset|accept-data-loss)(?=\s|$)/i.test(s)))],
  ['escritura por shell en ruta protegida (.env* / .git/** / sistema)', (s) => touchesProtectedViaShell(s)]
];

export function detectDestructiveCommand(rawCommand) {
  for (const seg of collectActiveClauses(rawCommand)) {
    for (const [rule, matches] of DESTRUCTIVE_CHECKS) {
      if (matches(seg)) return { blocked: true, rule };
    }
  }
  return { blocked: false, rule: null };
}

export function isPipVenvRequired(targetRoot = '') {
  if (typeof targetRoot !== 'string' || !targetRoot.trim()) return true;
  const cfgPath = path.join(targetRoot, 'harness.config.json');
  if (!fs.existsSync(cfgPath)) return true;
  try {
    const cfg = JSON.parse(fs.readFileSync(cfgPath, 'utf8'));
    if (cfg?.python?.requireVenvForPip === false) return false;
  } catch { /* Fail-Closed */ }
  return true;
}

function hasVenvSegment(rawPath, includeLast = false, strictLocalOnly = false) {
  const segs = unquoteToken(rawPath).replace(/\\/g, '/').split('/').filter((s) => s && s !== '.');
  const checkSegs = includeLast ? segs : segs.slice(0, -1);
  const segRe = strictLocalOnly ? STRICT_LOCAL_VENV_SEG_RE : VENV_SEG_RE;
  return checkSegs.some((s) => segRe.test(s));
}

function parseShellEnvMutation(seg) {
  const s = seg.trim().replace(/^\{\s+/, '').replace(/\s*\}\s*$/, '').trim();
  const psEnv = s.match(/^\$env:([A-Za-z_]\w*)\s*=\s*(.*)$/i);
  if (psEnv) return { key: psEnv[1].toUpperCase(), value: unquoteToken(psEnv[2]).replace(/^\$/, '') };
  const psSetEnv = s.match(/^\[(?:System\.)?Environment\]::SetEnvironmentVariable\s*\(\s*(['"][^'"]+['"])\s*,\s*([^,)]+)/i);
  if (psSetEnv) return { key: unquoteToken(psSetEnv[1]).toUpperCase(), value: unquoteToken(psSetEnv[2]).replace(/^\$/, '') };
  const psSetItem = s.match(/^(?:Set-Item|si)\s+(?:-Path\s+)?Env:[\\/]?([A-Za-z_]\w*)\s+(?:-Value\s+)?(.*)$/i);
  if (psSetItem) return { key: psSetItem[1].toUpperCase(), value: unquoteToken(psSetItem[2]).replace(/^\$/, '') };
  const shExport = s.match(/^(?:export|set)\s+["']?([A-Za-z_]\w*)=(.*?)["']?$/i);
  if (shExport) return { key: shExport[1].toUpperCase(), value: unquoteToken(shExport[2]) };
  const shUnset = s.match(/^(?:unset\s+([A-Za-z_]\w*)|(?:Remove-Item|ri|del)\s+(?:-Path\s+)?Env:[\\/]?([A-Za-z_]\w*))$/i);
  if (shUnset) return { key: (shUnset[1] || shUnset[2]).toUpperCase(), value: '' };
  const bareAssign = s.match(/^([A-Za-z_]\w*)=((?:'[^']*'|"(?:\\.|[^"\\])*"|\S+))$/);
  if (bareAssign) return { key: bareAssign[1].toUpperCase(), value: unquoteToken(bareAssign[2]) };
  return null;
}

function isVenvActivationClause(seg) {
  const toks = (seg.replace(/^\{\s+/, '').replace(/\s*\}\s*$/, '').match(SHELL_TOKEN_RE) || [])
    .map(unquoteToken)
    .filter((t) => !/^(?:\d*>>?|\d*<)/.test(t));
  if (toks.length === 0) return false;
  if (/^(?:source|\.|&|call)$/i.test(toks[0]) && ACTIVATE_SCRIPT_RE.test(toks[1] || '')) return true;
  if (ACTIVATE_SCRIPT_RE.test(toks[0])) return true;
  if (/^(?:conda|mamba|micromamba)$/i.test(toks[0]) && /^activate$/i.test(toks[1] || '')) return true;
  if (/^(?:export|set)$/i.test(toks[0]) && /^VIRTUAL_ENV=\S+/i.test(toks[1] || '')) return true;
  if (/^(?:\$env:)?VIRTUAL_ENV$/i.test(toks[0]) && toks[1] === '=' && Boolean(toks[2])) return true;
  if (/^(?:\$env:)?VIRTUAL_ENV=\S+/i.test(toks[0])) return true;
  return false;
}

function inspectPipInstallArgs(pipArgs, execInVenv, explicitPath, clauseVenv) {
  let subcommand = '', hasReadOnlyFlag = false, pythonTarget = '', hasPythonFlag = false, hasUserFlag = false;
  for (let j = 0; j < pipArgs.length; j += 1) {
    const t = pipArgs[j];
    if (t === '--help' || t === '-h' || t === '--version' || t === '-V' || t === '--dry-run') hasReadOnlyFlag = true;
    else if (t === '--user') hasUserFlag = true;
    else if (t === '--python') { hasPythonFlag = true; pythonTarget = pipArgs[++j] || ''; }
    else if (t.startsWith('--python=')) { hasPythonFlag = true; pythonTarget = t.slice(9); }
    else if (!subcommand && PIP_VALUE_OPTS_RE.test(t)) j += 1;
    else if (!t.startsWith('-') && !subcommand) subcommand = t.toLowerCase();
  }
  if (subcommand !== 'install' || hasReadOnlyFlag) return null;
  if (hasPythonFlag) {
    return hasVenvSegment(pythonTarget, true) ? null : 'pip install apuntando a intérprete Python fuera de .venv';
  }
  if (execInVenv) return null;
  if (!explicitPath && !hasUserFlag && clauseVenv) return null;
  return 'pip install global sin entorno virtual (.venv)';
}

function collectUvPythonTargets(argList, out) {
  for (let j = 0; j < argList.length; j += 1) {
    const t = argList[j];
    if (t === '--python' || t === '-p') { out.push(argList[++j] || ''); }
    else if (t.startsWith('--python=')) { out.push(t.slice(9)); }
    else if (t.startsWith('-p=')) { out.push(t.slice(3)); }
    else if (t.startsWith('-p') && !t.startsWith('--') && t.length > 2) { out.push(t.slice(2)); }
  }
}

function inspectInlinePythonPip(codeText, execInVenv, explicitPath, clauseVenv) {
  if (!codeText) return null;
  const clean = unescapeQuotes(codeText);
  const referencesPipPkg = /\b(?:import\s+pip|from\s+pip)\b|\b__import__\s*\(\s*['"]pip/i.test(clean);
  const invokesPipInstall = (
    /\bpip(?:\._internal(?:\.cli\.main)?|\.__main__)?\s*\.\s*main\s*\([\s\S]*?\binstall\b/i.test(clean)
    || (referencesPipPkg && /\bmain\s*\([\s\S]*?\binstall\b/i.test(clean))
    || /\brunpy\.run_module\s*\(\s*['"]pipx?(?:\.[\w.]+)?['"][\s\S]*?\binstall\b/i.test(clean)
    || /\b(?:subprocess\b[\s\S]*?|os\.(?:system|popen|exec\w*|spawn\w*)\s*\([\s\S]*?)\b(?:pipx?|conda|mamba)(?:\d+(?:\.\d+)*)?(?:\.[\w.]+)?\b[\s\S]*?\binstall\b/i.test(clean)
  );
  if (!invokesPipInstall) return null;
  const forcesGlobal = /--user\b|\/usr\/(?:local\/)?bin\/(?:pip|python)|\bpipx\b/i.test(clean);
  if (!forcesGlobal && (execInVenv || (!explicitPath && clauseVenv))) return null;
  return 'ejecución programática de pip install global fuera de .venv (python -c)';
}

function checkClauseGlobalPip(seg, localVenv, envUvSystem) {
  const parsed = parseWrappersAndEnv(seg, localVenv, envUvSystem);
  if (parsed.lookupOnly) return null;
  if (parsed.splitExpanded !== null) {
    const subHit = scanPipScope(parsed.splitExpanded, 1, parsed.clauseVenv, parsed.clauseUvSystem);
    return subHit ? subHit.rule : null;
  }
  const { rawTokens, idx, clauseVenv, clauseUvSystem } = parsed;
  const tokens = rawTokens.slice(idx).filter((t) => !/^(?:\d*>>?|\d*<)/.test(t)).map(unquoteToken);
  if (tokens.length === 0) return null;

  const execToken = tokens[0];
  const baseExec = baseNameOfVerb(execToken);
  const explicitPath = /[\\/]/.test(execToken);
  const execInVenv = explicitPath && hasVenvSegment(execToken, false);

  if (baseExec === 'pipx') {
    const rest = tokens.slice(1);
    if (rest.some((t) => t === '--help' || t === '-h' || t === '--version')) return null;
    const sub = rest.find((t) => !t.startsWith('-'))?.toLowerCase() || '';
    if (sub === 'install' || sub === 'inject') {
      return 'pipx install global fuera del entorno virtual (.venv) del proyecto';
    }
    return null;
  }

  if (baseExec === 'conda' || baseExec === 'mamba' || baseExec === 'micromamba') {
    const rest = tokens.slice(1);
    if (rest.some((t) => t === '--help' || t === '-h' || t === '--version' || t === '-V' || t === '--dry-run' || t === '-d')) return null;
    const sub = rest.find((t) => !t.startsWith('-'))?.toLowerCase() || '';
    if (sub !== 'install') return null;
    let prefixVal = '';
    for (let j = 0; j < rest.length; j += 1) {
      const t = rest[j];
      if (t === '-p' || t === '--prefix') prefixVal = rest[++j] || '';
      else if (t.startsWith('--prefix=')) prefixVal = t.slice(9);
      else if (t.startsWith('-p=')) prefixVal = t.slice(3);
      else if (t.startsWith('-p') && !t.startsWith('--') && t.length > 2) prefixVal = t.slice(2);
    }
    if (prefixVal && hasVenvSegment(prefixVal, true, true)) return null;
    return `${baseExec} install global sin --prefix hacia .venv/venv`;
  }

  if (baseExec === 'uv') {
    let i = 1;
    while (i < tokens.length && tokens[i].startsWith('-')) {
      if (/^(?:--(?:directory|project|cache-dir|config-file|python-preference|python)|-p)$/.test(tokens[i])) i += 2;
      else i += 1;
    }
    if ((tokens[i] || '').toLowerCase() !== 'pip') return null;
    const preArgs = tokens.slice(1, i);
    const rest = tokens.slice(i + 1);
    const uvPipSub = rest.find((t) => !t.startsWith('-'))?.toLowerCase() || '';
    if (uvPipSub !== 'install' && uvPipSub !== 'sync') return null;
    if (rest.some((t) => t === '--help' || t === '-h' || t === '--dry-run' || t === '--version' || t === '-V')) return null;
    if (clauseUvSystem || preArgs.some((t) => t === '--system' || t === '--system=true') || rest.some((t) => t === '--system' || t === '--system=true')) {
      return 'uv pip install --system (instalación en Python global del sistema)';
    }
    const uvPyTargets = [];
    collectUvPythonTargets(preArgs, uvPyTargets);
    collectUvPythonTargets(rest, uvPyTargets);
    for (const pyVal of uvPyTargets) {
      if (!pyVal || !hasVenvSegment(pyVal, true)) {
        return 'uv pip install apuntando a intérprete Python fuera de .venv';
      }
    }
    return null;
  }

  if (/^pip(?:\d+(?:\.\d+)*)?$/.test(baseExec)) {
    return inspectPipInstallArgs(tokens.slice(1), execInVenv, explicitPath, clauseVenv);
  }

  if (/^(?:python(?:\d+(?:\.\d+)*)?|py)$/.test(baseExec)) {
    let k = 1, modName = '', pipArgs = [], inlineCode = '';
    while (k < tokens.length) {
      const pt = tokens[k];
      if (/^-[A-Za-z]*m$/.test(pt)) { modName = tokens[k + 1] || ''; pipArgs = tokens.slice(k + 2); break; }
      const inlineMod = pt.match(/^-[A-Za-z]*m(pipx?(?:\d+(?:\.\d+)*)?(?:\.[\w.]+)?)$/i);
      if (inlineMod) { modName = inlineMod[1]; pipArgs = tokens.slice(k + 1); break; }
      if (pt === '-c' || /^-[A-Za-z]*c$/.test(pt)) { inlineCode = tokens[k + 1] || ''; break; }
      if (/^-[A-Za-z]*c.+/.test(pt)) { inlineCode = pt.replace(/^-[A-Za-z]*c/, ''); break; }
      if (pt === '-' || !pt.startsWith('-')) break;
      if (pt === '-W' || pt === '-X' || pt === '--check-hash-based-pycs') { k += 2; continue; }
      k += 1;
    }
    if (/^pipx(?:\.[\w.]+)?$/i.test(modName)) {
      if (pipArgs.some((t) => t === '--help' || t === '-h' || t === '--version')) return null;
      const sub = pipArgs.find((t) => !t.startsWith('-'))?.toLowerCase() || '';
      if (sub === 'install' || sub === 'inject') return 'pipx install global fuera del entorno virtual (.venv) del proyecto';
      return null;
    }
    if (/^pip(?:\d+(?:\.\d+)*)?(?:\.[\w.]+)?$/i.test(modName)) {
      return inspectPipInstallArgs(pipArgs, execInVenv, explicitPath, clauseVenv);
    }
    if (inlineCode) {
      return inspectInlinePythonPip(inlineCode, execInVenv, explicitPath, clauseVenv);
    }
  }

  if (/^(?:node|bun|deno)$/.test(baseExec) && !clauseVenv) {
    const joined = unescapeQuotes(seg);
    if (/\b(?:execSync|exec|spawnSync|spawn)\b[\s\S]*?\bpip(?:\d+(?:\.\d+)*)?\b[\s\S]*?\binstall\b/i.test(joined) && !/\.venv|venv[/\\]/i.test(joined)) {
      return 'ejecución programática de pip install global fuera de .venv';
    }
  }
  return null;
}

function scanPipScope(raw, depth, inheritedVenv, envUvSystem) {
  if (typeof raw !== 'string' || !raw.trim() || depth > 6) return null;
  for (const m of raw.replace(/'[^']*'/g, "''").matchAll(/\$\(([^)]+)\)|`([^`]+)`/g)) {
    const subHit = scanPipScope(m[1] || m[2], depth + 1, inheritedVenv, envUvSystem);
    if (subHit) return subHit;
  }
  const parts = splitTopClauses(raw);
  let localVenv = inheritedVenv;
  let localUvSystem = envUvSystem;
  for (let idx = 0; idx < parts.length; idx += 1) {
    const seg = parts[idx].text.trim();
    const sep = parts[idx].sep;
    const keepVenvAcross = sep === '&&';
    const persistEnvAcross = sep !== '|';
    const inner = unwrapOuterParens(seg);
    if (inner !== null) {
      const parenHit = scanPipScope(inner, depth + 1, localVenv, localUvSystem);
      if (parenHit) return parenHit;
      if (!keepVenvAcross) localVenv = inheritedVenv;
      continue;
    }
    if (sep === '|' && /^(?:'[^']*'|"(?:\\.|[^"\\])*")$/.test(seg) && parts[idx + 1]) {
      const nextVerb = extractVerbName(parts[idx + 1].text.trim());
      if (!WRAPPER_VERBS.has(nextVerb)) {
        localVenv = inheritedVenv;
        continue;
      }
      const pipedHit = scanPipScope(unquoteToken(seg), depth + 1, localVenv, localUvSystem);
      if (pipedHit) return pipedHit;
    }
    const envMut = parseShellEnvMutation(seg);
    if (envMut) {
      if (envMut.key === 'UV_SYSTEM_PYTHON' && persistEnvAcross) {
        localUvSystem = /^(?:1|true)$/i.test(envMut.value);
      }
      if (envMut.key === 'VIRTUAL_ENV') {
        localVenv = Boolean(envMut.value) && keepVenvAcross;
      }
      continue;
    }
    const parsedWrap = parseWrappersAndEnv(seg, localVenv, localUvSystem);
    if (parsedWrap.lookupOnly) {
      if (!keepVenvAcross) localVenv = inheritedVenv;
      continue;
    }
    if (parsedWrap.splitExpanded !== null) {
      const splitHit = scanPipScope(parsedWrap.splitExpanded, depth + 1, parsedWrap.clauseVenv, parsedWrap.clauseUvSystem);
      if (splitHit) return splitHit;
      if (!keepVenvAcross) localVenv = inheritedVenv;
      continue;
    }
    const strippedForVerb = parsedWrap.stripped;
    const verb = extractVerbName(strippedForVerb);
    if (PRINT_VERBS.has(verb) || (verb === 'git' && /\bcommit\b/i.test(strippedForVerb))) {
      if (!keepVenvAcross) localVenv = inheritedVenv;
      continue;
    }
    if (WRAPPER_VERBS.has(verb)) {
      for (const qm of strippedForVerb.matchAll(/'((?:\\.|[^'\\])*)'|"((?:\\.|[^"\\])*)"/g)) {
        const qBody = qm[1] !== undefined ? qm[1] : unescapeQuotes(qm[2]);
        const qHit = scanPipScope(qBody, depth + 1, parsedWrap.clauseVenv, parsedWrap.clauseUvSystem);
        if (qHit) return qHit;
      }
      const tail = strippedForVerb.replace(/^(?:'[^']+'|"[^"]+"|\S+)\s+(?:(?:-\w+|\/[ckq]|--(?:command|execute))\s+)*/i, '');
      if (tail && tail !== strippedForVerb && !/^['"]/.test(tail)) {
        const tHit = scanPipScope(tail, depth + 1, parsedWrap.clauseVenv, parsedWrap.clauseUvSystem);
        if (tHit) return tHit;
      }
      if (!keepVenvAcross) localVenv = inheritedVenv;
      continue;
    }
    if (isVenvActivationClause(seg)) {
      localVenv = keepVenvAcross;
      continue;
    }
    const rule = checkClauseGlobalPip(seg, localVenv, localUvSystem);
    if (rule) return { blocked: true, rule };
    if (!keepVenvAcross) localVenv = inheritedVenv;
  }
  return null;
}

export function detectGlobalPipInstall(rawCommand, options = {}) {
  const { targetRoot = '', env = process.env } = options;
  if (!isPipVenvRequired(targetRoot)) return { blocked: false, rule: null };
  const initialVenv = Boolean(typeof env?.VIRTUAL_ENV === 'string' && env.VIRTUAL_ENV.trim());
  const envUvSystem = /^(?:1|true)$/i.test(String(env?.UV_SYSTEM_PYTHON || '').trim());
  return scanPipScope(rawCommand, 0, initialVenv, envUvSystem) || { blocked: false, rule: null };
}

function readTranscriptLines(tp) {
  if (typeof tp !== 'string' || !tp.trim() || !fs.existsSync(tp)) return [];
  const raw = fs.readFileSync(tp, 'utf8');
  if (raw.includes('"truncated_fields"')) {
    const fullCandidate = path.join(path.dirname(tp), 'transcript_full.jsonl');
    if (fs.existsSync(fullCandidate)) {
      return fs.readFileSync(fullCandidate, 'utf8').split(/\r?\n/).filter(Boolean);
    }
  }
  return raw.split(/\r?\n/).filter(Boolean);
}

function matchesInitialCheckerText(text) {
  if (typeof text !== 'string' || !text.trim()) return false;
  if (CHECKER_PROMPT_RE.test(text)) return true;
  if (CHECKER_INITIAL_DOC_RE.test(text) && CHECKER_ROLE_HINT_RE.test(text) && !EXPLICIT_MAKER_IDENTITY_RE.test(text)) {
    return true;
  }
  return false;
}

export function isCheckerSession(payload = {}) {
  if (payload?.isChecker === true) return true;
  const role = String(payload?.role ?? payload?.agentRole ?? payload?.subagentRole ?? payload?.agentType ?? payload?.subagentType ?? '').trim();
  if (role && !['user', 'assistant', 'system', 'tool', 'model'].includes(role.toLowerCase()) && CHECKER_ROLE_RE.test(role)) return true;
  const convId = String(payload?.conversationId ?? '').trim();
  if (EXPLICIT_CHECKER_ID_RE.test(convId) && /^(?:checker|evaluator|evaluador|independent-checker)/i.test(convId)) return true;

  let sawInitialTurnInTranscript = false;
  try {
    const lines = readTranscriptLines(payload?.transcriptPath);
    for (let i = 0; i < Math.min(lines.length, 6); i += 1) {
      const line = lines[i];
      let obj = null;
      try { obj = JSON.parse(line); } catch { obj = null; }
      if (!obj) {
        if (i === 0) {
          sawInitialTurnInTranscript = true;
          if (matchesInitialCheckerText(line)) return true;
        }
        break;
      }
      const stepType = String(obj.type || '').toUpperCase();
      const stepRole = String(obj.role || '').toLowerCase();
      if (stepType === 'PLANNER_RESPONSE' || stepRole === 'assistant' || stepRole === 'model' || Array.isArray(obj.tool_calls)) {
        sawInitialTurnInTranscript = true;
        break;
      }
      const msgText = [obj.content, obj.prompt, obj.message, obj.text, obj.userInput?.userResponse].filter(Boolean).join('\n');
      if (msgText.trim()) {
        if (matchesInitialCheckerText(msgText)) return true;
        if (stepType === 'USER_INPUT' || stepRole === 'user') {
          sawInitialTurnInTranscript = true;
          break;
        }
      }
    }
  } catch { /* ignore */ }

  if (!sawInitialTurnInTranscript) {
    const fallbackPrompt = String(payload?.lastUserInput ?? payload?.prompt ?? '');
    if (matchesInitialCheckerText(fallbackPrompt)) return true;
  }
  return false;
}

function classifyInvokeSpec(tcOrRaw) {
  if (tcOrRaw && typeof tcOrRaw === 'object') {
    let a = tcOrRaw.args ?? tcOrRaw.arguments ?? {};
    if (typeof a === 'string') { try { a = JSON.parse(a); } catch { a = {}; } }
    const role = String(a?.Role ?? a?.role ?? '').trim();
    const prompt = String(a?.Prompt ?? a?.prompt ?? '');
    if (CHECKER_ROLE_RE.test(role)) return 'checker';
    if (role && EXPLICIT_NON_CHECKER_ROLE_RE.test(role) && !matchesInitialCheckerText(prompt) && !/checker-prompt\.md|evaluator-rubric\.md/i.test(prompt)) {
      return 'non-checker';
    }
    if (matchesInitialCheckerText(prompt) || (/checker-prompt\.md|evaluator-rubric\.md/i.test(prompt) && !EXPLICIT_MAKER_IDENTITY_RE.test(prompt))) {
      return 'checker';
    }
    return 'non-checker';
  }
  const spec = String(tcOrRaw || '');
  const roleMatch = spec.match(/"(?:Role|role)"\s*:\s*"([^"]+)"/);
  const roleVal = roleMatch ? roleMatch[1].trim() : '';
  if (CHECKER_ROLE_RE.test(roleVal)) return 'checker';
  if (matchesInitialCheckerText(spec) || (/checker-prompt\.md|evaluator-rubric\.md/i.test(spec) && !EXPLICIT_MAKER_IDENTITY_RE.test(spec))) {
    return 'checker';
  }
  if (roleVal && EXPLICIT_NON_CHECKER_ROLE_RE.test(roleVal)) return 'non-checker';
  return 'non-checker';
}

function isTurnBoundaryStep(line) {
  let obj = null;
  try { obj = JSON.parse(line); } catch { obj = null; }
  if (!obj || typeof obj !== 'object') return false;
  const t = String(obj.type || '');
  const r = String(obj.role || '').toLowerCase();
  if (t === 'PLANNER_RESPONSE' || t === 'USER_INPUT' || r === 'assistant' || r === 'user' || r === 'model') return true;
  const isToolResp = /^(?:TOOL_RESPONSE|TOOL_RESULT|GENERIC|SYSTEM_MESSAGE)$/i.test(t) || r === 'tool';
  if (!isToolResp && (Array.isArray(obj.tool_calls) || Boolean(obj.invokeSubagent))) return true;
  return false;
}

function extractConversationIdsFromResp(respInput, excludedIds = new Set()) {
  const found = [];
  let target = respInput;
  if (typeof respInput === 'string') {
    try { target = JSON.parse(respInput); } catch { target = respInput; }
  }
  if (target && typeof target === 'object' && !Array.isArray(target)) {
    const inner = target.content ?? target.output ?? target.result ?? target.tool_responses ?? target.results;
    if (inner !== undefined) {
      const innerIds = extractConversationIdsFromResp(inner, excludedIds);
      if (innerIds.length > 0) return innerIds;
    }
  }
  const str = typeof target === 'string' ? target : JSON.stringify(target ?? '');
  for (const m of str.matchAll(/(?:\\?["'])?conversation_?id(?:\\?["'])?\s*[:=]\s*(?:\\?["'])?([A-Za-z0-9_.:-]+)(?:\\?["'])?/gi)) {
    const id = m[1].trim();
    if (id && !excludedIds.has(id) && !found.includes(id)) found.push(id);
  }
  if (found.length === 0) {
    for (const um of str.matchAll(/\b[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}\b/gi)) {
      const id = um[0];
      if (!excludedIds.has(id) && !found.includes(id)) found.push(id);
    }
  }
  return found;
}

export function isSendMessageToChecker(payload = {}, recipient = '', message = '') {
  if (EXPLICIT_CHECKER_ID_RE.test(recipient)) return { blocked: true, detail: `Recipient '${recipient}' es una instancia Checker` };
  const checkerMode = isCheckerSession(payload);
  let parentSender = '';
  const agentKindById = new Map();
  const recordKind = (id, k) => {
    if (!id || !k) return;
    if (agentKindById.get(id) === 'checker') return;
    agentKindById.set(id, k);
  };

  if (recipient) {
    try {
      const lines = readTranscriptLines(payload?.transcriptPath);
      if (lines[0] && /SYSTEM_MESSAGE/.test(lines[0])) {
        let first = lines[0]; try { first = String(JSON.parse(first)?.content || first); } catch { /* raw */ }
        parentSender = (first.match(/\bsender=(?!system\b)([^\s"'<>\\]+)/i) || ['', ''])[1];
      }
      if (parentSender && recipient === parentSender) return { blocked: false, detail: null };

      const selfConvId = String(payload?.conversationId || '').trim();
      for (let i = 0; i < lines.length; i += 1) {
        const line = lines[i];
        const isPassive = /"type"\s*:\s*"(?:SYSTEM_MESSAGE|GENERIC|TOOL_RESPONSE|TOOL_RESULT|USER_INPUT)"/i.test(line);
        if (!isPassive && /\binvoke_?subagent\b|"invokeSubagent"\s*:/i.test(line)) {
          let windowEnd = i + 1;
          while (windowEnd < lines.length && !isTurnBoundaryStep(lines[windowEnd])) {
            windowEnd += 1;
          }
          const respLines = lines.slice(i + 1, windowEnd);
          let step = null; try { step = JSON.parse(line); } catch { step = null; }

          if (Array.isArray(step?.tool_calls)) {
            const excluded = new Set([selfConvId, String(step?.conversationId || '')].filter(Boolean));
            const invokeEntries = [];
            for (let k = 0; k < step.tool_calls.length; k += 1) {
              const tc = step.tool_calls[k];
              const callId = String(tc?.id ?? tc?.tool_call_id ?? tc?.callId ?? tc?.toolCallId ?? '').trim();
              if (callId) excluded.add(callId);
              if (/^invoke_?subagent$/i.test(String(tc?.name ?? tc?.toolName ?? ''))) {
                const entryKind = classifyInvokeSpec(tc);
                const directId = String(tc?.conversationId ?? tc?.result?.conversationId ?? tc?.output?.conversationId ?? '').trim();
                if (directId) recordKind(directId, entryKind);
                invokeEntries.push({ tc, tcIdx: k, callId, kind: entryKind, matched: Boolean(directId) });
              }
            }

            // 1. Match by tool_call_id if present in response objects
            const parsedResps = [];
            for (const rl of respLines) {
              let ro = null; try { ro = JSON.parse(rl); } catch { ro = null; }
              if (ro && Array.isArray(ro.tool_responses)) parsedResps.push(...ro.tool_responses);
              else if (ro && Array.isArray(ro.results)) parsedResps.push(...ro.results);
              else parsedResps.push(ro || { raw: rl });
            }
            for (const entry of invokeEntries) {
              if (entry.matched || !entry.callId) continue;
              const hitResp = parsedResps.find((r) => String(r?.tool_call_id ?? r?.callId ?? r?.toolCallId ?? r?.id ?? '').trim() === entry.callId);
              if (hitResp) {
                const ids = extractConversationIdsFromResp(hitResp, excluded);
                if (ids[0]) { recordKind(ids[0], entry.kind); entry.matched = true; }
                else if (JSON.stringify(hitResp).includes(recipient)) { recordKind(recipient, entry.kind); entry.matched = true; }
              }
            }

            // 2. Sequential 1-to-1 matching of extracted conversationIds in response window
            const unmatched = invokeEntries.filter((e) => !e.matched);
            if (unmatched.length > 0) {
              const seqIds = [];
              for (const rl of respLines) {
                for (const cid of extractConversationIdsFromResp(rl, excluded)) {
                  if (!seqIds.includes(cid)) seqIds.push(cid);
                }
              }
              for (let m = 0; m < Math.min(unmatched.length, seqIds.length); m += 1) {
                recordKind(seqIds[m], unmatched[m].kind);
                unmatched[m].matched = true;
              }

              // 3. Fallback positional line match within the current turn's response window only
              const stillUnmatched = unmatched.filter((e) => !e.matched);
              if (stillUnmatched.length > 0 && seqIds.length === 0) {
                if (respLines.length === step.tool_calls.length) {
                  for (const entry of stillUnmatched) {
                    if (respLines[entry.tcIdx]?.includes(recipient)) recordKind(recipient, entry.kind);
                  }
                } else if (invokeEntries.length === 1 && respLines.some((rl) => rl.includes(recipient))) {
                  recordKind(recipient, invokeEntries[0].kind);
                }
              }
            }
          } else {
            const singleKind = classifyInvokeSpec(line);
            const excluded = new Set([selfConvId].filter(Boolean));
            const ids = extractConversationIdsFromResp([line, ...respLines].join('\n'), excluded);
            for (const cid of ids) recordKind(cid, singleKind);
            if (ids.length === 0 && (line.includes(recipient) || respLines.some((rl) => rl.includes(recipient)))) {
              recordKind(recipient, singleKind);
            }
          }
          i = windowEnd - 1;
        } else if (!agentKindById.has(recipient) && i > 0 && recipient !== parentSender && /SYSTEM_MESSAGE/.test(line) && (line.includes(`sender=${recipient}`) || line.includes(`Subagent ${recipient}`)) && /\b(?:ACEPTAR|REVISAR|BLOQUEAR)\b/.test(line) && /\b(?:[0-9]|1[0-2])\s*\/\s*12\b/.test(line)) {
          recordKind(recipient, 'checker');
        }
      }
    } catch { /* ignore */ }
  }

  const kind = agentKindById.get(recipient) || 'unknown';
  if (checkerMode) return kind === 'checker' ? { blocked: true, detail: `Recipient '${recipient}' es Checker` } : { blocked: false, detail: null };
  if (REAUDIT_MESSAGE_RE.test(message)) return { blocked: true, detail: 'Solicitud de re-auditoría en sesión existente' };
  return kind === 'checker' ? { blocked: true, detail: `Recipient '${recipient}' corresponde a un Checker previo en transcriptPath` } : { blocked: false, detail: null };
}
