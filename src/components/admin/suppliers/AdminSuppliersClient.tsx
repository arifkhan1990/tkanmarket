'use client'

import * as React from 'react'
import Image from 'next/image'
import Link from 'next/link'
import { usePathname, useRouter, useSearchParams } from 'next/navigation'
import { ChevronLeft, ChevronRight, Search } from 'lucide-react'

import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table'
import { SupplierSuiteSubNav } from '@/components/admin/suppliers/supplier-suite-subnav'
import { useAdminSupplierInsightsQuery } from '@/hooks/admin/useAdminSupplierSuiteQueries'
import { useAdminSuppliersQuery } from '@/hooks/admin/useAdminSuppliersQuery'
import { useI18n } from '@/hooks/useI18n'
import { withLocaleUrl } from '@/lib/i18n/locale-path'
import { cn } from '@/lib/utils'

function useDebouncedValue(value: string, ms: number) {
  const [v, setV] = React.useState(value)
  React.useEffect(() => {
    const t = window.setTimeout(() => setV(value), ms)
    return () => window.clearTimeout(t)
  }, [value, ms])
  return v
}

function TableSkeleton() {
  return (
    <div className="overflow-hidden rounded-2xl border border-outline/10 bg-surface-container-lowest/80 shadow-sm dark:border-outline/15">
      <div className="h-12 animate-pulse bg-surface-container-high" />
      {Array.from({ length: 8 }).map((_, i) => (
        <div key={i} className="h-14 animate-pulse border-t border-outline/10 bg-surface-container-lowest/50" />
      ))}
    </div>
  )
}

