import type { NextRequest } from 'next/server'
import { z } from 'zod'

import { apiSuccess } from '@/lib/utils/api-response'
import { toApiErrorResponse } from '@/lib/api/handle-api-error'
import { requireAdminSession } from '@/lib/auth/require-admin'
import { AdminCatalogExportService } from '@/services/admin-catalog-export.service'
import type { CatalogExportFormat } from '@/types/admin-catalog-export.types'

export const dynamic = 'force-dynamic'

const createExportSchema = z.object({
  format: z.enum(['CSV', 'XLSX', 'JSON']),
  fields: z.array(z.string().min(1)).min(1),
  filters: z
    .object({
      status: z.string().optional(),
      category: z.string().optional(),
      supplier: z.string().optional()
    })
    .optional()
})

export async function GET(_req: NextRequest) {
  try {
    await requireAdminSession()
    const data = await AdminCatalogExportService.getOverview()
    return apiSuccess(data)
  } catch (err) {
    return toApiErrorResponse(err)
  }
}

export async function POST(req: NextRequest) {
  try {
    await requireAdminSession()
    const json = await req.json()
    const parsed = createExportSchema.parse(json)

    await AdminCatalogExportService.createExportJob({
      format: parsed.format as CatalogExportFormat,
      fields: parsed.fields,
      filters: parsed.filters
    })

    return apiSuccess({ ok: true }, undefined, 201)
  } catch (err) {
    return toApiErrorResponse(err)
  }
}

