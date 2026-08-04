type LogLevel = 'debug' | 'info' | 'warn' | 'error'

type LogMeta = Record<string, unknown>

function isPlainObject(value: unknown): value is Record<string, unknown> {
  if (typeof value !== 'object' || value === null) return false
  const proto = Object.getPrototypeOf(value)
  return proto === Object.prototype || proto === null
}

function maskSecret(value: string): string {
  if (value.length <= 6) return '***'
  return `${value.slice(0, 2)}***${value.slice(-2)}`
}

function looksLikeEmail(value: string): boolean {
  return value.includes('@') && value.includes('.')
}

function sanitize(value: unknown): unknown {
  if (typeof value === 'string') {
    const lower = value.toLowerCase()
    if (looksLikeEmail(value)) return '[redacted_email]'
    if (lower.includes('bearer ') || lower.includes('api_key') || lower.includes('apikey') || lower.includes('secret')) return '[redacted]'
    return value
  }
  if (Array.isArray(value)) return value.map(sanitize)
  if (!isPlainObject(value)) return value

  const out: Record<string, unknown> = {}
  for (const [k, v] of Object.entries(value)) {
    const key = k.toLowerCase()
    if (key.includes('password')) {
      out[k] = '[redacted_password]'
      continue
    }
    if (key.includes('api_key') || key.includes('apikey') || key.includes('secret') || key.includes('token') || key.includes('authorization')) {
      out[k] = typeof v === 'string' ? maskSecret(v) : '[redacted]'
      continue
    }
    if (key.includes('email')) {
      out[k] = '[redacted_email]'
      continue
    }
    out[k] = sanitize(v)
  }
  return out
}

function normalizeMeta(meta: unknown): LogMeta {
  if (!meta) return {}
  if (isPlainObject(meta)) return meta
  return { meta }
}

function isDebugEnabled() {
  const v = process.env.LOG_LEVEL?.toLowerCase()
  return v === 'debug'
}

function formatDev(level: LogLevel, message: string, meta: LogMeta): void {
  const color =
    level === 'error'
      ? '\u001b[31m'
      : level === 'warn'
        ? '\u001b[33m'
        : level === 'debug'
          ? '\u001b[36m'
          : '\u001b[32m'
  const reset = '\u001b[0m'
  const prefix = `${color}[${level.toUpperCase()}]${reset}`
  const hasMeta = Object.keys(meta).length > 0
  const line = hasMeta ? `${prefix} ${message}` : `${prefix} ${message}`
  const c = globalThis.console
  if (level === 'error') {
    // In Next.js dev, `console.error` can trigger the error overlay even for intentional app logs.
    // We still render it as an error via the prefix/color, but log through `console.log`.
    c?.log?.(line, hasMeta ? meta : '')
    return
  }
  if (level === 'warn') {
    c?.warn?.(line, hasMeta ? meta : '')
    return
  }
  if (level === 'debug') {
    c?.debug?.(line, hasMeta ? meta : '')
    return
  }
  c?.log?.(line, hasMeta ? meta : '')
}

function formatProd(level: LogLevel, message: string, meta: LogMeta): void {
  const payload = {
    level,
    message,
    ...meta,
    ts: new Date().toISOString()
  }
  const out = JSON.stringify(payload)
  const c = globalThis.console
  if (level === 'error') {
    c?.error?.(out)
    return
  }
  if (level === 'warn') {
    c?.warn?.(out)
    return
  }
  if (level === 'debug') {
    c?.debug?.(out)
    return
  }
  c?.log?.(out)
}

function log(level: LogLevel, message: string, meta?: unknown): void {
  if (level === 'debug' && !isDebugEnabled()) return
  const normalized = sanitize(normalizeMeta(meta)) as LogMeta
  if (process.env.NODE_ENV === 'production') {
    formatProd(level, message, normalized)
    return
  }
  formatDev(level, message, normalized)
}

export const logger = {
  debug(message: string, meta?: unknown) {
    log('debug', message, meta)
  },
  info(message: string, meta?: unknown) {
    log('info', message, meta)
  },
  warn(message: string, meta?: unknown) {
    log('warn', message, meta)
  },
  error(message: string, meta?: unknown) {
    log('error', message, meta)
  }
} as const

