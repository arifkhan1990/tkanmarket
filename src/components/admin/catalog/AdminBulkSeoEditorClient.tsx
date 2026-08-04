'use client'

import * as React from 'react'
import Image from 'next/image'

import { DashboardStatCardShell } from '@/components/admin/dashboard-stat-card-shell'
import { dashboardStatLabelClass, dashboardStatValueClass } from '@/components/admin/dashboard-stat-card-tones'
import {
  useAdminBulkSeoBulkUpdateMutation,
  useAdminBulkSeoQuery,
  useAdminBulkSeoStatsQuery
} from '@/hooks/admin/useAdminBulkSeo'
import { cn } from '@/lib/utils'
import type { AdminBulkSeoRow } from '@/types/admin-bulk-seo.types'

function TableSkeleton() {
  return (
    <div className="overflow-hidden rounded-2xl border border-outline/10 bg-surface-container-lowest shadow-sm dark:border-outline/15">
      <div className="h-14 bg-surface-container-high animate-pulse" />
      <div className="divide-y divide-surface-container">
        {Array.from({ length: 8 }).map((_, idx) => (
          <div key={idx} className="grid grid-cols-12 gap-4 p-4">
            <div className="col-span-3 h-12 rounded-xl bg-surface-container-high animate-pulse" />
            <div className="col-span-3 h-12 rounded-xl bg-surface-container-high animate-pulse" />
            <div className="col-span-3 h-12 rounded-xl bg-surface-container-high animate-pulse" />
            <div className="col-span-3 h-12 rounded-xl bg-surface-container-high animate-pulse" />
          </div>
        ))}
      </div>
      <div className="h-14 bg-surface-container-low animate-pulse" />
    </div>
  )
}

function clamp(v: string, max: number) {
  return v.length > max ? v.slice(0, max) : v
}

function buildUpdateFromDraft(d: DraftRow): { id: number; metaTitleRu?: string | null; metaDescriptionRu?: string | null; imageAltRu?: string | null; metaTitleEn?: string | null; metaDescriptionEn?: string | null; imageAltEn?: string | null } {
  return {
    id: d.id,
    metaTitleRu: d.metaTitleRu ?? null,
    metaDescriptionRu: d.metaDescriptionRu ?? null,
    imageAltRu: d.imageAltRu ?? null,
    metaTitleEn: d.metaTitleEn ?? null,
    metaDescriptionEn: d.metaDescriptionEn ?? null,
    imageAltEn: d.imageAltEn ?? null
  }
}

type DraftRow = Pick<AdminBulkSeoRow, 'id' | 'metaTitleRu' | 'metaDescriptionRu' | 'imageAltRu' | 'metaTitleEn' | 'metaDescriptionEn' | 'imageAltEn'>

