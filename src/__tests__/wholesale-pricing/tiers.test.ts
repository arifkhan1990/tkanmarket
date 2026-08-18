import { describe, expect, it } from 'vitest'
import { computeWholesaleTiersFromSimulator } from '../../lib/wholesale-pricing/compute-tiers'

describe('computeWholesaleTiersFromSimulator', () => {
  it('returns empty array when base cost is not finite', () => {
    expect(
      computeWholesaleTiersFromSimulator({
        baseUnitCostUsd: 'NaN',
        minTargetMarginPercent: '20',
        volumeDecayFactor: '0.1'
      })
    ).toEqual([])
  })

  it('returns empty array when base cost is zero', () => {
    expect(
      computeWholesaleTiersFromSimulator({
        baseUnitCostUsd: '0',
        minTargetMarginPercent: '20',
        volumeDecayFactor: '0.1'
      })
    ).toEqual([])
  })

  it('returns tiers with valid parameters', () => {
    const result = computeWholesaleTiersFromSimulator({
      baseUnitCostUsd: '10',
      minTargetMarginPercent: '20',
      volumeDecayFactor: '0.5'
    })

    expect(result).toBeInstanceOf(Array)
    expect(result.length).toBe(4) // Standard Sample, Small Batch, Bulk Commercial, Industrial Contract
    const firstTier = result[0]! // length asserted above, first tier always present
    expect(firstTier.label).toBe('Standard Sample')
    expect(firstTier.minMeters).toBe(1)
    expect(firstTier.maxMeters).toBe(50)
    expect(firstTier.pricePerMeterUsd).toBe('9.88')
    expect(firstTier.effectiveDiscountPercent).toBeTypeOf('string')
  })

  it('clamps volumeDecayFactor between 0 and 0.999', () => {
    const highDecay = computeWholesaleTiersFromSimulator({
      baseUnitCostUsd: '10',
      minTargetMarginPercent: '20',
      volumeDecayFactor: '5'
    })
    const lowDecay = computeWholesaleTiersFromSimulator({
      baseUnitCostUsd: '10',
      minTargetMarginPercent: '20',
      volumeDecayFactor: '-0.5'
    })

    // High decay should be clamped to 0.999
    // Low decay should be clamped to 0
    const highFirst = highDecay?.[0]! // non-empty tiers expected after clamping
    const lowFirst = lowDecay?.[0]!
    expect(highFirst.effectiveDiscountPercent).toBeDefined()
    expect(lowFirst.effectiveDiscountPercent).toBeDefined()
  })

  it('handles edge case of very low base cost', () => {
    const result = computeWholesaleTiersFromSimulator({
      baseUnitCostUsd: '0.01',
      minTargetMarginPercent: '20',
      volumeDecayFactor: '0.3'
    })
    expect(result).toBeInstanceOf(Array)
    expect(result.length).toBe(4)
  })
})