'use client'

import * as React from 'react'
import { format } from 'date-fns'
import { Loader2 } from 'lucide-react'

import type { UserActivityLogItem } from '@/types/user-activity-logs.types'
import type { PaginationMeta } from '@/types/api-envelope.types'
import { cn } from '@/lib/utils'
import { Button } from '@/components/ui/button'
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table'

function statusPill(success: boolean, okLabel: string, failLabel: string) {
  return success ? (
    <span className="inline-flex rounded-full px-2 py-0.5 text-xs font-semibold bg-emerald-100 text-emerald-800">
      {okLabel}
    </span>
  ) : (
    <span className="inline-flex rounded-full px-2 py-0.5 text-xs font-semibold bg-red-100 text-red-800">
      {failLabel}
    </span>
  )
}

export function UserActivityLogsTable({
  items,
  meta,
  page,
  onPageChange,
  isLoading,
  userName,
  onViewJson
}: {
  items: UserActivityLogItem[]
  meta: PaginationMeta | null
  page: number
  onPageChange: (nextPage: number) => void
  isLoading: boolean
  userName: string | null
  onViewJson: (row: UserActivityLogItem) => void
}) {
  return (
    <div>
      <div className="relative overflow-hidden rounded-2xl border border-outline/10 bg-surface-container-lowest">
        {isLoading ? (
          <div className="absolute inset-0 flex items-center justify-center bg-surface-container-lowest/80 z-10" aria-hidden>
            <Loader2 className="h-5 w-5 animate-spin text-primary" />
          </div>
        ) : null}

        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Timestamp</TableHead>
              <TableHead>User</TableHead>
              <TableHead>Action Type</TableHead>
              <TableHead>Entity Affected</TableHead>
              <TableHead>IP Address</TableHead>
              <TableHead className="text-right">Details</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {isLoading ? (
              <>
                {Array.from({ length: 8 }).map((_, idx) => (
                  <TableRow key={idx}>
                    <TableCell>
                      <div className="h-4 w-40 rounded bg-surface-container-highest animate-pulse" />
                      <div className="mt-2 h-3 w-28 rounded bg-surface-container-highest animate-pulse" />
                    </TableCell>
                    <TableCell>
                      <div className="h-4 w-36 rounded bg-surface-container-highest animate-pulse" />
                      <div className="mt-2 h-3 w-28 rounded bg-surface-container-highest animate-pulse" />
                    </TableCell>
                    <TableCell>
                      <div className="h-4 w-56 rounded bg-surface-container-highest animate-pulse" />
                      <div className="mt-2 h-4 w-24 rounded-full bg-surface-container-highest animate-pulse" />
                    </TableCell>
                    <TableCell>
                      <div className="h-4 w-40 rounded bg-surface-container-highest animate-pulse" />
                      <div className="mt-2 h-3 w-28 rounded bg-surface-container-highest animate-pulse" />
                    </TableCell>
                    <TableCell>
                      <div className="h-4 w-28 rounded bg-surface-container-highest animate-pulse" />
                    </TableCell>
                    <TableCell className="text-right">
                      <div className="ml-auto h-8 w-20 rounded bg-surface-container-highest animate-pulse" />
                    </TableCell>
                  </TableRow>
                ))}
              </>
            ) : null}

            {!isLoading && items.length === 0 ? (
              <TableRow>
                <TableCell colSpan={6} className="py-12 text-center text-on-surface-variant">
                  No events found in this range.
                </TableCell>
              </TableRow>
            ) : null}

            {!isLoading
              ? items.map((row) => (
                  <TableRow key={`${row.source}-${row.id}`} className={cn(!isLoading && 'opacity-100')}>
                    <TableCell className="whitespace-nowrap font-mono text-xs">
                      <div className="text-sm">{format(new Date(row.created_at), 'MMM d, yyyy')}</div>
                      <div className="mt-1 text-[10px] text-on-surface-variant">
                        {format(new Date(row.created_at), 'HH:mm:ss')} UTC
                      </div>
                    </TableCell>
                    <TableCell className="max-w-[180px] truncate">
                      <div className="text-sm font-semibold truncate">{userName ?? '—'}</div>
                    </TableCell>
                    <TableCell className="max-w-[320px] truncate">
                      <div className="flex flex-col gap-2">
                        <div className="flex items-center gap-2">
                          <span className="text-xs font-mono bg-surface-container-high px-2 py-0.5 rounded text-on-surface-variant">
                            {row.source}
                          </span>
                          <span className="text-sm font-semibold text-on-surface truncate">{row.action_event}</span>
                        </div>
                        {statusPill(row.success, 'Success', 'Warning')}
                      </div>
                    </TableCell>
                    <TableCell className="max-w-[240px] truncate font-mono text-xs text-on-surface-variant">
                      {row.resource_id}
                    </TableCell>
                    <TableCell className="font-mono text-xs text-on-surface-variant">{row.ip ?? '—'}</TableCell>
                    <TableCell className="text-right">
                      <Button type="button" variant="ghost" size="sm" onClick={() => onViewJson(row)}>
                        View JSON
                      </Button>
                    </TableCell>
                  </TableRow>
                ))
              : null}
          </TableBody>
        </Table>

        {meta && meta.totalPages > 1 ? (
          <div className="mt-6 flex items-center justify-between gap-4">
            <p className="text-sm text-on-surface-variant">
              Showing {meta.total === 0 ? 0 : (page - 1) * meta.limit + 1}-{Math.min(meta.total, page * meta.limit)} of{' '}
              {meta.total.toLocaleString()}
            </p>
            <div className="flex gap-2">
              <Button
                type="button"
                variant="outline"
                size="sm"
                disabled={meta.page <= 1}
                onClick={() => onPageChange(Math.max(1, page - 1))}
              >
                Prev
              </Button>
              <Button
                type="button"
                variant="outline"
                size="sm"
                disabled={meta.page >= meta.totalPages}
                onClick={() => onPageChange(page + 1)}
              >
                Next
              </Button>
            </div>
          </div>
        ) : null}
      </div>
    </div>
  )
}

