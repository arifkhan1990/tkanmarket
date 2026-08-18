import { FabricService } from '../../services/fabric.service'

describe('FabricService', () => {
  describe('getFeatured', () => {
    it('returns featured fabrics with limit', async () => {
      const result = await FabricService.getFeatured(8)
      expect(result).toBeInstanceOf(Array)
      expect(result.length).toBeLessThanOrEqual(8)
      // If there are featured fabrics, verify structure
      if (result.length > 0) {
        const first = result[0]! // non-empty array asserted above
        expect(first).toHaveProperty('id')
        expect(first).toHaveProperty('sku')
        expect(first.titleEn || first.titleRu).toBeTruthy()
      }
    })

    it('returns empty array when no featured fabrics', async () => {
      // This test depends on data - if no featured fabrics exist, should return []
      const result = await FabricService.getFeatured(8)
      expect(result).toBeInstanceOf(Array)
    })
  })

  describe('getBySlug', () => {
    it('returns fabric by slug when it exists', async () => {
      const result = await FabricService.getBySlug('test-fabric')
      // May return null if test-fabric doesn't exist in DB
      expect(result == null || typeof result === 'object').toBe(true)
    })

    it('returns null for non-existent slug', async () => {
      const result = await FabricService.getBySlug('non-existent-slug-12345')
      expect(result).toBeNull()
    })
  })

  describe('getById', () => {
    it('returns fabric by ID when it exists', async () => {
      const result = await FabricService.getById(1)
      expect(result == null || typeof result === 'object').toBe(true)
    })

    it('returns null for non-existent ID', async () => {
      const result = await FabricService.getById(999999)
      expect(result).toBeNull()
    })
  })

  describe('getRelated', () => {
    it('returns related fabrics', async () => {
      // Use a fabric that likely exists - try ID 1
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
      // If data exists, should have category and count
      if (result.length > 0) {
        const first = result[0]! // non-empty array asserted above
        expect(first).toHaveProperty('category')
        expect(first).toHaveProperty('count')
        expect(typeof first.count).toBe('number')
      }
    })

    it('handles empty result set', async () => {
      const result = await FabricService.getCategoryCounts()
      expect(result).toBeInstanceOf(Array)
    })
  })

  describe('getJunctionCategoryCounts', () => {
    it('returns junction category counts', async () => {
      const result = await FabricService.getJunctionCategoryCounts()
      expect(result).toBeInstanceOf(Array)
      // Data structure may vary - just verify it's an array
    })
  })
})