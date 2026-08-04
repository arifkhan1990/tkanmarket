'use client'

import * as React from 'react'
import { MoreHorizontal, RefreshCw } from 'lucide-react'

import { Button } from '@/components/ui/button'
import { Checkbox } from '@/components/ui/checkbox'
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from '@/components/ui/dropdown-menu'
import { Input } from '@/components/ui/input'
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table'
import { AdminPagination } from '@/components/admin/admin-pagination'
import { useAdminFabricCategoriesQuery, useAdminFabricCategoryMutations } from '@/hooks/admin/useAdminFabricCategories'
import { cn } from '@/lib/utils'
import { FabricCategoriesSkeleton } from '@/components/admin/fabric-categories/fabric-categories-skeleton'
import { FabricCategoryStatusBadge } from '@/components/admin/fabric-categories/fabric-category-status-badge'
import { FabricCategoryEditorDialog } from '@/components/admin/fabric-categories/fabric-category-editor-dialog'
import { FabricCategoryConfirmDialog } from '@/components/admin/fabric-categories/fabric-category-confirm-dialog'
import type { AdminFabricCategoryTermCreateInput } from '@/types/admin-fabric-category-terms.types'

export function FabricCategoriesClient() {
  const [page, setPage] = React.useState(1)
  const [limit, setLimit] = React.useState(20)
  const [q, setQ] = React.useState('')
  const [includeInactive, setIncludeInactive] = React.useState(false)
  const [includeArchived, setIncludeArchived] = React.useState(false)

  const deferredQ = React.useDeferredValue(q)

  const query = useAdminFabricCategoriesQuery({ page, limit, q: deferredQ, includeInactive, includeArchived })
  const mutations = useAdminFabricCategoryMutations()

  const d = query.data
  const items = d?.items ?? []
  const meta = d?.meta

  const onRefresh = async () => {
    await query.refetch()
  }

  return (
    <div className="space-y-6">
      <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h1 className="font-heading text-heading-xl font-extrabold tracking-tight">Fabric categories</h1>
          <p className="mt-1 text-sm text-on-surface-variant">Manage categories used in filters and taxonomy.</p>
        </div>
        <div className="flex items-center gap-3">
          <Button
            type="button"
            variant="outline"
            className="rounded-full"
            onClick={onRefresh}
            disabled={query.isFetching || mutations.isBusy}
          >
            <RefreshCw className={cn('h-4 w-4 mr-2', query.isFetching ? 'animate-spin' : '')} aria-hidden />
            Refresh
          </Button>
          <FabricCategoryEditorDialog
            mode="create"
            busy={mutations.isBusy}
            onCreate={async (input: AdminFabricCategoryTermCreateInput) => {
              await mutations.create.mutateAsync(input)
              setPage(1)
            }}
          />
        </div>
      </div>

      {query.isLoading && !d ? <FabricCategoriesSkeleton /> : null}

      {d ? (
        <section
          className="rounded-2xl border border-outline/10 bg-surface-container-lowest/80 shadow-sm overflow-hidden dark:border-outline/15"
          aria-label="Fabric categories"
        >
          <div className="flex flex-col gap-3 border-b border-outline/10 px-4 py-3 md:flex-row md:items-center md:justify-between">
            <div className="flex flex-col gap-2 sm:flex-row sm:items-center">
              <Input
                value={q}
                onChange={(e) => {
                  setQ(e.target.value)
                  setPage(1)
                }}
                placeholder="Search slug/name…"
                className="h-9 w-full rounded-full sm:w-[320px]"
              />
              <label className="flex items-center gap-2 text-sm text-on-surface-variant">
                <Checkbox checked={includeInactive} onCheckedChange={(v) => {
                  setIncludeInactive(Boolean(v))
                    if (!v) setIncludeArchived(false)
                  setPage(1)
                }} />
                Include inactive
              </label>
                <label className="flex items-center gap-2 text-sm text-on-surface-variant">
                  <Checkbox
                    checked={includeArchived}
                    onCheckedChange={(v) => {
                      const next = Boolean(v)
                      setIncludeArchived(next)
                      if (next) setIncludeInactive(true)
                      setPage(1)
                    }}
                  />
                  Show archived
                </label>
            </div>
            <div className="text-xs font-bold uppercase tracking-widest text-outline">
              {meta?.total.toLocaleString() ?? 0} total
            </div>
          </div>

          <div className="overflow-x-auto">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead className="min-w-[220px]">Slug</TableHead>
                  <TableHead className="min-w-[220px]">Name (RU)</TableHead>
                  <TableHead className="min-w-[220px]">Name (EN)</TableHead>
                  <TableHead className="min-w-[120px]">Sort</TableHead>
                  <TableHead className="min-w-[140px]">Status</TableHead>
                  <TableHead className="min-w-[160px]">Updated</TableHead>
                  <TableHead className="w-[80px]" />
                </TableRow>
              </TableHeader>
              <TableBody>
                {items.length === 0 ? (
                  <TableRow>
                    <TableCell colSpan={7} className="py-10 text-center text-on-surface-variant">
                      No categories found.
                    </TableCell>
                  </TableRow>
                ) : (
                  items.map((row) => (
                    <TableRow key={row.id} className="align-top">
                      <TableCell className="font-mono text-xs text-on-surface">{row.slug}</TableCell>
                      <TableCell className="font-medium">{row.name_ru}</TableCell>
                      <TableCell className="text-on-surface-variant">{row.name_en ?? '—'}</TableCell>
                      <TableCell className="tabular-nums">{row.sort_order}</TableCell>
                      <TableCell>
                        <FabricCategoryStatusBadge row={row} />
                      </TableCell>
                      <TableCell className="text-xs text-on-surface-variant">
                        {new Date(row.updated_at).toLocaleString()}
                      </TableCell>
                      <TableCell className="text-right">
                        <DropdownMenu>
                          <DropdownMenuTrigger asChild>
                            <Button variant="ghost" size="icon" className="h-8 w-8 rounded-full" aria-label="Actions">
                              <MoreHorizontal className="h-4 w-4" aria-hidden />
                            </Button>
                          </DropdownMenuTrigger>
                          <DropdownMenuContent align="end" className="w-44">
                            <DropdownMenuItem asChild>
                              <div className="w-full">
                                <FabricCategoryEditorDialog
                                  mode="edit"
                                  row={row}
                                  busy={mutations.isBusy}
                                  onUpdate={async (id, patch) => {
                                    await mutations.update.mutateAsync({ id, patch })
                                  }}
                                />
                              </div>
                            </DropdownMenuItem>
                            {!row.deleted_at ? (row.is_active ? (
                              <DropdownMenuItem
                                onClick={async () => {
                                  await mutations.update.mutateAsync({ id: row.id, patch: { is_active: false } })
                                }}
                              >
                                Set inactive
                              </DropdownMenuItem>
                            ) : (
                              <DropdownMenuItem
                                onClick={async () => {
                                  await mutations.update.mutateAsync({ id: row.id, patch: { is_active: true } })
                                }}
                              >
                                Set active
                              </DropdownMenuItem>
                            )) : null}
                            {!row.deleted_at ? (
                              <DropdownMenuItem asChild className="text-destructive focus:text-destructive">
                                <div className="w-full">
                                  <FabricCategoryConfirmDialog
                                    title="Archive category?"
                                    description="This will hide the category from filters and taxonomy. You can restore it later."
                                    confirmLabel="Archive"
                                    confirmTone="destructive"
                                    onConfirm={async () => {
                                      await mutations.archive.mutateAsync(row.id)
                                    }}
                                  >
                                    <button type="button" className="w-full text-left">
                                      Archive
                                    </button>
                                  </FabricCategoryConfirmDialog>
                                </div>
                              </DropdownMenuItem>
                            ) : (
                              <DropdownMenuItem asChild>
                                <div className="w-full">
                                  <FabricCategoryConfirmDialog
                                    title="Restore category?"
                                    description="This will restore the category and allow it to appear in filters again."
                                    confirmLabel="Restore"
                                    onConfirm={async () => {
                                      await mutations.restore.mutateAsync(row.id)
                                    }}
                                  >
                                    <button type="button" className="w-full text-left">
                                      Restore
                                    </button>
                                  </FabricCategoryConfirmDialog>
                                </div>
                              </DropdownMenuItem>
                            )}
                          </DropdownMenuContent>
                        </DropdownMenu>
                      </TableCell>
                    </TableRow>
                  ))
                )}
              </TableBody>
            </Table>
          </div>

          <AdminPagination
            page={meta?.page ?? page}
            pageSize={meta?.limit ?? limit}
            totalItems={meta?.total ?? 0}
            onPageChange={(p) => setPage(p)}
            onPageSizeChange={(ps) => {
              setLimit(ps)
              setPage(1)
            }}
            disabled={query.isFetching || mutations.isBusy}
          />

          {includeInactive ? (
            <div className="px-4 py-3 border-t border-outline/10 text-xs text-on-surface-variant flex items-center justify-between">
              <span>Inactive/archived categories are hidden from filters/taxonomy.</span>
              <Button
                variant="secondary"
                className="h-8 rounded-full"
                onClick={() => {
                  setIncludeInactive(false)
                  setIncludeArchived(false)
                }}
                disabled={query.isFetching || mutations.isBusy}
              >
                Hide inactive
              </Button>
            </div>
          ) : null}
        </section>
      ) : null}
    </div>
  )
}

