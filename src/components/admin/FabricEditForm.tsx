'use client'

import * as React from 'react'
import Link from 'next/link'
import { useRouter } from 'next/navigation'
import { useMutation, useQuery } from '@tanstack/react-query'
import { toast } from 'sonner'
import { ArrowLeft, CheckCircle2, CircleDollarSign, ExternalLink, Film, ImageIcon, ImagePlus, Layers, Plus, RefreshCw, Save, XCircle } from 'lucide-react'

import type { ApiEnvelope } from '@/types/api-envelope.types'
import type { FabricCompositionItem } from '@/types/fabric'
import type { AdminFabricDetail, AdminFabricUpdateInput } from '@/types/admin-fabric-management.types'
import { ELITE_IMAGE_PROMPT_TYPES } from '@/constants'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Textarea } from '@/components/ui/textarea'
import { Checkbox } from '@/components/ui/checkbox'
import { Badge } from '@/components/ui/badge'
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from '@/components/ui/dialog'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { SocialVideoGenerationDialog } from '@/components/admin/social/social-video-generation-dialog'
import { useI18n } from '@/hooks/useI18n'
import { withLocaleUrl } from '@/lib/i18n/locale-path'
import { cn } from '@/lib/utils'

const fabricTypes = ['woven', 'knit', 'nonwoven', 'lace', 'lining', 'technical', 'other'] as const

function clamp01(n: number) {
  return Math.max(0, Math.min(1, n))
}

function confidenceColor(score01: number) {
  if (score01 >= 0.85) return 'text-emerald-700'
  if (score01 >= 0.7) return 'text-amber-700'
  return 'text-red-700'
}

