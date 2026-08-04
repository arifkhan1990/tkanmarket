'use client'

import * as React from 'react'

import { AdminCatalogExportMappingBlock } from '@/components/admin/catalog/admin-catalog-export-mapping-block'
import { useAdminCatalogExportsQuery, useAdminCreateCatalogExportMutation } from '@/hooks/admin/useAdminCatalogExports'
import type { CatalogExportFormat } from '@/types/admin-catalog-export.types'
import { cn } from '@/lib/utils'

function SummarySkeleton() {
  return (
    <div className="mb-8 grid grid-cols-1 gap-4 xl:grid-cols-12">
      <div className="xl:col-span-8 space-y-4">
        <div className="h-24 rounded-xl bg-surface-container-high animate-pulse" />
        <div className="h-64 rounded-xl bg-surface-container-high animate-pulse" />
      </div>
      <div className="xl:col-span-4 space-y-4">
        <div className="h-40 rounded-xl bg-surface-container-high animate-pulse" />
        <div className="h-32 rounded-xl bg-surface-container-high animate-pulse" />
      </div>
    </div>
  )
}

const FIELD_OPTIONS = [
  { key: 'title', label: 'Title' },
  { key: 'specs', label: 'Specs' },
  { key: 'price', label: 'Price' },
  { key: 'supplier', label: 'Supplier' },
  { key: 'sku', label: 'SKU Code' },
  { key: 'stock', label: 'Stock Level' },
  { key: 'composition', label: 'Composition' },
  { key: 'lead_time', label: 'Lead Time' }
] as const

function buildDefaultExportKeys(): Record<string, string> {
  const o: Record<string, string> = {}
  for (const f of FIELD_OPTIONS) {
    o[f.key] = f.key === 'lead_time' ? 'LeadTime' : f.label.replace(/\s+/g, '')
  }
  return o
}

