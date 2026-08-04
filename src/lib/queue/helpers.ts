import type { Job } from 'bullmq'

import { QUEUE_NAMES, SOCIAL_PLATFORM, SOCIAL_ANALYTICS_SYNC_INTERVAL_MS, SOCIAL_PUBLISH_POLL_INTERVAL_MS, SOCIAL_TOKEN_REFRESH_INTERVAL_MS, MEDIA_CLEANUP_INTERVAL_MS } from '@/constants'
import { logger } from '@/lib/logger'
import {
  getAIQueue,
  getBlogQueue,
  getCrawlerQueue,
  getImageGenerationQueue,
  getImageQueue,
  getMediaCleanupQueue,
  getSocialAnalyticsQueue,
  getSocialPublishQueue,
  getSocialQueue,
  getSocialTokenRefreshQueue,
  getTranslationQueue,
  getVideoGenerationQueue
} from '@/lib/queue/definitions'
import type {
  AIJobPayload,
  BlogJobPayload,
  CrawlerJobPayload,
  ImageGenerationJobPayload,
  ImageJobPayload,
  SocialAnalyticsJobPayload,
  SocialJobPayload,
  SocialPlatform,
  SocialPublishJobPayload,
  SocialTokenRefreshJobPayload,
  TranslationJobPayload,
  VideoGenerationJobPayload
} from '@/types/queue.types'

export type QueueStatsMap = Record<
  (typeof QUEUE_NAMES)[keyof typeof QUEUE_NAMES],
  { waiting: number; active: number; completed: number; failed: number }
>

const EMPTY_QUEUE_COUNTS = { waiting: 0, active: 0, completed: 0, failed: 0 } as const

function emptyQueueStatsMap(): QueueStatsMap {
  return {
    [QUEUE_NAMES.CRAWLER]: { ...EMPTY_QUEUE_COUNTS },
    [QUEUE_NAMES.AI]: { ...EMPTY_QUEUE_COUNTS },
    [QUEUE_NAMES.IMAGE]: { ...EMPTY_QUEUE_COUNTS },
    [QUEUE_NAMES.IMAGE_GENERATION]: { ...EMPTY_QUEUE_COUNTS },
    [QUEUE_NAMES.VIDEO_GENERATION]: { ...EMPTY_QUEUE_COUNTS },
    [QUEUE_NAMES.TRANSLATION]: { ...EMPTY_QUEUE_COUNTS },
    [QUEUE_NAMES.SOCIAL]: { ...EMPTY_QUEUE_COUNTS },
    [QUEUE_NAMES.SOCIAL_PUBLISH]: { ...EMPTY_QUEUE_COUNTS },
    [QUEUE_NAMES.SOCIAL_ANALYTICS]: { ...EMPTY_QUEUE_COUNTS },
    [QUEUE_NAMES.SOCIAL_TOKEN_REFRESH]: { ...EMPTY_QUEUE_COUNTS },
    [QUEUE_NAMES.MEDIA_CLEANUP]: { ...EMPTY_QUEUE_COUNTS },
    [QUEUE_NAMES.BLOG]: { ...EMPTY_QUEUE_COUNTS }
  }
}

function makeJobId(prefix: string) {
  const crypto = globalThis.crypto as Crypto | undefined
  const uuid = typeof crypto?.randomUUID === 'function' ? crypto.randomUUID() : `${Date.now()}_${Math.random().toString(16).slice(2)}`
  return `${prefix}_${uuid}`
}

export async function addCrawlerJob(payload: CrawlerJobPayload): Promise<Job<CrawlerJobPayload>> {
  return getCrawlerQueue().add('crawl', payload, { jobId: payload.jobId })
}

export async function addAIJob(fabricId: number, priority?: number): Promise<Job<AIJobPayload>> {
  const payload: AIJobPayload = {
    jobId: makeJobId('ai'),
    entityId: fabricId,
    entityType: 'fabric',
    priority
  }
  return getAIQueue().add('ai_process', payload, { jobId: payload.jobId, priority })
}

export async function addImageJob(fabricId: number, imageUrls: string[]): Promise<Job<ImageJobPayload>> {
  const payload: ImageJobPayload = { jobId: makeJobId('image'), entityId: fabricId, imageUrls }
  return getImageQueue().add('image_process', payload, { jobId: payload.jobId })
}

export async function addImageGenerationJob(fabricId: number, prompt: string, extra?: Partial<ImageGenerationJobPayload>): Promise<Job<ImageGenerationJobPayload>> {
  const payload: ImageGenerationJobPayload = { fabricId, prompt, ...extra }
  return getImageGenerationQueue().add('image_generate', payload, { jobId: makeJobId('image_gen') })
}

export async function addTranslationJob(fabricId: number, sourceLang?: 'ru' | 'en'): Promise<Job<TranslationJobPayload>> {
  const payload: TranslationJobPayload = {
    jobId: makeJobId('translation'),
    fabricId,
    sourceLang
  }
  return getTranslationQueue().add('translate', payload, { jobId: payload.jobId })
}

export async function addVideoGenerationJob(fabricId: number, payload: VideoGenerationJobPayload): Promise<Job<VideoGenerationJobPayload>> {
  return getVideoGenerationQueue().add('video_generate', {
    ...payload,
    fabricId
  }, { jobId: makeJobId('video_gen') })
}

