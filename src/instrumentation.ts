import type { Instrumentation } from 'next'

/** Logged once per server instance at boot (Node runtime only). */
export const register = async () => {
  if (process.env.NEXT_RUNTIME !== 'nodejs') return
  const { logger } = await import('@/lib/logger')
  logger.info('server_started', {
    nodeEnv: process.env.NODE_ENV,
    nextRuntime: process.env.NEXT_RUNTIME
  })
}

/**
 * Captures unhandled server errors (Server Components, Route Handlers, Server
 * Actions, Proxy) so they surface as structured, greppable log lines in prod.
 * Never throws — observability must not break request handling.
 */
export const onRequestError: Instrumentation.onRequestError = async (err, request, context) => {
  if (process.env.NEXT_RUNTIME !== 'nodejs') return

  const message = err instanceof Error ? err.message : String(err)
  const digest =
    typeof err === 'object' && err !== null && 'digest' in err ? String(err.digest) : undefined

  const { logger } = await import('@/lib/logger')
  logger.error('request_error', {
    message,
    digest,
    routePath: context.routePath,
    routeType: context.routeType,
    path: request.path,
    method: request.method
  })
}