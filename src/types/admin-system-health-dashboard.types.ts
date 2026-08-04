import type { SystemHealthRange, SystemHealthResponse, SystemLogLevel } from '@/types/admin-system-health.types'
import type { NetworkPerformanceResponse } from '@/types/admin-network-performance.types'

export type HealthServiceId = 'api' | 'database' | 'redis' | 'workers'

export interface DashboardServiceCard {
  id: HealthServiceId
  label: string
  status: 'Healthy' | 'Warning' | 'Critical'
  uptimeOrLoadPercent: number
  subtitle: string
}

export interface DashboardResourceSnapshot {
  cpuLoadPercent: number
  memoryPressurePercent: number
  activeThreads: number
  cpuLabel: string
  memLabel: string
  threadsLabel: string
}

export interface DashboardSystemEventRow {
  ts: string
  service: string
  statusLabel: 'Stable' | 'Mem-Limit' | 'Critical' | 'Degraded'
  detail: string
  nodeId: string
}

export interface DashboardRegionLatency {
  region: string
  latencyMs: number | null
  state: 'Operational' | 'Degraded' | 'Standby'
}

export interface DashboardCrawlerJobRow {
  jobId: string
  source: string
  status: 'RUNNING' | 'RETRYING' | 'IDLE'
}

export interface SystemHealthDashboardResponse {
  core: SystemHealthResponse
  range: SystemHealthRange
  level: SystemLogLevel
  updatedAt: string
  banner: {
    title: string
    subtitle: string
    uptimePercent: number
    latencyMs: number
  }
  serviceCards: DashboardServiceCard[]
  resources: DashboardResourceSnapshot
  network: NetworkPerformanceResponse
  systemEvents: DashboardSystemEventRow[]
  crawlerJobs: DashboardCrawlerJobRow[]
  regions: DashboardRegionLatency[]
  storage: {
    usedPercent: number
    usedLabel: string
    totalLabel: string
  }
  securityNote: string
  terminalLines: { ts: string; level: 'INFO' | 'WARN' | 'ERROR' | 'DEBUG'; message: string }[]
  fabricCatalogCount: number
}
