'use client'

import Image from 'next/image'
import Link from 'next/link'
import * as React from 'react'
import { ExternalLink, Film, ImageIcon, Sparkles } from 'lucide-react'

import { invPanelFlat, invText } from '@/components/admin/inventory-suite/inventory-suite-styles'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Textarea } from '@/components/ui/textarea'
import type { Messages } from '@/lib/i18n/get-messages'
import { filterFabricGalleryImageUrls } from '@/lib/fabric-gallery-image-urls'
import { cn, isRemoteImageSrc } from '@/lib/utils'
import type { AdminFabricDetail } from '@/types/admin-fabric-management.types'

type P = Messages['admin']['productReviewQueuePage']

function formatComposition(raw: AdminFabricDetail['composition']): string {
  if (!raw || raw.length === 0) return '—'
  return raw.map((c) => `${c.percentage}% ${c.material}`).join(', ')
}

function statusIntent(st: AdminFabricDetail['status']): 'default' | 'warning' | 'brand' {
  if (st === 'ai_processing') return 'warning'
  if (st === 'ai_processed') return 'brand'
  return 'default'
}

function fabricStatusLabel(status: string, p: P): string {
  if (status === 'raw_scraped') return p.statusRawScraped
  if (status === 'ai_processing') return p.statusAiProcessing
  if (status === 'ai_processed') return p.statusAiProcessed
  if (status === 'approved') return p.statusApproved
  if (status === 'rejected') return p.statusRejected
  return status
}

export function ProductReviewDetailSkeleton() {
  return (
    <div className="mx-auto max-w-7xl space-y-6">
      <div className="h-10 w-2/3 max-w-md animate-pulse rounded-lg bg-surface-container-high" />
      <div className="grid grid-cols-1 gap-6 xl:grid-cols-[7fr_3fr]">
        <div className="min-w-0 space-y-4">
          <div className={cn(invPanelFlat(), 'h-48 animate-pulse bg-surface-container-high/50')} />
          <div className={cn(invPanelFlat(), 'h-40 animate-pulse bg-surface-container-high/50')} />
        </div>
        <div className={cn(invPanelFlat(), 'aspect-square max-h-[320px] min-w-0 animate-pulse bg-surface-container-high/50')} />
      </div>
    </div>
  )
}

