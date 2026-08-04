import { v4 as uuidv4 } from 'uuid'
import { getAIQueue, getCrawlerQueue, getImageQueue, getSocialQueue } from './definitions'
import { SocialPlatform } from '@/types/enums'
import type {
  AIJobPayload,
  CrawlerJobPayload,
  ImageJobPayload,
  SocialJobPayload,
  QueueStats,
} from '@/types/queue.types'

// ============================================================
// Add AI processing job for a fabric
// ============================================================
export async function addAIJob(fabricId: number, priority = 5) {
  const payload: AIJobPayload = {
    jobId:      uuidv4(),
    createdAt:  new Date().toISOString(),
    entityId:   fabricId,
    entityType: 'fabric',
    priority,
    fabricId,
  }
  return getAIQueue().add(`ai-fabric-${fabricId}`, payload, { priority })
}

// ============================================================
// Add image processing job
// ============================================================
export async function addImageJob(fabricId: number, imageUrls: string[]) {
  const payload: ImageJobPayload = {
    jobId:      uuidv4(),
    createdAt:  new Date().toISOString(),
    entityId:   fabricId,
    entityType: 'fabric',
    priority:   3,
    fabricId,
    imageUrls,
  }
  return getImageQueue().add(`image-fabric-${fabricId}`, payload)
}

// ============================================================
// Add social media content job
// ============================================================
export async function addSocialJob(
  fabricId:  number,
  platforms: SocialPlatform[] = [
    SocialPlatform.INSTAGRAM,
    SocialPlatform.TIKTOK,
    SocialPlatform.PINTEREST,
  ],
) {
  const payload: SocialJobPayload = {
    jobId:      uuidv4(),
    createdAt:  new Date().toISOString(),
    entityId:   fabricId,
    entityType: 'fabric',
    priority:   2,
    fabricId,
    platforms,
  }
  return getSocialQueue().add(`social-fabric-${fabricId}`, payload)
}

// ============================================================
// Add crawler job
// ============================================================
export async function addCrawlerJob(params: {
  crawlerRunId: number
  keywords:     string[]
  source:       'alibaba' | '1688' | 'both'
  maxProducts:  number
}) {
  const payload: CrawlerJobPayload = {
    jobId:      uuidv4(),
    createdAt:  new Date().toISOString(),
    entityId:   params.crawlerRunId,
    entityType: 'crawler_run',
    priority:   5,
    ...params,
  }
  return getCrawlerQueue().add(`crawl-run-${params.crawlerRunId}`, payload)
}

// ============================================================
// Get stats for all queues (admin dashboard)
// ============================================================
export async function getAllQueueStats(): Promise<QueueStats[]> {
  const queues = [
    { name: 'crawler_jobs',        queue: getCrawlerQueue() },
    { name: 'ai_processing_jobs',  queue: getAIQueue() },
    { name: 'image_processing_jobs', queue: getImageQueue() },
    { name: 'social_media_jobs',   queue: getSocialQueue() },
  ]

  return Promise.all(
    queues.map(async ({ name, queue }) => {
      const [waiting, active, completed, failed, delayed] = await Promise.all([
        queue.getWaitingCount(),
        queue.getActiveCount(),
        queue.getCompletedCount(),
        queue.getFailedCount(),
        queue.getDelayedCount(),
      ])
      return { name, waiting, active, completed, failed, delayed }
    }),
  )
}
