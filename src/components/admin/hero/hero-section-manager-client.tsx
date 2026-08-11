'use client'

import { useEffect, useMemo, useState } from 'react'
import Image from 'next/image'
import { ArrowDown, ArrowUp, Check, Loader2, Plus, Search, Sparkles, Trash2 } from 'lucide-react'

import { Button } from '@/components/ui/button'
import { Checkbox } from '@/components/ui/checkbox'
import { Input } from '@/components/ui/input'
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover'
import { ScrollArea } from '@/components/ui/scroll-area'
import { useGenerateHeroImage, useHeroSectionConfig, useSaveHeroSection } from '@/hooks/admin/useHeroSection'
import { useI18n } from '@/hooks/useI18n'
import { cn } from '@/lib/utils'
import type { ApiEnvelope } from '@/types/api-envelope.types'
import type { AdminFabricListResponse } from '@/types/admin-fabric-management.types'
import type { HeroCardItem, HeroSectionConfig, HeroSlideItem } from '@/types/hero-section.types'
import { HERO_BOTTOM_CARDS_LIMIT, HERO_SLIDER_LIMIT } from '@/types/hero-section.types'

type FabricDetail = {
  id: number
  titleRu: string
  titleEn: string | null
  supplierName: string
  images: string[]
}

type FabricSearchItem = {
  id: number
  titleRu: string
  titleEn: string | null
  supplierName: string
  thumbUrl: string | null
}

async function fetchFabricDetail(id: number): Promise<FabricDetail> {
  const res = await fetch(`/api/v1/admin/fabrics/${id}`)
  const json = (await res.json()) as ApiEnvelope<{
    id: number
    title_ru: string
    title_en: string | null
    supplier_name: string
    images: string[] | null
  }>
  if (!res.ok || !json.success) throw new Error('Failed to load fabric')
  return {
    id: json.data.id,
    titleRu: json.data.title_ru,
    titleEn: json.data.title_en,
    supplierName: json.data.supplier_name,
    images: json.data.images ?? []
  }
}

async function searchFabrics(q: string): Promise<FabricSearchItem[]> {
  const params = new URLSearchParams({ limit: '8', status: 'approved' })
  if (q.trim()) params.set('q', q.trim())
  const res = await fetch(`/api/v1/admin/fabrics?${params.toString()}`)
  const json = (await res.json()) as ApiEnvelope<AdminFabricListResponse>
  if (!res.ok || !json.success) return []
  return json.data.items.map((i) => ({
    id: i.id,
    titleRu: i.title_ru,
    titleEn: i.title_en,
    supplierName: i.supplier_name,
    thumbUrl: i.thumb_url
  }))
}

function FabricThumb({ src, alt, className }: { src: string | null | undefined; alt: string; className?: string }) {
  if (!src) {
    return <div className={cn('flex items-center justify-center bg-surface-container/60', className)} aria-hidden />
  }
  return <Image src={src} alt={alt} width={96} height={96} className={cn('object-cover', className)} sizes="96px" />
}

