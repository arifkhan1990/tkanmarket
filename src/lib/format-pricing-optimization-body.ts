import type { PricingAnalysisOptimizationItem } from '@/types/admin-pricing-analysis.types'
import { interpolate } from '@/lib/i18n/interpolate'
import type { Messages } from '@/lib/i18n/get-messages'

type PricingOptimizationCopy = Pick<
  Messages['admin']['pricingAnalysisPage'],
  | 'optCriticalSku'
  | 'optVolatileShare'
  | 'optHighMarginSku'
  | 'optPriceDriftUp'
  | 'optPriceDriftDown'
  | 'optNoPricedFabrics'
>

export function formatPricingOptimizationBody(
  item: PricingAnalysisOptimizationItem,
  copy: PricingOptimizationCopy
): string {
  const params = item.params
  switch (item.kind) {
    case 'CRITICAL_SKU':
      return interpolate(copy.optCriticalSku, {
        sku: String(params.sku ?? ''),
        margin: String(params.margin ?? ''),
        count: String(params.count ?? '')
      })
    case 'VOLATILE_SHARE':
      return interpolate(copy.optVolatileShare, {
        percent: String(params.percent ?? ''),
        count: String(params.count ?? '')
      })
    case 'HIGH_MARGIN_SKU':
      return interpolate(copy.optHighMarginSku, {
        sku: String(params.sku ?? ''),
        margin: String(params.margin ?? '')
      })
    case 'PRICE_DRIFT_UP':
      return interpolate(copy.optPriceDriftUp, { percent: String(params.percent ?? '') })
    case 'PRICE_DRIFT_DOWN':
      return interpolate(copy.optPriceDriftDown, { percent: String(params.percent ?? '') })
    case 'NO_PRICED_FABRICS':
      return copy.optNoPricedFabrics
    default: {
      const _never: never = item.kind
      return _never
    }
  }
}
