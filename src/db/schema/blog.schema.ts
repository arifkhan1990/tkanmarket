import { integer, pgTable, text, timestamp, index } from 'drizzle-orm/pg-core'
import { fabrics } from '@/db/schema/fabrics.schema'

export const blogPosts = pgTable(
  'blog_posts',
  {
    id: integer('id').generatedAlwaysAsIdentity().primaryKey(),

    fabricId: integer('fabric_id').references(() => fabrics.id, { onDelete: 'set null' }),
    slug: text('slug').notNull(),
    title: text('title').notNull(),
    excerpt: text('excerpt'),
    heroImageUrl: text('hero_image_url'),
    category: text('category'),
    readMinutes: integer('read_minutes'),
    authorName: text('author_name'),
    authorRole: text('author_role'),

    body: text('body').notNull(),

    createdAt: timestamp('created_at', { withTimezone: true }).notNull().defaultNow(),
    updatedAt: timestamp('updated_at', { withTimezone: true }).notNull().defaultNow(),
    deletedAt: timestamp('deleted_at', { withTimezone: true }),
  },
  (table) => ({
    blogPostsSlugIdx: index('blog_posts_slug_idx').on(table.slug),
    blogPostsCategoryIdx: index('blog_posts_category_idx').on(table.category),
    blogPostsCreatedAtIdx: index('blog_posts_created_at_idx').on(table.createdAt),
    blogPostsFabricIdIdx: index('blog_posts_fabric_id_idx').on(table.fabricId),
  })
)

