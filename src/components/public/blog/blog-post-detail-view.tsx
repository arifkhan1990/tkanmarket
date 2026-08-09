import { ArrowLeft, ArrowRight, BadgeCheck, Calendar, Clock, Tag } from 'lucide-react'
import Image from 'next/image'
import Link from 'next/link'

import { BlogPostDetailSidebar } from '@/components/public/blog/blog-post-detail-sidebar'
import { BlogRelatedSection } from '@/components/public/blog/blog-related-section'
import { BlogPostShareRail } from '@/components/public/blog/blog-post-share-rail'
import { BlogPostToc } from '@/components/public/blog/blog-post-toc'
import { Button } from '@/components/ui/button'
import { safeBlogCardImageUrl, safeBlogImageUrl } from '@/lib/blog-image-url'
import {
    getBlogTocEntries,
    splitBlogBodySections
} from '@/lib/blog-post-detail-utils'
import type { Messages } from '@/lib/i18n/get-messages'
import { withLocaleUrl } from '@/lib/i18n/locale-path'
import { cn } from '@/lib/utils'
import type { BlogPostDetail, BlogPostSummary } from '@/types/blog.types'
import type { Locale } from '@/types/i18n.types'

type BlogMsg = Messages['blog']

type Props = {
  locale: Locale
  post: BlogPostDetail
  related: BlogPostSummary[]
  breadcrumbsHome: string
  navBlogLabel: string
  blog: BlogMsg
}

function formatDate(iso: string, locale: string): string {
  try {
    return new Intl.DateTimeFormat(locale, {
      month: 'long',
      year: 'numeric',
      day: 'numeric'
    }).format(new Date(iso))
  } catch {
    return ''
  }
}

function authorInitials(name: string): string {
  const parts = name.trim().split(/\s+/).filter(Boolean)
  if (parts.length === 0) return '?'
  if (parts.length === 1) return (parts[0]?.slice(0, 2) ?? '??').toUpperCase()
  return `${parts[0]?.[0] ?? ''}${parts[parts.length - 1]?.[0] ?? ''}`.toUpperCase()
}

function categoryToTopicSlug(category: string): string {
  switch (category) {
    case 'Sourcing':
      return 'sourcing'
    case 'Logistics':
      return 'logistics'
    case 'Sustainability':
    case 'Sustainable Labs':
      return 'sustainability'
    case 'Technical Specs':
      return 'technical'
    case 'Market Trends':
      return 'trends'
    default:
      return 'all'
  }
}

