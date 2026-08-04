'use client'

import Link from 'next/link'
import { useMemo, useState } from 'react'

import { Button } from '@/components/ui/button'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue
} from '@/components/ui/select'
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { AdminSupplierDiscoverySuppliersSkeleton } from '@/components/admin/supplier-discovery/admin-supplier-discovery-skeleton'
import {
  useApproveSupplierDraftMutation,
  useIngestDiscoveryRunMutation,
  useRejectSupplierDraftMutation,
  useRunSuppliersQuery,
  useSupplierDiscoveryRunQuery,
  useSupplierProductsQuery
} from '@/hooks/admin/useAdminSupplierDiscovery'
import { useI18n } from '@/hooks/useI18n'
import { withLocaleUrl } from '@/lib/i18n/locale-path'
import type {
  SupplierDiscoveryProductDraftStatus,
  SupplierDiscoveryRunProductsListFilters,
  SupplierDiscoveryRunSuppliersListFilters,
  SupplierDiscoverySource,
  SupplierDiscoverySupplierDraftStatus
} from '@/types/supplier-discovery.types'

const SUPPLIER_PAGE_SIZE = 10
const PRODUCT_PAGE_SIZE = 8

export interface AdminSupplierDiscoveryRunDetailClientProps {
  runId: number
}

