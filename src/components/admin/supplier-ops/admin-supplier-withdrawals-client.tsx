'use client'

import * as React from 'react'
import { CheckCircle2, XCircle } from 'lucide-react'

import { SupplierSuiteSubNav } from '@/components/admin/suppliers/supplier-suite-subnav'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardHeader } from '@/components/ui/card'
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow
} from '@/components/ui/table'
import {
  useAdminSupplierPayoutsQuery,
  useAdminSupplierPayoutStatusMutation
} from '@/hooks/admin/useAdminSupplierPayouts'
import { useI18n } from '@/hooks/useI18n'
import { cn } from '@/lib/utils'
import type { SupplierPayoutStatus } from '@/types/supplier-ops.types'

function statusBadgeClass(status: string) {
  const s = status.toLowerCase()
  return cn(
    'inline-flex items-center rounded-full px-3 py-1 text-[10px] font-extrabold uppercase tracking-wider',
    s === 'pending' && 'bg-amber-100 text-amber-900 dark:bg-amber-950/50 dark:text-amber-200',
    s === 'reviewing' && 'bg-blue-100 text-blue-900 dark:bg-blue-950/50 dark:text-blue-200',
    s === 'approved' && 'bg-secondary-container/90 text-on-secondary-container',
    s === 'paid' && 'bg-emerald-100 text-emerald-900 dark:bg-emerald-950/50 dark:text-emerald-200',
    s === 'rejected' && 'bg-red-100 text-red-900 dark:bg-red-950/50 dark:text-red-200'
  )
}

function statusLabel(m: {
  withdrawalsStatusPENDING: string
  withdrawalsStatusREVIEWING: string
  withdrawalsStatusAPPROVED: string
  withdrawalsStatusREJECTED: string
  withdrawalsStatusPAID: string
}, status: SupplierPayoutStatus): string {
  const map: Record<SupplierPayoutStatus, string> = {
    PENDING: m.withdrawalsStatusPENDING,
    REVIEWING: m.withdrawalsStatusREVIEWING,
    APPROVED: m.withdrawalsStatusAPPROVED,
    REJECTED: m.withdrawalsStatusREJECTED,
    PAID: m.withdrawalsStatusPAID
  }
  return map[status]
}

function WithdrawalsSkeleton() {
  return (
    <div className="animate-pulse space-y-6">
      <div className="flex flex-col gap-4 md:flex-row md:items-end md:justify-between">
        <div className="space-y-3">
          <div className="h-10 w-64 rounded-xl bg-surface-container-high" />
          <div className="h-5 w-96 max-w-full rounded-lg bg-surface-container-high" />
        </div>
        <div className="h-24 w-full max-w-xs rounded-2xl bg-surface-container-high" />
      </div>
      <div className="h-72 rounded-2xl bg-surface-container-high" />
      <div className="grid gap-4 lg:grid-cols-3">
        <div className="h-40 rounded-2xl bg-surface-container-high lg:col-span-2" />
        <div className="h-40 rounded-2xl bg-surface-container-high" />
      </div>
    </div>
  )
}

