'use client'

import Link from 'next/link'
import { formatDistanceToNow } from 'date-fns'
import { toast } from 'sonner'
import { ArrowRight, GripVertical, Tag } from 'lucide-react'

import type { LeadStatus } from '@/types/marketplace.types'
import type { AdminKanbanLead } from '@/types/admin-leads-kanban.types'
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar'
import { useI18n } from '@/hooks/useI18n'
import { cn } from '@/lib/utils'

/* ─── Status colours ─────────────────────────────────────────────── */
const STATUS_STYLE: Record<LeadStatus, string> = {
  NEW:           'bg-blue-100 text-blue-700 dark:bg-blue-950/60 dark:text-blue-300',
  CONTACTED:     'bg-amber-100 text-amber-700 dark:bg-amber-950/60 dark:text-amber-300',
  QUALIFIED:     'bg-emerald-100 text-emerald-700 dark:bg-emerald-950/60 dark:text-emerald-300',
  PROPOSAL_SENT: 'bg-violet-100 text-violet-700 dark:bg-violet-950/60 dark:text-violet-300',
  NEGOTIATING:   'bg-orange-100 text-orange-700 dark:bg-orange-950/60 dark:text-orange-300',
  CLOSED_WON:    'bg-emerald-100 text-emerald-800 dark:bg-emerald-950/60 dark:text-emerald-200',
  CLOSED_LOST:   'bg-red-100 text-red-700 dark:bg-red-950/60 dark:text-red-300'
}

/* ─── Source colours ─────────────────────────────────────────────── */
const SOURCE_STYLE: Record<string, string> = {
  MARKETPLACE_INQUIRY: 'bg-primary/10 text-primary',
  SAMPLE_REQUEST:      'bg-amber-100 text-amber-700',
  SOCIAL_CAMPAIGN:     'bg-emerald-100 text-emerald-700',
  DIRECT_CONTACT:      'bg-secondary/10 text-secondary',
  MANUAL_ENTRY:        'bg-surface-container-high text-on-surface-variant'
}

function sourceCls(src: string) {
  return SOURCE_STYLE[src] ?? 'bg-surface-container-high text-on-surface-variant'
}

/* ─── Score bar colour ───────────────────────────────────────────── */
function scoreBarCls(score: number) {
  if (score >= 70) return 'bg-emerald-500'
  if (score >= 45) return 'bg-amber-500'
  return 'bg-red-400'
}

/* ─── Props ──────────────────────────────────────────────────────── */
export interface LeadCardProps {
  lead: AdminKanbanLead
  /** Spread onto the drag-handle element so dnd-kit can attach listeners */
  dragHandleProps?: React.HTMLAttributes<HTMLButtonElement>
  /** True while the card is being dragged (rendered as ghost placeholder) */
  isDragging?: boolean
  /** True when rendered inside the DragOverlay (no pointer events) */
  isOverlay?: boolean
}

