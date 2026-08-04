import type { NextRequest } from 'next/server'

import { apiSuccess } from '@/lib/utils/api-response'
import { toApiErrorResponse } from '@/lib/api/handle-api-error'
import { requireAdminSession } from '@/lib/auth/require-admin'
import { SocialCredentialsService } from '@/services/social-credentials.service'
import { SocialPlatformSchema } from '@/lib/validations/social.validation'
import { AuthError } from '@/lib/errors'

function resolveRedirectUri(req: NextRequest, platform: string): string {
  const envKey = `${platform}_REDIRECT_URI` as const
  const custom = process.env[envKey]
  if (custom && custom.length > 0) return custom
  const origin = req.nextUrl.origin
  return `${origin}/api/v1/admin/social/integrations/${platform.toLowerCase()}/callback`
}

export async function POST(
  req: NextRequest,
  context: { params: Promise<{ id: string }> }
) {
  try {
    const session = await requireAdminSession()
    const { id: raw } = await context.params
    const platform = SocialPlatformSchema.parse(raw.toUpperCase())
    const userId = session.user.id ? Number(session.user.id) : NaN
    if (!Number.isFinite(userId)) throw new AuthError('Invalid session user id')
    const redirectUri = resolveRedirectUri(req, platform)
    const { authorizationUrl } = await SocialCredentialsService.startOAuth({
      userId,
      platform,
      redirectUri
    })
    return apiSuccess({ authorizationUrl, platform })
  } catch (err) {
    return toApiErrorResponse(err)
  }
}
