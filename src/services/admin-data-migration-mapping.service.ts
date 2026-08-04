import { and, count, desc, eq, getTableColumns, gte, isNotNull, isNull, sql } from 'drizzle-orm'

import { getDb } from '@/db'
import { crawlerRuns } from '@/db/schema/crawler.schema'
import { fabrics } from '@/db/schema/fabrics.schema'
import { suppliers } from '@/db/schema/suppliers.schema'
import {
  DATA_MIGRATION_PIPELINE_RULES,
  type DataMigrationPipelineRule
} from '@/lib/data-migration-pipeline-rules'
import type {
  DataMigrationColumnKind,
  DataMigrationLatestRun,
  DataMigrationMappingResponse,
  DataMigrationPipelineRuleDto,
  DataMigrationSampleRow,
  DataMigrationSchemaColumn,
  DataMigrationStats
} from '@/types/admin-data-migration-mapping.types'

/**
 * Curated subset of `fabrics` columns the CRAWLER writes (raw inputs).
 * See: src/services/crawler.service.ts (insert into fabrics).
 */
const SOURCE_FABRIC_COLUMNS: ReadonlySet<string> = new Set([
  'title_ru',
  'description_ru',
  'raw_title',
  'raw_description',
  'images',
  'source_url',
  'supplier_id',
  'slug'
])

/**
 * Curated subset of `fabrics` columns the AI WORKER writes (canonical fields).
 * See: src/services/ai.service.ts (`AIService.processFabric`).
 */
const TARGET_FABRIC_COLUMNS: ReadonlySet<string> = new Set([
  'title_en',
  'description_en',
  'meta_title_ru',
  'meta_description_ru',
  'fabric_type',
  'gsm',
  'width_cm',
  'moq',
  'price_usd',
  'composition',
  'tags',
  'ai_confidence_score',
  'ai_processed_at',
  'status'
])

function dataTypeToKind(dataType: string, columnType: string): DataMigrationColumnKind {
  const lowered = (columnType ?? '').toLowerCase()
  if (lowered.includes('enum')) return 'enum'
  if (lowered.includes('array')) return 'array'
  switch (dataType) {
    case 'string':
      return 'string'
    case 'number':
    case 'bigint':
      return 'number'
    case 'boolean':
      return 'boolean'
    case 'date':
      return 'timestamp'
    case 'json':
    case 'jsonb':
    case 'object':
      return 'json'
    case 'array':
      return 'array'
    default:
      return 'other'
  }
}

function pickFabricColumns(filterSet: ReadonlySet<string>): DataMigrationSchemaColumn[] {
  const cols = getTableColumns(fabrics)
  return Object.values(cols)
    .filter((c) => filterSet.has(c.name))
    .map((c) => ({
      name: c.name,
      kind: dataTypeToKind(c.dataType, c.columnType),
      notNull: c.notNull
    }))
}

function ruleToDto(rule: DataMigrationPipelineRule): DataMigrationPipelineRuleDto {
  return {
    id: rule.id,
    sourceColumn: rule.sourceColumn,
    targetColumn: rule.targetColumn,
    stage: rule.stage,
    transform: rule.transform,
    optional: rule.optional
  }
}

