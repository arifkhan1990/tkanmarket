import type { ColumnDef, SortingState } from '@tanstack/react-table'

export type StatsCardColor = 'blue' | 'green' | 'yellow' | 'red'

/** Serializable icon id for StatsCard (RSC cannot pass Lucide components as props). */
export type StatsCardIconName =
  | 'bot'
  | 'calendar-check2'
  | 'check-circle2'
  | 'clock'
  | 'file-text'
  | 'flame'
  | 'megaphone'
  | 'package-search'
  | 'shield-check'
  | 'sparkles'
  | 'target'
  | 'x-circle'

export interface StatsCardProps {
  title: string
  value: number | string
  change?: number
  icon: StatsCardIconName
  color: StatsCardColor
  /** Optional subline under the value (e.g. status · running count). */
  description?: string
  /** When set, the whole card links internally (e.g. to crawler control). */
  href?: string
  /** Dense horizontal layout for dashboard metric grids (saves vertical space). */
  variant?: 'default' | 'compact'
}

export interface DataTablePagination {
  pageIndex: number
  pageSize: number
  total: number
}

export interface DataTableProps<TData> {
  columns: ColumnDef<TData, unknown>[]
  data: TData[]
  pagination: DataTablePagination
  onPaginationChange?: (next: { pageIndex: number; pageSize: number }) => void
  onSortChange?: (sorting: SortingState) => void
  getRowId?: (row: TData) => string
  enableRowSelection?: boolean
}

