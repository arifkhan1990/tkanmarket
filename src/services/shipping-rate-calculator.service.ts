import type { ShippingRateCalculateInput } from '@/lib/validations/shipping-rate-calculator.validation'
import type {
  ShippingCarrierQuote,
  ShippingRateCalculateResult,
  ShippingRateLineItem
} from '@/types/shipping-rate-calculator.types'

const FUEL_INDEX = 0.124

function regionMultiplier(destination: ShippingRateCalculateInput['destination']): number {
  switch (destination) {
    case 'EU':
      return 1
    case 'NA':
      return 1.12
    case 'SEA':
      return 0.92
    case 'MENA':
      return 1.06
    default:
      return 1
  }
}

function roundMoney(n: number): number {
  return Math.round(n * 100) / 100
}

export class ShippingRateCalculatorService {
  /**
   * Deterministic wholesale logistics estimate for admin tooling (not a live carrier API).
   * Uses fabric GSM, roll dimensions, and assumed roll length to derive chargeable weight.
   */
  public static calculate(input: ShippingRateCalculateInput): ShippingRateCalculateResult {
    const widthM = input.roll_width_cm / 100
    const areaM2 = widthM * input.roll_length_m
    const fabricKg = (input.gsm * areaM2) / 1000

    const cylinderM3 =
      Math.PI * Math.pow(input.roll_diameter_cm / 200, 2) * (input.roll_width_cm / 100)
    const volumetricKg = cylinderM3 * 200

    const chargeableWeightKg = roundMoney(Math.max(fabricKg, volumetricKg * 0.45))
    const mult = regionMultiplier(input.destination)

    const baseFreightPerKg = 1.2
    const baseFreight = roundMoney(baseFreightPerKg * chargeableWeightKg * mult)
    const handling = roundMoney(85 * mult)
    const fuelBase = input.fuel_surcharge_enabled ? roundMoney(baseFreight * FUEL_INDEX) : 0
    const customs = roundMoney(148.04 * mult * 0.75)

    const oceanBaseLines: ShippingRateLineItem[] = [
      {
        label: 'Base freight (port-to-port)',
        unit_rate_label: `$${baseFreightPerKg.toFixed(2)} / kg`,
        quantity_label: `${chargeableWeightKg.toFixed(2)} kg`,
        amount_usd: baseFreight
      },
      {
        label: 'Regional handling',
        unit_rate_label: `$${(85 * mult).toFixed(2)} flat`,
        quantity_label: '1',
        amount_usd: handling
      },
      {
        label: `Fuel surcharge (index ${(FUEL_INDEX * 100).toFixed(1)}%)`,
        unit_rate_label: input.fuel_surcharge_enabled ? `${(FUEL_INDEX * 100).toFixed(1)}%` : '0%',
        quantity_label: '—',
        amount_usd: fuelBase
      },
      {
        label: 'Customs clearance & duty (est.)',
        unit_rate_label: 'Schedule B / HTS est.',
        quantity_label: 'Fabric rolls',
        amount_usd: customs
      }
    ]

    const oceanTotal = roundMoney(
      oceanBaseLines.reduce((s, x) => s + x.amount_usd, 0)
    )

    const dhlTotal = roundMoney(120 + chargeableWeightKg * 8.4 * mult * (input.fuel_surcharge_enabled ? 1.12 : 1))
    const fedexTotal = roundMoney(105 + chargeableWeightKg * 7.9 * mult * (input.fuel_surcharge_enabled ? 1.1 : 1))

    const carriersRaw: Omit<ShippingCarrierQuote, 'is_best_value'>[] = [
      {
        code: 'dhl_express',
        label: 'DHL',
        mode_label: 'Air express',
        total_usd: dhlTotal,
        eta_days_min: 3,
        eta_days_max: 5,
        breakdown: []
      },
      {
        code: 'fedex_priority',
        label: 'FedEx',
        mode_label: 'International priority',
        total_usd: fedexTotal,
        eta_days_min: 4,
        eta_days_max: 6,
        breakdown: []
      },
      {
        code: 'maersk_ocean',
        label: 'Maersk',
        mode_label: 'Ocean LCL',
        total_usd: oceanTotal,
        eta_days_min: 20,
        eta_days_max: 28,
        breakdown: oceanBaseLines
      }
    ]

    const minUsd = Math.min(...carriersRaw.map((c) => c.total_usd))
    const carriers: ShippingCarrierQuote[] = carriersRaw.map((c) => ({
      ...c,
      is_best_value: c.total_usd === minUsd
    }))

    const routeLabel = 'Shanghai (CNSHA) → Rotterdam (NLRTM)'

    return {
      route_label: routeLabel,
      chargeable_weight_kg: chargeableWeightKg,
      fuel_surcharge_percent: FUEL_INDEX * 100,
      carriers
    }
  }
}
