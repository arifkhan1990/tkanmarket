import { createHmac, timingSafeEqual } from 'node:crypto'

import { NextResponse } from 'next/server'
import type { NextRequest } from 'next/server'
import { eq } from 'drizzle-orm'

import { getDb } from '@/db'
import { socialPosts } from '@/db/schema/social.schema'
import { logger } from '@/lib/logger'
import { enqueueSocialAnalyticsSync } from '@/lib/queue/helpers'

function verifyTikTokSignature(rawBody: string, signatureHeader: string | null, secret: string): boolean {
  if (!signatureHeader || !secret) return false
  const expected = createHmac('sha256', secret).update(rawBody, 'utf8').digest('hex')
  if (expected.length !== signatureHeader.length) return false
  try {
    return timingSafeEqual(Buffer.from(expected, 'utf8'), Buffer.from(signatureHeader, 'utf8'))
  } catch {
    return false
  }
}

export async function POST(req: NextRequest) {
  try {
    const rawBody = await req.text()
    const secret = process.env.TIKTOK_CLIENT_SECRET ?? ''
    const signature = req.headers.get('x-tt-signature') ?? req.headers.get('tt-signature')
    if (!verifyTikTokSignature(rawBody, signature, secret)) {
      return new NextResponse('invalid_signature', { status: 401 })
    }
    const body = JSON.parse(rawBody) as { event?: string; content?: { video_id?: string; publish_id?: string } }
    const id = body.content?.video_id ?? body.content?.publish_id
    if (!id) return NextResponse.json({ ok: true, matched: 0 })
    const db = getDb()
    const rows = await db.select({ id: socialPosts.id }).from(socialPosts).where(eq(socialPosts.platformPostId, id)).limit(1)
    const row = rows[0]
    if (row) {
      await enqueueSocialAnalyticsSync(row.id)
      return NextResponse.json({ ok: true, matched: 1 })
    }
    return NextResponse.json({ ok: true, matched: 0 })
  } catch (err) {
    logger.error('TikTok webhook failed', { message: err instanceof Error ? err.message : String(err) })
    return NextResponse.json({ ok: false }, { status: 500 })
  }
}
