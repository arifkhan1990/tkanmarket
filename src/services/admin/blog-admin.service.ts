import { and, count, desc, eq, ilike, inArray, isNull, or, sql } from 'drizzle-orm'

import { getDb } from '@/db'
import { blogPosts } from '@/db/schema/blog.schema'
import { fabrics } from '@/db/schema/fabrics.schema'
import { AIService } from '@/services/ai.service'
import { NotFoundError, ValidationError } from '@/lib/errors'
import { logger } from '@/lib/logger'

import type { BlogPostCreateInput, BlogPostUpdateInput, BlogPostQueryInput } from '@/lib/validations/blog.validation'
import type { BlogPostDetail, BlogPostSummary } from '@/types/blog.types'

function toSummary(row: typeof blogPosts.$inferSelect): BlogPostSummary {
  return {
    id: row.id,
    slug: row.slug,
    title: row.title,
    excerpt: row.excerpt,
    heroImageUrl: row.heroImageUrl,
    category: row.category,
    readMinutes: row.readMinutes,
    authorName: row.authorName,
    createdAt: row.createdAt.toISOString(),
  }
}

function toDetail(row: typeof blogPosts.$inferSelect): BlogPostDetail {
  return {
    ...toSummary(row),
    body: row.body,
    authorRole: row.authorRole,
  }
}

function escapeLikePattern(input: string): string {
  return input.replace(/[\\%_]/g, (m) => `\\${m}`)
}

export class BlogAdminService {
  static async list(params: BlogPostQueryInput): Promise<{ items: BlogPostSummary[]; total: number }> {
    try {
      const db = getDb()
      const page = Math.max(1, params.page)
      const limit = Math.max(1, Math.min(100, params.limit))
      const offset = (page - 1) * limit

      const conditions: ReturnType<typeof eq>[] = [isNull(blogPosts.deletedAt)]
      if (params.q) {
        const pattern = `%${escapeLikePattern(params.q.trim())}%`
        const searchClause = or(
          ilike(blogPosts.title, pattern),
          ilike(blogPosts.excerpt, pattern),
        )
        if (searchClause) conditions.push(searchClause as unknown as ReturnType<typeof eq>)
      }
      if (params.category) {
        conditions.push(eq(blogPosts.category, params.category))
      }

      const where = and(...conditions)

      const [totalRows, rows] = await Promise.all([
        db.select({ c: count() }).from(blogPosts).where(where),
        db
          .select()
          .from(blogPosts)
          .where(where)
          .orderBy(desc(blogPosts.createdAt), desc(blogPosts.id))
          .limit(limit)
          .offset(offset),
      ])

      return {
        items: rows.map(toSummary),
        total: totalRows[0]?.c ?? 0,
      }
    } catch (error) {
      logger.error('BlogAdminService.list failed', { err: error, params })
      throw error
    }
  }

  static async getBySlug(slug: string): Promise<BlogPostDetail> {
    try {
      const db = getDb()
      const rows = await db
        .select()
        .from(blogPosts)
        .where(and(eq(blogPosts.slug, slug), isNull(blogPosts.deletedAt)))
        .limit(1)

      const row = rows[0]
      if (!row) throw new NotFoundError('Blog post not found')
      return toDetail(row)
    } catch (error) {
      if (error instanceof NotFoundError) throw error
      logger.error('BlogAdminService.getBySlug failed', { err: error, slug })
      throw error
    }
  }

  static async getById(id: number): Promise<BlogPostDetail> {
    try {
      const db = getDb()
      const rows = await db
        .select()
        .from(blogPosts)
        .where(and(eq(blogPosts.id, id), isNull(blogPosts.deletedAt)))
        .limit(1)

      const row = rows[0]
      if (!row) throw new NotFoundError('Blog post not found')
      return toDetail(row)
    } catch (error) {
      if (error instanceof NotFoundError) throw error
      logger.error('BlogAdminService.getById failed', { err: error, id })
      throw error
    }
  }

