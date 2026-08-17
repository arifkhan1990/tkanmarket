import { apiError } from '@/lib/utils/api-response'

export async function GET() {
  return apiError('NOT_FOUND', 'Not found', 404)
}