import type { Metadata } from 'next'

import { SuppliersCatalogClient } from '@/components/marketplace/suppliers/SuppliersCatalogClient'
import { PublicPageShell } from '@/components/shared/public-page-shell'
import { Suspense } from 'react'
import { SuppliersPageSkeleton } from '@/hooks/useSuppliers'
import { getServerLocale } from '@/lib/i18n/get-locale'
import { getMessages } from '@/lib/i18n/get-messages'

export async function generateMetadata(): Promise<Metadata> {
  const locale = await getServerLocale()
  const m = getMessages(locale)
  const title = m.suppliers.metaTitle
  const description = m.suppliers.metaDescription
  return {
    title,
    description,
    openGraph: {
      title: m.common.brand,
      description,
      images: ['/og-placeholder.svg'],
    },
  }
}

export default function SuppliersPage() {
  return (
    <Suspense
      fallback={
        <PublicPageShell
          className="pb-16 pt-8 md:pb-24 md:pt-10"
          blur="sm"
          contentClassName="max-w-[1440px] space-y-12 md:space-y-16"
        >
          <SuppliersPageSkeleton />
        </PublicPageShell>
      }
    >
      <SuppliersCatalogClient />
    </Suspense>
  )
}

