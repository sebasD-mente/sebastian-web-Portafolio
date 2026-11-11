import type {
  AdminAuthConfig,
  AdminAuthConfigOverrides,
  AmbientTelemetryStatus,
  ArchitectureLayerSummary,
  CatalogSectionDescriptor,
  CatalogSectionId,
  NavigationItem,
  OfficialFooterData,
  SiteIdentity,
  SocialLinksEnvOverrides,
  SocialPlatformId,
  ThemeMode,
  ThemeTokenPalette
} from "@/types/portfolio";

export const DEFAULT_THEME_MODE: ThemeMode = "light";

export const DEFAULT_CATALOG_UPLOADS_DIR = "/app/data/uploads";

export const ADMIN_SESSION_COOKIE_NAME = "dekolabs_admin_session";
export const ADMIN_SESSION_TTL_SECONDS = 43200; // 12 horas
export const ADMIN_LOGIN_MAX_ATTEMPTS = 5;
export const ADMIN_LOGIN_WINDOW_MS = 15 * 60 * 1000; // 15 minutos
export const ADMIN_LOGIN_LOCKOUT_MS = 15 * 60 * 1000; // 15 minutos

export const ADMIN_PASSWORD_PLACEHOLDER =
  "change_this_admin_password_in_production";
export const ADMIN_SESSION_SECRET_PLACEHOLDER =
  "change_this_admin_session_secret_min_32_chars_in_production";
export const ADMIN_ACCESS_KEY_PLACEHOLDER =
  "change_this_admin_access_key_in_production";

export function getAdminAuthConfig(
  overrides?: AdminAuthConfigOverrides
): AdminAuthConfig {
  const effectiveEnv = (
    overrides?.nodeEnv ??
    process.env.NODE_ENV ??
    "development"
  )
    .trim()
    .toLowerCase();
  const isProduction = effectiveEnv === "production";

  const rawUsername = (
    overrides?.username !== undefined
      ? overrides.username
      : process.env.ADMIN_USERNAME
  )?.trim() ?? "";

  const rawPassword = (
    overrides?.password !== undefined
      ? overrides.password
      : process.env.ADMIN_PASSWORD
  )?.trim() ?? "";

  const rawSessionSecret = (
    overrides?.sessionSecret !== undefined
      ? overrides.sessionSecret
      : process.env.ADMIN_SESSION_SECRET
  )?.trim() ?? "";

  const sessionTtlSeconds =
    typeof overrides?.sessionTtlSeconds === "number" &&
    overrides.sessionTtlSeconds > 0
      ? Math.floor(overrides.sessionTtlSeconds)
      : ADMIN_SESSION_TTL_SECONDS;

  const maxLoginAttempts =
    typeof overrides?.maxLoginAttempts === "number" &&
    overrides.maxLoginAttempts >= 1
      ? Math.floor(overrides.maxLoginAttempts)
      : ADMIN_LOGIN_MAX_ATTEMPTS;

  const rateLimitWindowMs =
    typeof overrides?.rateLimitWindowMs === "number" &&
    overrides.rateLimitWindowMs >= 1000
      ? Math.floor(overrides.rateLimitWindowMs)
      : ADMIN_LOGIN_WINDOW_MS;

  const lockoutDurationMs =
    typeof overrides?.lockoutDurationMs === "number" &&
    overrides.lockoutDurationMs >= 1000
      ? Math.floor(overrides.lockoutDurationMs)
      : ADMIN_LOGIN_LOCKOUT_MS;

  if (isProduction) {
    const hasValidUser = rawUsername.length > 0;
    const hasValidPass =
      rawPassword.length >= 8 && rawPassword !== ADMIN_PASSWORD_PLACEHOLDER;
    const hasValidSecret =
      rawSessionSecret.length >= 16 &&
      rawSessionSecret !== ADMIN_SESSION_SECRET_PLACEHOLDER;
    const configured = hasValidUser && hasValidPass && hasValidSecret;

    return {
      configured,
      username: configured ? rawUsername : "",
      password: configured ? rawPassword : "",
      sessionSecret: configured ? rawSessionSecret : "",
      cookieName: ADMIN_SESSION_COOKIE_NAME,
      sessionTtlSeconds,
      secureCookie: true,
      maxLoginAttempts,
      rateLimitWindowMs,
      lockoutDurationMs
    };
  }

  // En desarrollo y pruebas automatizadas: si se pasó un override explícito vacío se respeta Fail-Closed;
  // si las variables de entorno no están definidas o conservan el placeholder, se usa respaldo local seguro.
  const explicitEmptyOverride =
    (overrides?.username !== undefined && rawUsername.length === 0) ||
    (overrides?.password !== undefined && rawPassword.length === 0) ||
    (overrides?.sessionSecret !== undefined && rawSessionSecret.length < 16);

  if (explicitEmptyOverride) {
    return {
      configured: false,
      username: "",
      password: "",
      sessionSecret: "",
      cookieName: ADMIN_SESSION_COOKIE_NAME,
      sessionTtlSeconds,
      secureCookie: false,
      maxLoginAttempts,
      rateLimitWindowMs,
      lockoutDurationMs
    };
  }

  const resolvedUsername = rawUsername || "admin@dekolabs.org";
  const resolvedPassword =
    !rawPassword || rawPassword === ADMIN_PASSWORD_PLACEHOLDER
      ? "dekolabs-admin-dev-password"
      : rawPassword;
  const resolvedSecret =
    !rawSessionSecret || rawSessionSecret === ADMIN_SESSION_SECRET_PLACEHOLDER
      ? "dekolabs-admin-dev-session-secret-2026-local-only"
      : rawSessionSecret;

  const configured =
    resolvedUsername.length > 0 &&
    resolvedPassword.length > 0 &&
    resolvedSecret.length >= 16;

  return {
    configured,
    username: configured ? resolvedUsername : "",
    password: configured ? resolvedPassword : "",
    sessionSecret: configured ? resolvedSecret : "",
    cookieName: ADMIN_SESSION_COOKIE_NAME,
    sessionTtlSeconds,
    secureCookie: false,
    maxLoginAttempts,
    rateLimitWindowMs,
    lockoutDurationMs
  };
}

