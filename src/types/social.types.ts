import type { SocialPlatform } from '@/types/queue.types'

export type SocialPostDraft = {
  fabricId: number
  platform: SocialPlatform
  captionText: string
  hashtags: string[]
  scriptText: string | null
  contentType: 'REEL_5' | 'REEL_8' | 'REEL_10' | 'CAROUSEL' | 'IMAGE_POST' | 'PIN'
}

