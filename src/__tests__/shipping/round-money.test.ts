import { roundMoney } from '../../services/shipping-rate-calculator.service'

describe('roundMoney', () => {
  it('rounds to 2 decimal places', () => {
    expect(roundMoney(1.234)).toBe(1.23)
    expect(roundMoney(1.235)).toBe(1.24)
    expect(roundMoney(0)).toBe(0)
    expect(roundMoney(-5.678)).toBe(-5.68)
  })

  it('handles large numbers', () => {
    expect(roundMoney(1_000_000.5)).toBe(1_000_000.5)
    expect(roundMoney(0.001)).toBe(0)
  })
})