import type { ApiEnvelope } from '@/types/api-envelope.types'
import type { FabricTaxonomyOverview } from '@/types/admin-fabric-taxonomy.types'

export async function fetchFabricTaxonomy(categorySlug?: string): Promise<ApiEnvelope<FabricTaxonomyOverview>> {
  const sp = new URLSearchParams()
  if (categorySlug && categorySlug.length > 0) {
    sp.set('category_slug', categorySlug)
  }
  const res = await fetch(`/api/v1/admin/fabric-taxonomy?${sp.toString()}`)
  return (await res.json()) as ApiEnvelope<FabricTaxonomyOverview>
}
