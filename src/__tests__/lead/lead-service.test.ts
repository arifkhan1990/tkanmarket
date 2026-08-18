import { formatUsd } from '../../services/commission-rules.service'
import { expect } from 'vitest'
import { computeWholesaleTiersFromSimulator } from '../../lib/wholesale-pricing/compute-tiers'

describe('Lead Service Logic', () => {
  describe('formatUsd', () => {
    it('formats across all ranges', () => {
      expect(formatUsd(0)).toBe('$0')
      expect(formatUsd(500)).toBe('$500')
      expect(formatUsd(1_234)).toBe('$1,234')
      expect(formatUsd(1_000_000)).toBe('$1.00M')
      expect(formatUsd(1_500_000)).toBe('$1.50M')
      expect(formatUsd(999_999)).toBe('$1000K')
      expect(formatUsd(-100)).toBe('$0')
      expect(formatUsd(0.01)).toBe('$0')
    })
  })

  describe('computeWholesaleTiersFromSimulator', () => {
    it('returns tiers with valid parameters', () => {
      const result = computeWholesaleTiersFromSimulator({
        baseUnitCostUsd: '10',
        minTargetMarginPercent: '20',
        volumeDecayFactor: '0.5'
      })
      expect(result).toBeInstanceOf(Array)
      expect(result.length).toBe(4)
      const firstTier = result[0]! // length asserted above, first tier always present
      expect(firstTier.label).toBe('Standard Sample')
      expect(firstTier.minMeters).toBe(1)
      expect(firstTier.maxMeters).toBe(50)
    })

    it('clamps volumeDecayFactor', () => {
      const high = computeWholesaleTiersFromSimulator({
        baseUnitCostUsd: '10',
        minTargetMarginPercent: '20',
        volumeDecayFactor: '5'
      })
      const low = computeWholesaleTiersFromSimulator({
        baseUnitCostUsd: '10',
        minTargetMarginPercent: '20',
        volumeDecayFactor: '-0.5'
      })
      const highFirst = high[0]! // non-empty tiers expected after clamping
      const lowFirst = low[0]!
      expect(highFirst.effectiveDiscountPercent?.length).toBeGreaterThan(0)
      expect(lowFirst.effectiveDiscountPercent?.length).toBeGreaterThan(0)
    })

    it('handles zero base cost', () => {
      expect(computeWholesaleTiersFromSimulator({
        baseUnitCostUsd: '0',
        minTargetMarginPercent: '20',
        volumeDecayFactor: '0.3'
      })).toEqual([])
    })

    it('handles NaN base cost', () => {
      expect(computeWholesaleTiersFromSimulator({
        baseUnitCostUsd: 'NaN',
        minTargetMarginPercent: '20',
        volumeDecayFactor: '0.3'
      })).toEqual([])
    })
  })
})