/**
 * Hero article from `design/blog.html` — used when the “all topics” filter is active so the
 * featured block matches the stitch prototype (not necessarily newest by date).
 */
export const BLOG_STITCH_FEATURED_SLUG = '2024-global-silk-standard-ethics-meets-luxury'

/**
 * Fallback blog imagery. Uses images.unsplash.com (allowed in next.config.js).
 * IDs are verified to return HTTP 200 — Unsplash/imgix may 404 removed or mistyped photos.
 * @see https://unsplash.com/license
 */
export const BLOG_FALLBACK_HERO =
  'https://images.unsplash.com/photo-1558171813-4c088753af8f?auto=format&fit=crop&w=1920&q=80'

export const BLOG_LOOM_IMAGES = {
  portraitA:
    'https://images.unsplash.com/photo-1472099645785-5658abf4ff4e?auto=format&fit=crop&w=128&h=128&q=80',
  portraitB:
    'https://images.unsplash.com/photo-1494790108377-be9c29b29330?auto=format&fit=crop&w=128&h=128&q=80',
  grid: [
    'https://images.unsplash.com/photo-1558618666-fcd25c85cd64?auto=format&fit=crop&w=800&q=80',
    'https://images.unsplash.com/photo-1582735689369-4fe89db7114c?auto=format&fit=crop&w=800&q=80',
    'https://images.unsplash.com/photo-1576566588028-4147f3842f27?auto=format&fit=crop&w=800&q=80',
    'https://images.unsplash.com/photo-1539533018447-63fcce2678e3?auto=format&fit=crop&w=800&q=80'
  ] as const
} as const
