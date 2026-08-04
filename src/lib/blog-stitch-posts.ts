/**
 * Single source for `design/blog.html` article data — used when `blog_posts` is empty or as a
 * fallback when resolving `/blog/[slug]` (so detail pages always work without DB seed).
 */
import { BLOG_FALLBACK_HERO, BLOG_LOOM_IMAGES, BLOG_STITCH_FEATURED_SLUG } from '../constants/blog.constants'
import type { BlogPostDetail, BlogPostSummary } from '../types/blog.types'

const GRID = BLOG_LOOM_IMAGES.grid

export type StitchBlogPostDefinition = {
  slug: string
  title: string
  excerpt: string
  heroImageUrl: string
  category: string
  readMinutes: number
  authorName: string
  authorRole: string | null
  body: string
  createdAtIso: string
}

/** Stable synthetic PK for client keys when no DB row exists. */
export function stitchSyntheticId(slug: string): number {
  let h = 2166136261
  for (let i = 0; i < slug.length; i++) {
    h ^= slug.charCodeAt(i)
    h = Math.imul(h, 16777619)
  }
  const n = Math.abs(h) % 2_000_000_000
  return n === 0 ? -1 : -n
}

export const STITCH_BLOG_POST_DEFINITIONS: readonly StitchBlogPostDefinition[] = [
  {
    slug: BLOG_STITCH_FEATURED_SLUG,
    title: 'The 2024 Global Silk Standard: Ethics Meets Luxury',
    excerpt:
      'An in-depth look at how next-generation sourcing is redefining premium textiles for European fashion houses through sustainable laboratory testing.',
    heroImageUrl: BLOG_FALLBACK_HERO,
    category: 'Market Trends',
    readMinutes: 12,
    authorName: 'TkanMarket Editorial',
    authorRole: 'Textile insights',
    body: [
      'The 2024 Global Silk Standard brings together traceability, animal welfare, and dye chemistry in one framework buyers can audit end to end.',
      'This article summarizes how European fashion houses are adopting the standard in procurement RFPs, and what it means for mills in China and Central Asia.',
      'We also cover laboratory testing timelines, documentation packs for customs, and how to align MOQs with certified lots.'
    ].join('\n\n'),
    createdAtIso: '2024-03-01T12:00:00.000Z'
  },
  {
    slug: 'navigating-bulk-procurement-south-east-asia',
    title: 'Navigating Bulk Procurement in South East Asia',
    excerpt:
      'How current supply chain shifts are impacting the price of premium cotton and high-performance synthetics.',
    heroImageUrl: GRID[0],
    category: 'Sourcing',
    readMinutes: 8,
    authorName: 'Adrian Vance',
    authorRole: null,
    body: [
      'Buyers are rebalancing volume across Vietnam, Indonesia, and Bangladesh as lead times and duty treatments evolve.',
      'We walk through RFQ structure, payment terms that factories accept today, and how to hedge currency on long runs of premium cotton.',
      'High-performance synthetics are seeing MOQ compression — we include a checklist for spec sheets and lab dips.'
    ].join('\n\n'),
    createdAtIso: '2024-05-14T12:00:00.000Z'
  },
  {
    slug: 'mycelium-leather-alternatives-rise',
    title: 'The Rise of Mycelium: Leather Alternatives',
    excerpt:
      'Technical breakthroughs in bio-fabricated materials are creating a new luxury standard for eco-conscious brands.',
    heroImageUrl: GRID[1],
    category: 'Sustainable Labs',
    readMinutes: 9,
    authorName: 'Elena Rossi',
    authorRole: null,
    body: [
      'Mycelium-based materials are moving from pilot lines to repeatable batches with measurable tensile and abrasion performance.',
      'This overview compares suppliers on curing time, substrate options, and how brands position pricing next to animal leather.',
      'We include questions to ask your lab partner before you cut production samples.'
    ].join('\n\n'),
    createdAtIso: '2024-05-10T12:00:00.000Z'
  },
  {
    slug: 'real-time-tracking-fabric-logistics-2',
    title: 'Real-Time Tracking: Fabric Logistics 2.0',
    excerpt:
      'Integrating IoT sensors within fabric rolls to ensure temperature and humidity control during global transit.',
    heroImageUrl: GRID[2],
    category: 'Logistics',
    readMinutes: 7,
    authorName: 'Marcus Cheng',
    authorRole: null,
    body: [
      'Roll-level telemetry is reducing claims for moisture and heat damage on ocean and rail legs.',
      'We map device types, data APIs, and how to reconcile events with warehouse receiving in your TMS.',
      'A short ROI model helps ops teams justify pilots on high-value coated fabrics.'
    ].join('\n\n'),
    createdAtIso: '2024-05-02T12:00:00.000Z'
  }
]

function definitionToSummary(d: StitchBlogPostDefinition): BlogPostSummary {
  return {
    id: stitchSyntheticId(d.slug),
    slug: d.slug,
    title: d.title,
    excerpt: d.excerpt,
    heroImageUrl: d.heroImageUrl,
    category: d.category,
    readMinutes: d.readMinutes,
    authorName: d.authorName,
    createdAt: d.createdAtIso
  }
}

/** Sorted newest first (matches typical listing). */
export function getAllStitchBlogSummaries(): BlogPostSummary[] {
  return [...STITCH_BLOG_POST_DEFINITIONS.map(definitionToSummary)].sort(
    (a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime()
  )
}

export function getStitchBlogPostDetailBySlug(slug: string): BlogPostDetail | null {
  const d = STITCH_BLOG_POST_DEFINITIONS.find((x) => x.slug === slug)
  if (!d) return null
  const summary = definitionToSummary(d)
  return {
    ...summary,
    body: d.body,
    authorRole: d.authorRole
  }
}
