'use client'

import Image from 'next/image'
import Link from 'next/link'
import { Building2, Droplets, Package, Ruler, Sparkles, Video } from 'lucide-react'
import { useEffect, useState } from 'react'
import { usePathname, useRouter } from 'next/navigation'

import type { FabricSummary } from '@/types/marketplace.types'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { FabricCardWishlistOverlay } from '@/components/marketplace/FabricCardWishlistOverlay'
import { FabricCompareButton } from '@/components/marketplace/FabricCompareButton'
import { SampleRequestModal } from '@/components/forms/SampleRequestModal'
import { FABRIC_IMAGE_PLACEHOLDER_PATH } from '@/constants/marketplace-images'
import { cn, isRemoteImageSrc } from '@/lib/utils'
import { FABRIC_MATERIALS } from '@/constants'
import { useI18n } from '@/hooks/useI18n'
import { DEFAULT_LOCALE } from '@/types/i18n.types'
import { getLocaleFromPathname, withLocaleUrl } from '@/lib/i18n/locale-path'
import { getLocalizedFabricTitle, getLocalizedFabricTags } from '@/lib/i18n/localized-fabric'

export function FabricCard({
  fabric,
  showWishlist = false,
  wishlistSaved = false,
  priority = false
}: {
  fabric: FabricSummary
  /** When true, shows heart control (catalog / home with batch wishlist state). */
  showWishlist?: boolean
  wishlistSaved?: boolean
  /** When true, render the cover image with high priority for LCP. */
  priority?: boolean
}) {
  const pathname = usePathname()
  const router = useRouter()
  const { locale: hookLocale, messages } = useI18n()
  const locale = getLocaleFromPathname(pathname) ?? hookLocale ?? DEFAULT_LOCALE
  const [sampleOpen, setSampleOpen] = useState(false)

  const title = getLocalizedFabricTitle(fabric, locale)
  const localizedTags = getLocalizedFabricTags(fabric, locale)
  const rawImage = fabric.imageUrl?.trim()
  const imageSrc = rawImage && rawImage.length > 0 ? rawImage : FABRIC_IMAGE_PLACEHOLDER_PATH
  const compositionSummary =
    (localizedTags).filter((t) => (FABRIC_MATERIALS as readonly string[]).includes(t)).slice(0, 2).join(' / ') ||
    (localizedTags[0] ?? null)

  const fabricHref = withLocaleUrl(`/fabrics/${fabric.slug}`, locale)
  const skuDisplay = fabric.sku?.trim() ? fabric.sku : '—'

  useEffect(() => {
    router.prefetch(fabricHref)
  }, [router, fabricHref])

  return (
    <article
      className={cn(
        'relative overflow-hidden rounded-3xl bg-surface-container-lowest',
        'border border-transparent shadow-sm transition-all',
        'hover:border-primary/25 hover:shadow-xl'
      )}
    >
{/* `group` scoped to media so heart/compare only appear when hovering the image (not the text block). */}
        <div className="group relative z-[2]">
          <Link
            href={fabricHref}
            className="relative block aspect-[4/3] bg-surface-container-highest outline-offset-2 focus-visible:outline focus-visible:ring-2 focus-visible:ring-primary"
            aria-label={`${title}. ${messages.fabricCard.details}`}
          >
            {fabric.hasVideo && fabric.thumbnailUrl ? (
              <>
                <video
                  src={fabric.thumbnailUrl}
                  poster={fabric.thumbnailUrl}
                  className="h-full w-full object-cover transition-transform duration-300 group-hover:scale-[1.02]"
                  muted
                  playsInline
                  preload="none"
                  aria-hidden
                />
                <span className="absolute inset-0 flex items-center justify-center bg-black/30">
                  <div className="flex h-12 w-12 items-center justify-center rounded-full bg-white/90 shadow-lg">
                    <Video className="h-5 w-5 text-primary" aria-hidden />
                  </div>
                </span>
              </>
            ) : (
              <Image
                src={imageSrc}
                alt=""
                fill
                sizes="(max-width: 640px) 100vw, (max-width: 1280px) 50vw, 25vw"
                className="object-cover transition-transform duration-300 group-hover:scale-[1.02]"
                unoptimized={isRemoteImageSrc(imageSrc)}
                priority={priority}
                fetchPriority={priority ? 'high' : 'auto'}
                loading={priority ? 'eager' : 'lazy'}
                aria-hidden
              />
            )}
          </Link>

        {/* Top: fabric type (always visible) */}
        <div className="pointer-events-none absolute inset-x-0 top-0 z-[8] flex items-start justify-between gap-2 p-3">
          <div className="pointer-events-none min-w-0 max-w-[calc(100%-5rem)]">
            <Badge
              intent="default"
              className="border-transparent bg-black/65 text-[10px] font-bold uppercase tracking-wide text-white shadow-md ring-1 ring-white/15 backdrop-blur-md"
            >
              <span className="line-clamp-1">
                {fabric.fabricType ?? messages.fabrics.filters.types.other}
              </span>
            </Badge>
          </div>
        </div>

        {/* Wishlist + compare: bottom-right, only on media hover (or when focused for keyboard) */}
        <div
          className={cn(
            'absolute bottom-3 right-3 z-10 flex flex-col items-end gap-2',
            'opacity-0 pointer-events-none transition-opacity duration-200',
            'group-hover:opacity-100 group-hover:pointer-events-auto',
            'focus-within:opacity-100 focus-within:pointer-events-auto'
          )}
        >
          {showWishlist ? (
            <FabricCardWishlistOverlay fabricId={fabric.id} wishlistSaved={wishlistSaved} corner="right" variant="inline" />
          ) : null}
          <FabricCompareButton fabricId={fabric.id} locale={locale} />
        </div>

        <div className="pointer-events-none absolute inset-x-0 bottom-0 z-[6] bg-gradient-to-t from-black/75 via-black/40 to-transparent px-3 pb-2 pt-8">
          <div className="flex items-center gap-1.5 text-[11px] font-bold text-white drop-shadow-md">
            <Building2 className="h-3.5 w-3.5 shrink-0 opacity-95" aria-hidden />
            <span className="line-clamp-1">{fabric.fabricType ?? messages.fabrics.filters.types.other}</span>
          </div>
        </div>
      </div>

      <div className="space-y-2 p-4">
        <p className="font-mono text-xs text-on-surface-variant">
          {messages.featured.skuPrefix}
          {skuDisplay}
        </p>
        <Link
          href={fabricHref}
          className="block font-heading text-base font-bold leading-snug text-on-surface line-clamp-2 transition-colors hover:text-primary hover:underline md:text-[17px]"
        >
          {title}
        </Link>

        <div className="flex flex-wrap gap-1.5">
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

        <div className="flex items-center justify-between gap-2 border-t border-outline/10 pt-2">
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
            title={messages.a11y.requestSample}
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
    </article>
  )
}

