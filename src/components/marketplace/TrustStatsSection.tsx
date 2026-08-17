import Link from 'next/link'

import { Button } from '@/components/ui/button'
import { getServerLocale } from '@/lib/i18n/get-locale'
import { getMessages } from '@/lib/i18n/get-messages'
import { withLocaleUrl } from '@/lib/i18n/locale-path'

export async function TrustStatsSection() {
  const locale = await getServerLocale()
  const m = getMessages(locale)
  const statsLocalized = m.trust.stats

  if (statsLocalized.length === 0) return null

  return (
    <section className="bg-brand-500 text-white">
      <div className="mx-auto w-full max-w-screen-2xl px-6 py-14 md:px-8">
        <div className="grid items-center gap-10 lg:grid-cols-12">
          <div className="lg:col-span-8">
            <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-4">
              {statsLocalized.map((s) => (
                <div key={s.label} className="rounded-[2rem] border border-white/10 bg-white/10 p-6">
                  <div className="text-2xl font-extrabold tracking-tight">{s.value}</div>
                  <div className="mt-1 text-sm text-white">{s.label}</div>
                </div>
              ))}
            </div>
          </div>
          <div className="space-y-4 lg:col-span-4">
            <div className="text-sm font-extrabold">{m.trust.title}</div>
            <div className="text-sm text-white">{m.trust.description}</div>
            <Button asChild variant="secondary" className="rounded-xl bg-white text-brand-700 hover:bg-white/90">
              <Link href={withLocaleUrl('/contact', locale)}>{m.trust.cta}</Link>
            </Button>
          </div>
        </div>
      </div>
    </section>
  )
}
