'use client'

import * as React from 'react'
import { toast } from 'sonner'
import { InboxIcon, Trophy, XCircle } from 'lucide-react'
import {
  DndContext,
  DragOverlay,
  PointerSensor,
  KeyboardSensor,
  TouchSensor,
  closestCorners,
  useSensor,
  useSensors,
  useDroppable,
  type DragStartEvent,
  type DragOverEvent,
  type DragEndEvent
} from '@dnd-kit/core'
import {
  SortableContext,
  sortableKeyboardCoordinates,
  useSortable,
  verticalListSortingStrategy
} from '@dnd-kit/sortable'
import { CSS } from '@dnd-kit/utilities'
import { useQueryClient } from '@tanstack/react-query'

import { LeadCard } from '@/components/admin/LeadCard'
import { useAdminLeadsKanban } from '@/hooks/admin/useAdminLeadsKanban'
import type { AdminKanbanLead, AdminLeadsKanbanResponse, LeadKanbanColumnKey } from '@/types/admin-leads-kanban.types'
import type { LeadSource, LeadStatus } from '@/types/marketplace.types'
import { useI18n } from '@/hooks/useI18n'
import { Button } from '@/components/ui/button'
import { cn } from '@/lib/utils'

/* ─── Constants ───────────────────────────────────────────────────── */
const COLUMN_KEYS: LeadKanbanColumnKey[] = [
  'NEW', 'CONTACTED', 'QUALIFIED', 'PROPOSAL_SENT', 'NEGOTIATING', 'CLOSED'
]

/** Maps a column key to the LeadStatus to PATCH when dropped there.
 *  CLOSED is handled separately via the WonLost dialog. */
const COLUMN_TO_STATUS: Record<Exclude<LeadKanbanColumnKey, 'CLOSED'>, LeadStatus> = {
  NEW:           'NEW',
  CONTACTED:     'CONTACTED',
  QUALIFIED:     'QUALIFIED',
  PROPOSAL_SENT: 'PROPOSAL_SENT',
  NEGOTIATING:   'NEGOTIATING'
}

/** Inverse: which column a given status belongs to */
function statusToColumn(status: LeadStatus): LeadKanbanColumnKey {
  if (status === 'CLOSED_WON' || status === 'CLOSED_LOST') return 'CLOSED'
  return status as LeadKanbanColumnKey
}

/* ─── Column accent / count colours ─────────────────────────────── */
const COL_ACCENT: Record<LeadKanbanColumnKey, string> = {
  NEW:           'bg-blue-500',
  CONTACTED:     'bg-amber-500',
  QUALIFIED:     'bg-emerald-500',
  PROPOSAL_SENT: 'bg-violet-500',
  NEGOTIATING:   'bg-orange-500',
  CLOSED:        'bg-slate-400'
}

const COL_COUNT_BG: Record<LeadKanbanColumnKey, string> = {
  NEW:           'bg-blue-100 text-blue-700',
  CONTACTED:     'bg-amber-100 text-amber-700',
  QUALIFIED:     'bg-emerald-100 text-emerald-700',
  PROPOSAL_SENT: 'bg-violet-100 text-violet-700',
  NEGOTIATING:   'bg-orange-100 text-orange-700',
  CLOSED:        'bg-slate-100 text-slate-600'
}

const COL_DROP_RING: Record<LeadKanbanColumnKey, string> = {
  NEW:           'ring-blue-400/60',
  CONTACTED:     'ring-amber-400/60',
  QUALIFIED:     'ring-emerald-400/60',
  PROPOSAL_SENT: 'ring-violet-400/60',
  NEGOTIATING:   'ring-orange-400/60',
  CLOSED:        'ring-slate-400/60'
}

/* ─── Local columns state type ─────────────────────────────────────── */
type LocalColumns = Record<LeadKanbanColumnKey, AdminKanbanLead[]>

function buildLocalColumns(data: AdminLeadsKanbanResponse | undefined): LocalColumns {
  const empty: LocalColumns = { NEW: [], CONTACTED: [], QUALIFIED: [], PROPOSAL_SENT: [], NEGOTIATING: [], CLOSED: [] }
  if (!data) return empty
  return { ...empty, ...data.columns }
}

function findColumnOf(cols: LocalColumns, leadId: number): LeadKanbanColumnKey | null {
  for (const key of COLUMN_KEYS) {
    if (cols[key].some((l) => l.id === leadId)) return key
  }
  return null
}

/* ─── Won / Lost confirmation dialog ──────────────────────────────── */
interface WonLostDialogProps {
  companyName: string
  onWon: () => void
  onLost: () => void
  onCancel: () => void
}

