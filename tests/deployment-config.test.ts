import fs from "node:fs";
import path from "node:path";
import { describe, expect, it } from "vitest";
import robots from "@/app/robots";
import sitemap from "@/app/sitemap";
import { metadata as rootMetadata } from "@/app/layout";

const REPO_ROOT = path.resolve(__dirname, "..");

function readRepoFile(relPath: string): string {
  return fs.readFileSync(path.join(REPO_ROOT, relPath), "utf8");
}

describe("feat-006: Empaquetado Docker Multi-Stage, SEO dekolabs.org y Guía de Despliegue", () => {
  it("genera robots.txt canónico para dekolabs.org permitiendo el catálogo y bloqueando /api/", () => {
    const robotsConfig = robots();

    expect(robotsConfig.host).toBe("https://dekolabs.org");
    expect(robotsConfig.sitemap).toBe("https://dekolabs.org/sitemap.xml");
    expect(Array.isArray(robotsConfig.rules)).toBe(true);

    const rulesList = Array.isArray(robotsConfig.rules)
      ? robotsConfig.rules
      : [robotsConfig.rules];
    expect(rulesList[0]).toEqual({
      userAgent: "*",
      allow: ["/", "/sistemas/"],
      disallow: ["/api/"]
    });
  });

  it("genera sitemap.xml determinista con la raíz dekolabs.org y los 4 casos de estudio /sistemas/[slug]", () => {
    const entries = sitemap();

    expect(entries).toHaveLength(5);
    expect(entries[0]?.url).toBe("https://dekolabs.org");
    expect(entries[0]?.priority).toBe(1.0);
    expect(entries[0]?.changeFrequency).toBe("weekly");

    const systemUrls = entries.slice(1).map((item) => item.url);
    expect(systemUrls).toEqual([
      "https://dekolabs.org/sistemas/deco-vintage-platform",
      "https://dekolabs.org/sistemas/aegis-autonomous-data-fabric",
      "https://dekolabs.org/sistemas/chameleon-agentic-harness",
      "https://dekolabs.org/sistemas/monolith-homelab-cloud-edge"
    ]);
    for (const item of entries.slice(1)) {
      expect(item.priority).toBe(0.85);
      expect(item.changeFrequency).toBe("monthly");
    }
  });

  it("expone metadatos OpenGraph, Twitter y URL canónica en RootLayout sin saltar capas", () => {
    expect(rootMetadata.metadataBase?.toString()).toBe("https://dekolabs.org/");
    expect(rootMetadata.openGraph).toBeDefined();
    expect(rootMetadata.twitter).toBeDefined();
    expect(rootMetadata.alternates?.canonical).toBe("/");
  });

  it("verifica invariantes de producción y seguridad en Dockerfile, docker-compose.yml, .dockerignore, .env.example y guía Home Lab", () => {
    const dockerfile = readRepoFile("Dockerfile");
    const compose = readRepoFile("docker-compose.yml");
    const dockerignore = readRepoFile(".dockerignore");
    const envExample = readRepoFile(".env.example");
    const deploymentDoc = readRepoFile("docs/design-docs/homelab-deployment.md");

    // 1. Dockerfile multi-stage node:22-alpine no-root y HEALTHCHECK
    expect(dockerfile).toContain("FROM node:22-alpine AS deps");
    expect(dockerfile).toContain("FROM node:22-alpine AS builder");
    expect(dockerfile).toContain("FROM node:22-alpine AS runner");
    expect(dockerfile).toContain("ENV NEXT_DOCKER_BUILD=1");
    expect(dockerfile).toContain("USER nextjs");
    expect(dockerfile).toContain("EXPOSE 3000");
    expect(dockerfile).toContain("http://127.0.0.1:3000/api/health");
    expect(dockerfile).toContain('CMD ["node", "server.js"]');

    // 2. docker-compose.yml endurecido para Ubuntu Linux Home Lab y Reverse Proxy
    expect(compose).toContain("container_name: dekolabs-portfolio");
    expect(compose).toContain('"127.0.0.1:3000:3000"');
    expect(compose).toContain("no-new-privileges:true");
    expect(compose).toContain("read_only: true");
    expect(compose).toContain("mem_limit: 256m");
    expect(compose).toContain("http://127.0.0.1:3000/api/health");

    // 3. .dockerignore y .env.example seguros
    expect(dockerignore).toContain("node_modules");
    expect(dockerignore).toContain(".next");
    expect(dockerignore).toContain(".env");
    expect(dockerignore).toContain("!.env.example");
    expect(envExample).toContain("PORT=3000");
    expect(envExample).toContain('HOMELAB_PUBLIC_DOMAIN="dekolabs.org"');

    // 4. Documentación operativa y 0 CRLF
    expect(deploymentDoc).toContain("docker compose up -d --build");
    expect(deploymentDoc).toContain("HOME-LAB: UBUNTU-NODE-01");
    for (const content of [dockerfile, compose, dockerignore, envExample, deploymentDoc]) {
      expect(content.includes("\r")).toBe(false);
    }
  });
});
