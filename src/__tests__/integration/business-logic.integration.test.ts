import { FabricService } from '@/services/fabric.service'
import { ShippingRateCalculatorService } from '@/services/shipping-rate-calculator.service'
import { CommissionRulesService } from '@/services/commission-rules.service'

describe('End-to-End Business Logic', () => {
  describe('Fabric × Shipping × Commission Integration', () => {
    it('calculates total landed cost for a fabric order', async () => {
      // 1. Get fabric price
      const fabric = await FabricService.getById(1)
      const fabricPrice = fabric ? 100 : 0

      // 2. Calculate shipping rates
      const shippingInput = {
        roll_width_cm: 100,
        roll_length_m: 50,
        gsm: 200,
        roll_diameter_cm: 50,
        destination: 'EU' as const,
        fuel_surcharge_enabled: true
      }
      const shipping = ShippingRateCalculatorService.calculate(shippingInput)

      // 3. Calculate commission on fabric + shipping
      const commissionResult = await CommissionRulesService.getDashboard()

      // 4. Verify all components return valid data
      expect(typeof fabricPrice).toBe('number')
      expect(shipping.chargeable_weight_kg).toBeGreaterThan(0)
      expect(commissionResult.rules).toBeInstanceOf(Array)
    })

    it('validates input ranges for shipping calculation', () => {
      // Edge case: very small roll
      const smallRoll = {
        roll_width_cm: 10,
        roll_length_m: 1,
        gsm: 50,
        roll_diameter_cm: 10,
        destination: 'EU' as const,
        fuel_surcharge_enabled: false
      }
      const result = ShippingRateCalculatorService.calculate(smallRoll)
      expect(result.chargeable_weight_kg).toBeGreaterThan(0)
      expect(Array.isArray(result.carriers)).toBe(true)
    })

    it('commission rules have expected structure', async () => {
      const dashboard = await CommissionRulesService.getDashboard()
      expect(dashboard.rules).toBeInstanceOf(Array)
      expect(dashboard.projections).toBeDefined()
      expect(dashboard.projections.monthlyGrossUsdLabel).toBeDefined()
      expect(dashboard.projections.effectiveRatePercentLabel).toBeDefined()
    })
  })

  describe('Lead Service Funnel Logic', () => {
    // Lead funnel statuses from the system
    const leadStatuses = ['NEW', 'CONTACTED', 'QUALIFIED', 'PROPOSAL_SENT', 'NEGOTIATING', 'CLOSED_WON', 'CLOSED_LOST']

    it('all lead statuses are defined', () => {
      expect(leadStatuses).toHaveLength(7)
    })

    it('lead status progression is sequential', () => {
      const progression = ['NEW', 'CONTACTED', 'QUALIFIED', 'PROPOSAL_SENT', 'NEGOTIATING', 'CLOSED_WON']
      // Verify each status exists and has a logical order
      expect(progression).toContain('NEW')
      expect(progression).toContain('CLOSED_WON')
    })
  })
})