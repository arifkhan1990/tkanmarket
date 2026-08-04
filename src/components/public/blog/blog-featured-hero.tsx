import Image from 'next/image'
import Link from 'next/link'
import { ArrowRight } from 'lucide-react'

import { safeBlogImageUrl } from '@/lib/blog-image-url'
import type { BlogPostSummary } from '@/types/blog.types'

type Props = {
  post: BlogPostSummary | null
  fallbackTitle: string
  fallbackLead: string
  badge: string
  readLabel: (minutes: number) => string
  formattedDate: string
  readFull: string
  href: string | null
}

export function BlogFeaturedHero({
  post,
  fallbackTitle,
  fallbackLead,
  badge,
  readLabel,
  formattedDate,
  readFull,
  href
}: Props) {
  const title = post?.title ?? fallbackTitle
  const lead = post?.excerpt ?? fallbackLead
  const imageSrc = safeBlogImageUrl(post?.heroImageUrl)
  const read = post?.readMinutes != null ? readLabel(post.readMinutes) : null
  const imageAlt = title

  return (
    <section className="relative w-full">
      {/* Matches design/blog.html: tall hero, 2rem radius, dark gradient, white CTA */}
      <div className="group relative h-[min(716px,85vh)] min-h-[320px] w-full overflow-hidden rounded-[2rem] shadow-[0_20px_40px_rgba(25,28,30,0.08)] md:min-h-[420px]">
        <Image
          src={imageSrc}
          alt={imageAlt}
          fill
          className="object-cover transition-transform duration-700 group-hover:scale-105"
          sizes="(max-width: 1536px) 100vw, 1536px"
          priority
        />
        <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-black/20 to-transparent" />
        <div className="absolute bottom-0 left-0 max-w-4xl p-8 md:p-12 lg:p-20">
          <div className="mb-6 flex flex-wrap items-center gap-3">
            <span className="rounded-md bg-primary px-3 py-1 text-xs font-bold uppercase tracking-widest text-on-primary">
              {badge}
            </span>
            <span className="text-sm font-medium text-white/70">
              {read ? `${read} • ${formattedDate}` : formattedDate}
            </span>
          </div>
          <h1 className="mb-6 font-heading text-4xl font-extrabold leading-[1.1] tracking-tight text-white md:mb-8 md:text-6xl lg:text-7xl">
            {title}
          </h1>
          <p className="mb-8 max-w-2xl font-sans text-lg leading-relaxed text-white/80 md:mb-10 md:text-xl">
            {lead}
          </p>
          {href ? (
            <Link
              href={href}
              className="inline-flex items-center gap-2 rounded-xl bg-white px-8 py-4 text-sm font-bold text-primary shadow-lg transition-colors hover:bg-primary-fixed active:scale-[0.99] md:text-base"
            >
              {readFull}
              <ArrowRight className="h-5 w-5 shrink-0" aria-hidden />
            </Link>
          ) : null}
        </div>
      </div>
    </section>
  )
}