export function AdminSuppliersClient() {
  const { messages, locale } = useI18n()
  const m = messages.admin.suppliersManagement
  const router = useRouter()
  const pathname = usePathname()
  const searchParams = useSearchParams()

  const [page, setPage] = React.useState(1)
  const [q, setQ] = React.useState(() => searchParams.get('q') ?? '')
  const debouncedQ = useDebouncedValue(q, 320)
  const limit = 20

  React.useEffect(() => {
    const onPopState = () => {
      const params = new URLSearchParams(window.location.search)
      setQ(params.get('q') ?? '')
    }
    window.addEventListener('popstate', onPopState)
    return () => window.removeEventListener('popstate', onPopState)
  }, [])

  React.useEffect(() => {
    setPage(1)
  }, [debouncedQ])

  React.useEffect(() => {
    const params = new URLSearchParams(searchParams.toString())
    const trimmed = debouncedQ.trim()
    if (trimmed) params.set('q', trimmed)
    else params.delete('q')
    const qs = params.toString()
    if (qs === searchParams.toString()) return
    const nextPath = qs ? `${pathname}?${qs}` : pathname
    router.replace(nextPath, { scroll: false })
  }, [debouncedQ, pathname, router, searchParams])

  const query = useAdminSuppliersQuery({ page, limit, q: debouncedQ })
  const insights = useAdminSupplierInsightsQuery()

  const items = query.data?.items ?? []
  const meta = query.data?.meta
  const su = messages.admin.supplierSuite

  return (
    <div className="space-y-6">
      <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h1 className="font-heading text-heading-xl font-extrabold tracking-tight">{m.title}</h1>
          <p className="mt-1 text-sm text-on-surface-variant">{m.subtitle}</p>
        </div>
        <div className="flex flex-wrap items-center gap-2">
          <Button type="button" variant="outline" size="sm" className="rounded-xl" asChild>
            <Link href={withLocaleUrl('/admin/suppliers/analytics', locale)}>{m.linkAnalytics}</Link>
          </Button>
          <Button type="button" variant="secondary" size="sm" className="rounded-xl" asChild>
            <Link href={withLocaleUrl('/admin/suppliers/compliance', locale)}>{m.linkCompliance}</Link>
          </Button>
        </div>
      </div>

      <div className="relative w-full max-w-md">
        <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-outline" aria-hidden />
        <Input
          value={q}
          onChange={(e) => setQ(e.target.value)}
          placeholder={m.searchPlaceholder}
          className="rounded-xl border-none bg-surface-container-highest pl-10"
          aria-label={m.searchPlaceholder}
        />
      </div>

      <SupplierSuiteSubNav className="mb-0" />

      {insights.data ? (
        <section
          className="rounded-2xl border border-outline/10 bg-surface-container-lowest/80 p-3 shadow-sm sm:p-4 dark:border-outline/15"
          aria-label={su.snapshotTitle}
        >
          <div className="grid gap-2.5 sm:grid-cols-2 sm:gap-3 lg:grid-cols-4">
            <div className="rounded-xl border border-outline/10 bg-surface-container-lowest p-4 shadow-sm dark:border-outline/15">
              <p className="text-xs font-bold uppercase tracking-widest text-on-surface-variant">{su.onboardingTotal}</p>
              <p className="mt-2 font-heading text-2xl font-extrabold tabular-nums">{insights.data.totalSuppliers}</p>
            </div>
            <div className="rounded-xl border border-outline/10 bg-surface-container-lowest p-4 shadow-sm dark:border-outline/15">
              <p className="text-xs font-bold uppercase tracking-widest text-on-surface-variant">{su.stepVerification}</p>
              <p className="mt-2 font-heading text-2xl font-extrabold tabular-nums">{insights.data.verifiedSuppliers}</p>
            </div>
            <div className="rounded-xl border border-outline/10 bg-surface-container-lowest p-4 shadow-sm dark:border-outline/15">
              <p className="text-xs font-bold uppercase tracking-widest text-on-surface-variant">{su.stepCatalog}</p>
              <p className="mt-2 font-heading text-2xl font-extrabold tabular-nums">{insights.data.approvedFabrics}</p>
            </div>
            <div className="rounded-xl border border-outline/10 bg-surface-container-lowest p-4 shadow-sm dark:border-outline/15">
              <p className="text-xs font-bold uppercase tracking-widest text-on-surface-variant">{su.inquiriesTitle}</p>
              <p className="mt-2 font-heading text-2xl font-extrabold tabular-nums">{insights.data.marketplaceInquiries}</p>
            </div>
          </div>
        </section>
      ) : null}

      {query.isError ? (
        <div className="flex flex-col gap-3 rounded-2xl border border-destructive/25 bg-destructive/5 px-4 py-4 sm:flex-row sm:items-center sm:justify-between">
          <p className="text-sm text-destructive">
            {query.error instanceof Error ? query.error.message : m.loadError}
          </p>
          <Button
            type="button"
            variant="outline"
            size="sm"
            className="shrink-0"
            disabled={query.isFetching}
            onClick={() => void query.refetch()}
          >
            {m.retry}
          </Button>
        </div>
      ) : null}

      {query.isFetching && !query.data ? <TableSkeleton /> : null}

      {query.isSuccess && items.length === 0 ? (
        <p className="rounded-2xl border border-dashed border-outline/20 bg-surface-container-low/40 px-6 py-12 text-center text-on-surface-variant dark:border-outline/15">
          {m.empty}
        </p>
      ) : null}

      {query.isSuccess && items.length > 0 ? (
        <div className="overflow-hidden rounded-2xl border border-outline/10 bg-surface-container-lowest/80 shadow-sm dark:border-outline/15">
          <Table>
            <TableHeader>
              <TableRow className="bg-surface-container-low/80 hover:bg-surface-container-low/80">
                <TableHead className="font-headline text-[11px] uppercase tracking-widest text-on-surface-variant">
                  {m.colSupplier}
                </TableHead>
                <TableHead className="font-headline text-[11px] uppercase tracking-widest text-on-surface-variant">
                  {m.colLocation}
                </TableHead>
                <TableHead className="font-headline text-[11px] uppercase tracking-widest text-on-surface-variant">
                  {m.colStatus}
                </TableHead>
                <TableHead className="text-right font-headline text-[11px] uppercase tracking-widest text-on-surface-variant">
                  {m.colActions}
                </TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {items.map((row) => (
                <TableRow key={row.id} className="group">
                  <TableCell>
                    <div className="flex items-center gap-3">
                      <div className="relative h-10 w-10 shrink-0 overflow-hidden rounded-xl bg-surface-container-high">
                        {row.logoUrl ? (
                          <Image src={row.logoUrl} alt={row.name} fill sizes="40px" className="object-contain" />
                        ) : (
                          <span className="flex h-full w-full items-center justify-center text-xs font-bold text-on-surface-variant">
                            {row.name.slice(0, 2).toUpperCase()}
                          </span>
                        )}
                      </div>
                      <div className="min-w-0">
                        <div className="truncate font-semibold text-on-surface">{row.name}</div>
                        <div className="truncate font-mono text-xs text-on-surface-variant">{row.slug}</div>
                      </div>
                    </div>
                  </TableCell>
                  <TableCell className="text-sm text-on-surface-variant">
                    {row.country}
                    {row.city ? ` · ${row.city}` : ''}
                  </TableCell>
                  <TableCell>
                    <span
                      className={cn(
                        'inline-flex rounded-full px-2.5 py-0.5 text-xs font-bold',
                        row.verified ? 'bg-emerald-100 text-emerald-800 dark:bg-emerald-950/40 dark:text-emerald-300' : 'bg-amber-100 text-amber-900 dark:bg-amber-950/40 dark:text-amber-200'
                      )}
                    >
                      {row.verified ? m.verified : m.notVerified}
                    </span>
                  </TableCell>
                  <TableCell className="text-right">
                    <div className="flex flex-wrap justify-end gap-2 opacity-100 sm:opacity-0 sm:transition-opacity sm:group-hover:opacity-100">
                      <Button variant="outline" size="sm" className="rounded-lg text-xs" asChild>
                        <Link href={withLocaleUrl(`/admin/suppliers/${row.id}/edit`, locale)}>{m.editSupplier}</Link>
                      </Button>
                      <Button variant="outline" size="sm" className="rounded-lg text-xs" asChild>
                        <Link href={withLocaleUrl(`/admin/suppliers/${row.id}/inquiries`, locale)}>{m.viewInquiries}</Link>
                      </Button>
                      <Button variant="outline" size="sm" className="rounded-lg text-xs" asChild>
                        <Link href={withLocaleUrl(`/admin/fabrics?supplier_id=${row.id}`, locale)}>{m.viewFabrics}</Link>
                      </Button>
                      <Button variant="default" size="sm" className="rounded-lg text-xs" asChild>
                        <Link href={withLocaleUrl(`/suppliers/${row.slug}`, locale)}>{m.viewPublic}</Link>
                      </Button>
                    </div>
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>

          {meta && meta.totalPages > 1 ? (
            <div className="flex flex-col items-center justify-between gap-3 border-t border-outline/10 bg-surface-container-low/50 px-4 py-3 sm:flex-row">
              <p className="text-xs text-on-surface-variant">
                {m.paginationStatus
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
                  onClick={() => setPage((p) => Math.max(1, p - 1))}
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
                  onClick={() => setPage((p) => p + 1)}
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
