import type { NextRequest } from 'next/server'

import { apiSuccess } from '@/lib/utils/api-response'
import { toApiErrorResponse } from '@/lib/api/handle-api-error'
import { requireAdminSession } from '@/lib/auth/require-admin'
import { SocialCampaignService } from '@/services/social-campaign.service'
import { CreateCampaignSchema } from '@/lib/validations/social.validation'
import { AuthError } from '@/lib/errors'

export async function GET() {
  try {
    await requireAdminSession()
    const items = await SocialCampaignService.list()
    return apiSuccess({ items })
  } catch (err) {
    return toApiErrorResponse(err)
  }
}

export async function POST(req: NextRequest) {
  try {
    const session = await requireAdminSession()
    const body = await req.json()
    const parsed = CreateCampaignSchema.parse(body)
    const userId = session.user.id ? Number(session.user.id) : NaN
    if (!Number.isFinite(userId)) throw new AuthError('Invalid session user id')
    const created = await SocialCampaignService.create({
      name: parsed.name,
      description: parsed.description,
      status: parsed.status,
      startsAt: parsed.starts_at ? new Date(parsed.starts_at) : null,
      endsAt: parsed.ends_at ? new Date(parsed.ends_at) : null,
      createdByUserId: userId
    })
    return apiSuccess(created, undefined, 201)
  } catch (err) {
    return toApiErrorResponse(err)
  }
}
