import { createHmac, scryptSync, timingSafeEqual } from "node:crypto";
import {
  ADMIN_ACCESS_KEY_PLACEHOLDER,
  ADMIN_LOGIN_LOCKOUT_MS,
  ADMIN_LOGIN_MAX_ATTEMPTS,
  ADMIN_LOGIN_WINDOW_MS,
  ADMIN_SESSION_COOKIE_NAME,
  getAdminAuthConfig
} from "@/config/site.config";
import type {
  AdminAuthConfig,
  AdminAuthConfigOverrides,
  AdminLoginInput,
  AdminRateLimitStatus,
  AdminSessionClaims,
  AdminSessionVerificationResult
} from "@/types/portfolio";

const BASE64URL_SEGMENT_RE = /^[A-Za-z0-9_-]+$/;
const SCRYPT_KEYLEN_BYTES = 32;
const DEFAULT_MAX_TRACKED_IPS = 2000;

export interface LoginRateLimiterOptions {
  maxAttempts?: number;
  windowMs?: number;
  lockoutMs?: number;
  maxTrackedIps?: number;
}

export interface LoginRateLimiter {
  check(ip: string, nowMs?: number): AdminRateLimitStatus;
  recordFailure(ip: string, nowMs?: number): AdminRateLimitStatus;
  recordSuccess(ip: string): void;
  reset(): void;
}

interface IpAttemptBucket {
  failureTimestamps: number[];
  lockedUntilMs: number;
}

export function getAdminSessionCookieName(): string {
  return ADMIN_SESSION_COOKIE_NAME;
}

export function getAdminAccessKeyPlaceholder(): string {
  return ADMIN_ACCESS_KEY_PLACEHOLDER;
}

export function resolveAdminAuthConfiguration(
  overrides?: AdminAuthConfigOverrides
): AdminAuthConfig {
  return getAdminAuthConfig(overrides);
}

function normalizeIdentifier(raw: string, caseInsensitive: boolean): string {
  const trimmed = raw.trim();
  return caseInsensitive ? trimmed.toLowerCase() : trimmed;
}

function constantTimeHmacEqual(
  left: string,
  right: string,
  secretKey: string
): boolean {
  const leftDigest = createHmac("sha256", secretKey)
    .update(left, "utf8")
    .digest();
  const rightDigest = createHmac("sha256", secretKey)
    .update(right, "utf8")
    .digest();
  return timingSafeEqual(leftDigest, rightDigest);
}

export function verifyAdminCredentials(
  input: AdminLoginInput,
  overrides?: AdminAuthConfigOverrides
): boolean {
  const config = getAdminAuthConfig(overrides);
  if (!config.configured) {
    return false;
  }

  const rawUser = typeof input.username === "string" ? input.username : "";
  const rawPass = typeof input.password === "string" ? input.password : "";

  const isEmailIdentifier = config.username.includes("@");
  const normalizedProvidedUser = normalizeIdentifier(rawUser, isEmailIdentifier);
  const normalizedExpectedUser = normalizeIdentifier(
    config.username,
    isEmailIdentifier
  );

  const kdfSalt = createHmac("sha256", config.sessionSecret)
    .update("dekolabs-admin-password-kdf-v1", "utf8")
    .digest();

  const providedPasswordDerived = scryptSync(
    rawPass,
    kdfSalt,
    SCRYPT_KEYLEN_BYTES
  );
  const expectedPasswordDerived = scryptSync(
    config.password,
    kdfSalt,
    SCRYPT_KEYLEN_BYTES
  );

  const userMatches = constantTimeHmacEqual(
    normalizedProvidedUser,
    normalizedExpectedUser,
    config.sessionSecret
  );
  const passwordMatches = timingSafeEqual(
    providedPasswordDerived,
    expectedPasswordDerived
  );

  return (
    normalizedProvidedUser.length > 0 &&
    rawPass.length > 0 &&
    userMatches &&
    passwordMatches
  );
}

export function createAdminSessionToken(
  username: string,
  overrides?: AdminAuthConfigOverrides,
  nowMs: number = Date.now()
): string {
  const config = getAdminAuthConfig(overrides);
  if (!config.configured) {
    throw new Error(
      "No se puede firmar una sesión de administrador cuando la configuración opera en estado Fail-Closed."
    );
  }

  const cleanSub = username.trim();
  if (!cleanSub) {
    throw new Error("El sujeto ('sub') de la sesión no puede estar vacío.");
  }

  const iat = Math.floor(nowMs / 1000);
  const exp = iat + config.sessionTtlSeconds;
  const claims: AdminSessionClaims = {
    sub: cleanSub,
    iat,
    exp
  };

  const payloadPart = Buffer.from(JSON.stringify(claims), "utf8").toString(
    "base64url"
  );
  const signaturePart = createHmac("sha256", config.sessionSecret)
    .update(payloadPart, "utf8")
    .digest("base64url");

  return `${payloadPart}.${signaturePart}`;
}

