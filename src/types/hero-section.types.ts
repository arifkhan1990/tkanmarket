import type { FabricSummary } from '@/types/marketplace.types'

/** Hero source mode — auto uses the featured-fabric ranking, custom uses admin picks. */
export type HeroSectionMode = 'auto' | 'custom'

/** A single hero slider slide bound to a fabric with an optional pinned image. */
export interface HeroSlideItem {
  fabricId: number
  enabled: boolean
  /** Pinned image override. When null the fabric's current first image is used. */
  imageUrl: string | null
}

/** A non-slider hero card (right column fabric card / bottom row cards). */
export interface HeroCardItem {
  fabricId: number
  imageUrl: string | null
}

export interface HeroVideoConfig {
  /** YouTube embed id. When null the platform default constant is used. */
  youtubeEmbedId: string | null
}

export interface HeroSectionConfig {
  mode: HeroSectionMode
  slider: HeroSlideItem[]
  rightCard: HeroCardItem | null
  bottomCards: HeroCardItem[]
  video: HeroVideoConfig
}

export interface HeroShowcase {
  sliderItems: FabricSummary[]
  cardItems: FabricSummary[]
  videoEmbedId: string | null
}

export const HERO_SLIDER_LIMIT = 5
export const HERO_BOTTOM_CARDS_LIMIT = 5

export const DEFAULT_HERO_CONFIG: HeroSectionConfig = {
  mode: 'auto',
  slider: [],
  rightCard: null,
  bottomCards: [],
  video: {
    youtubeEmbedId: null
  }
}
