'use client'

import * as React from 'react'
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import { toast } from 'sonner'
import { formatDistanceToNow } from 'date-fns'
import {
  ArrowRight,
  CheckCircle2,
  MessageSquare,
  PlusCircle,
  Trash2,
  UserCheck,
  Zap
} from 'lucide-react'

import { AdminDeleteConfirmDialog } from '@/components/admin/admin-delete-confirm-dialog'
import type { ApiEnvelope } from '@/types/api-envelope.types'
import type { LeadActivity, LeadDetail, LeadNote } from '@/types/lead.types'
import { useI18n } from '@/hooks/useI18n'
import { cn } from '@/lib/utils'

/* ─── Timeline entry union ───────────────────────────────────────── */
type TimelineEntry =
  | { kind: 'activity'; id: string; createdAt: string; activity: LeadActivity }
  | { kind: 'note'; id: string; createdAt: string; note: LeadNote }

/* ─── Event icon + accent ────────────────────────────────────────── */
function entryMeta(entry: TimelineEntry): {
  Icon: React.ElementType
  dotCls: string
  iconCls: string
  bgCls: string
} {
  if (entry.kind === 'note') {
    return {
      Icon: MessageSquare,
      dotCls: 'bg-primary',
      iconCls: 'text-primary',
      bgCls: 'bg-primary/8'
    }
  }
  const t = entry.activity.eventType.toLowerCase()
  if (t === 'status_changed' || t === 'status_updated') {
    return {
      Icon: ArrowRight,
      dotCls: 'bg-amber-500',
      iconCls: 'text-amber-600',
      bgCls: 'bg-amber-50 dark:bg-amber-950/30'
    }
  }
  if (t === 'assigned') {
    return {
      Icon: UserCheck,
      dotCls: 'bg-violet-500',
      iconCls: 'text-violet-600',
      bgCls: 'bg-violet-50 dark:bg-violet-950/30'
    }
  }
  if (t === 'created') {
    return {
      Icon: PlusCircle,
      dotCls: 'bg-emerald-500',
      iconCls: 'text-emerald-600',
      bgCls: 'bg-emerald-50 dark:bg-emerald-950/30'
    }
  }
  if (t === 'note_added') {
    return {
      Icon: CheckCircle2,
      dotCls: 'bg-secondary',
      iconCls: 'text-secondary',
      bgCls: 'bg-secondary/8'
    }
  }
  return {
    Icon: Zap,
    dotCls: 'bg-outline',
    iconCls: 'text-on-surface-variant',
    bgCls: 'bg-surface-container-high'
  }
}

/* ─── Template filler ────────────────────────────────────────────── */
function fillTemplate(tpl: string, vars: Record<string, string>) {
  return tpl.replace(/\{(\w+)\}/g, (_, k: string) => vars[k] ?? _)
}

function describeActivity(
  a: LeadActivity,
  m: ReturnType<typeof useI18n>['messages']
): string {
  const t = a.eventType.toLowerCase()
  if (t === 'status_changed' || t === 'status_updated') {
    const p = a.payload as { from?: string; to?: string } | null
    if (p?.from && p?.to) {
      return fillTemplate(m.admin.leadsTimeline.statusChangedFromToTemplate, {
        from: p.from.replace(/_/g, ' '),
        to: p.to.replace(/_/g, ' ')
      })
    }
    return m.admin.leadsTimeline.statusChanged
  }
  if (t === 'note_added') return m.admin.leadsTimeline.noteAdded
  if (t === 'assigned') return m.admin.leadsTimeline.assigned
  return a.eventType.replace(/_/g, ' ')
}

/* ─── Skeleton ───────────────────────────────────────────────────── */
function TimelineSkeleton() {
  return (
    <div className="space-y-4">
      {Array.from({ length: 4 }).map((_, i) => (
        <div key={i} className="flex items-start gap-3">
          <div className="mt-0.5 h-8 w-8 animate-pulse rounded-full bg-surface-container-high" />
          <div className="flex-1 space-y-1.5 pt-1">
            <div className="h-3 w-3/4 animate-pulse rounded bg-surface-container-high" />
            <div className="h-2.5 w-1/2 animate-pulse rounded bg-surface-container-high" />
          </div>
        </div>
      ))}
    </div>
  )
}

