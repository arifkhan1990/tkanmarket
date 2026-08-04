'use client'

import Link from 'next/link'
import { ArrowRight } from 'lucide-react'

import { DashboardStatCardShell } from '@/components/admin/dashboard-stat-card-shell'
import { dashboardStatLabelClass, dashboardStatValueClass } from '@/components/admin/dashboard-stat-card-tones'
import { Button } from '@/components/ui/button'
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table'
import { useProductAttributesQuery } from '@/hooks/admin/useProductAttributesQuery'
import { useI18n } from '@/hooks/useI18n'

export function AdminProductAttributesClient() {
  const { messages } = useI18n()
  const t = messages.admin.productAttributesOverviewPage
  const query = useProductAttributesQuery()
  const d = query.data

  return (
    <div className="min-h-full">
      <div className="mx-auto max-w-6xl space-y-8">
        <header className="flex flex-col gap-4 sm:flex-row sm:items-end sm:justify-between">
          <div>
            <h1 className="font-heading text-2xl font-extrabold tracking-tight text-on-surface">{t.title}</h1>
            <p className="mt-1 text-sm text-on-surface-variant">{t.subtitle}</p>
          </div>
          <Button asChild className="w-full rounded-xl sm:w-auto">
            <Link href="/admin/product-attribute-manager" className="inline-flex items-center gap-2">
              {t.openWorkspace}
              <ArrowRight className="h-4 w-4" aria-hidden />
            </Link>
          </Button>
        </header>

        {query.isLoading && !d ? (
          <div className="h-40 rounded-2xl bg-surface-container-highest animate-pulse" />
        ) : null}

        {d ? (
          <>
            <section className="grid grid-cols-2 gap-3 md:grid-cols-4 md:gap-4">
              <DashboardStatCardShell tone="blue">
                <p className={dashboardStatLabelClass}>{t.statTotalFabrics}</p>
                <p className={dashboardStatValueClass}>{d.stats.totalFabrics.toLocaleString()}</p>
              </DashboardStatCardShell>
              <DashboardStatCardShell tone="green">
                <p className={dashboardStatLabelClass}>{t.statWithGsm}</p>
                <p className={dashboardStatValueClass}>{d.stats.withGsm.toLocaleString()}</p>
              </DashboardStatCardShell>
              <DashboardStatCardShell tone="yellow">
                <p className={dashboardStatLabelClass}>{t.statAvgGsm}</p>
                <p className={dashboardStatValueClass}>{d.stats.avgGsm ?? '—'}</p>
              </DashboardStatCardShell>
              <DashboardStatCardShell tone="red">
                <p className={dashboardStatLabelClass}>{t.statWithComposition}</p>
                <p className={dashboardStatValueClass}>{d.stats.withComposition.toLocaleString()}</p>
              </DashboardStatCardShell>
            </section>

            <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
              <div className="rounded-2xl border border-outline/10 bg-surface-container-lowest overflow-hidden">
                <div className="px-4 py-3 border-b border-outline/10 font-bold text-sm text-on-surface">{t.sectionFabricType}</div>
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>{t.colType}</TableHead>
                      <TableHead className="text-right">{t.colCount}</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {d.fabricTypes.map((r, i) => (
                      <TableRow key={`${r.fabricType ?? 'null'}-${i}`}>
                        <TableCell className="capitalize">{r.fabricType ?? '—'}</TableCell>
                        <TableCell className="text-right tabular-nums">{r.count}</TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </div>

              <div className="rounded-2xl border border-outline/10 bg-surface-container-lowest overflow-hidden">
                <div className="px-4 py-3 border-b border-outline/10 font-bold text-sm text-on-surface">{t.sectionTopTags}</div>
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>{t.colTag}</TableHead>
                      <TableHead className="text-right">{t.colCount}</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {d.topTags.length === 0 ? (
                      <TableRow>
                        <TableCell colSpan={2} className="text-center text-on-surface-variant py-8">
                          {t.emptyTags}
                        </TableCell>
                      </TableRow>
                    ) : (
                      d.topTags.map((r) => (
                        <TableRow key={r.tag}>
                          <TableCell>{r.tag}</TableCell>
                          <TableCell className="text-right tabular-nums">{r.count}</TableCell>
                        </TableRow>
                      ))
                    )}
                  </TableBody>
                </Table>
              </div>
            </div>
          </>
        ) : null}
      </div>
    </div>
  )
}
