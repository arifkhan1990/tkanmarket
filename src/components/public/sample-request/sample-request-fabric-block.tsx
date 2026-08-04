import Image from 'next/image'
import Link from 'next/link'
import { Loader2, Package, Trash2 } from 'lucide-react'

import { Button } from '@/components/ui/button'
import { withLocaleUrl } from '@/lib/i18n/locale-path'
import { isRemoteImageSrc } from '@/lib/utils'
import type { FabricDetail } from '@/types/marketplace.types'
import type { Locale } from '@/types/i18n.types'
import { getLocalizedFabricTitle } from '@/lib/i18n/localized-fabric'

import type { Messages } from '@/lib/i18n/get-messages'

type SD = Messages['leads']['sampleDedicated']

export function fabricPrimaryImage(fabric: FabricDetail): string | null {
  return fabric.imageUrl ?? fabric.images[0] ?? null
}

export function fabricTitleForLocale(fabric: FabricDetail, locale: Locale): string {
  return getLocalizedFabricTitle(fabric, locale)
}

type Props = {
  m: SD
  locale: Locale
  fabricParam: string
  isLoading: boolean
  isError: boolean
  fabric: FabricDetail | undefined
  onClearFabric: () => void
}

export function SampleRequestFabricBlock({
  m,
  locale,
  fabricParam,
  isLoading,
  isError,
  fabric,
  onClearFabric
}: Props) {
  const fabricImage = fabric ? fabricPrimaryImage(fabric) : null
  const fabricLabel = fabric ? fabricTitleForLocale(fabric, locale) : null

  if (!fabricParam) {
    return (
      <div className="space-y-4 border-t border-surface-container-high pt-6">
        <h3 className="text-lg font-bold text-on-surface">{m.fabricSection}</h3>
        <div className="rounded-3xl border border-dashed border-outline-variant/50 bg-surface-container-low/50 p-4 text-sm text-on-surface-variant">
          <p className="font-medium text-on-surface">{m.fabricGeneric}</p>
          <p className="mt-1 text-xs">{m.fabricGenericHint}</p>
          <Button asChild variant="link" className="mt-2 h-auto p-0 text-primary">
            <Link href={withLocaleUrl('/fabrics', locale)}>{m.browseCatalog}</Link>
          </Button>
        </div>
      </div>
    )
  }

  return (
    <div className="space-y-4 border-t border-surface-container-high pt-6">
      <h3 className="text-lg font-bold text-on-surface">{m.fabricSection}</h3>
      {isLoading ? (
        <div className="flex items-center gap-3 rounded-3xl border border-outline-variant/30 bg-surface-container-low p-4">
          <Loader2 className="h-5 w-5 shrink-0 animate-spin text-primary" aria-hidden />
          <p className="text-sm text-on-surface-variant">{m.fabricLoading}</p>
        </div>
      ) : isError || !fabric ? (
        <p className="text-sm text-destructive">{m.fabricGenericHint}</p>
      ) : (
        <div className="flex flex-col gap-3 rounded-3xl border border-outline-variant/30 bg-surface-container-low p-4 sm:flex-row sm:items-center sm:justify-between">
          <div className="flex min-w-0 items-center gap-4">
            <div className="relative h-14 w-14 shrink-0 overflow-hidden rounded-2xl border border-outline/10 bg-surface-container-highest shadow-sm">
              {fabricImage ? (
                <Image
                  src={fabricImage}
                  alt={fabricLabel ?? ''}
                  fill
                  className="object-cover"
                  sizes="56px"
                  unoptimized={isRemoteImageSrc(fabricImage)}
                />
              ) : (
                <div className="flex h-full w-full items-center justify-center text-primary">
                  <Package className="h-7 w-7" aria-hidden />
                </div>
              )}
            </div>
            <div className="min-w-0">
              <p className="text-sm font-bold text-on-surface">
                {m.fabricIdLabel}: #{fabric.id}
              </p>
              <p className="truncate text-xs text-on-surface-variant">{fabricLabel}</p>
            </div>
          </div>
          <Button
            type="button"
            variant="ghost"
            size="icon"
            className="shrink-0 self-end text-destructive hover:bg-error-container/30 sm:self-center"
            onClick={onClearFabric}
            aria-label={m.clearFabric}
          >
            <Trash2 className="h-4 w-4" />
          </Button>
        </div>
      )}
    </div>
  )
}
