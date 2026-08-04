import type { Queue } from 'bullmq'

import { QUEUE_NAMES } from '@/constants'
import { ValidationError } from '@/lib/errors'
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

/** Resolve a BullMQ `Queue` instance by its Redis queue name (see `QUEUE_NAMES`). */
export function getQueueInstanceByName(name: string): Queue {
  switch (name) {
    case QUEUE_NAMES.CRAWLER:
      return getCrawlerQueue()
    case QUEUE_NAMES.AI:
      return getAIQueue()
    case QUEUE_NAMES.IMAGE:
      return getImageQueue()
    case QUEUE_NAMES.IMAGE_GENERATION:
      return getImageGenerationQueue()
    case QUEUE_NAMES.VIDEO_GENERATION:
      return getVideoGenerationQueue()
    case QUEUE_NAMES.SOCIAL:
      return getSocialQueue()
    case QUEUE_NAMES.SOCIAL_PUBLISH:
      return getSocialPublishQueue()
    case QUEUE_NAMES.SOCIAL_ANALYTICS:
      return getSocialAnalyticsQueue()
    case QUEUE_NAMES.SOCIAL_TOKEN_REFRESH:
      return getSocialTokenRefreshQueue()
    case QUEUE_NAMES.TRANSLATION:
      return getTranslationQueue()
    case QUEUE_NAMES.MEDIA_CLEANUP:
      return getMediaCleanupQueue()
    case QUEUE_NAMES.BLOG:
      return getBlogQueue()
    default:
      throw new ValidationError('Invalid queue name')
  }
}
