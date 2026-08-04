/**
 * Canonical documentation of the actual ingest pipeline.
 *
 * These rules are the source-of-truth list of how the crawler and the AI worker
 * populate the `fabrics` table from raw supplier data. They are derived from
 * reading the live worker source code:
 *
 *   - Crawler stage:    src/services/crawler.service.ts (insert into `fabrics`)
 *   - AI worker stage:  src/services/ai.service.ts (`AIService.processFabric`)
 *
 * The legacy PRD diagram suggested a separate `raw_products` table as the
 * source. The actual implementation skips that table and writes raw fields
 * directly into `fabrics` (status `raw_scraped`), then the AI worker enriches
 * the SAME row in place. These rules describe what the code does, not what
 * the PRD diagram says.
 *
 * Updating a rule here without touching the matching worker code is a bug.
 */

export type PipelineStage = 'CRAWLER' | 'AI_WORKER'

export type PipelineRuleTransformKind =
  | 'CRAWLER_DIRECT_COPY'
  | 'CRAWLER_PRESERVE_RAW'
  | 'CRAWLER_COPY_IMAGES'
  | 'AI_TRANSLATE_EN'
  | 'AI_GENERATE_DESCRIPTION_EN'
  | 'AI_GENERATE_SEO_META'
  | 'AI_CLASSIFY_FABRIC_TYPE'
  | 'AI_EXTRACT_NUMBER'
  | 'AI_NORMALIZE_PRICE'
  | 'AI_PARSE_COMPOSITION'
  | 'AI_EXTRACT_TAGS'
  | 'AI_SET_CONFIDENCE'
  | 'AI_SET_TIMESTAMP'
  | 'AI_TRANSITION_STATUS'

export interface DataMigrationPipelineRule {
  id: string
  /** Conceptual source. For crawler rules this is a `scraped_product.*` field;
   *  for AI worker rules it is a `fabrics.*` raw input column. */
  sourceColumn: string
  /** The `fabrics.*` column the worker writes to. */
  targetColumn: string
  stage: PipelineStage
  transform: PipelineRuleTransformKind
  /** True when the worker may leave the target null on best-effort failure. */
  optional: boolean
}

export const DATA_MIGRATION_PIPELINE_RULES: DataMigrationPipelineRule[] = [
  // ---------------- Crawler stage (scraped_product → fabrics) ----------------
  {
    id: 'crawler-title-ru',
    stage: 'CRAWLER',
    sourceColumn: 'scraped_product.title',
    targetColumn: 'fabrics.title_ru',
    transform: 'CRAWLER_DIRECT_COPY',
    optional: false
  },
  {
    id: 'crawler-raw-title',
    stage: 'CRAWLER',
    sourceColumn: 'scraped_product.title',
    targetColumn: 'fabrics.raw_title',
    transform: 'CRAWLER_PRESERVE_RAW',
    optional: false
  },
  {
    id: 'crawler-description-ru',
    stage: 'CRAWLER',
    sourceColumn: 'scraped_product.description',
    targetColumn: 'fabrics.description_ru',
    transform: 'CRAWLER_DIRECT_COPY',
    optional: true
  },
  {
    id: 'crawler-raw-description',
    stage: 'CRAWLER',
    sourceColumn: 'scraped_product.description',
    targetColumn: 'fabrics.raw_description',
    transform: 'CRAWLER_PRESERVE_RAW',
    optional: true
  },
  {
    id: 'crawler-images',
    stage: 'CRAWLER',
    sourceColumn: 'scraped_product.imageUrls',
    targetColumn: 'fabrics.images',
    transform: 'CRAWLER_COPY_IMAGES',
    optional: false
  },
  {
    id: 'crawler-source-url',
    stage: 'CRAWLER',
    sourceColumn: 'scraped_product.url',
    targetColumn: 'fabrics.source_url',
    transform: 'CRAWLER_DIRECT_COPY',
    optional: false
  },

  // ---------------- AI worker stage (fabrics → fabrics in-place) -------------
  {
    id: 'ai-title-en',
    stage: 'AI_WORKER',
    sourceColumn: 'fabrics.raw_title',
    targetColumn: 'fabrics.title_en',
    transform: 'AI_TRANSLATE_EN',
    optional: true
  },
  {
    id: 'ai-description-en',
    stage: 'AI_WORKER',
    sourceColumn: 'fabrics.raw_description',
    targetColumn: 'fabrics.description_en',
    transform: 'AI_GENERATE_DESCRIPTION_EN',
    optional: true
  },
  {
    id: 'ai-meta-title-ru',
    stage: 'AI_WORKER',
    sourceColumn: 'fabrics.raw_title',
    targetColumn: 'fabrics.meta_title_ru',
    transform: 'AI_GENERATE_SEO_META',
    optional: true
  },
  {
    id: 'ai-meta-description-ru',
    stage: 'AI_WORKER',
    sourceColumn: 'fabrics.raw_description',
    targetColumn: 'fabrics.meta_description_ru',
    transform: 'AI_GENERATE_SEO_META',
    optional: true
  },
  {
    id: 'ai-fabric-type',
    stage: 'AI_WORKER',
    sourceColumn: 'fabrics.raw_title',
    targetColumn: 'fabrics.fabric_type',
    transform: 'AI_CLASSIFY_FABRIC_TYPE',
    optional: true
  },
  {
    id: 'ai-gsm',
    stage: 'AI_WORKER',
    sourceColumn: 'fabrics.raw_description',
    targetColumn: 'fabrics.gsm',
    transform: 'AI_EXTRACT_NUMBER',
    optional: true
  },
  {
    id: 'ai-width-cm',
    stage: 'AI_WORKER',
    sourceColumn: 'fabrics.raw_description',
    targetColumn: 'fabrics.width_cm',
    transform: 'AI_EXTRACT_NUMBER',
    optional: true
  },
  {
    id: 'ai-moq',
    stage: 'AI_WORKER',
    sourceColumn: 'fabrics.raw_description',
    targetColumn: 'fabrics.moq',
    transform: 'AI_EXTRACT_NUMBER',
    optional: true
  },
  {
    id: 'ai-price-usd',
    stage: 'AI_WORKER',
    sourceColumn: 'fabrics.raw_description',
    targetColumn: 'fabrics.price_usd',
    transform: 'AI_NORMALIZE_PRICE',
    optional: true
  },
  {
    id: 'ai-composition',
    stage: 'AI_WORKER',
    sourceColumn: 'fabrics.raw_description',
    targetColumn: 'fabrics.composition',
    transform: 'AI_PARSE_COMPOSITION',
    optional: true
  },
  {
    id: 'ai-tags',
    stage: 'AI_WORKER',
    sourceColumn: 'fabrics.raw_title',
    targetColumn: 'fabrics.tags',
    transform: 'AI_EXTRACT_TAGS',
    optional: true
  },
  {
    id: 'ai-confidence',
    stage: 'AI_WORKER',
    sourceColumn: '(internal)',
    targetColumn: 'fabrics.ai_confidence_score',
    transform: 'AI_SET_CONFIDENCE',
    optional: false
  },
  {
    id: 'ai-processed-at',
    stage: 'AI_WORKER',
    sourceColumn: '(internal)',
    targetColumn: 'fabrics.ai_processed_at',
    transform: 'AI_SET_TIMESTAMP',
    optional: false
  },
  {
    id: 'ai-status',
    stage: 'AI_WORKER',
    sourceColumn: 'fabrics.status',
    targetColumn: 'fabrics.status',
    transform: 'AI_TRANSITION_STATUS',
    optional: false
  }
]
