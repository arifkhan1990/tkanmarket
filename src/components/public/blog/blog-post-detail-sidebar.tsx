import { ArrowRight, Calendar, Sparkles } from 'lucide-react'
import Link from 'next/link'

import { Button } from '@/components/ui/button'

type Props = {
  articleDetailsLabel: string
  labelCategory: string
  labelReadTime: string
  labelPublished: string
  labelAuthor: string
  ctaEyebrow: string
  ctaTitle: string
  ctaButton: string
  ctaDescription?: string
  ctaFootnote?: string
  fabricsHref: string
  category: string | null
  readLabel: string | null
  dateStr: string
  authorName: string | null
}

export function BlogPostDetailSidebar({
  articleDetailsLabel,
  labelCategory,
  labelReadTime,
  labelPublished,
  labelAuthor,
  ctaEyebrow,
  ctaTitle,
  ctaButton,
  ctaDescription,
  ctaFootnote,
  fabricsHref,
  category,
  readLabel,
  dateStr,
  authorName
}: Props) {
  return (
    <aside className="lg:col-span-3 lg:self-start">
      <div className="space-y-6 lg:sticky lg:top-32">
        <div className="rounded-2xl border border-outline-variant/15 bg-surface-container-lowest p-6 md:p-7">
          <h2 className="mb-6 font-heading text-xs font-bold uppercase tracking-widest text-primary">
            {articleDetailsLabel}
          </h2>
          <dl className="space-y-4">
            {category ? (
              <div className="flex items-center justify-between gap-4 border-b border-outline-variant/10 pb-4">
                <dt className="text-sm text-on-surface-variant">{labelCategory}</dt>
                <dd className="text-sm font-bold text-on-surface">{category}</dd>
              </div>
            ) : null}
            {readLabel ? (
              <div className="flex items-center justify-between gap-4 border-b border-outline-variant/10 pb-4">
                <dt className="text-sm text-on-surface-variant">{labelReadTime}</dt>
                <dd className="text-sm font-bold text-on-surface">{readLabel}</dd>
              </div>
            ) : null}
            <div className="flex items-center justify-between gap-4 border-b border-outline-variant/10 pb-4">
              <dt className="inline-flex items-center gap-2 text-sm text-on-surface-variant">
                <Calendar className="h-3.5 w-3.5" aria-hidden />
                {labelPublished}
              </dt>
              <dd className="text-sm font-bold text-on-surface">{dateStr}</dd>
            </div>
            {authorName ? (
              <div className="flex items-center justify-between gap-4">
                <dt className="text-sm text-on-surface-variant">{labelAuthor}</dt>
                <dd className="text-sm font-bold text-on-surface">{authorName}</dd>
              </div>
            ) : null}
          </dl>
        </div>

        <section className="relative overflow-hidden rounded-3xl border border-primary/25 bg-gradient-to-br from-primary to-primary-container p-6 text-on-primary shadow-soft md:p-8">
          <div
            className="pointer-events-none absolute inset-0 bg-[radial-gradient(1200px_circle_at_20%_-10%,rgba(255,255,255,0.22),transparent_55%),radial-gradient(900px_circle_at_110%_10%,rgba(255,255,255,0.14),transparent_50%)]"
            aria-hidden
          />
          <div
            className="pointer-events-none absolute -right-16 -top-16 h-44 w-44 rounded-full bg-white/10 blur-2xl"
            aria-hidden
          />
          <div
            className="pointer-events-none absolute -bottom-20 -left-20 h-56 w-56 rounded-full bg-black/10 blur-2xl"
            aria-hidden
          />
          <div className="relative">
            <div className="mb-4 inline-flex items-center gap-2 rounded-full border border-white/15 bg-black/10 px-3 py-1.5 text-[11px] font-extrabold uppercase tracking-widest text-on-primary/90 backdrop-blur-sm">
              <Sparkles className="h-3.5 w-3.5" aria-hidden />
              <span>{ctaEyebrow}</span>
            </div>

            <h3 className="text-balance mb-3 font-heading text-xl font-extrabold leading-snug tracking-tight md:text-2xl">
              {ctaTitle}
            </h3>
            {ctaDescription ? (
              <p className="mb-6 text-sm leading-relaxed text-on-primary/85">{ctaDescription}</p>
            ) : (
              <div className="mb-6" aria-hidden />
            )}

            <div className="grid gap-3">
              <Button
                asChild
                size="lg"
                className="group h-12 w-full rounded-2xl border border-white/15 bg-black/10 px-5 font-extrabold text-on-primary shadow-sm backdrop-blur-md transition-all hover:-translate-y-0.5 hover:bg-black/15 hover:shadow-md focus-visible:ring-2 focus-visible:ring-white/40"
              >
                <Link href={fabricsHref} className="flex w-full items-center justify-between">
                  <span className="text-left">{ctaButton}</span>
                  <ArrowRight
                    className="h-4 w-4 shrink-0 transition-transform group-hover:translate-x-1"
                    aria-hidden
                  />
                </Link>
              </Button>
              {ctaFootnote ? <p className="text-xs text-on-primary/75">{ctaFootnote}</p> : null}
            </div>
          </div>
        </section>
      </div>
    </aside>
  )
}

