export interface FabricSummary {
  id: number
  slug: string
  titleRu: string
  titleEn: string | null
  fabricType: string | null
  gsm: number | null
  widthCm: number | null
  priceUsd: string | null
  moq: number | null
  supplierName: string
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
  /** Optional engagement score (0–100); used for home card rating when set */
  socialScore?: number | null
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
  sourceUrl: string | null
  rawTitle: string | null
  rawDescription: string | null
  aiConfidenceScore: string | null
  aiProcessedAt: string | null
  isFeatured: boolean
  socialScore: number | null
  viewsCount: number
  composition: Array<{ material: string; percentage: number }> | null
  images: string[]
  /** AI-generated video URL (completed) */
  videoUrl: string | null
  /** Thumbnail URL for the AI-generated video */
  videoThumbnailUrl: string | null
  supplier: {
    id: number
    name: string
    slug: string
    verified: boolean
    country: string
    city: string | null
    province: string | null
    logoUrl: string | null
  }
}

export interface PaginatedResult<T> {
  items: T[]
  total: number
  /** Distinct suppliers matching the same filters as `items` (catalog search). */
  supplierCount?: number
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


