'use client'

import Link from 'next/link'
import { ExternalLink, Monitor, RefreshCw, Smartphone, Sparkles } from 'lucide-react'

import { AdminFabricDraftPicker } from '@/components/admin/fabric-draft/admin-fabric-draft-picker'
import { Button } from '@/components/ui/button'
import { withLocaleUrl } from '@/lib/i18n/locale-path'
import { cn } from '@/lib/utils'
import { DEFAULT_LOCALE, type Locale } from '@/types/i18n.types'

export type DraftPreviewViewportMode = 'desktop' | 'mobile'

export interface DraftPreviewHeaderCopy {
  title: string
  subtitle: string
  viewport: string
  desktop: string
  mobile: string
  refresh: string
  openEditor: string
  pickFabric: string
}

export function AdminFabricDraftPreviewHeader(props: {
  p: DraftPreviewHeaderCopy
  viewport: DraftPreviewViewportMode
  setViewport: (v: DraftPreviewViewportMode) => void
  locale: Locale
  fabricId: number | null
  isFetching: boolean
  onRefresh: () => void
  onSelectId: (id: number) => void
}) {
  const { p, viewport, setViewport, locale, fabricId, isFetching, onRefresh, onSelectId } = props

  return (
    <header className="space-y-4">
      <div className="flex flex-col gap-4 lg:flex-row lg:items-end lg:justify-between">
        <div className="min-w-0">
          <div className="flex items-center gap-2">
            <Sparkles className="h-5 w-5 shrink-0 text-primary" aria-hidden />
            <h1 className="font-heading text-2xl font-extrabold tracking-tight text-on-surface md:text-3xl">
              {p.title}
            </h1>
          </div>
          <p className="mt-2 max-w-2xl text-sm text-on-surface-variant">{p.subtitle}</p>
        </div>

        <div className="flex flex-wrap items-center gap-2">
          <span className="sr-only">{p.viewport}</span>
          <div className="flex items-center gap-1 rounded-full border border-outline/15 bg-surface-container-low p-1">
            <button
              type="button"
              onClick={() => setViewport('desktop')}
              className={cn(
                'flex items-center gap-2 rounded-full px-3 py-1.5 text-xs font-bold transition-colors',
                viewport === 'desktop'
                  ? 'bg-surface-container-lowest text-primary shadow-sm'
                  : 'text-on-surface-variant hover:text-on-surface'
              )}
              aria-pressed={viewport === 'desktop'}
            >
              <Monitor className="h-3.5 w-3.5" aria-hidden />
              {p.desktop}
            </button>
            <button
              type="button"
              onClick={() => setViewport('mobile')}
              className={cn(
                'flex items-center gap-2 rounded-full px-3 py-1.5 text-xs font-bold transition-colors',
                viewport === 'mobile'
                  ? 'bg-surface-container-lowest text-primary shadow-sm'
                  : 'text-on-surface-variant hover:text-on-surface'
              )}
              aria-pressed={viewport === 'mobile'}
            >
              <Smartphone className="h-3.5 w-3.5" aria-hidden />
              {p.mobile}
            </button>
          </div>

          {fabricId != null ? (
            <Button
              type="button"
              size="sm"
              variant="outline"
              className="rounded-full"
              onClick={onRefresh}
              disabled={isFetching}
            >
              <RefreshCw className={cn('mr-2 h-4 w-4', isFetching && 'animate-spin')} aria-hidden />
              {p.refresh}
            </Button>
          ) : null}

          {fabricId != null ? (
            <Button asChild type="button" size="sm" variant="outline" className="rounded-full">
              <Link href={withLocaleUrl(`/admin/fabrics/${fabricId}`, locale ?? DEFAULT_LOCALE)}>
                <ExternalLink className="mr-2 h-4 w-4" aria-hidden />
                {p.openEditor}
              </Link>
            </Button>
          ) : null}
        </div>
      </div>

      <div className="space-y-1">
        <label htmlFor="fabric-id" className="text-xs font-semibold text-on-surface-variant">
          {p.pickFabric}
        </label>
        <div className="w-full sm:w-[520px]">
          <AdminFabricDraftPicker
            valueId={typeof fabricId === 'number' && fabricId > 0 ? fabricId : null}
            onSelectId={onSelectId}
            placeholder="Select a fabric…"
            className="max-w-xs sm:max-w-none"
          />
        </div>
      </div>
    </header>
  )
}

