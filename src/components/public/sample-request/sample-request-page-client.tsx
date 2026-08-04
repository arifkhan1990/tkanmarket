'use client'

import * as React from 'react'
import Image from 'next/image'
import Link from 'next/link'
import { usePathname, useRouter, useSearchParams } from 'next/navigation'
import { zodResolver } from '@hookform/resolvers/zod'
import { useForm, useWatch } from 'react-hook-form'
import { ArrowRight, ChevronLeft, Loader2, Package, Trash2 } from 'lucide-react'

import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { Textarea } from '@/components/ui/textarea'
import { CIS_COUNTRIES } from '@/constants'
import { useFabric } from '@/hooks/useFabricQuery'
import { useI18n } from '@/hooks/useI18n'
import { useSampleRequestLeadMutation } from '@/hooks/use-sample-request-lead-mutation'
import {
  buildSampleRequestInquiryText,
  SampleRequestFormSchema,
  type SampleRequestFormValues
} from '@/lib/validations/sample-request.validation'
import { PublicPageShell } from '@/components/shared/public-page-shell'
import { fabricPrimaryImage, fabricTitleForLocale, SampleRequestFabricBlock } from './sample-request-fabric-block'
import { SampleRequestLeftPanel } from './sample-request-left-panel'

function StepIndicator({
  step,
  current,
  label
}: {
  step: number
  current: number
  label: string
}) {
  const active = current === step
  const done = current > step
  return (
    <div className="relative z-10 flex flex-col items-center gap-2">
      <div
        className={[
          'flex h-10 w-10 items-center justify-center rounded-full text-sm font-bold shadow-lg transition-colors',
          done || active ? 'bg-primary text-on-primary shadow-primary/30' : 'bg-surface-container-highest text-on-surface-variant'
        ].join(' ')}
        aria-current={active ? 'step' : undefined}
      >
        {step}
      </div>
      <span
        className={[
          'text-xs font-semibold tracking-tight',
          active ? 'font-bold text-primary' : 'text-on-surface-variant'
        ].join(' ')}
      >
        {label}
      </span>
    </div>
  )
}

