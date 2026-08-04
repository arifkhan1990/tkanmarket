export type SystemHealthRange = '1h' | '24h' | '7d'

export interface SystemHealthChartPoint {
  label: string
  count: number
}

export interface SystemHealthCrawlerEvent {
  id: number
  source: string
  status: string
  started_at: string | null
  completed_at: string | null
  products_found: number
  products_saved: number
  errors_count: number
}

export interface SystemHealthMetrics {
  global_uptime_pct: number
  security_alerts: number
  unique_ips: number
  auth_failures: number
  last_crawler_status: string | null
  last_crawler_started_at: string | null
}

export interface SystemHealthResponse<TAlert> {
  range: SystemHealthRange
  metrics: SystemHealthMetrics
  chart_points: SystemHealthChartPoint[]
  alerts: TAlert[]
  crawler_history: SystemHealthCrawlerEvent[]
}

