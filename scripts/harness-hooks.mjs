#!/usr/bin/env node
import { spawnSync } from 'node:child_process';
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import {
  appendAuditLog, detectDestructiveCommand, detectGlobalPipInstall, extractToolContext, isCheckerSession, isJsoncPath,
  isPipVenvRequired, isProtectedTargetPath, isRubricTarget, isSendMessageToChecker, redactSecrets, redPenReason,
  resolveBashConfig, touchesRubricViaShell
} from './lib/harness-guards.mjs';
import { formatScoreReport, scoreHarness } from './lib/harness-utils.mjs';

const SCRIPT_FILE = fileURLToPath(import.meta.url);
export const REPO_ROOT = path.resolve(path.dirname(SCRIPT_FILE), '..');
export {
  detectDestructiveCommand, detectGlobalPipInstall, extractToolContext, isCheckerSession, isJsoncPath,
  isPipVenvRequired, isProtectedTargetPath, isRubricTarget, isSendMessageToChecker, redactSecrets, redPenReason,
  resolveBashConfig, touchesRubricViaShell
};

export function resolveTargetRoot(payload = {}, env = process.env) {
  const envRoot = typeof env.HARNESS_TARGET_ROOT === 'string' ? env.HARNESS_TARGET_ROOT.trim() : '';
  if (envRoot && fs.existsSync(path.resolve(envRoot))) return path.resolve(envRoot);
  const ws = Array.isArray(payload?.workspacePaths) ? String(payload.workspacePaths[0] || '').trim() : '';
  if (ws && fs.existsSync(ws) && ['init.sh', 'AGENTS.md', 'feature_list.json'].some((f) => fs.existsSync(path.join(path.resolve(ws), f)))) {
    return path.resolve(ws);
  }
  return REPO_ROOT;
}

export function readStdinPayload() {
  if (process.stdin.isTTY) return { ok: true, empty: true, payload: {} };
  let raw = '';
  try {
    raw = fs.readFileSync(0, 'utf8');
  } catch (err) {
    return err && ['EBADF', 'EINVAL', 'EOF', 'EAGAIN'].includes(err.code)
      ? { ok: true, empty: true, payload: {} }
      : { ok: false, empty: false, payload: {}, parseError: String(err?.message || err) };
  }
  if (!raw.trim()) return { ok: true, empty: true, payload: {} };
  try {
    const parsed = JSON.parse(raw.trim());
    return parsed && typeof parsed === 'object' && !Array.isArray(parsed)
      ? { ok: true, empty: false, payload: parsed }
      : { ok: false, empty: false, payload: {}, parseError: 'stdin root JSON must be an object' };
  } catch (err) {
    return { ok: false, empty: false, payload: {}, parseError: String(err?.message || err) };
  }
}

