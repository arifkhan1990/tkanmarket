'use client'

import * as React from 'react'
import { Download } from 'lucide-react'

import type { AdvancedAnalyticsResponse } from '@/types/admin-advanced-analytics.types'
import { useAdminAdvancedAnalyticsQuery } from '@/hooks/admin/useAdminAdvancedAnalyticsQuery'
import { AdvancedAnalyticsStatCards } from './AdvancedAnalyticsStatCards'
import { TrafficVsConversionsChart } from '@/components/admin/charts/TrafficVsConversionsChart'
import { LeadsBySourceChart } from '@/components/admin/charts/LeadsBySourceChart'
import { TopFabricCategoriesChart } from '@/components/admin/charts/TopFabricCategoriesChart'
import { Button } from '@/components/ui/button'

function downloadText(filename: string, content: string, mime: string) {
  const blob = new Blob([content], { type: mime })
  const url = URL.createObjectURL(blob)
  const a = document.createElement('a')
  a.href = url
  a.download = filename
  document.body.appendChild(a)
  a.click()
  a.remove()
  URL.revokeObjectURL(url)
}

function exportJson(data: AdvancedAnalyticsResponse) {
  const payload = {
    exportedAt: new Date().toISOString(),
    period: data.period,
    stats: data.stats,
    charts: {
      trafficVsConversions: data.trafficVsConversions,
      leadsBySource: data.leadsBySource,
      topFabricCategories: data.topFabricCategories
    }
  }
  downloadText(`advanced-analytics-${Date.now()}.json`, JSON.stringify(payload, null, 2), 'application/json;charset=utf-8')
}

function exportCsv(data: AdvancedAnalyticsResponse) {
  const header = ['date', 'traffic', 'conversions']
  const rows = data.trafficVsConversions.map((p) => [p.date, p.traffic, p.conversions].map((v) => `"${String(v).replace(/"/g, '""')}"`).join(','))
  const csv = [header.map((v) => `"${v}"`).join(','), ...rows].join('\n')
  downloadText(`advanced-analytics-${Date.now()}.csv`, csv, 'text/csv;charset=utf-8')
}

function AnalyticsSkeleton() {
  return (
    <div className="p-8 space-y-8 max-w-[1440px] mx-auto">
      <div className="rounded-3xl bg-surface-container-lowest border border-outline/10 p-6">
        <div className="h-10 w-48 rounded bg-surface-container-highest animate-pulse" />
        <div className="mt-3 h-4 w-72 rounded bg-surface-container-highest animate-pulse" />
      </div>
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        {Array.from({ length: 4 }).map((_, idx) => (
          <div key={idx} className="bg-surface-container-lowest p-6 rounded-2xl shadow-sm border border-outline/10 animate-pulse">
            <div className="h-10 w-10 rounded-xl bg-surface-container-highest" />
            <div className="mt-4 h-6 w-1/2 rounded bg-surface-container-highest" />
            <div className="mt-3 h-10 w-2/3 rounded bg-surface-container-highest" />
            <div className="mt-4 h-8 w-full rounded bg-surface-container-highest" />
          </div>
        ))}
      </div>

      <div className="bg-surface-container-lowest p-8 rounded-[2rem] border border-outline/10 animate-pulse">
        <div className="h-6 w-64 rounded bg-surface-container-highest" />
        <div className="mt-4 h-[360px] rounded-xl bg-surface-container-highest" />
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
        {Array.from({ length: 2 }).map((_, idx) => (
          <div key={idx} className="bg-surface-container-lowest p-8 rounded-[2rem] border border-outline/10 animate-pulse">
            <div className="h-6 w-56 rounded bg-surface-container-highest" />
            <div className="mt-5 h-[320px] rounded-xl bg-surface-container-highest" />
          </div>
        ))}
      </div>
    </div>
  )
}

export function AdminAdvancedAnalyticsClient() {
  const query = useAdminAdvancedAnalyticsQuery()
  const data = query.data

  return (
    <div className="p-8 space-y-8 max-w-[1440px] mx-auto">
      {query.isLoading && !data ? (
        <AnalyticsSkeleton />
      ) : null}

      {data ? (
        <>
          <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
            <div>
              <h1 className="text-3xl font-extrabold font-heading tracking-tight text-on-surface">Business Analytics</h1>
              <p className="mt-2 text-sm text-on-surface-variant">Daily performance metrics for the last 30 days</p>
            </div>

            <div className="flex items-center gap-3">
              <span className="hidden lg:inline-flex items-center bg-surface-container-highest px-4 py-2 rounded-lg text-sm font-medium text-on-surface-variant border border-outline/10">
                Last 30 days
              </span>
              <Button
                type="button"
                variant="outline"
                className="rounded-xl px-4 gap-2"
                onClick={() => exportJson(data)}
              >
                <Download className="h-4 w-4" aria-hidden />
                Export Report
              </Button>
              <Button type="button" variant="ghost" className="rounded-xl px-3" onClick={() => exportCsv(data)}>
                Export CSV
              </Button>
            </div>
          </div>

          <AdvancedAnalyticsStatCards data={data} isLoading={query.isLoading} />

          <div className="bg-surface-container-lowest p-8 rounded-[2rem] shadow-sm border border-outline/10">
            <TrafficVsConversionsChart data={data.trafficVsConversions} />
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
            <div className="bg-surface-container-lowest p-8 rounded-[2rem] border border-outline/10">
              <LeadsBySourceChart data={data.leadsBySource} />
            </div>
            <div className="bg-surface-container-lowest p-8 rounded-[2rem] border border-outline/10">
              <TopFabricCategoriesChart data={data.topFabricCategories} />
            </div>
          </div>
        </>
      ) : null}
    </div>
  )
}

