import { Pool, type PoolClient } from "pg";
import type {
  AsyncCatalogRepository,
  CatalogSectionId,
  CodeSnippetTab,
  PipelineStage,
  ProductionSystem,
  ProductionSystemCategory,
  ProductionSystemLayoutVariant,
  ProductionSystemsProvider,
  ProductionSystemUpsertInput,
  SolvedChallenge,
  SystemArchitectureSpec,
  SystemDeploymentLedger,
  SystemGalleryImage,
  SystemMetric
} from "@/types/portfolio";
import {
  buildProductionSystemRecordFromInput,
  buildRagKnowledgeDocument,
  defaultProductionSystemsRepository,
  normalizeSystemGalleryImages
} from "@/repo/systems.repo";

export const POSTGRES_CATALOG_SCHEMA_SQL = `
CREATE TABLE IF NOT EXISTS portfolio_systems (
  id TEXT PRIMARY KEY,
  display_order TEXT NOT NULL,
  slug TEXT NOT NULL UNIQUE,
  title TEXT NOT NULL,
  subtitle TEXT NOT NULL,
  catalog_section TEXT NOT NULL DEFAULT 'production-systems'
    CHECK (catalog_section IN ('production-systems', 'ai-projects')),
  category TEXT NOT NULL DEFAULT 'distributed-systems',
  category_label TEXT NOT NULL,
  project_header_label TEXT NOT NULL,
  version_badge TEXT NOT NULL,
  preview_image_src TEXT NOT NULL,
  preview_image_alt TEXT NOT NULL,
  highlighted_stack_tag TEXT NOT NULL,
  featured_on_home BOOLEAN NOT NULL DEFAULT TRUE,
  layout_variant TEXT NOT NULL DEFAULT 'primary-7-5',
  status TEXT NOT NULL DEFAULT 'PRODUCTION // ONLINE',
  live_metric_pill TEXT NOT NULL,
  summary TEXT NOT NULL,
  architectural_narrative TEXT NOT NULL,
  stack_tags JSONB NOT NULL DEFAULT '[]'::jsonb,
  metrics JSONB NOT NULL DEFAULT '[]'::jsonb,
  architecture_specs JSONB NOT NULL DEFAULT '[]'::jsonb,
  deployment_ledger JSONB NOT NULL DEFAULT '{}'::jsonb,
  terminal_preview_lines JSONB NOT NULL DEFAULT '[]'::jsonb,
  live_url TEXT NOT NULL,
  detail_href TEXT NOT NULL,
  pipeline_stages JSONB NOT NULL DEFAULT '[]'::jsonb,
  code_tabs JSONB NOT NULL DEFAULT '[]'::jsonb,
  solved_challenges JSONB NOT NULL DEFAULT '[]'::jsonb,
  rag_knowledge_document TEXT NOT NULL DEFAULT '',
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS portfolio_system_gallery (
  system_id TEXT NOT NULL REFERENCES portfolio_systems(id) ON DELETE CASCADE,
  slot SMALLINT NOT NULL CHECK (slot IN (1, 2, 3)),
  image_src TEXT NOT NULL DEFAULT '',
  image_alt TEXT NOT NULL,
  label TEXT NOT NULL,
  caption TEXT NOT NULL,
  PRIMARY KEY (system_id, slot)
);
`;

interface PostgresSystemRow {
  id: string;
  display_order: string;
  slug: string;
  title: string;
  subtitle: string;
  catalog_section: string;
  category: string;
  category_label: string;
  project_header_label: string;
  version_badge: string;
  preview_image_src: string;
  preview_image_alt: string;
  highlighted_stack_tag: string;
  featured_on_home: boolean;
  layout_variant: string;
  status: string;
  live_metric_pill: string;
  summary: string;
  architectural_narrative: string;
  stack_tags: string[];
  metrics: SystemMetric[];
  architecture_specs: SystemArchitectureSpec[];
  deployment_ledger: SystemDeploymentLedger;
  terminal_preview_lines: string[];
  live_url: string;
  detail_href: string;
  pipeline_stages: PipelineStage[];
  code_tabs: CodeSnippetTab[];
  solved_challenges: SolvedChallenge[];
  rag_knowledge_document: string;
}

interface PostgresGalleryRow {
  system_id: string;
  slot: number;
  image_src: string;
  image_alt: string;
  label: string;
  caption: string;
}

export interface PostgresPoolLike {
  connect(): Promise<PoolClient>;
  query<R = Record<string, unknown>>(
    text: string,
    values?: unknown[]
  ): Promise<{ rows: R[]; rowCount?: number | null }>;
}

export interface PostgresCatalogRepositoryOptions {
  connectionString?: string;
  pool?: PostgresPoolLike;
  fallbackRepo?: ProductionSystemsProvider;
}

