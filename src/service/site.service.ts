import { createSiteRepository, defaultSiteRepository } from "@/repo/site.repo";
import type {
  OfficialFooterData,
  SiteConfigProvider,
  SiteFoundationSnapshot,
  SiteIdentity,
  SocialLinksEnvOverrides,
  ThemeMode,
  ThemeTokenPalette
} from "@/types/portfolio";

export function getSiteFoundationSnapshot(
  repo: SiteConfigProvider = defaultSiteRepository
): SiteFoundationSnapshot {
  return {
    identity: repo.getIdentity(),
    defaultTheme: repo.getDefaultTheme(),
    navigation: repo.getNavigation(),
    ambientTelemetry: repo.getAmbientTelemetry(),
    palettes: repo.getThemePalettes(),
    architectureLayers: repo.getArchitectureLayers(),
    footer: repo.getOfficialFooter()
  };
}

export function getOfficialFooterSnapshot(
  overrides?: SocialLinksEnvOverrides
): OfficialFooterData {
  const repo = overrides
    ? createSiteRepository(overrides)
    : defaultSiteRepository;
  return repo.getOfficialFooter();
}

export function getSiteMetadataSummary(
  repo: SiteConfigProvider = defaultSiteRepository
): Pick<SiteIdentity, "headlineTitle" | "summary" | "canonicalUrl" | "domain" | "name" | "roleTitle"> {
  const identity = repo.getIdentity();
  return {
    headlineTitle: identity.headlineTitle,
    summary: identity.summary,
    canonicalUrl: identity.canonicalUrl,
    domain: identity.domain,
    name: identity.name,
    roleTitle: identity.roleTitle
  };
}

export function resolveNextThemeMode(currentMode: ThemeMode): ThemeMode {
  return currentMode === "light" ? "dark" : "light";
}

export function getThemePalette(
  mode: ThemeMode,
  repo: SiteConfigProvider = defaultSiteRepository
): ThemeTokenPalette {
  const palettes = repo.getThemePalettes();
  return palettes[mode] ?? palettes.light;
}
