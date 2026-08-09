import { Quote, Star } from 'lucide-react'

import { getServerLocale } from '@/lib/i18n/get-locale'
import { getMessages } from '@/lib/i18n/get-messages'

export async function TestimonialsSection() {
  const m = getMessages(await getServerLocale())

  if (m.testimonials.items.length === 0) return null

  return (
    <section className="relative overflow-hidden bg-surface-container-low">
      <div className="pointer-events-none absolute -left-32 top-20 h-80 w-80 rounded-full bg-brand-500/5 blur-3xl" aria-hidden />
      <div className="pointer-events-none absolute -right-32 bottom-10 h-80 w-80 rounded-full bg-primary/5 blur-3xl" aria-hidden />

      <div className="relative mx-auto w-full max-w-screen-2xl px-6 py-16 md:px-8">
        <div className="mx-auto max-w-2xl text-center">
          <div className="text-xs font-bold uppercase tracking-[0.18em] text-primary">{m.testimonials.eyebrow}</div>
          <h2 className="mt-2 font-heading text-heading-xl font-extrabold tracking-tight text-on-surface">
            {m.testimonials.title}
          </h2>
          <p className="mt-3 text-sm leading-relaxed text-on-surface-variant">{m.testimonials.subtitle}</p>
        </div>

        <div className="mt-12 grid gap-6 lg:grid-cols-3">
          {m.testimonials.items.map((t) => (
            <figure
              key={t.author}
              className="group relative flex h-full flex-col gap-5 rounded-3xl border border-outline/10 bg-surface-container-lowest p-7 shadow-sm transition-all duration-300 hover:-translate-y-1 hover:border-primary/30 hover:shadow-soft"
            >
              <Quote
                className="absolute right-6 top-6 h-9 w-9 text-primary/10 transition-colors group-hover:text-primary/20"
                aria-hidden
              />

              <div className="flex items-center gap-1 text-amber-500" aria-label="5 out of 5 stars">
                {Array.from({ length: 5 }).map((_, i) => (
                  <Star key={i} className="h-4 w-4 fill-current" aria-hidden />
                ))}
              </div>

              <blockquote className="flex-1 text-sm leading-relaxed text-on-surface">
                “{t.quote}”
              </blockquote>

              <figcaption className="flex items-center gap-3 border-t border-outline/10 pt-4">
                <div
                  className="primary-gradient flex h-11 w-11 shrink-0 items-center justify-center rounded-2xl text-base font-black text-on-primary shadow-sm"
                  aria-hidden
                >
                  {t.author.charAt(0)}
                </div>
                <div className="min-w-0">
                  <div className="truncate text-sm font-extrabold text-on-surface">{t.author}</div>
                  <div className="truncate text-xs text-on-surface-variant">
                    {t.role} · <span className="font-semibold text-primary">{t.company}</span>
                  </div>
                </div>
              </figcaption>
            </figure>
          ))}
        </div>
      </div>
    </section>
  )
}
