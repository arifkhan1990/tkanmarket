import type { Metadata } from 'next'
import { notFound } from 'next/navigation'

import { BlogPostDetailView } from '@/components/public/blog/blog-post-detail-view'
import { BlogReadingProgress } from '@/components/public/blog/blog-reading-progress'
import { getServerLocale } from '@/lib/i18n/get-locale'
import { getMessages } from '@/lib/i18n/get-messages'
import { generateBlogArticleJsonLd } from '@/lib/utils/seo'
import { getPublicBlogPostBySlug, getRelatedPublicBlogPosts } from '@/services/blog.service'

type Props = { params: Promise<{ slug: string }> }

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { slug } = await params
  const locale = await getServerLocale()
  const m = getMessages(locale)
  const post = await getPublicBlogPostBySlug(slug)
  if (!post) {
    return { title: m.blog.metaTitle }
  }
  return {
    title: `${post.title} | ${m.common.brand}`,
    description: post.excerpt ?? m.blog.metaDescription,
    openGraph: {
      title: post.title,
      description: post.excerpt ?? m.blog.metaDescription,
      type: 'article',
      images: post.heroImageUrl ? [post.heroImageUrl] : undefined,
      publishedTime: post.createdAt,
      authors: post.authorName ? [post.authorName] : undefined
    },
    twitter: {
      card: 'summary_large_image',
      title: post.title,
      description: post.excerpt ?? m.blog.metaDescription,
      images: post.heroImageUrl ? [post.heroImageUrl] : undefined
    }
  }
}

export default async function BlogPostPage({ params }: Props) {
  const { slug } = await params
  const locale = await getServerLocale()
  const m = getMessages(locale)

  // Single round-trip for the post; the related rail runs in parallel and is
  // ranked by category match (no N+1, single SQL statement).
  const post = await getPublicBlogPostBySlug(slug)
  if (!post) notFound()

  const related = await getRelatedPublicBlogPosts(post.slug, 6, post.category)
  const articleJsonLd = generateBlogArticleJsonLd(post, locale)

  return (
    <>
      <script
        type="application/ld+json"
        // Server-rendered, never mixed with user input — title/excerpt are
        // already plain text from the DB and JSON.stringify escapes everything.
        dangerouslySetInnerHTML={{ __html: JSON.stringify(articleJsonLd) }}
      />
      <BlogReadingProgress ariaLabel={m.blog.readingProgressAria} />
      <BlogPostDetailView
        locale={locale}
        post={post}
        related={related}
        breadcrumbsHome={m.breadcrumbs.home}
        navBlogLabel={m.nav.blog}
        blog={m.blog}
      />
    </>
  )
}
