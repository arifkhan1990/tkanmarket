'use client'

import Link from 'next/link'
import {
  Area,
  AreaChart,
  CartesianGrid,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis
} from 'recharts'
import { ArrowUpRight } from 'lucide-react'

import { TopFabricCategoriesChart } from '@/components/admin/charts/TopFabricCategoriesChart'
import { TrafficVsConversionsChart } from '@/components/admin/charts/TrafficVsConversionsChart'
import { invPanelFlat, invText } from '@/components/admin/inventory-suite/inventory-suite-styles'
import { Button } from '@/components/ui/button'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import type { Messages } from '@/lib/i18n/get-messages'
import { withLocaleUrl } from '@/lib/i18n/locale-path'
import type { Locale } from '@/types/i18n.types'
import { cn } from '@/lib/utils'
import type { AdminSalesPerformanceResponse } from '@/types/admin-sales-performance.types'

import { fmtUsd } from './sales-performance-format'

type T = Messages['admin']['salesPerformancePage']

export function SalesPerformanceChartsSection(props: {
  d: AdminSalesPerformanceResponse
  locale: Locale
  t: T
  revenueSeries: { date: string; value: number }[]
  trafficVsConv: AdminSalesPerformanceResponse['analytics']['trafficVsConversions']
  topCategories: AdminSalesPerformanceResponse['analytics']['topFabricCategories']
}) {
  const { d, locale, t, revenueSeries, trafficVsConv, topCategories } = props

  return (
    <div className="mb-8 grid grid-cols-1 gap-6 lg:grid-cols-3">
      <div className={cn(invPanelFlat(), 'p-6 lg:col-span-2')}>
        <Tabs defaultValue="revenue">
          <div className="mb-4 flex flex-wrap items-center justify-between gap-3">
            <div>
              <h2 className={cn('text-xl font-bold', invText.title)}>{t.revenueChartTitle}</h2>
              <p className={cn('text-sm', invText.muted)}>{t.revenueChartSubtitle}</p>
            </div>
            <TabsList className="h-auto flex-wrap justify-start gap-1">
              <TabsTrigger value="revenue" className="rounded-lg text-xs">
                {t.breakdownTabRevenue}
              </TabsTrigger>
              <TabsTrigger value="traffic" className="rounded-lg text-xs">
                {t.breakdownTabTraffic}
              </TabsTrigger>
              <TabsTrigger value="categories" className="rounded-lg text-xs">
                {t.breakdownTabCategories}
              </TabsTrigger>
            </TabsList>
          </div>

          <TabsContent value="revenue" className="mt-0">
            <div className="h-72 w-full min-w-0">
              <ResponsiveContainer width="100%" height="100%">
                <AreaChart data={revenueSeries} margin={{ top: 8, right: 12, left: -12, bottom: 0 }}>
                  <defs>
                    <linearGradient id="salesRevGradient" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="0%" stopColor="#1a40c2" stopOpacity={0.35} />
                      <stop offset="100%" stopColor="#1a40c2" stopOpacity={0} />
                    </linearGradient>
                  </defs>
                  <CartesianGrid strokeDasharray="3 3" stroke="rgba(148, 163, 184, 0.3)" />
                  <XAxis
                    dataKey="date"
                    tick={{ fontSize: 11 }}
                    tickFormatter={(v: string) => {
                      const parts = v.split('-')
                      return parts.length === 3 ? `${parts[1]}-${parts[2]}` : v
                    }}
                    minTickGap={24}
                  />
                  <YAxis tick={{ fontSize: 11 }} tickFormatter={(v: number) => fmtUsd(v, locale, true)} width={72} />
                  <Tooltip
                    formatter={(v: number) => [fmtUsd(v, locale), t.revenueChartLegend]}
                    labelStyle={{ fontSize: 12 }}
                    contentStyle={{ borderRadius: 12, fontSize: 12 }}
                  />
                  <Area
                    type="monotone"
                    dataKey="value"
                    name={t.revenueChartLegend}
                    stroke="#1a40c2"
                    strokeWidth={2}
                    fill="url(#salesRevGradient)"
                    dot={false}
                  />
                </AreaChart>
              </ResponsiveContainer>
            </div>
            <p className={cn('mt-3 text-center font-mono text-[10px] uppercase tracking-widest', invText.muted)}>
              {t.periodDaysLabel.replace('{n}', String(d.periodDays))}
            </p>
          </TabsContent>

          <TabsContent value="traffic" className="mt-0">
            <div className="h-72 min-h-[288px] w-full min-w-0">
              <TrafficVsConversionsChart data={trafficVsConv} />
            </div>
          </TabsContent>

          <TabsContent value="categories" className="mt-0">
            <div className="h-72 min-h-[288px] w-full min-w-0">
              <TopFabricCategoriesChart data={topCategories} />
            </div>
          </TabsContent>
        </Tabs>
      </div>

      <div className={cn(invPanelFlat(), 'flex flex-col p-6')}>
        <h2 className={cn('mb-4 text-xl font-bold', invText.title)}>{t.recentConversions}</h2>
        <ul className="flex-1 space-y-2">
          {d.recentConversions.length === 0 ? (
            <li className={cn('text-sm', invText.muted)}>{t.noRecentConversions}</li>
          ) : (
            d.recentConversions.map((c) => {
              const fabricTitle =
                locale === 'ru'
                  ? c.fabricTitleRu?.trim() || c.fabricTitleEn
                  : c.fabricTitleEn?.trim() || c.fabricTitleRu
              return (
                <li key={c.leadId}>
                  <Link
                    href={withLocaleUrl(`/admin/leads/${c.leadId}`, locale)}
                    className="group flex min-h-[52px] items-center gap-3 rounded-xl p-2 transition-colors hover:bg-surface-container-low focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary"
                  >
                    <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-brand-100 text-brand-700 dark:bg-brand-950/50 dark:text-brand-300">
                      <ArrowUpRight className="h-5 w-5" aria-hidden />
                    </div>
                    <div className="min-w-0 flex-1">
                      <p className="truncate text-sm font-bold text-on-surface group-hover:text-primary">{c.companyName}</p>
                      <p className="truncate text-xs text-on-surface-variant">
                        {fabricTitle ?? '—'}
                        {c.fabricSku ? <span className="ml-1 opacity-60">· {c.fabricSku}</span> : null}
                      </p>
                    </div>
                    <span className="shrink-0 font-mono text-sm font-bold text-brand-600 dark:text-brand-400">
                      {fmtUsd(c.valueUsd, locale, true)}
                    </span>
                  </Link>
                </li>
              )
            })
          )}
        </ul>
        <Button className="mt-6 h-11 w-full rounded-xl font-bold" variant="secondary" asChild>
          <Link href={withLocaleUrl('/admin/leads', locale)}>{t.viewLeads}</Link>
        </Button>
      </div>
    </div>
  )
}
