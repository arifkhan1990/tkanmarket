import { HelpCircle, Plus } from 'lucide-react'
import Link from 'next/link'

import { Button } from '@/components/ui/button'
import { getServerLocale } from '@/lib/i18n/get-locale'
import { getMessages } from '@/lib/i18n/get-messages'
import { withLocaleUrl } from '@/lib/i18n/locale-path'

export async function FaqSection() {
  const locale = await getServerLocale()
  const m = getMessages(locale)

  return (
    <section className="bg-background">
      <div className="mx-auto w-full max-w-screen-2xl px-6 py-16 md:px-8">
        <div className="grid gap-12 lg:grid-cols-12">
          <div className="lg:col-span-4">
            <div className="lg:sticky lg:top-28 space-y-4">
              <div className="inline-flex items-center gap-2 rounded-full border border-outline/15 bg-surface-container-lowest px-3 py-1 text-xs font-bold uppercase tracking-[0.18em] text-primary">
                <HelpCircle className="h-3.5 w-3.5" aria-hidden />
                {m.faq.eyebrow}
              </div>
              <h2 className="font-heading text-heading-xl font-extrabold tracking-tight text-on-surface">
                {m.faq.title}
              </h2>
              <p className="text-sm leading-relaxed text-on-surface-variant">{m.faq.subtitle}</p>
              <Button asChild variant="outline" className="rounded-full">
                <Link href={withLocaleUrl('/contact', locale)}>{m.footer.contactSupport}</Link>
              </Button>
            </div>
          </div>

          <div className="lg:col-span-8">
            <div className="divide-y divide-outline/10 overflow-hidden rounded-3xl border border-outline/10 bg-surface-container-lowest shadow-sm">
              {m.faq.items.map((item, idx) => (
                <details
                  key={item.question}
                  className="group [&_summary::-webkit-details-marker]:hidden"
                  open={idx === 0}
                >
                  <summary className="flex cursor-pointer list-none items-center justify-between gap-6 px-6 py-5 text-sm font-extrabold text-on-surface transition-colors hover:bg-surface-container-low">
                    <span className="flex-1">{item.question}</span>
                    <span className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-primary/10 text-primary transition-transform duration-300 group-open:rotate-45">
                      <Plus className="h-4 w-4" aria-hidden />
                    </span>
                  </summary>
                  <div className="px-6 pb-5 text-sm leading-relaxed text-on-surface-variant">
                    {item.answer}
                  </div>
                </details>
              ))}
            </div>
          </div>
        </div>
      </div>
    </section>
  )
}
