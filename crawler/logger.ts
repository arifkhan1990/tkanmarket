// ============================================================
// TkanMarket – Structured Logger
// JSON output in production, formatted in development
// NEVER log: emails, passwords, API keys, phone numbers
// ============================================================

type LogLevel = 'debug' | 'info' | 'warn' | 'error'

interface LogContext {
  [key: string]: unknown
}

const SENSITIVE_KEYS = ['password', 'token', 'secret', 'apiKey', 'api_key', 'email', 'phone']

function sanitize(context: LogContext): LogContext {
  const sanitized: LogContext = {}
  for (const [key, value] of Object.entries(context)) {
    const isSensitive = SENSITIVE_KEYS.some(k => key.toLowerCase().includes(k))
    sanitized[key] = isSensitive ? '[REDACTED]' : value
  }
  return sanitized
}

function log(level: LogLevel, message: string, context?: LogContext): void {
  const timestamp = new Date().toISOString()
  const sanitizedContext = context ? sanitize(context) : undefined

  if (process.env.NODE_ENV === 'production') {
    const entry = JSON.stringify({
      timestamp,
      level,
      message,
      ...(sanitizedContext && { context: sanitizedContext }),
    })
    if (level === 'error') {
      console.error(entry)
    } else if (level === 'warn') {
      console.warn(entry)
    } else {
      console.log(entry)
    }
  } else {
    const colors: Record<LogLevel, string> = {
      debug: '\x1b[36m', // cyan
      info:  '\x1b[32m', // green
      warn:  '\x1b[33m', // yellow
      error: '\x1b[31m', // red
    }
    const reset = '\x1b[0m'
    const color = colors[level]
    const prefix = `${color}[${level.toUpperCase()}]${reset}`
    const contextStr = sanitizedContext ? ` ${JSON.stringify(sanitizedContext)}` : ''
    console.log(`${prefix} ${timestamp} ${message}${contextStr}`)
  }
}

export const logger = {
  debug: (message: string, context?: LogContext) => log('debug', message, context),
  info:  (message: string, context?: LogContext) => log('info',  message, context),
  warn:  (message: string, context?: LogContext) => log('warn',  message, context),
  error: (message: string, context?: LogContext) => log('error', message, context),
}
