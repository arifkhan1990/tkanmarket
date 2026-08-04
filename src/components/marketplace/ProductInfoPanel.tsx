'use client'

import Image from 'next/image'
import Link from 'next/link'
import { BadgeCheck, Copy, ExternalLink, Palette } from 'lucide-react'
import { useState } from 'react'
import { usePathname } from 'next/navigation'
import { toast } from 'sonner'

import type { FabricDetail } from '@/types/marketplace.types'
import { Button } from '@/components/ui/button'
import { SampleRequestModal } from '@/components/forms/SampleRequestModal'
import { BulkInquiryModal } from '@/components/forms/BulkInquiryModal'
import { FabricCompareButton } from '@/components/marketplace/FabricCompareButton'
import { FabricDetailWishlistButton } from '@/components/marketplace/fabrics/FabricDetailWishlistButton'
import { useI18n } from '@/hooks/useI18n'
import { DEFAULT_LOCALE } from '@/types/i18n.types'
import { getLocaleFromPathname, withLocaleUrl } from '@/lib/i18n/locale-path'
import { getLocalizedFabricTitle, getLocalizedFabricTags } from '@/lib/i18n/localized-fabric'
import { isRemoteImageSrc } from '@/lib/utils'

function typeLabel(v: FabricDetail['fabricType'], labels: Record<string, string>, fallbackOther: string) {
  if (!v) return fallbackOther
  return labels[String(v)] ?? fallbackOther
}

