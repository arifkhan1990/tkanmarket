import { NextResponse } from 'next/server'
import type { NextRequest } from 'next/server'
import { eq } from 'drizzle-orm'

import { getDb } from '@/db'
import { socialPosts } from '@/db/schema/social.schema'
import { logger } from '@/lib/logger'
import { enqueueSocialAnalyticsSync } from '@/lib/queue/helpers'
import { verifyMetaSignature } from '@/lib/social/verify-webhook'

export async function GET(req: NextRequest) {
  const url = new URL(req.url)
  const mode = url.searchParams.get('hub.mode')
  const challenge = url.searchParams.get('hub.challenge')
  const verifyToken = url.searchParams.get('hub.verify_token')
  const expected = process.env.FACEBOOK_WEBHOOK_VERIFY_TOKEN
  if (mode === 'subscribe' && challenge && expected && verifyToken === expected) {
    return new NextResponse(challenge, { status: 200 })
  }
  return new NextResponse('forbidden', { status: 403 })
}

export async function POST(req: NextRequest) {
  try {
    const rawBody = await req.text()
    const appSecret = process.env.FACEBOOK_CLIENT_SECRET ?? ''
    const signature = req.headers.get('x-hub-signature-256')
    if (!verifyMetaSignature({ rawBody, header: signature, appSecret })) {
      return new NextResponse('invalid_signature', { status: 401 })
    }
    const body = JSON.parse(rawBody) as { entry?: Array<{ changes?: Array<{ value?: { post_id?: string } }> }> }
    const postIds = new Set<string>()
    for (const entry of body.entry ?? []) {
      for (const change of entry.changes ?? []) {
        const pid = change.value?.post_id
        if (typeof pid === 'string') postIds.add(pid)
      }
    }
    const db = getDb()
    for (const pid of postIds) {
      const rows = await db.select({ id: socialPosts.id }).from(socialPosts).where(eq(socialPosts.platformPostId, pid)).limit(1)
      const row = rows[0]
      if (row) await enqueueSocialAnalyticsSync(row.id)
    }
    return NextResponse.json({ ok: true, enqueued: postIds.size })
  } catch (err) {
    logger.error('Facebook webhook failed', { message: err instanceof Error ? err.message : String(err) })
    return NextResponse.json({ ok: false }, { status: 500 })
  }
}
