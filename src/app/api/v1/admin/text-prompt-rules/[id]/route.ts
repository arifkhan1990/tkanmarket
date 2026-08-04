import type { NextRequest } from 'next/server'
import { z } from 'zod'

import { apiSuccess } from '@/lib/utils/api-response'
import { toApiErrorResponse } from '@/lib/api/handle-api-error'
import { requireAdminSession } from '@/lib/auth/require-admin'
import { TextPromptRuleService } from '@/services/admin/text-prompt-rule.service'

const UpdateRuleSchema = z.object({
  name: z.string().min(1).max(200).optional(),
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

export async function GET(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  try {
    await requireAdminSession()
    const { id: rawId } = await params
    const id = Number(rawId)
    const rule = await TextPromptRuleService.getById(id)
    if (!rule) {
      return apiSuccess(null, undefined, 404)
    }
    return apiSuccess(rule)
  } catch (err) {
    return toApiErrorResponse(err)
  }
}

export async function PUT(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  try {
    await requireAdminSession()
    const { id: rawId } = await params
    const id = Number(rawId)
    const json: unknown = await req.json()
    const body = UpdateRuleSchema.parse(json)
    const rule = await TextPromptRuleService.update(id, body)
    return apiSuccess(rule)
  } catch (err) {
    return toApiErrorResponse(err)
  }
}

export async function DELETE(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  try {
    await requireAdminSession()
    const { id: rawId } = await params
    const id = Number(rawId)
    await TextPromptRuleService.delete(id)
    return apiSuccess(null)
  } catch (err) {
    return toApiErrorResponse(err)
  }
}