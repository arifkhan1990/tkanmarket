import type { NextRequest } from 'next/server'
import { z } from 'zod'

import { apiSuccess } from '@/lib/utils/api-response'
import { toApiErrorResponse } from '@/lib/api/handle-api-error'
import { requireAdminSession } from '@/lib/auth/require-admin'
import { TextPromptRuleService } from '@/services/admin/text-prompt-rule.service'

const CreateRuleSchema = z.object({
  name: z.string().min(1).max(200),
  description: z.string().optional(),
  priority: z.number().int().optional(),
  isActive: z.boolean().optional(),
  conditions: z.array(z.object({
    field: z.enum(['fabricType', 'color', 'gsm', 'composition', 'tag', 'supplyType']),
    operator: z.enum(['equals', 'notEquals', 'contains', 'in', 'gt', 'gte', 'lt', 'lte']),
    value: z.union([z.string(), z.number(), z.array(z.string())])
  })).optional(),
  enrichmentSystemPrompt: z.string().optional(),
  enrichmentUserTemplate: z.string().optional(),
  translationSystemPrompt: z.string().optional(),
  translationUserTemplate: z.string().optional(),
  socialSystemPrompt: z.string().optional(),
  socialUserTemplate: z.string().optional(),
  blogSystemPrompt: z.string().optional(),
  blogUserTemplate: z.string().optional()
})

export async function GET() {
  try {
    await requireAdminSession()
    const rules = await TextPromptRuleService.list()
    return apiSuccess(rules)
  } catch (err) {
    return toApiErrorResponse(err)
  }
}

export async function POST(req: NextRequest) {
  try {
    await requireAdminSession()
    const json: unknown = await req.json()
    const body = CreateRuleSchema.parse(json)
    const rule = await TextPromptRuleService.create(body)
    return apiSuccess(rule, undefined, 201)
  } catch (err) {
    return toApiErrorResponse(err)
  }
}