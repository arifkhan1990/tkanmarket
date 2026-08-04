'use client'

import * as React from 'react'
import {
  Bar,
  BarChart,
  CartesianGrid,
  Cell,
  Legend,
  Line,
  LineChart,
  Pie,
  PieChart,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis
} from 'recharts'
import {
  BarChart3,
  Database,
  Download,
  Filter,
  LineChart as LineChartIcon,
  PieChart as PieChartIcon,
  Table2,
  TrendingDown,
  TrendingUp
} from 'lucide-react'

import type {
  CustomReportDataSourceId,
  CustomReportResponse,
  CustomReportTrendSignal
} from '@/types/admin-custom-report.types'
import { Button } from '@/components/ui/button'
import { interpolate } from '@/lib/i18n/interpolate'
import { cn } from '@/lib/utils'

export type TableSectionVisualization = 'table' | 'bar' | 'line' | 'pie'

const CHART_COLORS = ['#1a40c2', '#7c3aed', '#0284c7', '#059669', '#d97706', '#dc2626']

type TableSectionCopy = {
  dataSources: string
  visualization: string
  reportPreview: string
  totalRows: string
  activePartners: string
  aggregatedValue: string
  trendInsight: string
  vizTable: string
  vizLine: string
  vizBar: string
  vizPie: string
  reportId: string
  active: string
  leadsSales: string
  colTransaction: string
  colPartner: string
  colFabric: string
  colQty: string
  colTotal: string
  exportCsv: string
  refresh: string
  dataSourceLeadsLabel: string
  dataSourceLeadsDesc: string
  dataSourceFabricsLabel: string
  dataSourceFabricsDesc: string
  dataSourceRevenueLabel: string
  dataSourceRevenueDesc: string
  rowsSuffix: string
  trendUp: string
  trendDown: string
  trendFlat: string
  trendInsufficient: string
  visualizationLabel: string
  noChartData: string
  vizUnitLeads: string
  vizUnitWon: string
}

function formatUsd(n: number, locale: string): string {
  return new Intl.NumberFormat(locale === 'ru' ? 'ru-RU' : locale === 'zh' ? 'zh-CN' : 'en-US', {
    style: 'currency',
    currency: 'USD',
    maximumFractionDigits: 0
  }).format(n)
}

function formatMoneyExact(n: number, locale: string): string {
  return new Intl.NumberFormat(locale === 'ru' ? 'ru-RU' : locale === 'zh' ? 'zh-CN' : 'en-US', {
    style: 'currency',
    currency: 'USD',
    minimumFractionDigits: 2,
    maximumFractionDigits: 2
  }).format(n)
}

function formatNumber(n: number, locale: string): string {
  return new Intl.NumberFormat(locale === 'ru' ? 'ru-RU' : locale === 'zh' ? 'zh-CN' : 'en-US').format(n)
}

function dataSourceLabel(id: CustomReportDataSourceId, copy: TableSectionCopy): { label: string; desc: string } {
  switch (id) {
    case 'leads':
      return { label: copy.dataSourceLeadsLabel, desc: copy.dataSourceLeadsDesc }
    case 'fabrics':
      return { label: copy.dataSourceFabricsLabel, desc: copy.dataSourceFabricsDesc }
    case 'revenue':
      return { label: copy.dataSourceRevenueLabel, desc: copy.dataSourceRevenueDesc }
    default: {
      const _exhaustive: never = id
      return _exhaustive
    }
  }
}

function trendBody(trend: CustomReportTrendSignal, copy: TableSectionCopy): string {
  switch (trend.kind) {
    case 'UP':
      return interpolate(copy.trendUp, { percent: String(trend.deltaPercent ?? '') })
    case 'DOWN':
      return interpolate(copy.trendDown, { percent: String(trend.deltaPercent ?? '') })
    case 'FLAT':
      return interpolate(copy.trendFlat, { percent: String(trend.deltaPercent ?? '') })
    case 'INSUFFICIENT_DATA':
    default:
      return copy.trendInsufficient
  }
}

function trendIcon(trend: CustomReportTrendSignal): React.ReactNode {
  if (trend.kind === 'UP') return <TrendingUp className="h-6 w-6 text-emerald-600" aria-hidden />
  if (trend.kind === 'DOWN') return <TrendingDown className="h-6 w-6 text-red-600" aria-hidden />
  return <TrendingUp className="h-6 w-6 text-brand-600" aria-hidden />
}

interface ChartProps {
  data: CustomReportResponse['chartBars']
  copy: TableSectionCopy
  locale: string
}

