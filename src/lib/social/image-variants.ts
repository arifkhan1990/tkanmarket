import type { SocialPlatform } from '@/types/queue.types'

export interface PlatformDimension {
  width: number
  height: number
  maxBytes: number
  minWidth: number
}

/**
 * Recommended delivery dimensions per platform. Used to select pixel targets
 * when generating platform-specific URL variants through a CDN resizer.
 */
export const PLATFORM_DIMENSIONS: Record<SocialPlatform, PlatformDimension> = {
  INSTAGRAM: { width: 1080, height: 1350, maxBytes: 8 * 1024 * 1024, minWidth: 320 },
  TIKTOK: { width: 1080, height: 1920, maxBytes: 50 * 1024 * 1024, minWidth: 540 },
  PINTEREST: { width: 1000, height: 1500, maxBytes: 20 * 1024 * 1024, minWidth: 600 },
  FACEBOOK: { width: 1200, height: 1200, maxBytes: 8 * 1024 * 1024, minWidth: 600 },
  YOUTUBE: { width: 1080, height: 1920, maxBytes: 128 * 1024 * 1024, minWidth: 540 }
}

/**
 * Build a platform-specific variant URL. Resolution strategy:
 *   1. If `CDN_IMAGE_RESIZER_BASE` is set (Cloudflare Images/imgix), we wrap
 *      the source URL with transform parameters.
 *   2. Otherwise fall back to a simple `?w=` query string, which many public
 *      storage proxies honor. Callers must verify the underlying CDN supports it.
 *
 * The function never hot-loads the image; it only composes URLs so downstream
 * publishing stays stateless. Unsupported URLs are returned unchanged.
 */
export function buildPlatformVariantUrl(sourceUrl: string, platform: SocialPlatform): string {
  if (!sourceUrl || typeof sourceUrl !== 'string') return sourceUrl
  const dims = PLATFORM_DIMENSIONS[platform]
  const base = process.env.CDN_IMAGE_RESIZER_BASE
  if (base && base.length > 0) {
    const fit = platform === 'TIKTOK' || platform === 'YOUTUBE' ? 'cover' : 'contain'
    const resizer = base.endsWith('/') ? base.slice(0, -1) : base
    return `${resizer}/cdn-cgi/image/width=${dims.width},height=${dims.height},fit=${fit},quality=85/${sourceUrl}`
  }
  try {
    const url = new URL(sourceUrl)
    url.searchParams.set('w', String(dims.width))
    url.searchParams.set('h', String(dims.height))
    url.searchParams.set('q', '85')
    return url.toString()
  } catch {
    return sourceUrl
  }
}

export function buildPlatformVariantSet(sourceUrls: string[], platform: SocialPlatform): string[] {
  return sourceUrls.filter((u) => !!u).map((u) => buildPlatformVariantUrl(u, platform))
}

/**
 * Pre-compute per-platform variants for all supported platforms at once.
 * Intended to be persisted in `social_posts.platform_media_variants`.
 */
export function buildAllPlatformVariants(sourceUrls: string[]): Record<SocialPlatform, string[]> {
  return {
    INSTAGRAM: buildPlatformVariantSet(sourceUrls, 'INSTAGRAM'),
    TIKTOK: buildPlatformVariantSet(sourceUrls, 'TIKTOK'),
    PINTEREST: buildPlatformVariantSet(sourceUrls, 'PINTEREST'),
    FACEBOOK: buildPlatformVariantSet(sourceUrls, 'FACEBOOK'),
    YOUTUBE: buildPlatformVariantSet(sourceUrls, 'YOUTUBE')
  }
}
