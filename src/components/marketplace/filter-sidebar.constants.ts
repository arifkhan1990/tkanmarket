import type { FabricQueryParams } from '@/lib/validations/fabric.validation'

export type SectionKey = 'material' | 'catalogCategory' | 'type' | 'gsm' | 'width' | 'moq' | 'price' | 'stockLocation'

export const fabricTypeOptions: Array<{ value: string; label: string }> = [
  { value: 'knit', label: 'knit' },
  { value: 'woven', label: 'woven' },
  { value: 'nonwoven', label: 'nonwoven' },
  { value: 'lace', label: 'lace' },
  { value: 'lining', label: 'lining' },
  { value: 'technical', label: 'technical' },
  { value: 'other', label: 'other' }
]

export const widthRanges = [
  { id: 'lt100', label: '< 100cm', min: undefined, max: 99 },
  { id: '100_140', label: '100–140cm', min: 100, max: 140 },
  { id: '140_160', label: '140–160cm', min: 140, max: 160 },
  { id: 'gt160', label: '> 160cm', min: 161, max: undefined }
] as const

export const moqRangesTemplate = [
  { id: 'lt50', min: undefined, max: 49 },
  { id: '50_200', min: 50, max: 200 },
  { id: '200_500', min: 200, max: 500 },
  { id: '500p', min: 500, max: undefined }
] as const

