'use client'

import * as React from 'react'

import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import type { SystemHealthRange, SystemLogLevel } from '@/types/admin-system-health.types'
import { useAdminSystemHealthDashboardQuery } from '@/hooks/admin/useAdminSystemHealthDashboardQuery'
import { SystemHealthTechnicalLogsPanel } from '@/components/admin/system-health/SystemHealthTechnicalLogsPanel'
import { SystemHealthSummaryCards, SystemHealthSummaryCardsSkeleton } from '@/components/admin/system-health/SystemHealthSummaryCards'
import { SystemHealthPulsePanel } from '@/components/admin/system-health/system-health-pulse-panel'
import { SystemHealthClusterPanel } from '@/components/admin/system-health/system-health-cluster-panel'
import { SystemHealthStreamsPanel } from '@/components/admin/system-health/system-health-streams-panel'

function rangeButtonClass(active: boolean) {
  return active
    ? 'px-4 py-2 text-xs font-semibold bg-primary-container text-on-primary rounded-lg'
    : 'px-4 py-2 text-xs font-semibold bg-surface-container-high rounded-lg hover:bg-surface-variant transition-colors'
}

function DashboardSkeleton() {
  return (
    <div className="space-y-6">
      <SystemHealthSummaryCardsSkeleton />
      <div className="h-64 animate-pulse rounded-2xl bg-surface-container-high" />
    </div>
  )
}

export function AdminSystemHealthDashboardClient() {
  const [range, setRange] = React.useState<SystemHealthRange>('24H')
  const [level, setLevel] = React.useState<SystemLogLevel>('ALL')
  const [tabValue, setTabValue] = React.useState<'pulse' | 'cluster' | 'streams'>('pulse')

  const query = useAdminSystemHealthDashboardQuery({ range, level })
  const d = query.data

  return (
    <div className="mx-auto max-w-[1600px] pb-12">
      <div className="mb-8 flex flex-col gap-4 lg:flex-row lg:items-end lg:justify-between">
        <div>
          <h1 className="font-headline text-3xl font-extrabold tracking-tight text-on-surface md:text-4xl">
            System health monitor
          </h1>
          <p className="mt-2 max-w-2xl text-on-surface-variant">
            Infrastructure observability for TkanMarket: crawler jobs, queues, and catalog pressure — unified with your admin theme.
          </p>
        </div>
        <div className="flex flex-wrap gap-2">
          <button type="button" className={rangeButtonClass(range === '1H')} onClick={() => setRange('1H')}>
            1H
          </button>
          <button type="button" className={rangeButtonClass(range === '24H')} onClick={() => setRange('24H')}>
            24H
          </button>
          <button type="button" className={rangeButtonClass(range === '7D')} onClick={() => setRange('7D')}>
            7D
          </button>
        </div>
      </div>

      {query.isLoading && !d ? <DashboardSkeleton /> : null}

      {d ? (
        <>
          <SystemHealthSummaryCards data={d.core} />

          <Tabs
            value={tabValue}
            onValueChange={(v) =>
              setTabValue(v === 'cluster' || v === 'streams' || v === 'pulse' ? v : 'pulse')
            }
            className="mt-8 w-full"
          >
            <TabsList className="mb-6 grid h-auto w-full max-w-lg grid-cols-3 gap-1 bg-muted/60 p-1">
              <TabsTrigger value="pulse">Pulse</TabsTrigger>
              <TabsTrigger value="cluster">Cluster</TabsTrigger>
              <TabsTrigger value="streams">Streams</TabsTrigger>
            </TabsList>

            <TabsContent value="pulse" className="outline-none">
              <SystemHealthPulsePanel data={d} />
            </TabsContent>
            <TabsContent value="cluster" className="outline-none">
              <SystemHealthClusterPanel data={d} />
            </TabsContent>
            <TabsContent value="streams" className="outline-none">
              <SystemHealthStreamsPanel data={d} />
            </TabsContent>
          </Tabs>

          <div className="mt-10">
            <SystemHealthTechnicalLogsPanel logs={d.core.technical_logs} level={level} onLevelChange={setLevel} />
          </div>
        </>
      ) : null}

      {!query.isLoading && !d ? (
        <div className="py-12 text-center text-muted-foreground">No system health data available.</div>
      ) : null}
    </div>
  )
}