/* ─── Searchable fabric picker ─────────────────────────── */
function FabricPicker({
  fabric,
  onSelect,
  placeholder,
}: {
  fabric: FabricDetail | null
  onSelect: (id: number) => void
  placeholder: string
}) {
  const { messages } = useI18n()
  const s = messages.admin.heroPage
  const [open, setOpen] = useState(false)
  const [query, setQuery] = useState('')
  const [results, setResults] = useState<FabricSearchItem[]>([])
  const [loading, setLoading] = useState(false)

  useEffect(() => {
    if (!open) return
    let cancelled = false
    setLoading(true)
    const timer = setTimeout(async () => {
      try {
        const items = await searchFabrics(query)
        if (!cancelled) setResults(items)
      } finally {
        if (!cancelled) setLoading(false)
      }
    }, query.trim() ? 300 : 0)
    return () => {
      cancelled = true
      clearTimeout(timer)
    }
  }, [open, query])

  return (
    <Popover open={open} onOpenChange={setOpen}>
      <PopoverTrigger asChild>
        <Button
          type="button"
          variant="outline"
          className="h-12 w-full justify-start gap-3 rounded-xl px-3"
        >
          {fabric ? (
            <>
              <FabricThumb src={fabric.images[0]} alt={fabric.titleRu} className="h-8 w-8 rounded-lg" />
              <span className="min-w-0 flex-1 text-left">
                <span className="block truncate text-sm font-semibold">{fabric.titleRu}</span>
                <span className="block truncate text-xs text-on-surface-variant">{fabric.supplierName}</span>
              </span>
            </>
          ) : (
            <span className="flex w-full items-center justify-between gap-2 text-sm text-on-surface-variant">
              {placeholder}
              <Search className="h-4 w-4 shrink-0" aria-hidden />
            </span>
          )}
        </Button>
      </PopoverTrigger>
      <PopoverContent className="w-[min(92vw,420px)] p-2" align="start">
        <div className="relative">
          <Search className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-on-surface-variant" aria-hidden />
          <Input
            autoFocus
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            placeholder={s.searchFabrics}
            className="rounded-xl pl-9"
          />
        </div>
        <ScrollArea className="mt-2 max-h-72">
          <div className="space-y-1 pr-1">
            {loading ? (
              <div className="flex items-center justify-center py-6">
                <Loader2 className="h-4 w-4 animate-spin text-on-surface-variant" aria-hidden />
              </div>
            ) : results.length === 0 ? (
              <div className="py-6 text-center text-sm text-on-surface-variant">{s.noResults}</div>
            ) : (
              results.map((item) => {
                const selected = item.id === fabric?.id
                return (
                  <button
                    key={item.id}
                    type="button"
                    onClick={() => {
                      onSelect(item.id)
                      setOpen(false)
                      setQuery('')
                    }}
                    className={cn(
                      'flex w-full items-center gap-3 rounded-xl px-2 py-2 text-left transition-colors',
                      selected ? 'bg-primary/10' : 'hover:bg-surface-container/70'
                    )}
                  >
                    <FabricThumb src={item.thumbUrl} alt={item.titleRu} className="h-10 w-10 rounded-lg" />
                    <div className="min-w-0 flex-1">
                      <p className="truncate text-sm font-semibold text-on-surface">{item.titleRu}</p>
                      <p className="truncate text-xs text-on-surface-variant">{item.supplierName}</p>
                    </div>
                    {selected ? <Check className="h-4 w-4 shrink-0 text-primary" aria-hidden /> : null}
                  </button>
                )
              })
            )}
          </div>
        </ScrollArea>
      </PopoverContent>
    </Popover>
  )
}

/* ─── Image pin selector (thumbnail chips) ─────────────── */
function ImagePinSelector({
  fabric,
  value,
  onChange,
  label,
}: {
  fabric: FabricDetail | null
  value: string | null
  onChange: (url: string | null) => void
  label: string
}) {
  const { messages } = useI18n()
  const s = messages.admin.heroPage
  const images = fabric?.images ?? []

  if (images.length === 0) return null

  return (
    <div>
      <div className="mb-1.5 text-xs font-bold uppercase tracking-widest text-outline">{label}</div>
      <div className="flex flex-wrap items-center gap-1.5">
        <button
          type="button"
          onClick={() => onChange(null)}
          className={cn(
            'inline-flex h-10 items-center rounded-lg border px-2.5 text-xs font-semibold transition-colors',
            value === null
              ? 'border-primary bg-primary/10 text-primary'
              : 'border-outline/15 text-on-surface-variant hover:bg-surface-container/70'
          )}
        >
          {s.autoImage}
        </button>
        {images.map((url, i) => (
          <button
            key={url}
            type="button"
            onClick={() => onChange(url === value ? null : url)}
            className={cn(
              'relative h-10 w-10 overflow-hidden rounded-lg border transition-all',
              url === value ? 'border-primary ring-2 ring-primary/30' : 'border-outline/15 hover:border-outline/40'
            )}
            title={`${i + 1}`}
          >
            <FabricThumb src={url} alt={`${i + 1}`} className="h-full w-full" />
          </button>
        ))}
      </div>
    </div>
  )
}

