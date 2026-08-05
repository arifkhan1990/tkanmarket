import type { FabricCompositionItem } from '@/types/fabric'
import type { SocialPlatform } from '@/types/queue.types'

export type ChatMessage = {
  role: 'system' | 'user' | 'assistant'
  content: string
}

export type RawFabric = {
  id: number
  rawTitle: string | null
  rawDescription: string | null
  composition: FabricCompositionItem[] | null
  sourceUrl: string | null
  titleRu: string | null
  titleEn: string | null
  descriptionRu: string | null
  descriptionEn: string | null
  fabricType: string | null
  color: string | null
  gsm: number | null
  supplyType: string | null
  tags: string[] | null
  images: string[] | null
}

export type EnrichedProduct = {
  title_en: string | null
  description_en: string | null
  fabric_type: string | null
  gsm: number | null
  width_cm: number | null
  moq: number | null
  price_usd: string | null
  composition: FabricCompositionItem[] | null
  tags_en: string[]
  image_urls: string[]
  color_en: string | null
  supply_type_en: string | null
  shipment_time_en: string | null
  usage_en: string | null
  meta_title_en: string | null
  meta_description_en: string | null
  image_alt_en: string | null
}

export type TranslationResult = {
  title_ru: string | null
  description_ru: string | null
  usage_ru: string | null
  meta_title_ru: string | null
  meta_description_ru: string | null
  image_alt_ru: string | null
  tags: string[]
  color: string | null
  supply_type: string | null
  shipment_time: string | null
}

export type AIProcessedProduct = {
  title_en: string | null
  description_en: string | null
  title_ru: string | null
  description_ru: string | null
  meta_title_ru: string | null
  meta_description_ru: string | null
  fabric_type: string | null
  gsm: number | null
  width_cm: number | null
  moq: number | null
  price_usd: string | null
  composition: FabricCompositionItem[] | null
  tags: string[]
  image_urls: string[]
  color: string | null
  supply_type: string | null
  shipment_time: string | null
  usage_ru: string | null
  usage_en: string | null
  meta_title_en: string | null
  meta_description_en: string | null
  image_alt_ru: string | null
  image_alt_en: string | null
  tags_en: string[]
  color_en: string | null
  supply_type_en: string | null
  shipment_time_en: string | null
}

export type AIProcessingResult = {
  fabricId: number
  confidence01: number
  mandatoryReview: boolean
  processed: AIProcessedProduct
}

export type CarouselSlide = {
  slideNumber: number
  title: string
  imageDescription: string
}

export type SocialContent = {
  platform: SocialPlatform
  postTitle: string | null
  caption: string
  hashtags: string[]
  callToAction: string | null
  specificationsSummary: string | null
  keyFeatures: string[]
  targetAudience: string | null
  imagePrompt: string | null
  imageOverlayText: string | null
  carouselSlides: CarouselSlide[]
  mediaUrls: string[]
  reelScript: string | null
  recommendedPostingTime: string | null
}

export type SocialContentShared = {
  postTitle: string | null
  callToAction: string | null
  specificationsSummary: string | null
  keyFeatures: string[]
  targetAudience: string | null
  imagePrompt: string | null
  imageOverlayText: string | null
  carouselSlides: CarouselSlide[]
  reelScript: string | null
  recommendedPostingTime: string | null
}

export type SocialPlatformContent = SocialContentShared & {
  caption: string
  hashtags: string[]
}

export type SocialContentByPlatform = Record<SocialPlatform, SocialPlatformContent>

export type GeneratedImage = {
  id: number
  fabricId: number
  sourceUri: string
  storageUri: string | null
  status: 'pending' | 'completed' | 'failed'
  errorMessage: string | null
  createdAt: Date
}

export type GeneratedVideo = {
  id: number
  fabricId: number
  prompt: string
  operationName: string | null
  storageUri: string | null
  status: 'pending' | 'processing' | 'completed' | 'failed'
  errorMessage: string | null
  durationMs: number | null
  createdAt: Date
  updatedAt: Date
}



