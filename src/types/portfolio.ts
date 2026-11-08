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

export interface HeroTelemetrySeriesPoint {
  slot: string;
  latencyMs: number;
  throughputRps: number;
}

export interface HeroTelemetryCardData {
  cardTitle: string;
  nodeStatus: "ONLINE" | "DEGRADED" | "MAINTENANCE";
  nodeId: string;
  hostEnvironment: string;
  activeContainers: number;
  p99LatencyMs: number;
  harnessGateScore: string;
  uptimePercent: string;
  memoryFootprint: string;
  sparklineLabel: string;
  sparklinePoints: HeroTelemetrySeriesPoint[];
  executiveHighlights: string[];
}

export interface IndustrialBenchmarkKpi {
  id: string;
  code: string;
  metricValue: string;
  label: string;
  context: string;
  verificationTag: string;
}

export type ProductionSystemCategory =
  | "distributed-systems"
  | "ai-agents"
  | "data-pipelines"
  | "cloud-infrastructure";

export type ProductionSystemLayoutVariant =
  | "primary-7-5"
  | "primary-5-7"
  | "secondary-split";

export interface SystemMetric {
  label: string;
  value: string;
  deltaOrTarget: string;
}

export interface SystemArchitectureSpec {
  label: string;
  value: string;
}

export interface PipelineStage {
  stageNumber: "ETAPA 01" | "ETAPA 02" | "ETAPA 03";
  title: string;
  latencyOrSlo: string;
  description: string;
  invariants: string[];
}

export interface CodeSnippetTab {
  id: string;
  filename: string;
  layer: string;
  language: string;
  code: string;
}

export interface SolvedChallenge {
  number: "01" | "02" | "03";
  title: string;
  problem: string;
  solution: string;
  impactMetric: string;
}

export interface SystemDeploymentLedger {
  architecturePattern: string;
  commitSha: string;
  hostEnvironment: string;
  verificationGate: string;
}

export interface ProductionSystem {
  id: string;
  order: "01" | "02" | "03" | "04";
  slug: string;
  title: string;
  subtitle: string;
  category: ProductionSystemCategory;
  categoryLabel: string;
  layoutVariant: ProductionSystemLayoutVariant;
  status: "PRODUCTION // ONLINE" | "PRODUCTION // VERIFIED" | "ACTIVE // EDGE NODE";
  liveMetricPill: string;
  summary: string;
  architecturalNarrative: string;
  stackTags: string[];
  metrics: SystemMetric[];
  architectureSpecs: SystemArchitectureSpec[];
  deploymentLedger: SystemDeploymentLedger;
  terminalPreviewLines: string[];
  liveUrl: string;
  detailHref: string;
  pipelineStages: PipelineStage[];
  codeTabs: CodeSnippetTab[];
  solvedChallenges: SolvedChallenge[];
}

export interface SystemsCatalogSnapshot {
  heroTelemetry: HeroTelemetryCardData;
  benchmarks: IndustrialBenchmarkKpi[];
  systems: ProductionSystem[];
  primarySystems: ProductionSystem[];
  secondarySystems: ProductionSystem[];
}

export interface SystemDeepDiveNavigationLink {
  order: ProductionSystem["order"];
  slug: string;
  title: string;
  categoryLabel: string;
  detailHref: string;
}

export interface SystemDeepDiveSnapshot {
  system: ProductionSystem;
  previousSystem: SystemDeepDiveNavigationLink;
  nextSystem: SystemDeepDiveNavigationLink;
  relatedSystems: SystemDeepDiveNavigationLink[];
}

export interface ProductionSystemsProvider {
  getHeroTelemetryCard(): HeroTelemetryCardData;
  getIndustrialBenchmarks(): IndustrialBenchmarkKpi[];
  getAllProductionSystems(): ProductionSystem[];
  getProductionSystemBySlug(slug: string): ProductionSystem | null;
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
