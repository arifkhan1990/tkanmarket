'use client'

import { FabricGridClient } from '@/components/marketplace/FabricGridClient'

import type { FabricSummary } from '@/types/marketplace.types'

type Props = {
  items: FabricSummary[]
}

export function FeaturedFabricsGridClient({ items }: Props) {
  return (
    <FabricGridClient
      items={items}
      showWishlist
      priorityCount={8}
      gridClassName="mt-8 md:mt-10 grid grid-cols-1 gap-8 sm:grid-cols-2 lg:grid-cols-4"
    />
  )
}