export function FabricCardSkeleton() {
  return (
    <div className="overflow-hidden rounded-3xl border border-outline/10 bg-surface-container-lowest shadow-sm">
      <div className="relative aspect-[4/3] animate-pulse bg-surface-container-highest/40">
        <div className="absolute inset-x-0 bottom-0 h-10 bg-gradient-to-t from-black/20 to-transparent" aria-hidden />
      </div>
      <div className="space-y-2 p-4">
        <div className="h-3 w-28 animate-pulse rounded-md bg-surface-container-low/50" />
        <div className="h-4 w-full animate-pulse rounded-md bg-surface-container-low/50" />
        <div className="flex flex-wrap gap-1.5">
          <div className="h-6 w-16 animate-pulse rounded-full bg-surface-container-low/50" />
          <div className="h-6 w-16 animate-pulse rounded-full bg-surface-container-low/50" />
          <div className="h-6 w-20 animate-pulse rounded-full bg-surface-container-low/50" />
        </div>
        <div className="flex items-center justify-between gap-2 border-t border-outline/10 pt-2">
          <div className="space-y-1.5">
            <div className="h-6 w-24 animate-pulse rounded-md bg-surface-container-low/50" />
            <div className="h-3 w-16 animate-pulse rounded-md bg-surface-container-low/50" />
          </div>
          <div className="h-9 w-9 shrink-0 animate-pulse rounded-full bg-surface-container-low/50" />
        </div>
      </div>
    </div>
  )
}
