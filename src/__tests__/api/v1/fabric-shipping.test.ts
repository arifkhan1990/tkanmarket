import { FabricService } from '@/services/fabric.service'
import { ShippingRateCalculatorService } from '@/services/shipping-rate-calculator.service'

describe('API v1 Business Logic', () => {
  describe('Fabric Service Integration', () => {
    it('getFeatured returns fabrics with expected structure', async () => {
      const result = await FabricService.getFeatured(5)
      expect(result).toBeInstanceOf(Array)
      if (result.length > 0) {
        const fabric = result[0]! // non-empty array asserted above
        expect(fabric).toHaveProperty('id')
        expect(fabric).toHaveProperty('sku')
        expect(fabric.titleEn || fabric.titleRu).toBeTruthy()
        expect(fabric).toHaveProperty('hasVideo')
      }
    })

    it('returns empty array for limit of 0', async () => {
      const result = await FabricService.getFeatured(0)
      expect(result).toEqual([])
    })
  })

  describe('Shipping Rate Calculator Integration', () => {
    it('calculates shipping for EU destination', () => {
      const input = {
        roll_width_cm: 100,
        roll_length_m: 50,
        gsm: 200,
        roll_diameter_cm: 50,
        destination: 'EU' as const,
        fuel_surcharge_enabled: true
      }
      const result = ShippingRateCalculatorService.calculate(input)
      expect(result).toHaveProperty('route_label')
      expect(result).toHaveProperty('chargeable_weight_kg')
      expect(result).toHaveProperty('fuel_surcharge_percent')
      expect(Array.isArray(result.carriers)).toBe(true)
      expect(result.carriers.length).toBe(3)
    })

    it('calculates shipping for NA destination with fuel surcharge disabled', () => {
      const input = {
        roll_width_cm: 100,
        roll_length_m: 50,
        gsm: 200,
        roll_diameter_cm: 50,
        destination: 'NA' as const,
        fuel_surcharge_enabled: false
      }
      const result = ShippingRateCalculatorService.calculate(input)
      // The reported percent is the fuel index regardless of the flag; the flag
      // only controls whether it is applied to carrier pricing.
      expect(result.fuel_surcharge_percent).toBe(12.4)
      expect(Array.isArray(result.carriers)).toBe(true)
    })
  })
})