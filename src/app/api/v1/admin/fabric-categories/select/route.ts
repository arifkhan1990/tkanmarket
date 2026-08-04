import { apiSuccess } from '@/lib/utils/api-response'
import { toApiErrorResponse } from '@/lib/api/handle-api-error'
import { requireAdminSession } from '@/lib/auth/require-admin'
import { AdminFabricCategoryTermsService } from '@/services/admin-fabric-category-terms.service'
import { AdminFabricService } from '@/services/admin-fabric.service'

export async function GET() {
  try {
    await requireAdminSession()
    const rows = await AdminFabricCategoryTermsService.listActiveOptions().catch(async () => {
      // Safe fallback for dev environments where migrations haven't been applied yet.
      const legacy = await AdminFabricService.listLegacyCategoryOptions()
      return legacy.map((r) => ({ id: 0, slug: r.slug, name_ru: r.slug }))
    })
    return apiSuccess(rows)
  } catch (err) {
    return toApiErrorResponse(err)
  }
}