export function AdminSupplierDiscoveryRunDetailClient({ runId }: AdminSupplierDiscoveryRunDetailClientProps) {
  const { messages, locale } = useI18n()
  const m = messages.admin.supplierDiscoveryPage

  const [supplierPage, setSupplierPage] = useState(1)
  const [selectedSupplierId, setSelectedSupplierId] = useState<number | null>(null)
  const [productPage, setProductPage] = useState(1)
  const [detailTab, setDetailTab] = useState('suppliers')
  const [supplierQualFilter, setSupplierQualFilter] = useState<'all' | 'true' | 'false'>('all')
  const [supplierStatusFilter, setSupplierStatusFilter] = useState<
    'all' | SupplierDiscoverySupplierDraftStatus
  >('all')
  const [supplierSourceFilter, setSupplierSourceFilter] = useState<'all' | SupplierDiscoverySource>('all')
  const [productStatusFilter, setProductStatusFilter] = useState<
    'all' | SupplierDiscoveryProductDraftStatus
  >('all')

  const supplierApiFilters = useMemo((): SupplierDiscoveryRunSuppliersListFilters => {
    const f: SupplierDiscoveryRunSuppliersListFilters = {}
    if (supplierQualFilter !== 'all') f.qualified = supplierQualFilter
    if (supplierStatusFilter !== 'all') f.status = supplierStatusFilter
    if (supplierSourceFilter !== 'all') f.source = supplierSourceFilter
    return f
  }, [supplierQualFilter, supplierStatusFilter, supplierSourceFilter])

  const productApiFilters = useMemo((): SupplierDiscoveryRunProductsListFilters => {
    const f: SupplierDiscoveryRunProductsListFilters = {}
    if (productStatusFilter !== 'all') f.status = productStatusFilter
    return f
  }, [productStatusFilter])

  const ingestRun = useIngestDiscoveryRunMutation({
    success: m.ingestSuccessToast,
    failed: m.requestFailed
  })
  const approveDraft = useApproveSupplierDraftMutation({
    success: m.approveToast,
    failed: m.requestFailed
  })
  const rejectDraft = useRejectSupplierDraftMutation({
    success: m.rejectToast,
    failed: m.requestFailed
  })

  const runDetailQuery = useSupplierDiscoveryRunQuery(runId, m.requestFailed)
  const suppliersQuery = useRunSuppliersQuery(
    runId,
    supplierPage,
    SUPPLIER_PAGE_SIZE,
    supplierApiFilters,
    m.requestFailed
  )
  const productsQuery = useSupplierProductsQuery(
    runId,
    selectedSupplierId,
    productPage,
    PRODUCT_PAGE_SIZE,
    productApiFilters,
    m.requestFailed
  )

  const setSupplierListPage = (next: number) => {
    setSupplierPage(next)
    setSelectedSupplierId(null)
    setDetailTab('suppliers')
  }

  const supplierTotal = suppliersQuery.data?.total ?? 0
  const supplierTotalPages = Math.max(1, Math.ceil(supplierTotal / SUPPLIER_PAGE_SIZE))
  const productTotal = productsQuery.data?.total ?? 0
  const productTotalPages = Math.max(1, Math.ceil(productTotal / PRODUCT_PAGE_SIZE))

  return (
    <div className="space-y-6">
      <div className="flex flex-wrap items-center gap-3">
        <Button variant="outline" size="sm" asChild>
          <Link href={withLocaleUrl('/admin/supplier-discovery', locale)}>{m.backToList}</Link>
        </Button>
      </div>

      <section className="rounded-xl border border-outline/15 bg-surface/30 p-4 md:p-6">
        <div className="flex flex-wrap items-center justify-between gap-3">
          <div>
            <h1 className="font-heading text-lg font-semibold tracking-tight md:text-xl">
              {m.runDetailTitle.replace('{id}', String(runId))}
            </h1>
            {runDetailQuery.data ? (
              <div className="mt-1 space-y-1 text-xs text-on-surface-variant">
                <p>
                  {m.runStatus}: {runDetailQuery.data.status} · {m.qualifiedCount}:{' '}
                  {runDetailQuery.data.suppliersQualified} · {m.colProducts}:{' '}
                  {runDetailQuery.data.productsExtracted}
                </p>
                <p className="text-[11px] leading-relaxed">
                  <span className="font-medium text-on-surface">{m.runCriteriaLabel}</span>{' '}
                  {m.runCriteriaLine
                    .replace('{y}', String(runDetailQuery.data.criteriaJson.minYearsExperience))
                    .replace('{c}', String(runDetailQuery.data.criteriaJson.minCatalogSize))
                    .replace('{m}', String(runDetailQuery.data.criteriaJson.maxMoqMeters))
                    .replace('{p}', String(runDetailQuery.data.criteriaJson.minProductPhotos))
                    .replace('{s}', String(runDetailQuery.data.criteriaJson.minPhotoQualityScore))}
                </p>
                {runDetailQuery.data.runNote ? (
                  <div className="mt-2 rounded-lg border border-outline/15 bg-surface-container-lowest p-3 text-[11px] leading-relaxed text-on-surface-variant">
                    <div className="font-medium text-on-surface">{m.runNoteLabel}</div>
                    <pre className="mt-1 whitespace-pre-wrap font-sans">{runDetailQuery.data.runNote}</pre>
                  </div>
                ) : null}
                {runDetailQuery.data.errorLog ? (
                  <div className="mt-2 rounded-lg border border-error/30 bg-error-container/30 p-3 text-[11px] leading-relaxed text-on-surface-variant">
                    <div className="font-medium text-on-surface">{m.errorLogLabel}</div>
                    <pre className="mt-1 whitespace-pre-wrap font-sans">{runDetailQuery.data.errorLog}</pre>
                  </div>
                ) : null}
              </div>
            ) : null}
          </div>
          <Button
            type="button"
            variant="default"
            disabled={ingestRun.isPending}
            onClick={() => ingestRun.mutate(runId)}
          >
            {ingestRun.isPending ? m.ingestPending : m.ingestApproved}
          </Button>
        </div>

        <div className="mt-4 grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
          <div className="space-y-1.5">
            <label className="text-xs font-medium text-on-surface-variant" htmlFor="sd-run-filter-qualified">
              {m.filterQualified}
            </label>
            <Select
              value={supplierQualFilter}
              onValueChange={(v) => {
                setSupplierQualFilter(v as 'all' | 'true' | 'false')
                setSupplierPage(1)
              }}
            >
              <SelectTrigger id="sd-run-filter-qualified" className="w-full">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">{m.filterQualifiedAll}</SelectItem>
                <SelectItem value="true">{m.filterQualifiedYes}</SelectItem>
                <SelectItem value="false">{m.filterQualifiedNo}</SelectItem>
              </SelectContent>
            </Select>
          </div>
          <div className="space-y-1.5">
            <label className="text-xs font-medium text-on-surface-variant" htmlFor="sd-run-filter-s-draft-status">
              {m.filterSupplierStatus}
            </label>
            <Select
              value={supplierStatusFilter}
              onValueChange={(v) => {
                setSupplierStatusFilter(v as 'all' | SupplierDiscoverySupplierDraftStatus)
                setSupplierPage(1)
              }}
            >
              <SelectTrigger id="sd-run-filter-s-draft-status" className="w-full">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">{m.filterSupplierStatusAll}</SelectItem>
                <SelectItem value="NEW">{m.draftStatusNew}</SelectItem>
                <SelectItem value="REVIEW_NEEDED">{m.draftStatusReview}</SelectItem>
                <SelectItem value="APPROVED_FOR_INGEST">{m.draftStatusApproved}</SelectItem>
                <SelectItem value="REJECTED">{m.draftStatusRejected}</SelectItem>
              </SelectContent>
            </Select>
          </div>
          <div className="space-y-1.5 sm:col-span-2 lg:col-span-1">
            <label className="text-xs font-medium text-on-surface-variant" htmlFor="sd-run-filter-source">
              {m.filterSource}
            </label>
            <Select
              value={supplierSourceFilter}
              onValueChange={(v) => {
                setSupplierSourceFilter(v as 'all' | SupplierDiscoverySource)
                setSupplierPage(1)
              }}
            >
              <SelectTrigger id="sd-run-filter-source" className="w-full">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">{m.filterSourceAll}</SelectItem>
                <SelectItem value="alibaba">{m.sourceAlibaba}</SelectItem>
                <SelectItem value="1688">{m.source1688}</SelectItem>
                <SelectItem value="made_in_china">{m.sourceMic}</SelectItem>
              </SelectContent>
            </Select>
          </div>
        </div>

        <Tabs value={detailTab} onValueChange={setDetailTab} className="mt-4 w-full">
          <TabsList>
            <TabsTrigger value="suppliers">{m.tabSuppliers}</TabsTrigger>
            <TabsTrigger value="products" disabled={selectedSupplierId === null}>
              {m.tabProducts}
            </TabsTrigger>
          </TabsList>
          <TabsContent value="suppliers" className="mt-4">
            {suppliersQuery.isLoading ? (
              <AdminSupplierDiscoverySuppliersSkeleton />
            ) : (
              <div className="overflow-x-auto rounded-lg border border-outline/15">
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>{m.colSupplier}</TableHead>
                      <TableHead>{m.colQualified}</TableHead>
                      <TableHead>{m.colStatus}</TableHead>
                      <TableHead className="text-end">{m.colReview}</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {(suppliersQuery.data?.suppliers ?? []).map((s) => (
                      <TableRow key={s.id}>
                        <TableCell className="max-w-[220px]">
                          <div className="font-medium">{s.name ?? '—'}</div>
                          <div className="truncate text-xs text-on-surface-variant">{s.supplierUrl}</div>
                        </TableCell>
                        <TableCell>{s.qualified ? m.yes : m.no}</TableCell>
                        <TableCell>{s.status}</TableCell>
                        <TableCell className="text-end">
                          <div className="flex flex-wrap justify-end gap-2">
                            <Button
                              size="sm"
                              variant="outline"
                              onClick={() => {
                                setSelectedSupplierId(s.id)
                                setProductPage(1)
                                setDetailTab('products')
                              }}
                            >
                              {m.viewProducts}
                            </Button>
                            <Button
                              size="sm"
                              variant="secondary"
                              disabled={approveDraft.isPending}
                              onClick={() => approveDraft.mutate(s.id)}
                            >
                              {m.approve}
                            </Button>
                            <Button
                              size="sm"
                              variant="ghost"
                              disabled={rejectDraft.isPending}
                              onClick={() => rejectDraft.mutate(s.id)}
                            >
                              {m.reject}
                            </Button>
                          </div>
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </div>
            )}
            {supplierTotalPages > 1 ? (
              <div className="mt-3 flex flex-wrap items-center justify-between gap-2 text-sm">
                <span className="text-on-surface-variant">
                  {m.suppliersPageLabel} {supplierPage} / {supplierTotalPages} ({supplierTotal})
                </span>
                <div className="flex gap-2">
                  <Button
                    type="button"
                    size="sm"
                    variant="outline"
                    disabled={supplierPage <= 1}
                    onClick={() => setSupplierListPage(Math.max(1, supplierPage - 1))}
                  >
                    {m.prev}
                  </Button>
                  <Button
                    type="button"
                    size="sm"
                    variant="outline"
                    disabled={supplierPage >= supplierTotalPages}
                    onClick={() => setSupplierListPage(supplierPage + 1)}
                  >
                    {m.next}
                  </Button>
                </div>
              </div>
            ) : null}
          </TabsContent>
          <TabsContent value="products" className="mt-4">
            {selectedSupplierId === null ? (
              <p className="text-sm text-on-surface-variant">{m.pickSupplierHint}</p>
            ) : (
              <div className="mb-4 max-w-xs space-y-1.5">
                <label className="text-xs font-medium text-on-surface-variant" htmlFor="sd-run-filter-p-status">
                  {m.filterProductStatus}
                </label>
                <Select
                  value={productStatusFilter}
                  onValueChange={(v) => {
                    setProductStatusFilter(v as 'all' | SupplierDiscoveryProductDraftStatus)
                    setProductPage(1)
                  }}
                >
                  <SelectTrigger id="sd-run-filter-p-status" className="w-full">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">{m.filterProductStatusAll}</SelectItem>
                    <SelectItem value="NEW">{m.productStatusNew}</SelectItem>
                    <SelectItem value="READY">{m.productStatusReady}</SelectItem>
                    <SelectItem value="NEEDS_REVIEW">{m.productStatusNeedsReview}</SelectItem>
                    <SelectItem value="REJECTED">{m.productStatusRejected}</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            )}
            {selectedSupplierId === null ? null : productsQuery.isLoading ? (
              <AdminSupplierDiscoverySuppliersSkeleton />
            ) : (
              <div className="overflow-x-auto rounded-lg border border-outline/15">
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>{m.colTitle}</TableHead>
                      <TableHead>{m.colMoq}</TableHead>
                      <TableHead>{m.colPhotos}</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {(productsQuery.data?.products ?? []).map((p) => (
                      <TableRow key={p.id}>
                        <TableCell className="max-w-xs">
                          <div className="font-medium">{p.rawTitle}</div>
                          <div className="truncate text-xs text-on-surface-variant">{p.productUrl}</div>
                        </TableCell>
                        <TableCell>{p.moqMeters ?? p.moqText ?? '—'}</TableCell>
                        <TableCell>{p.photoCount}</TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </div>
            )}
            {selectedSupplierId !== null && productTotalPages > 1 ? (
              <div className="mt-3 flex flex-wrap items-center justify-between gap-2 text-sm">
                <span className="text-on-surface-variant">
                  {m.productsPageLabel} {productPage} / {productTotalPages} ({productTotal})
                </span>
                <div className="flex gap-2">
                  <Button
                    type="button"
                    size="sm"
                    variant="outline"
                    disabled={productPage <= 1}
                    onClick={() => setProductPage((p) => Math.max(1, p - 1))}
                  >
                    {m.prev}
                  </Button>
                  <Button
                    type="button"
                    size="sm"
                    variant="outline"
                    disabled={productPage >= productTotalPages}
                    onClick={() => setProductPage((p) => p + 1)}
                  >
                    {m.next}
                  </Button>
                </div>
              </div>
            ) : null}
          </TabsContent>
        </Tabs>
      </section>
    </div>
  )
}
