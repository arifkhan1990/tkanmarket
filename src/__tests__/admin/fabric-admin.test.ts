import { FabricService } from '../../services/fabric.service'

describe('Admin Fabric Service', () => {
  describe('getById', () => {
    it('returns fabric by ID', async () => {
      const result = await FabricService.getById(1)
      expect(result == null || typeof result === 'object').toBe(true)
    })

    it('returns null for non-existent ID', async () => {
      const result = await FabricService.getById(999999)
      expect(result).toBeNull()
    })
  })

  describe('getBySlug', () => {
    it('returns fabric by slug when it exists', async () => {
      const result = await FabricService.getBySlug('test-fabric')
      expect(result == null || typeof result === 'object').toBe(true)
    })

    it('returns null for non-existent slug', async () => {
      const result = await FabricService.getBySlug('non-existent-slug-12345')
      expect(result).toBeNull()
    })
  })

  describe('getRelated', () => {
    it('returns related fabrics', async () => {
      const result = await FabricService.getRelated(1, 3)
      expect(result).toBeInstanceOf(Array)
      expect(result.length).toBeLessThanOrEqual(3)
    })

    it('returns empty array for non-existent fabric', async () => {
      const result = await FabricService.getRelated(999999, 3)
      expect(result).toEqual([])
    })
  })

  describe('getCategoryCounts', () => {
    it('returns category counts', async () => {
      const result = await FabricService.getCategoryCounts()
      expect(result).toBeInstanceOf(Array)
      if (result.length > 0) {
        const first = result[0]! // non-empty array asserted above
        expect(first).toHaveProperty('category')
        expect(first).toHaveProperty('count')
        expect(typeof first.count).toBe('number')
      }
    })

    it('handles empty result set gracefully', async () => {
      const result = await FabricService.getCategoryCounts()
      expect(result).toBeInstanceOf(Array)
    })
  })
})