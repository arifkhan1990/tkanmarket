import { QUEUE_NAMES, SOCIAL_PLATFORM } from '@/constants'

export type QueueName = (typeof QUEUE_NAMES)[keyof typeof QUEUE_NAMES]

export type SocialPlatform = (typeof SOCIAL_PLATFORM)[number]

/** Legacy catalog crawl (fabrics) — no `kind` field. */
export type CrawlerCatalogJobPayload = {
  jobId: string
  keywords: string[]
  source: string
  maxProducts: number
}

export type CrawlerSupplierDiscoveryJobPayload = {
  kind: 'supplier_discovery'
  jobId: string
  discoveryRunId: number
  keywords: string[]
  sources: string[]
  maxSuppliers: number
  maxProductsPerSupplier: number
}

export type CrawlerJobPayload = CrawlerCatalogJobPayload | CrawlerSupplierDiscoveryJobPayload

export type AIJobPayload = {
  jobId: string
  entityId: number
  entityType: 'fabric'
  priority?: number
}

export type ImageJobPayload = {
  jobId: string
  entityId: number
  imageUrls: string[]
}

export type SocialJobPayload = {
  jobId: string
  entityId: number
  platforms: SocialPlatform[]
}

export type SocialPublishJobPayload = {
  jobId: string
  postId: number
  actorUserId: number | null
  reason: 'scheduled' | 'manual'
}

export type SocialAnalyticsJobPayload = {
  jobId: string
  postId: number
}

export type SocialTokenRefreshJobPayload = {
  jobId: string
  credentialId: number
}

export type ImageGenerationJobPayload = {
  fabricId: number
  prompt: string
  isBatch?: boolean
  /** Target one of the 5 elite image types (fabricRoll | foldedStack | elegantDrape | flatLay | tailoredGarment). */
  promptType?: string
  /** How many images of that type to generate (default 1). Never touches existing media. */
  count?: number
}

export type VideoGenerationJobPayload = {
  fabricId: number
  prompt: string
  imageUrl?: string
  thumbnailPrompt?: string
  durationSeconds?: number
  aspectRatio?: string
  socialPostId?: number
}

export type TranslationJobPayload = {
  jobId: string
  fabricId: number
  sourceLang?: 'ru' | 'en'
}

export type BlogJobPayload = {
  jobId: string
  fabricId: number
}

