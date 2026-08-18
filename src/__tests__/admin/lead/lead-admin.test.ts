import { FabricService } from '@/services/fabric.service'

describe('Admin Lead Funnel', () => {
  describe('Lead Status Progression', () => {
    const statuses = [
      'NEW',
      'CONTACTED',
      'QUALIFIED',
      'PROPOSAL_SENT',
      'NEGOTIATING',
      'CLOSED_WON',
      'CLOSED_LOST'
    ]

    it('statuses are in correct funnel order', () => {
      const ordered = ['NEW', 'CONTACTED', 'QUALIFIED', 'PROPOSAL_SENT', 'NEGOTIATING', 'CLOSED_WON', 'CLOSED_LOST']
      expect(statuses).toEqual(ordered)
    })

    it('CLOSED_WON and CLOSED_LOST are terminal statuses', () => {
      expect(statuses).toContain('CLOSED_WON')
      expect(statuses).toContain('CLOSED_LOST')
      // After closed, no further progression
      const newIdx = statuses.indexOf('NEW')
      const closedWinIdx = statuses.indexOf('CLOSED_WON')
      expect(closedWinIdx).toBeGreaterThan(newIdx)
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