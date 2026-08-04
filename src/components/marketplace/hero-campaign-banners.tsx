import Link from 'next/link'

import { Badge } from '@/components/ui/badge'
import { withDbFallback } from '@/lib/db/with-db-fallback'
import { getServerLocale } from '@/lib/i18n/get-locale'
import { getMessages } from '@/lib/i18n/get-messages'
import { withLocaleUrl } from '@/lib/i18n/locale-path'
import { FabricService } from '@/services/fabric.service'

function hashToHue(input: string): number {
  let h = 0
  for (let i = 0; i < input.length; i++) h = (h * 31 + input.charCodeAt(i)) >>> 0
  return h % 360
}

function bannerGradient(slug: string): string {
  const hue = hashToHue(slug)
  const hue2 = (hue + 28) % 360
  return `linear-gradient(135deg, hsl(${hue} 56% 34%), hsl(${hue2} 62% 22%))`
}

export async function HeroCampaignBanners(props: { limit?: number }) {
  const locale = await getServerLocale()
  const m = getMessages(locale)

  const rows = await withDbFallback('home.heroCampaignBanners', () => FabricService.getCategoryCounts(), [])
  const items = rows.slice(0, props.limit ?? 3)

  if (items.length === 0) return null

  return (
    <div className="mt-8 grid gap-3 lg:grid-cols-3">
      {items.map((it) => (
        <Link
          key={it.category}
          href={withLocaleUrl(`/fabrics?category_slug=${encodeURIComponent(it.category)}`, locale)}
          className="group relative overflow-hidden rounded-3xl border border-outline/10 bg-surface-container-lowest p-6 shadow-sm transition-transform hover:-translate-y-0.5 hover:shadow-soft"
        >
          <div className="absolute inset-0 opacity-[0.9]" style={{ backgroundImage: bannerGradient(it.category) }} aria-hidden />
          <div className="absolute inset-0 bg-gradient-to-t from-black/55 via-black/25 to-transparent" aria-hidden />
          <div className="relative">
            <div className="text-xs font-extrabold uppercase tracking-widest text-white/80">{m.hero.campaignLabel}</div>
            <div className="mt-2 text-2xl font-extrabold leading-tight text-white">
              {it.category}
            </div>
            <div className="mt-4 flex items-center gap-2">
              <Badge intent="default" className="border-transparent bg-white/15 text-white backdrop-blur">
                {it.count.toLocaleString(locale === 'ru' ? 'ru-RU' : locale === 'zh' ? 'zh-CN' : 'en-US')}{' '}
                {m.categories.fabricsCountSuffix}
              </Badge>
              <span className="text-sm font-extrabold text-white/90 group-hover:text-white">{m.hero.campaignCta}</span>
            </div>
          </div>
        </Link>
      ))}
    </div>
  )
}

