import Image from 'next/image'
import Link from 'next/link'

import { Button } from '@/components/ui/button'
import type { FabricSummary } from '@/types/marketplace.types'
import { withLocaleUrl } from '@/lib/i18n/locale-path'
import type { Locale } from '@/types/i18n.types'
import { cn, isRemoteImageSrc } from '@/lib/utils'
import { FABRIC_IMAGE_PLACEHOLDER_PATH } from '@/constants/marketplace-images'

type Props = {
  locale: Locale
  fabric: FabricSummary
  badge: string
  title: string
  body: string
  cta: string
  className?: string
}

export function CatalogSpotlightBento({ locale, fabric, badge, title, body, cta, className }: Props) {
  const href = withLocaleUrl(`/fabrics/${fabric.slug}`, locale)
  const raw = fabric.imageUrl?.trim()
  const src = raw && raw.length > 0 ? raw : FABRIC_IMAGE_PLACEHOLDER_PATH

  return (
    <div
      className={cn(
        'grid gap-6 overflow-hidden rounded-2xl bg-gradient-to-br from-primary to-primary-container p-8 text-on-primary md:col-span-2 md:grid-cols-2 md:items-center',
        className
      )}
    >
      <div>
        <div className="mb-4 flex items-center gap-2">
          <span className="text-xs font-black uppercase tracking-widest text-on-primary-container">{badge}</span>
        </div>
        <h2 className="font-heading text-2xl font-extrabold tracking-tight md:text-3xl">{title}</h2>
        <p className="mt-3 max-w-md text-base text-on-primary-container">{body}</p>
        <Button
          asChild
          className="mt-6 rounded-xl bg-white text-primary hover:bg-white/90"
        >
          <Link href={href}>{cta}</Link>
        </Button>
      </div>
      <div className="relative aspect-square w-full overflow-hidden rounded-3xl border border-white/20 bg-white/10 p-3 shadow-sm backdrop-blur-md">
        <Image
          src={src}
          alt=""
          fill
          className="rounded-2xl object-cover shadow-2xl"
          sizes="(max-width: 768px) 100vw, 33vw"
          unoptimized={isRemoteImageSrc(src)}
          priority
          fetchPriority="high"
          loading="eager"
        />
      </div>
    </div>
  )
}
