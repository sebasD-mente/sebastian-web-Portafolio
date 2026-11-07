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

export const redPenReason = (error, why, fix) => `ERROR: ${error}\nPOR QUÉ: ${why}\nSOLUCIÓN (FIX): ${fix}`;

export function redactSecrets(value) {
  const raw = typeof value === 'string' ? value : JSON.stringify(value ?? '');
  return raw
    .replace(/((?:api[_-]?key|token|secret|password|authorization|cookie)\s*[:=]\s*)(['"]?)[^\s'",;]+(\2)/gi, '$1[REDACTED]')
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
      const nextVerb = (parts[idx + 1].text.match(/^\S+/) || [''])[0].replace(/\\/g, '/').split('/').pop().toLowerCase().replace(/\.exe$/, '');
      if (!WRAPPER_VERBS.has(nextVerb)) continue;
    }
    const stripped = seg.replace(/^\{\s+/, '').replace(/\s*\}\s*$/, '').replace(/^(?:(?:[A-Za-z_]\w*=\S+|env|sudo|command|nohup|&)\s+)+/i, '');
    const verb = (stripped.match(/^([^\s"']+)/) || ['', ''])[1].replace(/\\/g, '/').split('/').pop().toLowerCase().replace(/\.exe$/, '');
    if (['echo', 'printf', 'write-output', 'write-host'].includes(verb)) {
      clauses.push(stripped.replace(/'[^']*'|"(?:\\.|[^"\\])*"/g, '""'));
    } else if (verb === 'git' && /\bcommit\b/i.test(stripped)) {
      clauses.push(stripped.replace(/(-[a-zA-Z]*m|--message(?:=|\s+))\s*(?:'[^']*'|"(?:\\.|[^"\\])*")/g, '$1 ""'));
    } else if (WRAPPER_VERBS.has(verb)) {
      for (const qm of stripped.matchAll(/'([^']*)'|"((?:\\.|[^"\\])*)"/g)) {
        clauses.push(...collectActiveClauses(qm[1] !== undefined ? qm[1] : qm[2].replace(/\\"/g, '"'), depth + 1));
      }
      const tail = stripped.replace(/^\S+\s+(?:(?:-\w+|\/[ckq]|--(?:command|execute))\s+)*/i, '');
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
  // 1. Redirection > or >> into .env* or .git/
  for (const m of clause.matchAll(/>>?\s*(['"]?[^\s|;&'"]+['"]?)/g)) {
    const t = m[1];
    if (isUnsafeEnvToken(t) || /(?:^|[\\/])\.git(?:[\\/]|$)/i.test(t)) return true;
  }
  // 2. PowerShell / POSIX file writers targeting .env* or .git/
  if (/\b(?:Set-Content|Add-Content|Out-File|sc|ac|tee)\b/i.test(clause)) {
    const tokens = clause.match(/['"][^'"]+['"]|\S+/g) || [];
    if (tokens.some((t) => isUnsafeEnvToken(t) || /(?:^|[\\/])\.git(?:[\\/]|$)/i.test(t))) return true;
  }
  // 3. cp / mv / Copy-Item / Move-Item where destination (last non-flag token) is .env* or .git/
  if (/^(?:cp|mv|copy-item|move-item|cpi|mi|copy|move)\b/i.test(clause)) {
    const positional = (clause.match(/['"][^'"]+['"]|\S+/g) || []).slice(1).filter((t) => !t.startsWith('-'));
    const dest = positional[positional.length - 1] || '';
    if (isUnsafeEnvToken(dest) || /(?:^|[\\/])\.git(?:[\\/]|$)/i.test(dest)) return true;
  }
  // 4. Inline node / python file mutation targeting .env* or .git/
  if (/^(?:node|python3?|py)\b/i.test(clause) && /(?:writeFile|appendFile|copyFile|rename|unlink|rmSync|open\s*\()/i.test(clause)) {
    for (const m of clause.matchAll(/['"]([^'"]+)['"]/g)) {
      if (isUnsafeEnvToken(m[1]) || /(?:^|[\\/])\.git(?:[\\/]|$)/i.test(m[1])) return true;
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