let sharedPool: Pool | null = null;
let sharedPoolUrl = "";

function getOrCreateSharedPool(connectionString: string): Pool {
  if (!sharedPool || sharedPoolUrl !== connectionString) {
    sharedPool = new Pool({
      connectionString,
      max: 5,
      connectionTimeoutMillis: 2500,
      idleTimeoutMillis: 15000
    });
    sharedPoolUrl = connectionString;
  }
  return sharedPool;
}

function mapRowToProductionSystem(
  row: PostgresSystemRow,
  galleryRows: readonly PostgresGalleryRow[]
): ProductionSystem {
  const catalogSection: CatalogSectionId =
    row.catalog_section === "ai-projects"
      ? "ai-projects"
      : "production-systems";

  const rawGallery: SystemGalleryImage[] = galleryRows
    .filter((g) => g.slot === 1 || g.slot === 2 || g.slot === 3)
    .map((g) => ({
      slot: g.slot as 1 | 2 | 3,
      src: g.image_src ?? "",
      alt: g.image_alt ?? "",
      label: g.label ?? "",
      caption: g.caption ?? ""
    }));

  const galleryImages = normalizeSystemGalleryImages(rawGallery, row.title);

  const system: ProductionSystem = {
    id: row.id,
    order: row.display_order,
    slug: row.slug,
    title: row.title,
    subtitle: row.subtitle,
    catalogSection,
    category: (row.category as ProductionSystemCategory) || "distributed-systems",
    categoryLabel: row.category_label,
    projectHeaderLabel: row.project_header_label,
    versionBadge: row.version_badge,
    previewImageSrc: row.preview_image_src,
    previewImageAlt: row.preview_image_alt,
    highlightedStackTag: row.highlighted_stack_tag,
    featuredOnHome: Boolean(row.featured_on_home),
    layoutVariant:
      (row.layout_variant as ProductionSystemLayoutVariant) || "primary-7-5",
    status:
      (row.status as ProductionSystem["status"]) || "PRODUCTION // ONLINE",
    liveMetricPill: row.live_metric_pill,
    summary: row.summary,
    architecturalNarrative: row.architectural_narrative,
    stackTags: Array.isArray(row.stack_tags) ? row.stack_tags : [],
    metrics: Array.isArray(row.metrics) ? row.metrics : [],
    architectureSpecs: Array.isArray(row.architecture_specs)
      ? row.architecture_specs
      : [],
    deploymentLedger: row.deployment_ledger ?? {
      architecturePattern: "Stateless Cloud-Native",
      commitSha: "v1.0.0",
      hostEnvironment: "Ubuntu 24.04 LTS",
      verificationGate: "100/100"
    },
    terminalPreviewLines: Array.isArray(row.terminal_preview_lines)
      ? row.terminal_preview_lines
      : [],
    liveUrl: row.live_url,
    detailHref: row.detail_href || `/sistemas/${row.slug}`,
    galleryImages,
    pipelineStages: Array.isArray(row.pipeline_stages)
      ? row.pipeline_stages
      : [],
    codeTabs: Array.isArray(row.code_tabs) ? row.code_tabs : [],
    solvedChallenges: Array.isArray(row.solved_challenges)
      ? row.solved_challenges
      : [],
    ragKnowledgeDocument: row.rag_knowledge_document || ""
  };

  if (!system.ragKnowledgeDocument) {
    system.ragKnowledgeDocument = buildRagKnowledgeDocument(system);
  }

  return system;
}

