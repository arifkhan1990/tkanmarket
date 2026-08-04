import { PAGINATION } from '@/constants'

export function parsePaginationParams(searchParams: URLSearchParams): { page: number; limit: number } {
  const rawPage = searchParams.get('page')
  const rawLimit = searchParams.get('limit')

  const parsedPage = rawPage ? Number(rawPage) : 1
  const parsedLimit = rawLimit ? Number(rawLimit) : PAGINATION.DEFAULT_PAGE_SIZE

  const page = Number.isFinite(parsedPage) && parsedPage >= 1 ? Math.floor(parsedPage) : 1
  const limitBase = Number.isFinite(parsedLimit) && parsedLimit >= 1 ? Math.floor(parsedLimit) : PAGINATION.DEFAULT_PAGE_SIZE
  const limit = Math.min(limitBase, PAGINATION.MAX_PAGE_SIZE)

  return { page, limit }
}

