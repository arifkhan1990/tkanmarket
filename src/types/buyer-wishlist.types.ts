export interface BuyerWishlistItemRow {
  wishlistId: number
  fabricId: number
  slug: string
  titleRu: string
  sku: string | null
  imageUrl: string | null
  supplierName: string
  priceUsd: number | null
  moq: number | null
  collectionLabel: string | null
  materialSummary: string | null
}

export interface BuyerWishlistListResponse {
  items: BuyerWishlistItemRow[]
  collections: { label: string; count: number }[]
  totals: {
    itemCount: number
    estimatedValueUsd: number | null
  }
}

export interface BuyerWishlistAddPayload {
  fabricId: number
  collectionLabel?: string | null
}

export interface BuyerWishlistStatusResponse {
  inWishlist: boolean
}

export interface BuyerWishlistBatchStatusResponse {
  savedIds: number[]
}
