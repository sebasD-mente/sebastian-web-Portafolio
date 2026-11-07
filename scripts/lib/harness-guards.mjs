import fs from 'node:fs';
import path from 'node:path';

export const SAFE_ENV_TEMPLATES = new Set(['.env.example', '.env.sample', '.env.template']);
const WRITE_EDIT_TOOLS = new Set([
  'write_file', 'edit_file', 'write', 'edit', 'multiedit',
  'create_file', 'replace_file_content', 'multi_replace_file_content'
]);
const COMMAND_TOOLS = new Set(['run_command', 'bash', 'execute_command', 'shell']);
const SEND_MESSAGE_TOOLS = new Set(['send_message', 'sendmessage']);
const WRAPPER_VERBS = new Set([
  'bash', 'sh', 'zsh', 'dash', 'ksh', 'cmd', 'pwsh', 'powershell',
  'eval', 'iex', 'invoke-expression', 'psql', 'mysql', 'sqlite3', 'sqlcmd'
]);
const MCP_MUTATING_TOOL_RE = /(?:write|edit|append|move|copy|create|delete|remove|patch|rename|replace)/i;
const MCP_EXEC_TOOL_RE = /(?:^|_)(?:query|execute\w*|run\w*|bash|shell|eval|sql)(?:$|_)/i;
const EXPLICIT_CHECKER_ID_RE = /(?:^|[-_:])(checker|evaluator|evaluador|independent-checker)(?:$|[-_:\d])/i;
const CHECKER_ROLE_RE = /\b(checker|evaluator|evaluador|independent-checker|inspector)\b/i;
const EXPLICIT_NON_CHECKER_ROLE_RE = /^(?:codebase\s+researcher|research(?:er)?|explorer|worker|maker|coder|flutter_a11y\w*|image-generator)$/i;
const CHECKER_PROMPT_RE = /\b(?:eres\s+el\s+(?:\*\*)?(?:agente\s+)?(?:\*\*)?(?:checker|evaluador|inspector\s+independiente)|you\s+are\s+(?:the|an)\s+(?:independent\s+)?(?:checker|evaluator)|(?:act[uú]a|actuar)\s+como\s+(?:un\s+|el\s+)?(?:sub-?agente\s+|agente\s+)?(?:independent\s+)?(?:checker|evaluador))\b|(?:^|\n)\s*(?:#+\s*)?(?:tu\s+rol|rol|role)\s*:\s*(?:\*\*)?(?:agente\s+)?(?:independent[-_\s]*)?(?:checker|evaluador|evaluator)\b|(?:^|\n)\s*#\s*checker\s+agent\s+prompt\b/im;
const REAUDIT_MESSAGE_RE = /\b(?:re-?audit\w*|re-?evalu\w*|volver\s+a\s+auditar|volver\s+a\s+calificar|segunda\s+pasada|sigue\s+checker-prompt\.md)\b|\b(?:audita(?:r)?|califica(?:r)?|punt[uú]a(?:r)?|rellena(?:r)?|actualiza(?:r)?|eval[uú]a(?:r)?|revisa(?:r)?)\b[\s\S]{0,120}\bevaluator-rubric\.md\b/i;
const VENV_SEG_RE = /^(?:\.?venv[\w.-]*|[\w.-]*[-_.]venv[\w.-]*|virtualenv[\w.-]*|\.virtualenvs|env|envs|[\w.-]*[-_.]env|conda|miniconda\d*|anaconda\d*|mambaforge|miniforge\d*|\.conda|\.poetry|pypoetry|pipenv|pipx|\.tox|\.nox|\.hatch|__pypackages__)$/i;
const ACTIVATE_SCRIPT_RE = /[/\\](?:bin|Scripts)[/\\]activate(?:\.(?:ps1|bat|cmd|fish|csh|sh))?$/i;
const PIP_VALUE_OPTS_RE = /^--(?:log|local-log|proxy|retries|timeout|default-timeout|exists-action|trusted-host|cert|client-cert|cache-dir)$/i;

export const redPenReason = (error, why, fix) => `ERROR: ${error}\nPOR QUÉ: ${why}\nSOLUCIÓN (FIX): ${fix}`;

export function redactSecrets(value) {
  const raw = typeof value === 'string' ? value : JSON.stringify(value ?? '');
  return raw
    .replace(/((?:api[_-]?key|token|secret|password|authorization|cookie)(?:\\?['"])?\s*[:=]\s*)(?:\\?['"])?[^\s'",;}\\]+(?:\\?['"])?/gi, '$1[REDACTED]')
    .replace(/\b(?:sk-[A-Za-z0-9_-]{16,}|gh[pousr]_[A-Za-z0-9]{20,}|AIza[0-9A-Za-z_-]{20,})\b/g, '[REDACTED]')
    .slice(0, 300);
}

function collectMcpPaths(obj, out = []) {
  if (!obj || typeof obj !== 'object') return out;
  const pathKeys = ['path', 'Path', 'source', 'destination', 'file_path', 'filePath', 'target', 'TargetFile', 'AbsolutePath'];
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

export function extractToolContext(payload = {}, stdinEmpty = false, env = process.env) {
  const tc = payload?.toolCall || payload?.preToolHookArgs?.toolCall || payload?.toolHookArgs?.toolCall || null;
  const toolName = String(tc?.name ?? payload?.toolName ?? payload?.tool_name ?? '').trim();
  const lowerName = toolName.toLowerCase();
  let args = tc?.args ?? tc?.arguments ?? payload?.toolArgs ?? payload?.tool_input ?? payload?.input ?? {};
  if (typeof args === 'string') { try { args = JSON.parse(args); } catch { args = {}; } }
  if (!args || typeof args !== 'object') args = {};

  const targetPaths = ['Path', 'TargetFile', 'AbsolutePath', 'file_path', 'path', 'target_file', 'filePath', 'File']
    .map((k) => (typeof args[k] === 'string' ? args[k].trim() : ''))
    .filter(Boolean);
  const cmdKey = ['CommandLine', 'command', 'cmd', 'Command'].find((k) => typeof args[k] === 'string' && args[k].trim());
  let commandLine = cmdKey ? args[cmdKey] : '';
  let isWriteEdit = WRITE_EDIT_TOOLS.has(lowerName);
  let isCommand = COMMAND_TOOLS.has(lowerName);

  if (lowerName === 'call_mcp_tool' || lowerName.startsWith('mcp_')) {
    const mcpTool = String(args.ToolName ?? args.toolName ?? lowerName).trim();
    let mcpArgs = args.Arguments ?? args.arguments ?? args;
    if (typeof mcpArgs === 'string') { try { mcpArgs = JSON.parse(mcpArgs); } catch { mcpArgs = {}; } }
    if (MCP_MUTATING_TOOL_RE.test(mcpTool)) {
      isWriteEdit = true;
      collectMcpPaths(mcpArgs, targetPaths);
    }
    if (MCP_EXEC_TOOL_RE.test(mcpTool) && mcpArgs && typeof mcpArgs === 'object') {
      const execVal = ['sql', 'query', 'command', 'CommandLine', 'code', 'cmd', 'script']
        .map((k) => (typeof mcpArgs[k] === 'string' ? mcpArgs[k].trim() : ''))
        .find(Boolean);
      if (execVal) {
        isCommand = true;
        commandLine = execVal;
      }
    }
  }

  const recipient = String(args.Recipient ?? args.recipient ?? args.to ?? args.conversationId ?? '').trim();
  const message = String(args.Message ?? args.message ?? args.content ?? '').trim();
  const isSendMessage = SEND_MESSAGE_TOOLS.has(lowerName);

  if ((stdinEmpty || !toolName) && typeof env.TOOL_TARGET_PATH === 'string' && env.TOOL_TARGET_PATH.trim()) {
    isWriteEdit = true;
    targetPaths.push(env.TOOL_TARGET_PATH.trim());
  }
  if ((stdinEmpty || !toolName) && typeof env.TOOL_COMMAND === 'string' && env.TOOL_COMMAND.trim()) {
    isCommand = true;
    if (!commandLine) commandLine = env.TOOL_COMMAND;
  }

  return { toolName, lowerName, args, isWriteEdit, isCommand, isSendMessage, targetPaths, commandLine, recipient, message };
}

export function isProtectedTargetPath(rawPath) {
  if (typeof rawPath !== 'string' || !rawPath.trim()) return { blocked: false, reason: null };
  const normalized = rawPath.trim().replace(/\\/g, '/');
  const lowerFull = normalized.toLowerCase();

  if (/^\/(?:etc|usr)(?:\/|$)/.test(lowerFull) || /^[a-z]:\/(?:windows|system32)(?:\/|$)/.test(lowerFull) || /(?:^|\/|~\/)\.ssh(?:\/|$)/.test(lowerFull)) {
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
  const base = rawPath.trim().replace(/\\/g, '/').split('/').pop().toLowerCase();
  return base === 'evaluator-rubric.md';
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

function extractVerbName(text) {
  const m = text.match(/^(?:'([^']+)'|"([^"]+)"|([^\s"']+))/);
  const rawVerb = m ? (m[1] || m[2] || m[3] || '') : '';
  return rawVerb.replace(/\\/g, '/').split('/').pop().toLowerCase().replace(/\.(?:exe|cmd|bat)$/i, '');
}

export function collectActiveClauses(raw, depth = 0) {
  if (typeof raw !== 'string' || !raw.trim() || depth > 5) return [];
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
      if (!WRAPPER_VERBS.has(nextVerb)) continue;
    }
    const stripped = seg.replace(/^\{\s+/, '').replace(/\s*\}\s*$/, '').replace(/^(?:(?:[A-Za-z_]\w*=\S+|env|sudo|command|nohup|&)\s+)+/i, '');
    const verb = extractVerbName(stripped);
    if (['echo', 'printf', 'write-output', 'write-host'].includes(verb)) {
      clauses.push(stripped.replace(/'[^']*'|"(?:\\.|[^"\\])*"/g, '""'));
    } else if (verb === 'git' && /\bcommit\b/i.test(stripped)) {
      clauses.push(stripped.replace(/(-[a-zA-Z]*m|--message(?:=|\s+))\s*(?:'[^']*'|"(?:\\.|[^"\\])*")/g, '$1 ""'));
    } else if (WRAPPER_VERBS.has(verb)) {
      for (const qm of stripped.matchAll(/'([^']*)'|"((?:\\.|[^"\\])*)"/g)) {
        clauses.push(...collectActiveClauses(qm[1] !== undefined ? qm[1] : qm[2].replace(/\\"/g, '"'), depth + 1));
      }
      const tail = stripped.replace(/^(?:'[^']+'|"[^"]+"|\S+)\s+(?:(?:-\w+|\/[ckq]|--(?:command|execute))\s+)*/i, '');
      if (tail && tail !== stripped && !/^['"]/.test(tail)) clauses.push(...collectActiveClauses(tail, depth + 1));
    } else {
      clauses.push(stripped);
    }
  }
  return clauses;
}

function isUnsafeEnvToken(tok) {
  const clean = tok.replace(/^['"]|['"]$/g, '').replace(/\\/g, '/').split('/').pop().toLowerCase();
  return (clean === '.env' || clean.startsWith('.env')) && !SAFE_ENV_TEMPLATES.has(clean);
}

function touchesProtectedViaShell(clause) {
  for (const m of clause.matchAll(/>>?\s*(['"]?[^\s|;&'"]+['"]?)/g)) {
    const t = m[1];
    if (isUnsafeEnvToken(t) || /(?:^|[\\/])\.git(?:[\\/]|$)/i.test(t)) return true;
  }
  if (/\b(?:Set-Content|Add-Content|Out-File|sc|ac|tee)\b/i.test(clause)) {
    const tokens = clause.match(/'[^']*'|"[^"]*"|\S+/g) || [];
    if (tokens.some((t) => isUnsafeEnvToken(t) || /(?:^|[\\/])\.git(?:[\\/]|$)/i.test(t))) return true;
  }
  if (/^(?:cp|mv|copy-item|move-item|cpi|mi|copy|move)\b/i.test(clause)) {
    const positional = (clause.match(/'[^']*'|"[^"]*"|\S+/g) || []).slice(1).filter((t) => !t.startsWith('-'));
    const dest = positional[positional.length - 1] || '';
    if (isUnsafeEnvToken(dest) || /(?:^|[\\/])\.git(?:[\\/]|$)/i.test(dest)) return true;
  }
  if (/^(?:node|python3?|py|bun|deno)\b/i.test(clause) && /(?:writeFile|appendFile|copyFile|rename|unlink|rmSync|open\s*\(|write_text|write_bytes)/i.test(clause)) {
    for (const re of [/'([^']+)'/g, /"([^"]+)"/g, /`([^`]+)`/g]) {
      for (const m of clause.matchAll(re)) {
        if (isUnsafeEnvToken(m[1]) || /(?:^|[\\/])\.git(?:[\\/]|$)/i.test(m[1])) return true;
      }
    }
  }
  return false;
}

const DESTRUCTIVE_CHECKS = [
  ['rm -rf', (s) => /\brm(?:\.exe)?\b/i.test(s) && (/(?:^|\s)-[a-z]*(?:r[a-z]*f|f[a-z]*r)[a-z]*(?=\s|$)/i.test(s) || (/(?:^|\s)(?:-[a-z]*r[a-z]*|--recursive)(?=\s|$)/i.test(s) && /(?:^|\s)(?:-[a-z]*f[a-z]*|--force)(?=\s|$)/i.test(s)))],
  ['PowerShell Remove-Item/alias recursivo forzado', (s) => /\b(?:Remove-Item|ri|rm|rmdir|rd|del|erase)\b/i.test(s) && /(?:^|\s)-(?:Recurse|r)\b/i.test(s) && /(?:^|\s)(?:-(?:Force|fo)\b|-Confirm:\$false)/i.test(s)],
  ['cmd rd/rmdir/del /s /q', (s) => /\b(?:rmdir|rd|del|erase)\b/i.test(s) && /(?:^|\s)\/s(?=\s|\/|$)/i.test(s) && /(?:^|\s)\/q(?=\s|\/|$)/i.test(s)],
  ['borrado recursivo inline (fs.rmSync / shutil.rmtree)', (s) => /\b(?:rmSync|rm)\s*\([\s\S]*?\brecursive\s*:\s*true\b/.test(s) || /\bshutil\.rmtree\s*\(/.test(s)],
  ['git reset --hard', (s) => /\bgit(?:\.exe)?\b.*\breset\b.*(?:^|\s)--hard(?=\s|$)/i.test(s)],
  ['git checkout -f / --force', (s) => /\bgit(?:\.exe)?\b.*\bcheckout\b.*(?:^|\s)(?:-f|--force)(?=\s|$)/i.test(s)],
  ['git branch -D', (s) => /\bgit(?:\.exe)?\b.*\bbranch\b.*(?:^|\s)-D(?=\s|$)/.test(s)],
  ['git push --force / -f / +refspec', (s) => /\bgit(?:\.exe)?\b.*\bpush\b/.test(s) && (/(?:^|\s)(?:--force|-[a-zA-Z]*f[a-zA-Z]*)(?=\s|$)/.test(s) || /\bpush\b(?:\s+\S+)*\s+\+[A-Za-z0-9_./-]+(?=\s|$)/.test(s))],
  ['git clean -fd / -fdx', (s) => /\bgit(?:\.exe)?\b.*\bclean\b/i.test(s) && (/(?:^|\s)-[a-z]*(?:f[a-z]*d|d[a-z]*f)[a-z]*(?=\s|$)/i.test(s) || (/(?:^|\s)(?:-[a-z]*f[a-z]*|--force)(?=\s|$)/i.test(s) && /(?:^|\s)-[a-z]*d[a-z]*(?=\s|$)/i.test(s)))],
  ['DROP TABLE', (s) => /\bDROP\s+TABLE\b/i.test(s)],
  ['DROP DATABASE', (s) => /\bDROP\s+DATABASE\b/i.test(s)],
  ['TRUNCATE', (s) => /\bTRUNCATE\s+TABLE\b/i.test(s) || /\bTRUNCATE\s+(?!-)[A-Za-z_"`\[][\w"`\[\].]*\s*;?\s*$/i.test(s)],
  ['DELETE FROM sin WHERE', (s) => /\bDELETE\s+FROM\b/i.test(s) && !/\bWHERE\b/i.test(s)],
  ['prisma destructivo (migrate reset / --force-reset / --accept-data-loss)', (s) => /\bprisma(?:\.exe|\.cmd)?\b/i.test(s) && (/\bmigrate\s+reset\b/i.test(s) || (/\bdb\s+push\b/i.test(s) && /(?:^|\s)--(?:force-reset|accept-data-loss)(?=\s|$)/i.test(s)))],
  ['escritura por shell en ruta protegida (.env* / .git/**)', (s) => touchesProtectedViaShell(s)]
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

function hasVenvSegment(rawPath, includeLast = false) {
  const segs = String(rawPath || '').trim().replace(/^['"]|['"]$/g, '').replace(/\\/g, '/').split('/').filter((s) => s && s !== '.');
  const checkSegs = includeLast ? segs : segs.slice(0, -1);
  return checkSegs.some((s) => VENV_SEG_RE.test(s));
}

function isVenvActivationClause(seg) {
  const toks = (seg.replace(/^\{\s+/, '').replace(/\s*\}\s*$/, '').match(/'[^']*'|"[^"]*"|\S+/g) || [])
    .map((t) => t.replace(/^['"]|['"]$/g, ''))
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
  let subcommand = '', hasReadOnlyFlag = false, pythonTarget = '', hasUserFlag = false;
  for (let j = 0; j < pipArgs.length; j += 1) {
    const t = pipArgs[j];
    if (t === '--help' || t === '-h' || t === '--version' || t === '-V' || t === '--dry-run') hasReadOnlyFlag = true;
    else if (t === '--user') hasUserFlag = true;
    else if (t === '--python' && pipArgs[j + 1]) pythonTarget = pipArgs[++j];
    else if (t.startsWith('--python=')) pythonTarget = t.slice(9);
    else if (!subcommand && PIP_VALUE_OPTS_RE.test(t)) j += 1;
    else if (!t.startsWith('-') && !subcommand) subcommand = t.toLowerCase();
  }
  if (subcommand !== 'install' || hasReadOnlyFlag) return null;
  if (execInVenv) return null;
  if (pythonTarget && hasVenvSegment(pythonTarget, true)) return null;
  if (!explicitPath && !pythonTarget && !hasUserFlag && clauseVenv) return null;
  return 'pip install global sin entorno virtual (.venv)';
}

function checkClauseGlobalPip(seg, localVenv, envUvSystem) {
  const rawTokens = seg.replace(/^\{\s+/, '').replace(/\s*\}\s*$/, '').match(/'[^']*'|"[^"]*"|\S+/g) || [];
  let idx = 0, clauseVenv = localVenv, clauseUvSystem = envUvSystem;
  while (idx < rawTokens.length) {
    const u = rawTokens[idx].replace(/^['"]|['"]$/g, '');
    if (/^sudo$/i.test(u)) {
      clauseVenv = false;
      idx += 1;
      while (idx < rawTokens.length && /^-[A-Za-z]+$/.test(rawTokens[idx])) idx += 1;
      continue;
    }
    if (u === '&' || /^(?:env|command|nohup)$/i.test(u)) { idx += 1; continue; }
    if (/^[A-Za-z_]\w*=/.test(u)) {
      const [k, v = ''] = u.split('=', 2);
      const cleanVal = v.replace(/^['"]|['"]$/g, '').trim();
      if (k === 'VIRTUAL_ENV') clauseVenv = Boolean(cleanVal);
      if (k === 'UV_SYSTEM_PYTHON') clauseUvSystem = /^(?:1|true)$/i.test(cleanVal);
      idx += 1;
      continue;
    }
    break;
  }
  const tokens = rawTokens.slice(idx).filter((t) => !/^(?:\d*>>?|\d*<)/.test(t)).map((t) => t.replace(/^['"]|['"]$/g, ''));
  if (tokens.length === 0) return null;

  const execToken = tokens[0];
  const baseExec = execToken.replace(/\\/g, '/').split('/').pop().toLowerCase().replace(/\.(?:exe|cmd|bat)$/i, '');
  const explicitPath = /[\\/]/.test(execToken);
  const execInVenv = explicitPath && hasVenvSegment(execToken, false);

  if (baseExec === 'uv') {
    let i = 1;
    while (i < tokens.length && tokens[i].startsWith('-')) {
      if (/^--(?:directory|project|cache-dir|config-file|python-preference)$/.test(tokens[i])) i += 2;
      else i += 1;
    }
    if ((tokens[i] || '').toLowerCase() !== 'pip') return null;
    const rest = tokens.slice(i + 1);
    const uvPipSub = rest.find((t) => !t.startsWith('-'))?.toLowerCase() || '';
    if (uvPipSub !== 'install' && uvPipSub !== 'sync') return null;
    if (rest.some((t) => t === '--help' || t === '-h' || t === '--dry-run' || t === '--version' || t === '-V')) return null;
    if (clauseUvSystem || rest.some((t) => t === '--system' || t === '--system=true')) {
      return 'uv pip install --system (instalación en Python global del sistema)';
    }
    for (let j = 0; j < rest.length; j += 1) {
      const pyVal = (rest[j] === '--python' || rest[j] === '-p') ? rest[j + 1] : (rest[j].startsWith('--python=') ? rest[j].slice(9) : '');
      if (pyVal && /[\\/]/.test(pyVal) && !hasVenvSegment(pyVal, true)) {
        return 'uv pip install apuntando a intérprete Python global';
      }
    }
    return null;
  }

  if (/^pip(?:\d+(?:\.\d+)*)?$/.test(baseExec)) {
    return inspectPipInstallArgs(tokens.slice(1), execInVenv, explicitPath, clauseVenv);
  }

  if (/^(?:python(?:\d+(?:\.\d+)*)?|py)$/.test(baseExec)) {
    let k = 1, modName = '', pipArgs = [];
    while (k < tokens.length) {
      const pt = tokens[k];
      if (pt === '-m') { modName = tokens[k + 1] || ''; pipArgs = tokens.slice(k + 2); break; }
      if (pt.startsWith('-m') && pt.length > 2) { modName = pt.slice(2); pipArgs = tokens.slice(k + 1); break; }
      if (pt === '-c' || pt === '-' || !pt.startsWith('-')) break;
      if (pt === '-W' || pt === '-X' || pt === '--check-hash-based-pycs') { k += 2; continue; }
      k += 1;
    }
    if (/^pip(?:\d+(?:\.\d+)*)?$/i.test(modName)) {
      return inspectPipInstallArgs(pipArgs, execInVenv, explicitPath, clauseVenv);
    }
  }
  return null;
}

function scanPipScope(raw, depth, inheritedVenv, envUvSystem) {
  if (typeof raw !== 'string' || !raw.trim() || depth > 5) return null;
  for (const m of raw.replace(/'[^']*'/g, "''").matchAll(/\$\(([^)]+)\)|`([^`]+)`/g)) {
    const subHit = scanPipScope(m[1] || m[2], depth + 1, inheritedVenv, envUvSystem);
    if (subHit) return subHit;
  }
  const parts = splitTopClauses(raw);
  let localVenv = inheritedVenv;
  for (let idx = 0; idx < parts.length; idx += 1) {
    const seg = parts[idx].text.trim();
    const inner = unwrapOuterParens(seg);
    if (inner !== null) {
      const parenHit = scanPipScope(inner, depth + 1, localVenv, envUvSystem);
      if (parenHit) return parenHit;
      continue;
    }
    if (parts[idx].sep === '|' && /^(?:'[^']*'|"(?:\\.|[^"\\])*")$/.test(seg) && parts[idx + 1]) {
      const nextVerb = extractVerbName(parts[idx + 1].text.trim());
      if (!WRAPPER_VERBS.has(nextVerb)) continue;
    }
    const strippedForVerb = seg.replace(/^\{\s+/, '').replace(/\s*\}\s*$/, '').replace(/^(?:(?:[A-Za-z_]\w*=\S+|env|sudo|command|nohup|&)\s+)+/i, '');
    const verb = extractVerbName(strippedForVerb);
    if (['echo', 'printf', 'write-output', 'write-host'].includes(verb)) continue;
    if (verb === 'git' && /\bcommit\b/i.test(strippedForVerb)) continue;
    if (WRAPPER_VERBS.has(verb)) {
      for (const qm of strippedForVerb.matchAll(/'([^']*)'|"((?:\\.|[^"\\])*)"/g)) {
        const qHit = scanPipScope(qm[1] !== undefined ? qm[1] : qm[2].replace(/\\"/g, '"'), depth + 1, localVenv, envUvSystem);
        if (qHit) return qHit;
      }
      const tail = strippedForVerb.replace(/^(?:'[^']+'|"[^"]+"|\S+)\s+(?:(?:-\w+|\/[ckq]|--(?:command|execute))\s+)*/i, '');
      if (tail && tail !== strippedForVerb && !/^['"]/.test(tail)) {
        const tHit = scanPipScope(tail, depth + 1, localVenv, envUvSystem);
        if (tHit) return tHit;
      }
      continue;
    }
    if (isVenvActivationClause(seg)) {
      if (parts[idx].sep !== '||') localVenv = true;
      continue;
    }
    const rule = checkClauseGlobalPip(seg, localVenv, envUvSystem);
    if (rule) return { blocked: true, rule };
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

export function isCheckerSession(payload = {}) {
  if (payload?.isChecker === true) return true;
  const role = String(payload?.role ?? payload?.agentRole ?? payload?.subagentRole ?? payload?.agentType ?? payload?.subagentType ?? '').trim();
  if (role && !['user', 'assistant', 'system', 'tool', 'model'].includes(role.toLowerCase()) && CHECKER_ROLE_RE.test(role)) return true;
  const convId = String(payload?.conversationId ?? '').trim();
  if (EXPLICIT_CHECKER_ID_RE.test(convId) && /^(?:checker|evaluator|evaluador|independent-checker)/i.test(convId)) return true;
  if (CHECKER_PROMPT_RE.test(String(payload?.lastUserInput ?? ''))) return true;
  try {
    for (const [i, line] of readTranscriptLines(payload?.transcriptPath).slice(0, 5).entries()) {
      let obj = null; try { obj = JSON.parse(line); } catch { obj = null; }
      if (!obj) { if (i === 0 && CHECKER_PROMPT_RE.test(line)) return true; break; }
      if (obj.type === 'PLANNER_RESPONSE' || String(obj.role || '').toLowerCase() === 'assistant') break;
      if (CHECKER_PROMPT_RE.test([obj.content, obj.prompt, obj.message, obj.text, obj.userInput?.userResponse].filter(Boolean).join('\n'))) return true;
    }
  } catch { /* ignore */ }
  return false;
}

function classifyInvokeSpec(tcOrRaw) {
  if (tcOrRaw && typeof tcOrRaw === 'object') {
    let a = tcOrRaw.args ?? tcOrRaw.arguments ?? {};
    if (typeof a === 'string') { try { a = JSON.parse(a); } catch { a = {}; } }
    const role = String(a?.Role ?? a?.role ?? '').trim();
    const prompt = String(a?.Prompt ?? a?.prompt ?? '');
    if (CHECKER_ROLE_RE.test(role) || CHECKER_PROMPT_RE.test(prompt) || /checker-prompt\.md|evaluator-rubric\.md/i.test(prompt)) {
      return 'checker';
    }
    if (role && EXPLICIT_NON_CHECKER_ROLE_RE.test(role)) return 'non-checker';
    return 'non-checker';
  }
  const spec = String(tcOrRaw || '');
  const roleMatch = spec.match(/"(?:Role|role)"\s*:\s*"([^"]+)"/);
  const roleVal = roleMatch ? roleMatch[1].trim() : '';
  if (CHECKER_ROLE_RE.test(roleVal) || CHECKER_PROMPT_RE.test(spec) || /checker-prompt\.md|evaluator-rubric\.md/i.test(spec)) {
    return 'checker';
  }
  if (roleVal && EXPLICIT_NON_CHECKER_ROLE_RE.test(roleVal)) return 'non-checker';
  return 'non-checker';
}

export function isSendMessageToChecker(payload = {}, recipient = '', message = '') {
  if (EXPLICIT_CHECKER_ID_RE.test(recipient)) return { blocked: true, detail: `Recipient '${recipient}' es una instancia Checker` };
  const checkerMode = isCheckerSession(payload);
  let kind = 'unknown', parentSender = '';
  if (recipient) {
    try {
      const lines = readTranscriptLines(payload?.transcriptPath);
      if (lines[0] && /SYSTEM_MESSAGE/.test(lines[0])) {
        let first = lines[0]; try { first = String(JSON.parse(first)?.content || first); } catch { /* raw */ }
        parentSender = (first.match(/\bsender=(?!system\b)([^\s"'<>\\]+)/i) || ['', ''])[1];
      }
      if (parentSender && recipient === parentSender) return { blocked: false, detail: null };
      for (let i = 0; i < lines.length; i += 1) {
        const line = lines[i];
        const isPassive = /"type"\s*:\s*"(?:SYSTEM_MESSAGE|GENERIC|TOOL_RESPONSE|USER_INPUT)"/i.test(line);
        if (!isPassive && /\binvoke_?subagent\b|"invokeSubagent"\s*:/i.test(line)) {
          let step = null; try { step = JSON.parse(line); } catch { step = null; }
          if (Array.isArray(step?.tool_calls)) {
            for (let k = 0; k < step.tool_calls.length; k += 1) {
              const tc = step.tool_calls[k];
              const windowResp = lines.slice(i + 1, i + 4 + step.tool_calls.length).join('\n');
              if (/^invoke_?subagent$/i.test(String(tc?.name || '')) && (JSON.stringify(tc).includes(recipient) || windowResp.includes(recipient))) {
                kind = classifyInvokeSpec(tc);
              }
            }
          } else if (line.includes(recipient) || (Boolean(lines[i + 1]?.includes(recipient)) && !/\binvoke_?subagent\b/i.test(lines[i + 1] || ''))) {
            kind = classifyInvokeSpec(line);
          }
          if (kind === 'checker') break;
        } else if (kind === 'unknown' && i > 0 && recipient !== parentSender && /SYSTEM_MESSAGE/.test(line) && (line.includes(`sender=${recipient}`) || line.includes(`Subagent ${recipient}`)) && /\b(?:ACEPTAR|REVISAR|BLOQUEAR)\b/.test(line) && /\b(?:[0-9]|1[0-2])\s*\/\s*12\b/.test(line)) {
          kind = 'checker';
          break;
        }
      }
    } catch { /* ignore */ }
  }
  if (checkerMode) return kind === 'checker' ? { blocked: true, detail: `Recipient '${recipient}' es Checker` } : { blocked: false, detail: null };
  if (REAUDIT_MESSAGE_RE.test(message)) return { blocked: true, detail: 'Solicitud de re-auditoría en sesión existente' };
  return kind === 'checker' ? { blocked: true, detail: `Recipient '${recipient}' corresponde a un Checker previo en transcriptPath` } : { blocked: false, detail: null };
}
