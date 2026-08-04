import type { PaginationMeta } from '@/types/api-envelope.types'

export type SupplierDiscoverySource = 'alibaba' | '1688' | 'made_in_china'

export type SupplierDiscoveryRunStatus = 'PENDING' | 'RUNNING' | 'COMPLETED' | 'FAILED' | 'PARTIAL'

export type SupplierDiscoverySupplierDraftStatus =
  | 'NEW'
  | 'REVIEW_NEEDED'
  | 'APPROVED_FOR_INGEST'
  | 'REJECTED'

export type SupplierDiscoveryProductDraftStatus = 'NEW' | 'READY' | 'NEEDS_REVIEW' | 'REJECTED'

/**
 * Persisted in `supplier_discovery_runs.criteria_json` — qualification thresholds and flags.
 */
export interface SupplierDiscoveryCriteria {
  minYearsExperience: number
  minCatalogSize: number
  maxMoqMeters: number
  minProductPhotos: number
  minPhotoQualityScore: number
}

export const DEFAULT_SUPPLIER_DISCOVERY_CRITERIA: SupplierDiscoveryCriteria = {
  minYearsExperience: 5,
  minCatalogSize: 30,
  maxMoqMeters: 300,
  minProductPhotos: 3,
  minPhotoQualityScore: 40
}

export interface SupplierDiscoveryRunRow {
  id: number
  status: SupplierDiscoveryRunStatus
  sources: SupplierDiscoverySource[]
  criteriaJson: SupplierDiscoveryCriteria
  keywords: string[]
  maxSuppliers: number
  maxProductsPerSupplier: number
  suppliersFound: number
  suppliersQualified: number
  productsExtracted: number
  draftsReady: number
  triggeredById: number | null
  startedAt: string | null
  completedAt: string | null
  errorLog: string | null
  runNote: string | null
  createdAt: string
  updatedAt: string
}

export interface SupplierDiscoverySupplierDraftRow {
  id: number
  runId: number
  source: SupplierDiscoverySource
  supplierUrl: string
  supplierUrlHash: string
  name: string | null
  logoUrl: string | null
  websiteUrl: string | null
  establishedYear: number | null
  city: string | null
  province: string | null
  country: string | null
  yearsInBusiness: number | null
  catalogSizeEstimate: number | null
  moqMinMeters: number | null
  photosScore: string | null
  qualified: boolean
  qualificationReasons: string[] | null
  status: SupplierDiscoverySupplierDraftStatus
  createdAt: string
  updatedAt: string
}

export interface SupplierDiscoveryProductDraftRow {
  id: number
  runId: number
  discoverySupplierId: number
  productUrl: string
  urlHash: string
  rawTitle: string
  rawDescription: string | null
  rawImages: string[] | null
  priceText: string | null
  moqText: string | null
  moqMeters: number | null
  compositionText: string | null
  gsmText: string | null
  widthText: string | null
  photoCount: number
  photoQualityScore: string | null
  status: SupplierDiscoveryProductDraftStatus
  createdAt: string
  updatedAt: string
}

export interface SupplierDiscoveryRunsListResponse {
  runs: SupplierDiscoveryRunRow[]
  meta: PaginationMeta
}

export interface PatchSupplierDraftBody {
  name?: string | null
  website_url?: string | null
  logo_url?: string | null
  established_year?: number | null
  city?: string | null
  province?: string | null
  country?: string | null
  status?: SupplierDiscoverySupplierDraftStatus
}

export interface CreateSupplierDiscoveryRunBody {
  sources: SupplierDiscoverySource[]
  keywords: string[]
  max_suppliers?: number
  max_products_per_supplier?: number
  criteria?: Partial<SupplierDiscoveryCriteria>
}

/** Admin API query params for listing supplier drafts in a run. */
export interface SupplierDiscoveryRunSuppliersListFilters {
  qualified?: 'true' | 'false'
  status?: SupplierDiscoverySupplierDraftStatus
  source?: SupplierDiscoverySource
}

/** Admin API query params for listing product drafts for a supplier draft. */
export interface SupplierDiscoveryRunProductsListFilters {
  status?: SupplierDiscoveryProductDraftStatus
}
