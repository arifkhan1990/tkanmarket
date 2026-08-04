'use client'

import * as React from 'react'
import { formatDistanceToNow } from 'date-fns'
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
  LineChart as LineChartIcon,
  PieChart as PieChartIcon,
  RefreshCw,
  Table2
} from 'lucide-react'

import type {
  CustomReportDataSourceId,
  CustomReportResponse
} from '@/types/admin-custom-report.types'
import { Button } from '@/components/ui/button'
import { interpolate } from '@/lib/i18n/interpolate'
import { cn } from '@/lib/utils'

export type CanvasVisualization = 'bar' | 'line' | 'pie' | 'table'

const CHART_COLORS = ['#1a40c2', '#7c3aed', '#0284c7', '#059669', '#d97706', '#dc2626']

type CanvasCopy = {
  availableFields: string
  reportParams: string
  vizBar: string
  vizLine: string
  vizPie: string
  vizTable: string
  colSku: string
  colConversion: string
  colRating: string
  colTrend: string
  colLeadsCount: string
  colWonCount: string
  colConvPercent: string
  engineConnected: string
  rowsScanned: string
  version: string
  refresh: string
  lastSync: string
  noChartData: string
  vizUnitLeads: string
  vizUnitWon: string
  dataSourceLeadsLabel: string
  dataSourceFabricsLabel: string
  dataSourceRevenueLabel: string
  dataSourceLeadsDesc: string
  dataSourceFabricsDesc: string
  dataSourceRevenueDesc: string
  rowsSuffix: string
  visualizationLabel: string
  tableViewTitle: string
}

