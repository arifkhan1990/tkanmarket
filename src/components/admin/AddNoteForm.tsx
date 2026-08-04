'use client'

import * as React from 'react'
import { useMutation, useQueryClient } from '@tanstack/react-query'
import { toast } from 'sonner'

import type { ApiEnvelope } from '@/types/api-envelope.types'
import type { LeadDetail, LeadNote } from '@/types/lead.types'
import { Textarea } from '@/components/ui/textarea'
import { Button } from '@/components/ui/button'
import { useI18n } from '@/hooks/useI18n'

export function AddNoteForm({ leadId }: { leadId: number }) {
  const qc = useQueryClient()
  const [content, setContent] = React.useState('')
  const { messages } = useI18n()

  const mutation = useMutation({
    mutationFn: async () => {
      const res = await fetch(`/api/v1/admin/leads/${leadId}`, {
        method: 'POST',
        headers: { 'content-type': 'application/json' },
        body: JSON.stringify({ action: 'add_note', content: content.trim() })
      })
      const json = (await res.json()) as ApiEnvelope<LeadNote>
      if (!res.ok || !json.success) throw new Error(!json.success ? json.error.message : messages.admin.leadsTimeline.requestFailed)
      return json.data
    },
    onMutate: async () => {
      const optimisticId = -Date.now()
      const now = new Date().toISOString()
      const optimistic: LeadNote = {
        id: optimisticId,
        leadId,
        author: null,
        content: content.trim(),
        createdAt: now
      }

      await qc.cancelQueries({ queryKey: ['admin-lead-detail', leadId] })
      const prev = qc.getQueryData<ApiEnvelope<LeadDetail>>(['admin-lead-detail', leadId])
      if (prev && prev.success) {
        qc.setQueryData<ApiEnvelope<LeadDetail>>(['admin-lead-detail', leadId], {
          success: true,
          data: { ...prev.data, notes: [...prev.data.notes, optimistic] }
        })
      }
      setContent('')
      return { prev }
    },
    onError: (err, _v, ctx) => {
      if (ctx?.prev) qc.setQueryData(['admin-lead-detail', leadId], ctx.prev)
      toast.error(err instanceof Error ? err.message : messages.admin.leads.failedToAddNote)
    },
    onSuccess: async () => {
      await qc.invalidateQueries({ queryKey: ['admin-lead-detail', leadId] })
      toast.success(messages.admin.leads.noteAdded)
    }
  })

  return (
    <form
      onSubmit={(e) => {
        e.preventDefault()
        if (content.trim().length === 0) return
        mutation.mutate()
      }}
      className="space-y-3"
    >
      <Textarea
        value={content}
        onChange={(e) => setContent(e.target.value)}
        placeholder={messages.admin.leads.addNotePlaceholder}
        className="min-h-[120px]"
      />
      <Button type="submit" disabled={mutation.isPending || content.trim().length === 0}>
        {messages.admin.leads.submit}
      </Button>
    </form>
  )
}

