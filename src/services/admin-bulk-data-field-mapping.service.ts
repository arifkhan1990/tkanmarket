import { and, count, desc, eq, gte } from 'drizzle-orm'

import { getDb } from '@/db'
import { crawlerRuns } from '@/db/schema/crawler.schema'
import { AdminBulkDataService } from '@/services/admin-bulk-data.service'
import type { BulkDataFieldMappingResponse, BulkDataFieldMappingSystemField, BulkDataFieldMappingSystemFieldKey } from '@/types/admin-bulk-data-field-mapping.types'

function getSystemFields(): BulkDataFieldMappingSystemField[] {
  const fields: Array<BulkDataFieldMappingSystemField> = [
    {
      key: 'sku_id',
      label: 'Product SKU',
      validationLabel: 'UNIQUE_INT',
      validationIntent: 'success'
    },
    {
      key: 'display_title_eng',
      label: 'DISPLAY_TITLE_ENG',
      validationLabel: 'STRING_LEN_64',
      validationIntent: 'brand'
    },
    {
      key: 'wholesale_price_usd',
      label: 'WHOLESALE_PRICE_USD',
      validationLabel: 'DECIMAL_FIX_2',
      validationIntent: 'warning'
    },
    {
      key: 'warehouse_qty_avl',
      label: 'WAREHOUSE_QTY_AVL',
      validationLabel: 'INT_POSITIVE',
      validationIntent: 'success'
    }
  ]

  return fields
}

function safeKeywords(input: unknown): string[] {
  if (!Array.isArray(input)) return []
  const cleaned = input
    .map((v) => (typeof v === 'string' ? v.trim() : ''))
    .filter((v) => v.length > 0)
  return Array.from(new Set(cleaned)).slice(0, 20)
}

export class AdminBulkDataFieldMappingService {
  public static async get(): Promise<BulkDataFieldMappingResponse> {
    const [latestRunRows, sourceColumnsRows] = await Promise.all([
      getDb()
        .select({
          id: crawlerRuns.id,
          status: crawlerRuns.status,
          source: crawlerRuns.source,
          keywords: crawlerRuns.keywords,
          productsFound: crawlerRuns.productsFound,
          productsSaved: crawlerRuns.productsSaved,
          errorsCount: crawlerRuns.errorsCount,
          startedAt: crawlerRuns.startedAt,
          completedAt: crawlerRuns.completedAt
        })
        .from(crawlerRuns)
        .orderBy(desc(crawlerRuns.id))
        .limit(1),
      getDb()
        .select({ id: crawlerRuns.id, keywords: crawlerRuns.keywords })
        .from(crawlerRuns)
        .orderBy(desc(crawlerRuns.id))
        .where(eq(crawlerRuns.status, 'COMPLETED'))
        .limit(1)
    ])

    const latest = latestRunRows[0] ?? null
    const sourceColumns = safeKeywords(latest?.keywords ?? sourceColumnsRows[0]?.keywords)

    const base = await AdminBulkDataService.get()

    const systemFields = getSystemFields()

    return {
      activeRun: base.activeRun,
      runningCount: base.runningCount,
      recentHistory: base.recentHistory,
      metrics: base.metrics,
      availableSourceColumns: sourceColumns,
      systemFields
    }
  }

  public static buildKeywordsFromMapping(params: { mapping: Record<BulkDataFieldMappingSystemFieldKey, string> }) {
    const keywords = Object.values(params.mapping)
      .map((v) => v.trim())
      .filter((v) => v.length > 0)
    const unique = Array.from(new Set(keywords))
    return unique.slice(0, 20)
  }
}

