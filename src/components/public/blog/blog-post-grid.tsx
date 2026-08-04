import { BlogArticleCard } from '@/components/public/blog/blog-article-card'
import type { BlogPostSummary } from '@/types/blog.types'

type Props = {
  posts: BlogPostSummary[]
  emptyLabel: string
  formatDate: (iso: string) => string
  postHref: (slug: string) => string
}

export function BlogPostGrid({ posts, emptyLabel, formatDate, postHref }: Props) {
  if (posts.length === 0) {
    return (
      <div className="rounded-2xl border border-dashed border-outline-variant/40 bg-surface-container-low/50 px-6 py-16 text-center">
        <p className="text-on-surface-variant">{emptyLabel}</p>
      </div>
    )
  }

  return (
    <div className="grid grid-cols-1 gap-10 md:grid-cols-2 lg:grid-cols-3">
      {posts.map((post) => (
        <BlogArticleCard
          key={post.id}
          post={post}
          href={postHref(post.slug)}
          formattedDate={formatDate(post.createdAt)}
        />
      ))}
    </div>
  )
}
