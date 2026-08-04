import type { SupplierDiscoveryCriteria } from '@/types/supplier-discovery.types'

export function parseMetersFromMoqText(moqText: string | null | undefined): number | null {
  if (!moqText) return null
  const t = moqText.toLowerCase()
  const m1 = t.match(/(\d+(?:[.,]\d+)?)\s*(m|meter|meters|metre|metres|米)\b/)
  if (m1?.[1]) {
    const n = Number(m1[1].replace(',', '.'))
    return Number.isFinite(n) ? Math.floor(n) : null
  }
  const m2 = t.match(/moq\s*[：:]\s*(\d+)\s*m\b/i)
  if (m2?.[1]) {
    const n = Number(m2[1])
    return Number.isFinite(n) ? n : null
  }
  return null
}

export interface QualifySupplierInput {
  yearsInBusiness: number | null
  establishedYear: number | null
  catalogSizeEstimate: number | null
  moqMinMeters: number | null
  photosScore: string | null
  productPhotoCounts: number[]
}

/**
 * Heuristic 0–100 from image URLs (resolution hints, count).
 */
export function scoreProductPhotos(imageUrls: string[]): { photoCount: number; photoQualityScore: string } {
  const urls = imageUrls.filter((u) => u.length >= 12)
  const photoCount = urls.length
  let bonus = 0
  for (const u of urls) {
    if (/\d{3,4}\s*x\s*\d{3,4}/i.test(u) || /750|800|1024|1280|1920/.test(u)) bonus += 4
  }
  const raw = Math.min(100, photoCount * 14 + Math.min(bonus, 36))
  return { photoCount, photoQualityScore: raw.toFixed(2) }
}

export function computeYearsInBusiness(establishedYear: number | null, currentYear: number): number | null {
  if (!establishedYear || establishedYear < 1900 || establishedYear > currentYear) return null
  return Math.max(0, currentYear - establishedYear)
}

export function qualifySupplierDraft(
  input: QualifySupplierInput,
  criteria: SupplierDiscoveryCriteria,
  currentYear: number
): { qualified: boolean; reasons: string[]; supplierStatus: 'NEW' | 'REVIEW_NEEDED' } {
  const reasons: string[] = []

  const years =
    input.yearsInBusiness ??
    (input.establishedYear ? computeYearsInBusiness(input.establishedYear, currentYear) : null)

  if (years !== null && years >= criteria.minYearsExperience) {
    reasons.push(`experience_${years}y_ok`)
  } else if (years !== null) {
    reasons.push(`experience_${years}y_below_${criteria.minYearsExperience}`)
  } else {
    reasons.push('experience_unknown')
  }

  const catalog = input.catalogSizeEstimate ?? 0
  if (catalog >= criteria.minCatalogSize) {
    reasons.push(`catalog_${catalog}_ok`)
  } else {
    reasons.push(`catalog_${catalog}_below_${criteria.minCatalogSize}`)
  }

  const moq = input.moqMinMeters
  if (moq !== null && moq <= criteria.maxMoqMeters) {
    reasons.push(`moq_${moq}m_ok`)
  } else if (moq !== null) {
    reasons.push(`moq_${moq}m_above_${criteria.maxMoqMeters}`)
  } else {
    reasons.push('moq_unknown')
  }

  const photoScoreNum = input.photosScore ? Number(input.photosScore) : 0
  const maxProductPhotos = input.productPhotoCounts.length > 0 ? Math.max(...input.productPhotoCounts) : 0

  if (photoScoreNum >= criteria.minPhotoQualityScore) {
    reasons.push(`photo_score_${photoScoreNum}_ok`)
  } else {
    reasons.push(`photo_score_${photoScoreNum}_below_${criteria.minPhotoQualityScore}`)
  }

  if (maxProductPhotos >= criteria.minProductPhotos) {
    reasons.push(`product_photos_max_${maxProductPhotos}_ok`)
  } else {
    reasons.push(`product_photos_max_${maxProductPhotos}_below_${criteria.minProductPhotos}`)
  }

  const qualified =
    years !== null &&
    years >= criteria.minYearsExperience &&
    catalog >= criteria.minCatalogSize &&
    moq !== null &&
    moq <= criteria.maxMoqMeters &&
    photoScoreNum >= criteria.minPhotoQualityScore &&
    maxProductPhotos >= criteria.minProductPhotos

  return {
    qualified,
    reasons,
    supplierStatus: qualified ? 'NEW' : 'REVIEW_NEEDED'
  }
}
