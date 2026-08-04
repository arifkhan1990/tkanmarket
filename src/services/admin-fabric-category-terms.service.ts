import { and, asc, count, desc, eq, ilike, isNull, sql } from 'drizzle-orm'

import { getDb } from '@/db'
import { fabricCategoryTerms } from '@/db/schema/fabric-category-terms.schema'
import { ValidationError } from '@/lib/errors'
import type {
  AdminFabricCategoryTerm,
  AdminFabricCategoryTermCreateInput,
  AdminFabricCategoryTermListResponse,
  AdminFabricCategoryTermUpdateInput
} from '@/types/admin-fabric-category-terms.types'

function toIso(d: Date): string {
  return d.toISOString()
}

function normalizeSlug(raw: string): string {
  const v = raw.trim()
  if (v.length === 0) throw new ValidationError('Slug is required')
  if (v.length > 200) throw new ValidationError('Slug is too long')
  return v
}

function normalizeText(raw: string, fieldLabel: string, min: number, max: number): string {
  const v = raw.trim()
  if (v.length < min) throw new ValidationError(`${fieldLabel} is too short`)
  if (v.length > max) throw new ValidationError(`${fieldLabel} is too long`)
  return v
}

function normalizeOptionalText(raw: string | null | undefined, max: number): string | null {
  const v = raw?.trim() ?? ''
  if (v.length === 0) return null
  if (v.length > max) throw new ValidationError('Field is too long')
  return v
}

function mapRow(row: typeof fabricCategoryTerms.$inferSelect): AdminFabricCategoryTerm {
  return {
    id: row.id,
    slug: row.slug,
    name_ru: row.nameRu,
    name_en: row.nameEn ?? null,
    description_ru: row.descriptionRu ?? null,
    description_en: row.descriptionEn ?? null,
    sort_order: row.sortOrder ?? 0,
    is_active: Boolean(row.isActive),
    deleted_at: row.deletedAt ? toIso(row.deletedAt) : null,
    created_at: toIso(row.createdAt),
    updated_at: toIso(row.updatedAt)
  }
}

export class AdminFabricCategoryTermsService {
  public static async list(params: {
    page: number
    limit: number
    q?: string
    includeInactive?: boolean
    includeArchived?: boolean
  }): Promise<AdminFabricCategoryTermListResponse> {
    const db = getDb()
    const page = Math.max(1, Math.trunc(params.page))
    const limit = Math.min(100, Math.max(5, Math.trunc(params.limit)))
    const offset = (page - 1) * limit

    let where = params.includeArchived ? and() : and(isNull(fabricCategoryTerms.deletedAt))
    if (!params.includeInactive) {
      where = and(where, eq(fabricCategoryTerms.isActive, true))
    }
    const q = params.q?.trim() ?? ''
    if (q.length > 0) {
      const needle = q.replace(/[%_]/g, (m) => `\\${m}`)
      const pattern = `%${needle}%`
      where = and(
        where,
        sql`(${fabricCategoryTerms.slug} ILIKE ${pattern} OR ${fabricCategoryTerms.nameRu} ILIKE ${pattern} OR ${fabricCategoryTerms.nameEn} ILIKE ${pattern})`
      )
    }

    const [totalRows, rows] = await Promise.all([
      db.select({ total: count() }).from(fabricCategoryTerms).where(where),
      db
        .select()
        .from(fabricCategoryTerms)
        .where(where)
        .orderBy(asc(fabricCategoryTerms.sortOrder), asc(fabricCategoryTerms.slug))
        .limit(limit)
        .offset(offset)
    ])

    return {
      items: rows.map(mapRow),
      total: totalRows[0]?.total ?? 0
    }
  }

