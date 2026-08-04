import type { NextRequest } from 'next/server'
import { z } from 'zod'

import { apiSuccess } from '@/lib/utils/api-response'
import { toApiErrorResponse } from '@/lib/api/handle-api-error'
import { requireAdminOnlySession, requireAdminSession } from '@/lib/auth/require-admin'
import { AdminSystemAlertsService } from '@/services/admin-system-alerts.service'
import type { SystemAlertsConfig } from '@/types/system-alerts.types'

export const dynamic = 'force-dynamic'

const systemAlertsConfigSchema: z.ZodType<SystemAlertsConfig> = z.object({
  triggers: z.object({
    crawlerErrorRate: z.object({
      enabled: z.boolean(),
      thresholdPer5m: z.number().int().min(100).max(2000)
    }),
    largeBulkOrder: z.object({
      enabled: z.boolean(),
      minAmountUsd: z.number().min(500).max(500000)
    }),
    failedPayout: z.object({
      enabled: z.boolean()
    }),
    databaseLatency: z.object({
      enabled: z.boolean(),
      maxP99Ms: z.number().int().min(50).max(2000)
    })
  }),
  delivery: z.object({
    slackWebhook: z.object({
      enabled: z.boolean(),
      channelLabel: z.string().max(200).nullable()
    }),
    adminDigestEmail: z.object({
      enabled: z.boolean()
    }),
    smsCritical: z.object({
      enabled: z.boolean()
    }),
    customWebhook: z.object({
      enabled: z.boolean(),
      endpointUrl: z.union([z.string().url().max(2000), z.literal(''), z.null()])
    })
  })
})

export async function GET(_req: NextRequest) {
  try {
    await requireAdminSession()
    const data = await AdminSystemAlertsService.getPayload()
    return apiSuccess(data)
  } catch (err) {
    return toApiErrorResponse(err)
  }
}

export async function PATCH(req: NextRequest) {
  try {
    await requireAdminOnlySession()
    const json: unknown = await req.json()
    const body = systemAlertsConfigSchema.parse(json)
    const normalized: SystemAlertsConfig = {
      ...body,
      delivery: {
        ...body.delivery,
        customWebhook: {
          ...body.delivery.customWebhook,
          endpointUrl:
            body.delivery.customWebhook.endpointUrl === ''
              ? null
              : body.delivery.customWebhook.endpointUrl
        }
      }
    }
    const updated = await AdminSystemAlertsService.updateConfig(normalized)
    return apiSuccess(updated)
  } catch (err) {
    return toApiErrorResponse(err)
  }
}
