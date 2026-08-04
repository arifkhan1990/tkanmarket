import { clsx, type ClassValue } from 'clsx'
import { twMerge } from 'tailwind-merge'
import { PAGINATION } from '@/constants'

// ============================================================
// Tailwind class merger (used everywhere)
// ============================================================
export function cn(...inputs: ClassValue[]): string {
  return twMerge(clsx(inputs))
}

// ============================================================
// Pagination param parser
// ============================================================
export function parsePaginationParams(searchParams: URLSearchParams): {
  page:  number
  limit: number
} {
  const page  = Math.max(1, parseInt(searchParams.get('page')  ?? '1', 10))
  const limit = Math.min(
    PAGINATION.MAX_PAGE_SIZE,
    Math.max(1, parseInt(searchParams.get('limit') ?? String(PAGINATION.DEFAULT_PAGE_SIZE), 10)),
  )
  return { page, limit }
}

// ============================================================
// Slug generator
// ============================================================
export function generateSlug(text: string): string {
  return text
    .toLowerCase()
    .trim()
    .replace(/[^\w\s-]/g, '')
    .replace(/[\s_-]+/g, '-')
    .replace(/^-+|-+$/g, '')
}

// ============================================================
// Safe integer parser
// ============================================================
export function safeParseInt(value: string | null | undefined, fallback: number): number {
  if (!value) return fallback
  const parsed = parseInt(value, 10)
  return isNaN(parsed) ? fallback : parsed
}

// ============================================================
// Format price for display
// ============================================================
export function formatPrice(price: number | null, currency = 'USD'): string {
  if (price === null) return 'По запросу'
  return new Intl.NumberFormat('ru-RU', {
    style:    'currency',
    currency,
    minimumFractionDigits: 2,
  }).format(price)
}

// ============================================================
// Truncate text
// ============================================================
export function truncate(text: string, maxLength: number): string {
  if (text.length <= maxLength) return text
  return text.slice(0, maxLength - 3) + '...'
}

// ============================================================
// Build URL with query params
// ============================================================
export function buildUrl(
  base: string,
  params: Record<string, string | number | boolean | null | undefined>,
): string {
  const url = new URL(base, 'http://placeholder')
  Object.entries(params).forEach(([key, value]) => {
    if (value !== null && value !== undefined && value !== '') {
      url.searchParams.set(key, String(value))
    }
  })
  return url.pathname + url.search
}

// ============================================================
// Delay (for workers / retry logic)
// ============================================================
export function delay(ms: number): Promise<void> {
  return new Promise(resolve => setTimeout(resolve, ms))
}

// ============================================================
// Safe JSON parse
// ============================================================
export function safeJsonParse<T>(json: string | null | undefined, fallback: T): T {
  if (!json) return fallback
  try {
    return JSON.parse(json) as T
  } catch {
    return fallback
  }
}
