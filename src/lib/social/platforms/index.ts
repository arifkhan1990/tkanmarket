import { FacebookPublisher } from './facebook'
import { InstagramPublisher } from './instagram'
import { PinterestPublisher } from './pinterest'
import { TikTokPublisher } from './tiktok'
import { YouTubePublisher } from './youtube'
import { BasePlatformPublisher } from './types'

import type { SocialPlatform } from '@/types/queue.types'

const registry = new Map<SocialPlatform, BasePlatformPublisher>()

export function getPublisher(platform: SocialPlatform): BasePlatformPublisher {
  const existing = registry.get(platform)
  if (existing) return existing
  const publisher = createPublisher(platform)
  registry.set(platform, publisher)
  return publisher
}

function createPublisher(platform: SocialPlatform): BasePlatformPublisher {
  switch (platform) {
    case 'INSTAGRAM':
      return new InstagramPublisher()
    case 'FACEBOOK':
      return new FacebookPublisher()
    case 'TIKTOK':
      return new TikTokPublisher()
    case 'PINTEREST':
      return new PinterestPublisher()
    case 'YOUTUBE':
      return new YouTubePublisher()
    default: {
      const exhaustive: never = platform
      throw new Error(`Unsupported platform: ${String(exhaustive)}`)
    }
  }
}

export { BasePlatformPublisher } from './types'
export type {
  OAuthAuthorizationTarget,
  OAuthExchangeResult,
  PlatformAnalyticsSnapshot,
  PlatformCredential,
  PlatformPostInput,
  PlatformPublishResult,
  PlatformTokenRefreshResult
} from './types'
export { PlatformPublishError } from './types'