/* ─── Main component ─────────────────────────────────────────────── */
export function LeadActivityTimeline({ leadId }: { leadId: number }) {
  const { messages } = useI18n()
  const m = messages.admin.leadsTimeline
  const qc = useQueryClient()

  const query = useQuery({
    queryKey: ['admin-lead-detail', leadId],
    queryFn: async () => {
      const res = await fetch(`/api/v1/admin/leads/${leadId}`, { credentials: 'same-origin' })
      const json = (await res.json()) as ApiEnvelope<LeadDetail>
      if (!res.ok || !json.success) {
        throw new Error(!json.success ? json.error.message : m.requestFailed)
      }
      return json
    },
    enabled: leadId > 0,
    refetchInterval: 30_000,
    staleTime: 20_000
  })

  const deleteNote = useMutation({
    mutationFn: async (noteId: number) => {
      const res = await fetch(`/api/v1/admin/leads/${leadId}/notes/${noteId}`, {
        method: 'DELETE',
        credentials: 'same-origin'
      })
      const json = (await res.json()) as ApiEnvelope<{ deleted: boolean }>
      if (!res.ok || !json.success) throw new Error(!json.success ? json.error.message : 'Failed to delete note')
    },
    onMutate: async (noteId) => {
      await qc.cancelQueries({ queryKey: ['admin-lead-detail', leadId] })
      const prev = qc.getQueryData<ApiEnvelope<LeadDetail>>(['admin-lead-detail', leadId])
      if (prev?.success) {
        qc.setQueryData<ApiEnvelope<LeadDetail>>(['admin-lead-detail', leadId], {
          success: true,
          data: { ...prev.data, notes: prev.data.notes.filter((n) => n.id !== noteId) }
        })
      }
      return { prev }
    },
    onError: (err, _id, ctx) => {
      if (ctx?.prev) qc.setQueryData(['admin-lead-detail', leadId], ctx.prev)
      toast.error(err instanceof Error ? err.message : 'Failed to delete note')
    },
    onSuccess: () => {
      toast.success('Note deleted')
      void qc.invalidateQueries({ queryKey: ['admin-lead-detail', leadId] })
    }
  })

  React.useEffect(() => {
    if (!query.error) return
    toast.error(query.error instanceof Error ? query.error.message : m.failedToLoad)
  }, [query.error, m.failedToLoad])

  const detail = query.data?.success ? query.data.data : null

  const entries = React.useMemo<TimelineEntry[]>(() => {
    const list: TimelineEntry[] = []
    for (const a of detail?.activity ?? []) {
      list.push({ kind: 'activity', id: `a-${a.id}`, createdAt: a.createdAt, activity: a })
    }
    for (const n of detail?.notes ?? []) {
      list.push({ kind: 'note', id: `n-${n.id}`, createdAt: n.createdAt, note: n })
    }
    return list.sort((x, y) =>
      x.createdAt > y.createdAt ? -1 : x.createdAt < y.createdAt ? 1 : 0
    )
  }, [detail?.activity, detail?.notes])

  return (
    <div>
      <div className="mb-4 flex items-center justify-between">
        <h3 className="text-sm font-bold text-on-surface">{m.title}</h3>
        {entries.length > 0 && (
          <span className="rounded-full bg-surface-container-high px-2 py-0.5 font-mono text-[10px] font-bold text-on-surface-variant">
            {entries.length}
          </span>
        )}
      </div>

      {query.isLoading && !detail ? (
        <TimelineSkeleton />
      ) : entries.length === 0 ? (
        <p className="py-8 text-center text-sm text-on-surface-variant">{m.empty}</p>
      ) : (
        <ol className="relative space-y-0">
          {entries.map((entry, idx) => {
            const { Icon, dotCls, iconCls, bgCls } = entryMeta(entry)
            const createdAt = new Date(entry.createdAt)
            const timeAgo = Number.isNaN(createdAt.getTime())
              ? '—'
              : formatDistanceToNow(createdAt, { addSuffix: true })

            const isNote = entry.kind === 'note'
            const user = isNote ? entry.note.author : entry.activity.actor
            const who = user?.name ?? m.system
            const text = isNote
              ? entry.note.content
              : describeActivity(entry.activity, messages)

            const isLast = idx === entries.length - 1
            const noteId = isNote ? entry.note.id : null
            const isDeletingThis = deleteNote.isPending && deleteNote.variables === noteId

            return (
              <li key={entry.id} className="group/item relative flex items-start gap-3 pb-5">
                {/* Vertical connector */}
                {!isLast && (
                  <span
                    className="absolute left-[15px] top-8 h-[calc(100%-20px)] w-px bg-outline/15"
                    aria-hidden
                  />
                )}

                {/* Icon dot */}
                <span
                  className={cn(
                    'relative z-10 mt-0.5 flex h-8 w-8 shrink-0 items-center justify-center rounded-full ring-2 ring-background',
                    bgCls
                  )}
                >
                  <Icon className={cn('h-3.5 w-3.5', iconCls)} aria-hidden />
                </span>

                {/* Content */}
                <div className="min-w-0 flex-1">
                  <div className="flex flex-wrap items-baseline justify-between gap-1">
                    <span className="text-xs font-semibold text-on-surface">{who}</span>
                    <time
                      dateTime={entry.createdAt}
                      className="text-[10px] tabular-nums text-on-surface-variant"
                    >
                      {timeAgo}
                    </time>
                  </div>

                  {isNote ? (
                    <div className="group/note relative mt-1.5 rounded-xl border border-primary/10 bg-primary/[0.04] px-3 py-2 text-sm leading-relaxed text-on-surface">
                      {text}
                      {/* Delete note button — hover reveal */}
                      {noteId !== null && noteId > 0 ? (
                        <AdminDeleteConfirmDialog
                          title="Delete note?"
                          description="This will soft-delete the note. It will be removed from the timeline but kept in records. This action cannot be undone."
                          confirmLabel="Delete note"
                          onConfirm={async () => {
                            await deleteNote.mutateAsync(noteId as number)
                          }}
                        >
                          <button
                            type="button"
                            aria-label="Delete note"
                            disabled={isDeletingThis}
                            className={cn(
                              'absolute -right-1.5 -top-1.5 flex h-5 w-5 items-center justify-center rounded-full',
                              'bg-red-100 text-red-500 opacity-0 shadow-sm transition-all',
                              'hover:bg-red-500 hover:text-white focus-visible:opacity-100',
                              'group-hover/note:opacity-100',
                              isDeletingThis && 'opacity-100 animate-pulse'
                            )}
                          >
                            <Trash2 className="h-2.5 w-2.5" aria-hidden />
                          </button>
                        </AdminDeleteConfirmDialog>
                      ) : null}
                    </div>
                  ) : (
                    <p className="mt-0.5 text-xs text-on-surface-variant">{text}</p>
                  )}
                </div>
              </li>
            )
          })}
        </ol>
      )}
    </div>
  )
}
