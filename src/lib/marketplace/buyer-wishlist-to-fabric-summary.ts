import type { BuyerWishlistItemRow } from '@/types/buyer-wishlist.types'
import type { FabricSummary } from '@/types/marketplace.types'

/** Maps API wishlist rows to {@link FabricSummary} for shared marketplace cards. */
export function buyerWishlistRowToFabricSummary(row: BuyerWishlistItemRow): FabricSummary {
  return {
    id: row.fabricId,
    slug: row.slug,
    titleRu: row.titleRu,
    titleEn: null,
    fabricType: null,
    gsm: null,
    widthCm: null,
    priceUsd: row.priceUsd != null ? row.priceUsd.toFixed(2) : null,
    moq: row.moq,
    supplierName: row.supplierName,
    imageUrl: row.imageUrl,
    tags: row.materialSummary ? [row.materialSummary] : [],
    tagsEn: null,
    color: null,
    colorEn: null,
    supplyType: null,
    supplyTypeEn: null,
    shipmentTime: null,
    shipmentTimeEn: null,
    sku: row.sku,
    socialScore: null,
    hasVideo: false,
    thumbnailUrl: null
  }
}
