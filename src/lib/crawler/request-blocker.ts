import { logger } from '@/lib/logger'
import type { PageLike } from '@/lib/crawler/browser'

type RequestLike = {
  resourceType(): string
  url(): string
}

type RouteLike = {
  abort(): Promise<void>
  continue(): Promise<void>
}

type PageWithRouting = {
  route(
    url: string | RegExp,
    handler: (route: RouteLike, request: RequestLike) => Promise<void> | void
  ): Promise<void>
}

function envBool(name: string, fallback: boolean): boolean {
  const raw = process.env[name]
  if (!raw) return fallback
  const v = raw.trim().toLowerCase()
  if (['1', 'true', 'yes', 'y', 'on'].includes(v)) return true
  if (['0', 'false', 'no', 'n', 'off'].includes(v)) return false
  return fallback
}

function shouldBlockResourceType(resourceType: string): boolean {
  // defaults: block images/fonts/media to reduce bandwidth and captcha surface
  const blockImages = envBool('CRAWLER_BLOCK_IMAGES', true)
  const blockFonts = envBool('CRAWLER_BLOCK_FONTS', true)
  const blockMedia = envBool('CRAWLER_BLOCK_MEDIA', true)

  if (resourceType === 'image') return blockImages
  if (resourceType === 'font') return blockFonts
  if (resourceType === 'media') return blockMedia
  return false
}

/**
 * Best-effort request blocking to cut proxy bandwidth cost.
 * No-ops if Playwright routing APIs are unavailable.
 */
export async function installRequestBlocking(page: PageLike): Promise<void> {
  const enabled = envBool('CRAWLER_REQUEST_BLOCKING_ENABLED', true)
  if (!enabled) return

  const maybe = page as unknown as Partial<PageWithRouting>
  if (typeof maybe.route !== 'function') return

  try {
    await maybe.route('**/*', async (route, request) => {
      const rt = request.resourceType()
      if (shouldBlockResourceType(rt)) {
        await route.abort()
        return
      }
      await route.continue()
    })
  } catch (err) {
    logger.warn('Crawler request blocking failed to install', {
      message: err instanceof Error ? err.message : String(err)
    })
  }
}

