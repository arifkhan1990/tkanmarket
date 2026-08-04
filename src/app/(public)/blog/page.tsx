import type { Metadata } from 'next'

import { Breadcrumb } from '@/components/common/Breadcrumb'
import { BlogPageClient } from '@/components/public/blog/blog-page-client'
import { PublicPageShell } from '@/components/shared/public-page-shell'
import { parseBlogTopicParam } from '@/lib/blog-topics'
import { getServerLocale } from '@/lib/i18n/get-locale'
import { getMessages } from '@/lib/i18n/get-messages'
import { withLocaleUrl } from '@/lib/i18n/locale-path'
import { getLatestPublicBlogPost } from '@/services/blog.service'

export async function generateMetadata(): Promise<Metadata> {
  const locale = await getServerLocale()
  const m = getMessages(locale)
  return {
    title: m.blog.metaTitle,
    description: m.blog.metaDescription
  }
}

type PageProps = { searchParams: Promise<{ topic?: string; q?: string }> }

export default async function BlogPage({ searchParams }: PageProps) {
  const sp = await searchParams
  const locale = await getServerLocale()
  const m = getMessages(locale)
  const topic = parseBlogTopicParam(sp.topic)

  // SSR loads only the hero (one query). The filtered grid + category counts
  // are hydrated by the client hook against /api/v1/public/blog. No N+1.
  const featured = await getLatestPublicBlogPost()

  return (
    <PublicPageShell
      blur="sm"
      className="pb-10 pt-6 md:pb-14 md:pt-8"
      contentClassName="space-y-8 md:space-y-10"
    >
      <Breadcrumb
        items={[
          { label: m.breadcrumbs.home, href: withLocaleUrl('/', locale) },
          { label: m.nav.blog, href: withLocaleUrl('/blog', locale) }
        ]}
      />

      <BlogPageClient initialTopic={topic} initialFeatured={featured} />
    </PublicPageShell>
  )
}
