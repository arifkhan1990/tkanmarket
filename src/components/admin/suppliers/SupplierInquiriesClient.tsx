'use client'

import * as React from 'react'
import Link from 'next/link'
import { ChevronLeft, ChevronRight } from 'lucide-react'

import { Button } from '@/components/ui/button'
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table'
import { useAdminSupplierInquiries } from '@/hooks/admin/useAdminSupplierInquiries'
import { useI18n } from '@/hooks/useI18n'
import { withLocaleUrl } from '@/lib/i18n/locale-path'

export function SupplierInquiriesClient({ supplierId }: { supplierId: number }) {
  const { messages, locale } = useI18n()
  const p = messages.admin.supplierInquiriesPage
  const [page, setPage] = React.useState(1)
  const limit = 15

  const query = useAdminSupplierInquiries({ supplierId, page, limit })

  const supplier = query.data?.supplier
  const items = query.data?.items ?? []
  const meta = query.data?.meta

  return (
    <div className="mx-auto max-w-7xl pb-12">
      <div className="mb-8 flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h1 className="font-heading text-3xl font-extrabold tracking-tight text-on-surface">{p.title}</h1>
          <p className="mt-2 text-on-surface-variant">{p.subtitle}</p>
          {supplier ? (
            <p className="mt-2 text-lg font-semibold text-on-surface">
              {supplier.name}
              <span className="ml-2 font-mono text-sm text-on-surface-variant">#{supplier.id}</span>
            </p>
          ) : null}
        </div>
        <div className="flex flex-wrap gap-2">
          <Button type="button" variant="outline" className="rounded-xl" asChild>
            <Link href={withLocaleUrl('/admin/suppliers', locale)}>{messages.admin.supplierEditPage.back}</Link>
          </Button>
          <Button type="button" variant="outline" className="rounded-xl" asChild>
            <Link href={withLocaleUrl(`/admin/suppliers/${supplierId}/edit`, locale)}>{messages.admin.supplierEditPage.title}</Link>
          </Button>
        </div>
      </div>

      {query.isError ? (
        <div className="mb-6 rounded-2xl border border-destructive/25 bg-destructive/5 px-4 py-4 text-sm text-destructive">
          {query.error instanceof Error ? query.error.message : p.loadError}
          <Button type="button" variant="outline" size="sm" className="ml-3" onClick={() => void query.refetch()}>
            {p.retry}
          </Button>
        </div>
      ) : null}

      {query.isFetching && !query.data ? (
        <div className="rounded-2xl border border-outline/10">
          <div className="h-12 animate-pulse bg-surface-container-high" />
          {Array.from({ length: 6 }).map((_, i) => (
            <div key={i} className="h-14 animate-pulse border-t border-outline/10 bg-surface-container-lowest/50" />
          ))}
        </div>
      ) : null}

      {query.isSuccess && items.length === 0 ? (
        <p className="rounded-2xl border border-dashed border-outline/20 bg-surface-container-low/40 px-6 py-12 text-center text-on-surface-variant">
          {p.empty}
        </p>
      ) : null}

      {query.isSuccess && items.length > 0 ? (
        <div className="overflow-hidden rounded-2xl border border-outline/10 bg-surface-container-lowest shadow-sm">
          <Table>
            <TableHeader>
              <TableRow className="bg-surface-container-low/80 hover:bg-surface-container-low/80">
                <TableHead className="font-headline text-[11px] uppercase tracking-widest text-on-surface-variant">
                  {p.colLead}
                </TableHead>
                <TableHead className="font-headline text-[11px] uppercase tracking-widest text-on-surface-variant">
                  {p.colStatus}
                </TableHead>
                <TableHead className="font-headline text-[11px] uppercase tracking-widest text-on-surface-variant">
                  {p.colFabric}
                </TableHead>
                <TableHead className="text-right font-headline text-[11px] uppercase tracking-widest text-on-surface-variant">
                  {p.colDate}
                </TableHead>
                <TableHead className="text-right font-headline text-[11px] uppercase tracking-widest text-on-surface-variant">
                  {messages.admin.suppliersManagement.colActions}
                </TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {items.map((row) => (
                <TableRow key={row.leadId}>
                  <TableCell>
                    <div className="font-semibold text-on-surface">{row.companyName}</div>
                    <div className="text-xs text-on-surface-variant">
                      {row.contactName} · {row.email}
                    </div>
                    <div className="mt-1 line-clamp-2 text-xs text-on-surface-variant">{row.inquiryExcerpt}</div>
                  </TableCell>
                  <TableCell className="font-mono text-xs">{row.status}</TableCell>
                  <TableCell className="text-sm text-on-surface-variant">
                    {row.fabricTitle ? (
                      row.fabricSlug ? (
                        <Link className="text-primary hover:underline" href={withLocaleUrl(`/fabrics/${row.fabricSlug}`, locale)}>
                          {row.fabricTitle}
                        </Link>
                      ) : (
                        row.fabricTitle
                      )
                    ) : (
                      '—'
                    )}
                  </TableCell>
                  <TableCell className="text-right text-xs text-on-surface-variant">
                    {new Date(row.createdAt).toLocaleString()}
                  </TableCell>
                  <TableCell className="text-right">
                    <Button variant="outline" size="sm" className="rounded-lg text-xs" asChild>
                      <Link href={withLocaleUrl(`/admin/leads/${row.leadId}`, locale)}>{p.openLead}</Link>
                    </Button>
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>

          {meta && meta.totalPages > 1 ? (
            <div className="flex flex-col items-center justify-between gap-3 border-t border-outline/10 bg-surface-container-low/50 px-4 py-3 sm:flex-row">
              <p className="text-xs text-on-surface-variant">
                {messages.admin.suppliersManagement.paginationStatus
                  .replace('{page}', String(meta.page))
                  .replace('{totalPages}', String(meta.totalPages))
                  .replace('{total}', String(meta.total))}
              </p>
              <div className="flex gap-2">
                <Button
                  type="button"
                  variant="outline"
                  size="icon"
                  className="h-9 w-9"
                  disabled={meta.page <= 1}
                  onClick={() => setPage((x) => Math.max(1, x - 1))}
                  aria-label={messages.a11y.paginationPrev}
                >
                  <ChevronLeft className="h-4 w-4" />
                </Button>
                <Button
                  type="button"
                  variant="outline"
                  size="icon"
                  className="h-9 w-9"
                  disabled={meta.page >= meta.totalPages}
                  onClick={() => setPage((x) => x + 1)}
                  aria-label={messages.a11y.paginationNext}
                >
                  <ChevronRight className="h-4 w-4" />
                </Button>
              </div>
            </div>
          ) : null}
        </div>
      ) : null}
    </div>
  )
}