export function AdminCatalogExportClient({ variant = 'catalog' }: { variant?: 'catalog' | 'configurator' }) {
  const overviewQuery = useAdminCatalogExportsQuery()
  const createExport = useAdminCreateCatalogExportMutation()

  const data = overviewQuery.data

  const [format, setFormat] = React.useState<CatalogExportFormat>('CSV')
  const [selectedFields, setSelectedFields] = React.useState<Set<string>>(
    () => new Set(['title', 'specs', 'price', 'supplier'])
  )
  const [exportKeyByField, setExportKeyByField] = React.useState<Record<string, string>>(buildDefaultExportKeys)
  const [filterStatus, setFilterStatus] = React.useState('all')
  const [filterCategory, setFilterCategory] = React.useState('all')
  const [filterSupplier, setFilterSupplier] = React.useState('all')

  const toggleField = (key: string) => {
    setSelectedFields((prev) => {
      const next = new Set(prev)
      if (next.has(key)) {
        if (next.size <= 1) return prev
        next.delete(key)
      } else {
        next.add(key)
      }
      return next
    })
  }

  const handleInitializeExport = () => {
    if (createExport.isPending) return
    const fields = Array.from(selectedFields)
    if (fields.length === 0) return

    createExport.mutate({
      format,
      fields,
      filters: {
        status: filterStatus === 'all' ? undefined : filterStatus,
        category: filterCategory === 'all' ? undefined : filterCategory,
        supplier: filterSupplier === 'all' ? undefined : filterSupplier
      }
    })
  }

  const previewJson = React.useMemo(() => {
    const o: Record<string, string> = {}
    for (const k of selectedFields) {
      const exportKey = exportKeyByField[k] ?? k
      o[exportKey] = `sample_${k}`
    }
    return JSON.stringify({ ...o, ExportTimestamp: new Date().toISOString() }, null, 2)
  }, [selectedFields, exportKeyByField])

  const activeFieldKeys = React.useMemo(() => Array.from(selectedFields), [selectedFields])

  const title = variant === 'configurator' ? 'System export configurator' : 'Catalog export tool'
  const subtitle =
    variant === 'configurator'
      ? 'Map relational fabric fields and preview payloads before scheduling high-volume exports.'
      : 'Configure and generate high-volume fabric data extractions for external processing.'

  return (
    <div className="mx-auto max-w-[1600px] space-y-6 pb-10">
      <header className="flex flex-col gap-3 sm:flex-row sm:items-end sm:justify-between">
        <div className="min-w-0">
          <h1 className="font-heading text-3xl font-extrabold tracking-tight text-on-surface md:text-4xl">{title}</h1>
          <p className="mt-2 max-w-3xl text-sm text-on-surface-variant">{subtitle}</p>
        </div>
      </header>

      {variant === 'configurator' && data ? (
        <div>
          <AdminCatalogExportMappingBlock
            fieldOptions={FIELD_OPTIONS as unknown as { key: string; label: string }[]}
            activeKeys={activeFieldKeys}
            exportKeyByField={exportKeyByField}
            onExportKeyChange={(k, v) => setExportKeyByField((prev) => ({ ...prev, [k]: v }))}
            onRemoveMapping={(k) => toggleField(k)}
            format={format}
            previewJson={previewJson}
          />
        </div>
      ) : null}

      {overviewQuery.isLoading && !data ? <SummarySkeleton /> : null}

      {data ? (
        <div className="grid grid-cols-1 items-start gap-8 xl:grid-cols-12">
          <section className="space-y-8 rounded-2xl border border-outline/10 bg-surface-container-low p-6 shadow-sm xl:col-span-8 dark:border-outline/15">
            <div className="rounded-xl bg-surface-container-lowest p-4 shadow-sm">
              <div className="mb-4 flex items-center justify-between">
                <div>
                  <h2 className="font-semibold text-on-surface">Active Export Generation</h2>
                  <p className="text-xs text-on-surface-variant">
                    System progress for the most recent export job.
                  </p>
                </div>
                <span className="font-mono text-sm text-primary">
                  {data.metrics.totalExportsThisMonth.toLocaleString()} this month
                </span>
              </div>
              {data.activeJob ? (
                <div className="space-y-3">
                  <p className="font-mono text-sm text-primary">
                    #{data.activeJob.id} • {data.activeJob.jobName}
                  </p>
                  <div className="h-2 w-full overflow-hidden rounded-full bg-surface-container-highest">
                    <div
                      className="h-full rounded-full bg-gradient-to-r from-primary to-primary-container transition-all duration-1000"
                      style={{
                        width:
                          data.activeJob.status === 'COMPLETED'
                            ? '100%'
                            : data.activeJob.status === 'RUNNING'
                              ? '68%'
                              : '12%'
                      }}
                    />
                  </div>
                  <p className="text-xs text-on-surface-variant">
                    {data.activeJob.recordCount.toLocaleString()} records • {data.activeJob.status}
                  </p>
                </div>
              ) : (
                <p className="text-sm text-on-surface-variant">
                  No active export. Initialize a new export job to begin.
                </p>
              )}
            </div>

            <div className="space-y-8 rounded-xl bg-surface-container-lowest p-6 shadow-sm">
              <section>
                <h3 className="mb-4 flex items-center gap-2 text-sm font-bold uppercase tracking-widest text-on-surface-variant">
                  <span className="text-base">Format</span>
                  <span className="rounded-full bg-surface-container-high px-2 py-0.5 text-[10px] font-semibold">
                    Required
                  </span>
                </h3>
                <div className="grid grid-cols-1 gap-4 md:grid-cols-3">
                  {(
                    [
                      { id: 'CSV' as const, title: 'CSV', hint: 'Best for spreadsheets.' },
                      { id: 'XLSX' as const, title: 'XLSX', hint: 'Formatted Excel workbook.' },
                      { id: 'JSON' as const, title: 'JSON', hint: 'Developer-friendly schema.' }
                    ] as const
                  ).map((opt) => (
                    <button
                      key={opt.id}
                      type="button"
                      onClick={() => setFormat(opt.id)}
                      className={cn(
                        'rounded-xl border p-4 text-left transition-colors',
                        format === opt.id
                          ? 'border-primary bg-primary-fixed/30 ring-2 ring-primary/20'
                          : 'border-outline-variant/20 bg-surface-container-low hover:bg-surface-container-high'
                      )}
                    >
                      <p className="text-sm font-semibold text-on-surface">{opt.title}</p>
                      <p className="mt-1 text-xs text-on-surface-variant">{opt.hint}</p>
                    </button>
                  ))}
                </div>
              </section>

              <section>
                <h3 className="mb-4 text-sm font-bold uppercase tracking-widest text-on-surface-variant">
                  Data fields
                </h3>
                <div className="grid grid-cols-2 gap-y-3 md:grid-cols-4">
                  {FIELD_OPTIONS.map((f) => (
                    <label key={f.key} className="flex cursor-pointer items-center gap-2 text-sm">
                      <input
                        type="checkbox"
                        className="h-4 w-4 rounded border-outline-variant text-primary focus:ring-primary"
                        checked={selectedFields.has(f.key)}
                        onChange={() => toggleField(f.key)}
                      />
                      <span className="text-on-surface">{f.label}</span>
                    </label>
                  ))}
                </div>
              </section>

              <section>
                <h3 className="mb-4 text-sm font-bold uppercase tracking-widest text-on-surface-variant">
                  Extraction filters
                </h3>
                <div className="grid grid-cols-1 gap-4 md:grid-cols-3">
                  <div className="space-y-1">
                    <p className="text-xs font-semibold uppercase tracking-widest text-on-surface-variant">
                      Status
                    </p>
                    <select
                      className="w-full rounded-xl border-none bg-surface-container-highest px-4 py-3 text-sm focus:ring-2 focus:ring-primary/20"
                      value={filterStatus}
                      onChange={(e) => setFilterStatus(e.target.value)}
                    >
                      <option value="all">All products</option>
                      <option value="approved">Active / approved</option>
                      <option value="ai_processed">AI processed</option>
                      <option value="raw_scraped">Raw scraped</option>
                    </select>
                  </div>
                  <div className="space-y-1">
                    <p className="text-xs font-semibold uppercase tracking-widest text-on-surface-variant">
                      Category
                    </p>
                    <select
                      className="w-full rounded-xl border-none bg-surface-container-highest px-4 py-3 text-sm focus:ring-2 focus:ring-primary/20"
                      value={filterCategory}
                      onChange={(e) => setFilterCategory(e.target.value)}
                    >
                      <option value="all">All fabrics</option>
                      <option value="woven">Woven</option>
                      <option value="knit">Knit</option>
                      <option value="technical">Technical</option>
                    </select>
                  </div>
                  <div className="space-y-1">
                    <p className="text-xs font-semibold uppercase tracking-widest text-on-surface-variant">
                      Supplier region
                    </p>
                    <select
                      className="w-full rounded-xl border-none bg-surface-container-highest px-4 py-3 text-sm focus:ring-2 focus:ring-primary/20"
                      value={filterSupplier}
                      onChange={(e) => setFilterSupplier(e.target.value)}
                    >
                      <option value="all">Global suppliers</option>
                      <option value="China">China</option>
                      <option value="EU">Europe</option>
                    </select>
                  </div>
                </div>
              </section>

              <div className="flex justify-end border-t border-outline-variant/10 pt-6">
                <button
                  type="button"
                  onClick={handleInitializeExport}
                  className="inline-flex items-center gap-2 rounded-xl bg-gradient-to-br from-primary to-primary-container px-6 py-3 text-sm font-semibold text-on-primary shadow-lg shadow-primary/20 transition-transform hover:scale-[1.02] active:scale-95"
                  disabled={createExport.isPending}
                >
                  Initialize Export
                </button>
              </div>
            </div>
          </section>

          <aside className="space-y-6 xl:col-span-4">
            <section className="rounded-2xl border border-outline/10 bg-surface-container-low p-6 shadow-sm dark:border-outline/15">
              <div className="mb-4 flex items-center justify-between">
                <h2 className="text-sm font-bold uppercase tracking-widest text-on-surface-variant">
                  Export history
                </h2>
              </div>
              <div className="space-y-3">
                {data.recentJobs.map((job) => (
                  <div
                    key={job.id}
                    className="rounded-xl bg-surface-container-lowest p-3 text-sm shadow-sm"
                  >
                    <div className="flex items-center justify-between">
                      <div>
                        <p className="font-semibold text-on-surface">{job.jobName}</p>
                        <p className="text-[11px] font-mono text-on-surface-variant">
                          {new Date(job.createdAt).toLocaleString()}
                        </p>
                      </div>
                      <span className="rounded-full bg-surface-container-high px-2 py-0.5 text-[10px] font-bold uppercase">
                        {job.format}
                      </span>
                    </div>
                    <div className="mt-2 flex items-center justify-between text-xs text-on-surface-variant">
                      <span>{job.recordCount.toLocaleString()} records</span>
                      <span>{job.status}</span>
                    </div>
                  </div>
                ))}
                {data.recentJobs.length === 0 ? (
                  <p className="text-sm text-on-surface-variant">No exports have been generated yet.</p>
                ) : null}
              </div>
            </section>

            <section className="relative overflow-hidden rounded-2xl bg-inverse-surface p-6 text-inverse-on-surface">
              <div className="relative z-10 space-y-2">
                <h3 className="font-semibold">Usage Insights</h3>
                <p className="text-xs text-on-surface-variant">
                  Track how much of your monthly export quota has been used.
                </p>
                <div className="mt-2 flex items-end gap-2">
                  <span className="text-2xl font-extrabold">
                    {(data.metrics.usedBytesThisMonth / (1024 * 1024 * 1024)).toFixed(1)}
                  </span>
                  <span className="mb-1 text-xs font-mono text-on-surface-variant">
                    GB / {(data.metrics.quotaBytes / (1024 * 1024 * 1024)).toFixed(1)}GB
                  </span>
                </div>
              </div>
              <div className="absolute -right-6 -bottom-6 opacity-10">
                <div className="h-24 w-24 rounded-full bg-primary" />
              </div>
            </section>
          </aside>
        </div>
      ) : null}

      {!overviewQuery.isLoading && !data ? (
        <p className="py-10 text-center text-on-surface-variant">
          No catalog export activity found for this environment.
        </p>
      ) : null}

      {variant === 'configurator' && data ? (
        <section className="mt-12 space-y-4">
          <div className="flex flex-col justify-between gap-2 sm:flex-row sm:items-end">
            <div>
              <h2 className="font-headline text-2xl font-bold">Export logs</h2>
              <p className="text-sm text-muted-foreground">Recent jobs from the catalog export pipeline</p>
            </div>
          </div>
          <div className="overflow-hidden rounded-2xl border border-border bg-surface-container-lowest">
            <div className="grid grid-cols-5 gap-2 border-b border-border bg-muted/50 p-4 text-[10px] font-bold uppercase tracking-widest text-muted-foreground md:gap-4">
              <div>Export ID</div>
              <div>Timestamp</div>
              <div>Records</div>
              <div>Status</div>
              <div className="text-right">Format</div>
            </div>
            <div className="divide-y divide-border">
              {data.recentJobs.map((job) => (
                <div
                  key={job.id}
                  className="grid grid-cols-1 items-center gap-2 p-4 text-sm md:grid-cols-5 md:gap-4"
                >
                  <div className="font-mono font-medium text-primary">#{job.id}</div>
                  <div className="text-muted-foreground">{new Date(job.createdAt).toLocaleString()}</div>
                  <div className="font-mono">{job.recordCount.toLocaleString()}</div>
                  <div>
                    <span
                      className={cn(
                        'rounded-full px-2 py-1 text-xs font-bold',
                        job.status === 'COMPLETED' && 'bg-emerald-100 text-emerald-800 dark:bg-emerald-950/40',
                        job.status === 'FAILED' && 'bg-red-100 text-red-800',
                        job.status !== 'COMPLETED' && job.status !== 'FAILED' && 'bg-amber-100 text-amber-800'
                      )}
                    >
                      {job.status}
                    </span>
                  </div>
                  <div className="text-right font-mono text-xs">{job.format}</div>
                </div>
              ))}
            </div>
            {data.recentJobs.length === 0 ? (
              <p className="p-8 text-center text-muted-foreground">No export jobs yet.</p>
            ) : null}
          </div>
        </section>
      ) : null}
    </div>
  )
}