export class AdminDataMigrationMappingService {
  /**
   * Performance contract:
   *  - Six SQL statements, ALL dispatched concurrently via `Promise.all`:
   *    1. Fabric ingest funnel — counts by status collapsed into ONE statement
   *       using `COUNT(*) FILTER (...)`.
   *    2. Count of fabrics created in the last 24 hours.
   *    3. Count of fabrics AI-processed in the last 24 hours.
   *    4. Crawler 7-day errors + saved totals + run count (single statement).
   *    5. Latest crawler run (LIMIT 1, ORDER BY id DESC).
   *    6. Sample raw fabrics (LIMIT 5, status = 'raw_scraped', joined to suppliers).
   *  - Source and target column lists come from compile-time Drizzle introspection
   *    (`getTableColumns`) — zero database round-trips for schema metadata.
   *  - Pipeline rules are configuration-as-code derived from reading the worker
   *    source — zero database round-trips, zero string interpolation.
   *  - All counts hit indexed predicates (`fabrics_status_deleted_at_idx`,
   *    `fabrics_supplier_id_idx`, `crawler_runs` PK).
   *  - Sample-rows query joins once to `suppliers` — no per-row follow-ups. **No N+1.**
   *
   * Security contract:
   *  - Caller MUST be an authenticated admin (enforced at the route layer).
   *  - All queries scope `deletedAt IS NULL` on every joined table.
   *  - Endpoint is read-only and takes no user input.
   *
   * Honesty contract:
   *  - Returns ONLY real data tied to what the live workers do.
   *  - The funnel counts come straight from `fabrics.status` — the same column
   *    the AI worker transitions through (`raw_scraped` → `ai_processing` →
   *    `ai_processed` → `approved` / `rejected`).
   *  - The pipeline rules (configuration-as-code) describe the actual code path:
   *    crawler writes raw fields directly into `fabrics`, and the AI worker
   *    enriches the SAME row in place. The legacy `raw_products` table is not
   *    used by either worker and is not surfaced here.
   */
  public static async get(): Promise<DataMigrationMappingResponse> {
    const db = getDb()
    const now = new Date()
    const last24h = new Date(now.getTime() - 24 * 60 * 60 * 1000)
    const last7d = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000)

    const funnelPromise = db
      .select({
        rawScraped: sql<number>`COUNT(*) FILTER (WHERE ${fabrics.status} = 'raw_scraped')::int`,
        aiProcessing: sql<number>`COUNT(*) FILTER (WHERE ${fabrics.status} = 'ai_processing')::int`,
        aiProcessed: sql<number>`COUNT(*) FILTER (WHERE ${fabrics.status} = 'ai_processed')::int`,
        approved: sql<number>`COUNT(*) FILTER (WHERE ${fabrics.status} = 'approved')::int`,
        rejected: sql<number>`COUNT(*) FILTER (WHERE ${fabrics.status} = 'rejected')::int`,
        total: sql<number>`COUNT(*)::int`
      })
      .from(fabrics)
      .where(isNull(fabrics.deletedAt))

    // Two parallel typed count() queries — Drizzle binds the Date as a proper
    // timestamptz parameter via `gte`. Avoids `sql<number>\`...\`` template
    // interpolation of Date objects which fails for some drivers.
    const ingestedLast24hPromise = db
      .select({ c: count() })
      .from(fabrics)
      .where(and(isNull(fabrics.deletedAt), gte(fabrics.createdAt, last24h)))

    const aiProcessedLast24hPromise = db
      .select({ c: count() })
      .from(fabrics)
      .where(
        and(
          isNull(fabrics.deletedAt),
          isNotNull(fabrics.aiProcessedAt),
          gte(fabrics.aiProcessedAt, last24h)
        )
      )

    const crawlerLast7dPromise = db
      .select({
        errors: sql<number>`COALESCE(SUM(${crawlerRuns.errorsCount}), 0)::int`,
        saved: sql<number>`COALESCE(SUM(${crawlerRuns.productsSaved}) FILTER (WHERE ${crawlerRuns.status} = 'COMPLETED'), 0)::int`,
        runs: sql<number>`COUNT(*)::int`
      })
      .from(crawlerRuns)
      .where(gte(crawlerRuns.createdAt, last7d))

    const latestRunPromise = db
      .select({
        id: crawlerRuns.id,
        status: crawlerRuns.status,
        source: crawlerRuns.source,
        productsFound: crawlerRuns.productsFound,
        productsSaved: crawlerRuns.productsSaved,
        errorsCount: crawlerRuns.errorsCount,
        startedAt: crawlerRuns.startedAt,
        completedAt: crawlerRuns.completedAt
      })
      .from(crawlerRuns)
      .orderBy(desc(crawlerRuns.id))
      .limit(1)

