import type { Metadata } from 'next'

import { BuyerWishlistPageClient } from '@/components/public/wishlist/BuyerWishlistPageClient'
import { getServerLocale } from '@/lib/i18n/get-locale'
import { getMessages } from '@/lib/i18n/get-messages'

export async function generateMetadata(): Promise<Metadata> {
  const locale = await getServerLocale()
  const m = getMessages(locale)

  return {
    title: m.seo.wishlistTitle,
    description: m.seo.wishlistDescription,
    openGraph: {
      title: m.seo.wishlistTitle,
      description: m.seo.wishlistDescription,
      images: ['/og-placeholder.svg']
    }
  }
}

export default function WishlistPage() {
  return <BuyerWishlistPageClient />
}