export const CATALOG_SECTIONS_CONFIG: Record<
  CatalogSectionId,
  CatalogSectionDescriptor
> = {
  "production-systems": {
    id: "production-systems",
    anchorId: "proyectos-destacados",
    routeHref: "/#proyectos-destacados",
    heading: "SISTEMAS EN PRODUCCIÓN",
    subtitle:
      "Plataformas e infraestructuras distribuidas operando en entornos reales con SLA verificado.",
    emptyStateMessage:
      "No hay sistemas publicados aún en la categoría SISTEMAS EN PRODUCCIÓN."
  },
  "ai-projects": {
    id: "ai-projects",
    anchorId: "mas-proyectos-ia",
    routeHref: "/proyectos-ia",
    heading: "MÁS PROYECTOS DE IA",
    subtitle:
      "Agentes autónomos con Google ADK, pipelines RAG sobre pgvector y sistemas de IA en construcción.",
    emptyStateMessage:
      "Próximamente: nuevos proyectos de IA, agentes autónomos y arquitecturas RAG publicados desde el administrador."
  }
};

export const SITE_IDENTITY: SiteIdentity = {
  monogram: "SB // DL",
  logoSrc: "/assets/logo-sebastian-j.png",
  logoAlt: "Sebastian J — AI Developer & Agentic Builder",
  name: "Sebastián",
  roleTitle: "AI Developer & Agentic Builder",
  headlineTitle: "Sebastián J — AI Developer & Agentic Builder | dekolabs.org",
  domain: "dekolabs.org",
  canonicalUrl: "https://dekolabs.org",
  availabilityBadge: "AVAILABLE FOR FREELANCE & IMPLEMENTATION CONTRACTS",
  tagline:
    "Construyo aplicaciones con IA implícita, agentes autónomos con Google ADK y sistemas RAG listos para producción.",
  summary:
    "Construyo software apoyado en un entorno profesional de agentes de código gobernados por un arnés de ingeniería de alto estándar. Combino desarrollo de agentes inteligentes, pruebas de modelos locales en aplicaciones no exploradas y administración de mi propio Home Lab",
  primaryCtaLabel: "SISTEMAS EN PRODUCCIÓN",
  primaryCtaHref: "/#proyectos-destacados",
  secondaryCtaLabel: "CONTRATAR / HABLEMOS",
  secondaryCtaHref: "/#contacto",
  footerNote:
    "Desplegado como contenedor Next.js 15 Standalone (node:22-alpine) en Ubuntu Linux Home Lab detrás de Reverse Proxy."
};