export function AdminSupplierWithdrawalsClient() {
  const { messages } = useI18n()
  const m = messages.admin.supplierSuite
  const q = useAdminSupplierPayoutsQuery()
  const mut = useAdminSupplierPayoutStatusMutation()
  const data = q.data

  return (
    <div className="space-y-6">
      <div className="flex flex-col gap-3 md:flex-row md:items-start md:justify-between">
        <div>
          <h1 className="font-heading text-heading-xl font-extrabold tracking-tight">{m.withdrawalsPageTitle}</h1>
          <p className="mt-1 text-sm text-on-surface-variant">{m.withdrawalsPageSubtitle}</p>
        </div>
        <Card className="shrink-0 border-outline/15 bg-surface-container-lowest shadow-sm dark:border-outline/15">
          <CardContent className="px-6 py-4">
            <p className="text-[10px] font-bold uppercase tracking-widest text-on-surface-variant">
              {m.withdrawalsTotalPendingLabel}
            </p>
            <p className="mt-1 font-mono text-2xl font-black tabular-nums text-on-surface">
              {data
                ? `$${Number.parseFloat(data.summary.totalPendingAmount).toLocaleString(undefined, {
                    minimumFractionDigits: 2
                  })}`
                : '—'}
            </p>
          </CardContent>
        </Card>
      </div>

      <SupplierSuiteSubNav className="mb-0" />

      {q.isLoading ? (
        <WithdrawalsSkeleton />
      ) : (
        <>
          <Card className="overflow-hidden border-outline/15 bg-surface-container-lowest shadow-sm">
            <Table>
              <TableHeader>
                <TableRow className="border-outline/10 bg-surface-container-low/80 hover:bg-surface-container-low/80">
                  <TableHead className="text-on-surface-variant">{m.colSupplier}</TableHead>
                  <TableHead className="text-on-surface-variant">{m.withdrawalsColRequested}</TableHead>
                  <TableHead className="text-on-surface-variant">{m.withdrawalsColBalance}</TableHead>
                  <TableHead className="text-on-surface-variant">{m.withdrawalsColBank}</TableHead>
                  <TableHead className="text-center text-on-surface-variant">{m.colStatus}</TableHead>
                  <TableHead className="text-right text-on-surface-variant">{m.withdrawalsColActions}</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {(data?.requests ?? []).map((row) => (
                  <TableRow key={row.id} className="border-outline/5 hover:bg-surface-container-low/40">
                    <TableCell>
                      <div className="font-semibold text-on-surface">{row.supplierName}</div>
                      <div className="text-xs text-on-surface-variant">
                        {m.withdrawalsSupplierIdLabel.replace('{id}', String(row.supplierId))}
                      </div>
                    </TableCell>
                    <TableCell className="font-mono font-semibold text-primary">
                      $
                      {Number.parseFloat(row.requestedAmount).toLocaleString(undefined, {
                        minimumFractionDigits: 2
                      })}
                    </TableCell>
                    <TableCell className="font-mono text-on-surface-variant">
                      $
                      {Number.parseFloat(row.balanceSnapshot).toLocaleString(undefined, {
                        minimumFractionDigits: 2
                      })}
                    </TableCell>
                    <TableCell>
                      <div className="text-sm font-medium text-on-surface">{row.bankLabel}</div>
                      <div className="text-xs text-on-surface-variant">{row.accountMask}</div>
                    </TableCell>
                    <TableCell className="text-center">
                      <span className={statusBadgeClass(row.status)}>{statusLabel(m, row.status)}</span>
                    </TableCell>
                    <TableCell className="text-right">
                      <div className="flex justify-end gap-2">
                        <Button
                          size="icon"
                          type="button"
                          variant="outline"
                          className="border-destructive/30 text-destructive hover:bg-destructive/10"
                          onClick={() =>
                            mut.mutate({
                              id: row.id,
                              status: 'REJECTED',
                              resolution_note: m.withdrawalsRejectNote
                            })
                          }
                          disabled={mut.isPending}
                          aria-label={m.withdrawalsRejectAria}
                        >
                          <XCircle className="h-4 w-4" aria-hidden />
                        </Button>
                        <Button
                          size="sm"
                          type="button"
                          onClick={() => mut.mutate({ id: row.id, status: 'PAID' })}
                          disabled={mut.isPending}
                        >
                          {m.withdrawalsApprovePayout}
                        </Button>
                      </div>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
            {(data?.requests ?? []).length === 0 ? (
              <div className="border-t border-outline/10 px-6 py-10 text-center text-sm text-on-surface-variant">
                {m.withdrawalsEmpty}
              </div>
            ) : null}
          </Card>

          <section className="space-y-4 pt-2">
            <h2 className="font-heading text-lg font-bold text-on-surface">{m.withdrawalsLedgerTitle}</h2>
            <div className="grid grid-cols-1 gap-6 lg:grid-cols-3">
              <div className="space-y-3 lg:col-span-2">
                {(data?.summary.ledger ?? []).map((item) => (
                  <Card key={item.id} className="border-outline/15 bg-surface-container-lowest shadow-sm">
                    <CardContent className="flex items-center justify-between gap-4 p-4">
                      <div className="flex items-center gap-3">
                        <div
                          className={cn(
                            'rounded-lg p-2',
                            item.kind === 'payout'
                              ? 'bg-emerald-500/15 text-emerald-800 dark:text-emerald-200'
                              : 'bg-destructive/15 text-destructive'
                          )}
                        >
                          {item.kind === 'payout' ? (
                            <CheckCircle2 className="h-5 w-5" aria-hidden />
                          ) : (
                            <XCircle className="h-5 w-5" aria-hidden />
                          )}
                        </div>
                        <div>
                          <p className="text-sm font-semibold text-on-surface">{item.referenceLabel}</p>
                          <p className="text-xs text-on-surface-variant">{item.supplierName}</p>
                        </div>
                      </div>
                      <div className="text-right">
                        <p className="font-mono font-bold text-on-surface">
                          ${Number.parseFloat(item.amount).toLocaleString()}
                        </p>
                        <p className="text-[10px] font-bold uppercase text-on-surface-variant">
                          {item.statusLabel}
                        </p>
                      </div>
                    </CardContent>
                  </Card>
                ))}
                {(data?.summary.ledger ?? []).length === 0 ? (
                  <p className="text-sm text-on-surface-variant">{m.withdrawalsLedgerEmpty}</p>
                ) : null}
              </div>
              <Card className="border-primary/25 bg-primary text-primary-foreground shadow-lg">
                <CardHeader>
                  <h3 className="text-xs font-bold uppercase tracking-widest text-primary-foreground/80">
                    {m.withdrawalsReserveTitle}
                  </h3>
                  <p className="font-mono text-3xl font-bold">—</p>
                </CardHeader>
                <CardContent className="space-y-3 text-sm text-primary-foreground/90">
                  <p>{m.withdrawalsReserveHint}</p>
                </CardContent>
              </Card>
            </div>
          </section>
        </>
      )}

      {q.isError ? (
        <div className="rounded-2xl border border-destructive/25 bg-destructive/10 px-4 py-3 text-sm text-destructive">
          {q.error instanceof Error ? q.error.message : m.loadError}
        </div>
      ) : null}
    </div>
  )
}
