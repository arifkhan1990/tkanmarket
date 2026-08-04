import { EmptyState } from '@/components/common/EmptyState'
import { FabricGridClient } from '@/components/marketplace/FabricGridClient'
import type { FabricSummary } from '@/types/marketplace.types'
import { getServerLocale } from '@/lib/i18n/get-locale'
import { getMessages } from '@/lib/i18n/get-messages'

export async function FabricGrid({
  items,
  view = 'grid'
}: {
  items: FabricSummary[]
  view?: 'grid' | 'list'
}) {
  if (items.length === 0) {
    const locale = await getServerLocale()
    const m = getMessages(locale)
    return <EmptyState title={m.grid.emptyTitle} description={m.grid.emptyDescription} />
  }

  return <FabricGridClient items={items} view={view} showWishlist />
}

