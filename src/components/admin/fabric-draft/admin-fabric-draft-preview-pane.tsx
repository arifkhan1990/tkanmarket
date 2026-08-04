'use client'

import * as React from 'react'
import Image from 'next/image'
import { Film, ImageIcon, Sparkles } from 'lucide-react'

import { Badge } from '@/components/ui/badge'
import { cn, isRemoteImageSrc } from '@/lib/utils'
import { interpolate } from '@/lib/i18n/interpolate'
import type { AdminFabricDetail } from '@/types/admin-fabric-management.types'
import type { GeneratedMediaItem } from '@/types/admin-fabric-draft-preview.types'

export interface DraftPreviewPaneCopy {
  galleryAria: string
  thumbnailAria: string
  noImage: string
  noTags: string
  noDescription: string
  pricing: string
  perUnit: string
  techSpecs: string
  weight: string
  width: string
  fabricType: string
  moq: string
  composition: string
  noComposition: string
  usage: string
  tagsEn: string
  color: string
  supplyType: string
  shipmentTime: string
  seoSection: string
  metaTitle: string
  metaDescription: string
  rawData: string
  rawTitle: string
  rawDescription: string
  generatedMedia: string
  generatedImages: string
  generatedVideos: string
  noGeneratedImages: string
  noGeneratedVideos: string
  noVideo: string
}

function GeneratedMediaTab({ images, videos, p }: { images: GeneratedMediaItem[]; videos: GeneratedMediaItem[]; p: DraftPreviewPaneCopy }) {
  const [tab, setTab] = React.useState<'images' | 'videos'>('images')

  return (
    <div className="space-y-3">
      <div className="flex items-center gap-2">
        <Sparkles className="h-4 w-4 text-violet-500" aria-hidden />
        <span className="text-xs font-bold uppercase tracking-widest text-on-surface-variant">{p.generatedMedia}</span>
      </div>
      <div className="flex gap-1 rounded-lg bg-surface-container-high p-1">
        <button
          type="button"
          onClick={() => setTab('images')}
          className={cn(
            'flex items-center gap-1.5 rounded-md px-3 py-1.5 text-xs font-bold transition-colors',
            tab === 'images' ? 'bg-surface-container-lowest text-primary shadow-sm' : 'text-on-surface-variant hover:text-on-surface'
          )}
        >
          <ImageIcon className="h-3.5 w-3.5" aria-hidden />
          {p.generatedImages} ({images.length})
        </button>
        <button
          type="button"
          onClick={() => setTab('videos')}
          className={cn(
            'flex items-center gap-1.5 rounded-md px-3 py-1.5 text-xs font-bold transition-colors',
            tab === 'videos' ? 'bg-surface-container-lowest text-primary shadow-sm' : 'text-on-surface-variant hover:text-on-surface'
          )}
        >
          <Film className="h-3.5 w-3.5" aria-hidden />
          {p.generatedVideos} ({videos.length})
        </button>
      </div>
      {tab === 'images' ? (
        images.length > 0 ? (
          <div className="grid grid-cols-3 gap-2">
            {images.map((img) => (
              <a key={img.id} href={img.url ?? '#'} target="_blank" rel="noopener noreferrer" className="relative aspect-square overflow-hidden rounded-lg bg-surface-container-high">
                {img.url ? (
                  <Image src={img.url} alt="" fill className="object-cover" sizes="120px" unoptimized />
                ) : (
                  <div className="flex h-full items-center justify-center text-[10px] text-on-surface-variant">{p.noImage}</div>
                )}
              </a>
            ))}
          </div>
        ) : (
          <p className="text-xs text-on-surface-variant italic">{p.noGeneratedImages}</p>
        )
      ) : videos.length > 0 ? (
        <div className="space-y-2">
          {videos.map((vid) => (
            <div key={vid.id} className="rounded-lg border border-outline/15 bg-surface-container-low p-2">
              <video
                src={vid.url ?? undefined}
                controls
                className="w-full rounded-lg"
                poster={vid.thumbnailUrl ?? undefined}
              >
                {p.noVideo}
              </video>
              {vid.durationSeconds ? (
                <p className="mt-1 text-[10px] text-on-surface-variant">{vid.durationSeconds}s</p>
              ) : null}
            </div>
          ))}
        </div>
      ) : (
        <p className="text-xs text-on-surface-variant italic">{p.noGeneratedVideos}</p>
      )}
    </div>
  )
}

