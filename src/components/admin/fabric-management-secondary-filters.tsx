'use client'

import * as React from 'react'
import type { UseQueryResult } from '@tanstack/react-query'
import { Calendar, ListFilter, Tag } from 'lucide-react'

import { Button } from '@/components/ui/button'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import type { AdminFabricCategoryOption, AdminSupplierOption } from '@/types/admin-fabric-management.types'
import type { Messages } from '@/lib/i18n/get-messages'
import { type FabricListDatePresetKey, getFabricListDatePreset } from '@/lib/admin/fabric-list-date-presets'

export function FabricManagementSecondaryFilters({
  messages,
  supplierIdFromUrl,
  categorySlugFromUrl,
  createdFromUrl,
  createdToUrl,
  total,
  supplierOptions,
  categoryOptions,
  onSupplierChange,
  onCategoryChange,
  onDatePresetApply,
  onScrollToTable
}: {
  messages: Messages
  supplierIdFromUrl: number | undefined
  categorySlugFromUrl: string | undefined
  createdFromUrl: string | undefined
  createdToUrl: string | undefined
  total: number
  supplierOptions: UseQueryResult<AdminSupplierOption[], Error>
  categoryOptions: UseQueryResult<AdminFabricCategoryOption[], Error>
  onSupplierChange: (next: number | undefined) => void
  onCategoryChange: (slug: string | undefined) => void
  onDatePresetApply: (preset: Exclude<FabricListDatePresetKey, 'custom'>) => void
  onScrollToTable: () => void
}) {
  const suppliers = supplierOptions.data ?? []
  const orphanSupplier =
    typeof supplierIdFromUrl === 'number' &&
    supplierIdFromUrl > 0 &&
    !suppliers.some((s) => s.id === supplierIdFromUrl)

  const selectValue = React.useMemo(() => {
    if (!supplierIdFromUrl) return 'all'
    return String(supplierIdFromUrl)
  }, [supplierIdFromUrl])

  const datePreset = getFabricListDatePreset(createdFromUrl, createdToUrl)

  const categories = categoryOptions.data ?? []
  const categorySelectValue = categorySlugFromUrl && categorySlugFromUrl.length > 0 ? categorySlugFromUrl : 'all'

  return (
    <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4">
      <div className="flex flex-col gap-2 rounded-2xl bg-surface-container-low p-4">
        <div className="flex flex-wrap items-center justify-between gap-2">
          <span className="text-[10px] font-bold uppercase tracking-wider text-outline">
            {messages.admin.fabrics.filterSupplier}
          </span>
          {supplierOptions.isError ? (
            <Button
              type="button"
              variant="ghost"
              size="sm"
              className="h-7 text-xs text-primary"
              onClick={() => {
                void supplierOptions.refetch()
              }}
            >
              {messages.admin.fabrics.supplierListRetry}
            </Button>
          ) : null}
        </div>
        {supplierOptions.isPending ? (
          <div className="flex flex-col gap-2" aria-busy="true" aria-label={messages.admin.fabrics.loading}>
            <div className="h-5 w-3/4 max-w-[200px] animate-pulse rounded-md bg-outline/15" />
            <div className="h-4 w-1/2 max-w-[140px] animate-pulse rounded-md bg-outline/10" />
          </div>
        ) : supplierOptions.isError ? (
          supplierIdFromUrl ? (
            <p className="font-mono text-xs text-outline">ID {supplierIdFromUrl}</p>
          ) : null
        ) : (
          <Select
            value={selectValue}
            onValueChange={(value) => {
              if (value === 'all') onSupplierChange(undefined)
              else onSupplierChange(Number(value))
            }}
          >
            <SelectTrigger className="h-auto border-none bg-transparent px-0 py-0 text-sm font-semibold shadow-none focus:ring-0">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">{messages.admin.fabrics.filterSupplierAll}</SelectItem>
              {orphanSupplier ? (
                <SelectItem value={String(supplierIdFromUrl)}>ID {supplierIdFromUrl}</SelectItem>
              ) : null}
              {suppliers.map((s) => (
                <SelectItem key={s.id} value={String(s.id)}>
                  {s.name}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        )}
      </div>

      <div className="flex flex-col gap-2 rounded-2xl bg-surface-container-low p-4">
        <span className="text-[10px] font-bold uppercase tracking-wider text-outline">
          {messages.admin.fabrics.filterDateRange}
        </span>
        <Select
          value={datePreset === 'custom' ? 'custom' : datePreset}
          onValueChange={(v) => {
            if (v === 'custom') return
            onDatePresetApply(v as Exclude<FabricListDatePresetKey, 'custom'>)
          }}
        >
          <SelectTrigger className="h-auto min-h-9 border-none bg-transparent px-0 py-0 text-sm font-semibold shadow-none focus:ring-0">
            <div className="flex items-center gap-2">
              <Calendar className="size-[18px] shrink-0 text-outline" aria-hidden />
              <SelectValue />
            </div>
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">{messages.admin.fabrics.filterDatePresetAll}</SelectItem>
            <SelectItem value="7d">{messages.admin.fabrics.filterDatePreset7d}</SelectItem>
            <SelectItem value="30d">{messages.admin.fabrics.filterDatePreset30d}</SelectItem>
            <SelectItem value="90d">{messages.admin.fabrics.filterDatePreset90d}</SelectItem>
            {datePreset === 'custom' ? (
              <SelectItem value="custom" disabled>
                {messages.admin.fabrics.filterDatePresetCustom}
              </SelectItem>
            ) : null}
          </SelectContent>
        </Select>
      </div>

      <div className="flex flex-col gap-2 rounded-2xl bg-surface-container-low p-4">
        <span className="text-[10px] font-bold uppercase tracking-wider text-outline">
          {messages.admin.fabrics.filterCategory}
        </span>
        {categoryOptions.isPending ? (
          <div className="h-9 max-w-[220px] animate-pulse rounded-lg bg-outline/15" aria-hidden />
        ) : categoryOptions.isError ? (
          <div className="flex items-center gap-2 text-sm text-error">
            <Tag className="size-[18px] shrink-0" aria-hidden />
            <Button
              type="button"
              variant="ghost"
              size="sm"
              className="h-auto px-0 text-primary"
              onClick={() => void categoryOptions.refetch()}
            >
              {messages.admin.fabrics.supplierListRetry}
            </Button>
          </div>
        ) : (
          <Select
            value={categorySelectValue}
            onValueChange={(v) => {
              if (v === 'all') onCategoryChange(undefined)
              else onCategoryChange(v)
            }}
          >
            <SelectTrigger className="h-auto min-h-9 border-none bg-transparent px-0 py-0 text-sm font-semibold shadow-none focus:ring-0">
              <div className="flex items-center gap-2">
                <Tag className="size-[18px] shrink-0 text-outline" aria-hidden />
                <SelectValue />
              </div>
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">{messages.admin.fabrics.filterCategoryAll}</SelectItem>
              {categories.map((c) => (
                <SelectItem key={c.slug} value={c.slug}>
                  {c.slug}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        )}
      </div>

      <div className="flex flex-col justify-between gap-3 rounded-2xl bg-surface-container-low p-4 sm:flex-row sm:items-center">
        <div>
          <span className="text-[10px] font-bold uppercase tracking-wider text-outline">
            {messages.admin.fabrics.activeResults}
          </span>
          <p className="font-heading text-xl font-bold text-on-surface">
            {total.toLocaleString()}{' '}
            <span className="text-xs font-normal text-outline">{messages.admin.fabrics.activeResultsItems}</span>
          </p>
        </div>
        <Button
          type="button"
          variant="outline"
          size="icon"
          className="shrink-0 rounded-lg bg-surface-container-high text-on-surface hover:bg-surface-container-highest"
          aria-label={messages.admin.fabrics.scrollToFabricTable}
          onClick={onScrollToTable}
        >
          <ListFilter className="size-5" aria-hidden />
        </Button>
      </div>
    </div>
  )
}
