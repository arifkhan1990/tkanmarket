'use client'

import { usePathname, useRouter } from 'next/navigation'
import { useSession } from 'next-auth/react'
import { Heart, Loader2 } from 'lucide-react'

import {
  useBuyerWishlistRemoveMutation,
  useWishlistAddMutation
} from '@/hooks/useBuyerWishlist'
import { useI18n } from '@/hooks/useI18n'
import { ensureLocaleInUrl } from '@/lib/i18n/locale-path'
import { cn } from '@/lib/utils'
import { Button } from '@/components/ui/button'

type Props = {
  fabricId: number
  /** When provided (e.g. from batch API), drives filled heart and toggle remove. */
  wishlistSaved: boolean
  /** Heart button corner (featured cards use left so rating can sit top-right). */
  corner?: 'left' | 'right'
  /**
   * `floating` — absolute positioned (default).
   * `inline` — no absolute; use inside a parent flex toolbar next to badges.
   */
  variant?: 'floating' | 'inline'
  /** Smaller hit target for dense layouts (e.g. list row thumbnail). */
  compact?: boolean
}

export function FabricCardWishlistOverlay({
  fabricId,
  wishlistSaved,
  corner = 'right',
  variant = 'floating',
  compact = false
}: Props) {
  const pathname = usePathname()
  const router = useRouter()
  const { status } = useSession()
  const { messages } = useI18n()
  const add = useWishlistAddMutation()
  const remove = useBuyerWishlistRemoveMutation()

  const loginHref = `/admin/login?callbackUrl=${encodeURIComponent(ensureLocaleInUrl(pathname))}`

  const cornerCls = corner === 'left' ? 'left-3 top-3' : 'right-3 top-3'
  const positionCls = variant === 'inline' ? 'relative shrink-0' : cn('absolute z-10', cornerCls)
  const sizeCls = compact ? 'h-8 w-8' : 'h-10 w-10'
  const iconCls = compact ? 'h-4 w-4' : 'h-5 w-5'

  if (status === 'loading') {
    return (
      <div
        className={cn(
          'pointer-events-none rounded-full bg-black/40 ring-1 ring-white/15 backdrop-blur-md',
          sizeCls,
          positionCls
        )}
        aria-hidden
      />
    )
  }

  if (status === 'unauthenticated') {
    return (
      <Button
        type="button"
        size="icon"
        variant="secondary"
        className={cn(
          'rounded-full border-0 bg-black/65 text-white shadow-md ring-1 ring-white/15 backdrop-blur-md hover:bg-primary hover:text-on-primary hover:ring-white/30',
          sizeCls,
          positionCls
        )}
        aria-label={messages.fabricDetailClient.signInToSave}
        onClick={(e) => {
          e.preventDefault()
          e.stopPropagation()
          router.push(loginHref)
        }}
      >
        <Heart className={iconCls} aria-hidden />
      </Button>
    )
  }

  const busy = add.isPending || remove.isPending
  const ariaLabel = wishlistSaved
    ? messages.fabricDetailClient.savedToWishlist
    : messages.fabricDetailClient.saveToWishlist

  return (
    <Button
      type="button"
      size="icon"
      variant="secondary"
      disabled={busy}
      aria-pressed={wishlistSaved}
      aria-busy={busy}
      aria-label={ariaLabel}
      title={ariaLabel}
      className={cn(
        'rounded-full border-0 shadow-md ring-1 backdrop-blur-md transition-colors',
        sizeCls,
        positionCls,
        wishlistSaved
          ? 'bg-rose-500 text-white ring-white/30 hover:bg-rose-600'
          : 'bg-black/65 text-white ring-white/15 hover:bg-primary hover:ring-white/30'
      )}
      onClick={(e) => {
        e.preventDefault()
        e.stopPropagation()
        if (busy) return
        if (wishlistSaved) {
          remove.mutate(fabricId)
        } else {
          add.mutate(fabricId)
        }
      }}
    >
      {busy ? (
        <Loader2 className={cn(iconCls, 'animate-spin')} aria-hidden />
      ) : (
        <Heart className={cn(iconCls, wishlistSaved && 'fill-current')} aria-hidden />
      )}
    </Button>
  )
}
