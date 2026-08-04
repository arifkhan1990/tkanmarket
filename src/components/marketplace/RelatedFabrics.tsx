import { RelatedFabricsGridClient } from '@/components/marketplace/RelatedFabricsGridClient'
import type { FabricSummary } from '@/types/marketplace.types'
import { getServerLocale } from '@/lib/i18n/get-locale'
import { getMessages } from '@/lib/i18n/get-messages'

export async function RelatedFabrics({ fabrics }: { fabrics: FabricSummary[] }) {
  if (fabrics.length === 0) return null
  const locale = await getServerLocale()
  const m = getMessages(locale)

  return (
    <section className="w-full py-12 md:py-14">
      <div className="flex items-end justify-between gap-4">
        <div>
          <h2 className="font-heading text-heading-xl font-extrabold tracking-tight text-on-surface">
            {m.related.title}
          </h2>
          <p className="mt-2 text-sm text-on-surface-variant">{m.related.subtitle}</p>
        </div>
      </div>

      <RelatedFabricsGridClient fabrics={fabrics} />
    </section>
  )
}