export function SampleRequestPageClient() {
  const { locale, messages } = useI18n()
  const m = messages.leads.sampleDedicated
  const router = useRouter()
  const pathname = usePathname()
  const searchParams = useSearchParams()
  const fabricParam = searchParams.get('fabric')?.trim() ?? ''

  const [step, setStep] = React.useState<1 | 2 | 3>(1)

  const fabricQuery = useFabric(fabricParam)
  const fabric = fabricQuery.data
  const mutation = useSampleRequestLeadMutation()

  const form = useForm<SampleRequestFormValues>({
    resolver: zodResolver(SampleRequestFormSchema),
    defaultValues: {
      contact_name: '',
      email: '',
      company_name: '',
      tax_id: '',
      country: 'Russia',
      city: '',
      phone: '',
      shipping_notes: ''
    }
  })

  const watched = useWatch({ control: form.control })

  function clearFabricFromUrl() {
    router.replace(pathname.split('?')[0] ?? pathname)
  }

  async function goNext() {
    if (step === 1) {
      const ok = await form.trigger(['contact_name', 'email', 'company_name'])
      if (ok) setStep(2)
      return
    }
    if (step === 2) {
      const ok = await form.trigger(['country'])
      if (ok) setStep(3)
    }
  }

  async function onSubmit(values: SampleRequestFormValues) {
    const fabricTitle = fabric ? fabricTitleForLocale(fabric, locale) : null
    const inquiry_text = buildSampleRequestInquiryText(values, {
      fabricId: fabric?.id ?? null,
      fabricSku: fabric?.sku ?? null,
      fabricTitle
    })

    await mutation.mutateAsync({
      source: 'SAMPLE_REQUEST',
      company_name: values.company_name,
      contact_name: values.contact_name,
      email: values.email,
      phone: values.phone?.trim() ? values.phone : undefined,
      country: values.country,
      city: values.city?.trim() ? values.city : undefined,
      fabric_id: fabric?.id,
      inquiry_text
    })
  }

  const fabricImage = fabric ? fabricPrimaryImage(fabric) : null
  const fabricLabel = fabric ? fabricTitleForLocale(fabric, locale) : null

  return (
    <PublicPageShell fullWidth blur="sm" contentClassName="p-0">
      <div className="mx-auto flex max-w-[1440px] flex-col gap-12 px-6 py-12 md:px-8 md:py-16 lg:flex-row lg:items-start lg:gap-16 lg:py-20 xl:gap-24">
        <div className="lg:w-[42%] xl:w-[40%]">
          <SampleRequestLeftPanel messages={m} />
        </div>

        <div className="min-w-0 flex-1 lg:max-w-none">
          <div className="rounded-2xl border border-outline-variant/15 bg-surface-container-lowest p-6 shadow-xl shadow-black/[0.04] md:p-10 lg:p-12 dark:shadow-none">
            <div className="relative mb-10 flex items-center justify-between md:mb-12">
              <div className="absolute left-0 top-1/2 z-0 h-0.5 w-full -translate-y-1/2 bg-surface-container-high" aria-hidden />
              <div className="relative z-10 flex w-full justify-between px-2">
                <StepIndicator step={1} current={step} label={m.stepContact} />
                <StepIndicator step={2} current={step} label={m.stepAddress} />
                <StepIndicator step={3} current={step} label={m.stepReview} />
              </div>
            </div>

            <form className="space-y-8 md:space-y-10" onSubmit={form.handleSubmit(onSubmit)}>
              {step === 1 ? (
                <div className="space-y-8">
                  <div>
                    <h2 className="font-heading text-2xl font-bold text-on-surface">{m.step1Title}</h2>
                    <p className="mt-2 text-sm text-on-surface-variant">{m.step1Subtitle}</p>
                  </div>

                  <div className="grid grid-cols-1 gap-6 md:grid-cols-2">
                    <div className="space-y-2">
                      <label className="text-xs font-bold uppercase tracking-wider text-on-surface-variant">
                        {m.labels.fullName}
                      </label>
                      <Input
                        className="rounded-xl border-transparent bg-surface-container-highest focus-visible:bg-surface-container-lowest"
                        placeholder={m.placeholders.fullName}
                        {...form.register('contact_name')}
                      />
                      {form.formState.errors.contact_name ? (
                        <p className="text-xs text-destructive">{form.formState.errors.contact_name.message}</p>
                      ) : null}
                    </div>
                    <div className="space-y-2">
                      <label className="text-xs font-bold uppercase tracking-wider text-on-surface-variant">
                        {m.labels.businessEmail}
                      </label>
                      <Input
                        type="email"
                        inputMode="email"
                        className="rounded-xl border-transparent bg-surface-container-highest"
                        placeholder={m.placeholders.businessEmail}
                        {...form.register('email')}
                      />
                      {form.formState.errors.email ? (
                        <p className="text-xs text-destructive">{form.formState.errors.email.message}</p>
                      ) : null}
                    </div>
                    <div className="space-y-2">
                      <label className="text-xs font-bold uppercase tracking-wider text-on-surface-variant">
                        {m.labels.companyName}
                      </label>
                      <Input
                        className="rounded-xl border-transparent bg-surface-container-highest"
                        placeholder={m.placeholders.companyName}
                        {...form.register('company_name')}
                      />
                      {form.formState.errors.company_name ? (
                        <p className="text-xs text-destructive">{form.formState.errors.company_name.message}</p>
                      ) : null}
                    </div>
                    <div className="space-y-2">
                      <label className="text-xs font-bold uppercase tracking-wider text-on-surface-variant">
                        {m.labels.taxId}{' '}
                        <span className="font-normal normal-case text-outline">({m.labels.taxIdOptional})</span>
                      </label>
                      <Input
                        className="rounded-xl border-transparent bg-surface-container-highest font-mono text-sm"
                        placeholder={m.placeholders.taxId}
                        {...form.register('tax_id')}
                      />
                    </div>
                  </div>

                  <SampleRequestFabricBlock
                    m={m}
                    locale={locale}
                    fabricParam={fabricParam}
                    isLoading={fabricQuery.isLoading}
                    isError={fabricQuery.isError}
                    fabric={fabric}
                    onClearFabric={clearFabricFromUrl}
                  />
                </div>
              ) : null}

              {step === 2 ? (
                <div className="space-y-8">
                  <div>
                    <h2 className="font-heading text-2xl font-bold text-on-surface">{m.step2Title}</h2>
                    <p className="mt-2 text-sm text-on-surface-variant">{m.step2Subtitle}</p>
                  </div>
                  <div className="grid grid-cols-1 gap-6 md:grid-cols-2">
                    <div className="space-y-2 md:col-span-2">
                      <label className="text-xs font-bold uppercase tracking-wider text-on-surface-variant">
                        {m.labels.country}
                      </label>
                      <Select
                        value={watched?.country ?? 'Russia'}
                        onValueChange={(v) => form.setValue('country', v as SampleRequestFormValues['country'])}
                      >
                        <SelectTrigger className="rounded-xl bg-surface-container-highest">
                          <SelectValue />
                        </SelectTrigger>
                        <SelectContent>
                          {(CIS_COUNTRIES as readonly string[]).map((c) => (
                            <SelectItem key={c} value={c}>
                              {c}
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                      {form.formState.errors.country ? (
                        <p className="text-xs text-destructive">{form.formState.errors.country.message}</p>
                      ) : null}
                    </div>
                    <div className="space-y-2">
                      <label className="text-xs font-bold uppercase tracking-wider text-on-surface-variant">
                        {m.labels.city}
                      </label>
                      <Input
                        className="rounded-xl border-transparent bg-surface-container-highest"
                        placeholder={m.placeholders.city}
                        {...form.register('city')}
                      />
                    </div>
                    <div className="space-y-2">
                      <label className="text-xs font-bold uppercase tracking-wider text-on-surface-variant">
                        {m.labels.phone}
                      </label>
                      <Input
                        inputMode="tel"
                        className="rounded-xl border-transparent bg-surface-container-highest"
                        placeholder={m.placeholders.phone}
                        {...form.register('phone')}
                      />
                    </div>
                    <div className="space-y-2 md:col-span-2">
                      <label className="text-xs font-bold uppercase tracking-wider text-on-surface-variant">
                        {m.labels.shippingNotes}
                      </label>
                      <Textarea
                        rows={4}
                        className="rounded-xl border-transparent bg-surface-container-highest"
                        placeholder={m.placeholders.shippingNotes}
                        {...form.register('shipping_notes')}
                      />
                    </div>
                  </div>
                </div>
              ) : null}

              {step === 3 ? (
                <div className="space-y-6">
                  <div>
                    <h2 className="font-heading text-2xl font-bold text-on-surface">{m.step3Title}</h2>
                    <p className="mt-2 text-sm text-on-surface-variant">{m.step3Subtitle}</p>
                  </div>
                  <dl className="space-y-4 rounded-xl border border-outline-variant/20 bg-surface-container-low p-5 text-sm">
                    <div className="flex flex-col gap-1 sm:flex-row sm:justify-between">
                      <dt className="font-bold text-on-surface-variant">{m.reviewContact}</dt>
                      <dd className="text-on-surface">
                        {watched?.contact_name ?? ''} · {watched?.email ?? ''}
                        <br />
                        {watched?.company_name ?? ''}
                      </dd>
                    </div>
                    {watched?.tax_id ? (
                      <div className="flex flex-col gap-1 sm:flex-row sm:justify-between">
                        <dt className="font-bold text-on-surface-variant">{m.reviewTax}</dt>
                        <dd className="font-mono text-on-surface">{watched.tax_id}</dd>
                      </div>
                    ) : null}
                    <div className="flex flex-col gap-1 sm:flex-row sm:justify-between">
                      <dt className="font-bold text-on-surface-variant">{m.reviewAddress}</dt>
                      <dd className="text-on-surface">
                        {watched?.country ?? ''}
                        {watched?.city ? `, ${watched.city}` : ''}
                        {watched?.phone ? (
                          <>
                            <br />
                            {watched.phone}
                          </>
                        ) : null}
                        {watched?.shipping_notes ? (
                          <>
                            <br />
                            <span className="text-on-surface-variant">{watched.shipping_notes}</span>
                          </>
                        ) : null}
                      </dd>
                    </div>
                    <div className="flex flex-col gap-1 border-t border-outline-variant/20 pt-4 sm:flex-row sm:justify-between">
                      <dt className="font-bold text-on-surface-variant">{m.reviewFabric}</dt>
                      <dd className="text-on-surface">
                        {fabric ? `${fabricTitleForLocale(fabric, locale)} (#${fabric.id})` : m.fabricGeneric}
                      </dd>
                    </div>
                  </dl>
                </div>
              ) : null}

              <div className="flex flex-col-reverse gap-3 border-t border-surface-container-high pt-8 sm:flex-row sm:items-center sm:justify-between">
                <div className="flex flex-wrap gap-2">
                  {step > 1 ? (
                    <Button
                      type="button"
                      variant="ghost"
                      className="font-bold text-on-surface-variant"
                      onClick={() => setStep(step === 3 ? 2 : 1)}
                    >
                      <ChevronLeft className="mr-1 h-4 w-4" aria-hidden />
                      {m.back}
                    </Button>
                  ) : (
                    <Button type="button" variant="ghost" className="font-bold text-on-surface-variant" onClick={() => router.back()}>
                      {m.cancel}
                    </Button>
                  )}
                </div>
                <div className="flex flex-wrap justify-end gap-3">
                  {step < 3 ? (
                    <Button type="button" className="rounded-xl px-8 py-6 font-bold shadow-lg shadow-primary/20" onClick={() => void goNext()}>
                      {step === 1 ? m.nextShipping : m.nextReview}
                      <ArrowRight className="ml-2 h-4 w-4" aria-hidden />
                    </Button>
                  ) : (
                    <Button
                      type="submit"
                      disabled={mutation.isPending}
                      className="rounded-xl px-10 py-6 font-bold shadow-lg shadow-primary/20"
                    >
                      {mutation.isPending ? (
                        <>
                          <Loader2 className="mr-2 h-4 w-4 animate-spin" aria-hidden />
                          {m.sending}
                        </>
                      ) : (
                        m.submit
                      )}
                    </Button>
                  )}
                </div>
              </div>
            </form>
          </div>
        </div>
      </div>
    </PublicPageShell>
  )
}
