import Link from 'next/link'
import { Building2, Clock, Lock, Shield, Terminal, UserCheck } from 'lucide-react'

import { PrivacyPolicyToc } from '@/components/public/privacy/privacy-policy-toc'
import type { Messages } from '@/lib/i18n/get-messages'
import { withLocaleUrl } from '@/lib/i18n/locale-path'
import type { Locale } from '@/types/i18n.types'

interface PrivacyPolicyContentProps {
  locale: Locale
  messages: Messages
}

export function PrivacyPolicyContent({ locale, messages }: PrivacyPolicyContentProps) {
  const p = messages.privacyPolicyPage

  const tocItems = [
    { id: 'introduction', label: p.toc.introduction },
    { id: 'data-collection', label: p.toc.dataCollection },
    { id: 'usage', label: p.toc.usage },
    { id: 'security', label: p.toc.security },
    { id: 'sharing', label: p.toc.sharing },
    { id: 'rights', label: p.toc.rights }
  ] as const

  return (
    <div className="scroll-smooth">
      <div className="mb-12 space-y-6 md:mb-16">
        <div className="inline-flex items-center gap-2 rounded-full bg-primary-fixed px-3 py-1 text-xs font-bold text-on-primary-fixed">
          <UserCheck className="h-3.5 w-3.5 shrink-0" aria-hidden />
          {p.badge}
        </div>
        <h1 className="font-heading text-4xl font-extrabold tracking-tight text-on-surface sm:text-5xl md:text-6xl">
          {p.heroTitle}
        </h1>
        <p className="max-w-2xl text-lg leading-relaxed text-on-surface-variant">{p.heroLead}</p>
        <div className="flex items-center gap-2 text-sm font-mono text-outline">
          <Clock className="h-4 w-4 shrink-0" aria-hidden />
          <span>{p.lastUpdatedLabel}:</span>
          <span className="text-on-surface">{p.lastUpdated}</span>
        </div>
      </div>

      <div className="flex flex-col gap-12 md:flex-row md:items-start md:gap-16 lg:gap-20">
        <PrivacyPolicyToc items={[...tocItems]} tocTitle={p.tocTitle} contactBody={p.contactBody} contactEmail={p.contactEmail} />

        <article className="max-w-3xl flex-1 space-y-14 md:min-w-0">
          <section id="introduction" className="scroll-mt-32 space-y-4">
            <h2 className="font-heading text-2xl font-bold text-on-surface md:text-3xl">{p.introTitle}</h2>
            <div className="space-y-4 leading-loose text-on-surface-variant">
              <p>{p.introP1}</p>
              <p>{p.introP2}</p>
            </div>
          </section>

          <section id="data-collection" className="scroll-mt-32 space-y-6">
            <h2 className="font-heading text-2xl font-bold text-on-surface md:text-3xl">{p.collectTitle}</h2>
            <p className="leading-loose text-on-surface-variant">{p.collectLead}</p>
            <div className="grid gap-6">
              <div className="rounded-3xl border border-outline/5 bg-surface-container-lowest p-6 shadow-sm md:p-8">
                <h3 className="mb-4 flex items-center gap-3 text-xl font-bold text-on-surface">
                  <Building2 className="h-6 w-6 shrink-0 text-primary" aria-hidden />
                  {p.cardBusinessTitle}
                </h3>
                <ul className="space-y-3">
                  {p.cardBusinessBullets.map((line) => (
                    <li key={line} className="flex gap-3 text-on-surface-variant">
                      <span className="font-black text-primary">•</span>
                      <span>{line}</span>
                    </li>
                  ))}
                </ul>
              </div>
              <div className="rounded-3xl border border-outline/5 bg-surface-container-lowest p-6 shadow-sm md:p-8">
                <h3 className="mb-4 flex items-center gap-3 text-xl font-bold text-on-surface">
                  <Terminal className="h-6 w-6 shrink-0 text-primary" aria-hidden />
                  {p.cardTechnicalTitle}
                </h3>
                <ul className="space-y-3">
                  {p.cardTechnicalBullets.map((line) => (
                    <li key={line} className="flex gap-3 text-on-surface-variant">
                      <span className="font-black text-primary">•</span>
                      <span>{line}</span>
                    </li>
                  ))}
                </ul>
              </div>
            </div>
          </section>

          <section id="usage" className="scroll-mt-32 space-y-6">
            <h2 className="font-heading text-2xl font-bold text-on-surface md:text-3xl">{p.usageTitle}</h2>
            <p className="leading-loose text-on-surface-variant">{p.usageLead}</p>
            <div className="overflow-x-auto rounded-3xl border border-outline/10 bg-surface-container-low">
              <table className="w-full min-w-[560px] border-collapse text-left">
                <thead>
                  <tr className="bg-surface-container-high/80">
                    <th className="px-4 py-3 text-xs font-bold uppercase tracking-widest text-outline md:px-6 md:py-4">
                      {p.usageTablePurpose}
                    </th>
                    <th className="px-4 py-3 text-xs font-bold uppercase tracking-widest text-outline md:px-6 md:py-4">
                      {p.usageTableBasis}
                    </th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-outline/10">
                  {p.usageRows.map((row) => (
                    <tr key={row.purpose} className="transition-colors hover:bg-surface-container-lowest/80">
                      <td className="px-4 py-4 text-sm font-medium md:px-6 md:py-6">{row.purpose}</td>
                      <td className="px-4 py-4 text-sm text-on-surface-variant md:px-6 md:py-6">{row.basis}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </section>

          <section id="security" className="scroll-mt-32 space-y-4">
            <h2 className="font-heading text-2xl font-bold text-on-surface md:text-3xl">{p.securityTitle}</h2>
            <div className="rounded-[2rem] border-l-4 border-primary bg-primary/5 p-6 md:p-10">
              <p className="italic leading-loose text-on-surface-variant">&ldquo;{p.securityQuote}&rdquo;</p>
              <div className="mt-6 flex flex-wrap gap-4">
                <div className="flex items-center gap-2 text-xs font-bold text-primary">
                  <Lock className="h-4 w-4" aria-hidden />
                  {p.securityBadge1}
                </div>
                <div className="flex items-center gap-2 text-xs font-bold text-primary">
                  <Shield className="h-4 w-4" aria-hidden />
                  {p.securityBadge2}
                </div>
              </div>
            </div>
          </section>

          <section id="sharing" className="scroll-mt-32 space-y-4">
            <h2 className="font-heading text-2xl font-bold text-on-surface md:text-3xl">{p.sharingTitle}</h2>
            <p className="leading-loose text-on-surface-variant">{p.sharingBody}</p>
          </section>

          <section id="rights" className="scroll-mt-32 space-y-6">
            <h2 className="font-heading text-2xl font-bold text-on-surface md:text-3xl">{p.rightsTitle}</h2>
            <p className="leading-loose text-on-surface-variant">{p.rightsLead}</p>
            <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
              <div className="rounded-2xl bg-surface-container-low p-6">
                <h4 className="mb-2 font-bold text-on-surface">{p.rightAccessTitle}</h4>
                <p className="text-sm text-on-surface-variant">{p.rightAccessBody}</p>
              </div>
              <div className="rounded-2xl bg-surface-container-low p-6">
                <h4 className="mb-2 font-bold text-on-surface">{p.rightErasureTitle}</h4>
                <p className="text-sm text-on-surface-variant">{p.rightErasureBody}</p>
              </div>
              <div className="rounded-2xl bg-surface-container-low p-6">
                <h4 className="mb-2 font-bold text-on-surface">{p.rightRectificationTitle}</h4>
                <p className="text-sm text-on-surface-variant">{p.rightRectificationBody}</p>
              </div>
              <div className="rounded-2xl bg-surface-container-low p-6">
                <h4 className="mb-2 font-bold text-on-surface">{p.rightObjectTitle}</h4>
                <p className="text-sm text-on-surface-variant">{p.rightObjectBody}</p>
              </div>
            </div>
          </section>

          <p className="text-sm text-on-surface-variant">
            <Link href={withLocaleUrl('/terms-of-service', locale)} className="font-bold text-primary hover:underline">
              {messages.termsOfServicePage.heroTitle}
            </Link>
            {' · '}
            <Link href={withLocaleUrl('/contact', locale)} className="font-bold text-primary hover:underline">
              {messages.contactPage.title}
            </Link>
          </p>
        </article>
      </div>
    </div>
  )
}