async function persistSystemWithClient(
  client: PoolClient,
  record: ProductionSystem
): Promise<void> {
  const ragDoc = buildRagKnowledgeDocument(record);
  const gallery = normalizeSystemGalleryImages(
    record.galleryImages,
    record.title
  );

  await client.query(
    `
    INSERT INTO portfolio_systems (
      id,
      display_order,
      slug,
      title,
      subtitle,
      catalog_section,
      category,
      category_label,
      project_header_label,
      version_badge,
      preview_image_src,
      preview_image_alt,
      highlighted_stack_tag,
      featured_on_home,
      layout_variant,
      status,
      live_metric_pill,
      summary,
      architectural_narrative,
      stack_tags,
      metrics,
      architecture_specs,
      deployment_ledger,
      terminal_preview_lines,
      live_url,
      detail_href,
      pipeline_stages,
      code_tabs,
      solved_challenges,
      rag_knowledge_document,
      updated_at
    ) VALUES (
      $1, $2, $3, $4, $5, $6, $7, $8, $9, $10,
      $11, $12, $13, $14, $15, $16, $17, $18, $19, $20::jsonb,
      $21::jsonb, $22::jsonb, $23::jsonb, $24::jsonb, $25, $26, $27::jsonb, $28::jsonb, $29::jsonb, $30, NOW()
    )
    ON CONFLICT (slug) DO UPDATE SET
      display_order = EXCLUDED.display_order,
      title = EXCLUDED.title,
      subtitle = EXCLUDED.subtitle,
      catalog_section = EXCLUDED.catalog_section,
      category = EXCLUDED.category,
      category_label = EXCLUDED.category_label,
      project_header_label = EXCLUDED.project_header_label,
      version_badge = EXCLUDED.version_badge,
      preview_image_src = EXCLUDED.preview_image_src,
      preview_image_alt = EXCLUDED.preview_image_alt,
      highlighted_stack_tag = EXCLUDED.highlighted_stack_tag,
      featured_on_home = EXCLUDED.featured_on_home,
      layout_variant = EXCLUDED.layout_variant,
      status = EXCLUDED.status,
      live_metric_pill = EXCLUDED.live_metric_pill,
      summary = EXCLUDED.summary,
      architectural_narrative = EXCLUDED.architectural_narrative,
      stack_tags = EXCLUDED.stack_tags,
      metrics = EXCLUDED.metrics,
      architecture_specs = EXCLUDED.architecture_specs,
      deployment_ledger = EXCLUDED.deployment_ledger,
      terminal_preview_lines = EXCLUDED.terminal_preview_lines,
      live_url = EXCLUDED.live_url,
      detail_href = EXCLUDED.detail_href,
      pipeline_stages = EXCLUDED.pipeline_stages,
      code_tabs = EXCLUDED.code_tabs,
      solved_challenges = EXCLUDED.solved_challenges,
      rag_knowledge_document = EXCLUDED.rag_knowledge_document,
      updated_at = NOW();
    `,
    [
      record.id,
      record.order,
      record.slug,
      record.title,
      record.subtitle,
      record.catalogSection ?? "production-systems",
      record.category,
      record.categoryLabel,
      record.projectHeaderLabel ??
        `PROJECT ${record.order} // ${record.categoryLabel}`,
      record.versionBadge ?? "v1.0.0 PRODUCTION",
      record.previewImageSrc ?? "/assets/deco-vintage-preview.png",
      record.previewImageAlt ?? `Vista preliminar de ${record.title}`,
      record.highlightedStackTag ?? record.stackTags[0] ?? "TYPESCRIPT",
      record.featuredOnHome ?? true,
      record.layoutVariant,
      record.status,
      record.liveMetricPill,
      record.summary,
      record.architecturalNarrative,
      JSON.stringify(record.stackTags),
      JSON.stringify(record.metrics),
      JSON.stringify(record.architectureSpecs),
      JSON.stringify(record.deploymentLedger),
      JSON.stringify(record.terminalPreviewLines),
      record.liveUrl,
      record.detailHref,
      JSON.stringify(record.pipelineStages),
      JSON.stringify(record.codeTabs),
      JSON.stringify(record.solvedChallenges),
      ragDoc
    ]
  );

  const idRowResult = await client.query<{ id: string }>(
    `SELECT id FROM portfolio_systems WHERE slug = $1 LIMIT 1`,
    [record.slug]
  );
  const persistedSystemId = idRowResult.rows[0]?.id ?? record.id;

  await client.query(
    `DELETE FROM portfolio_system_gallery WHERE system_id = $1`,
    [persistedSystemId]
  );

  for (const img of gallery) {
    await client.query(
      `
      INSERT INTO portfolio_system_gallery (
        system_id,
        slot,
        image_src,
        image_alt,
        label,
        caption
      ) VALUES ($1, $2, $3, $4, $5, $6)
      `,
      [
        persistedSystemId,
        img.slot,
        img.src,
        img.alt,
        img.label,
        img.caption
      ]
    );
  }
}