/* ─── Slot card wrapper ────────────────────────────────── */
function SlotCard({ title, index, onMoveUp, onMoveDown, onRemove, children }: {
  title: string
  index?: number
  onMoveUp?: () => void
  onMoveDown?: () => void
  onRemove: () => void
  children: React.ReactNode
}) {
  return (
    <div className="rounded-2xl border border-outline/10 bg-surface-container/40 p-4">
      <div className="mb-3 flex items-center justify-between gap-2">
        <div className="text-xs font-bold uppercase tracking-widest text-outline">
          {title}
          {typeof index === 'number' ? ` #${index + 1}` : ''}
        </div>
        <div className="flex items-center gap-1">
          {onMoveUp ? (
            <button
              type="button"
              onClick={onMoveUp}
              className="rounded-lg p-1.5 text-on-surface-variant transition-colors hover:bg-surface-container hover:text-on-surface"
              aria-label="Move up"
            >
              <ArrowUp className="h-4 w-4" aria-hidden />
            </button>
          ) : null}
          {onMoveDown ? (
            <button
              type="button"
              onClick={onMoveDown}
              className="rounded-lg p-1.5 text-on-surface-variant transition-colors hover:bg-surface-container hover:text-on-surface"
              aria-label="Move down"
            >
              <ArrowDown className="h-4 w-4" aria-hidden />
            </button>
          ) : null}
          <button
            type="button"
            onClick={onRemove}
            className="rounded-lg p-1.5 text-on-surface-variant transition-colors hover:bg-destructive/10 hover:text-destructive"
            aria-label="Remove"
          >
            <Trash2 className="h-4 w-4" aria-hidden />
          </button>
        </div>
      </div>
      {children}
    </div>
  )
}