export function evaluatePreToolUse(stdinState, env = process.env) {
  const t0 = Date.now();
  const payload = stdinState.payload || {};
  const targetRoot = resolveTargetRoot(payload, env);
  const deny = (inputObj, reason) => {
    appendAuditLog(targetRoot, 'pre-tool-use', t0, inputObj, { decision: 'deny' }, reason, payload);
    return { decision: 'deny', reason };
  };
  if (!stdinState.ok) {
    return deny('invalid-stdin', redPenReason(`JSON inválido en stdin (${stdinState.parseError}).`, 'Fail-Closed prohíbe auto-aprobar entradas corruptas.', 'Envía un objeto JSON válido por stdin.'));
  }
  const ctx = extractToolContext(payload, stdinState.empty, env);
  if (stdinState.empty && !ctx.usedEnvFallback) {
    return deny('empty-stdin', redPenReason('Payload vacío en stdin durante PreToolUse.', 'El modelo Fail-Closed de docs/SECURITY.md prohíbe aprobar llamadas a herramientas sin contexto JSON.', 'Envía el objeto JSON de PreToolUse por stdin.'));
  }
  const allowRubric = env.HARNESS_ALLOW_RUBRIC_EDIT === '1' || isCheckerSession(payload);
  for (const target of ctx.isWriteEdit ? ctx.targetPaths : []) {
    const c = isProtectedTargetPath(target);
    if (c.blocked) {
      return deny({ tool: ctx.toolName, target }, redPenReason(`Escritura bloqueada en '${c.target}' (${c.category}).`, 'docs/SECURITY.md prohíbe editar .git/**, node_modules/**, .env* o rutas del sistema.', 'Usa .env.example / .env.sample / .env.template o solicita autorización al usuario.'));
    }
    if (isRubricTarget(target) && !allowRubric) {
      return deny({ tool: ctx.toolName, target }, redPenReason("Edición directa de 'evaluator-rubric.md' bloqueada en sesión Maker.", 'AGENTS.md y evaluator-rubric.md exigen aislamiento zero-inheritance: solo un sub-agente Checker one-shot aislado o el humano puede calificar la rúbrica.', 'Lanza una instancia invoke_subagent Checker one-shot virgen para evaluar y actualizar evaluator-rubric.md.'));
    }
  }
  if (ctx.isCommand && ctx.commandLine) {
    const c = detectDestructiveCommand(ctx.commandLine);
    if (c.blocked) {
      return deny({ tool: ctx.toolName, cmd: ctx.commandLine }, redPenReason(`Comando destructivo o escritura protegida bloqueada ('${c.rule}').`, 'docs/SECURITY.md prohíbe borrados recursivos forzados, reescrituras destructivas Git, mutaciones por shell a .env*/.git/** o SQL masivo sin WHERE.', 'Usa alternativas seguras como git restore --worktree --staged ., .env.example o DELETE FROM ... WHERE ....'));
    }
    if (!allowRubric && touchesRubricViaShell(ctx.commandLine)) {
      return deny({ tool: ctx.toolName, cmd: ctx.commandLine }, redPenReason("Mutación por shell de 'evaluator-rubric.md' bloqueada en sesión Maker.", 'AGENTS.md y evaluator-rubric.md exigen aislamiento zero-inheritance: solo un sub-agente Checker one-shot aislado puede calificar la rúbrica.', 'Lanza una instancia invoke_subagent Checker one-shot virgen para evaluar y actualizar evaluator-rubric.md.'));
    }
    const pipCheck = detectGlobalPipInstall(ctx.commandLine, { targetRoot, env });
    if (pipCheck.blocked) {
      return deny({ tool: ctx.toolName, cmd: ctx.commandLine }, redPenReason(`Instalación global con pip bloqueada (${pipCheck.rule}).`, 'Instalar paquetes en el Python global contamina el sistema operativo del usuario y rompe el aislamiento reproducible entre proyectos.', 'Crea y usa el entorno virtual local .venv: ejecuta `python -m venv .venv` y luego `.venv/Scripts/python -m pip install <paquete>` (Windows) o `.venv/bin/python -m pip install <paquete>` (Linux/macOS), o bien `uv venv && uv pip install <paquete>`.'));
    }
  }
  if (ctx.isSendMessage) {
    const c = isSendMessageToChecker(payload, ctx.recipient, ctx.message);
    if (c.blocked) {
      return deny({ tool: ctx.toolName, recipient: ctx.recipient }, redPenReason(`Reutilización de Checker vía send_message bloqueada (${c.detail}).`, 'AGENTS.md exige 1 Checker = 1 sola auditoría (one-shot / zero-inheritance).', 'Lanza una instancia invoke_subagent completamente nueva con ventana virgen.'));
    }
  }
  appendAuditLog(targetRoot, 'pre-tool-use', t0, { tool: ctx.toolName }, { decision: 'allow' }, null, payload);
  return { decision: 'allow' };
}

