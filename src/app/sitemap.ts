import type { MetadataRoute } from "next";
import { getSiteMetadataSummary } from "@/service/site.service";
import { getAllProductionSystemSlugs } from "@/service/systems.service";

const DETERMINISTIC_LAST_MODIFIED = new Date("2026-11-07T00:00:00.000Z");

export default function sitemap(): MetadataRoute.Sitemap {
  const siteMeta = getSiteMetadataSummary();
  const baseUrl = siteMeta.canonicalUrl.replace(/\/+$/, "");
  const slugs = getAllProductionSystemSlugs();

  const rootEntry: MetadataRoute.Sitemap[number] = {
    url: baseUrl,
    lastModified: DETERMINISTIC_LAST_MODIFIED,
    changeFrequency: "weekly",
    priority: 1.0
  };

  const systemEntries: MetadataRoute.Sitemap = slugs.map(({ slug }) => ({
    url: `${baseUrl}/sistemas/${slug}`,
    lastModified: DETERMINISTIC_LAST_MODIFIED,
    changeFrequency: "monthly",
    priority: 0.85
  }));

  return [rootEntry, ...systemEntries];
}
