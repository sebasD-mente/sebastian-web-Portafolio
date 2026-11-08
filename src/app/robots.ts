import type { MetadataRoute } from "next";
import { getSiteMetadataSummary } from "@/service/site.service";

export default function robots(): MetadataRoute.Robots {
  const siteMeta = getSiteMetadataSummary();
  const baseUrl = siteMeta.canonicalUrl.replace(/\/+$/, "");

  return {
    rules: [
      {
        userAgent: "*",
        allow: ["/", "/sistemas/"],
        disallow: ["/api/"]
      }
    ],
    sitemap: `${baseUrl}/sitemap.xml`,
    host: baseUrl
  };
}