export function executePostToolUse(stdinState, env = process.env, agyMode = false) {
  const t0 = Date.now();
  const payload = stdinState.payload || {};
  const targetRoot = resolveTargetRoot(payload, env);
  if (!stdinState.ok) {
    appendAuditLog(targetRoot, 'post-tool-use', t0, 'invalid-stdin', {}, redPenReason(`JSON inválido en stdin (${stdinState.parseError}).`, 'PostToolUse recibió un payload corrupto.', 'Envía un objeto JSON válido por stdin.'), payload);
    return {};
  }
  const ctx = extractToolContext(payload, stdinState.empty, env);
  let loggedError = false;
  for (const rawTarget of ctx.targetPaths) {
    if (!rawTarget.toLowerCase().endsWith('.json') || isJsoncPath(rawTarget)) continue;
    const fullPath = path.isAbsolute(rawTarget) ? rawTarget : path.resolve(targetRoot, rawTarget);
    if (!fs.existsSync(fullPath)) continue;
    try {
      JSON.parse(fs.readFileSync(fullPath, 'utf8'));
    } catch (err) {
      loggedError = true;
      const msg = redPenReason(`JSON inválido en '${rawTarget}' (${err.message}).`, 'Un JSON corrupto rompe validadores y esquemas del arnés.', `Corrige la sintaxis JSON en '${rawTarget}'.`);
      if (!agyMode) process.stderr.write(`[PostToolUse JSON] ${msg}\n`);
      appendAuditLog(targetRoot, 'post-tool-use', t0, { tool: ctx.toolName, target: rawTarget }, {}, msg, payload);
    }
  }
  if (!loggedError) appendAuditLog(targetRoot, 'post-tool-use', t0, { tool: ctx.toolName || 'none', targets: ctx.targetPaths }, {}, null, payload);
  return {};
}

export function executePreInvocation(stdinState, env = process.env, action = 'pre-invocation') {
  const t0 = Date.now();
  const payload = stdinState.payload || {};
  const targetRoot = resolveTargetRoot(payload, env);
  if (!stdinState.ok) {
    appendAuditLog(targetRoot, action, t0, 'invalid-stdin', {}, redPenReason(`JSON inválido en stdin (${stdinState.parseError}).`, 'PreInvocation recibió un payload corrupto.', 'Envía un objeto JSON válido por stdin.'), payload);
    return {};
  }
  appendAuditLog(targetRoot, action, t0, { invocationNum: payload.invocationNum ?? null, lastUserInput: payload.lastUserInput ?? payload.prompt ?? '' }, {}, null, payload);
  return {};
}

export function evaluateStopGate(stdinState, env = process.env) {
  const t0 = Date.now();
  const payload = stdinState.payload || {};
  const targetRoot = resolveTargetRoot(payload, env);
  if (!stdinState.ok) {
    const reason = redPenReason(`JSON inválido en stdin (${stdinState.parseError}).`, 'Fail-Closed prohíbe cerrar turno con payload corrupto.', 'Envía un objeto JSON válido por stdin.');
    appendAuditLog(targetRoot, 'stop', t0, 'invalid-stdin', { decision: 'continue' }, reason, payload);
    return { decision: 'continue', reason };
  }
  const termReason = typeof payload.terminationReason === 'string' ? payload.terminationReason.trim() : '';
  if ((termReason && termReason !== 'NO_TOOL_CALL') || payload.fullyIdle === false || isCheckerSession(payload)) {
    appendAuditLog(targetRoot, 'stop', t0, { terminationReason: termReason || 'NO_TOOL_CALL', fullyIdle: payload.fullyIdle ?? true, bypass: true }, { decision: 'stop' }, null, payload);
    return { decision: 'stop' };
  }
  const files = ['AGENTS.md', 'CLAUDE.md', 'feature_list.json', 'feature-list.json', 'progress.md', 'session-handoff.md', 'init.sh']
    .filter((f) => fs.existsSync(path.join(targetRoot, f)))
    .map((f) => ({ path: f, content: fs.readFileSync(path.join(targetRoot, f), 'utf8') }));
  const scoreRes = scoreHarness(files, targetRoot);
  if (scoreRes.overall < 100) {
    const reason = redPenReason(`Puntaje del arnés ${scoreRes.overall}/100 (< 100).`, 'La Puerta 2 exige 100/100 (WIP <= 1, DAG y Pass-State Gating) antes de detenerse.', `Corrige las fallas:\n${formatScoreReport(scoreRes, targetRoot).slice(-650)}`);
    appendAuditLog(targetRoot, 'stop', t0, 'gate-2', { decision: 'continue' }, reason, payload);
    return { decision: 'continue', reason };
  }
  const { bashBin, extraPathDirs } = resolveBashConfig(env);
  const childEnv = {
    ...env,
    HARNESS_SKIP_INSTALL: '1',
    ...(extraPathDirs.length ? { PATH: [...extraPathDirs, env.PATH || env.Path || ''].filter(Boolean).join(path.delimiter) } : {})
  };
  let isGitClean = false;
  if (fs.existsSync(path.join(targetRoot, '.git'))) {
    const gitRes = spawnSync('git', ['status', '--porcelain'], { cwd: targetRoot, encoding: 'utf8', timeout: 5000 });
    isGitClean = gitRes.status === 0 && gitRes.stdout.trim() === '';
  }
  const hasInitSh = fs.existsSync(path.join(targetRoot, 'init.sh'));
  const scriptToRun = hasInitSh ? 'init.sh' : 'scripts/validate-harness.mjs';
  const gateRes = hasInitSh
    ? spawnSync(bashBin, ['init.sh'], { cwd: targetRoot, env: childEnv, encoding: 'utf8', timeout: 45000 })
    : spawnSync(process.execPath, [path.join(targetRoot, 'scripts', 'validate-harness.mjs')], { cwd: targetRoot, env: childEnv, encoding: 'utf8', timeout: 30000 });
  if (gateRes.error || gateRes.status !== 0) {
    const detail = [gateRes.stdout, gateRes.stderr, gateRes.error?.message].filter(Boolean).join('\n').trim().slice(-650);
    const reason = redPenReason(`Fallo al ejecutar '${scriptToRun}' en Stop (exit ${gateRes.status ?? 1}).`, 'AGENTS.md prohíbe cerrar turno con pruebas rotas, violaciones arquitectónicas o entregables incompletos incluso con árbol Git limpio.', `Repara el error y verifica 'bash ./init.sh':\n${detail}`);
    appendAuditLog(targetRoot, 'stop', t0, { scriptToRun, isGitClean }, { decision: 'continue' }, reason, payload);
    return { decision: 'continue', reason };
  }
  appendAuditLog(targetRoot, 'stop', t0, { scriptToRun, isGitClean }, { decision: 'stop' }, null, payload);
  return { decision: 'stop' };
}