/* ─── Main manager ─────────────────────────────────────── */
export function HeroSectionManagerClient() {
  const { messages } = useI18n()
  const s = messages.admin.heroPage
  const configQuery = useHeroSectionConfig()
  const saveMutation = useSaveHeroSection()
  const generateMutation = useGenerateHeroImage()

  const config = configQuery.data?.success ? configQuery.data.data : null

  const [draft, setDraft] = useState<HeroSectionConfig | null>(null)
  const [fabricCache, setFabricCache] = useState<Record<number, FabricDetail>>({})
  const [generatingId, setGeneratingId] = useState<number | null>(null)

  const current: HeroSectionConfig | null = draft ?? config ?? null

  const referencedIds = useMemo(() => {
    const ids = new Set<number>()
    if (!current) return ids
    for (const slide of current.slider) if (slide.fabricId > 0) ids.add(slide.fabricId)
    if (current.rightCard && current.rightCard.fabricId > 0) ids.add(current.rightCard.fabricId)
    for (const card of current.bottomCards) if (card.fabricId > 0) ids.add(card.fabricId)
    return ids
  }, [current])

  useEffect(() => {
    const missing = [...referencedIds].filter((id) => !fabricCache[id])
    if (missing.length === 0) return
    let cancelled = false
    ;(async () => {
      try {
        const details = await Promise.all(missing.map(fetchFabricDetail))
        if (cancelled) return
        setFabricCache((prev) => {
          const next = { ...prev }
          for (const d of details) next[d.id] = d
          return next
        })
      } catch {
        // leave unset; the picker search still works
      }
    })()
    return () => {
      cancelled = true
    }
  }, [referencedIds, fabricCache])

  const update = (updater: (d: HeroSectionConfig) => HeroSectionConfig) => {
    if (!config) return
    setDraft((prev) => updater(prev ?? config))
  }

  if (configQuery.isLoading) {
    return (
      <div className="space-y-6">
        <div className="rounded-[2rem] border border-outline/10 bg-surface-container-lowest h-[520px] animate-pulse" />
      </div>
    )
  }
  if (!current) return null

  const onSave = () => {
    const payload: HeroSectionConfig = {
      mode: current.mode,
      slider: current.slider.filter((x) => x.fabricId > 0).slice(0, HERO_SLIDER_LIMIT),
      rightCard: current.rightCard && current.rightCard.fabricId > 0 ? current.rightCard : null,
      bottomCards: current.bottomCards.filter((x) => x.fabricId > 0).slice(0, HERO_BOTTOM_CARDS_LIMIT),
      video: { youtubeEmbedId: current.video.youtubeEmbedId ?? null }
    }
    saveMutation.mutate(payload)
  }

  const onResetToAuto = () => {
    if (!config) return
    setDraft({
      mode: 'auto',
      slider: [],
      rightCard: null,
      bottomCards: [],
      video: { youtubeEmbedId: null }
    })
    saveMutation.mutate({
      mode: 'auto',
      slider: [],
      rightCard: null,
      bottomCards: [],
      video: { youtubeEmbedId: null }
    })
  }

  const handleGenerate = (fabricId: number) => {
    if (!fabricId || fabricId <= 0) return
    setGeneratingId(fabricId)
    generateMutation.mutate(fabricId, { onSettled: () => setGeneratingId(null) })
  }

  const patchSlide = (i: number, patch: Partial<HeroSlideItem>) =>
    update((d) => ({
      ...d,
      slider: d.slider.map((x, idx) => (idx === i ? { ...x, ...patch } : x))
    }))

  const patchCard = (i: number, patch: Partial<HeroCardItem>) =>
    update((d) => ({
      ...d,
      bottomCards: d.bottomCards.map((x, idx) => (idx === i ? { ...x, ...patch } : x))
    }))

  return (
    <div className="space-y-6">
      <div>
        <h1 className="font-heading text-heading-xl font-extrabold tracking-tight">{s.title}</h1>
        <p className="mt-2 text-sm text-on-surface-variant">{s.subtitle}</p>
      </div>

      {/* Mode */}
      <div className="rounded-[2rem] border border-outline/10 bg-surface-container-lowest p-6">
        <div className="flex flex-wrap items-center gap-3">
          <button
            type="button"
            onClick={() => update((d) => ({ ...d, mode: 'auto' }))}
            className={cn(
              'rounded-xl border px-4 py-2 text-sm font-semibold transition-colors',
              current.mode === 'auto'
                ? 'border-primary bg-primary/10 text-primary'
                : 'border-outline/15 text-on-surface-variant hover:bg-surface-container/70'
            )}
          >
            {s.autoMode}
          </button>
          <button
            type="button"
            onClick={() => update((d) => ({ ...d, mode: 'custom' }))}
            className={cn(
              'rounded-xl border px-4 py-2 text-sm font-semibold transition-colors',
              current.mode === 'custom'
                ? 'border-primary bg-primary/10 text-primary'
                : 'border-outline/15 text-on-surface-variant hover:bg-surface-container/70'
            )}
          >
            {s.customMode}
          </button>
        </div>
        <p className="mt-3 text-sm text-on-surface-variant">
          {current.mode === 'auto' ? s.autoModeInfo : s.customModeEmpty}
        </p>
      </div>

      {current.mode === 'custom' ? (
        <>
          {/* Slider */}
          <section className="rounded-[2rem] border border-outline/10 bg-surface-container-lowest p-6">
            <div className="mb-4 flex items-baseline justify-between gap-4">
              <div>
                <h2 className="font-heading text-lg font-extrabold tracking-tight">{s.sliderSection}</h2>
                <p className="mt-1 text-sm text-on-surface-variant">{s.sliderHint}</p>
              </div>
              <Button
                type="button"
                variant="outline"
                size="sm"
                className="rounded-full"
                disabled={current.slider.length >= HERO_SLIDER_LIMIT}
                onClick={() =>
                  update((d) => ({
                    ...d,
                    slider: [...d.slider, { fabricId: 0, enabled: true, imageUrl: null }].slice(0, HERO_SLIDER_LIMIT)
                  }))
                }
              >
                <Plus className="mr-1 h-4 w-4" aria-hidden />
                {s.addSliderItem}
              </Button>
            </div>

            <div className="space-y-3">
              {current.slider.length === 0 ? (
                <p className="rounded-2xl border border-dashed border-outline/20 p-6 text-center text-sm text-on-surface-variant">
                  {s.addSliderItem}
                </p>
              ) : (
                current.slider.map((slide, i) => {
                  const fabric = slide.fabricId > 0 ? (fabricCache[slide.fabricId] ?? null) : null
                  const generating = generatingId === slide.fabricId
                  return (
                    <SlotCard
                      key={i}
                      title={`${s.sliderSection}`}
                      index={i}
                      onMoveUp={i > 0 ? () => update((d) => swapSlide(d, i, i - 1)) : undefined}
                      onMoveDown={i < current.slider.length - 1 ? () => update((d) => swapSlide(d, i, i + 1)) : undefined}
                      onRemove={() => update((d) => ({ ...d, slider: d.slider.filter((_, idx) => idx !== i) }))}
                    >
                      <div className="grid gap-3 sm:grid-cols-2">
                        <FabricPicker
                          fabric={fabric}
                          placeholder={s.selectFabric}
                          onSelect={(id) => patchSlide(i, { fabricId: id, imageUrl: null })}
                        />
                        <div className="flex items-end gap-3">
                          <label className="flex flex-1 items-center gap-2 rounded-xl border border-outline/15 px-3 py-2.5 text-sm font-semibold">
                            <Checkbox
                              checked={slide.enabled}
                              onCheckedChange={(v) => patchSlide(i, { enabled: Boolean(v) })}
                            />
                            {s.enabled}
                          </label>
                          <Button
                            type="button"
                            variant="outline"
                            className="flex-1 rounded-xl"
                            disabled={!slide.fabricId || generating}
                            onClick={() => handleGenerate(slide.fabricId)}
                          >
                            {generating ? (
                              <Loader2 className="mr-1.5 h-4 w-4 animate-spin" aria-hidden />
                            ) : (
                              <Sparkles className="mr-1.5 h-4 w-4" aria-hidden />
                            )}
                            {generating ? s.generating : s.generateImage}
                          </Button>
                        </div>
                      </div>
                      {fabric ? (
                        <div className="mt-3">
                          <ImagePinSelector
                            fabric={fabric}
                            value={slide.imageUrl}
                            label={s.pinImage}
                            onChange={(url) => patchSlide(i, { imageUrl: url })}
                          />
                        </div>
                      ) : null}
                    </SlotCard>
                  )
                })
              )}
            </div>
          </section>

          {/* Right card */}
          <section className="rounded-[2rem] border border-outline/10 bg-surface-container-lowest p-6">
            <div className="mb-4">
              <h2 className="font-heading text-lg font-extrabold tracking-tight">{s.rightCardSection}</h2>
              <p className="mt-1 text-sm text-on-surface-variant">{s.rightCardHint}</p>
            </div>
            {current.rightCard ? (
              <SlotCard
                title={s.rightCardSection}
                onRemove={() => update((d) => ({ ...d, rightCard: null }))}
              >
                <FabricPicker
                  fabric={current.rightCard.fabricId > 0 ? (fabricCache[current.rightCard.fabricId] ?? null) : null}
                  placeholder={s.selectFabric}
                  onSelect={(id) => update((d) => ({ ...d, rightCard: { fabricId: id, imageUrl: null } }))}
                />
                {current.rightCard.fabricId > 0 ? (
                  <div className="mt-3">
                    <ImagePinSelector
                      fabric={fabricCache[current.rightCard.fabricId] ?? null}
                      value={current.rightCard.imageUrl}
                      label={s.pinImage}
                      onChange={(url) => update((d) => (d.rightCard ? { ...d, rightCard: { ...d.rightCard, imageUrl: url } } : d))}
                    />
                  </div>
                ) : null}
              </SlotCard>
            ) : (
              <Button type="button" variant="outline" className="w-full rounded-2xl border-dashed py-6" onClick={() => update((d) => ({ ...d, rightCard: { fabricId: 0, imageUrl: null } }))}>
                <Plus className="mr-1.5 h-4 w-4" aria-hidden />
                {s.rightCardSection}
              </Button>
            )}
          </section>

          {/* Bottom cards */}
          <section className="rounded-[2rem] border border-outline/10 bg-surface-container-lowest p-6">
            <div className="mb-4 flex items-baseline justify-between gap-4">
              <div>
                <h2 className="font-heading text-lg font-extrabold tracking-tight">{s.bottomSection}</h2>
                <p className="mt-1 text-sm text-on-surface-variant">{s.bottomHint}</p>
              </div>
              <Button
                type="button"
                variant="outline"
                size="sm"
                className="rounded-full"
                disabled={current.bottomCards.length >= HERO_BOTTOM_CARDS_LIMIT}
                onClick={() =>
                  update((d) => ({
                    ...d,
                    bottomCards: [...d.bottomCards, { fabricId: 0, imageUrl: null }].slice(0, HERO_BOTTOM_CARDS_LIMIT)
                  }))
                }
              >
                <Plus className="mr-1 h-4 w-4" aria-hidden />
                {s.addBottomCard}
              </Button>
            </div>
            <div className="space-y-3">
              {current.bottomCards.length === 0 ? (
                <p className="rounded-2xl border border-dashed border-outline/20 p-6 text-center text-sm text-on-surface-variant">
                  {s.addBottomCard}
                </p>
              ) : (
                current.bottomCards.map((card, i) => (
                  <SlotCard
                    key={i}
                    title={s.bottomSection}
                    index={i}
                    onMoveUp={i > 0 ? () => update((d) => swapCard(d, i, i - 1)) : undefined}
                    onMoveDown={i < current.bottomCards.length - 1 ? () => update((d) => swapCard(d, i, i + 1)) : undefined}
                    onRemove={() => update((d) => ({ ...d, bottomCards: d.bottomCards.filter((_, idx) => idx !== i) }))}
                  >
                    <FabricPicker
                      fabric={card.fabricId > 0 ? (fabricCache[card.fabricId] ?? null) : null}
                      placeholder={s.selectFabric}
                      onSelect={(id) => patchCard(i, { fabricId: id, imageUrl: null })}
                    />
                    {card.fabricId > 0 ? (
                      <div className="mt-3">
                        <ImagePinSelector
                          fabric={fabricCache[card.fabricId] ?? null}
                          value={card.imageUrl}
                          label={s.pinImage}
                          onChange={(url) => patchCard(i, { imageUrl: url })}
                        />
                      </div>
                    ) : null}
                  </SlotCard>
                ))
              )}
            </div>
          </section>

          {/* Video */}
          <section className="rounded-[2rem] border border-outline/10 bg-surface-container-lowest p-6">
            <h2 className="font-heading text-lg font-extrabold tracking-tight">{s.videoSection}</h2>
            <p className="mt-1 text-sm text-on-surface-variant">{s.videoHint}</p>
            <Input
              value={current.video.youtubeEmbedId ?? ''}
              onChange={(e) => update((d) => ({ ...d, video: { youtubeEmbedId: e.target.value.trim() || null } }))}
              placeholder={s.videoPlaceholder}
              className="mt-3 max-w-md rounded-xl"
            />
          </section>
        </>
      ) : null}

      {/* Actions */}
      <div className="flex flex-wrap gap-3">
        <Button onClick={onSave} className="rounded-full" disabled={saveMutation.isPending}>
          {saveMutation.isPending ? (
            <>
              <Loader2 className="mr-1.5 h-4 w-4 animate-spin" aria-hidden />
              {s.saving}
            </>
          ) : (
            s.saveChanges
          )}
        </Button>
        <Button variant="outline" className="rounded-full" onClick={() => setDraft(null)} disabled={!draft}>
          {messages.admin.settingsPage.discardEdits}
        </Button>
        <Button variant="outline" className="rounded-full text-destructive hover:text-destructive" onClick={onResetToAuto} disabled={saveMutation.isPending}>
          {s.resetToAuto}
        </Button>
      </div>
    </div>
  )
}

function swapSlide(d: HeroSectionConfig, a: number, b: number): HeroSectionConfig {
  const slider = [...d.slider]
  const tmp = slider[a]
  if (!tmp) return d
  slider[a] = slider[b]!
  slider[b] = tmp
  return { ...d, slider }
}

function swapCard(d: HeroSectionConfig, a: number, b: number): HeroSectionConfig {
  const bottomCards = [...d.bottomCards]
  const tmp = bottomCards[a]
  if (!tmp) return d
  bottomCards[a] = bottomCards[b]!
  bottomCards[b] = tmp
  return { ...d, bottomCards }
}