export function FabricEditForm({ fabric }: { fabric: AdminFabricDetail }) {
  const router = useRouter()
  const { messages, locale } = useI18n()

  const [titleRu, setTitleRu] = React.useState(fabric.title_ru)
  const [titleEn, setTitleEn] = React.useState(fabric.title_en ?? '')
  const [descriptionRu, setDescriptionRu] = React.useState(fabric.description_ru ?? '')
  const [fabricType, setFabricType] = React.useState(fabric.fabric_type ?? '')
  const [gsm, setGsm] = React.useState<string>(fabric.gsm === null ? '' : String(fabric.gsm))
  const [widthCm, setWidthCm] = React.useState<string>(fabric.width_cm === null ? '' : String(fabric.width_cm))
  const [moq, setMoq] = React.useState<string>(fabric.moq === null ? '' : String(fabric.moq))
  const [priceUsd, setPriceUsd] = React.useState<string>(fabric.price_usd ?? '')
  const [tags, setTags] = React.useState<string>((fabric.tags ?? []).join(', '))
  const [isFeatured, setIsFeatured] = React.useState<boolean>(fabric.is_featured)
  const [descriptionEn, setDescriptionEn] = React.useState(fabric.description_en ?? '')
  const [usageRu, setUsageRu] = React.useState(fabric.usage_ru ?? '')
  const [usageEn, setUsageEn] = React.useState(fabric.usage_en ?? '')
  const [tagsEn, setTagsEn] = React.useState<string>((fabric.tags_en ?? []).join(', '))
  const [metaTitleRu, setMetaTitleRu] = React.useState(fabric.meta_title_ru ?? '')
  const [metaTitleEn, setMetaTitleEn] = React.useState(fabric.meta_title_en ?? '')
  const [metaDescriptionRu, setMetaDescriptionRu] = React.useState(fabric.meta_description_ru ?? '')
  const [metaDescriptionEn, setMetaDescriptionEn] = React.useState(fabric.meta_description_en ?? '')
  const [color, setColor] = React.useState(fabric.color ?? '')
  const [colorEn, setColorEn] = React.useState(fabric.color_en ?? '')
  const [supplyType, setSupplyType] = React.useState(fabric.supply_type ?? '')
  const [supplyTypeEn, setSupplyTypeEn] = React.useState(fabric.supply_type_en ?? '')
  const [shipmentTime, setShipmentTime] = React.useState(fabric.shipment_time ?? '')
  const [shipmentTimeEn, setShipmentTimeEn] = React.useState(fabric.shipment_time_en ?? '')

  const [imageAltRu, setImageAltRu] = React.useState(fabric.image_alt_ru ?? '')
  const [imageAltEn, setImageAltEn] = React.useState(fabric.image_alt_en ?? '')

  const [composition, setComposition] = React.useState<FabricCompositionItem[]>(fabric.composition ?? [])

  const [seoOpen, setSeoOpen] = React.useState(true)

  const [rejectOpen, setRejectOpen] = React.useState(false)
  const [rejectReason, setRejectReason] = React.useState('')
  const [videoStarted, setVideoStarted] = React.useState(false)

  const updateMutation = useMutation({
    mutationFn: async (input: AdminFabricUpdateInput) => {
      const res = await fetch(`/api/v1/admin/fabrics/${fabric.id}`, {
        method: 'PATCH',
        headers: { 'content-type': 'application/json' },
        body: JSON.stringify(input)
      })
      const json = (await res.json()) as ApiEnvelope<unknown>
      if (!res.ok || !json.success) throw new Error(!json.success ? json.error.message : messages.admin.leadsTimeline.requestFailed)
      return json.data
    },
    onSuccess: () => toast.success(messages.admin.fabricEdit.savedToast)
  })

  const approveMutation = useMutation({
    mutationFn: async () => {
      const res = await fetch(`/api/v1/admin/fabrics/${fabric.id}/approve`, { method: 'POST' })
      const json = (await res.json()) as ApiEnvelope<unknown>
      if (!res.ok || !json.success) throw new Error(!json.success ? json.error.message : messages.admin.leadsTimeline.requestFailed)
      return json.data
    },
    onSuccess: () => {
      toast.success(messages.admin.fabricEdit.approvedToast)
      router.refresh()
    }
  })

  const rejectMutation = useMutation({
    mutationFn: async (reason: string) => {
      const res = await fetch(`/api/v1/admin/fabrics/${fabric.id}/reject`, {
        method: 'POST',
        headers: { 'content-type': 'application/json' },
        body: JSON.stringify({ reason })
      })
      const json = (await res.json()) as ApiEnvelope<unknown>
      if (!res.ok || !json.success) throw new Error(!json.success ? json.error.message : messages.admin.leadsTimeline.requestFailed)
      return json.data
    },
    onSuccess: () => {
      toast.success(messages.admin.fabricEdit.rejectedToast)
      setRejectOpen(false)
      router.refresh()
    }
  })

  const { data: generatedMediaData, refetch: refetchGeneratedMedia, isFetching: isFetchingMedia } = useQuery({
    queryKey: ['admin-fabric-generated-media', fabric.id],
    queryFn: async () => {
      const res = await fetch(`/api/v1/admin/fabrics/${fabric.id}/generated-media`)
      const json = await res.json()
      if (!res.ok || !json.success) throw new Error('Failed to load generated media')
      return json.data as {
        images: Array<{ id: number; url: string | null; status: string; prompt: string; metadata?: { promptType?: string } | null }>
        videos: Array<{ id: number; url: string | null; thumbnailUrl: string | null; status: string; durationSeconds: number | null }>
      }
    },
    refetchInterval: 5000
  })

  const [imageGenCounts, setImageGenCounts] = React.useState<Record<string, number>>({})

  const hasMultipleSheets = React.useMemo(
    () => (fabric.images ?? []).filter((url) => !url.includes('/generated/')).length >= 2,
    [fabric.images]
  )

  const studioPromptTypes = React.useMemo(
    () => ELITE_IMAGE_PROMPT_TYPES.filter((t) => t.type !== 'openSheets' || hasMultipleSheets),
    [hasMultipleSheets]
  )

  const generateByTypeMutation = useMutation({
    mutationFn: async ({ promptType, count }: { promptType: string; count: number }) => {
      const res = await fetch(`/api/v1/admin/fabrics/${fabric.id}/generate-image`, {
        method: 'POST',
        headers: { 'content-type': 'application/json' },
        body: JSON.stringify({ prompt_type: promptType, count })
      })
      const json = (await res.json()) as ApiEnvelope<unknown>
      if (!res.ok || !json.success) throw new Error(!json.success ? json.error.message : messages.admin.leadsTimeline.requestFailed)
      return json.data
    },
    onSuccess: () => {
      toast.success('Image generation queued')
      void refetchGeneratedMedia()
    },
    onError: (err) => toast.error(err instanceof Error ? err.message : 'Failed to queue image generation')
  })

  const imageCountsByType = React.useMemo(() => {
    const total: Record<string, number> = {}
    const pending: Record<string, number> = {}
    for (const img of generatedMediaData?.images ?? []) {
      const t = img.metadata?.promptType
      if (!t) continue
      total[t] = (total[t] ?? 0) + 1
      if (img.status === 'PENDING' || img.status === 'PROCESSING') pending[t] = (pending[t] ?? 0) + 1
    }
    return { total, pending }
  }, [generatedMediaData])

  React.useEffect(() => {
    const err = updateMutation.error ?? approveMutation.error ?? rejectMutation.error
    if (!err) return
    toast.error(err instanceof Error ? err.message : messages.admin.fabricEdit.actionFailed)
  }, [approveMutation.error, messages.admin.fabricEdit.actionFailed, rejectMutation.error, updateMutation.error])

  const aiScore01 = fabric.ai_confidence_score ? clamp01(Number(fabric.ai_confidence_score)) : null

  const editSubtitle = messages.admin.fabricEdit.idSupplier
    .replace('{id}', String(fabric.id))
    .replace('{supplier}', fabric.supplier_name)

  const submit = (e: React.FormEvent) => {
    e.preventDefault()
    const parsedTags = tags
      .split(',')
      .map((t) => t.trim())
      .filter(Boolean)

    const parsedTagsEn = tagsEn
      .split(',')
      .map((t) => t.trim())
      .filter(Boolean)

    const payload: AdminFabricUpdateInput = {
      title_ru: titleRu.trim(),
      title_en: titleEn.trim().length > 0 ? titleEn.trim() : null,
      usage_ru: usageRu.trim().length > 0 ? usageRu.trim() : null,
      usage_en: usageEn.trim().length > 0 ? usageEn.trim() : null,
      description_ru: descriptionRu.trim().length > 0 ? descriptionRu.trim() : null,
      description_en: descriptionEn.trim().length > 0 ? descriptionEn.trim() : null,
      fabric_type: fabricType.trim().length > 0 ? fabricType.trim() : null,
      gsm: gsm.trim().length > 0 ? Number(gsm) : null,
      width_cm: widthCm.trim().length > 0 ? Number(widthCm) : null,
      moq: moq.trim().length > 0 ? Number(moq) : null,
      price_usd: priceUsd.trim().length > 0 ? priceUsd.trim() : null,
      composition: composition.length > 0 ? composition : null,
      tags: parsedTags.length > 0 ? parsedTags : null,
      tags_en: parsedTagsEn.length > 0 ? parsedTagsEn : null,
      meta_title_ru: metaTitleRu.trim().length > 0 ? metaTitleRu.trim() : null,
      meta_title_en: metaTitleEn.trim().length > 0 ? metaTitleEn.trim() : null,
      meta_description_ru: metaDescriptionRu.trim().length > 0 ? metaDescriptionRu.trim() : null,
      meta_description_en: metaDescriptionEn.trim().length > 0 ? metaDescriptionEn.trim() : null,
      color: color.trim().length > 0 ? color.trim() : null,
      color_en: colorEn.trim().length > 0 ? colorEn.trim() : null,
      supply_type: supplyType.trim().length > 0 ? supplyType.trim() : null,
      supply_type_en: supplyTypeEn.trim().length > 0 ? supplyTypeEn.trim() : null,
      shipment_time: shipmentTime.trim().length > 0 ? shipmentTime.trim() : null,
      shipment_time_en: shipmentTimeEn.trim().length > 0 ? shipmentTimeEn.trim() : null,
      image_alt_ru: imageAltRu.trim().length > 0 ? imageAltRu.trim() : null,
      image_alt_en: imageAltEn.trim().length > 0 ? imageAltEn.trim() : null,
      is_featured: isFeatured
    }

    updateMutation.mutate(payload)
  }

  return (
    <div className="space-y-6">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <Button asChild variant="outline">
          <Link href="/admin/fabrics">
            <ArrowLeft className="h-4 w-4" aria-hidden />
            {messages.admin.fabricEdit.back}
          </Link>
        </Button>

        <div className="flex flex-wrap items-center gap-2">
          <Badge intent="default">{fabric.status}</Badge>
          <Button asChild variant="outline" size="sm">
            <Link href={withLocaleUrl(`/admin/wholesale-pricing-simulator?fabricId=${fabric.id}`, locale)}>
              <CircleDollarSign className="h-4 w-4" aria-hidden />
              {messages.admin.fabricEdit.wholesaleSimulator}
            </Link>
          </Button>
          <Button asChild variant="outline" size="sm">
            <Link href={withLocaleUrl(`/admin/wholesale-pricing/tiers?fabricId=${fabric.id}`, locale)}>
              <Layers className="h-4 w-4" aria-hidden />
              {messages.admin.fabricEdit.wholesaleTiers}
            </Link>
          </Button>
          <SocialVideoGenerationDialog
            fabricId={fabric.id}
            fabricTitle={fabric.title_ru}
            onGenerationStarted={() => setVideoStarted(true)}
          />
          <Button asChild variant="outline" size="sm">
            <Link href={`/admin/social/fabrics/${fabric.id}`}>
              <Film className="h-4 w-4" aria-hidden />
              {messages.admin.fabricEdit.socialContent}
            </Link>
          </Button>
          {fabric.status === 'approved' ? (
            <Button asChild variant="outline">
              <Link href={`/fabrics/${encodeURIComponent(fabric.slug)}`} target="_blank">
                {messages.admin.fabricEdit.viewMarketplace} <ExternalLink className="h-4 w-4" aria-hidden />
              </Link>
            </Button>
          ) : null}
          <Button onClick={() => approveMutation.mutate()} disabled={approveMutation.isPending} className="bg-emerald-600 hover:bg-emerald-700">
            <CheckCircle2 className="h-4 w-4" aria-hidden />
            {messages.admin.fabricEdit.approve}
          </Button>
          <Button variant="outline" className="border-red-200 text-red-700 hover:bg-red-50" onClick={() => setRejectOpen(true)}>
            <XCircle className="h-4 w-4" aria-hidden />
            {messages.admin.fabricEdit.reject}
          </Button>
        </div>
      </div>

      <div className="grid gap-6 lg:grid-cols-12">
        <form onSubmit={submit} className="lg:col-span-8 rounded-xl bg-surface-container-lowest p-5 shadow-sm space-y-5">
          <div className="flex items-center justify-between">
            <div>
              <div className="text-sm font-semibold text-on-surface">{messages.admin.fabricEdit.editTitle}</div>
              <div className="text-xs text-on-surface-variant">{editSubtitle}</div>
            </div>
            <Button type="submit" disabled={updateMutation.isPending}>
              <Save className="h-4 w-4" aria-hidden />
              {messages.admin.fabricEdit.save}
            </Button>
          </div>

          <div className="grid gap-4 sm:grid-cols-2">
            <div className="space-y-2">
              <div className="text-xs font-semibold text-on-surface">{messages.admin.fabricEdit.titleRu}</div>
              <Textarea value={titleRu} onChange={(e) => setTitleRu(e.target.value)} className="min-h-[90px]" />
            </div>
            <div className="space-y-2">
              <div className="text-xs font-semibold text-on-surface">{messages.admin.fabricEdit.titleEn}</div>
              <Textarea value={titleEn} onChange={(e) => setTitleEn(e.target.value)} className="min-h-[90px]" />
            </div>
          </div>

          <div className="space-y-2">
            <div className="text-xs font-semibold text-on-surface">{messages.admin.fabricEdit.descriptionRu}</div>
            <Textarea value={descriptionRu} onChange={(e) => setDescriptionRu(e.target.value)} className="min-h-[160px]" />
          </div>

          <div className="space-y-2">
            <div className="text-xs font-semibold text-on-surface">{messages.admin.fabricEdit.descriptionEn}</div>
            <Textarea value={descriptionEn} onChange={(e) => setDescriptionEn(e.target.value)} className="min-h-[160px]" />
          </div>

          <div className="grid gap-4 sm:grid-cols-2">
            <div className="space-y-2">
              <div className="text-xs font-semibold text-on-surface">{messages.admin.fabricEdit.usageRu}</div>
              <Textarea value={usageRu} onChange={(e) => setUsageRu(e.target.value)} className="min-h-[80px]" />
            </div>
            <div className="space-y-2">
              <div className="text-xs font-semibold text-on-surface">{messages.admin.fabricEdit.usageEn}</div>
              <Textarea value={usageEn} onChange={(e) => setUsageEn(e.target.value)} className="min-h-[80px]" />
            </div>
          </div>

          <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
            <div className="space-y-2">
              <div className="text-xs font-semibold text-on-surface">{messages.admin.fabricEdit.fabricType}</div>
              <Select value={fabricType} onValueChange={setFabricType}>
                <SelectTrigger>
                  <SelectValue placeholder={messages.admin.fabricEdit.selectType} />
                </SelectTrigger>
                <SelectContent>
                  {fabricTypes.map((t) => (
                    <SelectItem key={t} value={t}>
                      {messages.fabrics.filters.types[t]}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-2">
              <div className="text-xs font-semibold text-on-surface">{messages.admin.fabricEdit.gsm}</div>
              <Input value={gsm} onChange={(e) => setGsm(e.target.value)} inputMode="numeric" />
            </div>
            <div className="space-y-2">
              <div className="text-xs font-semibold text-on-surface">{messages.admin.fabricEdit.widthCm}</div>
              <Input value={widthCm} onChange={(e) => setWidthCm(e.target.value)} inputMode="numeric" />
            </div>
            <div className="space-y-2">
              <div className="text-xs font-semibold text-on-surface">{messages.admin.fabricEdit.moq}</div>
              <Input value={moq} onChange={(e) => setMoq(e.target.value)} inputMode="numeric" />
            </div>
            <div className="space-y-2">
              <div className="text-xs font-semibold text-on-surface">{messages.admin.fabricEdit.color}</div>
              <Input value={color} onChange={(e) => setColor(e.target.value)} />
            </div>
            <div className="space-y-2">
              <div className="text-xs font-semibold text-on-surface">{messages.admin.fabricEdit.colorEn}</div>
              <Input value={colorEn} onChange={(e) => setColorEn(e.target.value)} />
            </div>
            <div className="space-y-2">
              <div className="text-xs font-semibold text-on-surface">{messages.admin.fabricEdit.supplyType}</div>
              <Input value={supplyType} onChange={(e) => setSupplyType(e.target.value)} />
            </div>
            <div className="space-y-2">
              <div className="text-xs font-semibold text-on-surface">{messages.admin.fabricEdit.supplyTypeEn}</div>
              <Input value={supplyTypeEn} onChange={(e) => setSupplyTypeEn(e.target.value)} />
            </div>
            <div className="space-y-2">
              <div className="text-xs font-semibold text-on-surface">{messages.admin.fabricEdit.shipmentTime}</div>
              <Input value={shipmentTime} onChange={(e) => setShipmentTime(e.target.value)} />
            </div>
            <div className="space-y-2">
              <div className="text-xs font-semibold text-on-surface">{messages.admin.fabricEdit.shipmentTimeEn}</div>
              <Input value={shipmentTimeEn} onChange={(e) => setShipmentTimeEn(e.target.value)} />
            </div>
          </div>

          <div className="grid gap-4 sm:grid-cols-2">
            <div className="space-y-2">
              <div className="text-xs font-semibold text-on-surface">{messages.admin.fabricEdit.priceUsd}</div>
              <Input
                value={priceUsd}
                onChange={(e) => setPriceUsd(e.target.value)}
                placeholder={messages.admin.fabricEdit.pricePlaceholder}
              />
            </div>
            <div className="space-y-2">
              <div className="text-xs font-semibold text-on-surface">{messages.admin.fabricEdit.tags}</div>
              <Input value={tags} onChange={(e) => setTags(e.target.value)} placeholder={messages.admin.fabricEdit.tagsPlaceholder} />
            </div>
            <div className="space-y-2">
              <div className="text-xs font-semibold text-on-surface">{messages.admin.fabricEdit.tagsEn}</div>
              <Input value={tagsEn} onChange={(e) => setTagsEn(e.target.value)} placeholder={messages.admin.fabricEdit.tagsEnPlaceholder} />
            </div>
          </div>

          <div className="space-y-3">
            <div className="flex items-center justify-between">
              <div className="text-xs font-semibold text-on-surface">{messages.admin.fabricEdit.composition}</div>
              <Button
                type="button"
                variant="outline"
                onClick={() => setComposition((prev) => [...prev, { material: '', percentage: 0 }])}
              >
                {messages.admin.fabricEdit.addRow}
              </Button>
            </div>
            <div className="space-y-2">
              {composition.length === 0 ? (
                <div className="text-sm text-on-surface-variant">{messages.admin.fabricEdit.noComposition}</div>
              ) : null}
              {composition.map((row, idx) => (
                <div key={idx} className="grid gap-2 sm:grid-cols-12 items-center">
                  <div className="sm:col-span-7">
                    <Input
                      value={row.material}
                      onChange={(e) =>
                        setComposition((prev) => prev.map((r, i) => (i === idx ? { ...r, material: e.target.value } : r)))
                      }
                      placeholder={messages.admin.fabricEdit.materialPlaceholder}
                    />
                  </div>
                  <div className="sm:col-span-3">
                    <Input
                      value={String(row.percentage)}
                      onChange={(e) =>
                        setComposition((prev) =>
                          prev.map((r, i) => (i === idx ? { ...r, percentage: Number(e.target.value) || 0 } : r))
                        )
                      }
                      inputMode="numeric"
                      placeholder={messages.admin.fabricEdit.percentPlaceholder}
                    />
                  </div>
                  <div className="sm:col-span-2 flex justify-end">
                    <Button
                      type="button"
                      variant="outline"
                      className="border-red-200 text-red-700 hover:bg-red-50"
                      onClick={() => setComposition((prev) => prev.filter((_, i) => i !== idx))}
                    >
                      {messages.admin.fabricEdit.remove}
                    </Button>
                  </div>
                </div>
              ))}
            </div>
          </div>

          <button
            type="button"
            className="w-full rounded-lg border border-outline/20 bg-surface-container-low/50 px-4 py-3 text-left"
            onClick={() => setSeoOpen(!seoOpen)}
          >
            <div className="text-xs font-bold uppercase tracking-widest text-primary">
              {messages.admin.fabricEdit.seoSection}
            </div>
          </button>
          {seoOpen ? (
              <div className="space-y-4 border-t border-outline/10 p-4">
                <div className="grid gap-4 sm:grid-cols-2">
                  <div className="space-y-2">
                    <div className="text-xs font-semibold text-on-surface">{messages.admin.fabricEdit.metaTitleRu}</div>
                    <Input value={metaTitleRu} onChange={(e) => setMetaTitleRu(e.target.value)} />
                  </div>
                  <div className="space-y-2">
                    <div className="text-xs font-semibold text-on-surface">{messages.admin.fabricEdit.metaTitleEn}</div>
                    <Input value={metaTitleEn} onChange={(e) => setMetaTitleEn(e.target.value)} />
                  </div>
                </div>
                <div className="grid gap-4 sm:grid-cols-2">
                  <div className="space-y-2">
                    <div className="text-xs font-semibold text-on-surface">{messages.admin.fabricEdit.metaDescriptionRu}</div>
                    <Textarea value={metaDescriptionRu} onChange={(e) => setMetaDescriptionRu(e.target.value)} className="min-h-[80px]" />
                  </div>
                  <div className="space-y-2">
                    <div className="text-xs font-semibold text-on-surface">{messages.admin.fabricEdit.metaDescriptionEn}</div>
                    <Textarea value={metaDescriptionEn} onChange={(e) => setMetaDescriptionEn(e.target.value)} className="min-h-[80px]" />
                  </div>
                </div>
                <div className="grid gap-4 sm:grid-cols-2">
                  <div className="space-y-2">
                    <div className="text-xs font-semibold text-on-surface">Image Alt (RU)</div>
                    <Input value={imageAltRu} onChange={(e) => setImageAltRu(e.target.value)} />
                  </div>
                  <div className="space-y-2">
                    <div className="text-xs font-semibold text-on-surface">Image Alt (EN)</div>
                    <Input value={imageAltEn} onChange={(e) => setImageAltEn(e.target.value)} />
                  </div>
                </div>
              </div>
            ) : null}

          <div className="flex items-center gap-3">
            <Checkbox
              checked={isFeatured}
              onCheckedChange={(v) => setIsFeatured(v === true)}
              aria-label={messages.admin.fabricEdit.featuredAria}
            />
            <div className="text-sm text-on-surface">{messages.admin.fabricEdit.isFeatured}</div>
          </div>
        </form>

        <div className="lg:col-span-4 space-y-4">
          <div className="rounded-xl bg-surface-container-lowest p-5 shadow-sm">
            <div className="text-sm font-semibold text-on-surface">{messages.admin.fabricEdit.aiConfidence}</div>
            <div className="mt-2">
              {aiScore01 === null || Number.isNaN(aiScore01) ? (
                <div className="text-sm text-on-surface-variant">{messages.admin.fabricEdit.noAiConfidence}</div>
              ) : (
                <div className="text-2xl font-bold">
                  <span className={confidenceColor(aiScore01)}>{Math.round(aiScore01 * 100)}%</span>
                </div>
              )}
            </div>
            <div className="mt-2 text-xs text-on-surface-variant">{messages.admin.fabricEdit.aiConfidenceHint}</div>
            {fabric.ai_processed_at ? (
              <div className="mt-3 text-xs text-on-surface-variant">
                <span className="font-semibold">{messages.admin.fabricEdit.aiProcessedAt}:</span>{' '}
                {new Intl.DateTimeFormat('en-US', { dateStyle: 'medium', timeStyle: 'short' }).format(new Date(fabric.ai_processed_at))}
              </div>
            ) : null}
          </div>

          <div className="rounded-xl bg-surface-container-lowest p-5 shadow-sm space-y-4">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <Film className="h-4 w-4 text-primary" aria-hidden />
                <div className="text-sm font-semibold text-on-surface">AI Generated Videos & Media</div>
              </div>
              <Button
                type="button"
                variant="ghost"
                size="sm"
                className="h-7 w-7 p-0"
                onClick={() => void refetchGeneratedMedia()}
                disabled={isFetchingMedia}
                title="Refresh media"
              >
                <RefreshCw className={cn('h-3.5 w-3.5', isFetchingMedia && 'animate-spin')} />
              </Button>
            </div>

            {generatedMediaData?.videos && generatedMediaData.videos.length > 0 ? (
              <div className="space-y-3">
                {generatedMediaData.videos.map((vid) => (
                  <div key={vid.id} className="rounded-lg border border-outline/15 bg-surface-container-low p-3 space-y-2">
                    <div className="flex items-center justify-between text-xs">
                      <span className="font-bold text-primary">Video #{vid.id} ({vid.durationSeconds ?? 8}s)</span>
                      <Badge className="text-[10px] uppercase">{vid.status}</Badge>
                    </div>
                    {vid.url ? (
                      <video src={vid.url} controls className="w-full rounded-lg bg-black aspect-[9/16] max-h-[300px] object-cover" poster={vid.thumbnailUrl ?? undefined}>
                        Your browser does not support video playback.
                      </video>
                    ) : (
                      <p className="text-xs text-on-surface-variant italic">Generating video...</p>
                    )}
                  </div>
                ))}
              </div>
            ) : (
              <p className="text-xs text-on-surface-variant italic">No AI videos generated yet for this fabric. Use the video generation dialog above.</p>
            )}

            <div className="border-t border-outline/10 pt-4">
              <div className="mb-3 flex items-center gap-2">
                <ImagePlus className="h-4 w-4 text-primary" aria-hidden />
                <div className="text-sm font-semibold text-on-surface">AI Image Studio</div>
              </div>
              {hasMultipleSheets ? (
                <div className="mb-3 rounded-md border border-primary/20 bg-primary/5 px-2.5 py-1.5 text-[11px] leading-snug text-on-surface-variant">
                  Multiple fabric sheets detected in raw data — the <span className="font-semibold text-on-surface">Open Multi-Sheet Shot</span> is enabled and is also generated automatically on batch runs.
                </div>
              ) : null}
              <div className="space-y-2">
                {studioPromptTypes.map((type) => {
                  const total = imageCountsByType.total[type.type] ?? 0
                  const pending = imageCountsByType.pending[type.type] ?? 0
                  const generatingThisType = generateByTypeMutation.isPending && generateByTypeMutation.variables?.promptType === type.type
                  return (
                    <div key={type.type} className="space-y-2 rounded-lg border border-outline/15 bg-surface-container-low p-3">
                      <div className="flex items-center justify-between gap-2">
                        <span className="truncate text-xs font-semibold text-on-surface">{type.label}</span>
                        <Badge
                          intent={pending > 0 ? 'warning' : 'default'}
                          className="shrink-0 px-2 py-0.5 text-[9px]"
                        >
                          {total} generated{pending > 0 ? ` · ${pending} queued` : ''}
                        </Badge>
                      </div>
                      <div className="flex items-center gap-2">
                        <Button
                          type="button"
                          variant="outline"
                          size="sm"
                          className="h-8 flex-1 text-xs"
                          disabled={generateByTypeMutation.isPending}
                          onClick={() => generateByTypeMutation.mutate({ promptType: type.type, count: 1 })}
                        >
                          <RefreshCw className={cn('h-3.5 w-3.5', generatingThisType && 'animate-spin')} aria-hidden />
                          Regenerate
                        </Button>
                        <Select
                          value={String(imageGenCounts[type.type] ?? 3)}
                          onValueChange={(v) => setImageGenCounts((prev) => ({ ...prev, [type.type]: Number(v) }))}
                        >
                          <SelectTrigger className="h-8 w-[72px]" aria-label={`More ${type.label} count`}>
                            <SelectValue />
                          </SelectTrigger>
                          <SelectContent>
                            {[1, 2, 3, 5, 10].map((n) => (
                              <SelectItem key={n} value={String(n)}>
                                +{n}
                              </SelectItem>
                            ))}
                          </SelectContent>
                        </Select>
                        <Button
                          type="button"
                          size="sm"
                          className="h-8 flex-1 text-xs"
                          disabled={generateByTypeMutation.isPending}
                          onClick={() => generateByTypeMutation.mutate({ promptType: type.type, count: imageGenCounts[type.type] ?? 3 })}
                        >
                          <Plus className="h-3.5 w-3.5" aria-hidden />
                          Generate more
                        </Button>
                      </div>
                    </div>
                  )
                })}
              </div>
            </div>

            {generatedMediaData?.images && generatedMediaData.images.length > 0 ? (
              <div>
                <div className="text-xs font-semibold text-on-surface-variant mb-2">Generated Images ({generatedMediaData.images.length})</div>
                <div className="grid grid-cols-3 gap-2">
                  {generatedMediaData.images.map((img) => {
                    const label = ELITE_IMAGE_PROMPT_TYPES.find((t) => t.type === img.metadata?.promptType)?.label
                    return img.url ? (
                      <a key={img.id} href={img.url} target="_blank" rel="noopener noreferrer" className="relative aspect-square overflow-hidden rounded-md bg-surface-container-high border">
                        <img src={img.url} alt="" className="h-full w-full object-cover" />
                        {label ? (
                          <span className="absolute bottom-0 inset-x-0 truncate bg-black/50 px-1 py-0.5 text-[9px] font-semibold text-white">
                            {label}
                          </span>
                        ) : null}
                      </a>
                    ) : null
                  })}
                </div>
              </div>
            ) : null}
          </div>

          <div className="rounded-xl bg-surface-container-lowest p-5 shadow-sm">
            <div className="text-sm font-semibold text-on-surface">{messages.admin.fabricEdit.rawData}</div>
            <div className="mt-2 space-y-2 text-sm text-on-surface">
              <div className="break-words">
                <span className="font-semibold">{messages.admin.fabricEdit.sourceLabel}</span> {fabric.source_url ?? '—'}
              </div>
              <div>
                <span className="font-semibold">{messages.admin.fabricEdit.rawTitleLabel}</span> {fabric.raw_title ?? '—'}
              </div>
            </div>
          </div>
        </div>
      </div>

      <Dialog open={rejectOpen} onOpenChange={setRejectOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>{messages.admin.fabricEdit.rejectDialogTitle}</DialogTitle>
            <DialogDescription>{messages.admin.fabricEdit.rejectDialogDescription}</DialogDescription>
          </DialogHeader>
          <div className="mt-4 space-y-3">
            <Textarea value={rejectReason} onChange={(e) => setRejectReason(e.target.value)} className="min-h-[140px]" />
            <div className="flex items-center justify-end gap-2">
              <Button variant="outline" onClick={() => setRejectOpen(false)}>
                {messages.admin.fabricEdit.cancel}
              </Button>
              <Button
                variant="outline"
                className="border-red-200 text-red-700 hover:bg-red-50"
                onClick={() => rejectMutation.mutate(rejectReason.trim())}
                disabled={rejectMutation.isPending || rejectReason.trim().length < 3}
              >
                {messages.admin.fabricEdit.reject}
              </Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  )
}

