#!/usr/bin/env node
import path from 'node:path';
import {
  formatScoreReport,
  htmlReport,
  loadHarnessFiles,
  parseArgs,
  scoreHarness,
  validateHarnessConfig,
  writeText
} from './lib/harness-utils.mjs';

const args = parseArgs(process.argv.slice(2));

if (args.help) {
  console.log(`Usage: node scripts/validate-harness.mjs [--target DIR] [--min-score N] [--json] [--html FILE]

Scores a project harness across five subsystems:
  instructions, state, verification, scope, lifecycle

Exit code is 0 when harness.config.json is valid and the harness scores at least --min-score (default 100).`);
  process.exit(0);
}

const target = path.resolve(args.target || args._[0] || process.cwd());
const minScore = args.minScore !== undefined ? Number(args.minScore) : 100;
if (!Number.isFinite(minScore) || minScore < 0 || minScore > 100) {
  console.error(`ERROR: Valor inválido para '--min-score' (${JSON.stringify(args.minScore)}).`);
  console.error('POR QUÉ: El umbral de calificación de la Puerta 2 debe ser un número finito entre 0 y 100.');
  console.error("SOLUCIÓN (FIX): Ejecuta 'node scripts/validate-harness.mjs --min-score 100' con un valor numérico válido.");
  process.exit(1);
}

const cfgCheck = validateHarnessConfig(target);
const files = await loadHarnessFiles(target);
const result = scoreHarness(files, target);

if (args.html) {
  const htmlPath = path.resolve(args.html);
  await writeText(htmlPath, htmlReport(result, `Harness Assessment: ${path.basename(target)}`));
  console.log(`HTML report written to ${htmlPath}`);
}

if (args.json) {
  console.log(JSON.stringify(result, null, 2));
} else {
  console.log(formatScoreReport(result, target));
}

if (!cfgCheck.ok) {
  console.error(`ERROR: ${cfgCheck.error}`);
  console.error(`POR QUÉ: ${cfgCheck.why}`);
  console.error(`SOLUCIÓN (FIX): ${cfgCheck.fix}`);
  process.exitCode = 1;
} else if (result.overall < minScore) {
  const failedChecks = Object.entries(result.subsystems)
    .flatMap(([sub, s]) => s.checks.filter((c) => !c.pass).map((c) => `[${sub}] ${c.message}`));
  console.error(`ERROR: Puntaje del arnés insuficiente (${result.overall}/100 < mínimo requerido ${minScore}/100; cuello de botella: ${result.bottleneck ?? 'múltiple'}).`);
  console.error(`POR QUÉ: La Puerta 2 exige cumplir los invariantes de los 5 subsistemas antes de avanzar (${failedChecks.slice(0, 3).join('; ') || 'verificaciones en FAIL'}).`);
  console.error(`SOLUCIÓN (FIX): Repara los ítems en FAIL reportados arriba en '${target}' y re-ejecuta 'node scripts/validate-harness.mjs --min-score ${minScore}'.`);
  process.exitCode = 1;
}