export function BlogPostDetailView({
  locale,
  post,
  related,
  breadcrumbsHome,
  navBlogLabel,
  blog
}: Props) {
  const imageSrc = safeBlogImageUrl(post.heroImageUrl)
  const read =
    post.readMinutes != null ? blog.readMinutes.replace('{n}', String(post.readMinutes)) : null
  const dateStr = formatDate(post.createdAt, locale)
  const tocEntries = getBlogTocEntries(post.body, (i) =>
    blog.tocFallback.replace('{n}', String(i + 1))
  )
  const sections = splitBlogBodySections(post.body)
  const blogIndexHref = withLocaleUrl('/blog', locale)
  const fabricsHref = withLocaleUrl('/fabrics', locale)
  const nextPost = related[0] ?? null
  const categoryHref = post.category
    ? withLocaleUrl(`/blog?topic=${categoryToTopicSlug(post.category)}`, locale)
    : blogIndexHref

  return (
    <div className="bg-surface text-on-surface">
      {/* HERO */}
      <header className="relative h-[min(640px,80vh)] min-h-[360px] w-full overflow-hidden bg-surface-container-low">
        <Image
          src={imageSrc}
          alt={post.title}
          fill
          className="object-cover opacity-80"
          priority
          loading="eager"
          fetchPriority="high"
          sizes="100vw"
        />
        <div
          className="absolute inset-0 bg-gradient-to-t from-surface via-surface/60 to-surface/10"
          aria-hidden
        />
        <div className="absolute bottom-0 left-0 w-full pb-10 md:pb-14">
          <div className="mx-auto w-full max-w-screen-2xl space-y-5 px-6 md:px-8">
            <Button
              asChild
              variant="ghost"
              className="h-auto gap-2 px-0 py-0 text-on-surface/90 hover:bg-transparent hover:text-primary"
            >
              <Link href={blogIndexHref}>
                <ArrowLeft className="h-4 w-4 shrink-0" aria-hidden />
                {blog.backToInsights}
              </Link>
            </Button>

            <nav
              className="flex flex-wrap gap-x-2 gap-y-1 text-xs font-medium uppercase tracking-widest text-on-surface-variant"
              aria-label="Breadcrumb"
            >
              <Link className="transition-colors hover:text-primary" href={withLocaleUrl('/', locale)}>
                {breadcrumbsHome}
              </Link>
              <span aria-hidden>/</span>
              <Link className="transition-colors hover:text-primary" href={blogIndexHref}>
                {navBlogLabel}
              </Link>
              {post.category ? (
                <>
                  <span aria-hidden>/</span>
                  <span className="text-on-surface">{post.category}</span>
                </>
              ) : null}
            </nav>

            {post.category ? (
              <Link
                href={categoryHref}
                className="inline-flex items-center gap-2 rounded-full bg-primary/15 px-4 py-1.5 text-xs font-bold uppercase tracking-widest text-primary backdrop-blur-sm transition-colors hover:bg-primary/25"
              >
                <Tag className="h-3.5 w-3.5" aria-hidden />
                {post.category}
              </Link>
            ) : null}

            <h1 className="max-w-4xl font-heading text-4xl font-extrabold leading-tight tracking-tight text-on-background md:text-6xl lg:text-7xl">
              {post.title}
            </h1>

            <div className="flex flex-wrap items-center gap-x-6 gap-y-3 text-sm text-on-surface-variant">
              {post.authorName ? (
                <div className="flex items-center gap-2 font-semibold text-on-surface">
                  <span className="flex h-7 w-7 items-center justify-center rounded-full bg-primary/15 text-[11px] font-black text-primary">
                    {authorInitials(post.authorName)}
                  </span>
                  <span>
                    {blog.byAuthor} {post.authorName}
                  </span>
                </div>
              ) : null}
              <span className="inline-flex items-center gap-1.5">
                <Calendar className="h-3.5 w-3.5" aria-hidden />
                {dateStr}
              </span>
              {read ? (
                <span className="inline-flex items-center gap-1.5">
                  <Clock className="h-3.5 w-3.5" aria-hidden />
                  {read}
                </span>
              ) : null}
            </div>
          </div>
        </div>
      </header>

      {/* MAIN GRID */}
      <div className="mx-auto max-w-screen-2xl px-6 py-12 md:px-8 md:py-20">
        <div className="grid grid-cols-1 gap-12 lg:grid-cols-12 lg:items-start lg:gap-16">
          {/* TOC + share rail */}
          <aside className="hidden lg:col-span-2 lg:block">
            <div className="sticky top-32 space-y-10">
              <BlogPostToc title={blog.tocTitle} entries={tocEntries} />

              <div className="border-t border-outline-variant/20 pt-8">
                <p className="mb-4 text-[10px] font-bold uppercase tracking-widest text-on-surface-variant">
                  {blog.shareArticle}
                </p>
                <BlogPostShareRail
                  title={post.title}
                  shareLabel={blog.shareArticle}
                  copyLabel={blog.shareCopy}
                  copiedLabel={blog.shareCopied}
                  copyFailedLabel={blog.shareCopyFailed}
                  twitterLabel={blog.shareTwitter}
                  linkedinLabel={blog.shareLinkedin}
                />
              </div>
            </div>
          </aside>

          {/* ARTICLE BODY */}
          <article className="min-w-0 scroll-smooth lg:col-span-7">
            <div className="mx-auto max-w-3xl space-y-10 lg:mx-0 lg:max-w-none">
              {post.excerpt ? (
                <p className="border-l-4 border-primary pl-6 font-sans text-lg italic leading-relaxed text-on-surface-variant md:text-xl md:pl-8">
                  {post.excerpt}
                </p>
              ) : null}

              <div className="space-y-6 text-base leading-relaxed text-on-surface/90 md:text-lg md:leading-loose">
                {sections.map((block, i) => (
                  <p
                    key={`section-${i}`}
                    id={`section-${i}`}
                    className={cn(
                      'scroll-mt-28',
                      i === 0 &&
                        'first-letter:float-left first-letter:mr-2 first-letter:font-heading first-letter:text-6xl first-letter:font-extrabold first-letter:leading-[0.85] first-letter:text-primary md:first-letter:text-7xl'
                    )}
                  >
                    {block}
                  </p>
                ))}
              </div>

              {/* Mobile share row (visible below lg where the rail is hidden) */}
              <div className="border-t border-outline-variant/20 pt-8 lg:hidden">
                <p className="mb-4 text-[10px] font-bold uppercase tracking-widest text-on-surface-variant">
                  {blog.shareArticle}
                </p>
                <BlogPostShareRail
                  title={post.title}
                  shareLabel={blog.shareArticle}
                  copyLabel={blog.shareCopy}
                  copiedLabel={blog.shareCopied}
                  copyFailedLabel={blog.shareCopyFailed}
                  twitterLabel={blog.shareTwitter}
                  linkedinLabel={blog.shareLinkedin}
                />
              </div>

              {/* AUTHOR CARD */}
              {post.authorName ? (
                <div className="rounded-3xl border border-outline-variant/15 bg-surface-container-lowest p-6 md:p-8">
                  <p className="mb-4 text-[10px] font-bold uppercase tracking-widest text-on-surface-variant">
                    {blog.aboutAuthor}
                  </p>
                  <div className="flex items-start gap-5">
                    <div className="flex h-14 w-14 shrink-0 items-center justify-center rounded-full bg-gradient-to-br from-primary/15 to-secondary-container/40 text-base font-black text-primary">
                      {authorInitials(post.authorName)}
                    </div>
                    <div className="min-w-0">
                      <p className="font-heading text-lg font-bold text-on-surface">
                        {post.authorName}
                      </p>
                      {post.authorRole ? (
                        <p className="mt-0.5 text-sm text-on-surface-variant">{post.authorRole}</p>
                      ) : null}
                      <div className="mt-3 inline-flex items-center gap-1.5 rounded-full bg-primary/10 px-3 py-1 text-[10px] font-bold uppercase tracking-widest text-primary">
                        <BadgeCheck className="h-3.5 w-3.5" aria-hidden />
                        {blog.expertVerified}
                      </div>
                    </div>
                  </div>
                </div>
              ) : null}

              {/* UP-NEXT TEASER */}
              {nextPost ? (
                <Link
                  href={withLocaleUrl(`/blog/${nextPost.slug}`, locale)}
                  className="group relative block overflow-hidden rounded-3xl border border-outline-variant/15 bg-surface-container-lowest p-6 transition-all hover:-translate-y-0.5 hover:border-primary/40 hover:shadow-md md:p-8"
                >
                  <p className="mb-3 text-[10px] font-bold uppercase tracking-widest text-primary">
                    {blog.nextArticleEyebrow}
                  </p>
                  <div className="flex flex-col gap-5 md:flex-row md:items-center">
                    <div className="relative aspect-[16/10] w-full overflow-hidden rounded-2xl bg-surface-container-high md:aspect-[4/3] md:w-44">
                      <Image
                        src={safeBlogCardImageUrl(nextPost.heroImageUrl, nextPost.id)}
                        alt={nextPost.title}
                        fill
                        sizes="(max-width: 768px) 100vw, 176px"
                        className="object-cover transition-transform duration-500 group-hover:scale-105"
                      />
                    </div>
                    <div className="min-w-0 flex-1">
                      {nextPost.category ? (
                        <p className="text-[10px] font-bold uppercase tracking-widest text-on-surface-variant">
                          {nextPost.category}
                        </p>
                      ) : null}
                      <h3 className="mt-1 font-heading text-xl font-bold text-on-surface transition-colors group-hover:text-primary md:text-2xl">
                        {nextPost.title}
                      </h3>
                      {nextPost.excerpt ? (
                        <p className="mt-2 line-clamp-2 text-sm text-on-surface-variant">
                          {nextPost.excerpt}
                        </p>
                      ) : null}
                    </div>
                    <ArrowRight
                      className="hidden h-5 w-5 shrink-0 text-primary transition-transform group-hover:translate-x-1 md:block"
                      aria-hidden
                    />
                  </div>
                </Link>
              ) : null}
            </div>
          </article>

          {/* SIDEBAR */}
          <BlogPostDetailSidebar
            articleDetailsLabel={blog.articleDetails}
            labelCategory={blog.labelCategory}
            labelReadTime={blog.labelReadTime}
            labelPublished={blog.labelPublished}
            labelAuthor={blog.labelAuthor}
            ctaEyebrow={blog.ctaEyebrow}
            ctaTitle={blog.ctaTitle}
            ctaButton={blog.ctaFabrics}
            fabricsHref={fabricsHref}
            category={post.category ?? null}
            readLabel={read}
            dateStr={dateStr}
            authorName={post.authorName ?? null}
          />
        </div>
      </div>

      {/* RELATED */}
      <BlogRelatedSection
        locale={locale}
        related={related}
        blogIndexHref={blogIndexHref}
        title={blog.relatedIntelligence}
        lead={blog.relatedIntelligenceLead}
        viewAllLabel={blog.viewAllInsights}
        readMinutesTemplate={blog.readMinutes}
        formatDate={formatDate}
      />
    </div>
  )
}
