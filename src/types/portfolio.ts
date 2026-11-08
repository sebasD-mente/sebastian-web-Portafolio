export type ThemeMode = "light" | "dark";

export interface ThemeTokenPalette {
  mode: ThemeMode;
  background: string;
  surfaceContainerLowest: string;
  surfaceContainerLow: string;
  surfaceContainerHigh: string;
  outlineVariant: string;
  primary: string;
  onSurfaceVariant: string;
  secondary: string;
  tertiaryFixed: string;
  amberNotice: string;
}

export interface NavigationItem {
  id: string;
  code: string;
  label: string;
  href: string;
}

export interface AmbientTelemetryStatus {
  nodeId: string;
  status: "ONLINE" | "DEGRADED" | "MAINTENANCE";
  hostOs: string;
  runtimeTarget: string;
  latencyMs: number;
  availabilitySlo: string;
  harnessScore: string;
  deployedRevision: string;
  domain: string;
}

export interface SiteIdentity {
  monogram: string;
  name: string;
  roleTitle: string;
  headlineTitle: string;
  domain: string;
  canonicalUrl: string;
  availabilityBadge: string;
  tagline: string;
  summary: string;
  primaryCtaLabel: string;
  primaryCtaHref: string;
  secondaryCtaLabel: string;
  secondaryCtaHref: string;
  footerNote: string;
}

export interface ArchitectureLayerSummary {
  order: number;
  layer: "Types" | "Config" | "Repo" | "Service" | "Runtime" | "UI";
  folder: string;
  responsibility: string;
  invariantRule: string;
}

export interface SiteFoundationSnapshot {
  identity: SiteIdentity;
  defaultTheme: ThemeMode;
  navigation: NavigationItem[];
  ambientTelemetry: AmbientTelemetryStatus;
  palettes: Record<ThemeMode, ThemeTokenPalette>;
  architectureLayers: ArchitectureLayerSummary[];
}

export interface SiteConfigProvider {
  getIdentity(): SiteIdentity;
  getDefaultTheme(): ThemeMode;
  getNavigation(): NavigationItem[];
  getAmbientTelemetry(): AmbientTelemetryStatus;
  getThemePalettes(): Record<ThemeMode, ThemeTokenPalette>;
  getArchitectureLayers(): ArchitectureLayerSummary[];
}

export type RuntimeLogLevel = "info" | "warn" | "error";

export interface RuntimeLogError {
  message: string;
  why: string;
  fix: string;
}

export interface RuntimeLogEntry {
  timestamp: string;
  level: RuntimeLogLevel;
  component: string;
  action: string;
  durationMs: number;
  input: Record<string, unknown> | string;
  output: Record<string, unknown> | null;
  error: RuntimeLogError | null;
  correlationId: string;
}
