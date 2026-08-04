/**
 * Seed `blog_posts` from `design/blog.html` — data lives in `src/lib/blog-stitch-posts.ts`.
 */
import { eq } from 'drizzle-orm'

import { STITCH_BLOG_POST_DEFINITIONS } from '../lib/blog-stitch-posts'
import { logger } from '../lib/logger'

import { getDb } from './index'
import { blogPosts } from './schema/blog.schema'

export async function seedBlogPostsFromStitchDesign(): Promise<void> {
  const db = getDb()
  let upserted = 0

  for (const d of STITCH_BLOG_POST_DEFINITIONS) {
    const createdAt = new Date(d.createdAtIso)
    const existing = await db.select({ id: blogPosts.id }).from(blogPosts).where(eq(blogPosts.slug, d.slug)).limit(1)

    const now = new Date()
    if (existing[0]?.id) {
      await db
        .update(blogPosts)
        .set({
          title: d.title,
          excerpt: d.excerpt,
          heroImageUrl: d.heroImageUrl,
          category: d.category,
          readMinutes: d.readMinutes,
          authorName: d.authorName,
          authorRole: d.authorRole,
          body: d.body,
          createdAt,
          updatedAt: now,
          deletedAt: null
        })
        .where(eq(blogPosts.slug, d.slug))
    } else {
      await db.insert(blogPosts).values({
        slug: d.slug,
        title: d.title,
        excerpt: d.excerpt,
        heroImageUrl: d.heroImageUrl,
        category: d.category,
        readMinutes: d.readMinutes,
        authorName: d.authorName,
        authorRole: d.authorRole,
        body: d.body,
        createdAt,
        updatedAt: now,
        deletedAt: null
      })
    }
    upserted += 1
  }

  logger.info('seedBlogPostsFromStitchDesign: upserted stitch blog posts', { count: upserted })
}
