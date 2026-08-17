/**
 * Public-facing fabric card/summary data. Only fields intended for public
 * visitors are exposed — pricing, MOQ, engagement scores and internal
 * analytics are never returned to the public API/SSR.
 */
export interface FabricSummary {
  id: number
  slug: string
  titleRu: string
  titleEn: string | null
  fabricType: string | null
  gsm: number | null
  widthCm: number | null
  imageUrl: string | null
  tags: string[]
  tagsEn: string[] | null
  color: string | null
  colorEn: string | null
  supplyType: string | null
  supplyTypeEn: string | null
  shipmentTime: string | null
  shipmentTimeEn: string | null
  /** Present when loaded for featured/home cards */
  sku?: string | null
  /** Whether the fabric has an AI-generated video */
  hasVideo: boolean
  /** Thumbnail URL for the AI-generated video */
  thumbnailUrl: string | null
}

export interface SupplierCatalogPreview {
  approvedFabricCount: number
  coverImageUrl: string | null
  focusFabricType: string | null
}

export interface SupplierSummary {
  id: number
  slug: string
  name: string
  logoUrl: string | null
  verified: boolean
  country: string
  city: string | null
  province: string | null
  /** Present on catalog list API — derived from approved fabrics. */
  catalogPreview?: SupplierCatalogPreview
}

export interface SupplierProfileInsights {
  approvedFabricCount: number
  topTags: string[]
  moqMin: number | null
  moqMax: number | null
  fabricTypeCounts: { fabricType: string; count: number }[]
}

export interface SupplierDetail extends SupplierSummary {
  description: string | null
  websiteUrl: string | null
  establishedYear: number | null
  featuredFabrics: FabricSummary[]
  /** Derived from approved catalog fabrics (tags, MOQ range, types). */
  insights: SupplierProfileInsights
}

/**
 * Public-facing fabric detail data. `descriptionRu/En` and the `meta*`
 * fields are only used for SEO `<meta>`/JSON-LD — they are never rendered as
 * visible page content. Internal scraping/AI-processing fields (raw data,
 * source URL, AI confidence, view counts, featured flag) are not exposed.
 */
export interface FabricDetail extends FabricSummary {
  descriptionRu: string
  descriptionEn: string | null
  usageRu: string | null
  usageEn: string | null
  metaTitleRu: string | null
  metaDescriptionRu: string | null
  metaTitleEn: string | null
  metaDescriptionEn: string | null
  imageAltRu: string | null
  imageAltEn: string | null
  sku: string | null
  composition: Array<{ material: string; percentage: number }> | null
  images: string[]
  /** AI-generated video URL (completed) */
  videoUrl: string | null
  /** Thumbnail URL for the AI-generated video */
  videoThumbnailUrl: string | null
}

export interface PaginatedResult<T> {
  items: T[]
  total: number
}

/** Counts of approved fabrics per `fabric_categories.category_slug` (junction). */
export interface JunctionCategoryCount {
  slug: string
  name_ru: string
  name_en: string | null
  count: number
}

export type LeadStatus =
  | 'NEW'
  | 'CONTACTED'
  | 'QUALIFIED'
  | 'PROPOSAL_SENT'
  | 'NEGOTIATING'
  | 'CLOSED_WON'
  | 'CLOSED_LOST'

export type LeadSource =
  | 'MARKETPLACE_INQUIRY'
  | 'SAMPLE_REQUEST'
  | 'SOCIAL_CAMPAIGN'
  | 'DIRECT_CONTACT'
  | 'MANUAL_ENTRY'

export interface LeadCreateResult {
  id: number
}