export function runCli(argv = process.argv.slice(2), env = process.env) {
  const agyMode = argv.includes('--agy');
  const posArgs = argv.filter((a) => a !== '--agy');
  const cmd = String(posArgs[0] || '').trim().toLowerCase();
  const stdinState = readStdinPayload();
  if (cmd === 'pre-tool-use' || cmd === 'pretooluse') {
    const res = evaluatePreToolUse(stdinState, env);
    process.stdout.write(`${JSON.stringify(res)}\n`);
    if (!agyMode && res.decision === 'deny') { process.stderr.write(`${res.reason}\n`); return 2; }
    return 0;
  }
  if (cmd === 'post-tool-use' || cmd === 'posttooluse') {
    process.stdout.write(`${JSON.stringify(executePostToolUse(stdinState, env, agyMode))}\n`);
    return 0;
  }
  if (['pre-invocation', 'preinvocation', 'user-prompt-submit', 'userpromptsubmit', 'session-start', 'sessionstart', 'post-invocation', 'postinvocation'].includes(cmd)) {
    process.stdout.write(`${JSON.stringify(executePreInvocation(stdinState, env, cmd))}\n`);
    return 0;
  }
  if (cmd === 'stop') {
    const res = evaluateStopGate(stdinState, env);
    process.stdout.write(`${JSON.stringify(res)}\n`);
    if (!agyMode && res.decision === 'continue') { process.stderr.write(`${res.reason}\n`); return 2; }
    return 0;
  }
  const reason = redPenReason(`Subcomando desconocido '${posArgs[0] || ''}'.`, 'Solo se admiten pre-invocation, pre-tool-use, post-tool-use y stop.', 'Usa node ../scripts/harness-hooks.mjs <evento>.');
  appendAuditLog(resolveTargetRoot(stdinState.payload || {}, env), 'unknown-command', Date.now(), { cmd }, { decision: 'deny' }, reason, stdinState.payload || {});
  process.stdout.write(`${JSON.stringify({ decision: 'deny', reason })}\n`);
  if (!agyMode) { process.stderr.write(`${reason}\n`); return 1; }
  return 0;
}

if (process.argv[1] && path.resolve(process.argv[1]) === SCRIPT_FILE) { process.exitCode = runCli(); }
