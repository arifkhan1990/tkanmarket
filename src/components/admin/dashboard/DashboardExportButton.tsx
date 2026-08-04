'use client'

import type {
  CrawlerStats,
  FabricStats,
  FabricsPublishedSeriesPoint,
  LeadStats,
  LeadsBySourcePoint,
  SocialStats,
  TrafficVsConversionsPoint,
  TopFabricCategoriesPoint
} from '@/types/admin-stats.types'
import { Button } from '@/components/ui/button'

export function DashboardExportButton({
  fabricStats,
  leadStats,
  socialStats,
  crawlerStats,
  fabricsPublishedSeries,
  leadsBySource,
  trafficVsConversions,
  topFabricCategories
}: {
  fabricStats: FabricStats
  leadStats: LeadStats
  socialStats: SocialStats
  crawlerStats: CrawlerStats
  fabricsPublishedSeries: FabricsPublishedSeriesPoint[]
  leadsBySource: LeadsBySourcePoint[]
  trafficVsConversions: TrafficVsConversionsPoint[]
  topFabricCategories: TopFabricCategoriesPoint[]
}) {
  const onExport = () => {
    const payload = {
      exportedAt: new Date().toISOString(),
      range: 'last_30_days',
      stats: {
        fabricStats,
        leadStats,
        socialStats,
        crawlerStats
      },
      charts: {
        fabricsPublishedSeries,
        leadsBySource,
        trafficVsConversions,
        topFabricCategories
      }
    }

    const blob = new Blob([JSON.stringify(payload, null, 2)], { type: 'application/json' })
    const url = URL.createObjectURL(blob)
    const a = document.createElement('a')
    a.href = url
    a.download = `tkanmarket-admin-dashboard-${new Date().toISOString().slice(0, 10)}.json`
    document.body.appendChild(a)
    a.click()
    a.remove()
    URL.revokeObjectURL(url)
  }

  return (
    <Button type="button" variant="default" className="rounded-full" onClick={onExport}>
      Export Report
    </Button>
  )
}

