import { BLOG_FALLBACK_HERO, BLOG_LOOM_IMAGES } from '@/constants/blog.constants'

/** AIDA / temporary Google CDN links expire and break `next/image` upstream fetch. */
const EXPIRED_HOST_SUBSTR = 'lh3.googleusercontent.com'

/**
 * Returns a URL safe for `next/image`. Replaces known-broken AIDA links with local fallbacks.
 */
export function safeBlogImageUrl(url: string | null | undefined): string {
  const trimmed = url?.trim() ?? ''
  if (!trimmed || trimmed.includes(EXPIRED_HOST_SUBSTR)) {
    return BLOG_FALLBACK_HERO
  }
  return trimmed
}

/**
 * Same as {@link safeBlogImageUrl} but varies card thumbnails so a listing does not repeat one asset.
 */
export function safeBlogCardImageUrl(url: string | null | undefined, salt: number): string {
  const trimmed = url?.trim() ?? ''
  if (!trimmed || trimmed.includes(EXPIRED_HOST_SUBSTR)) {
    const grid = BLOG_LOOM_IMAGES.grid
    const idx = Math.abs(salt) % grid.length
    return grid[idx] ?? BLOG_FALLBACK_HERO
  }
  return trimmed
}
