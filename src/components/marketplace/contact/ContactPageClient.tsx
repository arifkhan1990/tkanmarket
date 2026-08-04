'use client'

import { useState, type FormEvent } from 'react'
import Link from 'next/link'
import { usePathname, useRouter } from 'next/navigation'
import { Mail, MapPin, MessageCircle } from 'lucide-react'

import { Breadcrumb } from '@/components/common/Breadcrumb'
import { PublicPageShell } from '@/components/shared/public-page-shell'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Textarea } from '@/components/ui/textarea'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { useCreateLead } from '@/hooks/useCreateLead'
import type { CreateLeadInput } from '@/lib/validations/lead.validation'
import { EmptyState } from '@/components/common/EmptyState'
import { useI18n } from '@/hooks/useI18n'
import { DEFAULT_LOCALE } from '@/types/i18n.types'
import { getLocaleFromPathname, withLocaleUrl } from '@/lib/i18n/locale-path'
import { LEAD_SUCCESS_PATH } from '@/lib/routes/lead-success'

const INTEREST_KEYS = ['BULK_SOURCING', 'SUPPLIER_ONBOARD', 'LOGISTICS', 'CUSTOM_MFG'] as const

export function ContactPageClient() {
  const router = useRouter()
  const createLead = useCreateLead({ suppressSuccessToast: true })
  const pathname = usePathname()
  const { locale: hookLocale, messages } = useI18n()
  const locale = getLocaleFromPathname(pathname) ?? hookLocale ?? DEFAULT_LOCALE
  const c = messages.contactPage
  const io = c.interestOptions

  const [companyName, setCompanyName] = useState('')
  const [contactName, setContactName] = useState('')
  const [email, setEmail] = useState('')
  const [phone, setPhone] = useState('')
  const [country, setCountry] = useState(() => messages.contactPage.placeholders.country)
  const [inquiryText, setInquiryText] = useState('')
  const [interest, setInterest] = useState<(typeof INTEREST_KEYS)[number]>('BULK_SOURCING')

  const whatsappHref = process.env.NEXT_PUBLIC_WHATSAPP_URL?.trim() || undefined

  const onSubmit = (e: FormEvent<HTMLFormElement>) => {
    e.preventDefault()
    const input: CreateLeadInput = {
      source: 'DIRECT_CONTACT',
      company_name: companyName,
      contact_name: contactName,
      email,
      phone: phone ? phone : undefined,
      country,
      city: undefined,
      fabric_id: undefined,
      inquiry_text: inquiryText,
      utm_source: 'contact_page',
      utm_campaign: interest
    }
    createLead.mutate(input, {
      onSuccess: () => {
        router.push(withLocaleUrl(LEAD_SUCCESS_PATH, locale))
      }
    })
  }

  const interestLabels: Record<(typeof INTEREST_KEYS)[number], string> = {
    BULK_SOURCING: io.bulk,
    SUPPLIER_ONBOARD: io.supplier,
    LOGISTICS: io.logistics,
    CUSTOM_MFG: io.custom
  }

  return (
    <PublicPageShell className="pb-10 pt-10 md:pb-16 md:pt-14" blur="sm" contentClassName="space-y-12">
        <Breadcrumb items={[{ label: messages.breadcrumbs.home, href: withLocaleUrl('/', locale) }, { label: messages.nav.contact }]} />

        <div className="grid gap-12 lg:grid-cols-12 lg:gap-16">
          <section className="space-y-10 lg:col-span-5">
            <div>
              <h1 className="font-heading text-4xl font-extrabold leading-tight tracking-tight text-on-surface sm:text-5xl">
                {c.heroLine1}{' '}
                <span className="text-primary">{c.heroHighlight}</span>
                {c.heroLine2 ? ` ${c.heroLine2}` : ''}
              </h1>
              <p className="mt-6 max-w-md text-lg leading-relaxed text-on-surface-variant">{c.subtitle}</p>
            </div>

            <div className="space-y-4">
              <a
                href={whatsappHref ?? '#'}
                target={whatsappHref ? '_blank' : undefined}
                rel={whatsappHref ? 'noreferrer' : undefined}
                className="group flex items-start gap-4 rounded-2xl bg-surface-container-low p-6 transition-colors hover:bg-surface-container-highest"
              >
                <div className="flex h-12 w-12 shrink-0 items-center justify-center rounded-xl bg-primary/10 text-primary">
                  <MessageCircle className="h-6 w-6" aria-hidden />
                </div>
                <div>
                  <h3 className="font-heading text-lg font-bold text-on-surface">{c.whatsappTitle}</h3>
                  <p className="mt-1 text-sm text-on-surface-variant">{c.whatsappHint}</p>
                  <p className="mt-2 font-mono text-sm font-bold text-primary">{c.phoneDisplay}</p>
                </div>
              </a>

              <a
                href={`mailto:${c.emailDisplay}`}
                className="group flex items-start gap-4 rounded-2xl bg-surface-container-low p-6 transition-colors hover:bg-surface-container-highest"
              >
                <div className="flex h-12 w-12 shrink-0 items-center justify-center rounded-xl bg-primary/10 text-primary">
                  <Mail className="h-6 w-6" aria-hidden />
                </div>
                <div>
                  <h3 className="font-heading text-lg font-bold text-on-surface">{c.emailTitle}</h3>
                  <p className="mt-1 text-sm text-on-surface-variant">{c.emailHint}</p>
                  <p className="mt-2 font-mono text-sm font-bold text-primary">{c.emailDisplay}</p>
                </div>
              </a>
            </div>

            <div className="relative overflow-hidden rounded-2xl border border-outline/10 bg-surface-container-highest/80 p-6">
              <div className="flex items-start gap-4">
                <MapPin className="mt-1 h-8 w-8 shrink-0 text-primary" aria-hidden />
                <div>
                  <p className="text-xs font-bold uppercase tracking-widest text-primary">{c.hqLabel}</p>
                  <p className="mt-1 text-sm font-semibold text-on-surface">{c.hqLine}</p>
                </div>
              </div>
            </div>
          </section>

          <section className="lg:col-span-7">
            <div className="rounded-2xl border border-outline/10 bg-surface-container-lowest p-8 shadow-[0_20px_50px_rgba(24,28,32,0.06)] md:p-12">
              <div className="mb-8 space-y-2">
                <div className="text-xs font-bold uppercase tracking-widest text-outline">{c.inquiryBadge}</div>
                <h2 className="font-heading text-2xl font-bold tracking-tight text-on-surface">{c.inquiryTitle}</h2>
                <p className="text-sm text-on-surface-variant">{c.responseTimeValue}</p>
              </div>

              <form onSubmit={onSubmit} className="space-y-6">
                <div className="grid gap-6 md:grid-cols-2">
                  <div className="space-y-2">
                    <label className="ml-1 text-sm font-bold text-on-surface-variant">{c.fields.contact}</label>
                    <Input value={contactName} onChange={(e) => setContactName(e.target.value)} placeholder={c.placeholders.contact} required />
                  </div>
                  <div className="space-y-2">
                    <label className="ml-1 text-sm font-bold text-on-surface-variant">{c.fields.email}</label>
                    <Input
                      value={email}
                      onChange={(e) => setEmail(e.target.value)}
                      placeholder={c.placeholders.email}
                      inputMode="email"
                      required
                    />
                  </div>
                  <div className="space-y-2">
                    <label className="ml-1 text-sm font-bold text-on-surface-variant">{c.fields.company}</label>
                    <Input value={companyName} onChange={(e) => setCompanyName(e.target.value)} placeholder={c.placeholders.company} required />
                  </div>
                  <div className="space-y-2">
                    <label className="ml-1 text-sm font-bold text-on-surface-variant">{c.interestLabel}</label>
                    <Select
                      value={interest}
                      onValueChange={(v) => setInterest(v as (typeof INTEREST_KEYS)[number])}
                    >
                      <SelectTrigger className="rounded-xl border-none bg-surface-container-highest">
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        {INTEREST_KEYS.map((k) => (
                          <SelectItem key={k} value={k}>
                            {interestLabels[k]}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>
                  <div className="space-y-2 md:col-span-2">
                    <label className="ml-1 text-sm font-bold text-on-surface-variant">{c.fields.phoneOptional}</label>
                    <Input value={phone} onChange={(e) => setPhone(e.target.value)} placeholder={c.placeholders.phone} inputMode="tel" />
                  </div>
                  <div className="space-y-2 md:col-span-2">
                    <label className="ml-1 text-sm font-bold text-on-surface-variant">{c.fields.country}</label>
                    <Input value={country} onChange={(e) => setCountry(e.target.value)} placeholder={c.placeholders.country} required />
                  </div>
                </div>

                <div className="space-y-2">
                  <div className="ml-1 flex flex-wrap items-center justify-between gap-2">
                    <label className="text-sm font-bold text-on-surface-variant">{c.fields.message}</label>
                    <span className="font-mono text-[10px] uppercase tracking-widest text-outline">{c.skuRefHint}</span>
                  </div>
                  <Textarea
                    value={inquiryText}
                    onChange={(e) => setInquiryText(e.target.value)}
                    placeholder={c.placeholders.message}
                    rows={5}
                    className="min-h-[120px] rounded-xl border-none bg-surface-container-highest"
                    required
                  />
                </div>

                <Button
                  type="submit"
                  disabled={createLead.isPending}
                  className="primary-gradient h-auto w-full rounded-xl py-5 font-heading text-lg font-extrabold text-on-primary shadow-lg"
                >
                  {createLead.isPending ? c.submitPending : c.submit}
                </Button>

                <p className="text-center text-xs text-on-surface-variant">
                  {c.privacyPrefix}{' '}
                  <Link href={withLocaleUrl('/privacy-policy', locale)} className="font-semibold text-primary hover:underline">
                    {c.privacyLink}
                  </Link>{' '}
                  {c.privacySuffix}
                </p>

                {createLead.error ? (
                  <EmptyState title={c.sendErrorTitle} description={(createLead.error as Error).message} />
                ) : null}
              </form>
            </div>
          </section>
        </div>

        <section className="border-t border-outline/10 py-12">
          <p className="text-center font-heading text-xs font-bold uppercase tracking-[0.2em] text-outline">{c.trustTitle}</p>
        </section>
    </PublicPageShell>
  )
}
