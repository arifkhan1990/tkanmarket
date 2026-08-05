export const PAGINATION = {
  DEFAULT_PAGE_SIZE: 24,
  MAX_PAGE_SIZE: 100
} as const

export const FABRIC_STATUS = [
  'raw_scraped',
  'ai_processing',
  'ai_processed',
  'approved',
  'rejected'
] as const

export const LEAD_STATUS = [
  'NEW',
  'CONTACTED',
  'QUALIFIED',
  'PROPOSAL_SENT',
  'NEGOTIATING',
  'CLOSED_WON',
  'CLOSED_LOST'
] as const

export const LEAD_SOURCE = [
  'MARKETPLACE_INQUIRY',
  'SAMPLE_REQUEST',
  'SOCIAL_CAMPAIGN',
  'DIRECT_CONTACT',
  'MANUAL_ENTRY'
] as const

export const SOCIAL_PLATFORM = ['INSTAGRAM', 'TIKTOK', 'PINTEREST', 'FACEBOOK', 'YOUTUBE'] as const

/** Allowed durations (seconds) for reel / short video generation. Only these 3 variants are permitted. */
export const REEL_DURATIONS = [5, 8, 10] as const
export type ReelDuration = (typeof REEL_DURATIONS)[number]

export const QUEUE_NAMES = {
  CRAWLER: 'crawler_jobs',
  AI: 'ai_processing_jobs',
  IMAGE: 'image_processing_jobs',
  IMAGE_GENERATION: 'image_generation_jobs',
  VIDEO_GENERATION: 'video_generation_jobs',
  TRANSLATION: 'translation_jobs',
  SOCIAL: 'social_media_jobs',
  SOCIAL_PUBLISH: 'social_publish_jobs',
  SOCIAL_ANALYTICS: 'social_analytics_jobs',
  SOCIAL_TOKEN_REFRESH: 'social_token_refresh_jobs',
  MEDIA_CLEANUP: 'media_cleanup_jobs',
  BLOG: 'blog_jobs'
} as const

/** BullMQ worker concurrency for the crawler queue (must match `crawler.worker.ts`). */
export const CRAWLER_WORKER_CONCURRENCY = 3 as const

export const SOCIAL_CAMPAIGN_STATUS = ['PLANNING', 'ACTIVE', 'PAUSED', 'COMPLETED', 'ARCHIVED'] as const

export const SOCIAL_POST_STATUS = ['DRAFT', 'APPROVED', 'SCHEDULED', 'PUBLISHING', 'PUBLISHED', 'FAILED', 'VIDEO_PENDING'] as const

export const SOCIAL_CONTENT_TYPE = ['REEL_5', 'REEL_8', 'REEL_10', 'CAROUSEL', 'IMAGE_POST', 'PIN'] as const

export const SOCIAL_ACTIVITY_ACTION = [
  'CREATED',
  'UPDATED',
  'APPROVED',
  'SCHEDULED',
  'UNSCHEDULED',
  'PUBLISHED',
  'FAILED',
  'REJECTED',
  'REOPENED',
  'ANALYTICS_SYNCED',
  'CREDENTIALS_CONNECTED',
  'CREDENTIALS_DISCONNECTED',
  'CREDENTIALS_REFRESHED'
] as const

/** Daily publish quota per platform — enforced via Redis token bucket. */
export const SOCIAL_DAILY_QUOTA: Record<(typeof SOCIAL_PLATFORM)[number], number> = {
  INSTAGRAM: 50,
  TIKTOK: 10,
  PINTEREST: 100,
  FACEBOOK: 50,
  YOUTUBE: 20
}

export const SOCIAL_OAUTH_STATE_TTL_MS = 10 * 60 * 1000
export const SOCIAL_TOKEN_REFRESH_LEEWAY_MS = 10 * 60 * 1000
export const SOCIAL_MAX_PUBLISH_ATTEMPTS = 5
export const SOCIAL_ANALYTICS_SYNC_INTERVAL_MS = 60 * 60 * 1000
export const SOCIAL_TOKEN_REFRESH_INTERVAL_MS = 15 * 60 * 1000
export const SOCIAL_PUBLISH_POLL_INTERVAL_MS = 60 * 1000

export const BULK_IMPORT_STATUS = [
  'PENDING',
  'PROCESSING',
  'COMPLETED',
  'PARTIAL',
  'FAILED'
] as const

export const FABRIC_MATERIALS = [
  'Хлопок',
  'Лён',
  'Полиэстер',
  'Шёлк',
  'Шерсть',
  'Вискоза',
  'Нейлон',
  'Спандекс',
  'Акрил',
  'Смесовые'
] as const

export const GOOGLE_AI_MODELS = {
  TEXT: 'gemini-3.6-flash',
  IMAGE: 'gemini-3.1-flash-image',
  VIDEO: 'gemini-omni-flash-preview'
} as const

// Gemini per-token pricing (USD) — https://ai.google.dev/pricing
// Prices per 1,000,000 tokens. We store per-token cost = price_per_1M / 1_000_000
export const GOOGLE_AI_MODEL_PRICING: Record<string, { inputPerToken: number; outputPerToken: number }> = {
  'gemini-3.6-flash':       { inputPerToken: 0.15 / 1_000_000, outputPerToken: 0.60 / 1_000_000 },
  'gemini-3.1-flash-image': { inputPerToken: 0.15 / 1_000_000, outputPerToken: 0.60 / 1_000_000 },
  'gemini-omni-flash-preview': { inputPerToken: 0.15 / 1_000_000, outputPerToken: 0.60 / 1_000_000 }
} as const
export const GOOGLE_IMAGE_COST_PER_IMAGE = 0.055 as const
export const GOOGLE_VIDEO_COST_PER_SECOND = 0.10 as const

/** Max completed video versions kept per scope (fabric or linked post) before the oldest are pruned. */
export const MEDIA_VERSION_RETENTION = 5 as const

/** How often the media cleanup sweep runs (ms). */
export const MEDIA_CLEANUP_INTERVAL_MS = 3600000 as const

export const CIS_COUNTRIES = [
  'Russia',
  'Kazakhstan',
  'Belarus',
  'Kyrgyzstan',
  'Armenia',
  'Azerbaijan',
  'Uzbekistan',
  'Tajikistan',
  'Turkmenistan',
  'Moldova',
  'Georgia'
] as const

