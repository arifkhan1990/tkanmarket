export class AppError extends Error {
  readonly code: string
  readonly statusCode: number

  constructor(message: string, code: string, statusCode: number) {
    super(message)
    this.name = new.target.name
    this.code = code
    this.statusCode = statusCode
  }
}

export class NotFoundError extends AppError {
  constructor(message = 'Resource not found') {
    super(message, 'NOT_FOUND', 404)
  }
}

export class ValidationError extends AppError {
  constructor(message = 'Validation failed') {
    super(message, 'VALIDATION_ERROR', 400)
  }
}

export class AuthError extends AppError {
  constructor(message = 'Unauthorized') {
    super(message, 'UNAUTHORIZED', 401)
  }
}

export class ForbiddenError extends AppError {
  constructor(message = 'Forbidden') {
    super(message, 'FORBIDDEN', 403)
  }
}

export class AiGenerationError extends AppError {
  readonly retryable: boolean

  constructor(message: string, code: string, statusCode: number, retryable: boolean) {
    super(message, code, statusCode)
    this.retryable = retryable
  }
}

export type AiErrorClassification = {
  retryable: boolean
  message: string
  code: string
  statusCode: number
}

const AI_RATE_LIMITED: AiErrorClassification = {
  retryable: true,
  code: 'AI_RATE_LIMITED',
  statusCode: 429,
  message: 'AI generation is rate-limited right now. Wait a moment and try again.'
}

const AI_TIMEOUT: AiErrorClassification = {
  retryable: true,
  code: 'AI_TIMEOUT',
  statusCode: 503,
  message: 'AI generation timed out. Try again.'
}

const AI_UNAVAILABLE: AiErrorClassification = {
  retryable: true,
  code: 'AI_UNAVAILABLE',
  statusCode: 503,
  message: 'AI service is temporarily unavailable. Try again later.'
}

const AI_BLOCKED: AiErrorClassification = {
  retryable: false,
  code: 'AI_BLOCKED',
  statusCode: 400,
  message: 'The AI blocked this request under its content policy. Adjust the input and try again.'
}

const AI_INVALID_RESPONSE: AiErrorClassification = {
  retryable: false,
  code: 'AI_INVALID_RESPONSE',
  statusCode: 500,
  message: 'The AI returned an invalid response. Try again.'
}

const AI_NOT_CONFIGURED: AiErrorClassification = {
  retryable: false,
  code: 'AI_NOT_CONFIGURED',
  statusCode: 500,
  message: 'AI service is not configured. Contact an administrator.'
}

const AI_ERROR: AiErrorClassification = {
  retryable: false,
  code: 'AI_ERROR',
  statusCode: 500,
  message: 'AI generation failed. Try again.'
}

export function classifyAiError(err: unknown): AiErrorClassification {
  if (err instanceof AiGenerationError) {
    return { retryable: err.retryable, message: err.message, code: err.code, statusCode: err.statusCode }
  }

  const raw = err instanceof Error ? err.message : String(err)
  const lower = raw.toLowerCase()

  if (lower.includes('api key') && lower.includes('not configured')) {
    return AI_NOT_CONFIGURED
  }

  if (
    lower.includes('429') ||
    lower.includes('resource_exhausted') ||
    lower.includes('rate limit') ||
    lower.includes('quota')
  ) {
    return AI_RATE_LIMITED
  }

  if (
    lower.includes('timed out') ||
    lower.includes('timeout') ||
    lower.includes('etimedout') ||
    lower.includes('aborted')
  ) {
    return AI_TIMEOUT
  }

  if (
    lower.includes('503') ||
    lower.includes('502') ||
    lower.includes('500 ') ||
    lower.includes('econnrefused') ||
    lower.includes('network') ||
    lower.includes('temporarily unavailable') ||
    lower.includes('service error')
  ) {
    return AI_UNAVAILABLE
  }

  if (
    lower.includes('safety') ||
    lower.includes('blocked') ||
    lower.includes('content policy') ||
    lower.includes('prompt block')
  ) {
    return AI_BLOCKED
  }

  if (
    lower.includes('empty content') ||
    lower.includes('no images') ||
    lower.includes('no video') ||
    lower.includes('invalid json') ||
    lower.includes('returned no')
  ) {
    return AI_INVALID_RESPONSE
  }

  return AI_ERROR
}

export function isAiFailureMessage(message: string): boolean {
  const classified = classifyAiError(new Error(message))
  if (classified.code === 'AI_ERROR') return false
  return /gemini|\bai\b/i.test(message)
}

