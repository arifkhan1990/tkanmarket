'use client'

import { useRouter } from 'next/navigation'
import { Check, GitCompare } from 'lucide-react'
import { useEffect, useState } from 'react'
import { toast } from 'sonner'

import { Button } from '@/components/ui/button'
import { useI18n } from '@/hooks/useI18n'
import {
  addCompareId,
  COMPARE_LIST_CHANGED_EVENT,
  FABRIC_COMPARE_MAX,
  FABRIC_COMPARE_STORAGE_KEY,
  getStoredCompareIds,
  removeStoredCompareId
} from '@/lib/compare/compare-storage'
import { cn } from '@/lib/utils'
import type { Locale } from '@/types/i18n.types'
import { withLocaleUrl } from '@/lib/i18n/locale-path'

export function FabricCompareButton({ fabricId, locale }: { fabricId: number; locale: Locale }) {
  const router = useRouter()
  const { messages: m } = useI18n()
  const c = m.fabrics.compare
  const [ids, setIds] = useState<number[]>([])

  useEffect(() => {
    const sync = () => setIds(getStoredCompareIds())
    sync()
    const onStorage = (e: StorageEvent) => {
      if (e.key === FABRIC_COMPARE_STORAGE_KEY) sync()
    }
    window.addEventListener(COMPARE_LIST_CHANGED_EVENT, sync)
    window.addEventListener('storage', onStorage)
    return () => {
      window.removeEventListener(COMPARE_LIST_CHANGED_EVENT, sync)
      window.removeEventListener('storage', onStorage)
    }
  }, [])

  const isInCompare = ids.includes(fabricId)
  const isFull = ids.length >= FABRIC_COMPARE_MAX && !isInCompare

  const ariaLabel = isInCompare ? c.removeFromCompare : isFull ? c.compareFull : c.addToCompare

  return (
    <Button
      type="button"
      variant="secondary"
      size="icon"
      disabled={isFull}
      className={cn(
        'rounded-full border-0 shadow-md ring-1 backdrop-blur-md transition-colors',
        isInCompare
          ? 'bg-primary text-on-primary ring-white/30 hover:bg-brand-700'
          : 'bg-black/65 text-white ring-white/15 hover:bg-primary hover:text-on-primary hover:ring-white/30',
        isFull && 'cursor-not-allowed opacity-60 hover:bg-black/65 hover:text-white hover:ring-white/15'
      )}
      onClick={(e) => {
        e.preventDefault()
        e.stopPropagation()

        // Toggle off if already in the compare list
        if (isInCompare) {
          const next = removeStoredCompareId(fabricId)
          setIds(next)
          toast.success(c.removedFromCompare)
          return
        }

        const r = addCompareId(fabricId)
        if (!r.ok) {
          if (r.reason === 'max') toast.error(c.compareFull)
          else if (r.reason === 'storage') toast.error(c.compareStorageError)
          else toast.message(c.alreadyInCompare)
          return
        }

        setIds(r.ids)
        toast.success(c.addedToCompare, {
          action: {
            label: c.viewCompare,
            onClick: () => router.push(withLocaleUrl('/fabrics/compare', locale))
          }
        })
      }}
      aria-label={ariaLabel}
      aria-pressed={isInCompare}
      title={ariaLabel}
    >
      {isInCompare ? <Check className="h-4 w-4" aria-hidden /> : <GitCompare className="h-4 w-4" aria-hidden />}
    </Button>
  )
}
