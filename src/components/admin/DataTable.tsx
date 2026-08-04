'use client'

import * as React from 'react'
import {
  flexRender,
  getCoreRowModel,
  getSortedRowModel,
  useReactTable,
  type ColumnDef,
  type RowSelectionState,
  type SortingState,
  type Updater
} from '@tanstack/react-table'

import { Checkbox } from '@/components/ui/checkbox'
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table'
import type { DataTableProps } from '@/types/admin.types'
import { cn } from '@/lib/utils'
import { useI18n } from '@/hooks/useI18n'

export function DataTable<TData>({
  columns,
  data,
  pagination,
  onPaginationChange,
  onSortChange,
  getRowId,
  enableRowSelection
}: DataTableProps<TData>) {
  const { messages } = useI18n()
  const dt = messages.admin.dataTable
  const [sorting, setSorting] = React.useState<SortingState>([])
  const [rowSelection, setRowSelection] = React.useState<RowSelectionState>({})

  const pageCount = Math.max(1, Math.ceil(pagination.total / pagination.pageSize))

  // TanStack Table returns non-memoizable functions; safe to ignore compiler hint here.
  // eslint-disable-next-line react-hooks/incompatible-library
  const table = useReactTable({
    data,
    columns: columns as ColumnDef<TData, unknown>[],
    state: { sorting, rowSelection },
    enableRowSelection: Boolean(enableRowSelection),
    getRowId: getRowId ? (row, index) => getRowId(row) : undefined,
    onRowSelectionChange: setRowSelection,
    onSortingChange: (updater: Updater<SortingState>) => {
      setSorting((old) => {
        const next =
          typeof updater === 'function' ? updater(old) : updater
        onSortChange?.(next)
        return next
      })
    },
    onPaginationChange: undefined,
    manualPagination: true,
    manualSorting: true,
    pageCount,
    getCoreRowModel: getCoreRowModel(),
    getSortedRowModel: getSortedRowModel()
  })

  const canPrev = pagination.pageIndex > 0
  const canNext = pagination.pageIndex < pageCount - 1

  const handlePrev = () => {
    if (!canPrev) return
    onPaginationChange?.({ pageIndex: pagination.pageIndex - 1, pageSize: pagination.pageSize })
  }

  const handleNext = () => {
    if (!canNext) return
    onPaginationChange?.({ pageIndex: pagination.pageIndex + 1, pageSize: pagination.pageSize })
  }

  const hasSelection = Boolean(enableRowSelection)

  const headerCheckboxChecked =
    hasSelection && table.getIsAllPageRowsSelected()

  return (
    <div className="rounded-[2rem] bg-surface-container-lowest overflow-hidden shadow-sm border border-outline/10">
      <Table>
        <TableHeader className="bg-surface-container-low/50">
          {table.getHeaderGroups().map((headerGroup) => (
            <TableRow key={headerGroup.id}>
              {hasSelection ? (
                <TableHead className="w-12">
                  <div className="flex items-center justify-center">
                    <Checkbox
                      checked={headerCheckboxChecked}
                      onCheckedChange={(v) => {
                        const shouldSelect = v === true
                        table.toggleAllPageRowsSelected(shouldSelect)
                      }}
                      aria-label={dt.selectAllRows}
                    />
                  </div>
                </TableHead>
              ) : null}

              {headerGroup.headers.map((header) => {
                if (header.isPlaceholder) return null
                const canSort = header.column.getCanSort()
                return (
                  <TableHead
                    key={header.id}
                    className={cn('cursor-pointer select-none', canSort ? 'hover:bg-surface-container-highest rounded-xl' : '')}
                    onClick={canSort ? header.column.getToggleSortingHandler() : undefined}
                  >
                    {flexRender(header.column.columnDef.header, header.getContext())}
                  </TableHead>
                )
              })}
            </TableRow>
          ))}
        </TableHeader>

        <TableBody>
          {table.getRowModel().rows.map((row) => (
            <TableRow key={row.id} className="even:bg-surface-container-low/10">
              {hasSelection ? (
                <TableCell className="w-12">
                  <div className="flex items-center justify-center">
                    <Checkbox
                      checked={row.getIsSelected()}
                      onCheckedChange={(v) => row.toggleSelected(Boolean(v))}
                      aria-label={dt.selectRowTemplate.replace('{id}', String(row.id))}
                    />
                  </div>
                </TableCell>
              ) : null}

              {row.getVisibleCells().map((cell) => (
                <TableCell key={cell.id} className="align-top">
                  {flexRender(cell.column.columnDef.cell, cell.getContext())}
                </TableCell>
              ))}
            </TableRow>
          ))}
        </TableBody>
      </Table>

      <div className="flex items-center justify-between px-8 py-5 bg-surface-container-low/20">
        <div className="text-xs text-on-surface-variant font-medium">
          {dt.showingPage
            .replace('{current}', String(pagination.pageIndex + 1))
            .replace('{total}', String(pageCount))}
        </div>
        <div className="flex items-center gap-2">
          <button
            type="button"
            className="w-10 h-10 rounded-xl text-outline hover:bg-surface-container-highest disabled:opacity-30 disabled:pointer-events-none transition-colors"
            onClick={handlePrev}
            disabled={!canPrev}
          >
            {dt.prev}
          </button>
          <button
            type="button"
            className="w-10 h-10 rounded-xl text-outline hover:bg-surface-container-highest disabled:opacity-30 disabled:pointer-events-none transition-colors"
            onClick={handleNext}
            disabled={!canNext}
          >
            {dt.next}
          </button>
        </div>
      </div>
    </div>
  )
}

