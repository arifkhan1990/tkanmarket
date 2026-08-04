'use client'

import * as React from 'react'
import { Plus } from 'lucide-react'

import { Button } from '@/components/ui/button'
import { Checkbox } from '@/components/ui/checkbox'
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog'
import { Input } from '@/components/ui/input'
import { Textarea } from '@/components/ui/textarea'
import type {
  AdminFabricCategoryTerm,
  AdminFabricCategoryTermCreateInput,
  AdminFabricCategoryTermUpdateInput
} from '@/types/admin-fabric-category-terms.types'

type CategoryDraft = {
  slug: string
  name_ru: string
  name_en: string
  description_ru: string
  description_en: string
  sort_order: string
  is_active: boolean
}

function draftFromCategory(row?: AdminFabricCategoryTerm | null): CategoryDraft {
  return {
    slug: row?.slug ?? '',
    name_ru: row?.name_ru ?? '',
    name_en: row?.name_en ?? '',
    description_ru: row?.description_ru ?? '',
    description_en: row?.description_en ?? '',
    sort_order: String(row?.sort_order ?? 0),
    is_active: row?.is_active ?? true
  }
}

function normalizeCreateDraft(d: CategoryDraft): AdminFabricCategoryTermCreateInput {
  const sort = Number(d.sort_order)
  return {
    slug: d.slug.trim(),
    name_ru: d.name_ru.trim(),
    name_en: d.name_en.trim().length > 0 ? d.name_en.trim() : null,
    description_ru: d.description_ru.trim().length > 0 ? d.description_ru.trim() : null,
    description_en: d.description_en.trim().length > 0 ? d.description_en.trim() : null,
    sort_order: Number.isFinite(sort) ? Math.trunc(sort) : 0,
    is_active: d.is_active
  }
}

function normalizeUpdateDraft(d: CategoryDraft): AdminFabricCategoryTermUpdateInput {
  const sort = Number(d.sort_order)
  return {
    slug: d.slug.trim(),
    name_ru: d.name_ru.trim(),
    name_en: d.name_en.trim().length > 0 ? d.name_en.trim() : null,
    description_ru: d.description_ru.trim().length > 0 ? d.description_ru.trim() : null,
    description_en: d.description_en.trim().length > 0 ? d.description_en.trim() : null,
    sort_order: Number.isFinite(sort) ? Math.trunc(sort) : 0,
    is_active: d.is_active
  }
}

