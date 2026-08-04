import { NextResponse } from 'next/server'

export interface PaginationMeta {
  page: number
  limit: number
  total: number
  totalPages: number
  /** Optional: distinct supplier count for filtered fabric catalog responses. */
  supplierCount?: number
}

export type ApiResponse<T> = {
  success: true
  data: T
  meta?: PaginationMeta
}

export interface ApiErrorResponse {
  success: false
  error: {
    code: string
    message: string
    statusCode: number
  }
}

export type PaginatedResponse<T> = {
  items: T[]
  meta: PaginationMeta
}

// Backwards-compatible alias (older code may import this name)
export type ApiSuccessResponse<T> = ApiResponse<T>

export function apiSuccess<T>(data: T, meta?: PaginationMeta, statusCode: number = 200): NextResponse {
  const body: ApiResponse<T> = { success: true, data }
  if (meta) body.meta = meta
  return NextResponse.json(body, { status: statusCode })
}

export function apiError(code: string, message: string, statusCode: number): NextResponse {
  const body: ApiErrorResponse = {
    success: false,
    error: { code, message, statusCode }
  }
  return NextResponse.json(body, { status: statusCode })
}

export function withPagination<T>(items: T[], total: number, page: number, limit: number): PaginatedResponse<T> {
  const totalPages = Math.max(1, Math.ceil(total / limit))
  const meta: PaginationMeta = { page, limit, total, totalPages }
  return { items, meta }
}

