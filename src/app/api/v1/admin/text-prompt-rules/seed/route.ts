import { apiSuccess } from '@/lib/utils/api-response'
import { toApiErrorResponse } from '@/lib/api/handle-api-error'
import { requireAdminSession } from '@/lib/auth/require-admin'
import { seedTextPromptRules } from '@/db/seed-text-prompt-rules'

export async function POST() {
  try {
    await requireAdminSession()
    const count = await seedTextPromptRules()
    return apiSuccess({ seeded: count })
  } catch (err) {
    return toApiErrorResponse(err)
  }
}
