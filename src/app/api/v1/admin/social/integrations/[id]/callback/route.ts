import { NextResponse } from 'next/server'
import type { NextRequest } from 'next/server'

import { apiSuccess } from '@/lib/utils/api-response'
import { toApiErrorResponse } from '@/lib/api/handle-api-error'
import { requireAdminSession } from '@/lib/auth/require-admin'
import { SocialCredentialsService } from '@/services/social-credentials.service'
import { OAuthCallbackSchema, SocialPlatformSchema } from '@/lib/validations/social.validation'
import { AuthError } from '@/lib/errors'

export async function GET(
  req: NextRequest,
  context: { params: Promise<{ id: string }> }
) {
  try {
    const session = await requireAdminSession()
    const { id: raw } = await context.params
    SocialPlatformSchema.parse(raw.toUpperCase())
    const url = new URL(req.url)
    const parsed = OAuthCallbackSchema.parse({
      code: url.searchParams.get('code') ?? '',
      state: url.searchParams.get('state') ?? '',
      error: url.searchParams.get('error') ?? undefined,
      error_description: url.searchParams.get('error_description') ?? undefined
    })
    if (parsed.error) {
      const redirect = new URL('/admin/social/integrations', url.origin)
      redirect.searchParams.set('error', parsed.error)
      if (parsed.error_description) redirect.searchParams.set('error_description', parsed.error_description)
      return NextResponse.redirect(redirect)
    }
    const userId = session.user.id ? Number(session.user.id) : NaN
    if (!Number.isFinite(userId)) throw new AuthError('Invalid session user id')
    await SocialCredentialsService.completeOAuth({
      state: parsed.state,
      code: parsed.code,
      actorUserId: userId
    })
    const success = new URL('/admin/social/integrations', url.origin)
    success.searchParams.set('connected', '1')
    return NextResponse.redirect(success)
  } catch (err) {
    return toApiErrorResponse(err)
  }
}

export async function POST(
  req: NextRequest,
  context: { params: Promise<{ id: string }> }
) {
  try {
    const session = await requireAdminSession()
    const { id: raw } = await context.params
    SocialPlatformSchema.parse(raw.toUpperCase())
    const body = await req.json()
    const parsed = OAuthCallbackSchema.parse(body)
    const userId = session.user.id ? Number(session.user.id) : NaN
    if (!Number.isFinite(userId)) throw new AuthError('Invalid session user id')
    const credential = await SocialCredentialsService.completeOAuth({
      state: parsed.state,
      code: parsed.code,
      actorUserId: userId
    })
    return apiSuccess({ credential })
  } catch (err) {
    return toApiErrorResponse(err)
  }
}
