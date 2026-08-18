import { FabricService } from '@/services/fabric.service'

describe('Lead Status Transitions', () => {
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
    const expectedOrder = ['NEW', 'CONTACTED', 'QUALIFIED', 'PROPOSAL_SENT', 'NEGOTIATING', 'CLOSED_WON', 'CLOSED_LOST']
    expect(statuses).toEqual(expectedOrder)
  })

  it('CLOSED statuses are terminal', () => {
    expect(statuses).toContain('CLOSED_WON')
    expect(statuses).toContain('CLOSED_LOST')
    // After closed, no further progression
    const newIdx = statuses.indexOf('NEW')
    const closedWinIdx = statuses.indexOf('CLOSED_WON')
    const closedLostIdx = statuses.indexOf('CLOSED_LOST')
    expect(closedWinIdx).toBeGreaterThan(newIdx)
    expect(closedLostIdx).toBeGreaterThan(newIdx)
  })
})