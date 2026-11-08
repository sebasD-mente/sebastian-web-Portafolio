import type {
  RuntimeLogEntry,
  RuntimeLogError,
  RuntimeLogLevel
} from "@/types/portfolio";

const SECRET_KEY_RE = /(?:secret|token|password|api[_-]?key|authorization|cookie|private[_-]?key)/i;
const SECRET_VALUE_RE = /\b(?:sk-proj-[A-Za-z0-9_-]{8,}|sk_live_[A-Za-z0-9]{8,}|gh[pousr]_[A-Za-z0-9_]{12,}|AIza[0-9A-Za-z_-]{16,})\b/g;

export function redactSecrets(value: unknown): unknown {
  if (typeof value === "string") {
    return value.replace(SECRET_VALUE_RE, "[REDACTED]");
  }
  if (Array.isArray(value)) {
    return value.map((item) => redactSecrets(item));
  }
  if (value && typeof value === "object") {
    const out: Record<string, unknown> = {};
    for (const [k, v] of Object.entries(value as Record<string, unknown>)) {
      if (SECRET_KEY_RE.test(k)) {
        out[k] = "[REDACTED]";
      } else {
        out[k] = redactSecrets(v);
      }
    }
    return out;
  }
  return value;
}

export function createCorrelationId(prefix = "req"): string {
  const randomHex = Math.random().toString(16).slice(2, 8).padEnd(6, "0");
  return `${prefix}-${randomHex}`;
}

export interface BuildRuntimeLogParams {
  level: RuntimeLogLevel;
  component: string;
  action: string;
  durationMs: number;
  input: Record<string, unknown> | string;
  output?: Record<string, unknown> | null;
  error?: RuntimeLogError | null;
  correlationId?: string;
}

export function buildRuntimeLogEntry(params: BuildRuntimeLogParams): RuntimeLogEntry {
  const sanitizedInput =
    typeof params.input === "string"
      ? (redactSecrets(params.input) as string)
      : (redactSecrets(params.input) as Record<string, unknown>);

  const sanitizedOutput = params.output
    ? (redactSecrets(params.output) as Record<string, unknown>)
    : null;

  const sanitizedError: RuntimeLogError | null = params.error
    ? {
        message: redactSecrets(params.error.message) as string,
        why: redactSecrets(params.error.why) as string,
        fix: redactSecrets(params.error.fix) as string
      }
    : null;

  return {
    timestamp: new Date().toISOString(),
    level: params.level,
    component: params.component,
    action: params.action,
    durationMs: Math.max(0, Math.round(params.durationMs)),
    input: sanitizedInput,
    output: sanitizedOutput,
    error: sanitizedError,
    correlationId: params.correlationId ?? createCorrelationId("dekolabs")
  };
}

export function serializeRuntimeLog(params: BuildRuntimeLogParams): string {
  return JSON.stringify(buildRuntimeLogEntry(params));
}
