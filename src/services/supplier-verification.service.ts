import { and, desc, eq, isNull } from 'drizzle-orm'

import { getDb } from '@/db'
import { supplierVerificationCases } from '@/db/schema/supplier-ops.schema'
import { suppliers } from '@/db/schema/suppliers.schema'
import type {
  SupplierVerificationCaseDetailDto,
  SupplierVerificationCaseListItemDto,
  SupplierVerificationCaseStatus,
  VerificationChecklistItem,
  VerificationThreadMessage
} from '@/types/supplier-ops.types'

function parseChecklist(raw: unknown): VerificationChecklistItem[] {
  if (!Array.isArray(raw)) return []
  return raw.filter((x): x is VerificationChecklistItem => {
    if (typeof x !== 'object' || x === null) return false
    const o = x as Record<string, unknown>
    return (
      typeof o.id === 'string' &&
      typeof o.title === 'string' &&
      typeof o.detail === 'string' &&
      typeof o.state === 'string'
    )
  })
}

function parseMessages(raw: unknown): VerificationThreadMessage[] {
  if (!Array.isArray(raw)) return []
  return raw.filter((x): x is VerificationThreadMessage => {
    if (typeof x !== 'object' || x === null) return false
    const o = x as Record<string, unknown>
    return (
      (o.role === 'supplier' || o.role === 'admin') &&
      typeof o.body === 'string' &&
      typeof o.at === 'string'
    )
  })
}

export class SupplierVerificationService {
  public static async list(): Promise<SupplierVerificationCaseListItemDto[]> {
    const db = getDb()
    const rows = await db
      .select({
        id: supplierVerificationCases.id,
        supplierId: supplierVerificationCases.supplierId,
        supplierName: suppliers.name,
        referenceCode: supplierVerificationCases.referenceCode,
        headline: supplierVerificationCases.headline,
        status: supplierVerificationCases.status,
        complianceScore: supplierVerificationCases.complianceScore,
        updatedAt: supplierVerificationCases.updatedAt
      })
      .from(supplierVerificationCases)
      .innerJoin(suppliers, eq(supplierVerificationCases.supplierId, suppliers.id))
      .where(and(isNull(supplierVerificationCases.deletedAt), isNull(suppliers.deletedAt)))
      .orderBy(desc(supplierVerificationCases.updatedAt))

    return rows.map((r) => ({
      id: r.id,
      supplierId: r.supplierId,
      supplierName: r.supplierName,
      referenceCode: r.referenceCode,
      headline: r.headline,
      status: r.status as SupplierVerificationCaseStatus,
      complianceScore: r.complianceScore,
      updatedAt: r.updatedAt.toISOString()
    }))
  }

  public static async getById(id: number): Promise<SupplierVerificationCaseDetailDto | null> {
    const db = getDb()
    const row = await db
      .select({
        id: supplierVerificationCases.id,
        supplierId: supplierVerificationCases.supplierId,
        supplierName: suppliers.name,
        supplierSlug: suppliers.slug,
        referenceCode: supplierVerificationCases.referenceCode,
        headline: supplierVerificationCases.headline,
        summary: supplierVerificationCases.summary,
        complianceScore: supplierVerificationCases.complianceScore,
        laborPct: supplierVerificationCases.laborPct,
        envPct: supplierVerificationCases.envPct,
        supplyPct: supplierVerificationCases.supplyPct,
        fiscalPct: supplierVerificationCases.fiscalPct,
        status: supplierVerificationCases.status,
        checklistJson: supplierVerificationCases.checklistJson,
        messagesJson: supplierVerificationCases.messagesJson,
        facilityPhotoUrls: supplierVerificationCases.facilityPhotoUrls,
        internalNote: supplierVerificationCases.internalNote,
        createdAt: supplierVerificationCases.createdAt,
        updatedAt: supplierVerificationCases.updatedAt
      })
      .from(supplierVerificationCases)
      .innerJoin(suppliers, eq(supplierVerificationCases.supplierId, suppliers.id))
      .where(and(eq(supplierVerificationCases.id, id), isNull(supplierVerificationCases.deletedAt)))
      .limit(1)

    const r = row[0]
    if (!r) return null

    return {
      id: r.id,
      supplierId: r.supplierId,
      supplierName: r.supplierName,
      supplierSlug: r.supplierSlug,
      referenceCode: r.referenceCode,
      headline: r.headline,
      summary: r.summary,
      complianceScore: r.complianceScore,
      laborPct: r.laborPct,
      envPct: r.envPct,
      supplyPct: r.supplyPct,
      fiscalPct: r.fiscalPct,
      status: r.status as SupplierVerificationCaseStatus,
      checklist: parseChecklist(r.checklistJson),
      messages: parseMessages(r.messagesJson),
      facilityPhotoUrls: r.facilityPhotoUrls ?? [],
      internalNote: r.internalNote,
      createdAt: r.createdAt.toISOString(),
      updatedAt: r.updatedAt.toISOString()
    }
  }

  public static async updateCase(
    id: number,
    input: {
      status?: SupplierVerificationCaseStatus
      internalNote?: string | null
      checklist?: VerificationChecklistItem[]
    }
  ): Promise<SupplierVerificationCaseDetailDto | null> {
    const db = getDb()
    const current = await SupplierVerificationService.getById(id)
    if (!current) return null

    const checklist = input.checklist ?? current.checklist
    const nextStatus = input.status ?? current.status

    await db
      .update(supplierVerificationCases)
      .set({
        status: nextStatus,
        internalNote: input.internalNote !== undefined ? input.internalNote : current.internalNote,
        checklistJson: checklist,
        updatedAt: new Date()
      })
      .where(and(eq(supplierVerificationCases.id, id), isNull(supplierVerificationCases.deletedAt)))

    return SupplierVerificationService.getById(id)
  }
}
