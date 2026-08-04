import type { NextRequest } from 'next/server'
import { z } from 'zod'

import { apiSuccess } from '@/lib/utils/api-response'
import { toApiErrorResponse } from '@/lib/api/handle-api-error'
import { requireAdminSession } from '@/lib/auth/require-admin'
import { AdminFabricService } from '@/services/admin-fabric.service'
import { parsePaginationParams } from '@/lib/utils/query-params'

const AdminFabricQuerySchema = z.object({
  status: z
    .enum(['raw_scraped', 'ai_processing', 'ai_processed', 'approved', 'rejected'])
    .optional()
    .nullable(),
  q: z.string().trim().min(1).max(200).optional().nullable(),
  supplier_id: z.coerce.number().int().positive().optional(),
  created_from: z.string().regex(/^\d{4}-\d{2}-\d{2}$/).optional().nullable(),
  created_to: z.string().regex(/^\d{4}-\d{2}-\d{2}$/).optional().nullable(),
  category_slug: z.string().trim().min(1).max(120).optional().nullable()
})

function ymdToUtcStart(s: string): Date {
  const parts = s.split('-').map(Number)
  const y = parts[0] ?? 0
  const mo = parts[1] ?? 1
  const d = parts[2] ?? 1
  return new Date(Date.UTC(y, mo - 1, d, 0, 0, 0, 0))
}

function ymdToUtcEnd(s: string): Date {
  const parts = s.split('-').map(Number)
  const y = parts[0] ?? 0
  const mo = parts[1] ?? 1
  const d = parts[2] ?? 1
  return new Date(Date.UTC(y, mo - 1, d, 23, 59, 59, 999))
}

const CreateFabricBodySchema = z.object({
  supplier_id: z.coerce.number().int().positive(),
  title_ru: z.string().trim().min(2).max(300)
})

export async function GET(req: NextRequest) {
  try {
    await requireAdminSession()
    const url = new URL(req.url)
    const { page, limit } = parsePaginationParams(url.searchParams)
    const supplierRaw = url.searchParams.get('supplier_id')
    const cf = url.searchParams.get('created_from')
    const ct = url.searchParams.get('created_to')
    const cat = url.searchParams.get('category_slug')
    const params = AdminFabricQuerySchema.extend({
      page: z.number().int().min(1),
      limit: z.number().int().min(1)
    }).parse({
      page,
      limit,
      status: url.searchParams.get('status'),
      q: url.searchParams.get('q'),
      supplier_id: supplierRaw !== null && supplierRaw !== '' ? supplierRaw : undefined,
      created_from: cf !== null && cf !== '' ? cf : undefined,
      created_to: ct !== null && ct !== '' ? ct : undefined,
      category_slug: cat !== null && cat !== '' ? cat : undefined
    })
    const createdFrom =
      params.created_from && params.created_from.length > 0 ? ymdToUtcStart(params.created_from) : undefined
    const createdTo = params.created_to && params.created_to.length > 0 ? ymdToUtcEnd(params.created_to) : undefined
    const result = await AdminFabricService.list({
      page: params.page,
      limit: params.limit,
      status: params.status ?? undefined,
      q: params.q ?? undefined,
      supplierId: params.supplier_id ?? undefined,
      createdFrom,
      createdTo,
      categorySlug: params.category_slug ?? undefined
    })
    return apiSuccess(result)
  } catch (err) {
    return toApiErrorResponse(err)
  }
}

export async function POST(req: NextRequest) {
  try {
    await requireAdminSession()
    const body = CreateFabricBodySchema.parse(await req.json().catch(() => ({})))
    const result = await AdminFabricService.create({
      supplierId: body.supplier_id,
      titleRu: body.title_ru
    })
    return apiSuccess(result, undefined, 201)
  } catch (err) {
    return toApiErrorResponse(err)
  }
}

