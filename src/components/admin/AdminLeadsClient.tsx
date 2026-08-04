'use client'

import { useMemo, useState } from 'react'
import Link from 'next/link'
import { useQueryClient } from '@tanstack/react-query'

import { useAdminLeads, LeadsKanbanSkeleton, useLeadMutations } from '@/hooks/admin/useAdminLeads'
import type { AdminLeadCard } from '@/types/admin-leads.types'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { useI18n } from '@/hooks/useI18n'

const statusOrder: AdminLeadCard['status'][] = [
  'NEW',
  'CONTACTED',
  'QUALIFIED',
  'PROPOSAL_SENT',
  'NEGOTIATING',
  'CLOSED_WON',
  'CLOSED_LOST'
]

export function AdminLeadsClient() {
  const queryClient = useQueryClient()
  const { messages } = useI18n()
  const k = messages.admin.leadsKanban

  const [pageIndex, setPageIndex] = useState(0)
  const pageSize = 20

  const query = useAdminLeads({ page: pageIndex + 1, limit: pageSize })
  const { updateStatus } = useLeadMutations()

  const items = useMemo(() => (query.data?.success ? query.data.data.items : []), [query.data])
  const total = query.data?.success ? query.data.data.total : 0

  const byStatus = useMemo(() => {
    const map: Record<string, AdminLeadCard[]> = {}
    for (const s of statusOrder) map[s] = []
    for (const lead of items) {
      const current = map[lead.status] ?? []
      map[lead.status] = current
      current.push(lead)
    }
    return map as Record<AdminLeadCard['status'], AdminLeadCard[]>
  }, [items])

  const advanceLead = (lead: AdminLeadCard) => {
    const currentIndex = statusOrder.indexOf(lead.status)
    const next = statusOrder[currentIndex + 1]
    if (!next) return
    updateStatus.mutate(
      { id: lead.id, status: next },
      {
        onSuccess: () => queryClient.invalidateQueries({ queryKey: ['admin-leads'] })
      }
    )
  }

  const pageCount = Math.max(1, Math.ceil(total / pageSize))

  return (
    <div className="space-y-6">
      <div>
        <h1 className="font-heading text-heading-xl font-extrabold tracking-tight">{k.title}</h1>
        <p className="mt-2 text-sm text-on-surface-variant">{k.subtitle}</p>
      </div>

      {query.isLoading ? (
        <LeadsKanbanSkeleton />
      ) : (
        <div className="grid gap-5 lg:grid-cols-7 md:grid-cols-2">
          {statusOrder.map((status) => (
            <div key={status} className="rounded-[2rem] bg-surface-container-lowest border border-outline/10 p-4 space-y-3">
              <div className="flex items-center justify-between">
                <div className="text-xs font-bold uppercase tracking-widest text-outline">{status}</div>
                <Badge intent="default">{byStatus[status]?.length ?? 0}</Badge>
              </div>
              <div className="space-y-3">
                {(byStatus[status] ?? []).map((lead) => (
                  <div key={lead.id} className="rounded-[1.75rem] bg-surface-container-highest/40 border border-outline/10 p-4 space-y-2">
                    <div className="space-y-1">
                      <div className="text-sm font-extrabold line-clamp-1">{lead.companyName}</div>
                      <div className="text-xs text-on-surface-variant line-clamp-1">{lead.contactName}</div>
                      {lead.fabricTitleRu ? (
                        <div className="text-xs font-mono text-on-surface-variant line-clamp-1">{lead.fabricTitleRu}</div>
                      ) : null}
                    </div>
                    <div className="flex gap-2">
                      <Link href={`/admin/leads/${lead.id}`} className="text-xs font-extrabold text-primary hover:opacity-90 transition-opacity">
                        {k.detailLink}
                      </Link>
                      <Button size="sm" variant="outline" className="rounded-full" onClick={() => advanceLead(lead)}>
                        {k.nextStage}
                      </Button>
                    </div>
                  </div>
                ))}
                {(byStatus[status] ?? []).length === 0 ? (
                  <div className="text-xs text-on-surface-variant">{k.noLeads}</div>
                ) : null}
              </div>
            </div>
          ))}
        </div>
      )}

      <div className="flex items-center justify-center gap-3 pt-6">
        <Button
          variant="outline"
          className="rounded-full"
          onClick={() => setPageIndex((v) => Math.max(0, v - 1))}
          disabled={pageIndex <= 0}
        >
          {k.prev}
        </Button>
        <div className="text-sm text-on-surface-variant">
          {k.page} <span className="font-mono font-bold text-on-surface">{pageIndex + 1}</span> /{' '}
          <span className="font-mono font-bold text-on-surface">{pageCount}</span>
        </div>
        <Button
          variant="outline"
          className="rounded-full"
          onClick={() => setPageIndex((v) => Math.min(pageCount - 1, v + 1))}
          disabled={pageIndex >= pageCount - 1}
        >
          {k.nextPage}
        </Button>
      </div>
    </div>
  )
}

