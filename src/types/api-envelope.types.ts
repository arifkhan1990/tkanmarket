export interface ApiErrorBody {
  code: string
  message: string
  statusCode: number
}

export interface PaginationMeta {
  page: number
  limit: number
  total: number
  totalPages: number
}

export type ApiEnvelope<T> =
  | {
      success: true
      data: T
      meta?: PaginationMeta
    }
  | {
      success: false
      error: ApiErrorBody
    }

