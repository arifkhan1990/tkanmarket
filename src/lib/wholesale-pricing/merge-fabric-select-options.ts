import type { WholesalePricingFabricListItem } from '@/types/wholesale-pricing.types'

/** Ensures the selected fabric appears in the dropdown when opened via `?fabricId=` but not on the current list page. */
export function mergeWholesaleFabricSelectOptions(
  listItems: WholesalePricingFabricListItem[],
  fabricId: number | null,
  fabricSummary: { id: number; sku: string | null; title: string; price_usd: string | null; moq: number | null } | null | undefined
): WholesalePricingFabricListItem[] {
  if (!fabricId || !fabricSummary || fabricSummary.id !== fabricId) return listItems
  if (listItems.some((r) => r.fabric_id === fabricId)) return listItems
  return [
    {
      fabric_id: fabricSummary.id,
      sku: fabricSummary.sku,
      title: fabricSummary.title,
      supplier_id: 0,
      supplier_name: '',
      price_usd: fabricSummary.price_usd,
      moq: fabricSummary.moq,
      has_profile: false
    },
    ...listItems
  ]
}
