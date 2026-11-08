import {
  ATELIER_MONOLITH_PALETTES,
  DEFAULT_THEME_MODE,
  getAmbientTelemetryDefaults,
  SITE_IDENTITY,
  SITE_NAVIGATION,
  SIX_LAYER_ARCHITECTURE
} from "@/config/site.config";
import type {
  AmbientTelemetryStatus,
  ArchitectureLayerSummary,
  NavigationItem,
  SiteConfigProvider,
  SiteIdentity,
  ThemeMode,
  ThemeTokenPalette
} from "@/types/portfolio";

export function createSiteRepository(): SiteConfigProvider {
  return {
    getIdentity(): SiteIdentity {
      return { ...SITE_IDENTITY };
    },
    getDefaultTheme(): ThemeMode {
      return DEFAULT_THEME_MODE;
    },
    getNavigation(): NavigationItem[] {
      return SITE_NAVIGATION.map((item) => ({ ...item }));
    },
    getAmbientTelemetry(): AmbientTelemetryStatus {
      return getAmbientTelemetryDefaults();
    },
    getThemePalettes(): Record<ThemeMode, ThemeTokenPalette> {
      return {
        light: { ...ATELIER_MONOLITH_PALETTES.light },
        dark: { ...ATELIER_MONOLITH_PALETTES.dark }
      };
    },
    getArchitectureLayers(): ArchitectureLayerSummary[] {
      return SIX_LAYER_ARCHITECTURE.map((layer) => ({ ...layer }));
    }
  };
}

export const defaultSiteRepository: SiteConfigProvider = createSiteRepository();
