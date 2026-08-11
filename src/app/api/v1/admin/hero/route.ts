import type { NextRequest } from 'next/server'
import { z } from 'zod'

import { apiSuccess } from '@/lib/utils/api-response'
import { toApiErrorResponse } from '@/lib/api/handle-api-error'
import { requireAdminSession } from '@/lib/auth/require-admin'
import { HeroSectionService } from '@/services/hero-section.service'
import { HERO_BOTTOM_CARDS_LIMIT, HERO_SLIDER_LIMIT } from '@/types/hero-section.types'

const SlideItemSchema = z.object({
  fabricId: z.number().int().positive(),
  enabled: z.boolean(),
  imageUrl: z.string().trim().max(2000).nullable()
})

const CardItemSchema = z.object({
  fabricId: z.number().int().positive(),
  imageUrl: z.string().trim().max(2000).nullable()
})

const HeroConfigBodySchema = z.object({
  mode: z.enum(['auto', 'custom']).default('auto'),
  slider: z.array(SlideItemSchema).max(HERO_SLIDER_LIMIT).default([]),
  rightCard: CardItemSchema.nullable().default(null),
  bottomCards: z.array(CardItemSchema).max(HERO_BOTTOM_CARDS_LIMIT).default([]),
  video: z
    .object({
      youtubeEmbedId: z.string().trim().max(120).nullable()
    })
    .default({ youtubeEmbedId: null })
})

export async function GET(req: NextRequest) {
  try {
    await requireAdminSession()
    const config = await HeroSectionService.getConfig()
    return apiSuccess(config)
  } catch (err) {
    return toApiErrorResponse(err)
  }
}

export async function PUT(req: NextRequest) {
  try {
    await requireAdminSession()
    const body = HeroConfigBodySchema.parse(await req.json().catch(() => ({})))
    const saved = await HeroSectionService.saveConfig(body)
    return apiSuccess(saved)
  } catch (err) {
    return toApiErrorResponse(err)
  }
}
