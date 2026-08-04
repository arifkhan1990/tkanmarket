import type { NextRequest } from 'next/server'
import { z } from 'zod'

import { apiSuccess } from '@/lib/utils/api-response'
import { toApiErrorResponse } from '@/lib/api/handle-api-error'
import { requireAdminSession } from '@/lib/auth/require-admin'
import { LeadService } from '@/services/lead.service'

const ParamsSchema = z.object({
  id:     z.coerce.number().int().positive(),
  noteId: z.coerce.number().int().positive()
})

export async function DELETE(
  _req: NextRequest,
  context: { params: Promise<{ id: string; noteId: string }> }
) {
  try {
    await requireAdminSession()
    const { id, noteId } = ParamsSchema.parse(await context.params)
    await LeadService.deleteNote(noteId, id)
    return apiSuccess({ deleted: true })
  } catch (err) {
    return toApiErrorResponse(err)
  }
}