function WonLostDialog({ companyName, onWon, onLost, onCancel }: WonLostDialogProps) {
  React.useEffect(() => {
    function handleKey(e: KeyboardEvent) {
      if (e.key === 'Escape') onCancel()
    }
    window.addEventListener('keydown', handleKey)
    return () => window.removeEventListener('keydown', handleKey)
  }, [onCancel])

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 backdrop-blur-sm"
      onClick={onCancel}
    >
      <div
        className="mx-4 w-full max-w-sm rounded-2xl border border-outline/15 bg-background p-6 shadow-2xl"
        onClick={(e) => e.stopPropagation()}
        role="dialog"
        aria-modal
        aria-labelledby="wonlost-title"
      >
        <p className="text-xs font-semibold uppercase tracking-widest text-on-surface-variant">Close lead</p>
        <h2 id="wonlost-title" className="mt-1 text-base font-bold text-on-surface">
          {companyName}
        </h2>
        <p className="mt-2 text-sm text-on-surface-variant">
          Mark this lead as won or lost?
        </p>
        <div className="mt-5 flex gap-3">
          <Button
            type="button"
            className="flex-1 gap-2 rounded-xl bg-emerald-600 text-white hover:bg-emerald-700"
            onClick={onWon}
          >
            <Trophy className="h-4 w-4" />
            Won
          </Button>
          <Button
            type="button"
            variant="destructive"
            className="flex-1 gap-2 rounded-xl"
            onClick={onLost}
          >
            <XCircle className="h-4 w-4" />
            Lost
          </Button>
        </div>
        <button
          type="button"
          onClick={onCancel}
          className="mt-3 w-full rounded-xl py-2 text-sm text-on-surface-variant transition-colors hover:text-on-surface"
        >
          Cancel — keep in current stage
        </button>
      </div>
    </div>
  )
}

/* ─── Droppable column wrapper ─────────────────────────────────────── */
function DroppableColumn({
  colKey,
  isOver,
  children
}: {
  colKey: LeadKanbanColumnKey
  isOver: boolean
  children: React.ReactNode
}) {
  const { setNodeRef } = useDroppable({ id: colKey })
  return (
    <div
      ref={setNodeRef}
      className={cn(
        'flex-1 space-y-2.5 overflow-y-auto p-3 transition-all duration-150',
        isOver && 'rounded-xl ring-2 ring-inset',
        isOver && COL_DROP_RING[colKey]
      )}
    >
      {children}
    </div>
  )
}

/* ─── Sortable card wrapper ─────────────────────────────────────────── */
function SortableLeadCard({ lead }: { lead: AdminKanbanLead }) {
  const { attributes, listeners, setNodeRef, transform, transition, isDragging } = useSortable({
    id: lead.id,
    data: { type: 'card', lead }
  })

  const style: React.CSSProperties = {
    transform: CSS.Transform.toString(transform),
    transition
  }

  return (
    <div ref={setNodeRef} style={style} {...attributes}>
      <LeadCard lead={lead} dragHandleProps={listeners} isDragging={isDragging} />
    </div>
  )
}

/* ─── Column skeleton ─────────────────────────────────────────────── */
function KanbanSkeleton() {
  return (
    <div className="flex gap-4 overflow-x-auto pb-4">
      {COLUMN_KEYS.map((k) => (
        <div
          key={k}
          className="min-w-[272px] max-w-[300px] shrink-0 overflow-hidden rounded-2xl border border-outline/10 bg-surface-container-lowest shadow-sm"
        >
          <div className={cn('h-1 animate-pulse', COL_ACCENT[k])} />
          <div className="space-y-3 p-4">
            <div className="h-4 w-28 animate-pulse rounded bg-surface-container-high" />
            {Array.from({ length: 3 }).map((_, j) => (
              <div key={j} className="h-[168px] animate-pulse rounded-2xl bg-surface-container-high" />
            ))}
          </div>
        </div>
      ))}
    </div>
  )
}

/* ─── Client-side search/source filter ──────────────────────────────── */
function matchesFilter(lead: AdminKanbanLead, query: string, source: LeadSource | ''): boolean {
  if (source && lead.source !== source) return false
  const q = query.trim().toLowerCase()
  if (!q) return true
  return (
    lead.company_name.toLowerCase().includes(q) ||
    lead.contact_name.toLowerCase().includes(q) ||
    lead.email.toLowerCase().includes(q)
  )
}

/* ─── Pending close state ──────────────────────────────────────────── */
interface PendingClose {
  leadId: number
  companyName: string
  fromCol: LeadKanbanColumnKey
}

