import { Queue } from 'bullmq'
import { getRedisClient } from '@/lib/redis/client'
import { QUEUE_NAMES } from '@/constants'
import type {
  CrawlerJobPayload,
  AIJobPayload,
  ImageJobPayload,
  SocialJobPayload,
} from '@/types/queue.types'

// ============================================================
// Shared BullMQ connection
// ============================================================
function getConnection() {
  return { connection: getRedisClient() }
}

// Default job options for all queues
const defaultJobOptions = {
  attempts: 3,
  backoff: {
    type:  'exponential' as const,
    delay: 5_000,
  },
  removeOnComplete: { count: 100 },
  removeOnFail:     { count: 500 },
}

// ============================================================
// Queue instances (lazy-initialized singletons)
// ============================================================

let crawlerQueue: Queue<CrawlerJobPayload> | null = null
let aiQueue:      Queue<AIJobPayload>      | null = null
let imageQueue:   Queue<ImageJobPayload>   | null = null
let socialQueue:  Queue<SocialJobPayload>  | null = null

export function getCrawlerQueue(): Queue<CrawlerJobPayload> {
  if (!crawlerQueue) {
    crawlerQueue = new Queue(QUEUE_NAMES.CRAWLER, {
      ...getConnection(),
      defaultJobOptions,
    })
  }
  return crawlerQueue
}

export function getAIQueue(): Queue<AIJobPayload> {
  if (!aiQueue) {
    aiQueue = new Queue(QUEUE_NAMES.AI, {
      ...getConnection(),
      defaultJobOptions,
    })
  }
  return aiQueue
}

export function getImageQueue(): Queue<ImageJobPayload> {
  if (!imageQueue) {
    imageQueue = new Queue(QUEUE_NAMES.IMAGE, {
      ...getConnection(),
      defaultJobOptions: { ...defaultJobOptions, attempts: 2 },
    })
  }
  return imageQueue
}

export function getSocialQueue(): Queue<SocialJobPayload> {
  if (!socialQueue) {
    socialQueue = new Queue(QUEUE_NAMES.SOCIAL, {
      ...getConnection(),
      defaultJobOptions,
    })
  }
  return socialQueue
}