export function ProductReviewQueueDetailPanel(props: {
  p: P
  fabric: AdminFabricDetail
  locale: string
  titleDisplay: string
  onApprove: () => void
  onRejectClick: () => void
  onFlagClick: () => void
  approvePending: boolean
  rejectPending: boolean
  flagPending: boolean
}) {
  const { p, fabric, locale, titleDisplay, onApprove, onRejectClick, onFlagClick, approvePending, rejectPending, flagPending } =
    props

  const fmt = (dateIso: string) =>
    new Intl.DateTimeFormat(locale === 'ru' ? 'ru-RU' : locale === 'zh' ? 'zh-CN' : 'en-US', {
      dateStyle: 'medium',
      timeStyle: 'short'
    }).format(new Date(dateIso))

  const priceLabel =
    fabric.price_usd != null && fabric.price_usd.trim() !== ''
      ? new Intl.NumberFormat(locale === 'ru' ? 'ru-RU' : locale === 'zh' ? 'zh-CN' : 'en-US', {
          style: 'currency',
          currency: 'USD'
        }).format(Number(fabric.price_usd))
      : '—'

  const canApprove = fabric.status === 'ai_processed'
  const images = filterFabricGalleryImageUrls(fabric.images ?? undefined)
  const primary = images[0] ?? null
  const sourceOk = Boolean(fabric.source_url?.startsWith('http'))

  return (
    <div className="mx-auto w-full max-w-7xl space-y-8 pb-10">
      <div className="flex flex-col gap-4 lg:flex-row lg:items-start lg:justify-between">
        <div className="min-w-0">
          <div className="flex flex-wrap items-center gap-2">
            <h1 className="font-heading text-2xl font-extrabold tracking-tight text-on-surface md:text-3xl">{p.reviewTitle}</h1>
            <Badge intent={statusIntent(fabric.status)} className="shrink-0">
              {fabricStatusLabel(fabric.status, p)}
            </Badge>
            {fabric.ai_confidence_score ? (
              <Badge intent="default" className="shrink-0 normal-case tracking-normal">
                {p.aiConfidence}: {fabric.ai_confidence_score}
              </Badge>
            ) : null}
          </div>
          <p className="mt-2 max-w-4xl text-sm text-on-surface-variant">
            {p.reviewHint
              .replace('{title}', titleDisplay)
              .replace('{sku}', (fabric.sku ?? fabric.slug).trim() || '—')}
          </p>
          <p className="mt-1 text-xs text-on-surface-variant">
            {fabric.supplier_name} · {p.updatedAt}: {fmt(fabric.updated_at)}
          </p>
        </div>
        <div className="flex shrink-0 flex-col items-end gap-2">
          <span className="inline-flex shrink-0 items-center gap-1.5 self-start rounded-full bg-tertiary-fixed px-3 py-1.5 text-xs font-bold text-on-tertiary-fixed">
            <Sparkles className="h-3.5 w-3.5" aria-hidden />
            {p.aiBadge}
          </span>
          {fabric.ai_processed_at ? (
            <span className="text-[10px] text-on-surface-variant">
              {p.aiProcessedAt}: {new Intl.DateTimeFormat('en-US', { dateStyle: 'medium', timeStyle: 'short' }).format(new Date(fabric.ai_processed_at))}
            </span>
          ) : null}
        </div>
      </div>

      <div className="grid grid-cols-1 gap-6 xl:grid-cols-[7fr_3fr]">
        <div className="min-w-0 space-y-4">
          <div className={cn(invPanelFlat(), 'space-y-3 p-4 shadow-sm md:p-6')}>
            <label className={cn('text-xs font-bold uppercase tracking-widest text-primary')}>{p.enrichedTitle}</label>
            <Input readOnly value={titleDisplay} className="border-0 bg-surface-container-highest font-heading font-semibold" />
            <label className={cn('text-xs font-bold uppercase tracking-widest text-primary')}>{p.description}</label>
            <Textarea
              readOnly
              rows={4}
              value={(fabric.description_en ?? fabric.description_ru ?? '').trim() || '—'}
              className="border-0 bg-surface-container-highest text-sm leading-relaxed"
            />
            {(fabric.usage_ru || fabric.usage_en) ? (
              <>
                <label className={cn('text-xs font-bold uppercase tracking-widest text-primary')}>{p.usage}</label>
                <Textarea
                  readOnly
                  rows={2}
                  value={(fabric.usage_en ?? fabric.usage_ru ?? '').trim() || '—'}
                  className="border-0 bg-surface-container-highest text-sm leading-relaxed"
                />
              </>
            ) : null}
            {(fabric.raw_title || fabric.raw_description) ? (
              <details className="mt-2 rounded-lg border border-outline/20 bg-surface-container-low/50">
                <summary className="cursor-pointer select-none px-3 py-2 text-[10px] font-bold uppercase tracking-widest text-on-surface-variant">
                  {p.rawTitle}
                </summary>
                <div className="space-y-2 border-t border-outline/10 p-3 text-xs text-on-surface-variant">
                  {fabric.raw_title ? (
                    <div>
                      <span className="font-semibold">{p.rawTitle}:</span> {fabric.raw_title}
                    </div>
                  ) : null}
                  {fabric.raw_description ? (
                    <div>
                      <span className="font-semibold">{p.rawDescription}:</span> {fabric.raw_description}
                    </div>
                  ) : null}
                </div>
              </details>
            ) : null}
          </div>

          <div className={cn(invPanelFlat(), 'p-4 shadow-sm md:p-6')}>
            <h3 className="mb-4 text-xs font-bold uppercase tracking-widest text-primary">{p.techSpecs}</h3>
            <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 xl:grid-cols-3">
              <div className="space-y-1">
                <label className="text-[10px] font-bold uppercase text-on-surface-variant">{p.fabricType}</label>
                <Input readOnly className="bg-surface-container-highest font-mono text-sm" value={fabric.fabric_type ?? '—'} />
              </div>
              <div className="space-y-1">
                <label className="text-[10px] font-bold uppercase text-on-surface-variant">{p.material}</label>
                <Input readOnly className="bg-surface-container-highest font-mono text-sm" value={formatComposition(fabric.composition)} />
              </div>
              <div className="space-y-1">
                <label className="text-[10px] font-bold uppercase text-on-surface-variant">{p.weightGsm}</label>
                <Input readOnly className="bg-surface-container-highest font-mono text-sm" value={fabric.gsm != null ? String(fabric.gsm) : '—'} />
              </div>
              <div className="space-y-1">
                <label className="text-[10px] font-bold uppercase text-on-surface-variant">{p.widthCm}</label>
                <Input readOnly className="bg-surface-container-highest font-mono text-sm" value={fabric.width_cm != null ? String(fabric.width_cm) : '—'} />
              </div>
              <div className="space-y-1">
                <label className="text-[10px] font-bold uppercase text-on-surface-variant">{p.moq}</label>
                <Input readOnly className="bg-surface-container-highest font-mono text-sm" value={fabric.moq != null ? String(fabric.moq) : '—'} />
              </div>
              <div className="space-y-1">
                <label className="text-[10px] font-bold uppercase text-on-surface-variant">{p.priceUsd}</label>
                <Input readOnly className="bg-surface-container-highest font-mono text-sm" value={priceLabel} />
              </div>
              <div className="space-y-1">
                <label className="text-[10px] font-bold uppercase text-on-surface-variant">Color</label>
                <Input readOnly className="bg-surface-container-highest font-mono text-sm" value={fabric.color_en ?? fabric.color ?? '—'} />
              </div>
              <div className="space-y-1">
                <label className="text-[10px] font-bold uppercase text-on-surface-variant">Supply</label>
                <Input readOnly className="bg-surface-container-highest font-mono text-sm" value={fabric.supply_type_en ?? fabric.supply_type ?? '—'} />
              </div>
              <div className="space-y-1">
                <label className="text-[10px] font-bold uppercase text-on-surface-variant">Shipment</label>
                <Input readOnly className="bg-surface-container-highest font-mono text-sm" value={fabric.shipment_time_en ?? fabric.shipment_time ?? '—'} />
              </div>
            </div>
            <div className="mt-4 space-y-1">
              <label className="text-[10px] font-bold uppercase text-on-surface-variant">{p.tags}</label>
              <div className="flex min-h-10 flex-wrap gap-1.5 rounded-lg bg-surface-container-highest p-2">
                {fabric.tags && fabric.tags.length > 0 ? (
                  fabric.tags.map((t) => (
                    <Badge key={t} intent="default" className="normal-case tracking-normal">
                      {t}
                    </Badge>
                  ))
                ) : (
                  <span className="text-sm text-on-surface-variant">—</span>
                )}
              </div>
            </div>
            {fabric.tags_en && fabric.tags_en.length > 0 ? (
              <div className="mt-3 space-y-1">
                <label className="text-[10px] font-bold uppercase text-on-surface-variant">{p.tagsEn}</label>
                <div className="flex min-h-10 flex-wrap gap-1.5 rounded-lg bg-surface-container-highest p-2">
                  {fabric.tags_en.map((t) => (
                    <Badge key={t} intent="default" className="normal-case tracking-normal">
                      {t}
                    </Badge>
                  ))}
                </div>
              </div>
            ) : null}
          </div>
        </div>

        <div className="min-w-0 space-y-4">
          <div className={cn(invPanelFlat(), 'p-4 shadow-sm md:p-5')}>
            <label className="mb-3 block text-xs font-bold uppercase tracking-widest text-primary">{p.primaryImage}</label>
            <div className="relative aspect-square w-full overflow-hidden rounded-xl bg-surface-container-high">
              {primary ? (
                <Image
                  src={primary}
                  alt=""
                  fill
                  className="object-cover"
                  sizes="(max-width: 1280px) 100vw, 360px"
                  priority
                  unoptimized={isRemoteImageSrc(primary)}
                />
              ) : null}
            </div>
            {images.length > 1 ? (
              <div className="mt-3 grid grid-cols-4 gap-2">
                {images.slice(1, 5).map((src) => (
                  <div key={src} className="relative aspect-square overflow-hidden rounded-lg bg-surface-container-high">
                    <Image src={src} alt="" fill className="object-cover" sizes="80px" unoptimized={isRemoteImageSrc(src)} />
                  </div>
                ))}
              </div>
            ) : null}
            <Button asChild variant="secondary" className="mt-4 w-full rounded-xl text-xs font-semibold">
              <Link href={`/admin/fabrics/${fabric.id}`}>{p.replaceImage}</Link>
            </Button>
            <Button asChild variant="outline" className="mt-2 w-full rounded-xl text-xs font-semibold">
              <Link href={`/admin/media-library?fabricId=${fabric.id}`} className="inline-flex items-center justify-center gap-2">
                <ImageIcon className="h-3.5 w-3.5" aria-hidden />
                AI Media
              </Link>
            </Button>
            {sourceOk ? (
              <Button asChild variant="outline" className="mt-2 w-full rounded-xl text-xs font-semibold">
                <a href={fabric.source_url!} target="_blank" rel="noopener noreferrer" className="inline-flex items-center justify-center gap-2">
                  <ExternalLink className="h-3.5 w-3.5" aria-hidden />
                  {p.openSource}
                </a>
              </Button>
            ) : null}
          </div>

          <div className="space-y-3 rounded-2xl bg-surface-container-high/80 p-4 ring-1 ring-outline/10">
            <Button
              type="button"
              className="h-12 w-full rounded-xl font-bold shadow-md"
              onClick={onApprove}
              disabled={approvePending || !canApprove}
              title={!canApprove ? p.approveBlockedHint : undefined}
            >
              {p.approve}
            </Button>
            {!canApprove ? <p className="text-center text-[11px] text-on-surface-variant">{p.approveBlockedHint}</p> : null}
            <Button type="button" variant="destructive" className="h-12 w-full rounded-xl font-bold" onClick={onRejectClick} disabled={rejectPending}>
              {p.reject}
            </Button>
            <Button type="button" variant="secondary" className="h-11 w-full rounded-xl text-sm font-semibold" onClick={onFlagClick} disabled={flagPending}>
              {p.flag}
            </Button>
          </div>

          <div className="rounded-2xl border border-dashed border-outline/25 bg-surface-container-lowest/50 p-4">
            <p className="text-center text-[11px] font-medium leading-relaxed text-on-surface-variant">{p.operatorNote}</p>
          </div>
          <Button asChild variant="outline" className="h-11 w-full rounded-xl font-semibold">
            <Link href={`/admin/fabrics/${fabric.id}`}>{p.openFullEdit}</Link>
          </Button>
        </div>
      </div>
    </div>
  )
}