export function ProductInfoPanel({ fabric }: { fabric: FabricDetail }) {
  const pathname = usePathname()
  const { messages, locale: hookLocale } = useI18n()
  const locale = getLocaleFromPathname(pathname) ?? hookLocale ?? DEFAULT_LOCALE
  const wv = messages.product.webV

  const [sampleOpen, setSampleOpen] = useState(false)
  const [bulkOpen, setBulkOpen] = useState(false)

  const title = getLocalizedFabricTitle(fabric, locale)
  const summary =
    locale === 'en'
      ? (fabric.descriptionEn?.trim() ? fabric.descriptionEn : fabric.descriptionRu)
      : fabric.descriptionRu
  const localizedTags = getLocalizedFabricTags(fabric, locale)

  const fabricUrl = withLocaleUrl(`/fabrics/${encodeURIComponent(fabric.slug)}`, locale)
  const sampleHref = withLocaleUrl(`/sample-request?fabric=${encodeURIComponent(fabric.slug)}`, locale)

  const typeStr = typeLabel(
    fabric.fabricType,
    messages.fabrics.filters.types as unknown as Record<string, string>,
    messages.fabrics.filters.types.other
  )

  return (
    <div className="flex w-full min-w-0 flex-col gap-6 max-lg:gap-8">
      <header className="w-full min-w-0 space-y-3">
        <div className="flex items-center justify-between gap-3 lg:hidden">
          {fabric.sku ? (
            <span className="min-w-0 truncate font-mono text-xs text-outline">
              {messages.product.specs.sku}: {fabric.sku}
            </span>
          ) : (
            <span className="text-xs text-outline">—</span>
          )}
          {fabric.supplier.verified ? (
            <span className="inline-flex shrink-0 items-center gap-1 rounded-full bg-emerald-500/15 px-2.5 py-1 text-[10px] font-bold uppercase tracking-wider text-emerald-800 dark:text-emerald-200">
              <BadgeCheck className="h-3.5 w-3.5 shrink-0" aria-hidden />
              {messages.suppliers.badgeVerified}
            </span>
          ) : null}
        </div>
        <div className="flex w-full min-w-0 flex-wrap items-center gap-x-3 gap-y-2">
          <div className="flex min-w-0 flex-1 flex-wrap items-center gap-x-3 gap-y-2">
            <span className="shrink-0 rounded-full bg-secondary-container px-2 py-1 text-[10px] font-bold uppercase tracking-widest text-on-secondary-container">
              {fabric.isFeatured ? wv.featuredBadge : wv.premiumGrade}
            </span>
            {fabric.sku ? (
              <span className="hidden min-w-0 truncate font-mono text-xs text-outline lg:inline">
                {messages.product.specs.sku}: {fabric.sku}
              </span>
            ) : null}
          </div>
          <div className="flex shrink-0 items-center gap-1 sm:ml-auto">
            <Button
              type="button"
              variant="secondary"
              size="icon"
              className="h-9 w-9 rounded-lg"
              onClick={async () => {
                try {
                  await navigator.clipboard.writeText(window.location.href)
                  toast.success(messages.common.copied)
                } catch {
                  toast.error(messages.common.somethingWentWrong)
                }
              }}
              aria-label={messages.common.copyLink}
            >
              <Copy className="h-4 w-4" aria-hidden />
            </Button>
            <Button type="button" variant="secondary" size="icon" className="h-9 w-9 rounded-lg" asChild>
              <Link href={fabricUrl} target="_blank" rel="noreferrer" aria-label={messages.common.openInNewTab}>
                <ExternalLink className="h-4 w-4" aria-hidden />
              </Link>
            </Button>
            <FabricCompareButton fabricId={fabric.id} locale={locale} />
            <FabricDetailWishlistButton fabricId={fabric.id} />
          </div>
        </div>
        <h1 className="font-heading text-3xl font-extrabold tracking-tighter text-primary lg:text-4xl">{title}</h1>
        <p className="text-sm font-normal leading-relaxed text-on-surface-variant line-clamp-4">
          {summary?.trim() ? summary : messages.product.descriptionMissing}
        </p>
        <p className="text-xs font-bold uppercase tracking-widest text-secondary">{typeStr}</p>
      </header>

      <div className="rounded-xl border border-outline-variant/10 bg-surface-container-lowest p-6 shadow-sm max-lg:shadow-lg">
        <div className="mb-6 flex items-baseline justify-between gap-4">
          <div>
            <span className="font-heading text-4xl font-bold text-primary">
              {fabric.priceUsd ? `$${fabric.priceUsd}` : '—'}
            </span>
            <span className="ml-1 font-medium text-outline">{messages.product.specs.perMeterSuffix}</span>
          </div>
          <div className="text-right">
            <span className="mb-1 block text-xs uppercase tracking-widest text-outline">{messages.product.specs.moq}</span>
            <span className="font-bold text-on-surface">{fabric.moq != null ? `${fabric.moq}m` : '—'}</span>
          </div>
        </div>
        <div className="grid grid-cols-2 gap-4">
          <div className="rounded-lg bg-surface-container-low p-4">
            <span className="mb-1 block text-[10px] uppercase tracking-widest text-outline">{messages.product.specs.gsm}</span>
            <span className="font-heading text-lg font-bold text-primary">
              {fabric.gsm != null ? `${fabric.gsm} GSM` : '—'}
            </span>
          </div>
          <div className="rounded-lg bg-surface-container-low p-4">
            <span className="mb-1 block text-[10px] uppercase tracking-widest text-outline">{messages.product.specs.width}</span>
            <span className="font-heading text-lg font-bold text-primary">
              {fabric.widthCm != null ? `${fabric.widthCm} CM` : '—'}
            </span>
          </div>
          <div className="rounded-lg bg-surface-container-low p-4">
            <span className="mb-1 block text-[10px] uppercase tracking-widest text-outline">{messages.product.specs.composition}</span>
            <span className="font-heading text-lg font-bold text-primary leading-tight">
              {fabric.composition && fabric.composition.length > 0
                ? fabric.composition.map((c) => `${c.material} ${c.percentage}%`).join(', ')
                : '—'}
            </span>
          </div>
          <div className="rounded-lg bg-surface-container-low p-4">
            <span className="mb-1 block text-[10px] uppercase tracking-widest text-outline">{messages.product.specs.type}</span>
            <span className="font-heading text-lg font-bold text-primary">{typeStr}</span>
          </div>
          <div className="rounded-lg bg-surface-container-low p-4">
            <span className="mb-1 block text-[10px] uppercase tracking-widest text-outline">Color</span>
            <span className="font-heading text-lg font-bold text-primary">{fabric.color ?? '—'}</span>
          </div>
          <div className="rounded-lg bg-surface-container-low p-4">
            <span className="mb-1 block text-[10px] uppercase tracking-widest text-outline">Supply Type</span>
            <span className="font-heading text-lg font-bold text-primary">{fabric.supplyType ?? '—'}</span>
          </div>
        </div>
      </div>

      <div className="flex flex-col gap-3">
        <Button
          type="button"
          className="w-full rounded-lg bg-gradient-to-br from-primary to-primary-container py-4 text-lg font-bold text-on-primary shadow-lg transition-all hover:-translate-y-0.5 hover:shadow-xl"
          onClick={() => setSampleOpen(true)}
        >
          {messages.trust.cta}
        </Button>
        <Button
          type="button"
          variant="outline"
          className="w-full rounded-lg border-2 border-primary py-4 text-lg font-bold text-primary hover:bg-primary/5"
          asChild
        >
          <Link href={sampleHref} className="inline-flex items-center justify-center gap-2">
            <Palette className="h-5 w-5" aria-hidden />
            {wv.requestSwatchKit}
          </Link>
        </Button>
        <Button
          type="button"
          variant="outline"
          className="w-full rounded-lg border border-outline-variant/50 bg-surface-container-low py-4 text-lg font-bold text-primary hover:bg-surface-container-high"
          onClick={() => setBulkOpen(true)}
        >
          {messages.leads.bulk.title}
        </Button>
        <Link
          href={sampleHref}
          className="block text-center text-sm font-bold text-primary underline-offset-4 hover:underline"
        >
          {messages.leads.sampleDedicated.fullFormLink}
        </Link>
      </div>

      {fabric.tags && fabric.tags.length > 0 ? (
        <div className="space-y-4 max-lg:-mx-6 max-lg:bg-surface-container-low max-lg:px-6 max-lg:py-6 lg:mx-0 lg:bg-transparent lg:p-0">
          <h3 className="font-heading text-sm font-bold uppercase tracking-widest text-primary">
            {wv.commonApplications}
          </h3>
          <div className="flex flex-wrap gap-2">
            {localizedTags.slice(0, 12).map((t, i) => (
              <Link
                key={`${t}-${i}`}
                href={withLocaleUrl(`/fabrics?material=${encodeURIComponent(fabric.tags[i] ?? t)}`, locale)}
                className="rounded-full border border-outline-variant/30 bg-surface-container-lowest px-4 py-2 text-xs font-semibold text-secondary transition-colors hover:bg-surface-container-low lg:bg-surface-container-lowest"
              >
                {t}
              </Link>
            ))}
          </div>
        </div>
      ) : null}

      <div className="flex items-center gap-4 rounded-lg border border-outline-variant/20 bg-surface-container-lowest p-5">
        <div className="relative flex h-12 w-12 shrink-0 items-center justify-center overflow-hidden rounded-full bg-surface-container-high">
          {fabric.supplier.logoUrl ? (
            <Image
              src={fabric.supplier.logoUrl}
              alt={fabric.supplier.name}
              fill
              sizes="48px"
              className="object-cover"
              unoptimized={isRemoteImageSrc(fabric.supplier.logoUrl)}
            />
          ) : (
            <span className="text-xs font-bold text-primary">{fabric.supplier.name.slice(0, 1)}</span>
          )}
        </div>
        <div className="min-w-0 flex-1">
          <div className="flex items-center gap-2">
            <span className="truncate text-sm font-bold">{fabric.supplier.name}</span>
            {fabric.supplier.verified ? <BadgeCheck className="h-4 w-4 shrink-0 text-primary" aria-hidden /> : null}
          </div>
          <div className="mt-0.5 text-xs text-on-surface-variant">
            {fabric.supplier.country}
            {fabric.supplier.city ? `, ${fabric.supplier.city}` : ''}
          </div>
          <Link href={withLocaleUrl(`/suppliers/${fabric.supplier.slug}`, locale)} className="mt-1 inline-block text-xs font-semibold text-primary hover:underline">
            {messages.product.goToSupplier}
          </Link>
        </div>
        {fabric.sourceUrl ? (
          <Button type="button" variant="ghost" size="icon" className="shrink-0 rounded-full" asChild>
            <a href={fabric.sourceUrl} target="_blank" rel="noreferrer" aria-label={messages.product.specs.openSource}>
              <ExternalLink className="h-5 w-5" aria-hidden />
            </a>
          </Button>
        ) : null}
      </div>

      <SampleRequestModal fabric={{ id: fabric.id, title }} isOpen={sampleOpen} onClose={() => setSampleOpen(false)} />
      <BulkInquiryModal fabric={{ id: fabric.id, title }} isOpen={bulkOpen} onClose={() => setBulkOpen(false)} />
    </div>
  )
}
