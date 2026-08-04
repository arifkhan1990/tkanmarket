import type { PipelineRuleTransformKind, PipelineStage } from '@/lib/data-migration-pipeline-rules'

export type DataMigrationColumnKind =
  | 'string'
  | 'number'
  | 'boolean'
  | 'timestamp'
  | 'array'
  | 'json'
  | 'enum'
  | 'other'

export interface DataMigrationSchemaColumn {
  /** Real column name from the Drizzle table definition. */
  name: string
  /** High-level kind, derived from the Drizzle column type. */
  kind: DataMigrationColumnKind
  /** True when the column is `NOT NULL`. */
  notNull: boolean
}

export interface DataMigrationPipelineRuleDto {
  id: string
  sourceColumn: string
  targetColumn: string
  stage: PipelineStage
  transform: PipelineRuleTransformKind
  optional: boolean
}

export interface DataMigrationLatestRun {
  id: number | null
  status: string | null
  source: string | null
  productsFound: number
  productsSaved: number
  errorsCount: number
  startedAt: string | null
  completedAt: string | null
  /** Duration in seconds, computed from `completedAt - startedAt` (null when not completed). */
  durationSeconds: number | null
}

export interface DataMigrationSampleRow {
  /** Real fabrics.id of a row currently sitting in `raw_scraped` status. */
  id: number
  slug: string
  titleRu: string
  rawTitle: string | null
  sourceUrl: string | null
  supplierName: string
  createdAt: string
}

/**
 * Real ingest funnel — every field comes from `fabrics.status` and
 * `crawler_runs` aggregations. No fabricated values.
 */
export interface DataMigrationStats {
  /** fabrics.status = 'raw_scraped' (waiting for AI worker). */
  rawScraped: number
  /** fabrics.status = 'ai_processing' (currently in flight). */
  aiProcessing: number
  /** fabrics.status = 'ai_processed' (waiting for admin approval). */
  aiProcessed: number
  /** fabrics.status = 'approved'. */
  approved: number
  /** fabrics.status = 'rejected'. */
  rejected: number
  /** Sum of all non-deleted fabrics regardless of status. */
  totalFabrics: number
  /** Fabrics created in the last 24 hours. */
  ingestedLast24h: number
  /** Fabrics whose `ai_processed_at` falls in the last 24 hours. */
  aiProcessedLast24h: number
  /** Sum of `errors_count` from crawler runs in the last 7 days. */
  crawlerErrorsLast7d: number
  /** Sum of `products_saved` from completed crawler runs in the last 7 days. */
  crawlerSavedLast7d: number
  /** Number of crawler runs in the last 7 days. */
  crawlerRunsLast7d: number
}

export interface DataMigrationMappingResponse {
  generatedAt: string
  sourceColumns: DataMigrationSchemaColumn[]
  targetColumns: DataMigrationSchemaColumn[]
  pipelineRules: DataMigrationPipelineRuleDto[]
  stats: DataMigrationStats
  latestRun: DataMigrationLatestRun
  sampleRawProducts: DataMigrationSampleRow[]
}
