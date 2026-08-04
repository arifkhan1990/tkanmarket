import { getDb } from '@/db'
import { supplierDiscoveryRuns } from '@/db/schema/supplier-discovery.schema'
import { addCrawlerJob } from '@/lib/queue/helpers'
import { mergeSupplierDiscoveryCriteria } from '@/lib/validations/supplier-discovery.validation'
import type { CreateSupplierDiscoveryRunBody } from '@/types/supplier-discovery.types'

export class SupplierDiscoveryService {
  public static async createRun(
    body: CreateSupplierDiscoveryRunBody,
    triggeredById: number | null
  ): Promise<{ id: number }> {
    const criteria = mergeSupplierDiscoveryCriteria(body.criteria)
    const maxSuppliers = body.max_suppliers ?? 50
    const maxProductsPerSupplier = body.max_products_per_supplier ?? 10

    const db = getDb()
    const inserted = await db
      .insert(supplierDiscoveryRuns)
      .values({
        status: 'PENDING',
        sources: body.sources,
        criteriaJson: criteria,
        keywords: body.keywords,
        maxSuppliers,
        maxProductsPerSupplier,
        triggeredById,
        startedAt: null,
        completedAt: null,
        errorLog: null,
        updatedAt: new Date(),
        deletedAt: null
      })
      .returning({ id: supplierDiscoveryRuns.id })

    const row = inserted[0]
    if (!row) throw new Error('Failed to create supplier discovery run')

    await addCrawlerJob({
      kind: 'supplier_discovery',
      jobId: `supplier_discovery_run_${row.id}`,
      discoveryRunId: row.id,
      keywords: body.keywords,
      sources: body.sources,
      maxSuppliers,
      maxProductsPerSupplier
    })

    return { id: row.id }
  }
}
