'use client'

import { useState, type FormEvent } from 'react'
import { useQueryClient } from '@tanstack/react-query'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Textarea } from '@/components/ui/textarea'
import { Badge } from '@/components/ui/badge'

import { useAdminLeadDetail } from '@/hooks/admin/useAdminLeadDetail'
import { useLeadMutations } from '@/hooks/admin/useAdminLeads'

import type { LeadStatus } from '@/types/marketplace.types'
import { EmptyState } from '@/components/common/EmptyState'
import { useI18n } from '@/hooks/useI18n'

const statusOptions: LeadStatus[] = [
  'NEW',
  'CONTACTED',
  'QUALIFIED',
  'PROPOSAL_SENT',
  'NEGOTIATING',
  'CLOSED_WON',
  'CLOSED_LOST'
]

export function AdminLeadDetailClient({ id }: { id: number }) {
  const queryClient = useQueryClient()
  const { messages } = useI18n()

  const query = useAdminLeadDetail(id)
  const detail = query.data?.success ? query.data.data : null

  const { updateStatus, addNote } = useLeadMutations()

  const [statusOverride, setStatusOverride] = useState<LeadStatus | null>(null)
  const [noteContent, setNoteContent] = useState('')
  const status: LeadStatus = statusOverride ?? detail?.lead.status ?? 'NEW'

  const saveStatus = () => {
    if (!detail) return
    updateStatus.mutate(
      { id: detail.lead.id, status },
      {
        onSuccess: () => {
          setStatusOverride(null)
          queryClient.invalidateQueries({ queryKey: ['admin-lead-detail', id] })
        }
      }
    )
  }

  const submitNote = (e: FormEvent<HTMLFormElement>) => {
    e.preventDefault()
    if (!detail) return
    if (!noteContent.trim()) return
    addNote.mutate(
      { id: detail.lead.id, content: noteContent.trim() },
      {
        onSuccess: () => {
          setNoteContent('')
          queryClient.invalidateQueries({ queryKey: ['admin-lead-detail', id] })
        }
      }
    )
  }

  if (query.isLoading) {
    return (
      <div className="rounded-[2rem] bg-surface-container-lowest border border-outline/10 p-6">
        {messages.admin.leads.loadingDetail}
      </div>
    )
  }

  if (!detail) {
    return (
      <EmptyState title={messages.admin.leads.notFoundTitle} description={messages.admin.leads.notFoundDescription} />
    )
  }

  return (
    <div className="space-y-6">
      <div className="flex flex-wrap items-center justify-between gap-4">
        <div>
          <h1 className="font-heading text-heading-xl font-extrabold tracking-tight">{messages.admin.leads.detailPageTitle}</h1>
          <p className="mt-2 text-sm text-on-surface-variant">
            #<span className="font-mono font-bold text-on-surface">{detail.lead.id}</span>
          </p>
        </div>
        <Badge intent="default">{detail.lead.status}</Badge>
      </div>

      <div className="rounded-[2rem] bg-surface-container-lowest border border-outline/10 p-6 space-y-5">
        <div className="grid gap-4 md:grid-cols-2">
          <div className="space-y-2">
            <div className="text-xs font-bold uppercase tracking-widest text-outline">{messages.admin.leads.fields.company}</div>
            <div className="text-sm font-extrabold">{detail.lead.companyName}</div>
          </div>
          <div className="space-y-2">
            <div className="text-xs font-bold uppercase tracking-widest text-outline">{messages.admin.leads.table.contact}</div>
            <div className="text-sm font-extrabold">{detail.lead.contactName}</div>
          </div>
          <div className="space-y-2">
            <div className="text-xs font-bold uppercase tracking-widest text-outline">{messages.admin.leads.fields.email}</div>
            <div className="text-sm font-bold text-primary">{detail.lead.email}</div>
          </div>
          <div className="space-y-2">
            <div className="text-xs font-bold uppercase tracking-widest text-outline">{messages.admin.leads.fields.phone}</div>
            <div className="text-sm font-mono">{detail.lead.phone ?? '—'}</div>
          </div>
          <div className="space-y-2 md:col-span-2">
            <div className="text-xs font-bold uppercase tracking-widest text-outline">{messages.admin.leads.fields.fabric}</div>
            <div className="text-sm font-bold">{detail.fabric?.titleRu ?? '—'}</div>
          </div>
        </div>

        <div className="rounded-2xl bg-surface-container-highest/40 border border-outline/10 p-5 space-y-3">
          <div className="flex flex-wrap items-center justify-between gap-4">
            <div className="space-y-1">
              <div className="text-xs font-bold uppercase tracking-widest text-outline">{messages.admin.leads.statusUpdateSection}</div>
              <div className="text-sm font-bold">{messages.admin.leads.statusUpdateHint}</div>
            </div>
            <Button className="rounded-full" onClick={saveStatus} disabled={updateStatus.isPending}>
              {messages.admin.leads.saveStatus}
            </Button>
          </div>
          <div className="grid gap-3 md:grid-cols-2">
            <div className="space-y-2">
              <div className="text-xs font-bold uppercase tracking-widest text-outline">{messages.admin.leads.fields.status}</div>
              <select
                value={status}
                onChange={(e) => setStatusOverride(e.target.value as LeadStatus)}
                aria-label={messages.admin.leads.leadStatusAria}
                className="w-full rounded-xl bg-surface-container-highest border border-outline/10 px-4 py-3 text-sm font-bold text-on-surface"
              >
                {statusOptions.map((s) => (
                  <option key={s} value={s}>
                    {s}
                  </option>
                ))}
              </select>
            </div>
            <div className="space-y-2">
              <div className="text-xs font-bold uppercase tracking-widest text-outline">{messages.admin.leads.fields.source}</div>
              <div className="text-sm font-mono">{detail.lead.source}</div>
            </div>
          </div>
        </div>

        <div className="space-y-3">
          <div className="text-xs font-bold uppercase tracking-widest text-outline">{messages.admin.leads.notesSection}</div>
          {detail.notes.length > 0 ? (
            <div className="space-y-3">
              {detail.notes.map((n) => (
                <div key={n.id} className="rounded-2xl bg-surface-container-highest/40 border border-outline/10 p-5">
                  <div className="flex items-center justify-between gap-4">
                    <div className="text-sm font-extrabold">{n.author?.name ?? messages.admin.leadsTimeline.system}</div>
                    <div className="text-xs font-mono text-on-surface-variant">{n.createdAt}</div>
                  </div>
                  <div className="mt-3 text-sm text-on-surface-variant whitespace-pre-wrap">{n.content}</div>
                </div>
              ))}
            </div>
          ) : (
            <div className="rounded-2xl bg-surface-container-highest/40 border border-outline/10 p-5 text-sm text-on-surface-variant">
              {messages.admin.leads.noNotesYet}
            </div>
          )}

          <form onSubmit={submitNote} className="rounded-2xl bg-surface-container-lowest border border-outline/10 p-5 space-y-3">
            <div className="text-xs font-bold uppercase tracking-widest text-outline">{messages.admin.leads.addNoteTitle}</div>
            <Textarea
              value={noteContent}
              onChange={(e) => setNoteContent(e.target.value)}
              placeholder={messages.admin.leads.addNoteForLeadPlaceholder}
            />
            <Button type="submit" className="rounded-full" disabled={addNote.isPending}>
              {messages.admin.leads.addNoteButton}
            </Button>
          </form>
        </div>
      </div>
    </div>
  )
}