export function FabricCategoryEditorDialog(props: {
  mode: 'create' | 'edit'
  row?: AdminFabricCategoryTerm
  onCreate?: (input: AdminFabricCategoryTermCreateInput) => Promise<void>
  onUpdate?: (id: number, patch: AdminFabricCategoryTermUpdateInput) => Promise<void>
  busy?: boolean
  triggerVariant?: 'primary' | 'inline'
}) {
  const [open, setOpen] = React.useState(false)
  const [draft, setDraft] = React.useState<CategoryDraft>(() => draftFromCategory(props.row))

  React.useEffect(() => {
    if (!open) return
    setDraft(draftFromCategory(props.row))
  }, [open, props.row])

  const title = props.mode === 'create' ? 'Create category' : 'Edit category'
  const description =
    props.mode === 'create'
      ? 'Categories are used in admin filters, taxonomy, and the public catalog.'
      : 'Changes apply immediately across filters and taxonomy.'

  const onSubmit = async () => {
    if (props.mode === 'create') {
      if (!props.onCreate) return
      await props.onCreate(normalizeCreateDraft(draft))
      setOpen(false)
    } else {
      if (!props.row || !props.onUpdate) return
      await props.onUpdate(props.row.id, normalizeUpdateDraft(draft))
      setOpen(false)
    }
  }

  return (
    <Dialog open={open} onOpenChange={(v) => !props.busy && setOpen(v)}>
      <DialogTrigger asChild>
        {props.mode === 'create' ? (
          <Button className="rounded-full">
            <Plus className="h-4 w-4 mr-2" aria-hidden />
            Add category
          </Button>
        ) : (
          <Button variant="secondary" className="h-8 rounded-full px-3">
            Edit
          </Button>
        )}
      </DialogTrigger>
      <DialogContent className="max-w-2xl">
        <DialogHeader>
          <DialogTitle>{title}</DialogTitle>
          <DialogDescription>{description}</DialogDescription>
        </DialogHeader>

        <div className="grid gap-4 md:grid-cols-2">
          <div className="space-y-2">
            <label htmlFor="slug" className="text-sm font-semibold text-on-surface">
              Slug
            </label>
            <Input
              id="slug"
              value={draft.slug}
              onChange={(e) => setDraft((p) => ({ ...p, slug: e.target.value }))}
              placeholder="e.g. cotton"
              className="rounded-xl"
              disabled={props.busy}
            />
          </div>
          <div className="space-y-2">
            <label htmlFor="sort" className="text-sm font-semibold text-on-surface">
              Sort order
            </label>
            <Input
              id="sort"
              value={draft.sort_order}
              onChange={(e) => setDraft((p) => ({ ...p, sort_order: e.target.value }))}
              inputMode="numeric"
              className="rounded-xl font-mono"
              disabled={props.busy}
            />
          </div>

          <div className="space-y-2">
            <label htmlFor="name-ru" className="text-sm font-semibold text-on-surface">
              Name (RU)
            </label>
            <Input
              id="name-ru"
              value={draft.name_ru}
              onChange={(e) => setDraft((p) => ({ ...p, name_ru: e.target.value }))}
              placeholder="e.g. Хлопок"
              className="rounded-xl"
              disabled={props.busy}
            />
          </div>
          <div className="space-y-2">
            <label htmlFor="name-en" className="text-sm font-semibold text-on-surface">
              Name (EN)
            </label>
            <Input
              id="name-en"
              value={draft.name_en}
              onChange={(e) => setDraft((p) => ({ ...p, name_en: e.target.value }))}
              placeholder="e.g. Cotton"
              className="rounded-xl"
              disabled={props.busy}
            />
          </div>

          <div className="space-y-2 md:col-span-2">
            <label htmlFor="desc-ru" className="text-sm font-semibold text-on-surface">
              Description (RU)
            </label>
            <Textarea
              id="desc-ru"
              value={draft.description_ru}
              onChange={(e) => setDraft((p) => ({ ...p, description_ru: e.target.value }))}
              className="min-h-20 rounded-xl"
              disabled={props.busy}
            />
          </div>
          <div className="space-y-2 md:col-span-2">
            <label htmlFor="desc-en" className="text-sm font-semibold text-on-surface">
              Description (EN)
            </label>
            <Textarea
              id="desc-en"
              value={draft.description_en}
              onChange={(e) => setDraft((p) => ({ ...p, description_en: e.target.value }))}
              className="min-h-20 rounded-xl"
              disabled={props.busy}
            />
          </div>

          <div className="flex items-center gap-3 md:col-span-2">
            <Checkbox
              id="active"
              checked={draft.is_active}
              onCheckedChange={(v) => setDraft((p) => ({ ...p, is_active: Boolean(v) }))}
              disabled={props.busy}
            />
            <label htmlFor="active" className="cursor-pointer text-sm font-semibold text-on-surface">
              Active (visible in filters)
            </label>
          </div>
        </div>

        <div className="mt-6 flex flex-col-reverse gap-2 sm:flex-row sm:justify-end">
          <Button variant="outline" className="rounded-full" onClick={() => setOpen(false)} disabled={props.busy}>
            Cancel
          </Button>
          <Button className="rounded-full" onClick={onSubmit} disabled={props.busy}>
            {props.mode === 'create' ? 'Create' : 'Save'}
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  )
}

