import { Worker } from 'bullmq'
import { z } from 'zod'

import {
  QUEUE_NAMES,
  SOCIAL_ANALYTICS_SYNC_INTERVAL_MS,
  SOCIAL_PLATFORM
} from '@/constants'
import { enqueueSocialAnalyticsSync, enqueueSocialPublish, enqueueSocialTokenRefresh } from '@/lib/queue/helpers'
import { logger } from '@/lib/logger'
import { AIService } from '@/services/ai.service'
import { SocialAnalyticsService } from '@/services/social-analytics.service'
import { SocialCredentialsService } from '@/services/social-credentials.service'
import { SocialPublisherService } from '@/services/social-publisher.service'
import { SocialService } from '@/services/social.service'
import { getBullConnection, installGracefulShutdown } from '@/workers/worker-utils'

const SocialJobSchema = z.object({
  jobId: z.string().min(1),
  entityId: z.number().int().positive(),
  platforms: z.array(z.enum(SOCIAL_PLATFORM)).min(1)
})

const PublishJobSchema = z.object({
  jobId: z.string().min(1),
  postId: z.number().int().nonnegative(),
  actorUserId: z.number().int().positive().nullable(),
  reason: z.enum(['scheduled', 'manual'])
})

const AnalyticsJobSchema = z.object({
  jobId: z.string().min(1),
  postId: z.number().int().nonnegative()
})

const TokenRefreshJobSchema = z.object({
  jobId: z.string().min(1),
  credentialId: z.number().int().nonnegative()
})

export const socialWorker = new Worker(
  QUEUE_NAMES.SOCIAL,
  async (job) => {
    await job.updateProgress(1)
    const payload = SocialJobSchema.parse(job.data)
    await job.updateProgress(10)
    const total = payload.platforms.length
    let done = 0

    let sharedContent = null
    try {
      sharedContent = await AIService.generateSocialContentShared(payload.entityId)
    } catch (err) {
      const message = err instanceof Error ? err.message : 'Shared content generation failed'
      logger.warn('Social shared content generation failed', { fabricId: payload.entityId, message })
    }

    for (const platform of payload.platforms) {
      try {
        await SocialService.generatePlatformContent(payload.entityId, platform, sharedContent ?? undefined)
      } catch (err) {
        const message = err instanceof Error ? err.message : 'Unknown social job error'
        logger.warn('Social platform generation failed', { fabricId: payload.entityId, platform, message })
      }
      done += 1
      const pct = 10 + Math.round((done / total) * 85)
      await job.updateProgress(pct)
    }
    await SocialService.recomputeSocialScore(payload.entityId).catch(() => {})
    await job.updateProgress(100)
  },
  {
    connection: getBullConnection(),
    concurrency: 2
  }
)

export const socialPublishWorker = new Worker(
  QUEUE_NAMES.SOCIAL_PUBLISH,
  async (job) => {
    if (job.name === 'publish_scheduler_tick') {
      const ids = await SocialPublisherService.findDueScheduledPostIds({ limit: 50 })
      for (const id of ids) {
        await enqueueSocialPublish(id, { actorUserId: null, reason: 'scheduled' })
      }
      logger.info('Publish scheduler tick', { enqueued: ids.length })
      return
    }
    const payload = PublishJobSchema.parse(job.data)
    await SocialPublisherService.publishPost({ postId: payload.postId, actorUserId: payload.actorUserId })
  },
  {
    connection: getBullConnection(),
    concurrency: 3
  }
)

export const socialAnalyticsWorker = new Worker(
  QUEUE_NAMES.SOCIAL_ANALYTICS,
  async (job) => {
    if (job.name === 'analytics_scheduler_tick') {
      const ids = await SocialAnalyticsService.findPostIdsDueForSync({
        limit: 100,
        minIntervalMs: SOCIAL_ANALYTICS_SYNC_INTERVAL_MS
      })
      for (const id of ids) {
        await enqueueSocialAnalyticsSync(id)
      }
      logger.info('Analytics scheduler tick', { enqueued: ids.length })
      return
    }
    const payload = AnalyticsJobSchema.parse(job.data)
    await SocialAnalyticsService.syncPostAnalytics(payload.postId)
  },
  {
    connection: getBullConnection(),
    concurrency: 3
  }
)

export const socialTokenRefreshWorker = new Worker(
  QUEUE_NAMES.SOCIAL_TOKEN_REFRESH,
  async (job) => {
    if (job.name === 'refresh_scheduler_tick') {
      const ids = await SocialCredentialsService.findCredentialsNeedingRefresh(100)
      for (const id of ids) {
        await enqueueSocialTokenRefresh(id)
      }
      logger.info('Token refresh scheduler tick', { enqueued: ids.length })
      return
    }
    const payload = TokenRefreshJobSchema.parse(job.data)
    await SocialCredentialsService.refreshCredential(payload.credentialId)
  },
  {
    connection: getBullConnection(),
    concurrency: 2
  }
)

for (const worker of [socialWorker, socialPublishWorker, socialAnalyticsWorker, socialTokenRefreshWorker]) {
  worker.on('completed', (job) => {
    logger.info('Social worker completed', { queue: worker.name, jobId: job.id })
  })
  worker.on('failed', (job, err) => {
    logger.error('Social worker failed', { queue: worker.name, jobId: job?.id ?? null, message: err?.message })
  })
}

installGracefulShutdown([socialWorker, socialPublishWorker, socialAnalyticsWorker, socialTokenRefreshWorker])
