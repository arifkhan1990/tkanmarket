import { desc, eq, isNull } from 'drizzle-orm'

import { getDb } from '@/db'
import { crawlerRuns } from '@/db/schema/crawler.schema'
import { rawProducts } from '@/db/schema/raw-products.schema'
import type { CatalogImportPreviewResponse, CatalogImportPreviewRow } from '@/types/catalog-import.types'

export class AdminCatalogImportPreviewService {
  public static async get(): Promise<CatalogImportPreviewResponse> {
    const db = getDb()

    const [latestRun, lastCompleted, samples] = await Promise.all([
      db
        .select({
          completedAt: crawlerRuns.completedAt,
          source: crawlerRuns.source,
          status: crawlerRuns.status
        })
        .from(crawlerRuns)
        .orderBy(desc(crawlerRuns.id))
        .limit(1),
      db
        .select({
          completedAt: crawlerRuns.completedAt,
          source: crawlerRuns.source
        })
        .from(crawlerRuns)
        .where(eq(crawlerRuns.status, 'COMPLETED'))
        .orderBy(desc(crawlerRuns.id))
        .limit(1),
      db
        .select({
          id: rawProducts.id,
          rawTitle: rawProducts.rawTitle,
          priceText: rawProducts.priceText,
          productUrl: rawProducts.productUrl
        })
        .from(rawProducts)
        .where(isNull(rawProducts.deletedAt))
        .orderBy(desc(rawProducts.id))
        .limit(3)
    ])

    const lastSuccessfulAt = lastCompleted[0]?.completedAt?.toISOString() ?? null

    const rows: CatalogImportPreviewRow[] = samples.map((p) => {
      const title = p.rawTitle?.trim() ?? ''
      const invalid = title.length === 0 || title.toLowerCase() === 'null'
      return {
        id: p.id,
        skuOrId: `RAW-${p.id}`,
        title: invalid ? 'null' : title,
        priceText: p.priceText,
        status: invalid ? 'invalid' : 'valid',
        statusDetail: invalid ? 'Invalid Field' : null
      }
    })

    return {
      rows,
      connection: {
        lastSuccessfulAt,
        feedSourceLabel: latestRun[0]?.source ? `${latestRun[0].source.toUpperCase()}_FEED` : 'NO_RUN_YET',
        refreshNote: 'Crawler jobs refresh catalog sources on a schedule configured in operations.'
      }
    }
  }
}
