import type { FabricQueryParams } from '@/lib/validations/fabric.validation'

export function countActiveFabricFilters(f: FabricQueryParams): number {
  let n = 0
  if ((f.material?.length ?? 0) > 0) n += f.material?.length ?? 0
  if (f.fabric_type) n += 1
  if (typeof f.gsm_min === 'number' || typeof f.gsm_max === 'number') n += 1
  if (typeof f.price_usd_min === 'number' || typeof f.price_usd_max === 'number') n += 1

  if (typeof f.width_min === 'number' || typeof f.width_max === 'number') n += 1
  else if (typeof f.width === 'number') n += 1

  if (typeof f.moq_min === 'number' || typeof f.moq_max === 'number') n += 1
  if (f.q) n += 1
  if (f.category_slug && f.category_slug.trim().length > 0) n += 1
  return n
}