function dataSourceMeta(id: CustomReportDataSourceId, copy: CanvasCopy) {
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

function formatNumber(n: number, locale: string): string {
  return new Intl.NumberFormat(locale === 'ru' ? 'ru-RU' : locale === 'zh' ? 'zh-CN' : 'en-US').format(n)
}

interface ChartProps {
  data: CustomReportResponse['chartBars']
  copy: CanvasCopy
}

function ChartBar({ data, copy }: ChartProps) {
  return (
    <ResponsiveContainer width="100%" height="100%">
      <BarChart data={data} margin={{ top: 16, right: 16, left: -8, bottom: 0 }}>
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
      <LineChart data={data} margin={{ top: 16, right: 16, left: -8, bottom: 0 }}>
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

function ChartPie({ data }: ChartProps) {
  const pieData = data.map((d) => ({ name: d.sku ?? d.label, value: d.leadCount }))
  return (
    <ResponsiveContainer width="100%" height="100%">
      <PieChart>
        <Tooltip />
        <Legend wrapperStyle={{ fontSize: 11 }} />
        <Pie data={pieData} dataKey="value" nameKey="name" innerRadius={60} outerRadius={120} paddingAngle={2}>
          {pieData.map((_, i) => (
            <Cell key={i} fill={CHART_COLORS[i % CHART_COLORS.length]} />
          ))}
        </Pie>
      </PieChart>
    </ResponsiveContainer>
  )
}

export function CustomReportBuilderCanvasSection({
  data,
  copy,
  canvasViz,
  onCanvasVizChange,
  onRefresh,
  isFetching,
  locale
}: {
  data: CustomReportResponse
  copy: CanvasCopy
  canvasViz: CanvasVisualization
  onCanvasVizChange: (v: CanvasVisualization) => void
  onRefresh: () => void
  isFetching: boolean
  locale: string
}) {
  const lastSync = interpolate(copy.lastSync, {
    time: formatDistanceToNow(new Date(data.generatedAt), { addSuffix: true })
  })

  const vizOptions: { key: CanvasVisualization; Icon: React.ComponentType<{ className?: string; 'aria-hidden'?: boolean }>; label: string }[] = [
    { key: 'bar', Icon: BarChart3, label: copy.vizBar },
    { key: 'line', Icon: LineChartIcon, label: copy.vizLine },
    { key: 'pie', Icon: PieChartIcon, label: copy.vizPie },
    { key: 'table', Icon: Table2, label: copy.vizTable }
  ]

  return (
    <div className="grid grid-cols-1 gap-6 lg:grid-cols-12">
      <div className="space-y-6 lg:col-span-4">
        {/* Available data sources — driven by REAL server data */}
        <div className="rounded-2xl border border-outline/15 bg-surface-container-low p-6 shadow-sm dark:border-outline/15">
          <h3 className="mb-4 flex items-center gap-2 text-lg font-bold text-on-surface">
            <Database className="h-5 w-5 text-brand-600" aria-hidden />
            {copy.availableFields}
          </h3>
          <ul className="space-y-3">
            {data.dataSources.map((ds) => {
              const meta = dataSourceMeta(ds.id, copy)
              return (
                <li
                  key={ds.id}
                  className="rounded-xl border border-outline/10 bg-surface-container-lowest p-3 shadow-sm"
                >
                  <p className="text-sm font-bold text-on-surface">{meta.label}</p>
                  <p className="mt-0.5 text-xs text-on-surface-variant">{meta.desc}</p>
                  <p className="mt-1 font-mono text-[10px] uppercase tracking-widest text-outline">
                    {interpolate(copy.rowsSuffix, { n: ds.rowCount.toLocaleString() })}
                  </p>
                </li>
              )
            })}
          </ul>
        </div>

        {/* Visualization toggle — switches the actual preview chart */}
        <div className="rounded-2xl border border-outline/15 bg-surface-container-low p-6 shadow-sm dark:border-outline/15">
          <h3 className="mb-4 text-lg font-bold text-on-surface">{copy.reportParams}</h3>
          <p className="mb-3 text-xs font-bold uppercase tracking-wide text-on-surface-variant">
            {copy.visualizationLabel}
          </p>
          <div className="grid grid-cols-4 gap-2">
            {vizOptions.map(({ key, Icon, label }) => (
              <button
                key={key}
                type="button"
                onClick={() => onCanvasVizChange(key)}
                className={cn(
                  'flex aspect-square flex-col items-center justify-center gap-1 rounded-xl border text-[10px] font-bold transition-colors',
                  canvasViz === key
                    ? 'border-brand-500 bg-brand-600 text-white shadow-md'
                    : 'border-outline/15 bg-surface-container-lowest text-on-surface-variant hover:border-brand-400'
                )}
                aria-pressed={canvasViz === key}
              >
                <Icon className="h-5 w-5" aria-hidden />
                {label}
              </button>
            ))}
          </div>
        </div>
      </div>

      <div className="space-y-6 lg:col-span-8">
        {/* Real-time preview — replaces hand-rolled bar chart with recharts */}
        <div className="overflow-hidden rounded-2xl border border-outline/15 bg-surface-container-lowest shadow-sm dark:border-outline/15">
          <div className="flex flex-col gap-3 border-b border-outline/10 p-4 sm:flex-row sm:items-center sm:justify-between">
            <h3 className="text-lg font-bold text-on-surface">{copy.tableViewTitle}</h3>
            <div className="flex items-center gap-2">
              <span className="rounded-full bg-emerald-100 px-3 py-1 text-xs font-bold text-emerald-800 dark:bg-emerald-900/40 dark:text-emerald-200">
                <span className="mr-1.5 inline-flex h-2 w-2 rounded-full bg-emerald-500" aria-hidden />
                {copy.engineConnected}
              </span>
              <Button
                type="button"
                size="sm"
                variant="outline"
                className="rounded-xl"
                onClick={onRefresh}
                disabled={isFetching}
              >
                <RefreshCw className={cn('mr-2 h-4 w-4', isFetching && 'animate-spin')} aria-hidden />
                {copy.refresh}
              </Button>
            </div>
          </div>

          <div className="p-4 md:p-6">
            {data.chartBars.length === 0 ? (
              <p className="rounded-xl border border-dashed border-outline/20 p-12 text-center text-sm text-on-surface-variant">
                {copy.noChartData}
              </p>
            ) : canvasViz === 'table' ? (
              <div className="overflow-x-auto">
                <table className="w-full min-w-[480px] text-left text-sm">
                  <thead>
                    <tr className="bg-surface-container-low text-xs font-bold uppercase tracking-widest text-on-surface-variant">
                      <th className="rounded-l-xl px-4 py-3">{copy.colSku}</th>
                      <th className="px-4 py-3 text-right">{copy.colLeadsCount}</th>
                      <th className="px-4 py-3 text-right">{copy.colWonCount}</th>
                      <th className="rounded-r-xl px-4 py-3 text-right">{copy.colConvPercent}</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-outline/10">
                    {data.chartBars.map((bar) => (
                      <tr key={bar.fabricId} className="hover:bg-surface-container-low/80">
                        <td className="px-4 py-3 font-mono text-xs text-brand-600">{bar.sku ?? bar.label}</td>
                        <td className="px-4 py-3 text-right font-mono tabular-nums">
                          {formatNumber(bar.leadCount, locale)}
                        </td>
                        <td className="px-4 py-3 text-right font-mono tabular-nums">
                          {formatNumber(bar.wonCount, locale)}
                        </td>
                        <td className="px-4 py-3 text-right font-mono font-bold text-brand-600">
                          {bar.conversionPercent.toFixed(1)}%
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            ) : (
              <div className="h-[min(420px,50vh)]">
                {canvasViz === 'bar' ? <ChartBar data={data.chartBars} copy={copy} /> : null}
                {canvasViz === 'line' ? <ChartLine data={data.chartBars} copy={copy} /> : null}
                {canvasViz === 'pie' ? <ChartPie data={data.chartBars} copy={copy} /> : null}
              </div>
            )}
          </div>
        </div>

        {/* Honest footer — real generated_at + real total rows, no fabricated latency */}
        <footer className="flex flex-col gap-2 rounded-xl border border-outline/15 bg-surface-container-highest px-4 py-3 font-mono text-[10px] text-on-surface-variant sm:flex-row sm:items-center sm:justify-between">
          <div className="flex flex-wrap gap-4">
            <span className="flex items-center gap-2 font-bold">
              <span className="h-1.5 w-1.5 animate-pulse rounded-full bg-brand-500" aria-hidden />
              {copy.engineConnected}
            </span>
            <span>
              {copy.rowsScanned}: {formatNumber(data.summary.totalRows, locale)}
            </span>
          </div>
          <div className="flex gap-4">
            <span>{lastSync}</span>
            <span>
              {copy.version}: {data.reportId}
            </span>
          </div>
        </footer>
      </div>
    </div>
  )
}
