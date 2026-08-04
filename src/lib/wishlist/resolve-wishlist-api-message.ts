import type { Messages } from '@/lib/i18n/get-messages'

export type WishlistToastMessages = Messages['wishlistPage']['toasts']

export function isWishlistApiSuccess<T>(json: unknown): json is { success: true; data: T } {
  return (
    typeof json === 'object' &&
    json !== null &&
    'success' in json &&
    (json as { success: boolean }).success === true &&
    'data' in json
  )
}

/**
 * Maps known API error codes to localized copy; keeps server validation messages when appropriate.
 */
export function resolveWishlistApiMessage(
  json: unknown,
  fallback: string,
  toasts: WishlistToastMessages
): string {
  if (typeof json !== 'object' || json === null || !('success' in json)) {
    return fallback
  }
  if ((json as { success: boolean }).success === true) {
    return fallback
  }
  const err = (json as { error?: { code?: string; message?: string } }).error
  if (!err || typeof err.code !== 'string') {
    return fallback
  }
  const { code, message } = err
  switch (code) {
    case 'UNAUTHORIZED':
      return toasts.sessionRequired
    case 'FORBIDDEN':
      return toasts.forbidden
    case 'NOT_FOUND':
      return toasts.fabricUnavailable
    case 'VALIDATION_ERROR':
      // Service throws ValidationError when the per-user cap is hit; surface localized copy
      // for that specific case, but keep server message for any other validation issue.
      if (typeof message === 'string' && message.toLowerCase().includes('limit reached')) {
        return toasts.limitReached
      }
      return typeof message === 'string' && message.trim() !== '' ? message : fallback
    case 'RATE_LIMITED':
      return toasts.tooManyRequests
    case 'INTERNAL_ERROR':
      return toasts.unexpectedError
    default:
      return typeof message === 'string' && message.trim() !== '' ? message : fallback
  }
}
