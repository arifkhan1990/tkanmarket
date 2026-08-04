import { logger } from '@/lib/logger'

/**
 * When the database is unreachable during `next build` (e.g. CI without Postgres),
 * server components that query the DB would otherwise fail prerender. Callers pass
 * a fallback value; we log once at warn level.
 */
export async function withDbFallback<T>(context: string, run: () => Promise<T>, fallback: T): Promise<T> {
  try {
    return await run()
  } catch (err) {
    logger.warn('db.fallback', {
      context,
      message: err instanceof Error ? err.message : String(err)
    })
    return fallback
  }
}