    const sampleRowsPromise = db
      .select({
        id: fabrics.id,
        slug: fabrics.slug,
        titleRu: fabrics.titleRu,
        rawTitle: fabrics.rawTitle,
        sourceUrl: fabrics.sourceUrl,
        supplierName: suppliers.name,
        createdAt: fabrics.createdAt
      })
      .from(fabrics)
      .innerJoin(suppliers, eq(fabrics.supplierId, suppliers.id))
      .where(
        and(
          isNull(fabrics.deletedAt),
          isNull(suppliers.deletedAt),
          eq(fabrics.status, 'raw_scraped')
        )
      )
      .orderBy(desc(fabrics.id))
      .limit(5)

    const [
      funnelRows,
      ingestedLast24hRows,
      aiProcessedLast24hRows,
      crawler7dRows,
      latestRunRows,
      sampleRows
    ] = await Promise.all([
      funnelPromise,
      ingestedLast24hPromise,
      aiProcessedLast24hPromise,
      crawlerLast7dPromise,
      latestRunPromise,
      sampleRowsPromise
    ])

    const sourceColumns = pickFabricColumns(SOURCE_FABRIC_COLUMNS)
    const targetColumns = pickFabricColumns(TARGET_FABRIC_COLUMNS)
    const pipelineRules: DataMigrationPipelineRuleDto[] = DATA_MIGRATION_PIPELINE_RULES.map(ruleToDto)

    const f = funnelRows[0]
    const c7 = crawler7dRows[0]
    const latestRow = latestRunRows[0]

    const stats: DataMigrationStats = {
      rawScraped: Number(f?.rawScraped ?? 0),
      aiProcessing: Number(f?.aiProcessing ?? 0),
      aiProcessed: Number(f?.aiProcessed ?? 0),
      approved: Number(f?.approved ?? 0),
      rejected: Number(f?.rejected ?? 0),
      totalFabrics: Number(f?.total ?? 0),
      ingestedLast24h: Number(ingestedLast24hRows[0]?.c ?? 0),
      aiProcessedLast24h: Number(aiProcessedLast24hRows[0]?.c ?? 0),
      crawlerErrorsLast7d: Number(c7?.errors ?? 0),
      crawlerSavedLast7d: Number(c7?.saved ?? 0),
      crawlerRunsLast7d: Number(c7?.runs ?? 0)
    }

    let durationSeconds: number | null = null
    if (latestRow?.startedAt && latestRow?.completedAt) {
      durationSeconds = Math.max(
        0,
        Math.round((latestRow.completedAt.getTime() - latestRow.startedAt.getTime()) / 1000)
      )
    }

    const latestRun: DataMigrationLatestRun = {
      id: latestRow?.id ?? null,
      status: latestRow?.status ?? null,
      source: latestRow?.source ?? null,
      productsFound: latestRow?.productsFound ?? 0,
      productsSaved: latestRow?.productsSaved ?? 0,
      errorsCount: latestRow?.errorsCount ?? 0,
      startedAt: latestRow?.startedAt ? latestRow.startedAt.toISOString() : null,
      completedAt: latestRow?.completedAt ? latestRow.completedAt.toISOString() : null,
      durationSeconds
    }

    const sampleRawProducts: DataMigrationSampleRow[] = sampleRows.map((r) => ({
      id: r.id,
      slug: r.slug,
      titleRu: r.titleRu,
      rawTitle: r.rawTitle,
      sourceUrl: r.sourceUrl,
      supplierName: r.supplierName,
      createdAt: r.createdAt.toISOString()
    }))

    return {
      generatedAt: now.toISOString(),
      sourceColumns,
      targetColumns,
      pipelineRules,
      stats,
      latestRun,
      sampleRawProducts
    }
  }
}
