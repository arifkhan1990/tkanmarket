import { and, asc, count, eq, ilike, inArray, isNull } from 'drizzle-orm'
import { z } from 'zod'

import { getDb } from '@/db'
import { fabricTypes } from '@/db/schema/fabric-types.schema'
import { fabrics } from '@/db/schema/fabrics.schema'
import { AppError } from '@/lib/errors'
import { logger } from '@/lib/logger'

const CreateSchema = z.object({
  slug: z.string().trim().min(1).max(100).toLowerCase(),
  labelRu: z.string().trim().min(1).max(300),
  labelEn: z.string().trim().min(1).max(300).optional().nullable(),
  sortOrder: z.coerce.number().int().min(0).max(9999).optional().default(0)
})

const UpdateSchema = z.object({
  slug: z.string().trim().min(1).max(100).toLowerCase().optional(),
  labelRu: z.string().trim().min(1).max(300).optional(),
  labelEn: z.string().trim().min(1).max(300).optional().nullable(),
  sortOrder: z.coerce.number().int().min(0).max(9999).optional()
})

export type FabricTypeCreateInput = z.infer<typeof CreateSchema>
export type FabricTypeUpdateInput = z.infer<typeof UpdateSchema>

export interface FabricTypeRow {
  id: number
  slug: string
  labelRu: string
  labelEn: string | null
  sortOrder: number
  fabricCount: number
  createdAt: string
  updatedAt: string
  deletedAt: string | null
}

export class AdminFabricTypesService {
  static async list(params: {
    page?: number
    limit?: number
    q?: string
    includeDeleted?: boolean
  }): Promise<{ items: FabricTypeRow[]; total: number }> {
    const db = getDb()
    const page = params.page ?? 1
    const limit = params.limit ?? 50
    const offset = (page - 1) * limit

    const conditions = [params.includeDeleted ? undefined : isNull(fabricTypes.deletedAt)]
    if (params.q?.trim()) {
      conditions.push(
        ilike(fabricTypes.slug, `%${params.q.trim()}%`)
      )
    }

    const where = and(...conditions.filter(Boolean))

    const rows = await db
      .select({
        id: fabricTypes.id,
        slug: fabricTypes.slug,
        labelRu: fabricTypes.labelRu,
        labelEn: fabricTypes.labelEn,
        sortOrder: fabricTypes.sortOrder,
        createdAt: fabricTypes.createdAt,
        updatedAt: fabricTypes.updatedAt,
        deletedAt: fabricTypes.deletedAt,
        fabricCount: count(fabrics.id).as('fabric_count')
      })
      .from(fabricTypes)
      .leftJoin(fabrics, and(eq(fabrics.fabricType, fabricTypes.slug), isNull(fabrics.deletedAt)))
      .where(where)
      .groupBy(fabricTypes.id)
      .orderBy(asc(fabricTypes.sortOrder), asc(fabricTypes.slug))
      .limit(limit)
      .offset(offset)

    const totalResult = await db
      .select({ count: count() })
      .from(fabricTypes)
      .where(where)

    return {
      items: rows.map((r) => ({
        id: r.id,
        slug: r.slug,
        labelRu: r.labelRu,
        labelEn: r.labelEn,
        sortOrder: r.sortOrder,
        fabricCount: r.fabricCount,
        createdAt: r.createdAt.toISOString(),
        updatedAt: r.updatedAt.toISOString(),
        deletedAt: r.deletedAt?.toISOString() ?? null
      })),
      total: totalResult[0]?.count ?? 0
    }
  }

  static async getById(id: number): Promise<FabricTypeRow | null> {
    const db = getDb()

    const rows = await db
      .select({
        id: fabricTypes.id,
        slug: fabricTypes.slug,
        labelRu: fabricTypes.labelRu,
        labelEn: fabricTypes.labelEn,
        sortOrder: fabricTypes.sortOrder,
        createdAt: fabricTypes.createdAt,
        updatedAt: fabricTypes.updatedAt,
        deletedAt: fabricTypes.deletedAt,
        fabricCount: count(fabrics.id).as('fabric_count')
      })
      .from(fabricTypes)
      .leftJoin(fabrics, and(eq(fabrics.fabricType, fabricTypes.slug), isNull(fabrics.deletedAt)))
      .where(eq(fabricTypes.id, id))
      .groupBy(fabricTypes.id)
      .limit(1)

    const r = rows[0]
    if (!r) return null

    return {
      id: r.id,
      slug: r.slug,
      labelRu: r.labelRu,
      labelEn: r.labelEn,
      sortOrder: r.sortOrder,
      fabricCount: r.fabricCount,
      createdAt: r.createdAt.toISOString(),
      updatedAt: r.updatedAt.toISOString(),
      deletedAt: r.deletedAt?.toISOString() ?? null
    }
  }

  static async getFabricCountBySlug(slug: string): Promise<number> {
    const db = getDb()
    const rows = await db
      .select({ c: count() })
      .from(fabrics)
      .where(and(eq(fabrics.fabricType, slug), isNull(fabrics.deletedAt)))
    return rows[0]?.c ?? 0
  }

