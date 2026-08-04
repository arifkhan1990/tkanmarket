import Link from 'next/link'

import { Badge } from '@/components/ui/badge'
import { withDbFallback } from '@/lib/db/with-db-fallback'
import { getServerLocale } from '@/lib/i18n/get-locale'
import { getMessages } from '@/lib/i18n/get-messages'
import { withLocaleUrl } from '@/lib/i18n/locale-path'
import { FabricService } from '@/services/fabric.service'

type CategoryChip = { slug: string; count: number }

export async function HeroCategoryChips(props: { limit?: number }) {
  const locale = await getServerLocale()
  const m = getMessages(locale)
  const rows = await withDbFallback('home.heroCategoryChips', () => FabricService.getCategoryCounts(), [])
  const chips: CategoryChip[] = rows.slice(0, props.limit ?? 10).map((r) => ({ slug: r.category, count: r.count }))

  if (chips.length === 0) return null

  return (
    <div className="mt-5">
      <div className="flex items-center justify-between gap-3">
        <div className="text-xs font-extrabold uppercase tracking-widest text-on-surface-variant">
          {m.hero.shopByCategory}
        </div>
        <Link href={withLocaleUrl('/fabrics', locale)} className="text-xs font-bold text-primary hover:underline">
          {m.hero.viewAllLink}
        </Link>
      </div>

      <div className="mt-3 flex flex-wrap gap-2">
        {chips.map((c) => (
          <Link
            key={c.slug}
            href={withLocaleUrl(`/fabrics?category_slug=${encodeURIComponent(c.slug)}`, locale)}
            className="group inline-flex items-center gap-2 rounded-full border border-outline/15 bg-background/70 px-3 py-2 text-sm font-semibold text-on-surface backdrop-blur transition-colors hover:bg-primary/10 hover:text-primary"
          >
            <span className="max-w-[18ch] truncate">{c.slug}</span>
            <Badge
              intent="default"
              className="h-5 rounded-full border-transparent bg-surface-container-high px-2 text-[11px] font-extrabold text-on-surface-variant group-hover:bg-primary/15 group-hover:text-primary"
            >
              {c.count.toLocaleString(locale === 'ru' ? 'ru-RU' : locale === 'zh' ? 'zh-CN' : 'en-US')}
            </Badge>
          </Link>
        ))}
      </div>
    </div>
  )
}

