'use client'

import Link from 'next/link'
import { usePathname } from 'next/navigation'
import { useSession } from 'next-auth/react'
import { Heart, Loader2 } from 'lucide-react'

import {
  useBuyerWishlistRemoveMutation,
  useWishlistAddMutation,
  useWishlistStatusQuery
} from '@/hooks/useBuyerWishlist'
import { useI18n } from '@/hooks/useI18n'
import { ensureLocaleInUrl, getLocaleFromPathname, withLocaleUrl } from '@/lib/i18n/locale-path'
import { DEFAULT_LOCALE } from '@/types/i18n.types'
import type { Locale } from '@/types/i18n.types'
import { Button } from '@/components/ui/button'

export function FabricDetailWishlistButton({ fabricId }: { fabricId: number }) {
  const pathname = usePathname()
  const locale: Locale = getLocaleFromPathname(pathname) ?? DEFAULT_LOCALE
  const { status } = useSession()
  const { messages } = useI18n()

  const enabled = status === 'authenticated'
  const statusQuery = useWishlistStatusQuery(fabricId, enabled)
  const add = useWishlistAddMutation()
  const remove = useBuyerWishlistRemoveMutation()

  const loginHref = `/admin/login?callbackUrl=${encodeURIComponent(ensureLocaleInUrl(pathname))}`
  const wishlistHref = withLocaleUrl('/wishlist', locale)

  if (status === 'loading') {
    return (
      <Button type="button" variant="outline" className="flex-1 rounded-3xl" disabled>
        <Heart className="mr-2 h-4 w-4 opacity-50" aria-hidden />
        {messages.common.ellipsis}
      </Button>
    )
  }

  if (status === 'unauthenticated') {
    return (
      <Button type="button" variant="outline" className="flex-1 rounded-3xl" asChild>
        <Link href={loginHref}>
          <Heart className="mr-2 h-4 w-4" aria-hidden />
          {messages.fabricDetailClient.signInToSave}
        </Link>
      </Button>
    )
  }

  const inList = statusQuery.data === true
  const mutating = add.isPending || remove.isPending
  const busy = mutating || statusQuery.isLoading

  if (inList) {
    return (
      <div className="flex flex-1 gap-2">
        <Button
          type="button"
          variant="outline"
          className="flex-1 rounded-3xl border-primary text-primary"
          onClick={() => remove.mutate(fabricId)}
          disabled={busy}
          aria-pressed
          aria-busy={mutating}
        >
          {mutating ? (
            <Loader2 className="mr-2 h-4 w-4 animate-spin" aria-hidden />
          ) : (
            <Heart className="mr-2 h-4 w-4 fill-current" aria-hidden />
          )}
          {messages.fabricDetailClient.savedToWishlist}
        </Button>
        <Button type="button" variant="ghost" className="rounded-3xl px-3" asChild>
          <Link href={wishlistHref}>{messages.fabricDetailClient.viewWishlist}</Link>
        </Button>
      </div>
    )
  }

  return (
    <Button
      type="button"
      variant="outline"
      className="flex-1 rounded-3xl"
      onClick={() => add.mutate(fabricId)}
      disabled={busy}
      aria-pressed={false}
      aria-busy={mutating}
    >
      {mutating ? (
        <Loader2 className="mr-2 h-4 w-4 animate-spin" aria-hidden />
      ) : (
        <Heart className="mr-2 h-4 w-4" aria-hidden />
      )}
      {messages.fabricDetailClient.saveToWishlist}
    </Button>
  )
}
