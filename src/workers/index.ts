import { createServer } from 'node:http'
import { installGracefulShutdown } from '@/workers/worker-utils'
import { isWorkerEnabled } from '@/lib/features'
import { logger } from '@/lib/logger'

import { aiWorker } from '@/workers/ai.worker'
import { imageWorker } from '@/workers/image.worker'
import imageGenerationWorker from '@/workers/image-generation.worker'
import videoGenerationWorker from '@/workers/video-generation.worker'
import {
  socialAnalyticsWorker,
  socialPublishWorker,
  socialTokenRefreshWorker,
  socialWorker
} from '@/workers/social.worker'
import { crawlerWorker } from '@/workers/crawler.worker'
import translationWorker from '@/workers/translation.worker'
import { mediaCleanupWorker } from '@/workers/media-cleanup.worker'
import { scheduleMediaCleanup, scheduleSocialRepeatables } from '@/lib/queue/helpers'

const healthPort = Number.parseInt(process.env.PORT ?? '8080', 10)
createServer((_req, res) => {
  res.writeHead(200, { 'content-type': 'text/plain' })
  res.end('ok')
}).listen(healthPort, () => {
  logger.info('Worker health server listening', { port: healthPort })
})

const allWorkers = [
  { name: 'ai', instance: aiWorker },
  { name: 'image', instance: imageWorker },
  { name: 'image_generation', instance: imageGenerationWorker },
  { name: 'video_generation', instance: videoGenerationWorker },
  { name: 'social', instance: socialWorker },
  { name: 'social_publish', instance: socialPublishWorker },
  { name: 'social_analytics', instance: socialAnalyticsWorker },
  { name: 'social_token_refresh', instance: socialTokenRefreshWorker },
  { name: 'translation', instance: translationWorker },
  { name: 'crawler', instance: crawlerWorker },
  { name: 'media_cleanup', instance: mediaCleanupWorker }
]

if (isWorkerEnabled('social_publish') || isWorkerEnabled('social_analytics') || isWorkerEnabled('social_token_refresh')) {
  scheduleSocialRepeatables().catch((err) => {
    logger.error('Failed to register social repeatable jobs', { message: err instanceof Error ? err.message : String(err) })
  })
}

if (isWorkerEnabled('media_cleanup')) {
  scheduleMediaCleanup().catch((err) => {
    logger.error('Failed to register media cleanup repeatable job', { message: err instanceof Error ? err.message : String(err) })
  })
}

const enabledWorkers = allWorkers
  .filter(({ name }) => {
    if (isWorkerEnabled(name)) return true
    logger.info('Worker skipped (feature disabled)', { worker: name })
    return false
  })
  .map(({ instance }) => instance)

installGracefulShutdown(enabledWorkers)
