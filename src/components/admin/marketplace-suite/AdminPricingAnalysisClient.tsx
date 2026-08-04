'use client'

import Link from 'next/link'
import { Line, LineChart, CartesianGrid, ResponsiveContainer, Tooltip, XAxis, YAxis } from 'recharts'

import { DashboardStatCardShell } from '@/components/admin/dashboard-stat-card-shell'
import { dashboardStatLabelClass, dashboardStatValueClass } from '@/components/admin/dashboard-stat-card-tones'
import { Badge } from '@/components/ui/badge'
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table'
import { useI18n } from '@/hooks/useI18n'
import { useAdminPricingAnalysisQuery } from '@/hooks/admin/useAdminPricingAnalysis'
import type {
  PricingAnalysisChartPoint,
  PricingAnalysisFabricRow,
  PricingAnalysisOptimizationItem,
  PricingRiskLevel
} from '@/types/admin-pricing-analysis.types'
import { formatPricingOptimizationBody } from '@/lib/format-pricing-optimization-body'
import type { Messages } from '@/lib/i18n/get-messages'
import { cn } from '@/lib/utils'

function riskIntent(r: PricingRiskLevel): 'success' | 'warning' | 'error' | 'default' {
  if (r === 'Stable') return 'success'
  if (r === 'Volatile') return 'warning'
  return 'error'
}

function riskLabel(r: PricingRiskLevel, p: Messages['admin']['pricingAnalysisPage']): string {
  if (r === 'Stable') return p.riskStable
  if (r === 'Volatile') return p.riskVolatile
  return p.riskCritical
}

export function AdminPricingAnalysisClient() {
  const { messages } = useI18n()
  const p = messages.admin.pricingAnalysisPage
  const query = useAdminPricingAnalysisQuery(messages.admin.loadErrors.pricingAnalysis)
  const d = query.data

  return (
    <div className="min-h-full">
      <div className="max-w-6xl mx-auto space-y-8">
        <header>
          <h1 className="text-2xl font-extrabold tracking-tight text-on-surface font-heading">{p.title}</h1>
          <p className="text-sm text-on-surface-variant mt-1">
            {d ? p.suiteSubtitle.replace('{percent}', String(d.assumed_commission_percent)) : p.subtitle}
          </p>
        </header>

        {query.isLoading && !d ? (
          <div className="h-80 rounded-2xl bg-surface-container-highest animate-pulse" />
        ) : null}

        {d ? (
          <>
            <section className="grid grid-cols-1 gap-4 md:grid-cols-3">
              <DashboardStatCardShell tone="green">
                <p className={dashboardStatLabelClass}>{p.kpiProjectedGross}</p>
                <p className={cn(dashboardStatValueClass, 'font-heading')}>
                  ${d.simulator.projected_gross_profit_usd.toLocaleString()}
                </p>
              </DashboardStatCardShell>
              <DashboardStatCardShell tone="blue">
                <p className={dashboardStatLabelClass}>{p.kpiDeltaModel}</p>
                <p className={cn(dashboardStatValueClass, 'font-heading')}>
                  {d.simulator.projected_delta_percent == null
                    ? '—'
                    : `${d.simulator.projected_delta_percent > 0 ? '+' : ''}${d.simulator.projected_delta_percent}%`}
                </p>
              </DashboardStatCardShell>
              <DashboardStatCardShell tone="yellow">
                <p className={dashboardStatLabelClass}>{p.kpiChartCard}</p>
                <p className="mt-3 text-sm font-semibold text-on-surface">{p.chartTitle}</p>
                <p className="mt-1 text-xs leading-relaxed text-on-surface-variant">{p.chartSubtitle}</p>
              </DashboardStatCardShell>
            </section>

            <section className="bg-surface-container-lowest p-6 rounded-2xl border border-outline/10">
              <h2 className="text-sm font-bold text-on-surface mb-4">{p.chartTitle}</h2>
              <div className="h-64 w-full">
                <ResponsiveContainer width="100%" height="100%">
                  <LineChart
                    data={d.chart_points.map((pt: PricingAnalysisChartPoint) => ({
                      name: pt.month_label,
                      price: pt.avg_price_usd
                    }))}
                  >
                    <CartesianGrid strokeDasharray="3 3" className="stroke-outline/20" />
                    <XAxis dataKey="name" tick={{ fontSize: 11 }} />
                    <YAxis tick={{ fontSize: 11 }} />
                    <Tooltip />
                    <Line type="monotone" dataKey="price" stroke="hsl(var(--primary))" strokeWidth={2} dot={false} />
                  </LineChart>
                </ResponsiveContainer>
              </div>
            </section>

            <section className="overflow-x-auto rounded-2xl border border-outline/10 bg-surface-container-lowest">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>{p.colSku}</TableHead>
                    <TableHead>{p.colTitle}</TableHead>
                    <TableHead className="text-right">{p.colPrice}</TableHead>
                    <TableHead className="text-right">{p.colMargin}</TableHead>
                    <TableHead>{p.colRisk}</TableHead>
                    <TableHead className="text-right">{p.colOpen}</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {d.fabrics.map((f: PricingAnalysisFabricRow) => (
                    <TableRow key={f.id}>
                      <TableCell className="font-mono text-xs">{f.sku ?? '—'}</TableCell>
                      <TableCell className="max-w-[200px] truncate">{f.title}</TableCell>
                      <TableCell className="text-right tabular-nums">{f.price_usd?.toFixed(2) ?? '—'}</TableCell>
                      <TableCell className="text-right tabular-nums">
                        {f.estimated_margin_percent == null ? '—' : `${f.estimated_margin_percent}%`}
                      </TableCell>
                      <TableCell>
                        <Badge intent={riskIntent(f.risk)} className="normal-case tracking-normal">
                          {riskLabel(f.risk, p)}
                        </Badge>
                      </TableCell>
                      <TableCell className="text-right">
                        <Link href={`/admin/fabrics/${f.id}`} className="text-primary text-sm font-medium hover:underline">
                          {p.openFabric}
                        </Link>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </section>

            <section className="space-y-3">
              <h2 className="text-lg font-bold font-heading text-on-surface">{p.signalsHeading}</h2>
              <ul className="space-y-2">
                {d.optimizations.map((o: PricingAnalysisOptimizationItem) => (
                  <li
                    key={o.id}
                    className="rounded-xl border border-outline/10 bg-surface-container-lowest p-4 text-sm text-on-surface"
                  >
                    <span className="font-mono text-[10px] text-on-surface-variant">{o.tag}</span>
                    <p className="mt-1">{formatPricingOptimizationBody(o, p)}</p>
                  </li>
                ))}
              </ul>
            </section>
          </>
        ) : null}
      </div>
    </div>
  )
}
