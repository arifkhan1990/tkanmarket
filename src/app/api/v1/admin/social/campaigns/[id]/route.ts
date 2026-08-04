import type { NextRequest } from 'next/server'
import { z } from 'zod'

import { apiSuccess } from '@/lib/utils/api-response'
import { toApiErrorResponse } from '@/lib/api/handle-api-error'
import { requireAdminSession } from '@/lib/auth/require-admin'
import { SocialCampaignService } from '@/services/social-campaign.service'
import { UpdateCampaignSchema } from '@/lib/validations/social.validation'

const ParamsSchema = z.object({ id: z.coerce.number().int().positive() })

export async function PATCH(
  req: NextRequest,
  context: { params: Promise<{ id: string }> }
) {
  try {
    await requireAdminSession()
    const { id } = ParamsSchema.parse(await context.params)
    const body = await req.json()
    const parsed = UpdateCampaignSchema.parse(body)
    await SocialCampaignService.update(id, {
      name: parsed.name,
      description: parsed.description,
      status: parsed.status,
      startsAt: parsed.starts_at === undefined ? undefined : parsed.starts_at ? new Date(parsed.starts_at) : null,
      endsAt: parsed.ends_at === undefined ? undefined : parsed.ends_at ? new Date(parsed.ends_at) : null
    })
    return apiSuccess({ id, updated: true })
  } catch (err) {
    return toApiErrorResponse(err)
  }
}

export async function DELETE(
  _req: NextRequest,
  context: { params: Promise<{ id: string }> }
) {
  try {
    await requireAdminSession()
    const { id } = ParamsSchema.parse(await context.params)
    await SocialCampaignService.softDelete(id)
    return apiSuccess({ id, deleted: true })
  } catch (err) {
    return toApiErrorResponse(err)
  }
}
