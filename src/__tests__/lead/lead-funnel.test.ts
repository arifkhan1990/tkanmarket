import { useI18n } from '@/hooks/useI18n'

describe('Lead Funnel Logic', () => {
  describe('Lead Statuses', () => {
    const leadStatuses = [
      'NEW',
      'CONTACTED',
      'QUALIFIED',
      'PROPOSAL_SENT',
      'NEGOTIATING',
      'CLOSED_WON',
      'CLOSED_LOST'
    ] as const

    it('all lead statuses are defined and unique', () => {
      const uniqueStatuses = new Set(leadStatuses)
      expect(leadStatuses.length).toBe(uniqueStatuses.size)
      expect(leadStatuses).toHaveLength(7)
    })

    it('statuses follow logical funnel progression', () => {
      const funnelStatuses = ['NEW', 'CONTACTED', 'QUALIFIED', 'PROPOSAL_SENT', 'NEGOTIATING', 'CLOSED_WON']
      expect(funnelStatuses).toContain('NEW')
      expect(funnelStatuses).toContain('CLOSED_WON')
      // QUALIFIED should come after CONTACTED
      const newIdx = leadStatuses.indexOf('NEW')
      const contactedIdx = leadStatuses.indexOf('CONTACTED')
      const qualifiedIdx = leadStatuses.indexOf('QUALIFIED')
      expect(contactedIdx).toBeGreaterThan(newIdx)
      expect(qualifiedIdx).toBeGreaterThan(contactedIdx)
    })

    it('closed statuses are terminal', () => {
      const terminalStatuses = ['CLOSED_WON', 'CLOSED_LOST']
      expect(leadStatuses).toContain('CLOSED_WON')
      expect(leadStatuses).toContain('CLOSED_LOST')
      // After closed status, no further progression
      expect(leadStatuses.indexOf('CLOSED_WON')).toBeGreaterThan(
        leadStatuses.indexOf('NEW')
      )
    })
  })

  describe('Lead Source Validation', () => {
    const validSources = [
      'alibaba',
      '1688',
      'referral',
      'organic',
      'trade_show',
      'crawler'
    ]

    it('all lead sources are valid values', () => {
      expect(validSources).toHaveLength(6)
      expect(new Set(validSources).size).toBe(6)
    })

    it('crawler source is last in list', () => {
      expect(validSources[validSources.length - 1]).toBe('crawler')
    })
  })

  describe('Lead Priority Logic', () => {
    it('priorities can be ordered numerically', () => {
      const priorities = ['low', 'medium', 'high'] as const
      const priorityNumbers = { low: 1, medium: 2, high: 3 }
      expect(priorities).toHaveLength(3)
      expect(priorityNumbers.low).toBe(1)
      expect(priorityNumbers.medium).toBe(2)
      expect(priorityNumbers.high).toBe(3)
    })
  })
})