export function AdminFabricDraftPreviewPane(props: {
  viewport: 'desktop' | 'mobile'
  p: DraftPreviewPaneCopy
  fabric: AdminFabricDetail
  displayTitle: string
  activeImageIdx: number
  setActiveImageIdx: (idx: number) => void
  generatedImages: GeneratedMediaItem[]
  generatedVideos: GeneratedMediaItem[]
}) {
  const { viewport, p, fabric, displayTitle, activeImageIdx, setActiveImageIdx, generatedImages, generatedVideos } = props

  const allImages = fabric.images ?? []
  const activeImage = allImages[Math.min(activeImageIdx, allImages.length - 1)] ?? null

  return (
    <div className="min-h-0 flex-1 overflow-y-auto bg-surface-container-lowest">
      <div
        className={cn(
          'mx-auto w-full p-6 transition-[max-width] md:p-10',
          viewport === 'mobile' ? 'max-w-[420px]' : 'max-w-4xl'
        )}
      >
        <div className="grid grid-cols-1 gap-10 md:grid-cols-12 md:gap-12">
          {/* Gallery */}
          <div className="space-y-4 md:col-span-7" aria-label={p.galleryAria}>
            {activeImage ? (
              <div className="relative aspect-[4/5] overflow-hidden rounded-[1.25rem] bg-surface-container-high">
                <Image
                  src={activeImage}
                  alt={displayTitle}
                  fill
                  className="object-cover transition-transform duration-500 hover:scale-[1.02]"
                  sizes="(max-width: 768px) 100vw, 55vw"
                  priority
                  unoptimized={isRemoteImageSrc(activeImage)}
                />
              </div>
            ) : (
              <div className="flex aspect-[4/5] items-center justify-center rounded-[1.25rem] bg-surface-container-high text-sm text-on-surface-variant">
                {p.noImage}
              </div>
            )}

            {allImages.length > 1 ? (
              <div className="grid grid-cols-4 gap-3 sm:grid-cols-5">
                {allImages.map((url, idx) => (
                  <button
                    key={`${url}-${idx}`}
                    type="button"
                    onClick={() => setActiveImageIdx(idx)}
                    className={cn(
                      'relative aspect-square overflow-hidden rounded-xl bg-surface-container-high transition-all',
                      idx === activeImageIdx
                        ? 'ring-2 ring-primary ring-offset-2 ring-offset-surface-container-lowest'
                        : 'opacity-70 hover:opacity-100'
                    )}
                    aria-label={interpolate(p.thumbnailAria, { n: String(idx + 1) })}
                    aria-pressed={idx === activeImageIdx}
                  >
                    <Image
                      src={url}
                      alt=""
                      fill
                      className="object-cover"
                      sizes="120px"
                      unoptimized={isRemoteImageSrc(url)}
                    />
                  </button>
                ))}
              </div>
            ) : null}

            {/* AI-generated media section */}
            {(generatedImages.length > 0 || generatedVideos.length > 0) ? (
              <GeneratedMediaTab images={generatedImages} videos={generatedVideos} p={p} />
            ) : null}
          </div>

          {/* Spec column */}
          <div className="space-y-6 md:col-span-5">
            <div className="space-y-3">
              <div className="flex flex-wrap gap-2">
                {(fabric.tags ?? []).slice(0, 6).map((tag) => (
                  <Badge key={tag} intent="brand" className="normal-case tracking-normal">
                    {tag}
                  </Badge>
                ))}
                {(fabric.tags ?? []).length === 0 ? (
                  <span className="text-[10px] uppercase tracking-widest text-outline">{p.noTags}</span>
                ) : null}
                {(fabric.tags_en ?? []).slice(0, 4).map((tag) => (
                  <Badge key={tag} intent="default" className="normal-case tracking-normal">
                    {tag}
                  </Badge>
                ))}
              </div>

              <h2 className="font-heading text-3xl font-extrabold leading-tight text-on-surface md:text-4xl">
                {displayTitle}
              </h2>
              <p className="text-sm leading-relaxed text-on-surface-variant">
                {fabric.description_en?.trim() || fabric.description_ru?.trim() || p.noDescription}
              </p>

              {/* Usage section */}
              {(fabric.usage_ru || fabric.usage_en) ? (
                <p className="text-sm text-on-surface-variant">
                  <span className="font-semibold">{p.usage}:</span>{' '}
                  {fabric.usage_en ?? fabric.usage_ru}
                </p>
              ) : null}
            </div>

            {/* Pricing */}
            <div className="rounded-2xl border-l-4 border-brand-500 bg-surface-container-low p-5">
              <span className="text-xs font-medium text-on-surface-variant">{p.pricing}</span>
              <div className="mt-1 flex items-baseline gap-2">
                <span className="font-heading text-3xl font-black text-on-surface">{fabric.price_usd ?? '—'}</span>
                <span className="text-sm text-on-surface-variant">USD {p.perUnit}</span>
              </div>
            </div>

            {/* Tech specs */}
            <div>
              <h4 className="text-sm font-bold text-on-surface">{p.techSpecs}</h4>
              <div className="mt-3 grid grid-cols-2 gap-3">
                <Spec label={p.weight} value={fabric.gsm != null ? `${fabric.gsm} GSM` : '—'} />
                <Spec label={p.width} value={fabric.width_cm != null ? `${fabric.width_cm} cm` : '—'} />
                <Spec label={p.fabricType} value={fabric.fabric_type ?? '—'} />
                <Spec label={p.moq} value={fabric.moq != null ? `${fabric.moq} m` : '—'} />
                <Spec label={p.color} value={fabric.color_en ?? fabric.color ?? '—'} />
                <Spec label={p.supplyType} value={fabric.supply_type_en ?? fabric.supply_type ?? '—'} />
                <Spec label={p.shipmentTime} value={fabric.shipment_time_en ?? fabric.shipment_time ?? '—'} />
                <div className="col-span-2">
                  <Spec
                    label={p.composition}
                    value={
                      fabric.composition && fabric.composition.length > 0
                        ? fabric.composition.map((c) => `${c.material} ${c.percentage}%`).join(', ')
                        : p.noComposition
                    }
                  />
                </div>
              </div>
            </div>

            {/* SEO section */}
            {(fabric.meta_title_ru || fabric.meta_title_en || fabric.meta_description_ru || fabric.meta_description_en) ? (
              <details className="rounded-lg border border-outline/20 bg-surface-container-low/50">
                <summary className="cursor-pointer select-none px-4 py-3 text-xs font-bold uppercase tracking-widest text-primary">
                  {p.seoSection}
                </summary>
                <div className="space-y-2 border-t border-outline/10 p-4 text-xs text-on-surface-variant">
                  {fabric.meta_title_en || fabric.meta_title_ru ? (
                    <div><span className="font-semibold">{p.metaTitle}:</span> {fabric.meta_title_en ?? fabric.meta_title_ru}</div>
                  ) : null}
                  {fabric.meta_description_en || fabric.meta_description_ru ? (
                    <div><span className="font-semibold">{p.metaDescription}:</span> {fabric.meta_description_en ?? fabric.meta_description_ru}</div>
                  ) : null}
                  {fabric.image_alt_en || fabric.image_alt_ru ? (
                    <div><span className="font-semibold">Image Alt:</span> {fabric.image_alt_en ?? fabric.image_alt_ru}</div>
                  ) : null}
                </div>
              </details>
            ) : null}

            {/* Raw data section */}
            {(fabric.raw_title || fabric.raw_description) ? (
              <details className="rounded-lg border border-outline/20 bg-surface-container-low/50">
                <summary className="cursor-pointer select-none px-4 py-3 text-xs font-bold uppercase tracking-widest text-on-surface-variant">
                  {p.rawData}
                </summary>
                <div className="space-y-2 border-t border-outline/10 p-4 text-xs text-on-surface-variant">
                  {fabric.raw_title ? (
                    <div><span className="font-semibold">{p.rawTitle}:</span> {fabric.raw_title}</div>
                  ) : null}
                  {fabric.raw_description ? (
                    <div><span className="font-semibold">{p.rawDescription}:</span> {fabric.raw_description}</div>
                  ) : null}
                </div>
              </details>
            ) : null}
          </div>
        </div>
      </div>
    </div>
  )
}

function Spec({ label, value }: { label: string; value: string }) {
  return (
    <div className="rounded-lg border border-outline/15 bg-surface-container-lowest p-3">
      <span className="block text-[10px] font-bold uppercase text-on-surface-variant">{label}</span>
      <span className="font-mono text-xs text-on-surface">{value}</span>
    </div>
  )
}

