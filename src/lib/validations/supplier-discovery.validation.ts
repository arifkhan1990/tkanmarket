import { z } from 'zod'

import { DEFAULT_SUPPLIER_DISCOVERY_CRITERIA } from '@/types/supplier-discovery.types'

export const SupplierDiscoverySourceSchema = z.enum(['alibaba', '1688', 'made_in_china'])

const SupplierDiscoveryCriteriaFieldsSchema = z.object({
  minYearsExperience: z.number().int().min(0).max(100).optional(),
  minCatalogSize: z.number().int().min(0).max(1_000_000).optional(),
  maxMoqMeters: z.number().int().min(1).max(100_000).optional(),
  minProductPhotos: z.number().int().min(0).max(50).optional(),
  minPhotoQualityScore: z.number().min(0).max(100).optional()
})

export const SupplierDiscoveryCriteriaSchema = SupplierDiscoveryCriteriaFieldsSchema.optional()

export const CreateSupplierDiscoveryRunSchema = z.object({
  sources: z.array(SupplierDiscoverySourceSchema).min(1).max(10),
  keywords: z.array(z.string().trim().min(1)).min(1).max(25),
  max_suppliers: z.number().int().min(1).max(500).optional(),
  max_products_per_supplier: z.number().int().min(1).max(100).optional(),
  criteria: SupplierDiscoveryCriteriaSchema
})

export function mergeSupplierDiscoveryCriteria(
  partial: z.infer<typeof SupplierDiscoveryCriteriaFieldsSchema> | undefined
): typeof DEFAULT_SUPPLIER_DISCOVERY_CRITERIA {
  const p = partial ?? {}
  return {
    minYearsExperience: p.minYearsExperience ?? DEFAULT_SUPPLIER_DISCOVERY_CRITERIA.minYearsExperience,
    minCatalogSize: p.minCatalogSize ?? DEFAULT_SUPPLIER_DISCOVERY_CRITERIA.minCatalogSize,
    maxMoqMeters: p.maxMoqMeters ?? DEFAULT_SUPPLIER_DISCOVERY_CRITERIA.maxMoqMeters,
    minProductPhotos: p.minProductPhotos ?? DEFAULT_SUPPLIER_DISCOVERY_CRITERIA.minProductPhotos,
    minPhotoQualityScore: p.minPhotoQualityScore ?? DEFAULT_SUPPLIER_DISCOVERY_CRITERIA.minPhotoQualityScore
  }
}

export const SupplierDiscoveryRunsQuerySchema = z.object({
  page: z.coerce.number().int().min(1).default(1),
  limit: z.coerce.number().int().min(1).max(100).default(24)
})

export const SupplierDiscoveryRunSuppliersQuerySchema = z.object({
  page: z.coerce.number().int().min(1).default(1),
  limit: z.coerce.number().int().min(1).max(100).default(24),
  qualified: z.enum(['true', 'false']).optional(),
  status: z.enum(['NEW', 'REVIEW_NEEDED', 'APPROVED_FOR_INGEST', 'REJECTED']).optional(),
  source: SupplierDiscoverySourceSchema.optional()
})

export const SupplierDiscoveryRunProductsQuerySchema = z.object({
  page: z.coerce.number().int().min(1).default(1),
  limit: z.coerce.number().int().min(1).max(100).default(24),
  status: z.enum(['NEW', 'READY', 'NEEDS_REVIEW', 'REJECTED']).optional()
})

export const PatchSupplierDraftSchema = z.object({
  name: z.string().trim().min(1).max(500).nullable().optional(),
  website_url: z.string().url().max(2000).nullable().optional(),
  logo_url: z.string().url().max(2000).nullable().optional(),
  established_year: z.number().int().min(1800).max(2100).nullable().optional(),
  city: z.string().trim().max(120).nullable().optional(),
  province: z.string().trim().max(120).nullable().optional(),
  country: z.string().trim().max(120).nullable().optional(),
  status: z.enum(['NEW', 'REVIEW_NEEDED', 'APPROVED_FOR_INGEST', 'REJECTED']).optional()
})
