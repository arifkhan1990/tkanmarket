import { DEFAULT_SUPPLIER_DISCOVERY_CRITERIA } from '@/types/supplier-discovery.types'
import type { SupplierDiscoveryCriteria } from '@/types/supplier-discovery.types'

/** Client form state for qualification thresholds (string inputs). */
export interface SupplierDiscoveryCriteriaFormState {
  minYearsExperience: string
  minCatalogSize: string
  maxMoqMeters: string
  minProductPhotos: string
  minPhotoQualityScore: string
}

export function initialSupplierDiscoveryCriteriaForm(): SupplierDiscoveryCriteriaFormState {
  const d = DEFAULT_SUPPLIER_DISCOVERY_CRITERIA
  return {
    minYearsExperience: String(d.minYearsExperience),
    minCatalogSize: String(d.minCatalogSize),
    maxMoqMeters: String(d.maxMoqMeters),
    minProductPhotos: String(d.minProductPhotos),
    minPhotoQualityScore: String(d.minPhotoQualityScore)
  }
}

function clampInt(v: number, min: number, max: number, fallback: number): number {
  if (!Number.isFinite(v)) return fallback
  return Math.min(max, Math.max(min, Math.trunc(v)))
}

function clampFloat(v: number, min: number, max: number, fallback: number): number {
  if (!Number.isFinite(v)) return fallback
  return Math.min(max, Math.max(min, v))
}

/** Maps form strings to API `criteria` payload (always sends all fields). */
export function criteriaFormToPayload(form: SupplierDiscoveryCriteriaFormState): Partial<SupplierDiscoveryCriteria> {
  const d = DEFAULT_SUPPLIER_DISCOVERY_CRITERIA
  return {
    minYearsExperience: clampInt(Number(form.minYearsExperience), 0, 100, d.minYearsExperience),
    minCatalogSize: clampInt(Number(form.minCatalogSize), 0, 1_000_000, d.minCatalogSize),
    maxMoqMeters: clampInt(Number(form.maxMoqMeters), 1, 100_000, d.maxMoqMeters),
    minProductPhotos: clampInt(Number(form.minProductPhotos), 0, 50, d.minProductPhotos),
    minPhotoQualityScore: clampFloat(Number(form.minPhotoQualityScore), 0, 100, d.minPhotoQualityScore)
  }
}
