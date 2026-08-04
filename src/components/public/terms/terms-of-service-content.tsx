import Link from 'next/link'
import { CheckCircle2, Scale, UserCircle, Verified } from 'lucide-react'

import { Button } from '@/components/ui/button'
import type { Messages } from '@/lib/i18n/get-messages'
import { withLocaleUrl } from '@/lib/i18n/locale-path'
import type { Locale } from '@/types/i18n.types'

interface TermsOfServiceContentProps {
  locale: Locale
  messages: Messages
}

export function TermsOfServiceContent({ locale, messages }: TermsOfServiceContentProps) {
  const t = messages.termsOfServicePage

  const toc = [
    { id: 'tos-s1', title: t.s1Title },
    { id: 'tos-s2', title: t.s2Title },
    { id: 'tos-s3', title: t.s3Title },
    { id: 'tos-s4', title: t.s4Title },
    { id: 'tos-fees', title: t.feeTableTitle },
    { id: 'tos-dispute', title: t.disputeTitle },
    { id: 'tos-s5', title: t.s5Title },
    { id: 'tos-s6', title: t.s6Title }
  ] as const

  return (
    <div className="space-y-12 md:space-y-16">
      <div className="max-w-3xl space-y-6">
        <div className="inline-flex items-center gap-2 rounded-full bg-primary/10 px-3 py-1 text-xs font-bold text-primary">
          <Scale className="h-3.5 w-3.5" aria-hidden />
          {t.badge}
        </div>
        <h1 className="font-headline text-4xl font-extrabold tracking-tight text-on-surface md:text-5xl">{t.heroTitle}</h1>
        <p className="text-lg leading-relaxed text-on-surface-variant">{t.heroLead}</p>
        <div className="flex items-center gap-2 text-sm font-mono text-outline">
          <span>{t.lastUpdatedLabel}:</span>
          <span className="text-on-surface">{t.lastUpdated}</span>
        </div>
      </div>

      <div className="grid grid-cols-1 gap-12 lg:grid-cols-[minmax(0,280px)_1fr] lg:gap-16">
        <aside className="hidden lg:block">
          <nav
            className="sticky top-28 space-y-2 rounded-2xl bg-surface-container-low p-6"
            aria-label={t.tocTitle}
          >
            <p className="mb-4 px-1 text-xs font-bold uppercase tracking-widest text-outline">{t.tocTitle}</p>
            {toc.map((item, idx) => (
              <Link
                key={item.id}
                href={`#${item.id}`}
                className={`block rounded-xl px-4 py-3 text-sm font-semibold transition-colors ${
                  idx === 0
                    ? 'bg-primary-fixed text-on-primary-fixed'
                    : 'text-on-surface-variant hover:bg-surface-container-high'
                }`}
              >
                {item.title}
              </Link>
            ))}
            <div className="mt-8 border-t border-outline/10 pt-6">
              <p className="text-xs leading-relaxed text-on-surface-variant">
                <Link className="font-bold text-primary hover:underline" href={withLocaleUrl('/privacy-policy', locale)}>
                  {messages.privacyPolicyPage.breadcrumb}
                </Link>
              </p>
            </div>
          </nav>
        </aside>

        <article className="min-w-0 space-y-16">
          <section id="tos-s1" className="scroll-mt-28">
            <div className="rounded-3xl border-l-4 border-primary bg-surface-container-lowest p-8 shadow-sm">
              <h2 className="font-headline text-2xl font-bold text-on-surface">{t.s1Title}</h2>
              <p className="mt-4 leading-relaxed text-on-surface-variant">{t.s1Body}</p>
            </div>
          </section>

          <section id="tos-s2" className="scroll-mt-28 space-y-6">
            <h2 className="font-headline text-3xl font-bold text-on-surface">{t.s2Title}</h2>
            <p className="leading-relaxed text-on-surface-variant">{t.s2Body}</p>
            <div className="grid gap-6 md:grid-cols-2">
              <div className="rounded-2xl bg-surface-container p-6">
                <UserCircle className="mb-4 h-9 w-9 text-primary" aria-hidden />
                <h3 className="font-headline text-lg font-bold text-on-surface">{t.s2CardATitle}</h3>
                <p className="mt-2 text-sm leading-relaxed text-on-surface-variant">{t.s2CardABody}</p>
              </div>
              <div className="rounded-2xl bg-surface-container p-6">
                <Verified className="mb-4 h-9 w-9 text-primary" aria-hidden />
                <h3 className="font-headline text-lg font-bold text-on-surface">{t.s2CardBTitle}</h3>
                <p className="mt-2 text-sm leading-relaxed text-on-surface-variant">{t.s2CardBBody}</p>
              </div>
            </div>
          </section>

          <section id="tos-s3" className="scroll-mt-28 space-y-8">
            <div className="rounded-3xl bg-surface-container-low p-8 md:p-10">
              <h2 className="font-headline text-3xl font-bold text-on-surface">{t.s3Title}</h2>
              <p className="mt-4 leading-relaxed text-on-surface-variant">{t.s3Body}</p>
              <div className="mt-8 space-y-6">
                {[
                  { title: t.s3Step1Title, body: t.s3Step1Body, n: '01' },
                  { title: t.s3Step2Title, body: t.s3Step2Body, n: '02' },
                  { title: t.s3Step3Title, body: t.s3Step3Body, n: '03' }
                ].map((step) => (
                  <div key={step.n} className="flex gap-6">
                    <div className="flex h-12 w-12 shrink-0 items-center justify-center rounded-full bg-primary-fixed font-label font-bold text-on-primary-fixed">
                      {step.n}
                    </div>
                    <div>
                      <h3 className="font-headline text-lg font-bold text-on-surface">{step.title}</h3>
                      <p className="mt-2 text-on-surface-variant">{step.body}</p>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </section>

          <section id="tos-s4" className="scroll-mt-28 space-y-4">
            <h2 className="font-headline text-3xl font-bold text-on-surface">{t.s4Title}</h2>
            <p className="leading-relaxed text-on-surface-variant">{t.s4Body}</p>
          </section>

          <section id="tos-fees" className="scroll-mt-28 space-y-6">
            <h2 className="font-headline text-3xl font-bold text-on-surface">{t.feeTableTitle}</h2>
            <div className="overflow-hidden rounded-2xl border border-outline/15">
              <table className="w-full border-collapse text-left">
                <thead>
                  <tr className="bg-surface-container-high">
                    <th className="p-4 font-headline text-sm font-bold">{t.feeColType}</th>
                    <th className="p-4 font-headline text-sm font-bold">{t.feeColRate}</th>
                    <th className="p-4 font-headline text-sm font-bold">{t.feeColDesc}</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-surface-container">
                  <tr>
                    <td className="p-4 font-mono text-sm">{t.feeRow1Type}</td>
                    <td className="p-4 font-mono text-sm font-bold text-primary">{t.feeRow1Rate}</td>
                    <td className="p-4 text-sm text-on-surface-variant">{t.feeRow1Desc}</td>
                  </tr>
                  <tr className="bg-surface-container-low">
                    <td className="p-4 font-mono text-sm">{t.feeRow2Type}</td>
                    <td className="p-4 font-mono text-sm font-bold text-primary">{t.feeRow2Rate}</td>
                    <td className="p-4 text-sm text-on-surface-variant">{t.feeRow2Desc}</td>
                  </tr>
                  <tr>
                    <td className="p-4 font-mono text-sm">{t.feeRow3Type}</td>
                    <td className="p-4 font-mono text-sm font-bold text-primary">{t.feeRow3Rate}</td>
                    <td className="p-4 text-sm text-on-surface-variant">{t.feeRow3Desc}</td>
                  </tr>
                </tbody>
              </table>
            </div>
          </section>

          <section id="tos-dispute" className="scroll-mt-28">
            <div className="relative overflow-hidden rounded-3xl bg-surface-container-highest p-8">
              <div className="relative z-10">
                <h2 className="font-headline text-3xl font-bold text-on-surface">{t.disputeTitle}</h2>
                <p className="mt-4 leading-relaxed text-on-surface-variant">{t.disputeLead}</p>
                <ul className="mt-6 space-y-4">
                  {[t.disputeStep1, t.disputeStep2, t.disputeStep3].map((line) => (
                    <li key={line} className="flex items-start gap-3 text-sm font-medium">
                      <CheckCircle2 className="mt-0.5 h-5 w-5 shrink-0 text-primary" aria-hidden />
                      <span>{line}</span>
                    </li>
                  ))}
                </ul>
              </div>
            </div>
          </section>

          <section id="tos-s5" className="scroll-mt-28 space-y-4">
            <h2 className="font-headline text-3xl font-bold text-on-surface">{t.s5Title}</h2>
            <p className="leading-relaxed text-on-surface-variant">{t.s5Body}</p>
            <div className="rounded-xl border border-primary/20 bg-surface-container-low p-6">
              <p className="text-sm font-medium uppercase tracking-wider text-primary">{t.liabilityIndemnificationTitle}</p>
              <p className="mt-2 text-sm text-on-surface-variant">{t.liabilityIndemnificationBody}</p>
            </div>
          </section>

          <section id="tos-s6" className="scroll-mt-28 space-y-4">
            <h2 className="font-headline text-3xl font-bold text-on-surface">{t.s6Title}</h2>
            <p className="leading-relaxed text-on-surface-variant">{t.s6Body}</p>
          </section>

          <section className="rounded-[2rem] bg-primary px-8 py-12 text-center text-on-primary">
            <h2 className="font-headline text-3xl font-extrabold">{t.ctaTitle}</h2>
            <p className="mx-auto mt-4 max-w-xl opacity-90">{t.ctaLead}</p>
            <div className="mt-8 flex flex-wrap justify-center gap-4">
              <Button
                asChild
                variant="secondary"
                className="rounded-xl border border-white/20 bg-primary-container font-bold text-on-primary-container hover:bg-white/10"
              >
                <Link href={withLocaleUrl('/contact', locale)}>{t.ctaContact}</Link>
              </Button>
              <Button asChild variant="outline" className="rounded-xl border-white/30 bg-white font-bold text-primary hover:bg-white/90">
                <Link href={withLocaleUrl('/suppliers', locale)}>{t.ctaSupplier}</Link>
              </Button>
            </div>
          </section>
        </article>
      </div>

      <nav className="border-t border-outline/10 pt-8 lg:hidden" aria-label={t.tocTitle}>
        <p className="mb-3 text-xs font-bold uppercase tracking-widest text-outline">{t.tocTitle}</p>
        <ul className="flex flex-col gap-1">
          {toc.map((item) => (
            <li key={item.id}>
              <Link href={`#${item.id}`} className="text-sm font-semibold text-primary hover:underline">
                {item.title}
              </Link>
            </li>
          ))}
        </ul>
      </nav>
    </div>
  )
}
