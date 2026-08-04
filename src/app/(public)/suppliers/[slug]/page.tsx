import { SupplierDetailClient } from '@/components/marketplace/suppliers/SupplierDetailClient'
import type { Metadata } from 'next'

import { SupplierService } from '@/services/supplier.service'
import { generateSupplierJsonLd } from '@/lib/utils/seo'
import { getServerLocale } from '@/lib/i18n/get-locale'
import { getMessages } from '@/lib/i18n/get-messages'

export async function generateMetadata({
  params
}: {
  params: Promise<{ slug: string }>
}): Promise<Metadata> {
  const { slug } = await params
  const locale = await getServerLocale()
  const m = getMessages(locale)
  const supplier = await SupplierService.getBySlug(slug)
  if (!supplier) {
    return {
      title: `${m.suppliers.supplierNotFoundTitle} | TkanMarket`,
      description: m.suppliers.supplierNotFoundDescription
    }
  }
  const title = `${supplier.name} | ${m.suppliers.profileMetaSuffix} | TkanMarket`
  const description =
    supplier.description?.trim() ||
    m.suppliers.profileMetaFallback
  return {
    title,
    description,
    openGraph: {
      title,
      description,
      images: supplier.logoUrl ? [supplier.logoUrl] : []
    }
  }
}

export default async function SupplierDetailPage({ params }: { params: Promise<{ slug: string }> }) {
  const { slug } = await params
  const supplier = await SupplierService.getBySlug(slug)
  return (
    <>
      {supplier ? (
        <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(generateSupplierJsonLd(supplier)) }} />
      ) : null}
      <SupplierDetailClient slug={slug} />
    </>
  )
}