export function AdminBulkSeoEditorClient() {
  const [page, setPage] = React.useState(1)
  const [limit, setLimit] = React.useState(25)
  const [q, setQ] = React.useState('')
  const [missingFilter, setMissingFilter] = React.useState<'meta_title' | 'meta_description' | 'image_alt' | 'meta_title_en' | 'meta_description_en' | 'image_alt_en' | undefined>(
    undefined
  )

  const statsQuery = useAdminBulkSeoStatsQuery()
  const query = useAdminBulkSeoQuery({
    page,
    limit,
    q: q.trim() ? q.trim() : undefined,
    missing: missingFilter
  })
  const bulkUpdate = useAdminBulkSeoBulkUpdateMutation()

  const rows = React.useMemo<AdminBulkSeoRow[]>(() => query.data?.items ?? [], [query.data])
  const meta = query.data?.meta

  const [draft, setDraft] = React.useState<Record<number, DraftRow>>({})

  React.useEffect(() => {
    if (!rows.length) return
    setDraft((prev) => {
      const next = { ...prev }
      for (const r of rows) {
        if (next[r.id]) continue
        next[r.id] = { id: r.id, metaTitleRu: r.metaTitleRu, metaDescriptionRu: r.metaDescriptionRu, imageAltRu: r.imageAltRu, metaTitleEn: r.metaTitleEn, metaDescriptionEn: r.metaDescriptionEn, imageAltEn: r.imageAltEn }
      }
      return next
    })
  }, [rows])

  const onSave = () => {
    const updates = Object.values(draft).map(buildUpdateFromDraft)
    bulkUpdate.mutate({ updates })
  }

  const stats = statsQuery.data

  return (
    <div className="mx-auto max-w-[1600px] space-y-6 pb-10">
      <header className="flex flex-col gap-4 md:flex-row md:items-end md:justify-between">
        <div className="min-w-0">
          <nav className="mb-2 flex flex-wrap items-center gap-2 text-[10px] font-bold uppercase tracking-widest text-on-surface-variant">
            <span>Catalog</span>
            <span aria-hidden>/</span>
            <span className="text-brand-700">Bulk SEO Editor</span>
          </nav>
          <h1 className="font-heading text-3xl font-extrabold tracking-tight text-on-surface md:text-4xl">
            Fabric metadata optimization
          </h1>
          <p className="mt-2 max-w-3xl text-sm text-on-surface-variant">
            Edit meta titles, descriptions, and image alt text across the catalog at scale.
          </p>
        </div>
        <div className="flex flex-wrap gap-3">
          <button
            type="button"
            onClick={onSave}
            disabled={bulkUpdate.isPending}
            className="inline-flex items-center justify-center rounded-xl bg-gradient-to-br from-primary to-primary-container px-5 py-3 text-sm font-semibold text-on-primary shadow-lg shadow-primary/20 transition-transform hover:scale-[1.02] active:scale-95 disabled:opacity-60"
          >
            Save Updates
          </button>
        </div>
      </header>

      {stats ? (
        <section className="mb-8 grid grid-cols-1 gap-4 md:grid-cols-4">
          <DashboardStatCardShell tone="green">
            <p className={dashboardStatLabelClass}>Health score</p>
            <p className={cn(dashboardStatValueClass, 'font-black')}>{stats.healthScorePercent}%</p>
          </DashboardStatCardShell>
          <DashboardStatCardShell tone="yellow">
            <p className={dashboardStatLabelClass}>Missing meta</p>
            <p className={cn(dashboardStatValueClass, 'font-black')}>{stats.missingMetaCount}</p>
            <p className="mt-2 text-xs text-on-surface-variant">of {stats.totalFabrics} fabrics</p>
          </DashboardStatCardShell>
          <DashboardStatCardShell tone="blue" className="border-l-4 border-l-brand-500 md:col-span-2">
            <p className={dashboardStatLabelClass}>Quick filters</p>
            <div className="mt-3 flex flex-wrap gap-2">
              <button
                type="button"
                onClick={() => {
                  setPage(1)
                  setMissingFilter(undefined)
                }}
                className={`rounded-full px-3 py-1 text-xs font-semibold transition-colors ${
                  missingFilter === undefined
                    ? 'bg-brand-600 text-white'
                    : 'border border-outline-variant/30 bg-surface-container-lowest hover:bg-surface-container-high'
                }`}
              >
                All rows
              </button>
              <button
                type="button"
                onClick={() => {
                  setPage(1)
                  setMissingFilter('meta_title')
                }}
                className={`rounded-full px-3 py-1 text-xs font-semibold transition-colors ${
                  missingFilter === 'meta_title'
                    ? 'bg-brand-600 text-white'
                    : 'border border-outline-variant/30 bg-surface-container-lowest hover:bg-surface-container-high'
                }`}
              >
                Short title
              </button>
              <button
                type="button"
                onClick={() => {
                  setPage(1)
                  setMissingFilter('meta_description')
                }}
                className={`rounded-full px-3 py-1 text-xs font-semibold transition-colors ${
                  missingFilter === 'meta_description'
                    ? 'bg-brand-600 text-white'
                    : 'border border-outline-variant/30 bg-surface-container-lowest hover:bg-surface-container-high'
                }`}
              >
                Missing description
              </button>
              <button
                type="button"
                onClick={() => {
                  setPage(1)
                  setMissingFilter('image_alt')
                }}
                className={`rounded-full px-3 py-1 text-xs font-semibold transition-colors ${
                  missingFilter === 'image_alt'
                    ? 'bg-brand-600 text-white'
                    : 'border border-outline-variant/30 bg-surface-container-lowest hover:bg-surface-container-high'
                }`}
              >
                Missing alt
              </button>
              <button
                type="button"
                onClick={() => {
                  setPage(1)
                  setMissingFilter('meta_title_en')
                }}
                className={`rounded-full px-3 py-1 text-xs font-semibold transition-colors ${
                  missingFilter === 'meta_title_en'
                    ? 'bg-brand-600 text-white'
                    : 'border border-outline-variant/30 bg-surface-container-lowest hover:bg-surface-container-high'
                }`}
              >
                Missing title (EN)
              </button>
              <button
                type="button"
                onClick={() => {
                  setPage(1)
                  setMissingFilter('meta_description_en')
                }}
                className={`rounded-full px-3 py-1 text-xs font-semibold transition-colors ${
                  missingFilter === 'meta_description_en'
                    ? 'bg-brand-600 text-white'
                    : 'border border-outline-variant/30 bg-surface-container-lowest hover:bg-surface-container-high'
                }`}
              >
                Missing desc (EN)
              </button>
              <button
                type="button"
                onClick={() => {
                  setPage(1)
                  setMissingFilter('image_alt_en')
                }}
                className={`rounded-full px-3 py-1 text-xs font-semibold transition-colors ${
                  missingFilter === 'image_alt_en'
                    ? 'bg-brand-600 text-white'
                    : 'border border-outline-variant/30 bg-surface-container-lowest hover:bg-surface-container-high'
                }`}
              >
                Missing alt (EN)
              </button>
            </div>
          </DashboardStatCardShell>
        </section>
      ) : null}

      <div className="mb-6 flex flex-col gap-3 md:flex-row md:items-center md:justify-between">
        <div className="relative w-full md:max-w-md">
          <input
            value={q}
            onChange={(e) => {
              setPage(1)
              setQ(e.target.value)
            }}
            placeholder="Search by title, slug, or SKU..."
            className="w-full rounded-xl bg-surface-container-highest px-4 py-3 text-sm outline-none ring-1 ring-outline/10 focus:ring-2 focus:ring-primary/20"
          />
        </div>

        <div className="flex items-center gap-3">
          <span className="text-xs font-semibold text-on-surface-variant">Rows:</span>
          <select
            aria-label="Rows per page"
            value={limit}
            onChange={(e) => {
              setPage(1)
              setLimit(Number(e.target.value))
            }}
            className="rounded-xl bg-surface-container-highest px-3 py-2 text-sm ring-1 ring-outline/10 focus:ring-2 focus:ring-primary/20"
          >
            <option value={10}>10</option>
            <option value={25}>25</option>
            <option value={50}>50</option>
            <option value={100}>100</option>
          </select>
        </div>
      </div>

      {query.isLoading && !query.data ? <TableSkeleton /> : null}

      {!query.isLoading && rows.length === 0 ? (
        <div className="rounded-2xl border border-outline/10 bg-surface-container-lowest p-10 text-center text-on-surface-variant shadow-sm dark:border-outline/15">
          No items found.
        </div>
      ) : null}

      {rows.length ? (
        <div className="overflow-hidden rounded-2xl border border-outline/10 bg-surface-container-lowest shadow-sm dark:border-outline/15">
          <div className="grid grid-cols-18 gap-2 bg-surface-container-low px-4 py-3 text-[11px] font-bold uppercase tracking-widest text-on-surface-variant">
            <div className="col-span-2">Product</div>
            <div className="col-span-3">Meta title (RU)</div>
            <div className="col-span-3">Meta desc (RU)</div>
            <div className="col-span-2">Image alt (RU)</div>
            <div className="col-span-3">Meta title (EN)</div>
            <div className="col-span-3">Meta desc (EN)</div>
            <div className="col-span-2">Image alt (EN)</div>
          </div>

          <div className="divide-y divide-surface-container">
            {rows.map((r) => {
              const d = draft[r.id]
              const base: DraftRow = d ?? { id: r.id, metaTitleRu: r.metaTitleRu, metaDescriptionRu: r.metaDescriptionRu, imageAltRu: r.imageAltRu, metaTitleEn: r.metaTitleEn, metaDescriptionEn: r.metaDescriptionEn, imageAltEn: r.imageAltEn }
              return (
                <div key={r.id} className="grid grid-cols-18 gap-2 px-4 py-4">
                  <div className="col-span-2 flex items-center gap-2">
                    <div className="relative h-10 w-10 shrink-0 overflow-hidden rounded-xl bg-surface-container-high">
                      {r.imageUrl ? (
                        <Image src={r.imageUrl} alt={r.imageAltRu ?? r.titleRu} fill sizes="40px" className="object-cover" />
                      ) : null}
                    </div>
                    <div className="min-w-0">
                      <div className="truncate text-xs font-semibold text-on-surface">{r.titleRu}</div>
                      <div className="text-[10px] text-on-surface-variant font-mono">#{r.id}</div>
                    </div>
                  </div>

                  <div className="col-span-3 space-y-1">
                    <textarea
                      value={base.metaTitleRu ?? ''}
                      onChange={(e) =>
                        setDraft((prev) => ({ ...prev, [r.id]: { ...base, metaTitleRu: clamp(e.target.value, 120) } }))
                      }
                      className="h-12 w-full resize-none rounded-xl bg-surface-container-highest p-2 text-xs ring-1 ring-outline/10 focus:ring-2 focus:ring-primary/20"
                      placeholder="Meta title (RU)..."
                    />
                    <div className="flex justify-between px-1 text-[10px] text-on-surface-variant">
                      <span className={(base.metaTitleRu?.length ?? 0) < 30 ? 'text-error font-semibold' : 'font-semibold text-green-600'}>
                        {base.metaTitleRu?.length ?? 0}/60
                      </span>
                    </div>
                  </div>

                  <div className="col-span-3 space-y-1">
                    <textarea
                      value={base.metaDescriptionRu ?? ''}
                      onChange={(e) =>
                        setDraft((prev) => ({ ...prev, [r.id]: { ...base, metaDescriptionRu: clamp(e.target.value, 400) } }))
                      }
                      className="h-12 w-full resize-none rounded-xl bg-surface-container-highest p-2 text-xs ring-1 ring-outline/10 focus:ring-2 focus:ring-primary/20"
                      placeholder="Meta desc (RU)..."
                    />
                    <div className="flex justify-between px-1 text-[10px] text-on-surface-variant">
                      <span className={(base.metaDescriptionRu?.length ?? 0) < 80 ? 'text-error font-semibold' : 'font-semibold text-green-600'}>
                        {base.metaDescriptionRu?.length ?? 0}/160
                      </span>
                    </div>
                  </div>

                  <div className="col-span-2 space-y-1">
                    <input
                      value={base.imageAltRu ?? ''}
                      onChange={(e) =>
                        setDraft((prev) => ({ ...prev, [r.id]: { ...base, imageAltRu: clamp(e.target.value, 200) } }))
                      }
                      className="h-12 w-full rounded-xl bg-surface-container-highest px-2 text-xs ring-1 ring-outline/10 focus:ring-2 focus:ring-primary/20"
                      placeholder="Alt (RU)..."
                    />
                  </div>

                  <div className="col-span-3 space-y-1">
                    <textarea
                      value={base.metaTitleEn ?? ''}
                      onChange={(e) =>
                        setDraft((prev) => ({ ...prev, [r.id]: { ...base, metaTitleEn: clamp(e.target.value, 120) } }))
                      }
                      className="h-12 w-full resize-none rounded-xl bg-surface-container-highest p-2 text-xs ring-1 ring-outline/10 focus:ring-2 focus:ring-primary/20"
                      placeholder="Meta title (EN)..."
                    />
                    <div className="flex justify-between px-1 text-[10px] text-on-surface-variant">
                      <span className={(base.metaTitleEn?.length ?? 0) < 30 ? 'text-error font-semibold' : 'font-semibold text-green-600'}>
                        {base.metaTitleEn?.length ?? 0}/60
                      </span>
                    </div>
                  </div>

                  <div className="col-span-3 space-y-1">
                    <textarea
                      value={base.metaDescriptionEn ?? ''}
                      onChange={(e) =>
                        setDraft((prev) => ({ ...prev, [r.id]: { ...base, metaDescriptionEn: clamp(e.target.value, 400) } }))
                      }
                      className="h-12 w-full resize-none rounded-xl bg-surface-container-highest p-2 text-xs ring-1 ring-outline/10 focus:ring-2 focus:ring-primary/20"
                      placeholder="Meta desc (EN)..."
                    />
                    <div className="flex justify-between px-1 text-[10px] text-on-surface-variant">
                      <span className={(base.metaDescriptionEn?.length ?? 0) < 80 ? 'text-error font-semibold' : 'font-semibold text-green-600'}>
                        {base.metaDescriptionEn?.length ?? 0}/160
                      </span>
                    </div>
                  </div>

                  <div className="col-span-2 space-y-1">
                    <input
                      value={base.imageAltEn ?? ''}
                      onChange={(e) =>
                        setDraft((prev) => ({ ...prev, [r.id]: { ...base, imageAltEn: clamp(e.target.value, 200) } }))
                      }
                      className="h-12 w-full rounded-xl bg-surface-container-highest px-2 text-xs ring-1 ring-outline/10 focus:ring-2 focus:ring-primary/20"
                      placeholder="Alt (EN)..."
                    />
                  </div>
                </div>
              )
            })}
          </div>

          <div className="flex items-center justify-between bg-surface-container-low px-4 py-3 text-sm">
            <span className="text-xs text-on-surface-variant">
              Page {meta?.page ?? page} of {meta?.totalPages ?? 1} • {meta?.total?.toLocaleString() ?? 0} items
            </span>
            <div className="flex items-center gap-2">
              <button
                type="button"
                onClick={() => setPage((p) => Math.max(1, p - 1))}
                disabled={(meta?.page ?? page) <= 1}
                className="h-9 rounded-xl bg-surface-container-highest px-3 text-xs font-semibold disabled:opacity-50"
              >
                Prev
              </button>
              <button
                type="button"
                onClick={() => setPage((p) => (meta?.totalPages ? Math.min(meta.totalPages, p + 1) : p + 1))}
                disabled={meta ? meta.page >= meta.totalPages : false}
                className="h-9 rounded-xl bg-surface-container-highest px-3 text-xs font-semibold disabled:opacity-50"
              >
                Next
              </button>
            </div>
          </div>
        </div>
      ) : null}
    </div>
  )
}

