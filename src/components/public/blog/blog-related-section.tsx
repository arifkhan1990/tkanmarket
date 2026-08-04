import Image from 'next/image'
import Link from 'next/link'
import { ArrowRight, Sparkles } from 'lucide-react'

import { Button } from '@/components/ui/button'
import { safeBlogCardImageUrl } from '@/lib/blog-image-url'
import { withLocaleUrl } from '@/lib/i18n/locale-path'
import type { BlogPostSummary } from '@/types/blog.types'
import type { Locale } from '@/types/i18n.types'

type Props = {
  locale: Locale
  related: BlogPostSummary[]
  blogIndexHref: string
  title: string
  lead: string
  viewAllLabel: string
  readMinutesTemplate: string
  emptyTitle: string
  emptyDescription: string
  formatDate: (iso: string, locale: string) => string
}

export function BlogRelatedSection({
  locale,
  related,
  blogIndexHref,
  title,
  lead,
  viewAllLabel,
  readMinutesTemplate,
  emptyTitle,
  emptyDescription,
  formatDate
}: Props) {
  return (
    <section className="border-t border-outline-variant/20 bg-surface-container-low py-16 md:py-24">
      <div className="mx-auto max-w-screen-2xl px-6 md:px-8">
        <div className="mb-10 flex flex-col justify-between gap-6 sm:flex-row sm:items-end md:mb-12">
          <div>
            <h2 className="mb-2 font-heading text-2xl font-bold text-on-surface md:text-3xl">{title}</h2>
            <p className="text-on-surface-variant">{lead}</p>
          </div>
          <Link
            href={blogIndexHref}
            className="group inline-flex shrink-0 items-center gap-2 text-sm font-bold text-primary transition-colors hover:underline"
          >
            {viewAllLabel}
            <ArrowRight className="h-4 w-4 transition-transform group-hover:translate-x-1" aria-hidden />
          </Link>
        </div>

        {related.length > 0 ? (
          <div className="grid grid-cols-1 gap-8 md:grid-cols-3">
            {related.slice(0, 3).map((item) => {
              const href = withLocaleUrl(`/blog/${item.slug}`, locale)
              const img = safeBlogCardImageUrl(item.heroImageUrl, item.id)
              const cat = item.category ?? '—'
              const itemDate = formatDate(item.createdAt, locale)
              return (
                <Link
                  key={item.slug}
                  href={href}
                  className="group block focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary focus-visible:ring-offset-2"
                >
                  <div className="relative mb-6 aspect-[4/3] overflow-hidden rounded-2xl bg-surface-container-highest">
                    <Image
                      src={img}
                      alt={item.title}
                      fill
                      className="object-cover transition-transform duration-500 group-hover:scale-105"
                      sizes="(max-width: 768px) 100vw, 33vw"
                    />
                  </div>
                  <span className="text-[10px] font-bold uppercase tracking-widest text-primary">{cat}</span>
                  <h3 className="mt-2 font-heading text-lg font-bold transition-colors group-hover:text-primary md:text-xl">
                    {item.title}
                  </h3>
                  <div className="mt-3 flex items-center gap-3 text-xs text-on-surface-variant">
                    <span>{itemDate}</span>
                    {item.readMinutes != null ? (
                      <>
                        <span className="h-1 w-1 rounded-full bg-outline-variant" aria-hidden />
                        <span>{readMinutesTemplate.replace('{n}', String(item.readMinutes))}</span>
                      </>
                    ) : null}
                  </div>
                </Link>
              )
            })}
          </div>
        ) : (
          <div className="rounded-3xl border border-dashed border-outline-variant/40 bg-surface-container-lowest px-6 py-16 text-center">
            <Sparkles className="mx-auto mb-4 h-10 w-10 text-primary/40" aria-hidden />
            <p className="font-heading text-xl font-bold text-on-surface">{emptyTitle}</p>
            <p className="mt-2 text-sm text-on-surface-variant">{emptyDescription}</p>
            <Button asChild className="mt-6 rounded-full" variant="outline">
              <Link href={blogIndexHref}>{viewAllLabel}</Link>
            </Button>
          </div>
        )}
      </div>
    </section>
  )
}

