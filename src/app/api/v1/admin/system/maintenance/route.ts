import type { NextRequest } from 'next/server'
import { z } from 'zod'

import { toApiErrorResponse } from '@/lib/api/handle-api-error'
import { requireAdminOnlySession, requireAdminSession } from '@/lib/auth/require-admin'
import { apiSuccess } from '@/lib/utils/api-response'
import { SystemConsoleService } from '@/services/admin/system-console.service'

const StepSchema = z.object({
  id: z.string(),
  label: z.string(),
  state: z.enum(['done', 'in_progress', 'pending'])
})

const UpdateSchema = z.object({
  isEnabled: z.boolean().optional(),
  headline: z.string().min(1).max(200).optional(),
  body: z.string().max(8000).optional(),
  scheduledStart: z.string().datetime().nullable().optional(),
  scheduledEnd: z.string().datetime().nullable().optional(),
  migrationProgress: z.coerce.number().int().min(0).max(100).optional(),
  migrationSteps: z.array(StepSchema).optional(),
  systemIdLabel: z.string().min(1).max(80).optional(),
  heroImageUrl: z.union([z.string().url(), z.literal('')]).nullable().optional()
})

export async function GET() {
  try {
    await requireAdminSession()
    const data = await SystemConsoleService.getMaintenance()
    return apiSuccess(data)
  } catch (err) {
    return toApiErrorResponse(err)
  }
}

export async function POST(req: NextRequest) {
  try {
    await requireAdminOnlySession()
    const body = await req.json()
    const input = UpdateSchema.parse(body)
    const updated = await SystemConsoleService.updateMaintenance(input)
    return apiSuccess(updated)
  } catch (err) {
    return toApiErrorResponse(err)
  }
}