export function verifyAdminSessionToken(
  token: string | null | undefined,
  overrides?: AdminAuthConfigOverrides,
  nowMs: number = Date.now()
): AdminSessionVerificationResult {
  const config = getAdminAuthConfig(overrides);
  if (!config.configured) {
    return {
      valid: false,
      claims: null,
      reason: "unconfigured"
    };
  }

  if (typeof token !== "string" || token.trim().length === 0) {
    return {
      valid: false,
      claims: null,
      reason: "missing-token"
    };
  }

  const parts = token.trim().split(".");
  if (parts.length !== 2) {
    return {
      valid: false,
      claims: null,
      reason: "malformed-token"
    };
  }

  const payloadPart = parts[0] ?? "";
  const signaturePart = parts[1] ?? "";
  if (
    !payloadPart ||
    !signaturePart ||
    !BASE64URL_SEGMENT_RE.test(payloadPart) ||
    !BASE64URL_SEGMENT_RE.test(signaturePart)
  ) {
    return {
      valid: false,
      claims: null,
      reason: "malformed-token"
    };
  }

  const expectedSig = createHmac("sha256", config.sessionSecret)
    .update(payloadPart, "utf8")
    .digest();
  let providedSig: Buffer;
  try {
    providedSig = Buffer.from(signaturePart, "base64url");
  } catch {
    return {
      valid: false,
      claims: null,
      reason: "malformed-token"
    };
  }

  if (
    expectedSig.byteLength !== providedSig.byteLength ||
    !timingSafeEqual(expectedSig, providedSig)
  ) {
    return {
      valid: false,
      claims: null,
      reason: "invalid-signature"
    };
  }

  let parsed: unknown;
  try {
    const jsonText = Buffer.from(payloadPart, "base64url").toString("utf8");
    parsed = JSON.parse(jsonText);
  } catch {
    return {
      valid: false,
      claims: null,
      reason: "malformed-token"
    };
  }

  if (!parsed || typeof parsed !== "object" || Array.isArray(parsed)) {
    return {
      valid: false,
      claims: null,
      reason: "malformed-token"
    };
  }

  const candidate = parsed as Record<string, unknown>;
  const sub = typeof candidate.sub === "string" ? candidate.sub.trim() : "";
  const iat = candidate.iat;
  const exp = candidate.exp;

  if (
    !sub ||
    typeof iat !== "number" ||
    !Number.isInteger(iat) ||
    typeof exp !== "number" ||
    !Number.isInteger(exp) ||
    exp <= iat
  ) {
    return {
      valid: false,
      claims: null,
      reason: "malformed-token"
    };
  }

  const nowSeconds = Math.floor(nowMs / 1000);
  if (exp <= nowSeconds) {
    return {
      valid: false,
      claims: null,
      reason: "expired-token"
    };
  }

  const isEmailIdentifier = config.username.includes("@");
  const normalizedClaimSub = normalizeIdentifier(sub, isEmailIdentifier);
  const normalizedExpectedSub = normalizeIdentifier(
    config.username,
    isEmailIdentifier
  );
  if (
    !constantTimeHmacEqual(
      normalizedClaimSub,
      normalizedExpectedSub,
      config.sessionSecret
    )
  ) {
    return {
      valid: false,
      claims: null,
      reason: "subject-mismatch"
    };
  }

  return {
    valid: true,
    claims: {
      sub,
      iat,
      exp
    }
  };
}

export function parseCookieValueFromHeader(
  cookieHeader: string | null | undefined,
  cookieName: string = ADMIN_SESSION_COOKIE_NAME
): string {
  if (!cookieHeader || typeof cookieHeader !== "string") {
    return "";
  }

  const pairs = cookieHeader.split(";");
  for (const rawPair of pairs) {
    const eqIndex = rawPair.indexOf("=");
    if (eqIndex <= 0) continue;
    const key = rawPair.slice(0, eqIndex).trim();
    if (key !== cookieName) continue;
    const rawValue = rawPair.slice(eqIndex + 1).trim();
    const unquoted =
      rawValue.startsWith('"') && rawValue.endsWith('"') && rawValue.length >= 2
        ? rawValue.slice(1, -1)
        : rawValue;
    try {
      return decodeURIComponent(unquoted);
    } catch {
      return unquoted;
    }
  }

  return "";
}

export function serializeAdminSessionCookie(
  token: string,
  overrides?: AdminAuthConfigOverrides
): string {
  const config = getAdminAuthConfig(overrides);
  const parts = [
    `${config.cookieName}=${encodeURIComponent(token)}`,
    "HttpOnly",
    "SameSite=Strict",
    "Path=/",
    `Max-Age=${config.sessionTtlSeconds}`
  ];
  if (config.secureCookie) {
    parts.push("Secure");
  }
  return parts.join("; ");
}

export function serializeExpiredAdminSessionCookie(
  overrides?: AdminAuthConfigOverrides
): string {
  const config = getAdminAuthConfig(overrides);
  const parts = [
    `${config.cookieName}=`,
    "HttpOnly",
    "SameSite=Strict",
    "Path=/",
    "Max-Age=0",
    "Expires=Thu, 01 Jan 1970 00:00:00 GMT"
  ];
  if (config.secureCookie) {
    parts.push("Secure");
  }
  return parts.join("; ");
}

