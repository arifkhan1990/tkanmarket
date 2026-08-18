import { CommissionRulesService, formatUsd } from '@/services/commission-rules.service'

describe('Commission Rules Service', () => {
  describe('formatUsd', () => {
    it('formats small numbers', () => {
      expect(formatUsd(0)).toBe('$0')
      expect(formatUsd(500)).toBe('$500')
      expect(formatUsd(1234)).toBe('$1,234')
    })

    it('formats millions', () => {
      expect(formatUsd(1_000_000)).toBe('$1.00M')
      expect(formatUsd(1_500_000)).toBe('$1.50M')
      expect(formatUsd(999_999)).toBe('$1000K')
    })

    it('formats zero and negative', () => {
      expect(formatUsd(-100)).toBe('$0')
      expect(formatUsd(0.01)).toBe('$0')
    })
  })

  describe('getDashboard', () => {
    it('returns dashboard with expected structure', async () => {
      const result = await CommissionRulesService.getDashboard()
      expect(result.rules).toBeInstanceOf(Array)
      expect(result.projections).toBeDefined()
      expect(result.projections.monthlyGrossUsdLabel).toBeDefined()
      expect(result.projections.effectiveRatePercentLabel).toBeDefined()
      expect(result.projections.platformFeesUsdLabel).toBeDefined()
      expect(result.projections.changePercentLabel).toBeDefined()
    })

    it('has projections with formatted labels', async () => {
      const result = await CommissionRulesService.getDashboard()
      expect(result.projections.monthlyGrossUsdLabel).toMatch(/^\$/)
      expect(result.projections.effectiveRatePercentLabel).toMatch(/\d+\.\d{2}%/)
      expect(result.projections.platformFeesUsdLabel).toMatch(/^\$/)
      expect(result.projections.changePercentLabel).toMatch(/^[+-]?\d+\.?\d*%/)
    })
  })
})