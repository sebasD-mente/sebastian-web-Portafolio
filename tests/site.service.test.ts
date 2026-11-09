import { describe, expect, it } from "vitest";
import {
  getSiteFoundationSnapshot,
  getSiteMetadataSummary,
  getThemePalette,
  resolveNextThemeMode
} from "@/service/site.service";
import {
  buildRuntimeLogEntry,
  redactSecrets,
  serializeRuntimeLog
} from "@/runtime/logger";

describe("feat-001: Site Foundation Service & Atelier Monolith Tokens", () => {
  it("returns Light Mode ('light') as the default theme and complete Atelier Monolith palettes", () => {
    const snapshot = getSiteFoundationSnapshot();

    expect(snapshot.defaultTheme).toBe("light");
    expect(snapshot.identity.domain).toBe("dekolabs.org");
    expect(snapshot.identity.name).toBe("Sebastián");
    expect(snapshot.palettes.light.background).toBe("#FFFFFF");
    expect(snapshot.palettes.dark.background).toBe("#121314");
    expect(snapshot.architectureLayers).toHaveLength(6);
  });

  it("toggles cleanly between light and dark theme modes and resolves palettes", () => {
    expect(resolveNextThemeMode("light")).toBe("dark");
    expect(resolveNextThemeMode("dark")).toBe("light");

    const lightPalette = getThemePalette("light");
    const darkPalette = getThemePalette("dark");
    expect(lightPalette.secondary).toBe("#2563EB");
    expect(darkPalette.secondary).toBe("#7BD0FF");
  });

  it("exposes SEO metadata summary and navigation for dekolabs.org without skipping layers", () => {
    const meta = getSiteMetadataSummary();
    const snapshot = getSiteFoundationSnapshot();
    expect(meta.canonicalUrl).toBe("https://dekolabs.org");
    expect(meta.headlineTitle).toContain("Sebastián");
    expect(meta.roleTitle).toContain("AI Developer & Agentic Builder");
    expect(snapshot.identity.logoSrc).toBe("/assets/logo-sebastian-j.png");
    expect(snapshot.identity.tagline).toContain("Google ADK y sistemas RAG");
    expect(snapshot.navigation.map((n) => n.label)).toEqual([
      "SISTEMAS EN PRODUCCIÓN",
      "STACK TECNOLOGICO",
      "MAS PROYECTOS DE IA"
    ]);
  });
});

describe("feat-001: Runtime Structured Logger (RuntimeLogEntry & Secret Redaction)", () => {
  it("builds a compliant 8-field RuntimeLogEntry with correlationId and redacts sensitive fields", () => {
    const entry = buildRuntimeLogEntry({
      level: "info",
      component: "SiteRuntime",
      action: "verify-foundation",
      durationMs: 8.4,
      input: {
        domain: "dekolabs.org",
        apiKey: "super-secret-value",
        note: "Bearer sk-proj-1234567890abcdef"
      },
      output: {
        status: "ok"
      },
      correlationId: "dekolabs-0001"
    });

    expect(entry.correlationId).toBe("dekolabs-0001");
    expect(entry.durationMs).toBe(8);
    expect(entry.error).toBeNull();
    expect((entry.input as Record<string, unknown>).apiKey).toBe("[REDACTED]");
    expect((entry.input as Record<string, unknown>).note).toContain("[REDACTED]");

    const serialized = serializeRuntimeLog({
      level: "warn",
      component: "SiteRuntime",
      action: "test-serialize",
      durationMs: 2,
      input: "ok"
    });
    const parsed = JSON.parse(serialized);
    expect(parsed.component).toBe("SiteRuntime");
    expect(typeof parsed.timestamp).toBe("string");
    expect(redactSecrets({ token: "abc" })).toEqual({ token: "[REDACTED]" });
  });
});