function ChartBar({ data, copy }: ChartProps) {
  return (
    <ResponsiveContainer width="100%" height="100%">
      <BarChart data={data} margin={{ top: 12, right: 12, left: -8, bottom: 0 }}>
        <CartesianGrid strokeDasharray="3 3" stroke="rgba(148, 163, 184, 0.3)" />
        <XAxis dataKey="sku" tick={{ fontSize: 11 }} />
        <YAxis tick={{ fontSize: 11 }} allowDecimals={false} />
        <Tooltip />
        <Legend wrapperStyle={{ fontSize: 12 }} />
        <Bar dataKey="leadCount" name={copy.vizUnitLeads} fill="#1a40c2" radius={[6, 6, 0, 0]} />
        <Bar dataKey="wonCount" name={copy.vizUnitWon} fill="#059669" radius={[6, 6, 0, 0]} />
      </BarChart>
    </ResponsiveContainer>
  )
}

function ChartLine({ data, copy }: ChartProps) {
  return (
    <ResponsiveContainer width="100%" height="100%">
      <LineChart data={data} margin={{ top: 12, right: 12, left: -8, bottom: 0 }}>
        <CartesianGrid strokeDasharray="3 3" stroke="rgba(148, 163, 184, 0.3)" />
        <XAxis dataKey="sku" tick={{ fontSize: 11 }} />
        <YAxis tick={{ fontSize: 11 }} allowDecimals={false} />
        <Tooltip />
        <Legend wrapperStyle={{ fontSize: 12 }} />
        <Line type="monotone" dataKey="leadCount" name={copy.vizUnitLeads} stroke="#1a40c2" strokeWidth={2} dot />
        <Line type="monotone" dataKey="wonCount" name={copy.vizUnitWon} stroke="#059669" strokeWidth={2} dot />
      </LineChart>
    </ResponsiveContainer>
  )
}

function ChartPie({ data, copy }: ChartProps) {
  const pieData = data.map((d) => ({ name: d.sku ?? d.label, value: d.leadCount }))
  return (
    <ResponsiveContainer width="100%" height="100%">
      <PieChart>
        <Tooltip />
        <Legend wrapperStyle={{ fontSize: 11 }} />
        <Pie data={pieData} dataKey="value" nameKey="name" innerRadius={60} outerRadius={110} paddingAngle={2}>
          {pieData.map((_, i) => (
            <Cell key={i} fill={CHART_COLORS[i % CHART_COLORS.length]} />
          ))}
        </Pie>
      </PieChart>
    </ResponsiveContainer>
  )
}