  static async create(input: BlogPostCreateInput): Promise<BlogPostDetail> {
    try {
      const db = getDb()
      const now = new Date()

      const rows = await db.transaction(async (tx) => {
        const locked = await tx.execute<{ id: number }>(
          sql`SELECT id FROM blog_posts WHERE slug = ${input.slug} LIMIT 1 FOR UPDATE`
        )

        if (locked.length > 0) throw new ValidationError('Blog post slug already exists')

        return tx
          .insert(blogPosts)
          .values({
            slug: input.slug,
            title: input.title,
            excerpt: input.excerpt ?? null,
            body: input.body,
            heroImageUrl: input.heroImageUrl ?? null,
            category: input.category ?? null,
            readMinutes: input.readMinutes ?? null,
            authorName: input.authorName ?? null,
            authorRole: input.authorRole ?? null,
            createdAt: now,
            updatedAt: now,
          })
          .returning()
      })

      const row = rows[0]
      if (!row) throw new Error('Failed to create blog post')

      logger.info('Blog post created', { blogId: row.id, slug: row.slug })
      return toDetail(row)
    } catch (error) {
      if (error instanceof ValidationError) throw error
      logger.error('BlogAdminService.create failed', { err: error, slug: input.slug })
      throw error
    }
  }

  static async update(slug: string, input: BlogPostUpdateInput): Promise<BlogPostDetail> {
    try {
      const db = getDb()
      const now = new Date()

      const rows = await db.transaction(async (tx) => {
        const existing = await tx.execute<{ id: number }>(
          sql`SELECT id FROM blog_posts WHERE slug = ${slug} AND deleted_at IS NULL LIMIT 1 FOR UPDATE`
        )

        const existingRow = existing[0]
        if (!existingRow) throw new NotFoundError('Blog post not found')

        if (input.slug && input.slug !== slug) {
          const slugConflict = await tx.execute<{ id: number }>(
            sql`SELECT id FROM blog_posts WHERE slug = ${input.slug} AND deleted_at IS NULL LIMIT 1 FOR UPDATE`
          )

          if (slugConflict[0]) throw new ValidationError('New slug already in use')
        }

        const updateData: Record<string, unknown> = { updatedAt: now }
        if (input.slug !== undefined) updateData['slug'] = input.slug
        if (input.title !== undefined) updateData['title'] = input.title
        if (input.excerpt !== undefined) updateData['excerpt'] = input.excerpt
        if (input.body !== undefined) updateData['body'] = input.body
        if (input.heroImageUrl !== undefined) updateData['heroImageUrl'] = input.heroImageUrl
        if (input.category !== undefined) updateData['category'] = input.category
        if (input.readMinutes !== undefined) updateData['readMinutes'] = input.readMinutes
        if (input.authorName !== undefined) updateData['authorName'] = input.authorName
        if (input.authorRole !== undefined) updateData['authorRole'] = input.authorRole

        return tx
          .update(blogPosts)
          .set(updateData)
          .where(and(eq(blogPosts.id, existingRow.id), isNull(blogPosts.deletedAt)))
          .returning()
      })

      const row = rows[0]
      if (!row) throw new Error('Failed to update blog post')

      logger.info('Blog post updated', { blogId: row.id, slug: row.slug })
      return toDetail(row)
    } catch (error) {
      if (error instanceof NotFoundError || error instanceof ValidationError) throw error
      logger.error('BlogAdminService.update failed', { err: error, slug })
      throw error
    }
  }

  static async delete(slug: string): Promise<void> {
    try {
      const db = getDb()
      const now = new Date()

      const result = await db
        .update(blogPosts)
        .set({ deletedAt: now, updatedAt: now })
        .where(and(eq(blogPosts.slug, slug), isNull(blogPosts.deletedAt)))
        .returning({ id: blogPosts.id })

      if (result.length === 0) throw new NotFoundError('Blog post not found')

      logger.info('Blog post deleted', { slug })
    } catch (error) {
      if (error instanceof NotFoundError) throw error
      logger.error('BlogAdminService.delete failed', { err: error, slug })
      throw error
    }
  }

