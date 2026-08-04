import {
  FABRIC_IMAGE_PLACEHOLDER_PATH,
  SUPPLIER_LOGO_PLACEHOLDER_PATH
} from '@/constants/marketplace-images'

/**
 * Returns the first non-empty image URL from a list, or the fabric placeholder.
 * Use whenever a fabric image is rendered so the UI never shows an empty box.
 */
export function resolveFabricImage(value: string | null | undefined): string {
  if (typeof value !== 'string') return FABRIC_IMAGE_PLACEHOLDER_PATH
  const trimmed = value.trim()
  return trimmed.length > 0 ? trimmed : FABRIC_IMAGE_PLACEHOLDER_PATH
}

export function resolveFabricImageFromList(
  list: ReadonlyArray<string | null | undefined> | null | undefined,
  fallbackUrl?: string | null
): string {
  if (Array.isArray(list)) {
    for (const candidate of list) {
      if (typeof candidate === 'string' && candidate.trim().length > 0) {
        return candidate.trim()
      }
    }
  }
  if (typeof fallbackUrl === 'string' && fallbackUrl.trim().length > 0) {
    return fallbackUrl.trim()
  }
  return FABRIC_IMAGE_PLACEHOLDER_PATH
}

/**
 * Returns the supplier logo URL or the supplier placeholder.
 */
export function resolveSupplierLogo(value: string | null | undefined): string {
  if (typeof value !== 'string') return SUPPLIER_LOGO_PLACEHOLDER_PATH
  const trimmed = value.trim()
  return trimmed.length > 0 ? trimmed : SUPPLIER_LOGO_PLACEHOLDER_PATH
}