export const SITE_NAVIGATION: NavigationItem[] = [
  {
    id: "sistemas",
    code: "01",
    label: "SISTEMAS EN PRODUCCIÓN",
    href: "/#proyectos-destacados"
  },
  {
    id: "stack",
    code: "02",
    label: "STACK TECNOLÓGICO",
    href: "/#stack-tecnologico"
  },
  {
    id: "mas-proyectos",
    code: "03",
    label: "MÁS PROYECTOS DE IA",
    href: "/proyectos-ia"
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

export const OFFICIAL_COPYRIGHT_YEAR = 2026;
export const OFFICIAL_AUTHOR_CREDIT = "Creado por Sebastián Jiménez";
export const OFFICIAL_COPYRIGHT_NOTICE =
  "© 2026 · Creado por Sebastián Jiménez";

export const DEFAULT_SOCIAL_LINKS_URLS: Record<SocialPlatformId, string> = {
  linkedin: "https://www.linkedin.com/in/sebastian-jimenez-aibuilder/",
  facebook: "https://www.facebook.com/sebastian.jimenez.561437",
  instagram: "https://www.instagram.com/sebastian.1969c/",
  whatsapp: "https://wa.me/50240275763"
};

export function resolveSafeSocialUrl(
  rawValue: string | undefined,
  fallbackUrl: string
): string {
  const candidate = rawValue?.trim() ?? "";
  if (!candidate) {
    return fallbackUrl;
  }

  try {
    const parsed = new URL(candidate);
    if (parsed.protocol === "https:" || parsed.protocol === "http:") {
      return candidate;
    }
    return fallbackUrl;
  } catch {
    return fallbackUrl;
  }
}

export function getOfficialFooterConfig(
  overrides?: SocialLinksEnvOverrides
): OfficialFooterData {
  const linkedinHref = resolveSafeSocialUrl(
    overrides?.linkedinUrl,
    DEFAULT_SOCIAL_LINKS_URLS.linkedin
  );
  const facebookHref = resolveSafeSocialUrl(
    overrides?.facebookUrl,
    DEFAULT_SOCIAL_LINKS_URLS.facebook
  );
  const instagramHref = resolveSafeSocialUrl(
    overrides?.instagramUrl,
    DEFAULT_SOCIAL_LINKS_URLS.instagram
  );
  const whatsappHref = resolveSafeSocialUrl(
    overrides?.whatsappUrl,
    DEFAULT_SOCIAL_LINKS_URLS.whatsapp
  );

  return {
    copyrightNotice: OFFICIAL_COPYRIGHT_NOTICE,
    copyrightYear: OFFICIAL_COPYRIGHT_YEAR,
    authorCredit: OFFICIAL_AUTHOR_CREDIT,
    sectionTitle: "Canales Oficiales & Contacto Directo",
    sectionSubtitle:
      "Conecta conmigo para arquitectura de software, agentes autónomos con Google ADK, pipelines RAG e implementaciones end-to-end.",
    technicalNote:
      "DEKOLABS.ORG · ARQUITECTURA AGÉNTICA & SISTEMAS EN PRODUCCIÓN",
    socialLinks: [
      {
        id: "linkedin",
        label: "LinkedIn",
        href: linkedinHref,
        ariaLabel: "LinkedIn (abre en nueva pestaña)",
        handleOrHint: "Red profesional"
      },
      {
        id: "facebook",
        label: "Facebook",
        href: facebookHref,
        ariaLabel: "Facebook (abre en nueva pestaña)",
        handleOrHint: "Canal oficial"
      },
      {
        id: "instagram",
        label: "Instagram",
        href: instagramHref,
        ariaLabel: "Instagram (abre en nueva pestaña)",
        handleOrHint: "Actualizaciones visuales"
      },
      {
        id: "whatsapp",
        label: "WhatsApp",
        href: whatsappHref,
        ariaLabel: "WhatsApp (abre en nueva pestaña)",
        handleOrHint: "Mensaje directo"
      }
    ]
  };
}