  static async bulkDelete(slugs: string[]): Promise<number> {
    try {
      const db = getDb()
      const now = new Date()

      const result = await db
        .update(blogPosts)
        .set({ deletedAt: now, updatedAt: now })
        .where(and(inArray(blogPosts.slug, slugs), isNull(blogPosts.deletedAt)))
        .returning({ id: blogPosts.id })

      const count = result.length
      logger.info('Bulk blog delete', { slugs, deleted: count })
      return count
    } catch (error) {
      logger.error('BlogAdminService.bulkDelete failed', { err: error, slugs })
      throw error
    }
  }

  static async generateAndStoreFromFabric(fabricId: number, overrides?: {
    category?: string | null
    authorName?: string | null
    authorRole?: string | null
  }): Promise<BlogPostDetail> {
    try {
      const db = getDb()

      const fabric = await db
        .select({ id: fabrics.id, titleRu: fabrics.titleRu, titleEn: fabrics.titleEn })
        .from(fabrics)
        .where(and(eq(fabrics.id, fabricId), isNull(fabrics.deletedAt)))
        .limit(1)

      const fabricRow = fabric[0]
      if (!fabricRow) throw new NotFoundError('Fabric not found')

      const aiResult = await AIService.generateBlogPost(fabricId)

      const baseSlug = aiResult.title
        .toLowerCase()
        .replace(/[^a-z0-9]+/g, '-')
        .replace(/^-|-$/g, '')
        .slice(0, 190) || `fabric-${fabricId}`

      const now = new Date()

      const rows = await db.transaction(async (tx) => {
        let slug = baseSlug
        let counter = 1

        while (true) {
          const existing = await tx.execute<{ id: number }>(
            sql`SELECT id FROM blog_posts WHERE slug = ${slug} LIMIT 1 FOR UPDATE`
          )

          if (existing.length === 0) break
          slug = `${baseSlug}-${counter}`
          counter++
        }

        return tx
          .insert(blogPosts)
          .values({
            fabricId,
            slug,
            title: aiResult.title,
            excerpt: aiResult.content.slice(0, 500),
            body: aiResult.content,
            category: overrides?.category ?? null,
            readMinutes: Math.max(1, Math.ceil(aiResult.content.split(/\s+/).length / 200)),
            authorName: overrides?.authorName ?? 'TkanMarket AI',
            authorRole: overrides?.authorRole ?? 'AI Content',
            heroImageUrl: null,
            createdAt: now,
            updatedAt: now,
          })
          .returning()
      })

      const row = rows[0]
      if (!row) throw new Error('Failed to store AI-generated blog post')

       logger.info('AI blog post stored', { blogId: row.id, slug: row.slug, fabricId })
       return toDetail(row)
     } catch (error) {
       if (error instanceof NotFoundError) throw error
       logger.error('BlogAdminService.generateAndStoreFromFabric failed', { err: error, fabricId })
       throw error
     }
   }

   static async regenerate(slug: string): Promise<BlogPostDetail> {
     try {
       const db = getDb()
       const rows = await db
         .select()
         .from(blogPosts)
         .where(and(eq(blogPosts.slug, slug), isNull(blogPosts.deletedAt)))
         .limit(1)

       const row = rows[0]
       if (!row) throw new NotFoundError('Blog post not found')

       if (!row.fabricId) {
         throw new ValidationError('Cannot regenerate blog post without an associated fabric ID')
       }

       const aiResult = await AIService.generateBlogPost(row.fabricId)
       const now = new Date()

       const updatedRows = await db
         .update(blogPosts)
         .set({
           title: aiResult.title,
           excerpt: aiResult.content.slice(0, 500),
           body: aiResult.content,
           readMinutes: Math.max(1, Math.ceil(aiResult.content.split(/\s+/).length / 200)),
           updatedAt: now,
         })
         .where(and(eq(blogPosts.id, row.id), isNull(blogPosts.deletedAt)))
         .returning()

       const updatedRow = updatedRows[0]
       if (!updatedRow) throw new Error('Failed to regenerate blog post')

       logger.info('Blog post regenerated via AI', { blogId: updatedRow.id, slug: updatedRow.slug })
       return toDetail(updatedRow)
     } catch (error) {
       if (error instanceof NotFoundError || error instanceof ValidationError) throw error
       logger.error('BlogAdminService.regenerate failed', { err: error, slug })
       throw error
     }
   }
 }
