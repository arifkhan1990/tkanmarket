'use client'

import * as React from 'react'
import { useRouter, useSearchParams } from 'next/navigation'
import { useMutation, useQueryClient } from '@tanstack/react-query'
import { formatDistanceToNow } from 'date-fns'
import {
  Check,
  CheckCircle2,
  Loader2,
  RefreshCw,
  Sparkles,
  X,
  XCircle
} from 'lucide-react'
import { toast } from 'sonner'

import {
  AdminFabricDraftPreviewHeader,
  type DraftPreviewViewportMode
} from '@/components/admin/fabric-draft/admin-fabric-draft-preview-header'
import { AdminFabricDraftPreviewPane } from '@/components/admin/fabric-draft/admin-fabric-draft-preview-pane'
import { AdminFabricDraftPreviewSidebar } from '@/components/admin/fabric-draft/admin-fabric-draft-preview-sidebar'
import { aiConfidenceBand, formatDateTime, statusBadgeClasses, statusLabel } from '@/components/admin/fabric-draft/admin-fabric-draft-preview-utils'
import { Button } from '@/components/ui/button'
import { Dialog, DialogClose, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog'
import { Skeleton } from '@/components/ui/skeleton'
import { Textarea } from '@/components/ui/textarea'
import { useAdminFabricDraftPreviewQuery } from '@/hooks/admin/useAdminFabricDraftPreviewQuery'
import { useI18n } from '@/hooks/useI18n'
import { interpolate } from '@/lib/i18n/interpolate'
import { withLocaleUrl } from '@/lib/i18n/locale-path'
import { cn } from '@/lib/utils'
import type { ApiEnvelope } from '@/types/api-envelope.types'
import type { AdminFabricStatus } from '@/types/admin-fabric-management.types'
import { DEFAULT_LOCALE, type Locale } from '@/types/i18n.types'

type Copy = ReturnType<typeof useI18n>['messages']['admin']['fabricDraftPreviewPage']

export function AdminFabricDraftPreviewClient({ locale }: { locale: Locale }) {
  const { messages } = useI18n()
  const p = messages.admin.fabricDraftPreviewPage
  const fabricMessages = messages.admin.fabricEdit
  const router = useRouter()
  const searchParams = useSearchParams()
  const queryClient = useQueryClient()

  const initialId = Number(searchParams.get('id') ?? '')
  const initialViewport: DraftPreviewViewportMode = searchParams.get('viewport') === 'mobile' ? 'mobile' : 'desktop'

  const [inputId, setInputId] = React.useState(() =>
    Number.isFinite(initialId) && initialId > 0 ? String(initialId) : ''
  )
  const [viewport, setViewport] = React.useState<DraftPreviewViewportMode>(initialViewport)
  const [activeImageIdx, setActiveImageIdx] = React.useState(0)
  const [rejectOpen, setRejectOpen] = React.useState(false)
  const [rejectReason, setRejectReason] = React.useState('')

  const fabricId = Number.isFinite(initialId) && initialId > 0 ? initialId : null
  const query = useAdminFabricDraftPreviewQuery(fabricId)
  const data = query.data

  // Reset gallery position when the underlying fabric changes.
  React.useEffect(() => {
    setActiveImageIdx(0)
  }, [data?.fabric.id])

  // Sync viewport into the URL.
  const updateViewportParam = React.useCallback(
    (next: DraftPreviewViewportMode) => {
      setViewport(next)
      const params = new URLSearchParams(searchParams.toString())
      if (next === 'mobile') params.set('viewport', 'mobile')
      else params.delete('viewport')
      router.replace(`?${params.toString()}`, { scroll: false })
    },
    [router, searchParams]
  )

  React.useEffect(() => {
    const id = Number(searchParams.get('id') ?? '')
    if (Number.isFinite(id) && id > 0) {
      setInputId(String(id))
    }
  }, [searchParams])

  const selectFabricId = React.useCallback(
    (id: number) => {
      setInputId(String(id))
      const params = new URLSearchParams(searchParams.toString())
      params.set('id', String(id))
      router.push(
        `${withLocaleUrl('/admin/fabric-draft-preview', locale ?? DEFAULT_LOCALE)}?${params.toString()}`
      )
    },
    [locale, router, searchParams]
  )

  const approveMutation = useMutation({
    mutationFn: async () => {
      if (fabricId == null) throw new Error('No fabric loaded')
      const res = await fetch(`/api/v1/admin/fabrics/${fabricId}/approve`, {
        method: 'POST',
        credentials: 'same-origin'
      })
      const json = (await res.json()) as ApiEnvelope<unknown>
      if (!res.ok || !json.success) {
        throw new Error(!json.success ? json.error.message : p.actionFailed)
      }
      return json.data
    },
    onSuccess: async () => {
      toast.success(p.approveSuccess)
      await queryClient.invalidateQueries({ queryKey: ['admin-fabric-draft-preview', fabricId] })
    }
  })

  const rejectMutation = useMutation({
    mutationFn: async (reason: string) => {
      if (fabricId == null) throw new Error('No fabric loaded')
      const res = await fetch(`/api/v1/admin/fabrics/${fabricId}/reject`, {
        method: 'POST',
        headers: { 'content-type': 'application/json' },
        credentials: 'same-origin',
        body: JSON.stringify({ reason })
      })
      const json = (await res.json()) as ApiEnvelope<unknown>
      if (!res.ok || !json.success) {
        throw new Error(!json.success ? json.error.message : p.actionFailed)
      }
      return json.data
    },
    onSuccess: async () => {
      toast.success(p.rejectSuccess)
      setRejectOpen(false)
      setRejectReason('')
      await queryClient.invalidateQueries({ queryKey: ['admin-fabric-draft-preview', fabricId] })
    }
  })

  React.useEffect(() => {
    const err = approveMutation.error ?? rejectMutation.error
    if (!err) return
    toast.error(err instanceof Error ? err.message : p.actionFailed)
  }, [approveMutation.error, p.actionFailed, rejectMutation.error])

  const submitReject = (e: React.FormEvent) => {
    e.preventDefault()
    const trimmed = rejectReason.trim()
    if (trimmed.length < 3) return
    rejectMutation.mutate(trimmed)
  }

  // ----------------------- render -----------------------
  if (fabricId == null) {
    return (
      <div className="space-y-6">
        <AdminFabricDraftPreviewHeader
          p={p}
          viewport={viewport}
          setViewport={updateViewportParam}
          locale={locale}
          fabricId={null}
          isFetching={query.isFetching}
          onRefresh={() => undefined}
          onSelectId={selectFabricId}
        />
        <p className="rounded-2xl border border-dashed border-outline/20 bg-surface-container-lowest p-10 text-center text-sm text-on-surface-variant">
          {p.emptyPrompt}
        </p>
      </div>
    )
  }

  if (query.isLoading && !data) {
    return (
      <div className="space-y-6">
        <AdminFabricDraftPreviewHeader
          p={p}
          viewport={viewport}
          setViewport={updateViewportParam}
          locale={locale}
          fabricId={fabricId}
          isFetching
          onRefresh={() => void query.refetch()}
          onSelectId={selectFabricId}
        />
        <div className="grid grid-cols-1 gap-6 lg:grid-cols-12">
          <Skeleton className="h-[420px] rounded-2xl lg:col-span-8" />
          <Skeleton className="h-[420px] rounded-2xl lg:col-span-4" />
        </div>
      </div>
    )
  }

  if (query.isError || !data) {
    return (
      <div className="mx-auto max-w-md py-16 text-center">
        <p className="text-sm text-destructive">{p.loadError}</p>
        <Button
          type="button"
          className="mt-4 rounded-xl"
          variant="outline"
          onClick={() => void query.refetch()}
        >
          <RefreshCw className="mr-2 h-4 w-4" aria-hidden />
          {p.retry}
        </Button>
      </div>
    )
  }

  const fabric = data.fabric
  const status = fabric.status as AdminFabricStatus
  const ai = aiConfidenceBand(fabric.ai_confidence_score, p)
  const confidencePercent =
    fabric.ai_confidence_score && Number.isFinite(Number(fabric.ai_confidence_score))
      ? Math.round(Number(fabric.ai_confidence_score) * 100)
      : null
  const checklistDone = data.checklist.filter((c) => c.done).length
  const isMutating = approveMutation.isPending || rejectMutation.isPending
  const canApprove = status !== 'approved' && !isMutating
  const canReject = status !== 'rejected' && !isMutating

  return (
    <div className="space-y-6">
      <AdminFabricDraftPreviewHeader
        p={p}
        viewport={viewport}
        setViewport={updateViewportParam}
        locale={locale}
        fabricId={fabricId}
        isFetching={query.isFetching}
        onRefresh={() => void query.refetch()}
        onSelectId={selectFabricId}
      />

      <div
        className={cn(
          'flex min-h-[min(760px,88vh)] flex-col overflow-hidden rounded-[1.5rem] border border-outline/15 bg-surface-container-low shadow-sm lg:flex-row'
        )}
      >
        {/* LEFT — Admin sidebar (status, checklist, actions, metadata) */}
        <AdminFabricDraftPreviewSidebar
          p={p}
          displayTitle={data.displayTitle}
          fabric={{
            id: fabric.id,
            sku: fabric.sku ?? null,
            supplier_name: fabric.supplier_name,
            source_url: fabric.source_url ?? null,
            created_at: fabric.created_at,
            updated_at: fabric.updated_at,
            ai_processed_at: fabric.ai_processed_at,
            status,
            ai_confidence_score: fabric.ai_confidence_score
          }}
          statusLabel={statusLabel(status, p)}
          statusBadgeClass={statusBadgeClasses(status)}
          aiLabel={ai.label}
          aiBadgeClass={ai.color}
          confidencePercent={confidencePercent}
          checklist={data.checklist}
          checklistDone={checklistDone}
          canApprove={canApprove}
          canReject={canReject}
          isMutating={isMutating}
          onApprove={() => approveMutation.mutate()}
          onOpenReject={() => setRejectOpen(true)}
          formatDateTime={(iso) => formatDateTime(iso, locale)}
          formatAiProcessedAt={(iso) =>
            iso ? formatDistanceToNow(new Date(iso), { addSuffix: true }) : '—'
          }
        />

        <AdminFabricDraftPreviewPane
          viewport={viewport}
          p={p}
          fabric={fabric}
          displayTitle={data.displayTitle}
          activeImageIdx={activeImageIdx}
          setActiveImageIdx={setActiveImageIdx}
          generatedImages={data.generatedImages}
          generatedVideos={data.generatedVideos}
        />
      </div>

      {/* Reject reason dialog */}
      <Dialog open={rejectOpen} onOpenChange={setRejectOpen}>
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle className="font-heading text-lg font-extrabold tracking-tight text-on-surface">
              {p.rejectDialogTitle}
            </DialogTitle>
          </DialogHeader>
          <p className="mt-2 text-sm text-on-surface-variant">{p.rejectDialogBody}</p>
          <form onSubmit={submitReject} className="mt-4 space-y-3">
            <Textarea
              value={rejectReason}
              onChange={(e) => setRejectReason(e.target.value)}
              placeholder={p.rejectReasonPlaceholder}
              className="min-h-[120px] rounded-xl"
              minLength={3}
              maxLength={2000}
              disabled={rejectMutation.isPending}
              aria-label={p.rejectReasonPlaceholder}
            />
            <div className="flex justify-end gap-2">
              <DialogClose asChild>
                <Button type="button" variant="ghost" size="sm" className="rounded-xl">
                  <X className="mr-2 h-4 w-4" aria-hidden />
                  {p.cancel}
                </Button>
              </DialogClose>
              <Button
                type="submit"
                size="sm"
                variant="destructive"
                className="rounded-xl"
                disabled={rejectMutation.isPending || rejectReason.trim().length < 3}
              >
                {rejectMutation.isPending ? (
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" aria-hidden />
                ) : (
                  <XCircle className="mr-2 h-4 w-4" aria-hidden />
                )}
                {fabricMessages.reject}
              </Button>
            </div>
          </form>
        </DialogContent>
      </Dialog>
    </div>
  )
}
