import type { NextRequest } from 'next/server'
import { z } from 'zod'

import { apiSuccess } from '@/lib/utils/api-response'
import { toApiErrorResponse } from '@/lib/api/handle-api-error'
import { requireAdminSession } from '@/lib/auth/require-admin'
import { NotFoundError } from '@/lib/errors'
import { AdminSuppliersService } from '@/services/admin-suppliers.service'

export const dynamic = 'force-dynamic'

const optionalHttpUrl = z
  .union([z.string().url().max(2000), z.literal(''), z.null()])
  .optional()

const patchSchema = z.object({
  name: z.string().trim().min(1).max(300).optional(),
  slug: z
    .string()
    .trim()
    .min(2)
    .max(120)
    .regex(/^[a-z0-9]+(?:-[a-z0-9]+)*$/, 'Slug must be lowercase letters, numbers, and hyphens')
    .optional(),
  country: z.string().trim().min(1).max(120).optional(),
  city: z.string().trim().max(120).nullable().optional(),
  province: z.string().trim().max(120).nullable().optional(),
  description: z.string().max(20000).nullable().optional(),
  logo_url: optionalHttpUrl,
  website_url: optionalHttpUrl,
  verified: z.boolean().optional(),
  established_year: z.number().int().min(1800).max(2100).nullable().optional(),
  source_url: optionalHttpUrl
})

export async function GET(_req: NextRequest, context: { params: Promise<{ id: string }> }) {
  try {
    await requireAdminSession()
    const idRaw = (await context.params).id
    const id = Number(idRaw)
    if (!Number.isFinite(id) || id < 1) throw new NotFoundError('Supplier not found')

    const row = await AdminSuppliersService.getById(id)
    if (!row) throw new NotFoundError('Supplier not found')
    return apiSuccess(row)
  } catch (err) {
    return toApiErrorResponse(err)
  }
}

export async function PATCH(req: NextRequest, context: { params: Promise<{ id: string }> }) {
  try {
    await requireAdminSession()
    const idRaw = (await context.params).id
    const id = Number(idRaw)
    if (!Number.isFinite(id) || id < 1) throw new NotFoundError('Supplier not found')

    const json: unknown = await req.json()
    const body = patchSchema.parse(json)

    const emptyToNull = (v: string | null | undefined) => (v === '' ? null : v)

    const updated = await AdminSuppliersService.update(id, {
      name: body.name,
      slug: body.slug,
      country: body.country,
      city: body.city,
      province: body.province,
      description: body.description,
      logoUrl: body.logo_url !== undefined ? emptyToNull(body.logo_url) : undefined,
      websiteUrl: body.website_url !== undefined ? emptyToNull(body.website_url) : undefined,
      verified: body.verified,
      establishedYear: body.established_year,
      sourceUrl: body.source_url !== undefined ? emptyToNull(body.source_url) : undefined
    })
    if (!updated) throw new NotFoundError('Supplier not found')
    return apiSuccess(updated)
  } catch (err) {
    return toApiErrorResponse(err)
  }
}
