import { and, count, desc, eq, ilike, isNull, or } from 'drizzle-orm'

import { getDb } from '@/db'
import { fabrics } from '@/db/schema/fabrics.schema'
import { suppliers } from '@/db/schema/suppliers.schema'
import { wholesalePricingProfiles } from '@/db/schema/wholesale-pricing-profiles.schema'
import type {
  WholesalePricingFabricListItem,
  WholesalePricingProfileDto,
  WholesalePricingSimulatorParams,
  WholesalePricingTierRow
} from '@/types/wholesale-pricing.types'
import { computeWholesaleTiersFromSimulator } from '@/lib/wholesale-pricing/compute-tiers'

export { computeWholesaleTiersFromSimulator }

function rowToDto(
  row: typeof wholesalePricingProfiles.$inferSelect
): WholesalePricingProfileDto {
  const sim: WholesalePricingSimulatorParams | null =
    row.simBaseUnitCostUsd !== null &&
    row.simMinTargetMarginPercent !== null &&
    row.simVolumeDecayFactor !== null
      ? {
          baseUnitCostUsd: String(row.simBaseUnitCostUsd),
          minTargetMarginPercent: String(row.simMinTargetMarginPercent),
          volumeDecayFactor: String(row.simVolumeDecayFactor)
        }
      : null

  return {
    id: row.id,
    fabric_id: row.fabricId,
    tiers: row.tiers ?? [],
    simulator: sim,
    updated_at: row.updatedAt.toISOString()
  }
}

export class WholesalePricingAdminService {
  public static async getByFabricId(fabricId: number): Promise<WholesalePricingProfileDto | null> {
    const db = getDb()
    const [row] = await db
      .select()
      .from(wholesalePricingProfiles)
      .where(and(eq(wholesalePricingProfiles.fabricId, fabricId), isNull(wholesalePricingProfiles.deletedAt)))
      .limit(1)
    return row ? rowToDto(row) : null
  }

  public static async upsertProfile(params: {
    fabricId: number
    tiers: WholesalePricingTierRow[]
    simulator: WholesalePricingSimulatorParams | null
  }): Promise<WholesalePricingProfileDto> {
    const db = getDb()
    const now = new Date()

    const [existing] = await db
      .select({ id: wholesalePricingProfiles.id })
      .from(wholesalePricingProfiles)
      .where(eq(wholesalePricingProfiles.fabricId, params.fabricId))
      .limit(1)

    if (existing) {
      const [updated] = await db
        .update(wholesalePricingProfiles)
        .set({
          tiers: params.tiers,
          simBaseUnitCostUsd: params.simulator?.baseUnitCostUsd ?? null,
          simMinTargetMarginPercent: params.simulator?.minTargetMarginPercent ?? null,
          simVolumeDecayFactor: params.simulator?.volumeDecayFactor ?? null,
          updatedAt: now,
          deletedAt: null
        })
        .where(eq(wholesalePricingProfiles.id, existing.id))
        .returning()
      if (!updated) throw new Error('Failed to update wholesale pricing profile')
      return rowToDto(updated)
    }

    const [inserted] = await db
      .insert(wholesalePricingProfiles)
      .values({
        fabricId: params.fabricId,
        tiers: params.tiers,
        simBaseUnitCostUsd: params.simulator?.baseUnitCostUsd ?? null,
        simMinTargetMarginPercent: params.simulator?.minTargetMarginPercent ?? null,
        simVolumeDecayFactor: params.simulator?.volumeDecayFactor ?? null,
        updatedAt: now
      })
      .returning()
    if (!inserted) throw new Error('Failed to create wholesale pricing profile')
    return rowToDto(inserted)
  }

  public static async listFabrics(params: {
    page: number
    limit: number
    q: string | undefined
    supplierId: number | undefined
  }): Promise<{ items: WholesalePricingFabricListItem[]; total: number }> {
    const db = getDb()
    const offset = (params.page - 1) * params.limit
    const q = params.q?.trim()
    const searchFilter =
      q && q.length > 0
        ? or(ilike(fabrics.sku, `%${q}%`), ilike(fabrics.titleEn, `%${q}%`), ilike(fabrics.titleRu, `%${q}%`))
        : undefined
    const supplierFilter =
      params.supplierId !== undefined ? eq(fabrics.supplierId, params.supplierId) : undefined
    const base = and(isNull(fabrics.deletedAt), searchFilter, supplierFilter)

    const [totalRow] = await db.select({ c: count() }).from(fabrics).where(base)
    const total = totalRow?.c ?? 0

    const rows = await db
      .select({
        id: fabrics.id,
        sku: fabrics.sku,
        titleRu: fabrics.titleRu,
        titleEn: fabrics.titleEn,
        priceUsd: fabrics.priceUsd,
        moq: fabrics.moq,
        supplierId: fabrics.supplierId,
        supplierName: suppliers.name,
        profileId: wholesalePricingProfiles.id
      })
      .from(fabrics)
      .innerJoin(suppliers, eq(fabrics.supplierId, suppliers.id))
      .leftJoin(
        wholesalePricingProfiles,
        and(
          eq(wholesalePricingProfiles.fabricId, fabrics.id),
          isNull(wholesalePricingProfiles.deletedAt)
        )
      )
      .where(base)
      .orderBy(desc(fabrics.updatedAt))
      .limit(params.limit)
      .offset(offset)

    const items: WholesalePricingFabricListItem[] = rows.map((r) => ({
      fabric_id: r.id,
      sku: r.sku,
      title: (r.titleEn ?? r.titleRu ?? '').trim() || `Fabric #${r.id}`,
      supplier_id: r.supplierId,
      supplier_name: r.supplierName,
      price_usd: r.priceUsd,
      moq: r.moq,
      has_profile: r.profileId !== null
    }))

    return { items, total }
  }

  public static async assertFabricBelongsToSupplier(fabricId: number, supplierId: number): Promise<boolean> {
    const db = getDb()
    const [row] = await db
      .select({ id: fabrics.id })
      .from(fabrics)
      .where(and(eq(fabrics.id, fabricId), eq(fabrics.supplierId, supplierId), isNull(fabrics.deletedAt)))
      .limit(1)
    return Boolean(row)
  }

  public static async getFabricSummary(fabricId: number): Promise<{
    id: number
    sku: string | null
    title: string
    price_usd: string | null
    moq: number | null
    images: string[] | null
  } | null> {
    const db = getDb()
    const [row] = await db
      .select({
        id: fabrics.id,
        sku: fabrics.sku,
        titleRu: fabrics.titleRu,
        titleEn: fabrics.titleEn,
        priceUsd: fabrics.priceUsd,
        moq: fabrics.moq,
        images: fabrics.images
      })
      .from(fabrics)
      .where(and(eq(fabrics.id, fabricId), isNull(fabrics.deletedAt)))
      .limit(1)
    if (!row) return null
    return {
      id: row.id,
      sku: row.sku,
      title: (row.titleEn ?? row.titleRu ?? '').trim() || `Fabric #${row.id}`,
      price_usd: row.priceUsd,
      moq: row.moq,
      images: row.images
    }
  }
}
