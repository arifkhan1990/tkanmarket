import { Award, Globe2, Leaf, Recycle, ShieldCheck, Sparkles } from 'lucide-react'
import type { LucideIcon } from 'lucide-react'

import { getServerLocale } from '@/lib/i18n/get-locale'
import { getMessages } from '@/lib/i18n/get-messages'

const certIcons: readonly LucideIcon[] = [ShieldCheck, Leaf, Award, Sparkles, Recycle, Globe2]

export async function CertificationsSection() {
  const m = getMessages(await getServerLocale())

  if (m.certifications.items.length === 0) return null

  return (
    <section className="relative overflow-hidden bg-background">
      <div className="pointer-events-none absolute inset-x-0 top-0 h-px bg-gradient-to-r from-transparent via-outline/30 to-transparent" aria-hidden />
      <div className="mx-auto w-full max-w-screen-2xl px-6 py-16 md:px-8">
        <div className="mx-auto max-w-3xl text-center">
          <div className="text-xs font-bold uppercase tracking-[0.18em] text-primary">{m.certifications.eyebrow}</div>
          <h2 className="mt-2 font-heading text-heading-xl font-extrabold tracking-tight text-on-surface">
            {m.certifications.title}
          </h2>
          <p className="mt-3 text-sm leading-relaxed text-on-surface-variant">{m.certifications.subtitle}</p>
        </div>

        <div className="mt-12 grid gap-4 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-6">
          {m.certifications.items.map((cert, idx) => {
            const Icon = certIcons[idx % certIcons.length] ?? ShieldCheck
            return (
              <div
                key={cert.name}
                className="group relative flex flex-col items-center gap-3 rounded-3xl border border-outline/10 bg-surface-container-lowest p-6 text-center shadow-sm transition-all duration-300 hover:-translate-y-1 hover:border-primary/30 hover:shadow-soft"
              >
                <div className="flex h-14 w-14 items-center justify-center rounded-2xl bg-gradient-to-br from-brand-50 to-brand-100 text-brand-700 ring-1 ring-inset ring-brand-500/10 transition-transform duration-300 group-hover:scale-110">
                  <Icon className="h-6 w-6" aria-hidden />
                </div>
                <div className="text-sm font-extrabold tracking-tight text-on-surface">{cert.name}</div>
                <div className="text-xs leading-snug text-on-surface-variant">{cert.description}</div>
              </div>
            )
          })}
        </div>
      </div>
    </section>
  )
}
