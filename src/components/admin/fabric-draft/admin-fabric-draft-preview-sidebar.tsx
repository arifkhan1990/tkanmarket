'use client'

import * as React from 'react'
import { CheckCircle2, Circle, CircleCheck, ExternalLink, Loader2, Sparkles, XCircle } from 'lucide-react'

import { Button } from '@/components/ui/button'
import { cn } from '@/lib/utils'
import type { AdminFabricStatus } from '@/types/admin-fabric-management.types'
import type { FabricDraftPreviewChecklistItem } from '@/types/admin-fabric-draft-preview.types'

export interface DraftPreviewSidebarCopy {
  sku: string
  noSku: string
  supplier: string
  createdAt: string
  updatedAt: string
  aiProcessedAt: string
  openSource: string
  checklist: string
  readinessHint: string
  checkImages: string
  checkPrice: string
  checkSustainability: string
  checkComposition: string
  checkFabricType: string
  checkGsm: string
  checkDescriptionEn: string
  checkTagsEn: string
  checklistReadOnlyHint: string
  checklistStatusPass: string
  checklistStatusFail: string
  approve: string
  reject: string
}

export function AdminFabricDraftPreviewSidebar(props: {
  p: DraftPreviewSidebarCopy
  displayTitle: string
  fabric: {
    id: number
    sku: string | null
    supplier_name: string
    source_url: string | null
    created_at: string
    updated_at: string
    ai_processed_at: string | null
    status: AdminFabricStatus
    ai_confidence_score: string | null
  }
  statusLabel: string
  statusBadgeClass: string
  aiLabel: string
  aiBadgeClass: string
  confidencePercent: number | null
  checklist: FabricDraftPreviewChecklistItem[]
  checklistDone: number
  canApprove: boolean
  canReject: boolean
  isMutating: boolean
  onApprove: () => void
  onOpenReject: () => void
  formatDateTime: (iso: string | null) => string
  formatAiProcessedAt: (iso: string | null) => string
}) {
  const {
    p,
    displayTitle,
    fabric,
    statusLabel,
    statusBadgeClass,
    aiLabel,
    aiBadgeClass,
    confidencePercent,
    checklist,
    checklistDone,
    canApprove,
    canReject,
    isMutating,
    onApprove,
    onOpenReject,
    formatDateTime,
    formatAiProcessedAt
  } = props

  return (
    <aside className="w-full shrink-0 space-y-6 border-b border-outline/15 bg-surface-container-highest/40 p-6 lg:w-80 lg:border-b-0 lg:border-r">
      <div>
        <div className="flex items-center gap-2">
          <Sparkles className="h-4 w-4 shrink-0 text-primary" aria-hidden />
          <span className="font-mono text-[10px] font-bold uppercase tracking-widest text-outline">#{fabric.id}</span>
        </div>
        <h2 className="mt-2 line-clamp-2 font-heading text-lg font-extrabold tracking-tight text-on-surface">
          {displayTitle}
        </h2>
        <div className="mt-3 flex flex-wrap items-center gap-2">
          <span
            className={cn('rounded-full px-2.5 py-0.5 text-[10px] font-black uppercase tracking-wider', statusBadgeClass)}
          >
            {statusLabel}
          </span>
          <span
            className={cn('rounded-full px-2.5 py-0.5 text-[10px] font-black uppercase tracking-wider', aiBadgeClass)}
          >
            {confidencePercent != null ? `${confidencePercent}% · ` : ''}
            {aiLabel}
          </span>
        </div>
      </div>

      <div className="space-y-2 text-xs">
        <div className="flex items-baseline justify-between gap-2">
          <span className="text-on-surface-variant">{p.sku}</span>
          <span className="font-mono text-xs font-bold text-on-surface">
            {fabric.sku ?? <span className="italic text-on-surface-variant">{p.noSku}</span>}
          </span>
        </div>
        <div className="flex items-baseline justify-between gap-2">
          <span className="text-on-surface-variant">{p.supplier}</span>
          <span className="truncate font-bold text-on-surface" title={fabric.supplier_name}>
            {fabric.supplier_name}
          </span>
        </div>
        <div className="flex items-baseline justify-between gap-2">
          <span className="text-on-surface-variant">{p.createdAt}</span>
          <span className="font-mono text-[10px] text-on-surface">{formatDateTime(fabric.created_at)}</span>
        </div>
        <div className="flex items-baseline justify-between gap-2">
          <span className="text-on-surface-variant">{p.updatedAt}</span>
          <span className="font-mono text-[10px] text-on-surface">{formatDateTime(fabric.updated_at)}</span>
        </div>
        <div className="flex items-baseline justify-between gap-2">
          <span className="text-on-surface-variant">{p.aiProcessedAt}</span>
          <span className="font-mono text-[10px] text-on-surface">{formatAiProcessedAt(fabric.ai_processed_at)}</span>
        </div>
        {fabric.source_url ? (
          <div className="pt-2">
            <a
              href={fabric.source_url}
              target="_blank"
              rel="noopener noreferrer"
              className="inline-flex items-center gap-1 text-[11px] font-bold text-primary hover:underline"
            >
              <ExternalLink className="h-3 w-3" aria-hidden />
              {p.openSource}
            </a>
          </div>
        ) : null}
      </div>

      <div>
        <div className="mb-2 flex items-center justify-between gap-2">
          <h3 className="text-sm font-bold text-on-surface">{p.checklist}</h3>
          <span className="font-mono text-[10px] text-on-surface-variant">
            {p.readinessHint.replace('{done}', String(checklistDone)).replace('{total}', String(checklist.length))}
          </span>
        </div>
        <p className="mb-3 text-[11px] leading-snug text-on-surface-variant">{p.checklistReadOnlyHint}</p>
        <ul className="m-0 list-none space-y-2 p-0" role="list" aria-label={p.checklist}>
          {checklist.map((c) => {
            const label = checklistLabel(c.labelKey, p)
            const statusText = c.done ? p.checklistStatusPass : p.checklistStatusFail
            return (
              <li key={c.id} className="flex items-start gap-3">
                <span
                  className={cn(
                    'mt-0.5 flex h-5 w-5 shrink-0 items-center justify-center',
                    c.done ? 'text-emerald-600 dark:text-emerald-400' : 'text-on-surface-variant'
                  )}
                  aria-hidden
                >
                  {c.done ? <CircleCheck className="h-5 w-5" strokeWidth={2} /> : <Circle className="h-5 w-5" strokeWidth={2} />}
                </span>
                <span className="min-w-0 flex-1 text-xs font-medium leading-snug text-on-surface">
                  <span className="sr-only">{`${statusText}: `}</span>
                  {label}
                </span>
              </li>
            )
          })}
        </ul>
      </div>

      <div className="space-y-2 pt-2">
        <Button type="button" className="w-full gap-2" onClick={onApprove} disabled={!canApprove}>
          {isMutating ? <Loader2 className="h-4 w-4 animate-spin" aria-hidden /> : <CheckCircle2 className="h-4 w-4" aria-hidden />}
          {p.approve}
        </Button>
        <Button
          type="button"
          variant="outline"
          className="w-full gap-2"
          onClick={onOpenReject}
          disabled={!canReject}
        >
          <XCircle className="h-4 w-4" aria-hidden />
          {p.reject}
        </Button>
      </div>
    </aside>
  )
}

function checklistLabel(key: string, copy: DraftPreviewSidebarCopy): string {
  if (key === 'images') return copy.checkImages
  if (key === 'price') return copy.checkPrice
  if (key === 'sustainability') return copy.checkSustainability
  if (key === 'composition') return copy.checkComposition
  if (key === 'fabricType') return copy.checkFabricType
  if (key === 'gsm') return copy.checkGsm
  if (key === 'descriptionEn') return copy.checkDescriptionEn
  if (key === 'tagsEn') return copy.checkTagsEn
  return key
}

