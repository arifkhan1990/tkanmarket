import { Search, ShoppingBag, Sparkles, Truck } from 'lucide-react'

import { getServerLocale } from '@/lib/i18n/get-locale'
import { getMessages } from '@/lib/i18n/get-messages'

const stepIcons = [Search, ShoppingBag, Sparkles, Truck] as const

export async function HowItWorksSection() {
  const m = getMessages(await getServerLocale())
  const steps = m.howItWorks.steps.map((s, idx) => ({ ...s, icon: stepIcons[idx] ?? Search }))

  return (
    <section className="mx-auto w-full max-w-screen-2xl px-6 py-14 md:px-8">
      <div>
        <h2 className="font-heading text-heading-xl font-extrabold tracking-tight text-on-surface">{m.howItWorks.title}</h2>
        {m.howItWorks.subtitle ? (
          <p className="mt-2 text-sm text-on-surface-variant">{m.howItWorks.subtitle}</p>
        ) : null}
      </div>

      <div className="mt-8 hidden lg:block">
        <div className="relative grid grid-cols-4 gap-6">
          <div className="absolute left-0 right-0 top-1/2 -translate-y-1/2 px-10">
            <div className="h-px w-full bg-outline/20" />
          </div>
          {steps.map((s, idx) => {
            const Icon = s.icon
            return (
              <div
                key={s.title}
                className="group relative rounded-[2rem] border border-outline/10 bg-surface-container-lowest p-7 shadow-sm transition-all duration-300 hover:-translate-y-1 hover:border-primary/30 hover:shadow-soft"
              >
                <div className="absolute -top-4 left-7 flex h-10 w-10 items-center justify-center rounded-2xl border border-outline/10 bg-gradient-to-br from-brand-50 to-brand-100 text-brand-700 shadow-sm transition-all duration-300 group-hover:scale-110 group-hover:from-primary group-hover:to-brand-700 group-hover:text-on-primary group-hover:shadow-[0_8px_20px_-6px_rgba(26,64,194,0.55)]">
                  <Icon className="h-5 w-5" aria-hidden />
                </div>
                <div className="pt-4">
                  <div className="text-xs font-bold uppercase tracking-widest text-outline transition-colors group-hover:text-primary">
                    {m.howItWorks.stepLabel} {idx + 1}
                  </div>
                  <div className="mt-2 text-sm font-extrabold text-on-surface transition-colors group-hover:text-primary">{s.title}</div>
                  <div className="mt-2 text-sm leading-relaxed text-on-surface-variant">{s.description}</div>
                </div>
              </div>
            )
          })}
        </div>
      </div>

      <div className="mt-8 space-y-4 lg:hidden">
        {steps.map((s, idx) => {
          const Icon = s.icon
          return (
            <div key={s.title} className="rounded-[2rem] border border-outline/10 bg-surface-container-lowest p-6">
              <div className="flex items-start gap-4">
                <div className="flex h-11 w-11 shrink-0 items-center justify-center rounded-2xl border border-outline/10 bg-brand-50 text-brand-700">
                  <Icon className="h-5 w-5" aria-hidden />
                </div>
                <div className="space-y-1">
                  <div className="text-xs font-bold uppercase tracking-widest text-outline">
                    {m.howItWorks.stepLabel} {idx + 1}
                  </div>
                  <div className="text-sm font-extrabold text-on-surface">{s.title}</div>
                  <div className="text-sm leading-relaxed text-on-surface-variant">{s.description}</div>
                </div>
              </div>
            </div>
          )
        })}
      </div>
    </section>
  )
}
