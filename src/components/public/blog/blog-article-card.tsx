import Image from 'next/image'
import Link from 'next/link'

import { safeBlogCardImageUrl } from '@/lib/blog-image-url'
import type { BlogPostSummary } from '@/types/blog.types'

type Props = {
  post: BlogPostSummary
  href: string
  formattedDate: string
  /** Localized “By” / “Автор:” prefix before author name (design/blog.html). */
  authorByPrefix?: string
  /** Eager-load + fetchpriority="high" for above-the-fold cards (LCP). */
  priority?: boolean
}

export function BlogArticleCard({ post, href, formattedDate, authorByPrefix, priority = false }: Props) {
  const imageSrc = safeBlogCardImageUrl(post.heroImageUrl, post.id)
  const category = post.category ?? '—'

  return (
    <article className="group cursor-pointer">
      <Link href={href} className="block focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary focus-visible:ring-offset-2">
        <div className="relative mb-6 aspect-[4/3] overflow-hidden rounded-2xl bg-surface-container-low">
          <Image
            src={imageSrc}
            alt={post.title}
            fill
            className="object-cover transition-transform duration-500 group-hover:scale-110"
            sizes="(max-width: 768px) 100vw, (max-width: 1200px) 50vw, 33vw"
            priority={priority}
            loading={priority ? 'eager' : 'lazy'}
            fetchPriority={priority ? 'high' : 'auto'}
          />
        </div>
        <div className="space-y-3">
          <span className="text-xs font-bold uppercase tracking-widest text-primary">{category}</span>
          <h3 className="font-heading text-2xl font-bold leading-tight transition-colors group-hover:text-primary">
            {post.title}
          </h3>
          {post.excerpt ? (
            <p className="line-clamp-2 text-sm leading-relaxed text-on-surface-variant">{post.excerpt}</p>
          ) : null}
          <div className="flex items-center gap-3 pt-4 text-xs font-medium text-on-surface/60">
            {post.authorName ? (
              <span>
                {authorByPrefix ? `${authorByPrefix} ${post.authorName}` : post.authorName}
              </span>
            ) : null}
            {post.authorName ? <span className="h-1 w-1 rounded-full bg-outline-variant" aria-hidden /> : null}
            <span>{formattedDate}</span>
          </div>
        </div>
      </Link>
    </article>
  )
}
