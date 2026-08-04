import type { AdminFabricDetail } from '@/types/admin-fabric-management.types'

export interface GeneratedMediaItem {
  id: number
  type: 'image' | 'video'
  mediaType: string | null
  url: string | null
  thumbnailUrl: string | null
  prompt: string | null
  status: string
  durationSeconds: number | null
  createdAt: string
}

export interface FabricDraftPreviewChecklistItem {
  id: string
  labelKey: 'images' | 'price' | 'sustainability' | 'composition' | 'fabricType' | 'gsm' | 'descriptionEn' | 'tagsEn'
  done: boolean
}

export interface FabricDraftPreviewResponse {
  fabric: AdminFabricDetail
  checklist: FabricDraftPreviewChecklistItem[]
  displayTitle: string
  primaryImageUrl: string | null
  secondaryImageUrls: string[]
  generatedImages: GeneratedMediaItem[]
  generatedVideos: GeneratedMediaItem[]
}
