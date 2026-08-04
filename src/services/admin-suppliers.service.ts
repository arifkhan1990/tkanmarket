import { and, count, desc, eq, ilike, isNull, ne, or } from 'drizzle-orm'

import { getDb } from '@/db'
import { suppliers } from '@/db/schema/suppliers.schema'
import { ValidationError } from '@/lib/errors'
import type { AdminSupplierRow } from '@/types/admin-suppliers.types'
import type { AdminSupplierDetail } from '@/types/supplier-admin.types'

export class AdminSuppliersService {
  public static async list(params: {
    page: number
    limit: number
    q?: string | null
  }): Promise<{ items: AdminSupplierRow[]; total: number }> {
    const db = getDb()
    const offset = (params.page - 1) * params.limit

    const base = isNull(suppliers.deletedAt)
    const search = params.q?.trim()
    const searchWhere = search
      ? or(
          ilike(suppliers.name, `%${search}%`),
          ilike(suppliers.slug, `%${search}%`),
          ilike(suppliers.country, `%${search}%`)
        )
      : undefined

    const where = and(base, searchWhere)

    const totalRows = await db.select({ total: count() }).from(suppliers).where(where)
    const total = totalRows[0]?.total ?? 0

    const rows = await db
      .select({
        id: suppliers.id,
        name: suppliers.name,
        slug: suppliers.slug,
        country: suppliers.country,
        city: suppliers.city,
        verified: suppliers.verified,
        logoUrl: suppliers.logoUrl
      })
      .from(suppliers)
      .where(where)
      .orderBy(desc(suppliers.updatedAt))
      .limit(params.limit)
      .offset(offset)

    const items: AdminSupplierRow[] = rows.map((r) => ({
      id: r.id,
      name: r.name,
      slug: r.slug,
      country: r.country,
      city: r.city ?? null,
      verified: r.verified,
      logoUrl: r.logoUrl ?? null
    }))

    return { items, total }
  }

  public static async getById(id: number): Promise<AdminSupplierDetail | null> {
    const db = getDb()
    const rows = await db
      .select()
      .from(suppliers)
      .where(and(isNull(suppliers.deletedAt), eq(suppliers.id, id)))
      .limit(1)
    const r = rows[0]
    if (!r) return null
    return AdminSuppliersService.toDetail(r)
  }

  public static async update(
    id: number,
    input: {
      name?: string
      slug?: string
      country?: string
      city?: string | null
      province?: string | null
      description?: string | null
      logoUrl?: string | null
      websiteUrl?: string | null
      verified?: boolean
      establishedYear?: number | null
      sourceUrl?: string | null
    }
  ): Promise<AdminSupplierDetail | null> {
    const db = getDb()
    const existing = await AdminSuppliersService.getById(id)
    if (!existing) return null

    if (input.slug !== undefined && input.slug !== existing.slug) {
      const clash = await db
        .select({ id: suppliers.id })
        .from(suppliers)
        .where(and(isNull(suppliers.deletedAt), eq(suppliers.slug, input.slug), ne(suppliers.id, id)))
        .limit(1)
      if (clash.length > 0) {
        throw new ValidationError('Slug is already in use')
      }
    }

    const patch: Partial<typeof suppliers.$inferInsert> = {
      updatedAt: new Date()
    }
    if (input.name !== undefined) patch.name = input.name
    if (input.slug !== undefined) patch.slug = input.slug
    if (input.country !== undefined) patch.country = input.country
    if (input.city !== undefined) patch.city = input.city
    if (input.province !== undefined) patch.province = input.province
    if (input.description !== undefined) patch.description = input.description
    if (input.logoUrl !== undefined) patch.logoUrl = input.logoUrl
    if (input.websiteUrl !== undefined) patch.websiteUrl = input.websiteUrl
    if (input.verified !== undefined) patch.verified = input.verified
    if (input.establishedYear !== undefined) patch.establishedYear = input.establishedYear
    if (input.sourceUrl !== undefined) patch.sourceUrl = input.sourceUrl

    await db.update(suppliers).set(patch).where(eq(suppliers.id, id))

    const next = await AdminSuppliersService.getById(id)
    return next
  }

  private static toDetail(r: typeof suppliers.$inferSelect): AdminSupplierDetail {
    return {
      id: r.id,
      name: r.name,
      slug: r.slug,
      country: r.country,
      city: r.city ?? null,
      province: r.province ?? null,
      description: r.description ?? null,
      logoUrl: r.logoUrl ?? null,
      websiteUrl: r.websiteUrl ?? null,
      verified: r.verified,
      establishedYear: r.establishedYear ?? null,
      sourceUrl: r.sourceUrl ?? null,
      createdAt: r.createdAt.toISOString(),
      updatedAt: r.updatedAt.toISOString()
    }
  }
}
