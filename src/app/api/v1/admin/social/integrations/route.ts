import type { NextRequest } from 'next/server'

import { apiSuccess } from '@/lib/utils/api-response'
import { toApiErrorResponse } from '@/lib/api/handle-api-error'
import { requireAdminSession } from '@/lib/auth/require-admin'
import { SocialCredentialsService } from '@/services/social-credentials.service'
import { ListIntegrationsQuerySchema } from '@/lib/validations/social.validation'

export async function GET(req: NextRequest) {
  try {
    await requireAdminSession()
    const url = new URL(req.url)
    const query = ListIntegrationsQuerySchema.parse({
      platform: url.searchParams.get('platform') ?? undefined,
      include_inactive: url.searchParams.get('include_inactive') ?? undefined
    })
    const items = await SocialCredentialsService.list({
      platform: query.platform,
      includeInactive: query.include_inactive ?? false
    })
    return apiSuccess({ items })
  } catch (err) {
    return toApiErrorResponse(err)
  }
}
