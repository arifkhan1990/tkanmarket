import { resolveR2Url } from '@/lib/storage/r2'

/** Hosts that appear in scraped HTML but are not product photos (analytics, beacons). */
const FABRIC_GALLERY_IMAGE_HOST_BLOCKLIST = new Set<string>(['stat.made-in-china.com'])

/**
 * True when `url` is safe to show in fabric galleries / `next/image` (https product-style URL, not a tracker or placeholder).
 */
export function isFabricGalleryImageUrl(url: string): boolean {
  const trimmed = url.trim()
  if (!trimmed) return false

  let parsed: URL
  try {
    parsed = new URL(trimmed)
  } catch {
    return false
  }

  if (parsed.protocol !== 'https:') return false

  const host = parsed.hostname.toLowerCase()
  if (FABRIC_GALLERY_IMAGE_HOST_BLOCKLIST.has(host)) return false

  const path = parsed.pathname.toLowerCase()
  if (path.includes('/event/') && (path.includes('rec.gif') || path.endsWith('.gif'))) return false
  if (path.includes('rec.gif') && parsed.search.length > 8) return false

  if (host.includes('micstatic') && path.endsWith('/transparent.png')) return false

  return true
}

/** Ordered unique list of gallery URLs suitable for thumbnails; drops trackers and placeholders. */
export function filterFabricGalleryImageUrls(urls: string[] | null | undefined): string[] {
  if (!urls?.length) return []
  const out: string[] = []
  const seen = new Set<string>()
  for (const raw of urls) {
    const resolved = resolveR2Url(raw)
    if (!resolved || !isFabricGalleryImageUrl(resolved)) continue
    const u = resolved.trim()
    if (seen.has(u)) continue
    seen.add(u)
    out.push(u)
  }
  return out
}