export function createPostgresCatalogRepository(
  options: PostgresCatalogRepositoryOptions = {}
): AsyncCatalogRepository {
  const fallbackRepo = options.fallbackRepo ?? defaultProductionSystemsRepository;
  let schemaInitialized = false;

  function resolveConnectionString(): string {
    if (typeof options.connectionString === "string") {
      return options.connectionString.trim();
    }
    return (process.env.DATABASE_URL ?? "").trim();
  }

  function resolvePool(): PostgresPoolLike | null {
    if (options.pool) {
      return options.pool;
    }
    const connStr = resolveConnectionString();
    if (!connStr) {
      return null;
    }
    return getOrCreateSharedPool(connStr);
  }

  return {
    isPostgresConfigured(): boolean {
      return Boolean(options.pool || resolveConnectionString());
    },

    async ensureSchemaAndSeed(): Promise<void> {
      const pool = resolvePool();
      if (!pool || schemaInitialized) {
        return;
      }

      const client = await pool.connect();
      try {
        await client.query("BEGIN");
        await client.query(POSTGRES_CATALOG_SCHEMA_SQL);

        const countResult = await client.query<{ count: number }>(
          "SELECT COUNT(*)::int AS count FROM portfolio_systems"
        );
        const total = Number(countResult.rows[0]?.count ?? 0);

        if (total === 0) {
          const initialSystems = fallbackRepo.getAllProductionSystems();
          for (const sys of initialSystems) {
            await persistSystemWithClient(client, sys);
          }
        }

        await client.query("COMMIT");
        schemaInitialized = true;
      } catch (err) {
        await client.query("ROLLBACK").catch(() => undefined);
        throw err;
      } finally {
        client.release();
      }
    },

    async listSystems(): Promise<ProductionSystem[]> {
      const pool = resolvePool();
      if (!pool) {
        return fallbackRepo
          .getAllProductionSystems()
          .sort((a, b) => a.order.localeCompare(b.order));
      }

      try {
        await this.ensureSchemaAndSeed();
        const systemsResult = await pool.query<PostgresSystemRow>(
          "SELECT * FROM portfolio_systems ORDER BY display_order ASC, slug ASC"
        );
        const galleryResult = await pool.query<PostgresGalleryRow>(
          "SELECT * FROM portfolio_system_gallery ORDER BY system_id ASC, slot ASC"
        );

        const galleryBySystemId = new Map<string, PostgresGalleryRow[]>();
        for (const row of galleryResult.rows) {
          const list = galleryBySystemId.get(row.system_id) ?? [];
          list.push(row);
          galleryBySystemId.set(row.system_id, list);
        }

        return systemsResult.rows.map((row) =>
          mapRowToProductionSystem(
            row,
            galleryBySystemId.get(row.id) ?? []
          )
        );
      } catch {
        return fallbackRepo
          .getAllProductionSystems()
          .sort((a, b) => a.order.localeCompare(b.order));
      }
    },

    async getSystemBySlug(slug: string): Promise<ProductionSystem | null> {
      const normalized = typeof slug === "string" ? slug.trim().toLowerCase() : "";
      if (!normalized) {
        return null;
      }

      const pool = resolvePool();
      if (!pool) {
        return fallbackRepo.getProductionSystemBySlug(normalized);
      }

      try {
        await this.ensureSchemaAndSeed();
        const systemResult = await pool.query<PostgresSystemRow>(
          "SELECT * FROM portfolio_systems WHERE LOWER(slug) = $1 LIMIT 1",
          [normalized]
        );
        const row = systemResult.rows[0];
        if (!row) {
          return null;
        }

        const galleryResult = await pool.query<PostgresGalleryRow>(
          "SELECT * FROM portfolio_system_gallery WHERE system_id = $1 ORDER BY slot ASC",
          [row.id]
        );
        return mapRowToProductionSystem(row, galleryResult.rows);
      } catch {
        return fallbackRepo.getProductionSystemBySlug(normalized);
      }
    },

    async upsertSystem(
      input: ProductionSystemUpsertInput
    ): Promise<ProductionSystem> {
      const updatedFallback = fallbackRepo.upsertProductionSystem
        ? fallbackRepo.upsertProductionSystem(input)
        : buildProductionSystemRecordFromInput(
            input,
            fallbackRepo.getProductionSystemBySlug(input.slug)
          );

      const pool = resolvePool();
      if (!pool) {
        return updatedFallback;
      }

      try {
        await this.ensureSchemaAndSeed();
        const client = await pool.connect();
        try {
          await client.query("BEGIN");
          await persistSystemWithClient(client, updatedFallback);
          await client.query("COMMIT");
        } catch (err) {
          await client.query("ROLLBACK").catch(() => undefined);
          throw err;
        } finally {
          client.release();
        }
        const persisted = await this.getSystemBySlug(updatedFallback.slug);
        return persisted ?? updatedFallback;
      } catch {
        return updatedFallback;
      }
    },

    async deleteSystemBySlug(slug: string): Promise<boolean> {
      const normalized = typeof slug === "string" ? slug.trim().toLowerCase() : "";
      if (!normalized) {
        return false;
      }

      const deletedFromFallback = fallbackRepo.deleteProductionSystemBySlug
        ? fallbackRepo.deleteProductionSystemBySlug(normalized)
        : false;

      const pool = resolvePool();
      if (!pool) {
        return deletedFromFallback;
      }

      try {
        await this.ensureSchemaAndSeed();
        const result = await pool.query(
          "DELETE FROM portfolio_systems WHERE LOWER(slug) = $1",
          [normalized]
        );
        return Number(result.rowCount ?? 0) > 0 || deletedFromFallback;
      } catch {
        return deletedFromFallback;
      }
    }
  };
}

export const defaultPostgresCatalogRepository: AsyncCatalogRepository =
  createPostgresCatalogRepository();
