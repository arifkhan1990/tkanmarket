/** Public blog listing / detail shapes (API and UI). */
export type BlogPostSummary = {
  id: number
  slug: string
  title: string
  excerpt: string | null
  heroImageUrl: string | null
  category: string | null
  readMinutes: number | null
  authorName: string | null
  createdAt: string
}

export type BlogPostDetail = BlogPostSummary & {
  body: string
  authorRole: string | null
}
