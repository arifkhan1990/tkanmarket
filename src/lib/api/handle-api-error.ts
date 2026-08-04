import { ZodError } from 'zod'
import { AppError, ValidationError, NotFoundError, classifyAiError, isAiFailureMessage } from '@/lib/errors'
import { apiError } from '@/lib/utils/api-response'

export function toApiErrorResponse(err: unknown) {
  const isProd = process.env.NODE_ENV === 'production'

  if (err instanceof ZodError) {
    return apiError('VALIDATION_ERROR', err.issues[0]?.message ?? 'Invalid input', 400)
  }

  if (
    err instanceof Error &&
    err.message.startsWith('Failed query:') &&
    err.message.includes('"fabric_category_terms"')
  ) {
    return apiError(
      'DB_SCHEMA_OUT_OF_DATE',
      isProd
        ? 'Something went wrong'
        : 'Database schema is out of date for categories. Run `npm run db:migrate` and restart the dev server.',
      500
    )
  }

  if (err instanceof Error && err.message === 'REDIS_URL is not configured') {
    return apiError(
      'REDIS_NOT_CONFIGURED',
      isProd
        ? 'Queue system is temporarily unavailable'
        : 'Queue system is unavailable: set REDIS_URL in your .env and restart the dev server',
      503
    )
  }

  if (err instanceof ValidationError) {
    return apiError(err.code, err.message, err.statusCode)
  }

  if (err instanceof NotFoundError) {
    return apiError(err.code, err.message, err.statusCode)
  }

  if (err instanceof AppError) {
    return apiError(err.code, err.message, err.statusCode)
  }

  if (err instanceof Error) {
    if (isAiFailureMessage(err.message)) {
      const ai = classifyAiError(err)
      return apiError(ai.code, ai.message, ai.statusCode)
    }
    return apiError('INTERNAL_ERROR', isProd ? 'Something went wrong' : err.message, 500)
  }

  return apiError('INTERNAL_ERROR', 'Something went wrong', 500)
}

