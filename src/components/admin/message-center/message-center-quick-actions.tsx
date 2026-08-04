'use client'

import * as React from 'react'
import { useMutation, useQueryClient } from '@tanstack/react-query'
import { toast } from 'sonner'
import { Loader2, Plus } from 'lucide-react'

import { Button } from '@/components/ui/button'
import { Card, CardContent, CardHeader } from '@/components/ui/card'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { Textarea } from '@/components/ui/textarea'
import { useAdminUsers } from '@/hooks/admin/useAdminUsers'
import { useI18n } from '@/hooks/useI18n'
import type { ApiEnvelope } from '@/types/api-envelope.types'
import type { LeadNote } from '@/types/lead.types'
import type { LeadStatus } from '@/types/marketplace.types'

const UNASSIGNED_VALUE = '__unassigned__'

const statusOptions: LeadStatus[] = [
  'NEW',
  'CONTACTED',
  'QUALIFIED',
  'PROPOSAL_SENT',
  'NEGOTIATING',
  'CLOSED_WON',
  'CLOSED_LOST'
]

export interface MessageCenterQuickActionsProps {
  leadId: number
  status: LeadStatus
  assignedToId: number | null
}

export function MessageCenterQuickActions({ leadId, status, assignedToId }: MessageCenterQuickActionsProps) {
  const qc = useQueryClient()
  const { messages } = useI18n()
  const m = messages.admin.leads
  const usersQuery = useAdminUsers({ role: 'SALES' })
  const [noteDraft, setNoteDraft] = React.useState('')

  const updateStatus = useMutation({
    mutationFn: async (next: LeadStatus) => {
      const res = await fetch(`/api/v1/admin/leads/${leadId}`, {
        method: 'PATCH',
        headers: { 'content-type': 'application/json' },
        credentials: 'same-origin',
        body: JSON.stringify({ action: 'update_status', status: next })
      })
      const json = (await res.json()) as ApiEnvelope<unknown>
      if (!res.ok || !json.success) {
        throw new Error(!json.success ? json.error.message : messages.admin.leadsTimeline.requestFailed)
      }
      return json.data
    },
    onSuccess: async () => {
      await qc.invalidateQueries({ queryKey: ['admin-lead-detail', leadId] })
      await qc.invalidateQueries({ queryKey: ['admin-message-center'] })
      toast.success(m.statusUpdatedToast)
    }
  })

  const addNote = useMutation({
    mutationFn: async (content: string) => {
      const res = await fetch(`/api/v1/admin/leads/${leadId}`, {
        method: 'POST',
        headers: { 'content-type': 'application/json' },
        credentials: 'same-origin',
        body: JSON.stringify({ action: 'add_note', content })
      })
      const json = (await res.json()) as ApiEnvelope<LeadNote>
      if (!res.ok || !json.success) {
        throw new Error(!json.success ? json.error.message : messages.admin.leadsTimeline.requestFailed)
      }
      return json.data
    },
    onSuccess: async () => {
      setNoteDraft('')
      await qc.invalidateQueries({ queryKey: ['admin-lead-detail', leadId] })
      toast.success(m.noteAdded)
    }
  })

  const assignLead = useMutation({
    mutationFn: async (userId: number) => {
      const res = await fetch(`/api/v1/admin/leads/${leadId}`, {
        method: 'PATCH',
        headers: { 'content-type': 'application/json' },
        credentials: 'same-origin',
        body: JSON.stringify({ action: 'assign', user_id: userId })
      })
      const json = (await res.json()) as ApiEnvelope<unknown>
      if (!res.ok || !json.success) {
        throw new Error(!json.success ? json.error.message : messages.admin.leadsTimeline.requestFailed)
      }
      return json.data
    },
    onSuccess: async () => {
      await qc.invalidateQueries({ queryKey: ['admin-lead-detail', leadId] })
      await qc.invalidateQueries({ queryKey: ['admin-message-center'] })
      toast.success(m.saved)
    }
  })

  React.useEffect(() => {
    if (!updateStatus.error) return
    toast.error(updateStatus.error instanceof Error ? updateStatus.error.message : m.updateFailed)
  }, [m.updateFailed, updateStatus.error])

  React.useEffect(() => {
    if (!addNote.error) return
    toast.error(addNote.error instanceof Error ? addNote.error.message : m.failedToAddNote)
  }, [addNote.error, m.failedToAddNote])

  React.useEffect(() => {
    if (!assignLead.error) return
    toast.error(assignLead.error instanceof Error ? assignLead.error.message : m.updateFailed)
  }, [assignLead.error, m.updateFailed])

  const onSubmitNote = (e: React.FormEvent) => {
    e.preventDefault()
    const trimmed = noteDraft.trim()
    if (trimmed.length < 1) return
    addNote.mutate(trimmed)
  }

  return (
    <Card className="border border-outline/15 bg-surface-container-lowest/80">
      <CardHeader className="pb-2">
        <p className="text-xs font-bold uppercase tracking-wider text-on-surface-variant">{m.statusUpdateSection}</p>
        <p className="text-xs text-on-surface-variant">{m.statusUpdateHint}</p>
      </CardHeader>
      <CardContent className="space-y-4 pt-0">
        <div className="grid gap-4 sm:grid-cols-2">
          <div className="space-y-2">
            <div className="text-xs font-semibold text-on-surface-variant">{m.fields.status}</div>
            <Select
              value={status}
              disabled={updateStatus.isPending}
              onValueChange={(v) => updateStatus.mutate(v as LeadStatus)}
            >
              <SelectTrigger className="h-11 rounded-xl" aria-label={m.leadStatusAria}>
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                {statusOptions.map((s) => (
                  <SelectItem key={s} value={s}>
                    {s}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
          <div className="space-y-2">
            <div className="text-xs font-semibold text-on-surface-variant">{m.fields.assignTo}</div>
            <Select
              value={assignedToId != null ? String(assignedToId) : UNASSIGNED_VALUE}
              disabled={assignLead.isPending || usersQuery.isLoading}
              onValueChange={(v) => {
                if (v === UNASSIGNED_VALUE) return
                assignLead.mutate(Number(v))
              }}
            >
              <SelectTrigger className="h-11 rounded-xl">
                <SelectValue placeholder={m.selectUser} />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value={UNASSIGNED_VALUE}>{m.unassigned}</SelectItem>
                {(usersQuery.data ?? []).map((u) => (
                  <SelectItem key={u.id} value={String(u.id)}>
                    {u.name} ({u.email})
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
        </div>

        <form onSubmit={onSubmitNote} className="space-y-2">
          <div className="text-xs font-semibold text-on-surface-variant">{m.addNoteTitle}</div>
          <Textarea
            value={noteDraft}
            onChange={(e) => setNoteDraft(e.target.value)}
            placeholder={m.addNoteForLeadPlaceholder}
            className="min-h-[88px] rounded-xl"
            disabled={addNote.isPending}
          />
          <Button
            type="submit"
            className="w-full rounded-xl font-semibold sm:ml-auto sm:w-auto"
            disabled={addNote.isPending || noteDraft.trim().length < 1}
          >
            {addNote.isPending ? (
              <>
                <Loader2 className="mr-2 h-4 w-4 animate-spin" aria-hidden />
                {m.submit}
              </>
            ) : (
              <>
                <Plus className="mr-2 h-4 w-4" aria-hidden />
                {m.addNoteButton}
              </>
            )}
          </Button>
        </form>
      </CardContent>
    </Card>
  )
}
