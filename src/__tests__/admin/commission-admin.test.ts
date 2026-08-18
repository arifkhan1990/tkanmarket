import { CommissionRulesService } from '@/services/commission-rules.service'

describe('Admin Commission Rules', () => {
  describe('getDashboard', () => {
    it('returns dashboard with all required fields', async () => {
      const result = await CommissionRulesService.getDashboard()
      expect(result.rules).toBeInstanceOf(Array)
      expect(result.projections).toBeDefined()
      expect(result.projections.monthlyGrossUsdLabel).toBeDefined()
      expect(result.projections.effectiveRatePercentLabel).toBeDefined()
      expect(result.projections.platformFeesUsdLabel).toBeDefined()
      expect(result.projections.changePercentLabel).toBeDefined()
      expect(result.projections.disclaimer).toBeDefined()
    })

    it('projections have formatted labels', async () => {
      const result = await CommissionRulesService.getDashboard()
      expect(result.projections.monthlyGrossUsdLabel).toMatch(/^\$/)
      expect(result.projections.effectiveRatePercentLabel).toMatch(/\d+\.\d{2}%/)
      expect(result.projections.platformFeesUsdLabel).toMatch(/^\$/)
      expect(result.projections.changePercentLabel).toMatch(/^[+-]?\d+\.?\d*%/)
    })
  })
})