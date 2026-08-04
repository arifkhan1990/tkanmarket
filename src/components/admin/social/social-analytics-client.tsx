'use client'

import * as React from 'react'
import { Loader2 } from 'lucide-react'

import { Card, CardContent, CardHeader } from '@/components/ui/card'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { SocialPlatformIcon } from '@/components/admin/social/social-platform-icon'
import {
  useAdminSocialAnalyticsSummary,
  type SocialAnalyticsSummaryEntry
} from '@/hooks/admin/useAdminSocialAnalytics'

interface AnalyticsPreset {
  label: string
  days: number
}

const PRESETS: AnalyticsPreset[] = [
  { label: 'Last 7 days', days: 7 },
  { label: 'Last 30 days', days: 30 },
  { label: 'Last 90 days', days: 90 },
  { label: 'All time', days: 0 }
]

const DEFAULT_PRESET = PRESETS[1] as AnalyticsPreset

function compactNumber(n: number): string {
  if (!Number.isFinite(n)) return '0'
  if (Math.abs(n) >= 1_000_000) return `${(n / 1_000_000).toFixed(1)}M`
  if (Math.abs(n) >= 1_000) return `${(n / 1_000).toFixed(1)}K`
  return String(n)
}

function totals(rows: SocialAnalyticsSummaryEntry[]) {
  return rows.reduce(
    (acc, r) => ({
      publishedCount: acc.publishedCount + r.publishedCount,
      totalReach: acc.totalReach + r.totalReach,
      totalImpressions: acc.totalImpressions + r.totalImpressions,
      totalLikes: acc.totalLikes + r.totalLikes,
      totalComments: acc.totalComments + r.totalComments,
      totalShares: acc.totalShares + r.totalShares,
      totalSaves: acc.totalSaves + r.totalSaves,
      totalLinkClicks: acc.totalLinkClicks + r.totalLinkClicks,
      totalVideoViews: acc.totalVideoViews + r.totalVideoViews
    }),
    {
      publishedCount: 0,
      totalReach: 0,
      totalImpressions: 0,
      totalLikes: 0,
      totalComments: 0,
      totalShares: 0,
      totalSaves: 0,
      totalLinkClicks: 0,
      totalVideoViews: 0
    }
  )
}

export function SocialAnalyticsClient() {
  const [preset, setPreset] = React.useState<AnalyticsPreset>(DEFAULT_PRESET)
  const [since, setSince] = React.useState<string | undefined>(() =>
    DEFAULT_PRESET.days === 0 ? undefined : new Date(Date.now() - DEFAULT_PRESET.days * 24 * 60 * 60 * 1000).toISOString()
  )
  React.useEffect(() => {
    if (preset.days === 0) {
      setSince(undefined)
      return
    }
    setSince(new Date(Date.now() - preset.days * 24 * 60 * 60 * 1000).toISOString())
  }, [preset])
  const query = useAdminSocialAnalyticsSummary({ since })
  const rows: SocialAnalyticsSummaryEntry[] = query.data?.success ? query.data.data.summary : []
  const aggregate = totals(rows)

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="font-heading text-2xl font-bold md:text-3xl">Social analytics</h1>
          <p className="text-sm text-muted-foreground">Per-platform engagement across your published content.</p>
        </div>
        <Select
          value={String(preset.days)}
          onValueChange={(v) => {
            const next = PRESETS.find((p) => String(p.days) === v)
            if (next) setPreset(next)
          }}
        >
          <SelectTrigger className="w-44">
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            {PRESETS.map((p) => (
              <SelectItem key={p.days} value={String(p.days)}>
                {p.label}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>

      {query.isLoading ? (
        <div className="flex items-center justify-center p-12 text-muted-foreground">
          <Loader2 className="mr-2 h-5 w-5 animate-spin" /> Loading analytics…
        </div>
      ) : (
        <>
          <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
            {[
              { label: 'Published', value: aggregate.publishedCount },
              { label: 'Impressions', value: aggregate.totalImpressions },
              { label: 'Reach', value: aggregate.totalReach },
              { label: 'Engagements', value: aggregate.totalLikes + aggregate.totalComments + aggregate.totalShares + aggregate.totalSaves }
            ].map((stat) => (
              <Card key={stat.label}>
                <CardHeader className="pb-2">
                  <h2 className="text-sm font-medium text-muted-foreground">{stat.label}</h2>
                </CardHeader>
                <CardContent>
                  <div className="text-3xl font-bold">{compactNumber(stat.value)}</div>
                </CardContent>
              </Card>
            ))}
          </div>

          <Card>
            <CardHeader>
              <h2 className="text-lg font-semibold">By platform</h2>
            </CardHeader>
            <CardContent className="space-y-2">
              {rows.length === 0 ? (
                <p className="text-sm text-muted-foreground">No published posts in this range.</p>
              ) : (
                <div className="overflow-x-auto">
                  <table className="w-full text-sm">
                    <thead>
                      <tr className="border-b text-left text-xs uppercase text-muted-foreground">
                        <th className="py-2">Platform</th>
                        <th>Published</th>
                        <th>Reach</th>
                        <th>Impressions</th>
                        <th>Likes</th>
                        <th>Comments</th>
                        <th>Shares</th>
                        <th>Saves</th>
                        <th>Link clicks</th>
                        <th>Video views</th>
                      </tr>
                    </thead>
                    <tbody>
                      {rows.map((r) => (
                        <tr key={r.platform} className="border-b last:border-b-0">
                          <td className="py-2">
                            <div className="flex items-center gap-2">
                              <SocialPlatformIcon platform={r.platform as 'INSTAGRAM' | 'TIKTOK' | 'PINTEREST' | 'FACEBOOK' | 'YOUTUBE'} className="h-4 w-4" />
                              {r.platform}
                            </div>
                          </td>
                          <td>{compactNumber(r.publishedCount)}</td>
                          <td>{compactNumber(r.totalReach)}</td>
                          <td>{compactNumber(r.totalImpressions)}</td>
                          <td>{compactNumber(r.totalLikes)}</td>
                          <td>{compactNumber(r.totalComments)}</td>
                          <td>{compactNumber(r.totalShares)}</td>
                          <td>{compactNumber(r.totalSaves)}</td>
                          <td>{compactNumber(r.totalLinkClicks)}</td>
                          <td>{compactNumber(r.totalVideoViews)}</td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              )}
            </CardContent>
          </Card>
        </>
      )}
    </div>
  )
}
