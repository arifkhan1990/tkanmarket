import type { FabricSummary } from '@/types/marketplace.types'

export type AdminFabricQueueStatus = FabricSummary['fabricType'] extends never ? string : string

export interface AdminFabricQueueItem {
  id: number
  slug: string
  titleRu: string
  status: string
  supplierName: string
  gsm: number | null
  widthCm: number | null
  priceUsd: string | null
  moq: number | null
}

export interface AdminFabricQueueResult {
  items: AdminFabricQueueItem[]
  total: number
}