/* ─── Main board ─────────────────────────────────────────────────── */
export function LeadKanbanBoard({
  query,
  source
}: {
  query: string
  source?: LeadSource | ''
}) {
  const { messages } = useI18n()
  const labels = messages.admin.leadKanban.columns
  const kanbanQuery = useAdminLeadsKanban()
  const qc = useQueryClient()

  /* ── Optimistic local state ── */
  const [localColumns, setLocalColumns] = React.useState<LocalColumns>(() =>
    buildLocalColumns(kanbanQuery.data)
  )

  /* Sync local state from server when not mid-drag */
  const isDraggingRef = React.useRef(false)
  React.useEffect(() => {
    if (!isDraggingRef.current && kanbanQuery.data) {
      setLocalColumns(buildLocalColumns(kanbanQuery.data))
    }
  }, [kanbanQuery.data])

  /* Snapshot for rollback */
  const snapshotRef = React.useRef<LocalColumns>(localColumns)

  /* Active card (for DragOverlay) */
  const [activeCard, setActiveCard] = React.useState<AdminKanbanLead | null>(null)

  /* Over-column tracking (for column highlight) */
  const [overColumn, setOverColumn] = React.useState<LeadKanbanColumnKey | null>(null)

  /* Pending CLOSED confirmation */
  const [pendingClose, setPendingClose] = React.useState<PendingClose | null>(null)

  /* ── Sensors ── */
  const sensors = useSensors(
    useSensor(PointerSensor, { activationConstraint: { distance: 8 } }),
    useSensor(TouchSensor, { activationConstraint: { delay: 200, tolerance: 8 } }),
    useSensor(KeyboardSensor, { coordinateGetter: sortableKeyboardCoordinates })
  )

  /* ── Helpers ── */
  function resolveOverColumn(overId: string | number): LeadKanbanColumnKey | null {
    if (COLUMN_KEYS.includes(overId as LeadKanbanColumnKey)) {
      return overId as LeadKanbanColumnKey
    }
    return findColumnOf(localColumns, Number(overId))
  }

  /* ── Drag start ── */
  function handleDragStart({ active }: DragStartEvent) {
    isDraggingRef.current = true
    snapshotRef.current = localColumns
    const lead = active.data.current?.lead as AdminKanbanLead | undefined
    if (lead) setActiveCard(lead)
  }

  /* ── Drag over — cross-column preview ── */
  function handleDragOver({ active, over }: DragOverEvent) {
    if (!over) { setOverColumn(null); return }

    const activeId = active.id as number
    const toCol = resolveOverColumn(over.id)
    const fromCol = findColumnOf(localColumns, activeId)

    setOverColumn(toCol)

    if (!fromCol || !toCol || fromCol === toCol) return

    setLocalColumns((prev) => {
      const card = prev[fromCol].find((l) => l.id === activeId)
      if (!card) return prev

      const overIsCard = !COLUMN_KEYS.includes(over.id as LeadKanbanColumnKey)
      const destCards = prev[toCol].filter((l) => l.id !== activeId)

      let insertIdx = destCards.length
      if (overIsCard) {
        const overIdx = destCards.findIndex((l) => l.id === Number(over.id))
        if (overIdx !== -1) insertIdx = overIdx
      }

      const newDest = [...destCards]
      newDest.splice(insertIdx, 0, card)

      return {
        ...prev,
        [fromCol]: prev[fromCol].filter((l) => l.id !== activeId),
        [toCol]: newDest
      }
    })
  }

  /* ── API call helper ── */
  async function patchLeadStatus(leadId: number, status: LeadStatus): Promise<void> {
    const res = await fetch(`/api/v1/admin/leads/${leadId}`, {
      method: 'PATCH',
      headers: { 'content-type': 'application/json' },
      credentials: 'same-origin',
      body: JSON.stringify({ action: 'update_status', status })
    })
    const json = (await res.json()) as { success: boolean; error?: { message: string } }
    if (!res.ok || !json.success) {
      throw new Error(json.error?.message ?? 'Failed to update status')
    }
  }

  function revertAndToast(msg: string) {
    setLocalColumns(snapshotRef.current)
    toast.error(msg)
  }

  /* ── Drag end ── */
  function handleDragEnd({ active }: DragEndEvent) {
    isDraggingRef.current = false
    setActiveCard(null)
    setOverColumn(null)

    const leadId = active.id as number
    const fromCol = findColumnOf(snapshotRef.current, leadId)
    const toCol = findColumnOf(localColumns, leadId)

    if (!fromCol || !toCol || fromCol === toCol) return

    if (toCol === 'CLOSED') {
      /* Ask Won or Lost */
      const lead = snapshotRef.current[fromCol]?.find((l) => l.id === leadId)
      setPendingClose({ leadId, companyName: lead?.company_name ?? `#${leadId}`, fromCol })
      return
    }

    const newStatus = COLUMN_TO_STATUS[toCol as Exclude<LeadKanbanColumnKey, 'CLOSED'>]
    patchLeadStatus(leadId, newStatus)
      .then(() => {
        toast.success(`Moved to ${toCol.replace(/_/g, ' ')}`)
        return qc.invalidateQueries({ queryKey: ['admin-leads-kanban'] })
      })
      .catch((err: unknown) => {
        revertAndToast(err instanceof Error ? err.message : 'Failed to update status')
      })
  }

  /* ── Won / Lost confirmation ── */
  function confirmClose(status: LeadStatus) {
    if (!pendingClose) return
    const { leadId, fromCol } = pendingClose
    setPendingClose(null)

    patchLeadStatus(leadId, status)
      .then(() => {
        toast.success(status === 'CLOSED_WON' ? '🏆 Closed as Won!' : 'Closed as Lost')
        return qc.invalidateQueries({ queryKey: ['admin-leads-kanban'] })
      })
      .catch((err: unknown) => {
        revertAndToast(err instanceof Error ? err.message : 'Failed to close lead')
      })
  }

  function cancelClose() {
    if (!pendingClose) return
    setLocalColumns(snapshotRef.current)
    setPendingClose(null)
  }

  /* ── Early return: loading ── */
  if (kanbanQuery.isLoading && !kanbanQuery.data) return <KanbanSkeleton />

  return (
    <>
      <DndContext
        sensors={sensors}
        collisionDetection={closestCorners}
        onDragStart={handleDragStart}
        onDragOver={handleDragOver}
        onDragEnd={handleDragEnd}
      >
        <div className="flex gap-4 overflow-x-auto pb-6 [-ms-overflow-style:none] [scrollbar-width:thin]">
          {COLUMN_KEYS.map((colKey) => {
            const allItems = localColumns[colKey]
            const filtered = allItems.filter((l) => matchesFilter(l, query, source ?? ''))
            const count = filtered.length
            const label = labels[colKey as keyof typeof labels] ?? colKey
            const isOver = overColumn === colKey

            return (
              <div
                key={colKey}
                className={cn(
                  'flex max-h-[min(76vh,780px)] min-w-[272px] max-w-[300px] shrink-0 flex-col',
                  'overflow-hidden rounded-2xl border border-outline/10 bg-surface-container-lowest shadow-sm',
                  'transition-[box-shadow] duration-150',
                  isOver && 'shadow-lg'
                )}
              >
                {/* Accent stripe */}
                <div className={cn('h-1 shrink-0', COL_ACCENT[colKey])} />

                {/* Column header */}
                <div className="flex items-center justify-between gap-2 border-b border-outline/10 px-4 py-3">
                  <span className="text-xs font-bold tracking-tight text-on-surface">{label}</span>
                  <span
                    className={cn(
                      'rounded-full px-2 py-0.5 font-mono text-[10px] font-bold leading-none',
                      COL_COUNT_BG[colKey]
                    )}
                  >
                    {count}
                  </span>
                </div>

                {/* Droppable + cards */}
                <SortableContext
                  items={filtered.map((l) => l.id)}
                  strategy={verticalListSortingStrategy}
                >
                  <DroppableColumn colKey={colKey} isOver={isOver}>
                    {filtered.length === 0 ? (
                      <div
                        className={cn(
                          'flex flex-col items-center gap-2 py-8 text-center',
                          'rounded-xl border-2 border-dashed border-outline/15 transition-colors',
                          isOver && 'border-outline/40 bg-surface-container-low/30'
                        )}
                      >
                        <InboxIcon className="h-5 w-5 text-outline" aria-hidden />
                        <p className="text-xs text-on-surface-variant">
                          {isOver ? 'Drop here' : messages.admin.leadKanban.noLeads}
                        </p>
                      </div>
                    ) : (
                      filtered.map((lead) => (
                        <SortableLeadCard key={lead.id} lead={lead} />
                      ))
                    )}
                  </DroppableColumn>
                </SortableContext>
              </div>
            )
          })}
        </div>

        {/* Drag overlay — ghost card following cursor */}
        <DragOverlay dropAnimation={{ duration: 180, easing: 'cubic-bezier(0.18, 0.67, 0.6, 1.22)' }}>
          {activeCard ? (
            <LeadCard lead={activeCard} isOverlay />
          ) : null}
        </DragOverlay>
      </DndContext>

      {/* Won / Lost dialog */}
      {pendingClose ? (
        <WonLostDialog
          companyName={pendingClose.companyName}
          onWon={() => confirmClose('CLOSED_WON')}
          onLost={() => confirmClose('CLOSED_LOST')}
          onCancel={cancelClose}
        />
      ) : null}
    </>
  )
}
