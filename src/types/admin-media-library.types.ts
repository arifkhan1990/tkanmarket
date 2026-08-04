export type MediaLibraryStatusFilter = 'all' | 'approved' | 'draft' | 'rejected'
export type MediaLibrarySort = 'recent' | 'images_desc' | 'title_asc'
export type MediaLibraryMediaType = 'ai_image' | 'ai_video' | null

export interface MediaLibraryItem {
  id: number
  key: string
  title: string
  images: string[]
  videos?: string[]
  primaryImage: string | null
  imageCount: number
  status: string
  supplierName: string | null
  categorySlugs: string[]
  updatedAt: string
  // AI-generated media fields
  type?: 'ai_image' | 'ai_video' | null
  mediaType?: string | null
  thumbnailUrl?: string | null
  prompt?: string | null
  provider?: string | null
  providerModel?: string | null
  fileSizeBytes?: number | null
  durationSeconds?: number | null
  errorMessage?: string | null
  adminReviewedAt?: string | null
  adminReviewerId?: number | null
  adminReviewNotes?: string | null
  metadata?: Record<string, unknown> | null
  /** Generation lifecycle status: PENDING | PROCESSING | COMPLETED | FAILED | SUPERSEDED. */
  mediaStatus?: string | null
  /** True when this is the newest COMPLETED version for its scope. */
  isCurrentVersion?: boolean | null
  /** Media id of the version that replaced this one (lineage). */
  supersededByMediaId?: number | null
  /** Number of versions kept for the same scope (1 = only the current one is kept). */
  versionCount?: number | null
}

export interface MediaLibraryFolder {
  slug: string
  label: string
  count: number
}

export interface MediaLibraryStats {
  /** Approved fabrics with at least one image. */
  approvedCount: number
  /** Non-approved (draft / ai_processed / raw_scraped / rejected) with images. */
  draftCount: number
  /** All non-deleted fabrics with images, regardless of status. */
  totalWithImages: number
  /** Total image cardinality across all rows in `totalWithImages`. */
  totalImages: number
}

export interface MediaLibraryResponse {
  items: MediaLibraryItem[]
  folders: MediaLibraryFolder[]
  stats: MediaLibraryStats
  meta: {
    page: number
    limit: number
    total: number
    totalPages: number
  }
  generatedAt: string
}
