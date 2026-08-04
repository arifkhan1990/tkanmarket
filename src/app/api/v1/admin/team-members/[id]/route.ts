import { apiSuccess } from '@/lib/utils/api-response'
import { toApiErrorResponse } from '@/lib/api/handle-api-error'
import { requireAdminOnlySession } from '@/lib/auth/require-admin'
import { TeamAdminService } from '@/services/team-admin.service'

export const dynamic = 'force-dynamic'

export async function DELETE(_req: Request, context: { params: Promise<{ id: string }> }) {
  try {
    await requireAdminOnlySession()
    const { id } = await context.params
    const memberId = Number(id)
    if (!Number.isFinite(memberId) || memberId < 1) throw new Error('Invalid member id')
    await TeamAdminService.removeMember(memberId)
    return apiSuccess({ ok: true })
  } catch (err) {
    return toApiErrorResponse(err)
  }
}