function ChartTable({ data, copy, locale }: ChartProps) {
  return (
    <div className="overflow-x-auto">
      <table className="w-full text-left text-sm">
        <thead className="bg-surface-container-low">
          <tr className="text-xs font-bold uppercase tracking-widest text-on-surface-variant">
            <th className="px-4 py-3">{copy.colFabric}</th>
            <th className="px-4 py-3 text-right">{copy.vizUnitLeads}</th>
            <th className="px-4 py-3 text-right">{copy.vizUnitWon}</th>
          </tr>
        </thead>
        <tbody className="divide-y divide-outline/10">
          {data.map((bar) => (
            <tr key={bar.fabricId} className="hover:bg-surface-container-low/60">
              <td className="px-4 py-3 font-mono text-xs text-brand-600">{bar.sku ?? bar.label}</td>
              <td className="px-4 py-3 text-right font-mono tabular-nums">{formatNumber(bar.leadCount, locale)}</td>
              <td className="px-4 py-3 text-right font-mono tabular-nums">{formatNumber(bar.wonCount, locale)}</td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  )
}

export function CustomReportBuilderTableSection({
  data,
  copy,
  viz,
  onVizChange,
  onExportCsv,
  onRefresh,
  isFetching,
  locale
}: {
  data: CustomReportResponse
  copy: TableSectionCopy
  viz: TableSectionVisualization
  onVizChange: (v: TableSectionVisualization) => void
  onExportCsv: () => void
  onRefresh: () => void
  isFetching: boolean
  locale: string
}) {
  const vizOptions: { key: TableSectionVisualization; icon: React.ComponentType<{ className?: string; 'aria-hidden'?: boolean }>; label: string }[] = [
    { key: 'table', icon: Table2, label: copy.vizTable },
    { key: 'bar', icon: BarChart3, label: copy.vizBar },
    { key: 'line', icon: LineChartIcon, label: copy.vizLine },
    { key: 'pie', icon: PieChartIcon, label: copy.vizPie }
  ]

  return (
    <div className="grid grid-cols-1 gap-6 lg:grid-cols-12 lg:gap-8">
      <div className="space-y-6 lg:col-span-4">
        {/* Data sources panel — driven by real server `dataSources`. */}
        <section className="rounded-2xl border border-outline/15 bg-surface-container-lowest p-6 shadow-sm dark:border-outline/15">
          <div className="mb-6 flex items-center gap-3">
            <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-brand-100 text-brand-700 dark:bg-brand-950/50 dark:text-brand-300">
              <Database className="h-5 w-5" aria-hidden />
            </div>
            <h3 className="text-lg font-bold text-on-surface">{copy.dataSources}</h3>
          </div>
          <ul className="space-y-3">
            {data.dataSources.map((ds) => {
              const meta = dataSourceLabel(ds.id, copy)
              return (
                <li
                  key={ds.id}
                  className="flex items-start gap-3 rounded-xl border border-outline/10 bg-surface-container-low p-4"
                >
                  <span className="mt-1 inline-flex h-2 w-2 shrink-0 rounded-full bg-brand-500" aria-hidden />
                  <div className="min-w-0 flex-1">
                    <p className="font-bold text-on-surface">{meta.label}</p>
                    <p className="mt-0.5 text-xs text-on-surface-variant">{meta.desc}</p>
                    <p className="mt-1 font-mono text-[10px] uppercase tracking-widest text-outline">
                      {interpolate(copy.rowsSuffix, { n: ds.rowCount.toLocaleString() })}
                    </p>
                  </div>
                </li>
              )
            })}
          </ul>
        </section>

        {/* Visualization panel — toggles ACTUALLY render different charts in the preview. */}
        <section className="rounded-2xl border border-outline/15 bg-surface-container-lowest p-6 shadow-sm dark:border-outline/15">
          <div className="mb-6 flex items-center gap-3">
            <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-amber-100 text-amber-800 dark:bg-amber-950/40 dark:text-amber-200">
              <Filter className="h-5 w-5" aria-hidden />
            </div>
            <h3 className="text-lg font-bold text-on-surface">{copy.visualization}</h3>
          </div>
          <div className="grid grid-cols-2 gap-3">
            {vizOptions.map(({ key, icon: Icon, label }) => (
              <button
                key={key}
                type="button"
                onClick={() => onVizChange(key)}
                className={cn(
                  'flex flex-col items-center justify-center rounded-xl border-2 p-4 text-xs font-bold transition-colors',
                  viz === key
                    ? 'border-brand-500 bg-brand-50 text-brand-800 dark:bg-brand-950/40 dark:text-brand-200'
                    : 'border-transparent bg-surface-container-low text-on-surface-variant hover:bg-surface-container-high'
                )}
                aria-pressed={viz === key}
              >
                <Icon className="mb-2 h-6 w-6" aria-hidden />
                {label}
              </button>
            ))}
          </div>
        </section>

        {/* Real summary cards — raw numbers from the server, locale-formatted on the client. */}
        <section className="space-y-3 rounded-2xl border border-outline/15 bg-surface-container-lowest p-6 shadow-sm dark:border-outline/15">
          <div className="rounded-xl bg-surface-container-low p-4">
            <p className="text-[10px] font-bold uppercase tracking-widest text-on-surface-variant">{copy.totalRows}</p>
            <p className="mt-1 font-mono text-2xl font-black tabular-nums text-on-surface">
              {formatNumber(data.summary.totalRows, locale)}
            </p>
          </div>
          <div className="rounded-xl bg-surface-container-low p-4">
            <p className="text-[10px] font-bold uppercase tracking-widest text-on-surface-variant">{copy.activePartners}</p>
            <p className="mt-1 font-mono text-2xl font-black tabular-nums text-on-surface">
              {formatNumber(data.summary.activePartners, locale)}
            </p>
          </div>
          <div className="rounded-xl bg-surface-container-low p-4">
            <p className="text-[10px] font-bold uppercase tracking-widest text-on-surface-variant">{copy.aggregatedValue}</p>
            <p className="mt-1 font-mono text-2xl font-black tabular-nums text-brand-600 dark:text-brand-400">
              {formatUsd(data.summary.aggregatedValueUsd, locale)}
            </p>
          </div>
        </section>
      </div>

      {/* Preview pane */}
      <div className="lg:col-span-8">
        <div className="flex min-h-[480px] flex-col rounded-3xl border border-outline/15 bg-surface-container-lowest p-6 shadow-sm md:p-8 dark:border-outline/15">
          <div className="mb-6 flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
            <div className="min-w-0">
              <h4 className="font-heading text-xl font-extrabold text-on-surface">{copy.reportPreview}</h4>
              <p className="text-sm text-on-surface-variant">{copy.visualizationLabel}: {vizOptions.find((v) => v.key === viz)?.label}</p>
            </div>
            <div className="flex flex-wrap gap-2">
              <Button
                type="button"
                size="sm"
                variant="outline"
                className="rounded-xl"
                onClick={onRefresh}
                disabled={isFetching}
              >
                <Filter className={cn('mr-2 h-4 w-4', isFetching && 'animate-spin')} aria-hidden />
                {copy.refresh}
              </Button>
              <Button
                type="button"
                size="sm"
                variant="outline"
                className="rounded-xl"
                onClick={onExportCsv}
                disabled={data.previewRows.length === 0}
              >
                <Download className="mr-2 h-4 w-4" aria-hidden />
                {copy.exportCsv}
              </Button>
            </div>
          </div>

          {/* Visualization area — switches based on `viz` */}
          <div className="rounded-2xl border-2 border-dashed border-outline/20 p-4">
            <div className="mb-3 flex flex-wrap items-center justify-between gap-2">
              <div className="flex flex-wrap gap-2">
                <span className="rounded-full bg-emerald-100 px-3 py-1 text-[10px] font-bold uppercase tracking-wider text-emerald-800 dark:bg-emerald-900/40 dark:text-emerald-200">
                  {copy.active}
                </span>
                <span className="rounded-full bg-brand-100 px-3 py-1 text-[10px] font-bold uppercase tracking-wider text-brand-800 dark:bg-brand-900/40 dark:text-brand-200">
                  {copy.leadsSales}
                </span>
              </div>
              <span className="font-mono text-[10px] text-outline">
                {copy.reportId}: {data.reportId}
              </span>
            </div>

            {data.chartBars.length === 0 ? (
              <p className="rounded-xl border border-dashed border-outline/20 p-12 text-center text-sm text-on-surface-variant">
                {copy.noChartData}
              </p>
            ) : viz === 'table' ? (
              <ChartTable data={data.chartBars} copy={copy} locale={locale} />
            ) : (
              <div className="h-72">
                {viz === 'bar' ? <ChartBar data={data.chartBars} copy={copy} locale={locale} /> : null}
                {viz === 'line' ? <ChartLine data={data.chartBars} copy={copy} locale={locale} /> : null}
                {viz === 'pie' ? <ChartPie data={data.chartBars} copy={copy} locale={locale} /> : null}
              </div>
            )}
          </div>

          {/* Preview rows table — always visible, real data */}
          <div className="mt-6 overflow-x-auto">
            <table className="w-full border-collapse text-left text-sm">
              <thead>
                <tr className="border-b border-outline/15 text-on-surface-variant">
                  <th className="pb-3 text-xs font-bold uppercase tracking-widest">{copy.colTransaction}</th>
                  <th className="pb-3 text-xs font-bold uppercase tracking-widest">{copy.colPartner}</th>
                  <th className="pb-3 text-xs font-bold uppercase tracking-widest">{copy.colFabric}</th>
                  <th className="pb-3 text-xs font-bold uppercase tracking-widest">{copy.colQty}</th>
                  <th className="pb-3 text-right text-xs font-bold uppercase tracking-widest">{copy.colTotal}</th>
                </tr>
              </thead>
              <tbody>
                {data.previewRows.map((row) => (
                  <tr key={row.transactionId} className="border-b border-outline/10 hover:bg-surface-container-low/80">
                    <td className="py-3 font-mono text-xs font-bold text-brand-600">{row.transactionId}</td>
                    <td className="py-3 font-medium text-on-surface">{row.sourcePartner}</td>
                    <td className="py-3 text-on-surface-variant">{row.fabricType ?? '—'}</td>
                    <td className="py-3 font-mono text-xs">
                      {row.quantityMeters != null ? `${formatNumber(row.quantityMeters, locale)} m` : '—'}
                    </td>
                    <td className="py-3 text-right font-mono font-bold tabular-nums">
                      {row.totalValueUsd != null ? formatMoneyExact(row.totalValueUsd, locale) : '—'}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>

          {/* Trend insight — driven by structured server signal, localized on the client */}
          <div className="mt-6 flex flex-col gap-4 rounded-2xl border border-brand-500/20 bg-brand-50/50 p-4 sm:flex-row sm:items-center sm:justify-between dark:bg-brand-950/20">
            <div className="flex items-start gap-3">
              <div className="flex h-12 w-12 shrink-0 items-center justify-center rounded-full bg-surface-container-lowest shadow-sm">
                {trendIcon(data.trend)}
              </div>
              <div className="min-w-0">
                <p className="text-sm font-bold text-on-surface">{copy.trendInsight}</p>
                <p className="text-xs text-on-surface-variant">{trendBody(data.trend, copy)}</p>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}
