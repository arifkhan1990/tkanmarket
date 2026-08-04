import { FabricService } from '@/services/fabric.service'
import type { FabricDetail } from '@/types/marketplace.types'

export async function getFabricDetailBySlugCached(slug: string): Promise<FabricDetail | null> {
  return FabricService.getBySlug(decodeURIComponent(slug))
}