/* ─── Card ───────────────────────────────────────────────────────── */
export function LeadCard({ lead, dragHandleProps, isDragging, isOverlay }: LeadCardProps) {
  const { messages } = useI18n()

  const createdAt = new Date(lead.created_at)
  const timeAgo = Number.isNaN(createdAt.getTime())
    ? '—'
    : formatDistanceToNow(createdAt, { addSuffix: true })

  const assignedName = lead.assigned_user?.name ?? messages.admin.leads.unassigned
  const initials = (assignedName.trim()[0] ?? 'U').toUpperCase()
  const scorePct = Math.max(0, Math.min(100, lead.score))

  if (isDragging) {
    /* Ghost placeholder — keeps the column from collapsing */
    return (
      <div className="h-[168px] rounded-2xl border-2 border-dashed border-outline/20 bg-surface-container-low/40" />
    )
  }

  return (
    <div
      className={cn(
        'group relative flex flex-col gap-3 rounded-2xl border border-outline/10 bg-background p-4',
        'shadow-[0_2px_12px_rgba(0,0,0,0.05)] transition-shadow hover:shadow-md',
        isOverlay && 'rotate-[1.5deg] scale-[1.03] shadow-xl ring-2 ring-primary/30'
      )}
    >
      {/* Drag handle + company header */}
      <div className="flex items-start gap-1.5">
        {/* Drag handle */}
        <button
          type="button"
          aria-label="Drag to reorder"
          className={cn(
            'mt-0.5 flex shrink-0 cursor-grab touch-none items-center rounded p-0.5',
            'text-outline/40 transition-colors hover:text-on-surface-variant active:cursor-grabbing',
            'focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary/50'
          )}
          {...dragHandleProps}
        >
          <GripVertical className="h-4 w-4" aria-hidden />
        </button>

        {/* Company + source */}
        <div className="flex min-w-0 flex-1 items-start justify-between gap-2">
          <Link
            href={`/admin/leads/${lead.id}`}
            className="min-w-0 flex-1 focus-visible:outline-none"
            tabIndex={isOverlay ? -1 : 0}
          >
            <p className="truncate text-sm font-bold text-on-surface group-hover:text-primary transition-colors">
              {lead.company_name}
            </p>
            <p className="mt-0.5 truncate text-xs text-on-surface-variant">{lead.contact_name}</p>
          </Link>
          <span
            className={cn(
              'shrink-0 rounded-full px-2 py-0.5 text-[9px] font-bold uppercase tracking-wide',
              sourceCls(lead.source)
            )}
          >
            {lead.source.replace(/_/g, ' ')}
          </span>
        </div>
      </div>

      {/* Score bar */}
      <div className="flex items-center gap-2">
        <div className="h-1.5 flex-1 overflow-hidden rounded-full bg-surface-container-high">
          <div
            className={cn('h-full rounded-full transition-all', scoreBarCls(scorePct))}
            style={{ width: `${scorePct}%` }}
          />
        </div>
        <span className="w-7 text-right font-mono text-[10px] font-bold text-on-surface-variant">
          {scorePct}
        </span>
      </div>

      {/* Fabric reference */}
      {lead.fabric ? (
        <div className="flex items-center gap-1.5 text-xs text-on-surface-variant">
          <Tag className="h-3 w-3 shrink-0" aria-hidden />
          <span className="truncate">{lead.fabric.title_ru}</span>
        </div>
      ) : null}

      {/* Footer: time + assignee */}
      <div className="flex items-center justify-between gap-2">
        <p className="text-[10px] tabular-nums text-on-surface-variant">{timeAgo}</p>
        <div className="flex items-center gap-1.5">
          <Avatar className="h-5 w-5">
            {lead.assigned_user?.avatar_url ? (
              <AvatarImage src={lead.assigned_user.avatar_url} alt={assignedName} />
            ) : null}
            <AvatarFallback className="text-[9px]">{initials}</AvatarFallback>
          </Avatar>
          <span className="max-w-[72px] truncate text-[10px] text-on-surface-variant">{assignedName}</span>
        </div>
      </div>

      {/* Status pill + open link */}
      <div className="flex items-center justify-between gap-2 border-t border-outline/8 pt-2.5">
        <span
          className={cn(
            'rounded-full px-2.5 py-0.5 text-[10px] font-bold uppercase tracking-wide',
            STATUS_STYLE[lead.status] ?? 'bg-surface-container-high text-on-surface-variant'
          )}
        >
          {lead.status.replace(/_/g, ' ')}
        </span>
        <Link
          href={`/admin/leads/${lead.id}`}
          className="flex items-center gap-0.5 text-[11px] font-semibold text-primary opacity-0 transition-opacity group-hover:opacity-100 focus-visible:opacity-100"
          tabIndex={isOverlay ? -1 : -1}
          aria-hidden
        >
          Open <ArrowRight className="h-3 w-3" />
        </Link>
      </div>
    </div>
  )
}
