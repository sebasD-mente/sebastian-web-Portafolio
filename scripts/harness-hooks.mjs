#!/usr/bin/env node
import { spawnSync } from 'node:child_process';
import crypto from 'node:crypto';
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import {
  detectDestructiveCommand, detectGlobalPipInstall, extractToolContext, isCheckerSession,
  isPipVenvRequired, isProtectedTargetPath, isRubricTarget, isSendMessageToChecker, redactSecrets, redPenReason
} from './lib/harness-guards.mjs';
import { formatScoreReport, scoreHarness } from './lib/harness-utils.mjs';

const SCRIPT_FILE = fileURLToPath(import.meta.url);
export const REPO_ROOT = path.resolve(path.dirname(SCRIPT_FILE), '..');
export {
  detectDestructiveCommand, detectGlobalPipInstall, extractToolContext, isCheckerSession,
  isPipVenvRequired, isProtectedTargetPath, isSendMessageToChecker, redPenReason
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

function appendAuditLog(targetRoot, action, startMs, inputSummary, outputObj, errorMsg = null, payload = {}) {
  try {
    const logDir = path.join(targetRoot, '.agents', '.runtime');
    fs.mkdirSync(logDir, { recursive: true });
    const entry = {
      timestamp: new Date().toISOString(),
      level: errorMsg ? 'error' : 'info',
      component: 'HarnessHooks',
      action,
      durationMs: Math.max(0, Date.now() - startMs),
      input: redactSecrets(inputSummary),
      output: errorMsg ? null : outputObj,
      error: errorMsg ? { message: redactSecrets(errorMsg) } : null,
      correlationId: String(payload?.conversationId || `hook-${crypto.randomUUID().slice(0, 8)}`)
    };
    fs.appendFileSync(path.join(logDir, 'hook-audit.jsonl'), `${JSON.stringify(entry)}\n`, 'utf8');
  } catch { /* never fail hook on telemetry I/O */ }
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
  const targetRoot = resolveTargetRoot(stdinState.payload || {}, env);
  if (!stdinState.ok) {
    const reason = redPenReason(`JSON inválido en stdin (${stdinState.parseError}).`, 'Fail-Closed prohíbe auto-aprobar entradas corruptas.', 'Envía un objeto JSON válido por stdin.');
    appendAuditLog(targetRoot, 'pre-tool-use', t0, 'invalid-stdin', null, reason);
    return { decision: 'deny', reason };
  }
  const ctx = extractToolContext(stdinState.payload, stdinState.empty, env);
  for (const target of ctx.isWriteEdit ? ctx.targetPaths : []) {
    const c = isProtectedTargetPath(target);
    if (c.blocked) {
      const reason = redPenReason(`Escritura bloqueada en '${c.target}' (${c.category}).`, 'docs/SECURITY.md prohíbe editar .git/**, node_modules/**, .env* o rutas del sistema.', 'Usa .env.example / .env.sample / .env.template o solicita autorización al usuario.');
      appendAuditLog(targetRoot, 'pre-tool-use', t0, { tool: ctx.toolName, target }, null, reason, stdinState.payload);
      return { decision: 'deny', reason };
    }
    if (isRubricTarget(target) && !isCheckerSession(stdinState.payload) && env.HARNESS_ALLOW_RUBRIC_EDIT !== '1') {
      const reason = redPenReason(`Edición directa de 'evaluator-rubric.md' bloqueada en sesión Maker.`, 'AGENTS.md y evaluator-rubric.md exigen aislamiento zero-inheritance: solo un sub-agente Checker one-shot aislado o el humano puede calificar la rúbrica.', 'Lanza una instancia invoke_subagent Checker one-shot virgen para evaluar y actualizar evaluator-rubric.md.');
      appendAuditLog(targetRoot, 'pre-tool-use', t0, { tool: ctx.toolName, target }, null, reason, stdinState.payload);
      return { decision: 'deny', reason };
    }
  }
  if (ctx.isCommand && ctx.commandLine) {
    const c = detectDestructiveCommand(ctx.commandLine);
    if (c.blocked) {
      const reason = redPenReason(`Comando destructivo o escritura protegida bloqueada ('${c.rule}').`, 'docs/SECURITY.md prohíbe borrados recursivos forzados, reescrituras destructivas Git, mutaciones por shell a .env*/.git/** o SQL masivo sin WHERE.', 'Usa alternativas seguras como git restore --worktree --staged ., .env.example o DELETE FROM ... WHERE ....');
      appendAuditLog(targetRoot, 'pre-tool-use', t0, { tool: ctx.toolName, cmd: ctx.commandLine }, null, reason, stdinState.payload);
      return { decision: 'deny', reason };
    }
    const pipCheck = detectGlobalPipInstall(ctx.commandLine, { targetRoot, env });
    if (pipCheck.blocked) {
      const reason = redPenReason(`Instalación global con pip bloqueada (${pipCheck.rule}).`, 'Instalar paquetes en el Python global contamina el sistema operativo del usuario y rompe el aislamiento reproducible entre proyectos.', 'Crea y usa el entorno virtual local .venv: ejecuta `python -m venv .venv` y luego `.venv/Scripts/python -m pip install <paquete>` (Windows) o `.venv/bin/python -m pip install <paquete>` (Linux/macOS), o bien `uv venv && uv pip install <paquete>`.');
      appendAuditLog(targetRoot, 'pre-tool-use', t0, { tool: ctx.toolName, cmd: ctx.commandLine }, null, reason, stdinState.payload);
      return { decision: 'deny', reason };
    }
  }
  if (ctx.isSendMessage) {
    const c = isSendMessageToChecker(stdinState.payload, ctx.recipient, ctx.message);
    if (c.blocked) {
      const reason = redPenReason(`Reutilización de Checker vía send_message bloqueada (${c.detail}).`, 'AGENTS.md exige 1 Checker = 1 sola auditoría (one-shot / zero-inheritance).', 'Lanza una instancia invoke_subagent completamente nueva con ventana virgen.');
      appendAuditLog(targetRoot, 'pre-tool-use', t0, { tool: ctx.toolName, recipient: ctx.recipient }, null, reason, stdinState.payload);
      return { decision: 'deny', reason };
    }
  }
  appendAuditLog(targetRoot, 'pre-tool-use', t0, { tool: ctx.toolName }, { decision: 'allow' }, null, stdinState.payload);
  return { decision: 'allow' };
}

export function executePostToolUse(stdinState, env = process.env) {
  const t0 = Date.now();
  if (!stdinState.ok) return {};
  const targetRoot = resolveTargetRoot(stdinState.payload, env);
  for (const rawTarget of extractToolContext(stdinState.payload, stdinState.empty, env).targetPaths) {
    if (!rawTarget.toLowerCase().endsWith('.json')) continue;
    const fullPath = path.isAbsolute(rawTarget) ? rawTarget : path.resolve(targetRoot, rawTarget);
    if (!fs.existsSync(fullPath)) continue;
    try {
      JSON.parse(fs.readFileSync(fullPath, 'utf8'));
    } catch (err) {
      const msg = redPenReason(`JSON inválido en '${rawTarget}' (${err.message}).`, 'Un JSON corrupto rompe validadores y esquemas del arnés.', `Corrige la sintaxis JSON en '${rawTarget}'.`);
      process.stderr.write(`[PostToolUse JSON] ${msg}\n`);
      appendAuditLog(targetRoot, 'post-tool-use', t0, { target: rawTarget }, null, msg, stdinState.payload);
    }
  }
  return {};
}

export function evaluateStopGate(stdinState, env = process.env) {
  const t0 = Date.now();
  const payload = stdinState.payload || {};
  const targetRoot = resolveTargetRoot(payload, env);
  if (!stdinState.ok) {
    const reason = redPenReason(`JSON inválido en stdin (${stdinState.parseError}).`, 'Fail-Closed prohíbe cerrar turno con payload corrupto.', 'Envía un objeto JSON válido por stdin.');
    appendAuditLog(targetRoot, 'stop', t0, 'invalid-stdin', null, reason, payload);
    return { decision: 'continue', reason };
  }
  const termReason = typeof payload.terminationReason === 'string' ? payload.terminationReason.trim() : '';
  if ((termReason && termReason !== 'NO_TOOL_CALL') || payload.fullyIdle === false || isCheckerSession(payload)) {
    return { decision: 'stop' };
  }

  const files = ['AGENTS.md', 'CLAUDE.md', 'feature_list.json', 'feature-list.json', 'progress.md', 'session-handoff.md', 'init.sh']
    .filter((f) => fs.existsSync(path.join(targetRoot, f)))
    .map((f) => ({ path: f, content: fs.readFileSync(path.join(targetRoot, f), 'utf8') }));
  const scoreRes = scoreHarness(files, targetRoot);
  if (scoreRes.overall < 100) {
    const reason = redPenReason(`Puntaje del arnés ${scoreRes.overall}/100 (< 100).`, 'La Puerta 2 exige 100/100 (WIP <= 1, DAG y Pass-State Gating) antes de detenerse.', `Corrige las fallas:\n${formatScoreReport(scoreRes, targetRoot).slice(-900)}`);
    appendAuditLog(targetRoot, 'stop', t0, 'gate-2', null, reason, payload);
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

  const scriptToRun = isGitClean ? 'scripts/check-architecture.sh' : './init.sh';
  const gateRes = spawnSync(bashBin, [scriptToRun], { cwd: targetRoot, env: childEnv, encoding: 'utf8', timeout: 55000 });
  if (gateRes.status !== 0) {
    const reason = redPenReason(`Fallo al ejecutar '${scriptToRun}' en Stop (exit ${gateRes.status ?? 1}).`, 'AGENTS.md prohíbe cerrar turno con violaciones arquitectónicas, temporales residuales o puertas rotas.', `Repara el error y verifica 'bash ./init.sh':\n${[gateRes.stdout, gateRes.stderr].filter(Boolean).join('\n').trim().slice(-900)}`);
    appendAuditLog(targetRoot, 'stop', t0, { scriptToRun }, null, reason, payload);
    return { decision: 'continue', reason };
  }

  if (isGitClean) {
    for (const extraScript of ['scripts/check-deliverables.mjs', 'scripts/check-python.mjs']) {
      if (!fs.existsSync(path.join(targetRoot, extraScript))) continue;
      const subRes = spawnSync(process.execPath, [extraScript, '--root', targetRoot], { cwd: targetRoot, env: childEnv, encoding: 'utf8', timeout: 30000 });
      if (subRes.status !== 0) {
        const reason = redPenReason(`Fallo al ejecutar '${extraScript}' en Stop (exit ${subRes.status ?? 1}).`, 'AGENTS.md prohíbe cerrar turno con entregables incompletos ([PENDIENTE]/enlaces rotos) o errores AST/secretos Python.', `Repara el hallazgo y verifica 'bash ./init.sh':\n${[subRes.stdout, subRes.stderr].filter(Boolean).join('\n').trim().slice(-900)}`);
        appendAuditLog(targetRoot, 'stop', t0, { scriptToRun: extraScript }, null, reason, payload);
        return { decision: 'continue', reason };
      }
    }
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
  if (cmd === 'post-tool-use' || cmd === 'posttooluse') { process.stdout.write(`${JSON.stringify(executePostToolUse(stdinState, env))}\n`); return 0; }
  if (cmd === 'stop') {
    const res = evaluateStopGate(stdinState, env);
    process.stdout.write(`${JSON.stringify(res)}\n`);
    if (!agyMode && res.decision === 'continue') { process.stderr.write(`${res.reason}\n`); return 2; }
    return 0;
  }
  process.stdout.write(`${JSON.stringify({ decision: 'deny', reason: redPenReason(`Subcomando desconocido '${posArgs[0] || ''}'.`, 'Solo se admiten pre-tool-use, post-tool-use y stop.', 'Usa node ../scripts/harness-hooks.mjs <evento>.') })}\n`);
  return 1;
}

if (process.argv[1] && path.resolve(process.argv[1]) === SCRIPT_FILE) { process.exitCode = runCli(); }
