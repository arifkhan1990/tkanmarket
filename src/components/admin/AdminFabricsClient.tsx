'use client'

import { useMemo, useState } from 'react'
import { useQueryClient } from '@tanstack/react-query'
import type { ColumnDef } from '@tanstack/react-table'
import { CheckCircle2, XCircle } from 'lucide-react'

import { DataTable } from '@/components/admin/DataTable'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { AdminFabricsSkeleton, useAdminFabrics, useApproveRejectFabrics } from '@/hooks/admin/useAdminFabrics'
import type { AdminFabricListItem } from '@/types/admin-fabric-management.types'

import { cn } from '@/lib/utils'
import { useI18n } from '@/hooks/useI18n'

const statusTabKeys = ['ai_processing', 'ai_processed', 'raw_scraped'] as const

export function AdminFabricsClient() {
  const queryClient = useQueryClient()
  const { messages } = useI18n()
  const q = messages.admin.fabricsQueuePage

  const statusTabs = useMemo(
    () => [
      { key: 'ai_processing' as const, label: q.tabPendingAi },
      { key: 'ai_processed' as const, label: q.tabPendingReview },
      { key: 'raw_scraped' as const, label: q.tabRawScraped }
    ],
    [q.tabPendingAi, q.tabPendingReview, q.tabRawScraped]
  )

  const [tab, setTab] = useState<(typeof statusTabKeys)[number]>('ai_processing')

  const [pageIndex, setPageIndex] = useState(0)
  const pageSize = 12

  const query = useAdminFabrics({ page: pageIndex + 1, limit: pageSize, status: tab })

  const { approve, reject } = useApproveRejectFabrics()

  const columns = useMemo<ColumnDef<AdminFabricListItem, unknown>[]>(
    () => [
      {
        id: 'fabric',
        header: q.columnFabric,
        cell: ({ row }) => {
        const f = row.original
        return (
          <div className="space-y-1">
            <div className="text-sm font-extrabold line-clamp-1">{f.title_ru}</div>
            <div className="text-xs font-mono text-on-surface-variant">{f.slug}</div>
          </div>
        )
      }
    },
    {
      id: 'supplier',
      header: q.columnSupplier,
      cell: ({ row }) => <div className="text-sm font-bold">{row.original.supplier_name}</div>
    },
    {
      id: 'status',
      header: q.columnStatus,
      cell: ({ row }) => {
        const st = row.original.status
        return (
          <Badge intent={st === 'approved' ? 'success' : st === 'rejected' ? 'error' : 'default'}>
            {st}
          </Badge>
        )
      }
    },
    { id: 'gsm', header: q.columnGsm, cell: ({ row }) => <div className="text-sm font-mono">{row.original.gsm ?? '—'}</div> },
    {
      id: 'created',
      header: q.columnCreated,
      cell: ({ row }) => (
        <div className="text-sm font-mono text-on-surface-variant">
          {new Date(row.original.created_at).toLocaleDateString()}
        </div>
      )
    },
    {
      id: 'moq',
      header: q.columnMoq,
      cell: ({ row }) => <div className="text-sm font-mono">{row.original.moq ?? '—'}</div>
    },
    {
      id: 'actions',
      header: q.columnActions,
      cell: ({ row }) => {
        const id = row.original.id
        return (
          <div className="flex gap-2">
            <Button
              size="icon"
              variant="outline"
              className="rounded-2xl"
              onClick={() =>
                approve.mutate(id, {
                  onSuccess: () => queryClient.invalidateQueries({ queryKey: ['admin-fabrics'] })
                })
              }
              aria-label={q.approveAria}
            >
              <CheckCircle2 className="h-4 w-4 text-emerald-600" aria-hidden />
            </Button>
            <Button
              size="icon"
              variant="outline"
              className="rounded-2xl"
              onClick={() =>
                reject.mutate(
                  { id, reason: q.quickRejectReason },
                  {
                    onSuccess: () => queryClient.invalidateQueries({ queryKey: ['admin-fabrics'] })
                  }
                )
              }
              aria-label={q.rejectAria}
            >
              <XCircle className="h-4 w-4 text-red-600" aria-hidden />
            </Button>
          </div>
        )
      }
    }
    ],
    [q, approve, reject, queryClient]
  )

  const items = query.data?.success ? query.data.data.items : []
  const total = query.data?.success ? query.data.data.total : 0

  return (
    <div className="space-y-6">
      <div className="flex flex-wrap items-center justify-between gap-4">
        <div>
          <h1 className="font-heading text-heading-xl font-extrabold tracking-tight">{q.title}</h1>
          <p className="mt-2 text-sm text-on-surface-variant">{q.subtitle}</p>
        </div>
        <div className="flex flex-wrap gap-2">
          {statusTabs.map((t) => (
            <button
              key={t.key}
              type="button"
              onClick={() => {
                setTab(t.key)
                setPageIndex(0)
              }}
              className={cn(
                'rounded-full px-4 py-2 text-xs font-bold uppercase tracking-widest border transition-colors',
                t.key === tab
                  ? 'bg-brand-50 border-primary text-primary'
                  : 'bg-surface-container-lowest border-outline/10 text-on-surface-variant hover:border-outline/20'
              )}
            >
              {t.label}
            </button>
          ))}
        </div>
      </div>

      {query.isLoading ? (
        <AdminFabricsSkeleton />
      ) : items.length > 0 ? (
        <DataTable
          columns={columns}
          data={items}
          pagination={{ pageIndex, pageSize, total }}
          onPaginationChange={(p) => setPageIndex(p.pageIndex)}
          enableRowSelection={false}
        />
      ) : (
        <div className="rounded-[2rem] bg-surface-container-lowest border border-outline/10 p-6">{q.empty}</div>
      )}
    </div>
  )
}