export async function addSocialJob(fabricId: number, platforms?: SocialPlatform[]): Promise<Job<SocialJobPayload>> {
  const payload: SocialJobPayload = {
    jobId: makeJobId('social'),
    entityId: fabricId,
    platforms: platforms && platforms.length > 0 ? platforms : [...SOCIAL_PLATFORM]
  }
  return getSocialQueue().add('social_generate', payload, { jobId: payload.jobId })
}

export async function enqueueSocialPublish(postId: number, options: { actorUserId: number | null; reason: 'scheduled' | 'manual' }): Promise<Job<SocialPublishJobPayload>> {
  const payload: SocialPublishJobPayload = {
    jobId: makeJobId('social_publish'),
    postId,
    actorUserId: options.actorUserId,
    reason: options.reason
  }
  return getSocialPublishQueue().add('publish', payload, { jobId: `${options.reason}_${postId}_${Date.now()}` })
}

export async function enqueueSocialAnalyticsSync(postId: number): Promise<Job<SocialAnalyticsJobPayload>> {
  const payload: SocialAnalyticsJobPayload = { jobId: makeJobId('social_analytics'), postId }
  return getSocialAnalyticsQueue().add('analytics_sync', payload, { jobId: `analytics_${postId}_${Date.now()}` })
}

export async function enqueueSocialTokenRefresh(credentialId: number): Promise<Job<SocialTokenRefreshJobPayload>> {
  const payload: SocialTokenRefreshJobPayload = { jobId: makeJobId('social_token_refresh'), credentialId }
  return getSocialTokenRefreshQueue().add('token_refresh', payload, { jobId: `refresh_${credentialId}_${Date.now()}` })
}

export async function scheduleMediaCleanup(): Promise<void> {
  const queue = getMediaCleanupQueue()
  await queue.add(
    'cleanup_scheduler_tick',
    { jobId: 'cleanup_scheduler_tick', batchSize: 50 },
    { repeat: { every: MEDIA_CLEANUP_INTERVAL_MS }, jobId: 'cleanup_scheduler_tick' }
  )
}

export async function scheduleSocialRepeatables(): Promise<void> {
  const publishQueue = getSocialPublishQueue()
  const analyticsQueue = getSocialAnalyticsQueue()
  const refreshQueue = getSocialTokenRefreshQueue()
  await publishQueue.add(
    'publish_scheduler_tick',
    { jobId: 'publish_scheduler_tick', postId: 0, actorUserId: null, reason: 'scheduled' as const },
    { repeat: { every: SOCIAL_PUBLISH_POLL_INTERVAL_MS }, jobId: 'publish_scheduler_tick' }
  )
  await analyticsQueue.add(
    'analytics_scheduler_tick',
    { jobId: 'analytics_scheduler_tick', postId: 0 },
    { repeat: { every: SOCIAL_ANALYTICS_SYNC_INTERVAL_MS }, jobId: 'analytics_scheduler_tick' }
  )
  await refreshQueue.add(
    'refresh_scheduler_tick',
    { jobId: 'refresh_scheduler_tick', credentialId: 0 },
    { repeat: { every: SOCIAL_TOKEN_REFRESH_INTERVAL_MS }, jobId: 'refresh_scheduler_tick' }
  )
}

export async function getQueueStats(): Promise<
  Record<(typeof QUEUE_NAMES)[keyof typeof QUEUE_NAMES], { waiting: number; active: number; completed: number; failed: number }>
> {
  const queues = [
    { name: QUEUE_NAMES.CRAWLER, queue: getCrawlerQueue() },
    { name: QUEUE_NAMES.AI, queue: getAIQueue() },
    { name: QUEUE_NAMES.IMAGE, queue: getImageQueue() },
    { name: QUEUE_NAMES.IMAGE_GENERATION, queue: getImageGenerationQueue() },
    { name: QUEUE_NAMES.VIDEO_GENERATION, queue: getVideoGenerationQueue() },
    { name: QUEUE_NAMES.TRANSLATION, queue: getTranslationQueue() },
    { name: QUEUE_NAMES.SOCIAL, queue: getSocialQueue() },
    { name: QUEUE_NAMES.SOCIAL_PUBLISH, queue: getSocialPublishQueue() },
    { name: QUEUE_NAMES.SOCIAL_ANALYTICS, queue: getSocialAnalyticsQueue() },
    { name: QUEUE_NAMES.SOCIAL_TOKEN_REFRESH, queue: getSocialTokenRefreshQueue() },
    { name: QUEUE_NAMES.MEDIA_CLEANUP, queue: getMediaCleanupQueue() }
  ] as const

  const entries = await Promise.all(
    queues.map(async ({ name, queue }) => {
      const counts = await queue.getJobCounts('waiting', 'active', 'completed', 'failed')
      return [
        name,
        {
          waiting: counts.waiting ?? 0,
          active: counts.active ?? 0,
          completed: counts.completed ?? 0,
          failed: counts.failed ?? 0
        }
      ] as const
    })
  )

  return Object.fromEntries(entries) as QueueStatsMap
}

/**
 * Same as {@link getQueueStats} but never throws: returns zeroed stats when Redis/BullMQ is unavailable.
 */
export async function getQueueStatsSafe(): Promise<{ stats: QueueStatsMap; error: string | null }> {
  try {
    const stats = await getQueueStats()
    return { stats, error: null }
  } catch (err) {
    const message = err instanceof Error ? err.message : 'Queue stats unavailable'
    logger.warn('getQueueStats failed', { message })
    return { stats: emptyQueueStatsMap(), error: message }
  }
}

