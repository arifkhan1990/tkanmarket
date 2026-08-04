'use client'

import { useRouter, useSearchParams } from 'next/navigation'
import { X } from 'lucide-react'

import { Button } from '@/components/ui/button'
import type { FabricQueryParams } from '@/lib/validations/fabric.validation'
import { withLocaleUrl } from '@/lib/i18n/locale-path'
import { useI18n } from '@/hooks/useI18n'

type FabricFilters = FabricQueryParams

function getFabricTypeLabel(v: NonNullable<FabricFilters['fabric_type']>, labels: Record<string, string>) {
  return labels[String(v)] ?? labels.other
}

function removeParam(sp: URLSearchParams, key: string, value?: string) {
  const next = new URLSearchParams(sp.toString())
  if (value === undefined) {
    next.delete(key)
  } else {
    const values = next.getAll(key).filter((v) => v !== value)
    next.delete(key)
    for (const v of values) next.append(key, v)
  }
  next.delete('page')
  return next
}

function clearKeys(sp: URLSearchParams, keys: string[]) {
  const next = new URLSearchParams(sp.toString())
  for (const k of keys) next.delete(k)
  next.delete('page')
  return next
}

export function ActiveFilterTags({ currentFilters }: { currentFilters: FabricFilters }) {
  const router = useRouter()
  const sp = useSearchParams()
  const { locale, messages } = useI18n()

  const tags: Array<{ label: string; onRemove: () => void }> = []

  for (const m of currentFilters.material ?? []) {
    tags.push({
      label: m,
      onRemove: () => router.push(withLocaleUrl(`/fabrics?${removeParam(sp, 'material', m).toString()}`, locale))
    })
  }

  if (currentFilters.fabric_type) {
    tags.push({
      label: `${messages.product.specs.type}: ${getFabricTypeLabel(currentFilters.fabric_type, messages.fabrics.filters.types as unknown as Record<string, string>)}`,
      onRemove: () => router.push(withLocaleUrl(`/fabrics?${removeParam(sp, 'fabric_type').toString()}`, locale))
    })
  }

  if (currentFilters.category_slug && currentFilters.category_slug.trim().length > 0) {
    const slug = currentFilters.category_slug.trim()
    tags.push({
      label: `${messages.fabrics.filters.catalogCategoryTag}: ${slug}`,
      onRemove: () => router.push(withLocaleUrl(`/fabrics?${removeParam(sp, 'category_slug').toString()}`, locale))
    })
  }

  if (typeof currentFilters.gsm_min === 'number' || typeof currentFilters.gsm_max === 'number') {
    const from = typeof currentFilters.gsm_min === 'number' ? currentFilters.gsm_min : '—'
    const to = typeof currentFilters.gsm_max === 'number' ? currentFilters.gsm_max : '—'
    tags.push({
      label: `${messages.fabricCard.gsmUnit}: ${from}–${to}`,
      onRemove: () => router.push(withLocaleUrl(`/fabrics?${clearKeys(sp, ['gsm_min', 'gsm_max']).toString()}`, locale))
    })
  }

  if (typeof currentFilters.price_usd_min === 'number' || typeof currentFilters.price_usd_max === 'number') {
    const from = typeof currentFilters.price_usd_min === 'number' ? currentFilters.price_usd_min : '—'
    const to = typeof currentFilters.price_usd_max === 'number' ? currentFilters.price_usd_max : '—'
    tags.push({
      label: `${messages.product.specs.price}: $${from}–$${to}`,
      onRemove: () =>
        router.push(withLocaleUrl(`/fabrics?${clearKeys(sp, ['price_usd_min', 'price_usd_max']).toString()}`, locale))
    })
  }

  if (typeof currentFilters.width_min === 'number' || typeof currentFilters.width_max === 'number') {
    const from = typeof currentFilters.width_min === 'number' ? currentFilters.width_min : '—'
    const to = typeof currentFilters.width_max === 'number' ? currentFilters.width_max : '—'
    tags.push({
      label: `${messages.fabrics.filters.width}: ${from}–${to}`,
      onRemove: () =>
        router.push(withLocaleUrl(`/fabrics?${clearKeys(sp, ['width_min', 'width_max', 'width']).toString()}`, locale))
    })
  }
  if (
    typeof currentFilters.width === 'number' &&
    typeof currentFilters.width_min !== 'number' &&
    typeof currentFilters.width_max !== 'number'
  ) {
    tags.push({
      label: `${messages.fabrics.filters.width}: ${currentFilters.width} cm`,
      onRemove: () => router.push(withLocaleUrl(`/fabrics?${removeParam(sp, 'width').toString()}`, locale))
    })
  }

  if (typeof currentFilters.moq_min === 'number' || typeof currentFilters.moq_max === 'number') {
    const from = typeof currentFilters.moq_min === 'number' ? currentFilters.moq_min : '—'
    const to = typeof currentFilters.moq_max === 'number' ? currentFilters.moq_max : '—'
    tags.push({
      label: `${messages.fabrics.filters.moq}: ${from}–${to}`,
      onRemove: () => router.push(withLocaleUrl(`/fabrics?${clearKeys(sp, ['moq_min', 'moq_max']).toString()}`, locale))
    })
  }

  if (currentFilters.q) {
    tags.push({
      label: `${messages.suppliers.searchLabel}: ${currentFilters.q}`,
      onRemove: () => router.push(withLocaleUrl(`/fabrics?${removeParam(sp, 'q').toString()}`, locale))
    })
  }

  if (tags.length === 0) return null

  return (
    <div className="flex flex-wrap gap-2">
      {tags.map((t, idx) => (
        <div key={`${idx}-${t.label}`} className="inline-flex items-center gap-2 rounded-full bg-surface-container-low px-3 py-2">
          <span className="text-xs font-bold text-on-surface-variant">{t.label}</span>
          <Button
            type="button"
            variant="ghost"
            size="icon"
            className="h-6 w-6 rounded-full"
            onClick={t.onRemove}
            aria-label={messages.a11y.removeFilterTemplate.replace('{label}', t.label)}
          >
            <X className="h-3 w-3" aria-hidden />
          </Button>
        </div>
      ))}
    </div>
  )
}

