'use client'

import Link from 'next/link'
import { useState } from 'react'

import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table'
import { AdminSupplierDiscoveryRunsSkeleton } from '@/components/admin/supplier-discovery/admin-supplier-discovery-skeleton'
import { SupplierDiscoveryCriteriaFields } from '@/components/admin/supplier-discovery/supplier-discovery-criteria-fields'
import { TableRowSkeleton } from '@/components/common/LoadingSkeleton/TableRowSkeleton'
import { useCreateSupplierDiscoveryRunMutation, useSupplierDiscoveryRunsQuery } from '@/hooks/admin/useAdminSupplierDiscovery'
import { useI18n } from '@/hooks/useI18n'
import { withLocaleUrl } from '@/lib/i18n/locale-path'
import {
  criteriaFormToPayload,
  initialSupplierDiscoveryCriteriaForm,
  type SupplierDiscoveryCriteriaFormState
} from '@/types/supplier-discovery-form.types'
import type { SupplierDiscoverySource } from '@/types/supplier-discovery.types'

const SOURCES: SupplierDiscoverySource[] = ['alibaba', '1688', 'made_in_china']

export function AdminSupplierDiscoveryClient() {
  const { messages, locale } = useI18n()
  const m = messages.admin.supplierDiscoveryPage

  const [page, setPage] = useState(1)
  const limit = 12
  const runsQuery = useSupplierDiscoveryRunsQuery(page, limit, m.requestFailed)
  const createRun = useCreateSupplierDiscoveryRunMutation({
    success: m.runQueuedToast,
    failed: m.requestFailed
  })

  const [keywordsInput, setKeywordsInput] = useState('cotton fabric, polyester fabric')
  const [sources, setSources] = useState<SupplierDiscoverySource[]>(['alibaba', '1688'])
  const [maxSuppliers, setMaxSuppliers] = useState('40')
  const [maxProducts, setMaxProducts] = useState('8')
  const [criteriaForm, setCriteriaForm] = useState<SupplierDiscoveryCriteriaFormState>(initialSupplierDiscoveryCriteriaForm)

  const parseKeywords = (value: string) =>
    value
      .split(',')
      .map((x) => x.trim())
      .filter(Boolean)
      .slice(0, 25)

  const toggleSource = (s: SupplierDiscoverySource) => {
    setSources((prev) => (prev.includes(s) ? prev.filter((x) => x !== s) : [...prev, s]))
  }

  const onStart = () => {
    const keywords = parseKeywords(keywordsInput)
    if (keywords.length === 0 || sources.length === 0) return
    const ms = Math.min(500, Math.max(1, Number(maxSuppliers) || 40))
    const mp = Math.min(100, Math.max(1, Number(maxProducts) || 8))
    createRun.mutate({
      sources,
      keywords,
      max_suppliers: ms,
      max_products_per_supplier: mp,
      criteria: criteriaFormToPayload(criteriaForm)
    })
  }

  const runs = runsQuery.data?.runs ?? []
  const meta = runsQuery.data
    ? {
        total: runsQuery.data.total,
        totalPages: Math.max(1, Math.ceil(runsQuery.data.total / limit))
      }
    : null

  return (
    <div className="space-y-8">
      <div>
        <h1 className="font-heading text-heading-xl font-extrabold tracking-tight">{m.title}</h1>
        <p className="mt-2 max-w-3xl text-sm text-on-surface-variant">{m.subtitle}</p>
      </div>

      <section className="rounded-xl border border-outline/15 bg-surface/40 p-4 md:p-6">
        <h2 className="text-sm font-semibold text-on-surface">{m.triggerSection}</h2>
        <div className="mt-4 grid gap-4 md:grid-cols-2 lg:grid-cols-3">
          <div className="space-y-2 md:col-span-2">
            <label className="text-xs font-medium text-on-surface-variant" htmlFor="sd-keywords">
              {m.keywordsLabel}
            </label>
            <Input
              id="sd-keywords"
              value={keywordsInput}
              onChange={(e) => setKeywordsInput(e.target.value)}
              placeholder={m.keywordsPlaceholder}
            />
          </div>
          <div className="space-y-2">
            <span className="text-xs font-medium text-on-surface-variant">{m.sourcesLabel}</span>
            <div className="flex flex-wrap gap-2">
              {SOURCES.map((s) => (
                <Button
                  key={s}
                  type="button"
                  size="sm"
                  variant={sources.includes(s) ? 'default' : 'outline'}
                  onClick={() => toggleSource(s)}
                >
                  {s === 'alibaba' ? m.sourceAlibaba : s === '1688' ? m.source1688 : m.sourceMic}
                </Button>
              ))}
            </div>
          </div>
          <div className="space-y-2">
            <label className="text-xs font-medium text-on-surface-variant" htmlFor="sd-max-s">
              {m.maxSuppliersLabel}
            </label>
            <Input
              id="sd-max-s"
              inputMode="numeric"
              value={maxSuppliers}
              onChange={(e) => setMaxSuppliers(e.target.value)}
            />
          </div>
          <div className="space-y-2">
            <label className="text-xs font-medium text-on-surface-variant" htmlFor="sd-max-p">
              {m.maxProductsLabel}
            </label>
            <Input
              id="sd-max-p"
              inputMode="numeric"
              value={maxProducts}
              onChange={(e) => setMaxProducts(e.target.value)}
            />
          </div>
        </div>
        <SupplierDiscoveryCriteriaFields
          values={criteriaForm}
          onChange={(patch) => setCriteriaForm((prev) => ({ ...prev, ...patch }))}
          labels={{
            criteriaSection: m.criteriaSection,
            criteriaHint: m.criteriaHint,
            minYearsLabel: m.minYearsLabel,
            minCatalogLabel: m.minCatalogLabel,
            maxMoqLabel: m.maxMoqLabel,
            minPhotosLabel: m.minPhotosLabel,
            minPhotoScoreLabel: m.minPhotoScoreLabel
          }}
        />
        <div className="mt-4 flex flex-wrap gap-3">
          <Button type="button" disabled={createRun.isPending} onClick={onStart}>
            {createRun.isPending ? m.triggerPending : m.triggerNow}
          </Button>
        </div>
      </section>

      <section>
        <h2 className="text-sm font-semibold text-on-surface">{m.runsSection}</h2>
        {runsQuery.isLoading ? (
          <AdminSupplierDiscoveryRunsSkeleton />
        ) : (
          <div className="mt-3 overflow-x-auto rounded-lg border border-outline/15">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>{m.colId}</TableHead>
                  <TableHead>{m.colStatus}</TableHead>
                  <TableHead>{m.colKeywords}</TableHead>
                  <TableHead>{m.colSuppliers}</TableHead>
                  <TableHead>{m.colProducts}</TableHead>
                  <TableHead className="text-end">{m.colActions}</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {runsQuery.isFetching && !runsQuery.isLoading ? (
                  Array.from({ length: 4 }).map((_, i) => <TableRowSkeleton key={i} asTableRow columns={6} />)
                ) : (
                  runs.map((r) => (
                    <TableRow key={r.id}>
                      <TableCell className="font-mono text-xs">{r.id}</TableCell>
                      <TableCell>{r.status}</TableCell>
                      <TableCell className="max-w-[200px] truncate text-xs">{r.keywords.join(', ')}</TableCell>
                      <TableCell>{r.suppliersFound}</TableCell>
                      <TableCell>{r.productsExtracted}</TableCell>
                      <TableCell className="text-end">
                        <Button size="sm" variant="outline" asChild>
                          <Link href={withLocaleUrl(`/admin/supplier-discovery/${r.id}`, locale)}>
                            {m.openRun}
                          </Link>
                        </Button>
                      </TableCell>
                    </TableRow>
                  ))
                )}
              </TableBody>
            </Table>
          </div>
        )}
        {meta && meta.totalPages > 1 ? (
          <div className="mt-3 flex flex-wrap items-center justify-between gap-2 text-sm">
            <span className="text-on-surface-variant">
              {m.pageLabel} {page} / {meta.totalPages}
            </span>
            <div className="flex gap-2">
              <Button
                type="button"
                size="sm"
                variant="outline"
                disabled={page <= 1}
                onClick={() => setPage((p) => Math.max(1, p - 1))}
              >
                {m.prev}
              </Button>
              <Button
                type="button"
                size="sm"
                variant="outline"
                disabled={page >= meta.totalPages}
                onClick={() => setPage((p) => p + 1)}
              >
                {m.next}
              </Button>
            </div>
          </div>
        ) : null}
      </section>
    </div>
  )
}
