'use client'

import * as React from 'react'
import { BarChart2, RefreshCw, Sparkles } from 'lucide-react'
import { useQueryClient } from '@tanstack/react-query'

import { PromotionAnalyticsClient } from '@/components/admin/promotion-analytics/promotion-analytics-client'
import { PromotionManagerSection } from '@/components/admin/promotion-hub/promotion-manager-section'
import { Button } from '@/components/ui/button'
import { useI18n } from '@/hooks/useI18n'
import { cn } from '@/lib/utils'

type HubPanel = 'analytics' | 'operations'

function parsePanel(v: string | null): HubPanel {
  return v === 'operations' ? 'operations' : 'analytics'
}

export function AdminPromotionHubClient() {
  const { messages } = useI18n()
  const h = messages.admin.promotionHubPage
  const queryClient = useQueryClient()
  const [panel, setPanel] = React.useState<HubPanel>('analytics')
  const [isRefreshing, setIsRefreshing] = React.useState(false)

  React.useEffect(() => {
    const url = new URL(window.location.href)
    setPanel(parsePanel(url.searchParams.get('tab')))
  }, [])

  const switchPanel = React.useCallback((next: HubPanel) => {
    setPanel(next)
    const url = new URL(window.location.href)
    url.searchParams.set('tab', next)
    window.history.replaceState(null, '', url.toString())
  }, [])

  const handleRefresh = React.useCallback(async () => {
    setIsRefreshing(true)
    try {
      await Promise.all([
        queryClient.invalidateQueries({ queryKey: ['admin-promotion-manager'] }),
        queryClient.invalidateQueries({ queryKey: ['admin-promotion-analytics'] }),
        queryClient.invalidateQueries({ queryKey: ['admin-marketplace-analytics'] })
      ])
    } finally {
      setIsRefreshing(false)
    }
  }, [queryClient])

  return (
    <div className="min-h-full">
      <div className="mx-auto max-w-[1600px] space-y-8 py-8 pb-10">
        <header className="flex flex-col gap-6 lg:flex-row lg:items-start lg:justify-between">
          <div className="min-w-0">
            <h1 className="font-heading text-3xl font-extrabold tracking-tight text-on-surface">{h.title}</h1>
            <p className="mt-2 max-w-3xl text-on-surface-variant">{h.subtitle}</p>
          </div>

          <div className="flex shrink-0 flex-wrap items-center gap-2">
            <Button
              type="button"
              size="sm"
              variant="outline"
              className="rounded-full"
              onClick={() => void handleRefresh()}
              disabled={isRefreshing}
            >
              <RefreshCw className={cn('mr-2 h-4 w-4', isRefreshing && 'animate-spin')} aria-hidden />
              {h.refresh}
            </Button>
            <div
              role="tablist"
              aria-label={h.tabsAria}
              className="flex w-full shrink-0 gap-1 rounded-2xl border border-outline/10 bg-surface-container-low p-1 sm:w-auto"
            >
              <button
                type="button"
                role="tab"
                id="hub-tab-analytics"
                aria-selected={panel === 'analytics'}
                aria-controls="promotion-hub-panel"
                className={cn(
                  'inline-flex min-h-11 flex-1 items-center justify-center gap-2 rounded-xl px-3 py-2 text-sm font-bold transition-colors sm:flex-initial sm:px-4',
                  panel === 'analytics'
                    ? 'bg-surface-container-lowest text-primary shadow-sm'
                    : 'text-on-surface-variant hover:bg-surface-container-high hover:text-on-surface'
                )}
                onClick={() => switchPanel('analytics')}
              >
                <BarChart2 className="h-5 w-5 shrink-0" aria-hidden />
                <span>{h.tabAnalytics}</span>
              </button>
              <button
                type="button"
                role="tab"
                id="hub-tab-operations"
                aria-selected={panel === 'operations'}
                aria-controls="promotion-hub-panel"
                className={cn(
                  'inline-flex min-h-11 flex-1 items-center justify-center gap-2 rounded-xl px-3 py-2 text-sm font-bold transition-colors sm:flex-initial sm:px-4',
                  panel === 'operations'
                    ? 'bg-surface-container-lowest text-primary shadow-sm'
                    : 'text-on-surface-variant hover:bg-surface-container-high hover:text-on-surface'
                )}
                onClick={() => switchPanel('operations')}
              >
                <Sparkles className="h-5 w-5 shrink-0" aria-hidden />
                <span>{h.tabOperations}</span>
              </button>
            </div>
          </div>
        </header>

        <div
          id="promotion-hub-panel"
          role="tabpanel"
          aria-labelledby={panel === 'analytics' ? 'hub-tab-analytics' : 'hub-tab-operations'}
        >
          {panel === 'analytics' ? (
            <PromotionAnalyticsClient variant="embedded" onOpenOperationsTab={() => switchPanel('operations')} />
          ) : (
            <section className="space-y-6" aria-labelledby="promotion-operations-heading">
              <h2 id="promotion-operations-heading" className="sr-only">
                {h.sectionOperations}
              </h2>
              <PromotionManagerSection omitHeader />
            </section>
          )}
        </div>
      </div>
    </div>
  )
}
