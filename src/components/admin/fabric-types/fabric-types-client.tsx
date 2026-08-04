'use client'

import * as React from 'react'
import { MoreHorizontal, Plus, RefreshCw, Search } from 'lucide-react'
import { toast } from 'sonner'

import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table'
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from '@/components/ui/dialog'
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from '@/components/ui/dropdown-menu'
import { AdminPagination } from '@/components/admin/admin-pagination'
import { FabricTypesSkeleton } from './fabric-types-skeleton'
import { cn } from '@/lib/utils'

interface FabricTypeRow {
  id: number
  slug: string
  labelRu: string
  labelEn: string | null
  sortOrder: number
  fabricCount: number
  createdAt: string
  updatedAt: string
  deletedAt: string | null
}

interface PageData {
  items: FabricTypeRow[]
  meta: { page: number; limit: number; total: number; totalPages: number }
}

function emptyForm() {
  return { slug: '', labelRu: '', labelEn: '', sortOrder: 0 }
}

type ActionType = 'save' | 'archive' | 'restore' | null

export function FabricTypesClient() {
  const [page, setPage] = React.useState(1)
  const [q, setQ] = React.useState('')
  const [data, setData] = React.useState<PageData | null>(null)
  const [loading, setLoading] = React.useState(true)
  const [actionLoading, setActionLoading] = React.useState<ActionType>(null)

  const [dialogOpen, setDialogOpen] = React.useState(false)
  const [dialogMode, setDialogMode] = React.useState<'create' | 'edit'>('create')
  const [editId, setEditId] = React.useState<number | null>(null)
  const [form, setForm] = React.useState(emptyForm())

  const [deleteConfirmId, setDeleteConfirmId] = React.useState<number | null>(null)
  const [restoreConfirmId, setRestoreConfirmId] = React.useState<number | null>(null)

  const [showForceConfirm, setShowForceConfirm] = React.useState<number | null>(null)

  const deferredQ = React.useDeferredValue(q)

  const fetchData = React.useCallback(async () => {
    setLoading(true)
    try {
      const params = new URLSearchParams({ page: String(page), limit: '50' })
      if (deferredQ.trim()) params.set('q', deferredQ.trim())
      const res = await fetch(`/api/v1/admin/fabric-types?${params}`)
      const json = await res.json()
      if (json.success) {
        setData({ items: json.data, meta: json.meta })
      } else {
        toast.error(json.error?.message ?? 'Failed to load')
      }
    } catch {
      toast.error('Failed to load fabric types')
    } finally {
      setLoading(false)
    }
  }, [page, deferredQ])

  React.useEffect(() => { fetchData() }, [fetchData])

  const openCreate = React.useCallback(() => {
    setDialogMode('create')
    setEditId(null)
    setForm(emptyForm())
    setDialogOpen(true)
  }, [])

  const openEdit = React.useCallback((row: FabricTypeRow) => {
    setDialogMode('edit')
    setEditId(row.id)
    setForm({ slug: row.slug, labelRu: row.labelRu, labelEn: row.labelEn ?? '', sortOrder: row.sortOrder })
    setDialogOpen(true)
  }, [])

  const handleSave = React.useCallback(async () => {
    setActionLoading('save')
    try {
      if (dialogMode === 'create') {
        const res = await fetch('/api/v1/admin/fabric-types', {
          method: 'POST',
          headers: { 'content-type': 'application/json' },
          body: JSON.stringify({
            slug: form.slug,
            label_ru: form.labelRu,
            label_en: form.labelEn || null,
            sort_order: form.sortOrder
          })
        })
        const json = await res.json()
        if (!res.ok) throw new Error(json.error?.message ?? 'Create failed')
        toast.success('Fabric type created')
      } else if (editId) {
        const body: Record<string, unknown> = {}
        if (form.slug) body.slug = form.slug
        if (form.labelRu) body.label_ru = form.labelRu
        body.label_en = form.labelEn || null
        body.sort_order = form.sortOrder

        const res = await fetch(`/api/v1/admin/fabric-types/${editId}`, {
          method: 'PATCH',
          headers: { 'content-type': 'application/json' },
          body: JSON.stringify(body)
        })
        const json = await res.json()
        if (!res.ok) throw new Error(json.error?.message ?? 'Update failed')
        toast.success('Fabric type updated')
      }
      setDialogOpen(false)
      await fetchData()
    } catch (e) {
      toast.error(e instanceof Error ? e.message : 'Save failed')
    } finally {
      setActionLoading(null)
    }
  }, [dialogMode, editId, form, fetchData])

  const handleDelete = React.useCallback(async (id: number) => {
    setActionLoading('archive')
    try {
      const res = await fetch(`/api/v1/admin/fabric-types/${id}`, { method: 'DELETE' })
      const json = await res.json()
      if (!res.ok) {
        if (json.error?.code === 'FABRIC_TYPE_IN_USE') {
          setDeleteConfirmId(null)
          setShowForceConfirm(id)
          toast.error(json.error.message)
          return
        }
        throw new Error(json.error?.message ?? 'Delete failed')
      }
      toast.success('Fabric type archived')
      setDeleteConfirmId(null)
      await fetchData()
    } catch (e) {
      toast.error(e instanceof Error ? e.message : 'Delete failed')
    } finally {
      setActionLoading(null)
    }
  }, [fetchData])

  const handleForceArchive = React.useCallback(async (id: number) => {
    setActionLoading('archive')
    try {
      const res = await fetch(`/api/v1/admin/fabric-types/${id}?force=true`, { method: 'DELETE' })
      const json = await res.json()
      if (!res.ok) throw new Error(json.error?.message ?? 'Archive failed')
      toast.success('Fabric type archived')
      setShowForceConfirm(null)
      await fetchData()
    } catch (e) {
      toast.error(e instanceof Error ? e.message : 'Archive failed')
    } finally {
      setActionLoading(null)
    }
  }, [fetchData])

  const handleRestore = React.useCallback(async (id: number) => {
    setActionLoading('restore')
    try {
      const res = await fetch(`/api/v1/admin/fabric-types/${id}/restore`, { method: 'POST' })
      const json = await res.json()
      if (!res.ok) throw new Error(json.error?.message ?? 'Restore failed')
      toast.success('Fabric type restored')
      setRestoreConfirmId(null)
      await fetchData()
    } catch (e) {
      toast.error(e instanceof Error ? e.message : 'Restore failed')
    } finally {
      setActionLoading(null)
    }
  }, [fetchData])

  const items = data?.items ?? []
  const meta = data?.meta
  const isActionRunning = actionLoading !== null

  if (loading && !data) return <FabricTypesSkeleton />

  return (
    <div className="space-y-6">
      <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h1 className="font-heading text-heading-xl font-extrabold tracking-tight">Fabric Types</h1>
          <p className="mt-1 text-sm text-on-surface-variant">
            Manage fabric types used in catalog filters and import.
          </p>
        </div>
        <div className="flex items-center gap-3">
          <Button
            type="button"
            variant="outline"
            className="rounded-full"
            onClick={fetchData}
            disabled={loading || isActionRunning}
            aria-label="Refresh data"
          >
            <RefreshCw className={cn('h-4 w-4 mr-2', loading ? 'animate-spin' : '')} aria-hidden />
            Refresh
          </Button>
          <Button
            type="button"
            className="rounded-full"
            onClick={openCreate}
            disabled={isActionRunning}
            aria-label="Add new fabric type"
          >
            <Plus className="h-4 w-4 mr-2" aria-hidden />
            Add Type
          </Button>
        </div>
      </div>

      <section
        className="rounded-2xl border border-outline/10 bg-surface-container-lowest/80 shadow-sm overflow-hidden dark:border-outline/15"
        aria-label="Fabric types"
      >
        <div className="flex flex-col gap-3 border-b border-outline/10 px-4 py-3 md:flex-row md:items-center md:justify-between">
          <div className="flex items-center gap-3">
            <div className="relative">
              <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-outline" aria-hidden />
              <Input
                value={q}
                onChange={(e) => { setQ(e.target.value); setPage(1) }}
                placeholder="Search slug…"
                className="h-9 w-full rounded-full pl-9 sm:w-[280px]"
                aria-label="Search by slug"
              />
            </div>
          </div>
          <div className="text-xs font-bold uppercase tracking-widest text-outline">
            {meta?.total.toLocaleString() ?? 0} total
          </div>
        </div>

        <div className="overflow-x-auto">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead className="min-w-[140px]">Slug</TableHead>
                <TableHead className="min-w-[180px]">Label (RU)</TableHead>
                <TableHead className="min-w-[180px]">Label (EN)</TableHead>
                <TableHead className="min-w-[80px]">Sort</TableHead>
                <TableHead className="min-w-[80px]">Fabrics</TableHead>
                <TableHead className="min-w-[120px]">Status</TableHead>
                <TableHead className="w-[80px]" />
              </TableRow>
            </TableHeader>
            <TableBody>
              {items.length === 0 ? (
                <TableRow>
                  <TableCell colSpan={7} className="py-10 text-center text-on-surface-variant">
                    No fabric types found.
                  </TableCell>
                </TableRow>
              ) : (
                items.map((row) => (
                  <TableRow
                    key={row.id}
                    className={row.deletedAt ? 'opacity-50' : ''}
                    aria-label={`${row.labelRu} (${row.slug})`}
                  >
                    <TableCell className="font-mono text-xs text-on-surface">{row.slug}</TableCell>
                    <TableCell className="font-medium">{row.labelRu}</TableCell>
                    <TableCell className="text-on-surface-variant">{row.labelEn ?? '—'}</TableCell>
                    <TableCell className="tabular-nums">{row.sortOrder}</TableCell>
                    <TableCell className="tabular-nums">{row.fabricCount}</TableCell>
                    <TableCell>
                      {row.deletedAt ? (
                        <span className="inline-flex items-center rounded-full bg-error/10 px-2.5 py-0.5 text-xs font-medium text-error">
                          Archived
                        </span>
                      ) : (
                        <span className="inline-flex items-center rounded-full bg-success/10 px-2.5 py-0.5 text-xs font-medium text-success">
                          Active
                        </span>
                      )}
                    </TableCell>
                    <TableCell className="text-right">
                      <DropdownMenu>
                        <DropdownMenuTrigger asChild>
                          <Button variant="ghost" size="icon" className="h-8 w-8 rounded-full" aria-label="Actions">
                            <MoreHorizontal className="h-4 w-4" aria-hidden />
                          </Button>
                        </DropdownMenuTrigger>
                        <DropdownMenuContent align="end" className="w-40">
                          {row.deletedAt ? (
                            <DropdownMenuItem
                              onClick={() => setRestoreConfirmId(row.id)}
                              disabled={isActionRunning}
                            >
                              Restore
                            </DropdownMenuItem>
                          ) : (
                            <>
                              <DropdownMenuItem onClick={() => openEdit(row)} disabled={isActionRunning}>
                                Edit
                              </DropdownMenuItem>
                              <DropdownMenuItem
                                onClick={() => setDeleteConfirmId(row.id)}
                                disabled={isActionRunning}
                                className="text-destructive focus:text-destructive"
                              >
                                Archive
                              </DropdownMenuItem>
                            </>
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
          pageSize={meta?.limit ?? 50}
          totalItems={meta?.total ?? 0}
          onPageChange={(p) => setPage(p)}
          disabled={loading || isActionRunning}
        />
      </section>

      <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
        <DialogContent className="sm:max-w-lg">
          <DialogHeader>
            <DialogTitle>{dialogMode === 'create' ? 'Add Fabric Type' : 'Edit Fabric Type'}</DialogTitle>
            <DialogDescription>
              {dialogMode === 'create'
                ? 'Add a new fabric type for catalog filters and import.'
                : 'Update the fabric type details.'}
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4">
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <label htmlFor="slug" className="text-sm font-medium">Slug</label>
                <Input
                  id="slug"
                  value={form.slug}
                  onChange={(e) => setForm((f) => ({ ...f, slug: e.target.value }))}
                  placeholder="e.g. denim"
                  disabled={isActionRunning || dialogMode === 'edit'}
                  aria-describedby={dialogMode === 'edit' ? 'slug-disabled-hint' : undefined}
                />
                {dialogMode === 'edit' && (
                  <p id="slug-disabled-hint" className="text-xs text-on-surface-variant">
                    Slug cannot be changed after creation.
                  </p>
                )}
              </div>
              <div className="space-y-2">
                <label htmlFor="sortOrder" className="text-sm font-medium">Sort Order</label>
                <Input
                  id="sortOrder"
                  type="number"
                  min={0}
                  max={9999}
                  value={form.sortOrder}
                  onChange={(e) => setForm((f) => ({ ...f, sortOrder: Number(e.target.value) }))}
                  disabled={isActionRunning}
                />
              </div>
            </div>
            <div className="space-y-2">
              <label htmlFor="labelRu" className="text-sm font-medium">Label (RU)</label>
              <Input
                id="labelRu"
                value={form.labelRu}
                onChange={(e) => setForm((f) => ({ ...f, labelRu: e.target.value }))}
                placeholder="Russian name"
                disabled={isActionRunning}
              />
            </div>
            <div className="space-y-2">
              <label htmlFor="labelEn" className="text-sm font-medium">Label (EN)</label>
              <Input
                id="labelEn"
                value={form.labelEn}
                onChange={(e) => setForm((f) => ({ ...f, labelEn: e.target.value }))}
                placeholder="English name (optional)"
                disabled={isActionRunning}
              />
            </div>
          </div>
          <div className="flex justify-end gap-3 pt-4">
            <Button variant="outline" onClick={() => setDialogOpen(false)} disabled={isActionRunning}>
              Cancel
            </Button>
            <Button
              onClick={handleSave}
              disabled={isActionRunning || !form.slug || !form.labelRu}
            >
              {actionLoading === 'save' ? 'Saving…' : dialogMode === 'create' ? 'Create' : 'Save'}
            </Button>
          </div>
        </DialogContent>
      </Dialog>

      <Dialog open={deleteConfirmId !== null} onOpenChange={(o) => { if (!o) setDeleteConfirmId(null) }}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle>Archive fabric type?</DialogTitle>
            <DialogDescription>
              This will hide the type from catalog filters. It can be restored later.
              Fabrics using this type will keep their current value.
            </DialogDescription>
          </DialogHeader>
          <div className="flex justify-end gap-3 pt-4">
            <Button variant="outline" onClick={() => setDeleteConfirmId(null)} disabled={isActionRunning}>
              Cancel
            </Button>
            <Button
              variant="destructive"
              onClick={() => deleteConfirmId && handleDelete(deleteConfirmId)}
              disabled={isActionRunning}
            >
              {actionLoading === 'archive' ? 'Archiving…' : 'Archive'}
            </Button>
          </div>
        </DialogContent>
      </Dialog>

      <Dialog open={showForceConfirm !== null} onOpenChange={(o) => { if (!o) setShowForceConfirm(null) }}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle>Force archive?</DialogTitle>
            <DialogDescription>
              <span className="block mb-2">
                <strong className="text-on-surface">One or more fabrics</strong> still use this type.
                Archiving will remove it from filter options, but existing fabrics will keep the value.
              </span>
              <span className="block text-xs text-on-surface-variant">
                Alternatively, reassign those fabrics to a different type first, then archive.
              </span>
            </DialogDescription>
          </DialogHeader>
          <div className="flex justify-end gap-3 pt-4">
            <Button variant="outline" onClick={() => setShowForceConfirm(null)} disabled={isActionRunning}>
              Cancel
            </Button>
            <Button
              variant="destructive"
              onClick={() => showForceConfirm && handleForceArchive(showForceConfirm)}
              disabled={isActionRunning}
            >
              {actionLoading === 'archive' ? 'Archiving…' : 'Force Archive'}
            </Button>
          </div>
        </DialogContent>
      </Dialog>

      <Dialog open={restoreConfirmId !== null} onOpenChange={(o) => { if (!o) setRestoreConfirmId(null) }}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle>Restore fabric type?</DialogTitle>
            <DialogDescription>
              This will make the type available in catalog filters again.
            </DialogDescription>
          </DialogHeader>
          <div className="flex justify-end gap-3 pt-4">
            <Button variant="outline" onClick={() => setRestoreConfirmId(null)} disabled={isActionRunning}>
              Cancel
            </Button>
            <Button
              onClick={() => restoreConfirmId && handleRestore(restoreConfirmId)}
              disabled={isActionRunning}
            >
              {actionLoading === 'restore' ? 'Restoring…' : 'Restore'}
            </Button>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  )
}
