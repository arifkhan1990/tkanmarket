import { formatUsd } from '@/services/commission-rules.service'

describe('Commission Rules Format USD', () => {
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

    it('formats large numbers', () => {
      expect(formatUsd(10_000_000)).toBe('$10.00M')
      expect(formatUsd(999_999_999)).toBe('$1000.00M')
    })

    it('formats decimal values', () => {
      expect(formatUsd(12.5)).toBe('$13')
      expect(formatUsd(100.75)).toBe('$101')
    })

    it('handles non-finite input gracefully', () => {
      expect(formatUsd(NaN)).toBe('$0')
    })
  })
})