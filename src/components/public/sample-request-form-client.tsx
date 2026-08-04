'use client'

import Image from 'next/image'
import { ArrowRight, Loader2 } from 'lucide-react'
import * as React from 'react'
import { toast } from 'sonner'

import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { cn } from '@/lib/utils'
import { useI18n } from '@/hooks/useI18n'
import { getLocalizedFabricTitle } from '@/lib/i18n/localized-fabric'
import type { FabricDetail } from '@/types/marketplace.types'

type Step = 1 | 2 | 3

export function SampleRequestFormClient({ initialFabricId }: { initialFabricId?: number }) {
  const { locale, messages } = useI18n()
  const t = messages.leads.sampleDedicated
  const toastM = messages.leads.toast
  const L = t.labels
  const [step, setStep] = React.useState<Step>(1)
  const [loadingFabric, setLoadingFabric] = React.useState(!!initialFabricId)
  const [fabric, setFabric] = React.useState<FabricDetail | null>(null)
  const [submitting, setSubmitting] = React.useState(false)

  const [contactName, setContactName] = React.useState('')
  const [email, setEmail] = React.useState('')
  const [companyName, setCompanyName] = React.useState('')
  const [taxId, setTaxId] = React.useState('')
  const [country, setCountry] = React.useState('')
  const [city, setCity] = React.useState('')

  React.useEffect(() => {
    if (!initialFabricId) {
      setLoadingFabric(false)
      return
    }
    let cancelled = false
    void (async () => {
      try {
        const res = await fetch(`/api/v1/fabrics/${initialFabricId}`)
        const json = (await res.json()) as { success: boolean; data?: FabricDetail }
        if (!cancelled && res.ok && json.success && json.data) setFabric(json.data)
      } catch {
        if (!cancelled) toast.error(t.toastLoadFabric)
      } finally {
        if (!cancelled) setLoadingFabric(false)
      }
    })()
    return () => {
      cancelled = true
    }
  }, [initialFabricId, t.toastLoadFabric])

  async function onSubmit(e: React.FormEvent) {
    e.preventDefault()
    if (step < 3) return
    setSubmitting(true)
    try {
      const inquiryParts = [t.inquiryIntro]
      if (fabric) inquiryParts.push(`${t.inquiryFabricPrefix}${getLocalizedFabricTitle(fabric, locale) || fabric.slug}`)
      if (taxId.trim()) inquiryParts.push(`${t.inquiryTaxPrefix}${taxId.trim()}`)
      const body = {
        source: 'SAMPLE_REQUEST' as const,
        contact_name: contactName.trim(),
        email: email.trim(),
        company_name: companyName.trim(),
        country: country.trim(),
        city: city.trim() || undefined,
        fabric_id: fabric?.id ?? initialFabricId,
        inquiry_text: inquiryParts.join('\n')
      }
      const res = await fetch('/api/v1/leads', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(body)
      })
      const json = (await res.json()) as { success?: boolean; error?: { message?: string } }
      if (!res.ok || !json.success) {
        throw new Error(json.error?.message ?? toastM.requestFailed)
      }
      toast.success(toastM.created)
      setStep(1)
      setContactName('')
      setEmail('')
      setCompanyName('')
      setTaxId('')
      setCountry('')
      setCity('')
    } catch (err) {
      toast.error(err instanceof Error ? err.message : toastM.requestFailed)
    } finally {
      setSubmitting(false)
    }
  }

  function next() {
    if (step === 1) {
      if (!contactName.trim() || !email.trim() || !companyName.trim()) {
        toast.error(t.validationContact)
        return
      }
      setStep(2)
      return
    }
    if (step === 2) {
      if (!country.trim()) {
        toast.error(t.validationCountry)
        return
      }
      setStep(3)
    }
  }

  return (
    <div className="mx-auto max-w-[1440px] px-6 py-12 md:py-20">
      <div className="grid grid-cols-1 items-start gap-12 lg:grid-cols-12 lg:gap-16">
        <div className="space-y-10 lg:col-span-5">
          <div className="space-y-6">
            <span className="inline-flex items-center gap-2 rounded-full bg-brand-100 px-4 py-1.5 text-xs font-bold uppercase tracking-widest text-brand-900 dark:bg-brand-950/50 dark:text-brand-200">
              {t.badge}
            </span>
            <h1 className="font-heading text-4xl font-extrabold leading-tight tracking-tight text-on-surface md:text-5xl md:text-display">
              {t.headline}
            </h1>
            <p className="text-lg leading-relaxed text-on-surface-variant">{t.subhead}</p>
          </div>
          <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
            {[t.trust1Title, t.trust2Title, t.trust3Title, t.trust4Title].map((title, i) => (
              <div
                key={title}
                className="rounded-2xl border border-outline/15 bg-surface-container-low p-6 transition-colors hover:bg-surface-container-high"
              >
                <p className="mb-2 font-bold text-on-surface">{title}</p>
                <p className="text-sm text-on-surface-variant">{[t.trust1Body, t.trust2Body, t.trust3Body, t.trust4Body][i]}</p>
              </div>
            ))}
          </div>
          <div className="relative h-64 overflow-hidden rounded-2xl shadow-2xl">
            <Image
              src="/og-placeholder.svg"
              alt=""
              fill
              className="object-cover"
              sizes="(max-width: 1024px) 100vw, 40vw"
            />
            <div className="absolute inset-0 bg-gradient-to-t from-on-surface/85 to-transparent" />
            <div className="absolute bottom-8 left-8 right-8 text-left text-white">
              <p className="mb-1 font-mono text-xs uppercase tracking-tighter opacity-80">{t.heroCaptionSku}</p>
              <p className="text-lg font-bold">{t.heroCaptionTitle}</p>
            </div>
          </div>
        </div>

        <div className="lg:col-span-7">
          <div className="rounded-2xl border border-outline/15 bg-surface-container-lowest p-8 shadow-xl shadow-black/[0.06] dark:shadow-none md:p-12">
            <div className="relative mb-10 flex items-center justify-between">
              <div className="absolute left-0 top-1/2 h-0.5 w-full -translate-y-1/2 bg-surface-container-high" />
              {([1, 2, 3] as const).map((s) => (
                <div key={s} className="relative z-10 flex flex-col items-center gap-2">
                  <div
                    className={cn(
                      'flex h-10 w-10 items-center justify-center rounded-full text-sm font-bold shadow-lg',
                      step >= s ? 'bg-brand-600 text-white shadow-brand-500/30' : 'bg-surface-container-highest text-on-surface-variant'
                    )}
                  >
                    {s}
                  </div>
                  <span
                    className={cn(
                      'text-xs font-bold tracking-tight',
                      step >= s ? 'text-brand-600' : 'text-on-surface-variant'
                    )}
                  >
                    {s === 1 ? t.stepContact : s === 2 ? t.stepAddress : t.stepReview}
                  </span>
                </div>
              ))}
            </div>

            {loadingFabric ? (
              <div className="flex justify-center py-16">
                <Loader2 className="h-10 w-10 animate-spin text-brand-600" aria-hidden />
              </div>
            ) : (
              <form className="space-y-10" onSubmit={onSubmit}>
                {step === 1 ? (
                  <div className="space-y-8">
                    <div>
                      <h2 className="text-2xl font-bold text-on-surface">{t.step1Title}</h2>
                      <p className="text-sm text-on-surface-variant">{t.step1Subtitle}</p>
                    </div>
                    <div className="grid grid-cols-1 gap-6 md:grid-cols-2">
                      <Field label={L.fullName} value={contactName} onChange={setContactName} />
                      <Field label={L.businessEmail} type="email" value={email} onChange={setEmail} />
                      <Field label={L.companyName} value={companyName} onChange={setCompanyName} />
                      <Field label={L.taxId} value={taxId} onChange={setTaxId} optionalLabel={L.taxIdOptional} />
                    </div>
                    {fabric ? (
                      <div className="rounded-xl border border-outline/30 bg-surface-container-low p-4">
                        <p className="text-sm font-bold text-on-surface">
                          {t.selectedFabricLabel}: #{fabric.id}
                        </p>
                        <p className="text-xs text-on-surface-variant">
                          {getLocalizedFabricTitle(fabric, locale)}
                        </p>
                      </div>
                    ) : null}
                  </div>
                ) : null}

                {step === 2 ? (
                  <div className="space-y-6">
                    <h2 className="text-2xl font-bold text-on-surface">{t.step2Title}</h2>
                    <p className="text-sm text-on-surface-variant">{t.step2Subtitle}</p>
                    <Field label={L.country} value={country} onChange={setCountry} />
                    <Field label={L.city} value={city} onChange={setCity} optionalLabel={L.taxIdOptional} />
                  </div>
                ) : null}

                {step === 3 ? (
                  <div className="space-y-4 text-sm text-on-surface-variant">
                    <h2 className="text-2xl font-bold text-on-surface">{t.step3Title}</h2>
                    <p className="text-sm text-on-surface-variant">{t.step3Subtitle}</p>
                    <ul className="space-y-2 rounded-xl bg-surface-container-high/80 p-4">
                      <li>
                        <span className="font-bold text-on-surface">{L.fullName}: </span>
                        {contactName}
                      </li>
                      <li>
                        <span className="font-bold text-on-surface">{L.businessEmail}: </span>
                        {email}
                      </li>
                      <li>
                        <span className="font-bold text-on-surface">{L.companyName}: </span>
                        {companyName}
                      </li>
                      <li>
                        <span className="font-bold text-on-surface">{L.country}: </span>
                        {country}
                      </li>
                      {city ? (
                        <li>
                          <span className="font-bold text-on-surface">{L.city}: </span>
                          {city}
                        </li>
                      ) : null}
                    </ul>
                  </div>
                ) : null}

                <div className="flex flex-col justify-between gap-4 border-t border-surface-container-high pt-8 sm:flex-row sm:items-center">
                  <Button
                    type="button"
                    variant="ghost"
                    className="font-bold text-on-surface-variant"
                    onClick={() => setStep((s) => (s > 1 ? ((s - 1) as Step) : s))}
                    disabled={step === 1 || submitting}
                  >
                    {t.back}
                  </Button>
                  <div className="flex gap-3">
                    {step < 3 ? (
                      <Button type="button" className="gap-2 font-bold" onClick={next}>
                        {step === 1 ? t.nextShipping : t.nextReview}
                        <ArrowRight className="h-4 w-4" aria-hidden />
                      </Button>
                    ) : (
                      <Button type="submit" className="gap-2 font-bold" disabled={submitting}>
                        {submitting ? <Loader2 className="h-4 w-4 animate-spin" /> : null}
                        {t.submit}
                      </Button>
                    )}
                  </div>
                </div>
              </form>
            )}
          </div>
        </div>
      </div>
    </div>
  )
}

function Field({
  label,
  value,
  onChange,
  type = 'text',
  optionalLabel
}: {
  label: string
  value: string
  onChange: (v: string) => void
  type?: string
  optionalLabel?: string
}) {
  return (
    <div className="space-y-2 text-left">
      <label className="text-xs font-bold uppercase tracking-wider text-on-surface-variant">
        {label}
        {optionalLabel ? <span className="font-normal text-outline"> ({optionalLabel})</span> : null}
      </label>
      <Input
        type={type}
        value={value}
        onChange={(e) => onChange(e.target.value)}
        className="h-12 rounded-xl border-none bg-surface-container-highest focus-visible:ring-brand-500"
      />
    </div>
  )
}
