'use client'

import Image from 'next/image'
import Link from 'next/link'
import { Building2, Droplets, Ruler, Sparkles, Package } from 'lucide-react'
import { usePathname } from 'next/navigation'
import { useState } from 'react'

import type { FabricSummary } from '@/types/marketplace.types'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { FabricCompareButton } from '@/components/marketplace/FabricCompareButton'
import { FabricCardWishlistOverlay } from '@/components/marketplace/FabricCardWishlistOverlay'
import { SampleRequestModal } from '@/components/forms/SampleRequestModal'
import { cn, isRemoteImageSrc } from '@/lib/utils'
import { FABRIC_MATERIALS } from '@/constants'
import { FABRIC_IMAGE_PLACEHOLDER_PATH } from '@/constants/marketplace-images'
import { useI18n } from '@/hooks/useI18n'
import { DEFAULT_LOCALE } from '@/types/i18n.types'
import { getLocaleFromPathname, withLocaleUrl } from '@/lib/i18n/locale-path'
import { getLocalizedFabricTitle, getLocalizedFabricTags } from '@/lib/i18n/localized-fabric'

export function FabricListRow({
  fabric,
  showWishlist,
  wishlistSaved,
  priority = false
}: {
  fabric: FabricSummary
  showWishlist?: boolean
  wishlistSaved?: boolean
  /** When true, render the cover image with high priority for LCP. */
  priority?: boolean
}) {
  const pathname = usePathname()
  const { locale: hookLocale, messages } = useI18n()
  const locale = getLocaleFromPathname(pathname) ?? hookLocale ?? DEFAULT_LOCALE
  const [sampleOpen, setSampleOpen] = useState(false)

  const title = getLocalizedFabricTitle(fabric, locale)
  const localizedTags = getLocalizedFabricTags(fabric, locale)
  const rawImage = fabric.imageUrl?.trim()
  const imageSrc = rawImage && rawImage.length > 0 ? rawImage : FABRIC_IMAGE_PLACEHOLDER_PATH
  const compositionSummary =
    localizedTags.filter((t) => (FABRIC_MATERIALS as readonly string[]).includes(t)).slice(0, 2).join(' / ') ||
    (localizedTags[0] ?? null)

  const fabricHref = withLocaleUrl(`/fabrics/${fabric.slug}`, locale)
  const skuDisplay = fabric.sku?.trim() ? fabric.sku : '—'

  return (
    <div
      className={cn(
        'relative flex gap-4 overflow-hidden rounded-3xl border border-transparent bg-surface-container-lowest p-4 shadow-sm transition-all',
        'hover:border-primary/25 hover:shadow-xl md:gap-6 md:p-5'
      )}
    >
      <div className="group/media relative h-32 w-32 shrink-0 overflow-hidden rounded-2xl bg-surface-container-highest sm:h-36 sm:w-40">
        <Link href={fabricHref} className="absolute inset-0 block outline-offset-2 focus-visible:outline focus-visible:ring-2 focus-visible:ring-primary">
          <Image
            src={imageSrc}
            alt=""
            fill
            sizes="160px"
            className="object-cover transition-transform duration-300 group-hover/media:scale-[1.02]"
            unoptimized={isRemoteImageSrc(imageSrc)}
            priority={priority}
            fetchPriority={priority ? 'high' : 'auto'}
            loading={priority ? 'eager' : 'lazy'}
            aria-hidden
          />
        </Link>

        <div className="pointer-events-none absolute inset-x-0 top-0 z-[8] flex items-start justify-between gap-1 p-1.5 sm:gap-2 sm:p-2">
          <div className="pointer-events-none min-w-0 max-w-[calc(100%-2.75rem)]">
            <Badge
              intent="default"
              className="border-transparent bg-black/65 text-[9px] font-bold uppercase tracking-wide text-white shadow-md ring-1 ring-white/15 backdrop-blur-md sm:text-[10px]"
            >
              <span className="line-clamp-1">{fabric.fabricType ?? messages.fabrics.filters.types.other}</span>
            </Badge>
          </div>
        </div>

        <div
          className={cn(
            'absolute bottom-1.5 right-1.5 z-10 flex scale-90 flex-col items-end gap-1.5 sm:bottom-2 sm:right-2 sm:scale-100',
            'opacity-0 pointer-events-none transition-opacity duration-200',
            'group-hover/media:opacity-100 group-hover/media:pointer-events-auto',
            'focus-within:opacity-100 focus-within:pointer-events-auto'
          )}
        >
          {showWishlist ? (
            <FabricCardWishlistOverlay
              fabricId={fabric.id}
              wishlistSaved={wishlistSaved ?? false}
              corner="right"
              variant="inline"
              compact
            />
          ) : null}
          <FabricCompareButton fabricId={fabric.id} locale={locale} />
        </div>

        <div className="pointer-events-none absolute inset-x-0 bottom-0 z-[6] bg-gradient-to-t from-black/75 via-black/35 to-transparent px-1.5 pb-1 pt-5">
          <div className="flex items-center gap-0.5 text-[9px] font-bold text-white drop-shadow-md sm:text-[10px]">
            <Building2 className="h-3 w-3 shrink-0 opacity-95" aria-hidden />
            <span className="line-clamp-1">{fabric.fabricType ?? messages.fabrics.filters.types.other}</span>
          </div>
        </div>
      </div>

      <div className="flex min-w-0 flex-1 flex-col justify-between gap-3">
        <div>
          <p className="font-mono text-[11px] text-on-surface-variant">
            {messages.featured.skuPrefix}
            {skuDisplay}
          </p>
          <Link href={fabricHref} className="mt-1 block">
            <h2 className="font-heading text-base font-bold leading-snug text-on-surface line-clamp-2 transition-colors hover:text-primary hover:underline md:text-[17px]">
              {title}
            </h2>
          </Link>
          <div className="mt-2 flex flex-wrap gap-1.5">
            <span className="inline-flex items-center gap-1.5 rounded-full bg-surface-container-low px-2 py-0.5 text-[10px] font-bold text-on-surface-variant md:text-[11px]">
              <Droplets className="h-3.5 w-3.5 shrink-0" aria-hidden />
              {fabric.gsm ? `${fabric.gsm} ${messages.fabricCard.gsmUnit}` : messages.fabricCard.gsmMissing}
            </span>
            <span className="inline-flex items-center gap-1.5 rounded-full bg-surface-container-low px-2 py-0.5 text-[10px] font-bold text-on-surface-variant md:text-[11px]">
              <Ruler className="h-3.5 w-3.5 shrink-0" aria-hidden />
              {fabric.widthCm ? `${fabric.widthCm} cm` : messages.fabricCard.widthMissing}
            </span>
            <span className="inline-flex items-center gap-1.5 rounded-full bg-surface-container-low px-2 py-0.5 text-[10px] font-bold text-on-surface-variant md:text-[11px]">
              <Sparkles className="h-3.5 w-3.5 shrink-0" aria-hidden />
              {compositionSummary ?? messages.fabricCard.compositionMissing}
            </span>
          </div>
        </div>

        <div className="flex flex-wrap items-end justify-between gap-3 border-t border-outline/10 pt-3">
          <div className="min-w-0 space-y-0.5">
            <div className="text-[11px] text-on-surface-variant">
              <span className="font-bold uppercase tracking-wide text-outline/80">Color</span>{' '}
              <span className="font-semibold text-on-surface">{fabric.color ?? '—'}</span>
            </div>
            <div className="text-[11px] text-on-surface-variant">
              <span className="font-bold uppercase tracking-wide text-outline/80">Supply Type</span>{' '}
              <span className="font-semibold text-on-surface">{fabric.supplyType ?? '—'}</span>
            </div>
          </div>
          <Button
            type="button"
            size="icon"
            variant="secondary"
            className="h-9 w-9 shrink-0 rounded-full border border-outline/15 bg-surface-container-high text-primary hover:bg-primary hover:text-on-primary md:h-10 md:w-10"
            onClick={(e) => {
              e.preventDefault()
              e.stopPropagation()
              setSampleOpen(true)
            }}
            aria-label={messages.a11y.requestSample}
          >
            <Package className="h-4 w-4 md:h-5 md:w-5" aria-hidden />
          </Button>
        </div>
      </div>

      {sampleOpen ? (
        <SampleRequestModal
          fabric={{ id: fabric.id, title }}
          isOpen={sampleOpen}
          onClose={() => setSampleOpen(false)}
        />
      ) : null}
    </div>
  )
}
