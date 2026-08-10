import type { QUEUE_NAMES } from '@/constants'

export type AdminQueueName = (typeof QUEUE_NAMES)[keyof typeof QUEUE_NAMES]

/** Response shape from GET `/api/v1/admin/queues` (BullMQ job counts per named queue). */
export type AdminQueueStatsMap = Record<
  AdminQueueName,
  { waiting: number; active: number; completed: number; failed: number }
>

export type AdminUnifiedJobKind = 'crawler' | 'ai' | 'image' | 'social'

/** One BullMQ job serialized for the admin job queue monitor. */
export interface AdminUnifiedQueueJobItem {
  id: string
  queueName: AdminQueueName
  jobKind: AdminUnifiedJobKind
  jobName: string
  state: string
  createdAt: string | null
  processedAt: string | null
  finishedAt: string | null
  runtimeMs: number | null
  failedReason: string | null
  crawlerRunId: number | null
  fabricId: number | null
  fabricTitle: string | null
}

export interface AdminUnifiedQueueJobsResponse {
  items: AdminUnifiedQueueJobItem[]
  total: number
  page: number
  pageSize: number
}

/** Pause flag per named queue (BullMQ `isPaused`). */
export type AdminQueuePauseStatusMap = Record<AdminQueueName, { isPaused: boolean }>
