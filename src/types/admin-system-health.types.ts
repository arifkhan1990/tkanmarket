export type SystemHealthRange = '1H' | '24H' | '7D'

export type SystemLogLevel = 'ALL' | 'ERRORS' | 'WARNINGS'

export interface SystemHealthNode {
  name: string
  node_id: number
  status: 'ONLINE' | 'BUSY' | 'DEGRADED'
  cpu_percent: number
}

export interface SystemHealthLogItem {
  ts: string
  level: 'INFO' | 'WARN' | 'ERROR'
  message: string
}

export interface TrafficVsLatencyPoint {
  time: string
  traffic: number
  p95_latency_ms: number
}

export interface SystemHealthResponse {
  range: SystemHealthRange
  uptime_percent: number
  api_latency_p95_ms: number
  db_load_capacity_percent: number
  traffic_vs_latency: TrafficVsLatencyPoint[]
  nodes: SystemHealthNode[]
  technical_logs: SystemHealthLogItem[]
}