export function createLoginRateLimiter(
  options?: LoginRateLimiterOptions
): LoginRateLimiter {
  const maxAttempts =
    typeof options?.maxAttempts === "number" && options.maxAttempts >= 1
      ? Math.floor(options.maxAttempts)
      : ADMIN_LOGIN_MAX_ATTEMPTS;
  const windowMs =
    typeof options?.windowMs === "number" && options.windowMs >= 1000
      ? Math.floor(options.windowMs)
      : ADMIN_LOGIN_WINDOW_MS;
  const lockoutMs =
    typeof options?.lockoutMs === "number" && options.lockoutMs >= 1000
      ? Math.floor(options.lockoutMs)
      : ADMIN_LOGIN_LOCKOUT_MS;
  const maxTrackedIps =
    typeof options?.maxTrackedIps === "number" && options.maxTrackedIps >= 10
      ? Math.floor(options.maxTrackedIps)
      : DEFAULT_MAX_TRACKED_IPS;

  const buckets = new Map<string, IpAttemptBucket>();

  function normalizeIpKey(ip: string): string {
    const cleaned = ip.trim().toLowerCase();
    return cleaned || "unknown-ip";
  }

  function pruneStaleEntries(nowMs: number): void {
    if (buckets.size < maxTrackedIps) {
      return;
    }
    const cutoff = nowMs - windowMs;
    for (const [key, bucket] of buckets.entries()) {
      const recent = bucket.failureTimestamps.filter((ts) => ts > cutoff);
      if (recent.length === 0 && bucket.lockedUntilMs <= nowMs) {
        buckets.delete(key);
      } else {
        bucket.failureTimestamps = recent;
      }
    }
    if (buckets.size >= maxTrackedIps) {
      const oldestKey = buckets.keys().next().value;
      if (typeof oldestKey === "string") {
        buckets.delete(oldestKey);
      }
    }
  }

  return {
    check(ip: string, nowMs: number = Date.now()): AdminRateLimitStatus {
      const key = normalizeIpKey(ip);
      const bucket = buckets.get(key);
      if (!bucket) {
        return {
          allowed: true,
          remainingAttempts: maxAttempts,
          retryAfterSeconds: 0
        };
      }

      if (bucket.lockedUntilMs > nowMs) {
        return {
          allowed: false,
          remainingAttempts: 0,
          retryAfterSeconds: Math.max(
            1,
            Math.ceil((bucket.lockedUntilMs - nowMs) / 1000)
          )
        };
      }

      const cutoff = nowMs - windowMs;
      bucket.failureTimestamps = bucket.failureTimestamps.filter(
        (ts) => ts > cutoff
      );
      if (bucket.failureTimestamps.length === 0) {
        buckets.delete(key);
        return {
          allowed: true,
          remainingAttempts: maxAttempts,
          retryAfterSeconds: 0
        };
      }

      if (bucket.failureTimestamps.length >= maxAttempts) {
        bucket.lockedUntilMs = nowMs + lockoutMs;
        return {
          allowed: false,
          remainingAttempts: 0,
          retryAfterSeconds: Math.max(1, Math.ceil(lockoutMs / 1000))
        };
      }

      return {
        allowed: true,
        remainingAttempts: Math.max(
          0,
          maxAttempts - bucket.failureTimestamps.length
        ),
        retryAfterSeconds: 0
      };
    },

    recordFailure(ip: string, nowMs: number = Date.now()): AdminRateLimitStatus {
      pruneStaleEntries(nowMs);
      const key = normalizeIpKey(ip);
      const cutoff = nowMs - windowMs;
      const existing = buckets.get(key) ?? {
        failureTimestamps: [],
        lockedUntilMs: 0
      };

      existing.failureTimestamps = existing.failureTimestamps.filter(
        (ts) => ts > cutoff
      );
      existing.failureTimestamps.push(nowMs);

      if (existing.failureTimestamps.length >= maxAttempts) {
        existing.lockedUntilMs = nowMs + lockoutMs;
        buckets.set(key, existing);
        return {
          allowed: false,
          remainingAttempts: 0,
          retryAfterSeconds: Math.max(1, Math.ceil(lockoutMs / 1000))
        };
      }

      buckets.set(key, existing);
      return {
        allowed: true,
        remainingAttempts: Math.max(
          0,
          maxAttempts - existing.failureTimestamps.length
        ),
        retryAfterSeconds: 0
      };
    },

    recordSuccess(ip: string): void {
      const key = normalizeIpKey(ip);
      buckets.delete(key);
    },

    reset(): void {
      buckets.clear();
    }
  };
}

export const defaultLoginRateLimiter: LoginRateLimiter =
  createLoginRateLimiter();

export function resetDefaultLoginRateLimiter(): void {
  defaultLoginRateLimiter.reset();
}
