import { Queue } from 'bullmq'

import { QUEUE_NAMES } from '@/constants'
import { getBullRedisConnection } from '@/lib/redis/client'

function getConnection() {
  const connection = getBullRedisConnection()
  if (!connection) {
    throw new Error('REDIS_URL is not configured')
  }
  return connection
}

const defaultJobOptions = {
  attempts: 3,
  backoff: { type: 'exponential' as const, delay: 5000 },
  removeOnComplete: 100,
  removeOnFail: 500
}

// Expensive AI generation jobs get bounded retries to cap worst-case spend
// (combined with the in-client retry cap in src/lib/google/client.ts).
const aiGenerationJobOptions = {
  ...defaultJobOptions,
  attempts: 2
}

let crawlerQueue: Queue | null = null
let aiQueue: Queue | null = null
let imageQueue: Queue | null = null
let socialQueue: Queue | null = null
let socialPublishQueue: Queue | null = null
let socialAnalyticsQueue: Queue | null = null
let socialTokenRefreshQueue: Queue | null = null
let imageGenerationQueue: Queue | null = null
let videoGenerationQueue: Queue | null = null
let translationQueue: Queue | null = null
let mediaCleanupQueue: Queue | null = null
let blogQueue: Queue | null = null

function isBuildTime() {
  return process.env.NEXT_PHASE === 'phase-production-build'
}

function getOrCreateQueue(name: string, jobOptions = defaultJobOptions) {
  if (isBuildTime()) {
    throw new Error('Queue access during build is not allowed')
  }
  return new Queue(name, { connection: getConnection(), defaultJobOptions: jobOptions })
}

export function getCrawlerQueue(): Queue {
  if (!crawlerQueue) crawlerQueue = getOrCreateQueue(QUEUE_NAMES.CRAWLER)
  return crawlerQueue
}

export function getAIQueue(): Queue {
  if (!aiQueue) aiQueue = getOrCreateQueue(QUEUE_NAMES.AI, aiGenerationJobOptions)
  return aiQueue
}

export function getImageQueue(): Queue {
  if (!imageQueue) imageQueue = getOrCreateQueue(QUEUE_NAMES.IMAGE)
  return imageQueue
}

export function getSocialQueue(): Queue {
  if (!socialQueue) socialQueue = getOrCreateQueue(QUEUE_NAMES.SOCIAL, aiGenerationJobOptions)
  return socialQueue
}

export function getSocialPublishQueue(): Queue {
  if (!socialPublishQueue) socialPublishQueue = getOrCreateQueue(QUEUE_NAMES.SOCIAL_PUBLISH)
  return socialPublishQueue
}

export function getSocialAnalyticsQueue(): Queue {
  if (!socialAnalyticsQueue) socialAnalyticsQueue = getOrCreateQueue(QUEUE_NAMES.SOCIAL_ANALYTICS)
  return socialAnalyticsQueue
}

export function getSocialTokenRefreshQueue(): Queue {
  if (!socialTokenRefreshQueue) socialTokenRefreshQueue = getOrCreateQueue(QUEUE_NAMES.SOCIAL_TOKEN_REFRESH)
  return socialTokenRefreshQueue
}

export function getImageGenerationQueue(): Queue {
  if (!imageGenerationQueue) imageGenerationQueue = getOrCreateQueue(QUEUE_NAMES.IMAGE_GENERATION, aiGenerationJobOptions)
  return imageGenerationQueue
}

export function getVideoGenerationQueue(): Queue {
  if (!videoGenerationQueue) videoGenerationQueue = getOrCreateQueue(QUEUE_NAMES.VIDEO_GENERATION, aiGenerationJobOptions)
  return videoGenerationQueue
}

export function getTranslationQueue(): Queue {
  if (!translationQueue) translationQueue = getOrCreateQueue(QUEUE_NAMES.TRANSLATION)
  return translationQueue
}

export function getMediaCleanupQueue(): Queue {
  if (!mediaCleanupQueue) mediaCleanupQueue = getOrCreateQueue(QUEUE_NAMES.MEDIA_CLEANUP)
  return mediaCleanupQueue
}

export function getBlogQueue(): Queue {
  if (!blogQueue) blogQueue = getOrCreateQueue(QUEUE_NAMES.BLOG)
  return blogQueue
}

