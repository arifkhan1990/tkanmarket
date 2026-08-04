import { z } from 'zod'

export const BlogPostCreateSchema = z.object({
  slug: z.string().trim().min(2).max(200)
    .regex(/^[a-z0-9]+(?:-[a-z0-9]+)*$/, 'Slug must be kebab-case'),
  title: z.string().trim().min(2).max(300),
  excerpt: z.string().trim().max(500).nullable().optional(),
  body: z.string().trim().min(1),
  heroImageUrl: z.string().url().max(2000).nullable().optional(),
  category: z.string().trim().max(100).nullable().optional(),
  readMinutes: z.number().int().min(1).max(120).nullable().optional(),
  authorName: z.string().trim().max(200).nullable().optional(),
  authorRole: z.string().trim().max(200).nullable().optional(),
})

export const BlogPostUpdateSchema = BlogPostCreateSchema.partial()

export const BlogPostGenerateSchema = z.object({
  fabricId: z.number().int().positive(),
  category: z.string().trim().max(100).nullable().optional(),
  authorName: z.string().trim().max(200).nullable().optional(),
  authorRole: z.string().trim().max(200).nullable().optional(),
})

export const BlogPostQuerySchema = z.object({
  page: z.coerce.number().int().min(1).max(500).optional().default(1),
  limit: z.coerce.number().int().min(1).max(100).optional().default(20),
  q: z.string().trim().max(200).optional().default(''),
  category: z.string().trim().max(100).nullable().optional(),
})

export type BlogPostCreateInput = z.infer<typeof BlogPostCreateSchema>
export type BlogPostUpdateInput = z.infer<typeof BlogPostUpdateSchema>
export type BlogPostGenerateInput = z.infer<typeof BlogPostGenerateSchema>
export type BlogPostQueryInput = z.infer<typeof BlogPostQuerySchema>
