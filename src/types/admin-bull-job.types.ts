import type { AdminQueueName } from '@/types/admin-job-queue.types'

/** Serializable BullMQ job for admin detail (GET `/api/v1/admin/queues/.../jobs/...`). */
export interface AdminBullJobDetailDto {
  queueName: AdminQueueName
  state: string
  id: string
  name: string
  data: unknown
  opts: unknown
  progress: unknown
  attemptsMade: number
  attemptsStarted: number
  timestamp: number
  processedOn?: number
  finishedOn?: number
  failedReason: string | null
  stacktrace: string[]
  returnvalue: unknown
  delay: number
  priority: number
}
