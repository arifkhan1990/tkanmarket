import type { NextRequest } from 'next/server'
import { z } from 'zod'

import { apiSuccess } from '@/lib/utils/api-response'
import { toApiErrorResponse } from '@/lib/api/handle-api-error'
import { NotFoundError } from '@/lib/errors'
import { requireAdminSession } from '@/lib/auth/require-admin'
import {
  WholesalePricingAdminService,
  computeWholesaleTiersFromSimulator
} from '@/services/wholesale-pricing-admin.service'

export const dynamic = 'force-dynamic'

const ParamsSchema = z.object({
  id: z.coerce.number().int().positive()
})

const TierSchema = z.object({
  sortOrder: z.number().int().min(0).max(500),
  label: z.string().trim().min(1).max(120),
  minMeters: z.number().int().min(0).max(100000000),
  maxMeters: z.number().int().min(0).max(100000000).nullable(),
  pricePerMeterUsd: z.string().trim().regex(/^\d+(\.\d{1,4})?$/),
  effectiveDiscountPercent: z.string().trim().regex(/^\d+(\.\d{1,2})?$/).nullable().optional()
})

const SimulatorSchema = z.object({
  baseUnitCostUsd: z.string().trim().regex(/^\d+(\.\d{1,4})?$/),
  minTargetMarginPercent: z.string().trim().regex(/^\d+(\.\d{1,2})?$/),
  volumeDecayFactor: z.string().trim().regex(/^\d+(\.\d{1,4})?$/)
})

const PutSchema = z.object({
  tiers: z.array(TierSchema).max(40),
  simulator: SimulatorSchema.nullable().optional(),
  recompute_from_simulator: z.boolean().optional()
})

export async function GET(_req: NextRequest, context: { params: Promise<{ id: string }> }) {
  try {
    await requireAdminSession()
    const params = ParamsSchema.parse(await context.params)
    const profile = await WholesalePricingAdminService.getByFabricId(params.id)
    const summary = await WholesalePricingAdminService.getFabricSummary(params.id)
    if (!summary) {
      return toApiErrorResponse(new NotFoundError('Fabric not found'))
    }
    return apiSuccess({ profile, fabric: summary })
  } catch (err) {
    return toApiErrorResponse(err)
  }
}

export async function PUT(req: NextRequest, context: { params: Promise<{ id: string }> }) {
  try {
    await requireAdminSession()
    const params = ParamsSchema.parse(await context.params)
    const json: unknown = await req.json()
    const body = PutSchema.parse(json)

    const summary = await WholesalePricingAdminService.getFabricSummary(params.id)
    if (!summary) {
      return toApiErrorResponse(new NotFoundError('Fabric not found'))
    }

    let tiers = body.tiers.map((t) => ({
      sortOrder: t.sortOrder,
      label: t.label,
      minMeters: t.minMeters,
      maxMeters: t.maxMeters,
      pricePerMeterUsd: t.pricePerMeterUsd,
      effectiveDiscountPercent: t.effectiveDiscountPercent ?? null
    }))

    if (body.recompute_from_simulator && body.simulator) {
      tiers = computeWholesaleTiersFromSimulator(body.simulator)
    }

    const profile = await WholesalePricingAdminService.upsertProfile({
      fabricId: params.id,
      tiers,
      simulator: body.simulator ?? null
    })

    return apiSuccess({ profile, fabric: summary })
  } catch (err) {
    return toApiErrorResponse(err)
  }
}
