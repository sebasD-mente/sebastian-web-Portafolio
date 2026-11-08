import type {
  AmbientTelemetryStatus,
  ArchitectureLayerSummary,
  NavigationItem,
  SiteIdentity,
  ThemeMode,
  ThemeTokenPalette
} from "@/types/portfolio";

export const DEFAULT_THEME_MODE: ThemeMode = "light";

export const SITE_IDENTITY: SiteIdentity = {
  monogram: "SB // DL",
  name: "Sebastián",
  roleTitle: "Principal Software & AI Architect",
  headlineTitle: "Sebastián — Principal Software & AI Architect | dekolabs.org",
  domain: "dekolabs.org",
  canonicalUrl: "https://dekolabs.org",
  availabilityBadge: "AVAILABLE FOR FREELANCE & IMPLEMENTATION CONTRACTS",
  tagline:
    "Sistemas en producción de alta resiliencia, orquestación de agentes autónomos e infraestructura moderna auto-alojada.",
  summary:
    "Ingeniería de software de precisión bajo el sistema de diseño Atelier Monolith y gobernanza determinista de 6 capas (Universal Chameleon Harness v2.1) ejecutándose en Ubuntu Linux Home Lab.",
  primaryCtaLabel: "Explorar Sistemas en Producción",
  primaryCtaHref: "#proyectos-destacados",
  secondaryCtaLabel: "Contratar / Hablemos",
  secondaryCtaHref: "#contacto",
  footerNote:
    "Desplegado como contenedor Next.js 15 Standalone (node:22-alpine) en Ubuntu Linux Home Lab detrás de Reverse Proxy."
};

export const SITE_NAVIGATION: NavigationItem[] = [
  {
    id: "sistemas",
    code: "01",
    label: "Sistemas en Producción",
    href: "#proyectos-destacados"
  },
  {
    id: "orquestacion",
    code: "02",
    label: "Orquestación Agéntica & Stack",
    href: "#orquestacion-agentica"
  },
  {
    id: "telemetria",
    code: "03",
    label: "Telemetría Home Lab",
    href: "#telemetria-homelab"
  },
  {
    id: "contacto",
    code: "04",
    label: "Contacto",
    href: "#contacto"
  }
];

export const ATELIER_MONOLITH_PALETTES: Record<ThemeMode, ThemeTokenPalette> = {
  light: {
    mode: "light",
    background: "#FFFFFF",
    surfaceContainerLowest: "#FAFAFA",
    surfaceContainerLow: "#F3F4F6",
    surfaceContainerHigh: "#E5E7EB",
    outlineVariant: "#D1D5DB",
    primary: "#0D0E0F",
    onSurfaceVariant: "#4B5563",
    secondary: "#2563EB",
    tertiaryFixed: "#059669",
    amberNotice: "#D97706"
  },
  dark: {
    mode: "dark",
    background: "#121314",
    surfaceContainerLowest: "#0D0E0F",
    surfaceContainerLow: "#1B1C1C",
    surfaceContainerHigh: "#292A2A",
    outlineVariant: "#444748",
    primary: "#FFFFFF",
    onSurfaceVariant: "#C4C7C8",
    secondary: "#7BD0FF",
    tertiaryFixed: "#10B981",
    amberNotice: "#F59E0B"
  }
};

export const SIX_LAYER_ARCHITECTURE: ArchitectureLayerSummary[] = [
  {
    order: 1,
    layer: "Types",
    folder: "src/types/",
    responsibility: "Contratos TypeScript puros de dominio, telemetría y observabilidad.",
    invariantRule: "Cero dependencias hacia capas superiores."
  },
  {
    order: 2,
    layer: "Config",
    folder: "src/config/",
    responsibility: "Metadatos de dekolabs.org, identidad de Sebastián y tokens Atelier Monolith.",
    invariantRule: "Importa únicamente contratos de Types."
  },
  {
    order: 3,
    layer: "Repo",
    folder: "src/repo/",
    responsibility: "Proveedores de datos estructurados y lecturas del nodo Ubuntu Home Lab.",
    invariantRule: "Aísla las fuentes de datos bajo Capability Seams."
  },
  {
    order: 4,
    layer: "Service",
    folder: "src/service/",
    responsibility: "Casos de uso puros y ensamblaje de modelos para la capa de presentación.",
    invariantRule: "Desacopla a la UI de Config y Repo."
  },
  {
    order: 5,
    layer: "Runtime",
    folder: "src/runtime/",
    responsibility: "Manejadores HTTP y emisor de logs estructurados RuntimeLogEntry con correlationId.",
    invariantRule: "Redacción automática de secretos y trazabilidad JSON."
  },
  {
    order: 6,
    layer: "UI",
    folder: "src/ui/ + src/app/",
    responsibility: "Interfaz suiza minimalista Atelier Monolith (Modo Claro por defecto + Modo Oscuro).",
    invariantRule: "Prohibido importar directamente de Config o Repo (No Layer Skipping)."
  }
];

export function getAmbientTelemetryDefaults(): AmbientTelemetryStatus {
  return {
    nodeId: "HOME-LAB: UBUNTU-NODE-01",
    status: "ONLINE",
    hostOs: "Ubuntu 24.04 LTS (Linux x86_64)",
    runtimeTarget: "Docker Engine · Next.js 15 Standalone (:3000)",
    latencyMs: 12,
    availabilitySlo: "99.98%",
    harnessScore: "100/100 (3 Puertas PASS)",
    deployedRevision: "v2.1-atelier-monolith",
    domain: SITE_IDENTITY.domain
  };
}