  public static async create(input: AdminFabricCategoryTermCreateInput): Promise<{ id: number }> {
    const db = getDb()
    const slug = normalizeSlug(input.slug)
    const nameRu = normalizeText(input.name_ru, 'Russian name', 2, 200)
    const nameEn = normalizeOptionalText(input.name_en, 200)
    const descriptionRu = normalizeOptionalText(input.description_ru, 2000)
    const descriptionEn = normalizeOptionalText(input.description_en, 2000)
    const sortOrder = Number.isFinite(input.sort_order) ? Math.trunc(input.sort_order as number) : 0
    const isActive = typeof input.is_active === 'boolean' ? input.is_active : true

    const inserted = await db
      .insert(fabricCategoryTerms)
      .values({
        slug,
        nameRu,
        nameEn,
        descriptionRu,
        descriptionEn,
        sortOrder,
        isActive,
        updatedAt: new Date(),
        deletedAt: null
      })
      .returning({ id: fabricCategoryTerms.id })

    const id = inserted[0]?.id
    if (typeof id !== 'number') throw new Error('Insert failed')
    return { id }
  }

  public static async update(id: number, input: AdminFabricCategoryTermUpdateInput): Promise<void> {
    const db = getDb()
    if (!Number.isFinite(id) || id <= 0) throw new ValidationError('Invalid id')

    const patch: Partial<typeof fabricCategoryTerms.$inferInsert> = {
      updatedAt: new Date()
    }

    if (typeof input.slug === 'string') patch.slug = normalizeSlug(input.slug)
    if (typeof input.name_ru === 'string') patch.nameRu = normalizeText(input.name_ru, 'Russian name', 2, 200)
    if ('name_en' in input) patch.nameEn = normalizeOptionalText(input.name_en, 200)
    if ('description_ru' in input) patch.descriptionRu = normalizeOptionalText(input.description_ru, 2000)
    if ('description_en' in input) patch.descriptionEn = normalizeOptionalText(input.description_en, 2000)
    if (typeof input.sort_order === 'number' && Number.isFinite(input.sort_order)) patch.sortOrder = Math.trunc(input.sort_order)
    if (typeof input.is_active === 'boolean') patch.isActive = input.is_active

    const updated = await db
      .update(fabricCategoryTerms)
      .set(patch)
      .where(and(eq(fabricCategoryTerms.id, id), isNull(fabricCategoryTerms.deletedAt)))
      .returning({ id: fabricCategoryTerms.id })

    if (!updated[0]) {
      throw new ValidationError('Category not found')
    }
  }

  public static async archive(id: number): Promise<void> {
    const db = getDb()
    if (!Number.isFinite(id) || id <= 0) throw new ValidationError('Invalid id')
    const now = new Date()
    const updated = await db
      .update(fabricCategoryTerms)
      .set({ deletedAt: now, updatedAt: now, isActive: false })
      .where(and(eq(fabricCategoryTerms.id, id), isNull(fabricCategoryTerms.deletedAt)))
      .returning({ id: fabricCategoryTerms.id })
    if (!updated[0]) throw new ValidationError('Category not found')
  }

  public static async restore(id: number): Promise<void> {
    const db = getDb()
    if (!Number.isFinite(id) || id <= 0) throw new ValidationError('Invalid id')
    const updated = await db
      .update(fabricCategoryTerms)
      .set({ deletedAt: null, updatedAt: new Date() })
      .where(eq(fabricCategoryTerms.id, id))
      .returning({ id: fabricCategoryTerms.id })
    if (!updated[0]) throw new ValidationError('Category not found')
  }

  /** For dropdowns: active, non-deleted terms in stable order. */
  public static async listActiveOptions(): Promise<Array<{ id: number; slug: string; name_ru: string }>> {
    const db = getDb()
    const rows = await db
      .select({ id: fabricCategoryTerms.id, slug: fabricCategoryTerms.slug, nameRu: fabricCategoryTerms.nameRu })
      .from(fabricCategoryTerms)
      .where(and(isNull(fabricCategoryTerms.deletedAt), eq(fabricCategoryTerms.isActive, true)))
      .orderBy(asc(fabricCategoryTerms.sortOrder), asc(fabricCategoryTerms.slug))
    return rows.map((r) => ({ id: r.id, slug: r.slug, name_ru: r.nameRu }))
  }
}

