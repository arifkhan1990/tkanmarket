/**
 * Response shape for the public navbar / hero search endpoint.
 *
 * One round-trip returns fabric matches, supplier matches, category matches and
 * the always-available trending categories. Designed to power a typeahead UI
 * without per-row follow-up requests.
 */

export interface PublicSearchFabric {
  id: number
  title: string
  slug: string
  sku: string | null
  imageUrl: string | null
  fabricType: string | null
}

export interface PublicSearchCategory {
  slug: string
  label: string
  count: number
}

export interface PublicSearchFabricType {
  value: string
  label: string
  count: number
}

export interface PublicSearchResponse {
  query: string
  fabrics: PublicSearchFabric[]
  categories: PublicSearchCategory[]
  fabricTypes: PublicSearchFabricType[]
  trending: PublicSearchCategory[]
  totals: {
    fabrics: number
    categories: number
  }
}
