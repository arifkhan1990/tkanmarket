import { Mail, Send, Sparkles } from 'lucide-react'

import { getServerLocale } from '@/lib/i18n/get-locale'
import { getMessages } from '@/lib/i18n/get-messages'

export async function NewsletterCtaSection() {
  const m = getMessages(await getServerLocale())

  return (
    <section className="bg-background">
      <div className="mx-auto w-full max-w-screen-2xl px-6 py-16 md:px-8">
        <div className="relative overflow-hidden rounded-[2.5rem] bg-gradient-to-br from-brand-700 via-brand-600 to-primary p-10 text-white shadow-[0_30px_80px_-30px_rgba(26,64,194,0.55)] md:p-14">
          {/* Decorative blobs */}
          <div className="pointer-events-none absolute -right-24 -top-24 h-72 w-72 rounded-full bg-white/10 blur-3xl" aria-hidden />
          <div className="pointer-events-none absolute -bottom-32 -left-24 h-80 w-80 rounded-full bg-brand-900/30 blur-3xl" aria-hidden />
          <div
            className="pointer-events-none absolute inset-0 opacity-[0.07]"
            style={{
              backgroundImage:
                'radial-gradient(circle at 1px 1px, white 1px, transparent 0)',
              backgroundSize: '24px 24px',
            }}
            aria-hidden
          />

          <div className="relative grid items-center gap-10 lg:grid-cols-12">
            <div className="space-y-4 lg:col-span-7">
              <div className="inline-flex items-center gap-2 rounded-full border border-white/20 bg-white/10 px-3 py-1 text-[11px] font-bold uppercase tracking-[0.18em] backdrop-blur-sm">
                <Sparkles className="h-3.5 w-3.5" aria-hidden />
                {m.newsletter.eyebrow}
              </div>
              <h2 className="font-heading text-heading-xl font-extrabold tracking-tight md:text-3xl">
                {m.newsletter.title}
              </h2>
              <p className="max-w-xl text-sm leading-relaxed text-white/85">{m.newsletter.subtitle}</p>
            </div>

            <div className="lg:col-span-5">
              <form className="flex flex-col gap-3 rounded-2xl border border-white/15 bg-white/10 p-2 backdrop-blur-md sm:flex-row sm:items-center sm:gap-2">
                <label htmlFor="newsletter-email" className="sr-only">
                  {m.newsletter.emailPlaceholder}
                </label>
                <div className="flex flex-1 items-center gap-2 rounded-xl bg-white/95 px-4 py-3 text-on-surface">
                  <Mail className="h-4 w-4 text-on-surface-variant" aria-hidden />
                  <input
                    id="newsletter-email"
                    type="email"
                    placeholder={m.newsletter.emailPlaceholder}
                    className="flex-1 border-none bg-transparent text-sm placeholder:text-on-surface-variant/70 focus:outline-none"
                    aria-label={m.newsletter.emailPlaceholder}
                  />
                </div>
                <button
                  type="submit"
                  className="inline-flex items-center justify-center gap-2 rounded-xl bg-white px-5 py-3 text-sm font-bold text-brand-700 shadow-sm transition-transform hover:scale-[1.02] active:scale-[0.98]"
                >
                  {m.newsletter.cta}
                  <Send className="h-4 w-4" aria-hidden />
                </button>
              </form>
              <p className="mt-3 text-center text-xs text-white/70 sm:text-left">{m.newsletter.disclaimer}</p>
            </div>
          </div>
        </div>
      </div>
    </section>
  )
}
