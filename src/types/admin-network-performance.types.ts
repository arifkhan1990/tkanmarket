import type { QUEUE_NAMES } from '@/constants'

export type QueueName = (typeof QUEUE_NAMES)[keyof typeof QUEUE_NAMES]

export interface QueueHealthSlice {
  waiting: number
  active: number
  completed: number
  failed: number
}

export interface CrawlerRunLatencyPoint {
  runId: number
  source: string
  durationMs: number | null
  status: string
  completedAt: string | null
}

export interface NetworkPerformanceResponse {
  queues: Record<QueueName, QueueHealthSlice>
  crawlerLatency: {
    avgMs: number | null
    p99Ms: number | null
    recent: CrawlerRunLatencyPoint[]
  }
  updatedAt: string
}
