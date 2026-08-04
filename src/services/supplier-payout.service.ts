import { and, desc, eq, inArray, isNull, sql } from 'drizzle-orm'

import { getDb } from '@/db'
import { supplierPayoutRequests } from '@/db/schema/supplier-ops.schema'
import { suppliers } from '@/db/schema/suppliers.schema'
import type {
  SupplierPayoutLedgerItemDto,
  SupplierPayoutRequestDto,
  SupplierPayoutStatus,
  SupplierPayoutSummaryDto
} from '@/types/supplier-ops.types'

export class SupplierPayoutService {
  public static async listPendingAndReviewing(): Promise<SupplierPayoutRequestDto[]> {
    const db = getDb()
    const rows = await db
      .select({
        id: supplierPayoutRequests.id,
        supplierId: supplierPayoutRequests.supplierId,
        supplierName: suppliers.name,
        supplierSlug: suppliers.slug,
        requestedAmount: supplierPayoutRequests.requestedAmount,
        balanceSnapshot: supplierPayoutRequests.balanceSnapshot,
        bankLabel: supplierPayoutRequests.bankLabel,
        accountMask: supplierPayoutRequests.accountMask,
        swiftCode: supplierPayoutRequests.swiftCode,
        status: supplierPayoutRequests.status,
        resolutionNote: supplierPayoutRequests.resolutionNote,
        processedAt: supplierPayoutRequests.processedAt,
        createdAt: supplierPayoutRequests.createdAt,
        updatedAt: supplierPayoutRequests.updatedAt
      })
      .from(supplierPayoutRequests)
      .innerJoin(suppliers, eq(supplierPayoutRequests.supplierId, suppliers.id))
      .where(
        and(
          isNull(supplierPayoutRequests.deletedAt),
          isNull(suppliers.deletedAt),
          inArray(supplierPayoutRequests.status, ['PENDING', 'REVIEWING'])
        )
      )
      .orderBy(desc(supplierPayoutRequests.createdAt))

    return rows.map((r) => ({
      id: r.id,
      supplierId: r.supplierId,
      supplierName: r.supplierName,
      supplierSlug: r.supplierSlug,
      requestedAmount: String(r.requestedAmount),
      balanceSnapshot: String(r.balanceSnapshot),
      bankLabel: r.bankLabel,
      accountMask: r.accountMask,
      swiftCode: r.swiftCode,
      status: r.status as SupplierPayoutStatus,
      resolutionNote: r.resolutionNote,
      processedAt: r.processedAt ? r.processedAt.toISOString() : null,
      createdAt: r.createdAt.toISOString(),
      updatedAt: r.updatedAt.toISOString()
    }))
  }

  public static async getSummary(): Promise<SupplierPayoutSummaryDto> {
    const db = getDb()
    const pending = await db
      .select({
        sum: sql<string>`coalesce(sum(${supplierPayoutRequests.requestedAmount}), 0)::text`
      })
      .from(supplierPayoutRequests)
      .where(
        and(
          isNull(supplierPayoutRequests.deletedAt),
          inArray(supplierPayoutRequests.status, ['PENDING', 'REVIEWING'])
        )
      )

    const ledgerRows = await db
      .select({
        id: supplierPayoutRequests.id,
        supplierName: suppliers.name,
        requestedAmount: supplierPayoutRequests.requestedAmount,
        status: supplierPayoutRequests.status,
        processedAt: supplierPayoutRequests.processedAt,
        updatedAt: supplierPayoutRequests.updatedAt,
        resolutionNote: supplierPayoutRequests.resolutionNote
      })
      .from(supplierPayoutRequests)
      .innerJoin(suppliers, eq(supplierPayoutRequests.supplierId, suppliers.id))
      .where(
        and(
          isNull(supplierPayoutRequests.deletedAt),
          isNull(suppliers.deletedAt),
          inArray(supplierPayoutRequests.status, ['PAID', 'REJECTED'])
        )
      )
      .orderBy(desc(supplierPayoutRequests.processedAt), desc(supplierPayoutRequests.updatedAt))
      .limit(12)

    const ledger: SupplierPayoutLedgerItemDto[] = ledgerRows.map((r) => {
      const isPaid = r.status === 'PAID'
      return {
        id: r.id,
        kind: isPaid ? 'payout' : 'rejected',
        referenceLabel: isPaid ? `Payout #${r.id}` : `Rejected #${r.id}`,
        supplierName: r.supplierName,
        amount: String(r.requestedAmount),
        statusLabel: isPaid
          ? `Paid${r.processedAt ? ` · ${r.processedAt.toISOString()}` : ''}`
          : `Declined${r.resolutionNote ? ` · ${r.resolutionNote}` : ''}`,
        occurredAt: (r.processedAt ?? r.updatedAt).toISOString()
      }
    })

    return {
      totalPendingAmount: pending[0]?.sum ?? '0',
      ledger
    }
  }

  public static async updateStatus(
    id: number,
    input: { status: SupplierPayoutStatus; resolutionNote?: string | null }
  ): Promise<SupplierPayoutRequestDto | null> {
    const db = getDb()
    const processedAt = input.status === 'PAID' || input.status === 'REJECTED' ? new Date() : null

    const updated = await db
      .update(supplierPayoutRequests)
      .set({
        status: input.status,
        resolutionNote: input.resolutionNote ?? null,
        ...(processedAt ? { processedAt } : { processedAt: null }),
        updatedAt: new Date()
      })
      .where(and(eq(supplierPayoutRequests.id, id), isNull(supplierPayoutRequests.deletedAt)))
      .returning({ id: supplierPayoutRequests.id })

    if (!updated[0]) return null

    const row = await db
      .select({
        id: supplierPayoutRequests.id,
        supplierId: supplierPayoutRequests.supplierId,
        supplierName: suppliers.name,
        supplierSlug: suppliers.slug,
        requestedAmount: supplierPayoutRequests.requestedAmount,
        balanceSnapshot: supplierPayoutRequests.balanceSnapshot,
        bankLabel: supplierPayoutRequests.bankLabel,
        accountMask: supplierPayoutRequests.accountMask,
        swiftCode: supplierPayoutRequests.swiftCode,
        status: supplierPayoutRequests.status,
        resolutionNote: supplierPayoutRequests.resolutionNote,
        processedAt: supplierPayoutRequests.processedAt,
        createdAt: supplierPayoutRequests.createdAt,
        updatedAt: supplierPayoutRequests.updatedAt
      })
      .from(supplierPayoutRequests)
      .innerJoin(suppliers, eq(supplierPayoutRequests.supplierId, suppliers.id))
      .where(eq(supplierPayoutRequests.id, id))
      .limit(1)

    const r = row[0]
    if (!r) return null

    return {
      id: r.id,
      supplierId: r.supplierId,
      supplierName: r.supplierName,
      supplierSlug: r.supplierSlug,
      requestedAmount: String(r.requestedAmount),
      balanceSnapshot: String(r.balanceSnapshot),
      bankLabel: r.bankLabel,
      accountMask: r.accountMask,
      swiftCode: r.swiftCode,
      status: r.status as SupplierPayoutStatus,
      resolutionNote: r.resolutionNote,
      processedAt: r.processedAt ? r.processedAt.toISOString() : null,
      createdAt: r.createdAt.toISOString(),
      updatedAt: r.updatedAt.toISOString()
    }
  }
}
