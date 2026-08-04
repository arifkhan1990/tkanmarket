import { NextResponse } from 'next/server'

// ============================================================
// Response Types
// ============================================================

export interface PaginationMeta {
  page:       number
  limit:      number
  total:      number
  totalPages: number
}

export interface ApiSuccessResponse<T> {
  success: true
  data:    T
  meta?:   PaginationMeta
}

export interface ApiErrorResponse {
  success: false
  error: {
    code:       string
    message:    string
    statusCode: number
  }
}

export type ApiResponse<T> = ApiSuccessResponse<T> | ApiErrorResponse

export interface PaginatedResult<T> {
  items:      T[]
  total:      number
  page:       number
  limit:      number
  totalPages: number
}

// ============================================================
// Response Helpers
// ============================================================

export function apiSuccess<T>(
  data: T,
  meta?: PaginationMeta,
  statusCode = 200,
): NextResponse<ApiSuccessResponse<T>> {
  return NextResponse.json(
    { success: true, data, ...(meta && { meta }) },
    { status: statusCode },
  )
}

export function apiCreated<T>(data: T): NextResponse<ApiSuccessResponse<T>> {
  return apiSuccess(data, undefined, 201)
}

export function apiError(
  code: string,
  message: string,
  statusCode: number,
): NextResponse<ApiErrorResponse> {
  return NextResponse.json(
    { success: false, error: { code, message, statusCode } },
    { status: statusCode },
  )
}

export function withPagination<T>(
  items: T[],
  total: number,
  page: number,
  limit: number,
): PaginatedResult<T> {
  return {
    items,
    total,
    page,
    limit,
    totalPages: Math.ceil(total / limit),
  }
}

export function buildPaginationMeta(
  total: number,
  page: number,
  limit: number,
): PaginationMeta {
  return {
    page,
    limit,
    total,
    totalPages: Math.ceil(total / limit),
  }
}