  static async create(input: FabricTypeCreateInput): Promise<FabricTypeRow> {
    const db = getDb()
    const data = CreateSchema.parse(input)

    const result = await db.transaction(async (tx) => {
      const existing = await tx
        .select({ id: fabricTypes.id })
        .from(fabricTypes)
        .where(eq(fabricTypes.slug, data.slug))
        .limit(1)

      if (existing[0]) {
        throw new AppError(`Slug "${data.slug}" already exists`, 'FABRIC_TYPE_EXISTS', 409)
      }

      const rows = await tx
        .insert(fabricTypes)
        .values({
          slug: data.slug,
          labelRu: data.labelRu,
          labelEn: data.labelEn ?? null,
          sortOrder: data.sortOrder
        })
        .returning()

      return rows[0]!
    })

    logger.info('Fabric type created', { slug: data.slug, id: result.id })

    return {
      id: result.id,
      slug: result.slug,
      labelRu: result.labelRu,
      labelEn: result.labelEn,
      sortOrder: result.sortOrder,
      fabricCount: 0,
      createdAt: result.createdAt.toISOString(),
      updatedAt: result.updatedAt.toISOString(),
      deletedAt: result.deletedAt?.toISOString() ?? null
    }
  }

  static async update(id: number, input: FabricTypeUpdateInput): Promise<FabricTypeRow> {
    const db = getDb()
    const data = UpdateSchema.parse(input)

    await db.transaction(async (tx) => {
      const existing = await tx
        .select({ id: fabricTypes.id, deletedAt: fabricTypes.deletedAt })
        .from(fabricTypes)
        .where(eq(fabricTypes.id, id))
        .limit(1)

      if (!existing[0]) {
        throw new AppError('Fabric type not found', 'NOT_FOUND', 404)
      }

      if (data.slug) {
        const allDups = await tx
          .select({ id: fabricTypes.id })
          .from(fabricTypes)
          .where(eq(fabricTypes.slug, data.slug))
        const dupFound = allDups.find((d) => d.id !== id)
        if (dupFound) {
          throw new AppError(`Slug "${data.slug}" already exists`, 'FABRIC_TYPE_EXISTS', 409)
        }
      }

      const updateData: Record<string, unknown> = {}
      if (data.slug !== undefined) updateData.slug = data.slug
      if (data.labelRu !== undefined) updateData.labelRu = data.labelRu
      if (data.labelEn !== undefined) updateData.labelEn = data.labelEn ?? null
      if (data.sortOrder !== undefined) updateData.sortOrder = data.sortOrder

      await tx
        .update(fabricTypes)
        .set({ ...updateData, updatedAt: new Date() })
        .where(eq(fabricTypes.id, id))
    })

    const updated = await this.getById(id)
    if (!updated) throw new AppError('Fabric type not found after update', 'NOT_FOUND', 404)

    logger.info('Fabric type updated', { id, slug: updated.slug })
    return updated
  }

  static async archive(id: number, force?: boolean): Promise<{ archived: boolean; fabricCount?: number }> {
    const db = getDb()

    const row = await db
      .select({ slug: fabricTypes.slug, deletedAt: fabricTypes.deletedAt })
      .from(fabricTypes)
      .where(eq(fabricTypes.id, id))
      .limit(1)

    if (!row[0]) throw new AppError('Fabric type not found', 'NOT_FOUND', 404)
    if (row[0].deletedAt) return { archived: true }

    const fabricCount = await this.getFabricCountBySlug(row[0].slug)

    if (fabricCount > 0 && !force) {
      throw new AppError(
        `Cannot archive — ${fabricCount} fabric(s) use this type. Archive them first or use force.`,
        'FABRIC_TYPE_IN_USE',
        409
      )
    }

    await db
      .update(fabricTypes)
      .set({ deletedAt: new Date(), updatedAt: new Date() })
      .where(eq(fabricTypes.id, id))

    logger.info('Fabric type archived', { id, slug: row[0].slug, fabricCount })
    return { archived: true, fabricCount }
  }

  static async ensureFabricTypesExist(slugs: string[]): Promise<number> {
    const db = getDb()
    const uniqueSlugs = [...new Set(slugs.filter(Boolean))] as string[]
    if (uniqueSlugs.length === 0) return 0

    const existing = await db
      .select({ slug: fabricTypes.slug })
      .from(fabricTypes)
      .where(inArray(fabricTypes.slug, uniqueSlugs))

    const existingSet = new Set(existing.map((r) => r.slug))
    const toInsert = uniqueSlugs.filter((s) => !existingSet.has(s))

    if (toInsert.length === 0) return 0

    const label = (slug: string) => slug.charAt(0).toUpperCase() + slug.slice(1).replace(/-/g, ' ')

    await db.insert(fabricTypes).values(
      toInsert.map((slug) => ({ slug, labelRu: label(slug), labelEn: label(slug) }))
    )

    logger.info('Auto-created fabric types', { slugs: toInsert })
    return toInsert.length
  }

  static async restore(id: number): Promise<void> {
    const db = getDb()

    const row = await db
      .select({ deletedAt: fabricTypes.deletedAt })
      .from(fabricTypes)
      .where(eq(fabricTypes.id, id))
      .limit(1)

    if (!row[0]) throw new AppError('Fabric type not found', 'NOT_FOUND', 404)
    if (!row[0].deletedAt) return

    await db
      .update(fabricTypes)
      .set({ deletedAt: null, updatedAt: new Date() })
      .where(eq(fabricTypes.id, id))

    logger.info('Fabric type restored', { id })
  }
}
