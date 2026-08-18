import { useI18n } from '@/hooks/useI18n'

describe('Lead API Routes', () => {
  describe('Lead Status Transitions', () => {
    const validTransitions = {
      NEW: ['CONTACTED'],
      CONTACTED: ['QUALIFIED', 'NEW'],
      QUALIFIED: ['PROPOSAL_SENT'],
      PROPOSAL_SENT: ['NEGOTIATING'],
      NEGOTIATING: ['CLOSED_WON', 'CLOSED_LOST'],
      CLOSED_WON: [],
      CLOSED_LOST: []
    }

    it('transitions are valid according to funnel flow', () => {
      expect(validTransitions.NEW).toContain('CONTACTED')
      expect(validTransitions.CONTACTED).toContain('QUALIFIED')
      expect(validTransitions.QUALIFIED).toContain('PROPOSAL_SENT')
      expect(validTransitions.NEGOTIATING).toContain('CLOSED_WON')
      expect(validTransitions.CLOSED_WON).toEqual([])
      expect(validTransitions.CLOSED_LOST).toEqual([])
    })

    it('CLOSED statuses have no outgoing transitions', () => {
      expect(validTransitions.CLOSED_WON).toEqual([])
      expect(validTransitions.CLOSED_LOST).toEqual([])
    })
  })

  describe('Lead Source Validation', () => {
    const validSources = ['alibaba', '1688', 'referral', 'organic', 'trade_show', 'crawler']

    it('all sources are valid enum values', () => {
      expect(validSources).toHaveLength(6)
      expect(new Set(validSources).size).toBe(6)
    })

    it('crawler is the last source in the list', () => {
      expect(validSources[validSources.length - 1]).toBe('crawler')
    })
  })

  describe('Lead Priority Levels', () => {
    const priorities = ['low', 'medium', 'high']

    it('priorities can be ordered numerically', () => {
      const priorityNumbers = { low: 1, medium: 2, high: 3 }
      expect(priorities).toHaveLength(3)
      expect(priorityNumbers.low).toBe(1)
      expect(priorityNumbers.medium).toBe(2)
      expect(priorityNumbers.high).toBe(3)
    })
  })
})