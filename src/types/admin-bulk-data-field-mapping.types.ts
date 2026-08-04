import type { BulkDataOperationSummary, BulkDataOperationsResponse } from '@/types/admin-bulk-data.types'

export type BulkDataFieldMappingSystemFieldKey = 'sku_id' | 'display_title_eng' | 'wholesale_price_usd' | 'warehouse_qty_avl'

export type BulkDataFieldMappingValidationIntent = 'success' | 'warning' | 'error' | 'brand' | 'default'

export interface BulkDataFieldMappingSystemField {
  key: BulkDataFieldMappingSystemFieldKey
  label: string
  validationLabel: string
  validationIntent: BulkDataFieldMappingValidationIntent
}

export interface BulkDataFieldMappingResponse {
  activeRun: BulkDataOperationSummary | null
  runningCount: number
  recentHistory: BulkDataOperationSummary[]
  metrics: BulkDataOperationsResponse['metrics']
  availableSourceColumns: string[]
  systemFields: BulkDataFieldMappingSystemField[]
}

