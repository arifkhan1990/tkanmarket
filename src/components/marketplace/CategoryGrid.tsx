import Image from 'next/image'

import { Badge } from '@/components/ui/badge'
import { CATEGORY_GRID_IMAGE_BY_SLUG } from '@/constants/category-grid-images'
import { withDbFallback } from '@/lib/db/with-db-fallback'
import { getServerLocale } from '@/lib/i18n/get-locale'
import { getMessages } from '@/lib/i18n/get-messages'
import { withLocaleUrl } from '@/lib/i18n/locale-path'
import { cn, isRemoteImageSrc } from '@/lib/utils'
import { FabricService } from '@/services/fabric.service'
import Link from 'next/link'

type CategoryTile = { slug: string; count: number }

function bgForSlug(slug: string): string {
  // Stable, deterministic pastel gradient choice without hardcoding category names.
  const tones = [
    'from-brand-50/80 to-background',
    'from-emerald-50/80 to-background',
    'from-sky-50/80 to-background',
    'from-fuchsia-50/80 to-background',
    'from-amber-50/80 to-background',
    'from-violet-50/80 to-background'
  ] as const
  let h = 0
  for (let i = 0; i < slug.length; i++) h = (h * 31 + slug.charCodeAt(i)) >>> 0
  return tones[h % tones.length] ?? tones[0]
}

export async function CategoryGrid(props: { tiles: CategoryTile[] }) {
  const locale = await getServerLocale()
  const m = getMessages(locale)
  const items = m.categories.items

  return (
    <section className="bg-surface-container-low">
      <div className="mx-auto w-full max-w-screen-2xl px-6 py-14 md:px-8">
        <div className="flex items-end justify-between gap-4">
          <div>
            <h2 className="font-heading text-heading-xl font-extrabold tracking-tight text-on-surface">{m.categories.title}</h2>
            {m.categories.subtitle ? (
              <p className="mt-2 text-sm text-on-surface-variant">{m.categories.subtitle}</p>
            ) : null}
          </div>
        </div>

        <div className="mt-8 grid gap-5 md:grid-cols-2 lg:grid-cols-3">
          {props.tiles.map((c, idx) => {
            const item = items.find((i) => i.queryKey === c.slug)
            const label = item?.label ?? c.slug
            const keyLabel = item?.key ?? c.slug
            const visual = CATEGORY_GRID_IMAGE_BY_SLUG[c.slug]
            // Only the first tile is safely "above the fold" across layouts.
            // Preloading too many images can trigger "preloaded but not used" warnings.
            const isAboveFold = idx === 0
            return (
              <Link
                key={c.slug}
                href={withLocaleUrl(`/fabrics?category_slug=${encodeURIComponent(c.slug)}`, locale)}
                className={cn(
                  'group flex flex-col overflow-hidden rounded-[2rem] border border-outline/10 bg-surface-container-lowest',
                  'shadow-sm hover:border-outline/20 hover:shadow-soft transition-all'
                )}
              >
                <div className="relative aspect-[16/11] w-full overflow-hidden bg-surface-container-high">
                  {visual ? (
                    <Image
                      src={visual.src}
                      alt={label}
                      fill
                      sizes="(max-width: 768px) 100vw, (max-width: 1200px) 50vw, 33vw"
                      className="object-cover transition-transform duration-700 group-hover:scale-105"
                      unoptimized={isRemoteImageSrc(visual.src)}
                      priority={isAboveFold}
                    />
                  ) : null}
                  <div
                    className="absolute inset-0 bg-gradient-to-t from-black/65 via-black/25 to-transparent"
                    aria-hidden
                  />
                  <div className="absolute bottom-3 left-4 right-4 text-white">
                    <div className="text-sm font-extrabold leading-snug drop-shadow-sm">{label}</div>
                    <div className="mt-1 text-xs font-medium text-white/90">{keyLabel}</div>
                  </div>
                </div>

                <div
                  className={cn(
                    'flex items-center justify-between gap-3 border-t border-outline/10 px-5 py-4',
                    'bg-gradient-to-br',
                    bgForSlug(c.slug)
                  )}
                >
                  <Badge intent="default" className="bg-background/80 backdrop-blur">
                    {c.count.toLocaleString(locale === 'ru' ? 'ru-RU' : locale === 'zh' ? 'zh-CN' : 'en-US')}{' '}
                    {m.categories.fabricsCountSuffix}
                  </Badge>
                  <span className="text-sm font-extrabold text-primary transition-opacity group-hover:opacity-90">
                    {m.categories.view}
                  </span>
                </div>
              </Link>
            )
          })}
        </div>
      </div>
    </section>
  )
}

export async function CategoryGridAsync() {
  const rows = await withDbFallback('home.categoryCounts', () => FabricService.getCategoryCounts(), [])
  const sourceRows =
    rows.length > 0
      ? rows.map((r) => ({ slug: r.category, count: r.count }))
      : (await withDbFallback('home.junctionCategoryCounts', () => FabricService.getJunctionCategoryCounts(), [])).map(
          (r) => ({ slug: r.slug, count: r.count })
        )

  const tiles: CategoryTile[] = sourceRows.slice(0, 6)
  return <CategoryGrid tiles={tiles} />
}

export function CategoryGridFallback() {
  return (
    <section className="bg-surface-container-low">
      <div className="mx-auto w-full max-w-screen-2xl px-6 py-14 md:px-8">
        <div className="space-y-3">
          <div className="h-7 w-64 animate-pulse rounded-xl bg-surface-container/60" />
          <div className="h-4 w-80 animate-pulse rounded-xl bg-surface-container/60" />
        </div>
        <div className="mt-8 grid gap-5 md:grid-cols-2 lg:grid-cols-3">
          {Array.from({ length: 6 }).map((_, idx) => (
            <div
              key={idx}
              className="overflow-hidden rounded-[2rem] border border-outline/10 bg-surface-container-lowest"
            >
              <div className="aspect-[16/11] w-full animate-pulse bg-surface-container/60" />
              <div className="flex items-center justify-between gap-3 border-t border-outline/10 px-5 py-4">
                <div className="h-6 w-24 animate-pulse rounded-full bg-surface-container/60" />
                <div className="h-4 w-16 animate-pulse rounded-full bg-surface-container/60" />
              </div>
            </div>
          ))}
        </div>
      </div>
    </section>
  )
}
