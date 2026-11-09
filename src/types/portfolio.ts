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
  logoSrc: string;
  logoAlt: string;
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
  projectHeaderLabel?: string;
  versionBadge?: string;
  previewImageSrc?: string;
  previewImageAlt?: string;
  highlightedStackTag?: string;
  featuredOnHome?: boolean;
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

export interface AgenticWorkflowNode {
  step: "01" | "02" | "03" | "04" | "05";
  nodeId: "research" | "implement" | "verify" | "human_approval" | "merge";
  title: string;
  actorRole: string;
  isolationPolicy: string;
  description: string;
  deterministicArtifact: string;
}

export interface MakerCheckerSpec {
  protocolVersion: string;
  isolationMode: string;
  rubricTarget: string;
  circuitBreakerLocks: string[];
  summary: string;
}

export interface HarnessVerificationGate {
  gateNumber: "PUERTA 01" | "PUERTA 02" | "PUERTA 03";
  title: string;
  command: string;
  focusArea: string;
  invariantsChecked: string[];
  passThreshold: string;
}

export interface McpIntegrationBridge {
  id: string;
  protocolCode: string;
  serverName: string;
  purpose: string;
  securityBoundary: string;
}

export type StackCapabilityCategoryId =
  | "all"
  | "ai-agentic"
  | "distributed-backend"
  | "frontend-design"
  | "cloud-homelab";

export interface StackCapabilityCategoryOption {
  id: StackCapabilityCategoryId;
  code: string;
  label: string;
  count: number;
}

export interface StackCapabilityItem {
  id: string;
  technology: string;
  category: Exclude<StackCapabilityCategoryId, "all">;
  categoryLabel: string;
  architecturalLayer: "Types" | "Config" | "Repo" | "Service" | "Runtime" | "UI" | "Cross-Layer";
  productionRole: string;
  commercialUseCase: string;
  verificationStandard: string;
  statusBadge: "PRODUCTION // CORE" | "VERIFIED // HARNESS" | "ENTERPRISE // READY";
}

export interface CommercialDeliveryBlueprint {
  id: string;
  code: string;
  title: string;
  engagementModel: string;
  targetTimeline: string;
  summary: string;
  includedDeliverables: string[];
  qualityGuarantee: string;
}

export interface AgenticStackSnapshot {
  architectureLayers: ArchitectureLayerSummary[];
  makerCheckerSpec: MakerCheckerSpec;
  workflowNodes: AgenticWorkflowNode[];
  verificationGates: HarnessVerificationGate[];
  mcpBridges: McpIntegrationBridge[];
  stackCategories: StackCapabilityCategoryOption[];
  stackCapabilities: StackCapabilityItem[];
  commercialBlueprints: CommercialDeliveryBlueprint[];
}

export interface AgenticStackProvider {
  getMakerCheckerSpec(): MakerCheckerSpec;
  getWorkflowNodes(): AgenticWorkflowNode[];
  getVerificationGates(): HarnessVerificationGate[];
  getMcpBridges(): McpIntegrationBridge[];
  getStackCapabilities(): StackCapabilityItem[];
  getCommercialBlueprints(): CommercialDeliveryBlueprint[];
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

export interface HomeLabContainerStatus {
  id: string;
  name: string;
  image: string;
  role: string;
  state: "running" | "healthy" | "standby";
  memoryMb: number;
  internalPort: string;
}

export interface HomeLabRuntimeMetrics {
  processUptimeSeconds: number;
  formattedUptime: string;
  rssMemoryMb: number;
  heapUsedMb: number;
  memoryBudgetMb: number;
  memoryWithinSlo: boolean;
  nodeVersion: string;
  platformArch: string;
  loadAverage1m: string;
}

export type TerminalCommandId =
  | "status"
  | "containers"
  | "gates"
  | "network"
  | "help";

export interface TerminalCommandPreset {
  id: TerminalCommandId;
  command: string;
  label: string;
  description: string;
  outputLines: string[];
}

export interface HomeLabTelemetrySnapshot {
  timestamp: string;
  correlationId: string;
  nodeId: string;
  status: "ONLINE" | "DEGRADED" | "MAINTENANCE";
  domain: string;
  hostOs: string;
  reverseProxyIngress: string;
  latencyMs: number;
  availabilitySlo: string;
  harnessScore: string;
  deployedRevision: string;
  runtimeMetrics: HomeLabRuntimeMetrics;
  containers: HomeLabContainerStatus[];
  terminalCommands: TerminalCommandPreset[];
  initialTtyLines: string[];
}

export interface HomeLabHealthReport {
  ok: boolean;
  status: "healthy" | "degraded";
  timestamp: string;
  correlationId: string;
  nodeId: string;
  domain: string;
  uptimeSeconds: number;
  rssMemoryMb: number;
  memoryBudgetMb: number;
  checks: {
    standaloneRuntime: "pass";
    memoryBudget: "pass" | "warn";
    harnessGates: "pass";
  };
}

export interface HomeLabTelemetryProvider {
  getRuntimeMetrics(): HomeLabRuntimeMetrics;
  getActiveContainers(rssMemoryMb?: number): HomeLabContainerStatus[];
  getTerminalCommandPresets(
    metrics: HomeLabRuntimeMetrics,
    containers: HomeLabContainerStatus[]
  ): TerminalCommandPreset[];
}

export type EngagementModalityId =
  | "end-to-end-implementation"
  | "agentic-ai-systems"
  | "homelab-cloud-architecture"
  | "technical-advisory";

export interface EngagementModalityOption {
  id: EngagementModalityId;
  code: string;
  title: string;
  slaResponse: string;
  summary: string;
  typicalDuration: string;
}

export interface ContactInquiryInput {
  fullName: string;
  email: string;
  organization?: string;
  modality: EngagementModalityId;
  projectSummary: string;
  websiteHoneypot?: string;
}

export interface ContactFieldErrors {
  fullName?: string;
  email?: string;
  modality?: string;
  projectSummary?: string;
}

export interface ContactValidationResult {
  valid: boolean;
  sanitized: ContactInquiryInput;
  errors: ContactFieldErrors;
  isSpamHoneypot: boolean;
}

export interface ContactSubmissionReceipt {
  ok: boolean;
  receiptId: string;
  correlationId: string;
  timestamp: string;
  modalityLabel: string;
  estimatedResponseWindow: string;
  summaryMessage: string;
}
