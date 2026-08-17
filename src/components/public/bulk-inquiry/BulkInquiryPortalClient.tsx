'use client'

import * as React from 'react'
import { useRouter } from 'next/navigation'
import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { useMutation } from '@tanstack/react-query'
import { z } from 'zod'
import { toast } from 'sonner'

import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { Textarea } from '@/components/ui/textarea'
import { ALL_COUNTRIES } from '@/constants'
import { SearchableCountrySelect } from '@/components/ui/searchable-country-select'
import { useCategoryCounts } from '@/hooks/useCategoryCounts'
import { usePublicBulkInquiryMetrics } from '@/hooks/usePublicBulkInquiryMetrics'
import type { ApiEnvelope } from '@/types/api-envelope.types'
import { BulkInquiryPortalLeftEditorial } from './BulkInquiryPortalLeftEditorial'
import { PublicPageShell } from '@/components/shared/public-page-shell'
import { useI18n } from '@/hooks/useI18n'
import { withLocaleUrl } from '@/lib/i18n/locale-path'
import { LEAD_SUCCESS_PATH } from '@/lib/routes/lead-success'

import type { BulkInquiryPortalStep } from '@/types/bulk-inquiry.types'

const StepSchema = z.object({
  company_name: z.string().trim().min(1),
  contact_name: z.string().trim().min(1),
  email: z.string().trim().email(),
  phone: z.string().trim().min(1).optional(),
  country: z.enum(ALL_COUNTRIES),
  city: z.string().trim().min(1).optional(),

  product_category: z.string().trim().min(1),
  required_quantity: z.coerce.number().int().positive(),
  specs: z.string().trim().min(1),
  timeline: z.enum(['URGENT', 'STANDARD', 'FLEXIBLE']),
  target_price: z.coerce.number().positive().optional()
})

type BulkInquiryPortalValues = z.infer<typeof StepSchema>

const timelineToText = (timeline: BulkInquiryPortalValues['timeline']) =>
  timeline === 'URGENT' ? '< 30 Days' : timeline === 'STANDARD' ? '30-90 Days' : '90+ Days'

function progressWidthClass(completePct: number) {
  if (completePct <= 33) return 'w-[33%]'
  if (completePct <= 66) return 'w-[66%]'
  return 'w-[100%]'
}

function buildInquiryText(values: BulkInquiryPortalValues) {
  return [
    `Company: ${values.company_name}`,
    `Category: ${values.product_category}`,
    `Quantity: ${values.required_quantity} m`,
    `Timeline: ${timelineToText(values.timeline)}`,
    values.target_price ? `Target price: $${values.target_price} / m` : null,
    values.specs
  ]
    .filter(Boolean)
    .join('\n')
}

export function BulkInquiryPortalClient() {
  const router = useRouter()
  const { locale } = useI18n()
  const metricsQuery = usePublicBulkInquiryMetrics()
  const categoryQuery = useCategoryCounts()

  const [step, setStep] = React.useState<BulkInquiryPortalStep>('2')

  const form = useForm<BulkInquiryPortalValues>({
    resolver: zodResolver(StepSchema),
    defaultValues: {
      company_name: '',
      contact_name: '',
      email: '',
      phone: undefined,
      country: 'Russia',
      city: undefined,
      product_category: '',
      required_quantity: 5000,
      specs: '',
      timeline: 'STANDARD',
      target_price: undefined
    }
  })

  React.useEffect(() => {
    if (!categoryQuery.isLoading && categoryQuery.data && categoryQuery.data.length > 0) {
      if (!form.getValues('product_category')) {
        form.setValue('product_category', categoryQuery.data[0]?.category ?? '')
      }
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [categoryQuery.isLoading, categoryQuery.data?.length])

  const leadCreateMutation = useMutation({
    mutationFn: async (values: BulkInquiryPortalValues) => {
      const payload: unknown = {
        source: 'MARKETPLACE_INQUIRY',
        company_name: values.company_name,
        contact_name: values.contact_name,
        email: values.email,
        phone: values.phone,
        country: values.country,
        city: values.city,
        fabric_id: undefined,
        inquiry_text: buildInquiryText(values)
      }

      const res = await fetch('/api/v1/leads', {
        method: 'POST',
        headers: { 'content-type': 'application/json' },
        body: JSON.stringify(payload)
      })

      const json = (await res.json()) as ApiEnvelope<{ id: number }>
      if (!res.ok || !json.success) {
        throw new Error(json.success ? 'Request failed' : json.error.message)
      }
      return json.data
    },
    onSuccess: async () => {
      form.reset()
      setStep('1')
      router.push(withLocaleUrl(LEAD_SUCCESS_PATH, locale))
    },
    onError: (err) => {
      toast.error(err instanceof Error ? err.message : 'Failed to send request')
    }
  })

  const metrics = metricsQuery.data
  const completePct = step === '1' ? 33 : step === '2' ? 66 : 100

  const isStep1 = step === '1'
  const isStep2 = step === '2'
  const isStep3 = step === '3'

  async function goToBudget() {
    const ok = await form.trigger(['product_category', 'required_quantity', 'specs', 'timeline'])
    if (!ok) return
    setStep('3')
  }

  async function submitAll() {
    const ok = await form.trigger()
    if (!ok) return
    await leadCreateMutation.mutateAsync(form.getValues())
  }

  return (
    <PublicPageShell fullWidth blur="sm" contentClassName="flex flex-col lg:flex-row lg:items-stretch p-0">
      <BulkInquiryPortalLeftEditorial
        isLoading={metricsQuery.isLoading}
        qualityRatePercent={metrics?.qualityRatePercent ?? null}
        avgLeadTimeDays={metrics?.avgLeadTimeDays ?? null}
        inquiriesThisMonth={metrics?.inquiriesThisMonth ?? 0}
      />

      <section className="lg:w-[55%] bg-surface-container-lowest px-8 lg:px-20 py-14 lg:py-20">
        <div className="max-w-2xl mx-auto">
          <div className="mb-10">
            <div className="flex justify-between items-center mb-4">
              <span className="text-xs font-bold uppercase tracking-widest text-primary">
                Step {step} of 3
              </span>
              <span className="text-xs font-mono text-outline">{completePct}% Complete</span>
            </div>
            <div className="h-1 w-full bg-surface-container-highest rounded-full overflow-hidden">
              <div
                className={`h-full bg-primary-container transition-all ${progressWidthClass(completePct)}`}
                aria-hidden
              />
            </div>
          </div>

          <h2 className="headline-md text-3xl font-bold text-on-surface mb-2">Procurement Needs</h2>
          <p className="body-md text-on-surface-variant mb-10">
            Tell us what you&apos;re looking for and we&apos;ll match you with the best available suppliers.
          </p>

          {isStep2 || isStep3 ? (
            <div className="mb-8 p-6 bg-surface-container-low rounded-xl border border-primary/10 flex items-center justify-between opacity-60">
              <div>
                <div className="flex items-center gap-3">
                  <span className="text-primary" aria-hidden>
                    ✓
                  </span>
                  <div>
                    <h4 className="text-sm font-bold text-on-surface">Company Information</h4>
                    <p className="text-xs text-on-surface-variant">
                      {form.getValues('company_name') ? `${form.getValues('company_name')} • ${form.getValues('country')}` : 'Not provided yet'}
                    </p>
                  </div>
                </div>
              </div>
              <Button type="button" variant="ghost" className="text-xs font-bold text-primary" onClick={() => setStep('1')}>
                Edit
              </Button>
            </div>
          ) : null}

          <div className="space-y-8">
            {isStep1 ? (
              <div className="space-y-8">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  <div className="space-y-2">
                    <label className="text-sm font-bold text-on-surface ml-1">Company Name</label>
                    <Input {...form.register('company_name')} />
                  </div>
                  <div className="space-y-2">
                    <label className="text-sm font-bold text-on-surface ml-1">Contact Name</label>
                    <Input {...form.register('contact_name')} />
                  </div>
                  <div className="space-y-2 md:col-span-2">
                    <label className="text-sm font-bold text-on-surface ml-1">Email</label>
                    <Input {...form.register('email')} type="email" inputMode="email" />
                  </div>
                  <div className="space-y-2">
                    <label className="text-sm font-bold text-on-surface ml-1">Phone (optional)</label>
                    <Input {...form.register('phone')} inputMode="tel" />
                  </div>
                  <div className="space-y-2">
                    <label className="text-sm font-bold text-on-surface ml-1">Country</label>
                    <SearchableCountrySelect
                      value={form.watch('country')}
                      onValueChange={(v) => form.setValue('country', v as BulkInquiryPortalValues['country'])}
                    />
                  </div>
                </div>
                <div className="pt-4 flex items-center justify-end gap-3">
                  <Button
                    type="button"
                    onClick={async () => {
                      const ok = await form.trigger(['company_name', 'contact_name', 'email', 'country'])
                      if (!ok) return
                      setStep('2')
                    }}
                  >
                    Continue to Procurement
                  </Button>
                </div>
              </div>
            ) : null}

            {(isStep2 || isStep3) ? (
              <div className="space-y-8">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  <div className="space-y-2">
                    <label className="text-sm font-bold text-on-surface ml-1">Product Category</label>
                    {categoryQuery.isLoading ? (
                      <div className="h-11 rounded-xl bg-surface-container-high animate-pulse" />
                    ) : (
                      <Select
                        value={form.watch('product_category')}
                        onValueChange={(v) => form.setValue('product_category', v)}
                      >
                        <SelectTrigger className="rounded-xl bg-surface-container-highest">
                          <SelectValue placeholder="Select category" />
                        </SelectTrigger>
                        <SelectContent>
                          {categoryQuery.data?.slice(0, 12).map((c) => (
                            <SelectItem key={c.category} value={c.category}>
                              {c.category}
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                    )}
                  </div>
                  <div className="space-y-2">
                    <label className="text-sm font-bold text-on-surface ml-1">Quantity Requested</label>
                    <div className="relative">
                      <Input {...form.register('required_quantity')} inputMode="numeric" className="font-mono pr-14" placeholder="5000" />
                      <span className="absolute right-4 top-3 text-xs font-bold text-outline uppercase">UNITS</span>
                    </div>
                  </div>
                </div>

                <div className="space-y-2">
                  <label className="text-sm font-bold text-on-surface ml-1">Detailed Specifications</label>
                  <Textarea {...form.register('specs')} rows={5} placeholder="Describe materials, dimensions, certifications needed..." />
                </div>

                <div className="space-y-2">
                  <label className="text-sm font-bold text-on-surface ml-1">Timeline &amp; Budget Preference</label>
                  <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                    {[
                      { key: 'URGENT' as const, label: 'URGENT', hint: '< 30 Days' },
                      { key: 'STANDARD' as const, label: 'STANDARD', hint: '30-90 Days' },
                      { key: 'FLEXIBLE' as const, label: 'FLEXIBLE', hint: '90+ Days' }
                    ].map((b) => {
                      const active = form.watch('timeline') === b.key
                      return (
                        <button
                          key={b.key}
                          type="button"
                          onClick={() => form.setValue('timeline', b.key)}
                          className={[
                            'p-4 rounded-xl border-2 transition-all text-center',
                            active ? 'border-primary bg-primary/5 text-primary' : 'border-transparent bg-surface-container-high text-on-surface-variant hover:bg-surface-container-highest'
                          ].join(' ')}
                        >
                          <div className="text-xs font-bold">{b.label}</div>
                          <div className="text-[10px] opacity-70">{b.hint}</div>
                        </button>
                      )
                    })}
                  </div>
                </div>

                {isStep2 ? (
                  <div className="pt-4 flex items-center justify-between gap-3">
                    <Button type="button" variant="ghost" onClick={() => setStep('1')}>
                      Back
                    </Button>
                    <Button type="button" onClick={goToBudget}>
                      Continue to Budget
                    </Button>
                  </div>
                ) : null}

                {isStep3 ? (
                  <div className="space-y-6 pt-2">
                    <div className="space-y-2">
                      <label className="text-sm font-bold text-on-surface ml-1">Target Price (optional)</label>
                      <Input {...form.register('target_price')} inputMode="decimal" placeholder="e.g. 3.2" />
                    </div>

                    <div className="pt-4 flex items-center justify-between gap-3">
                      <Button type="button" variant="ghost" onClick={() => setStep('2')}>
                        Back
                      </Button>
                      <Button type="button" onClick={submitAll} disabled={leadCreateMutation.isPending}>
                        {leadCreateMutation.isPending ? 'Sending...' : 'Send Inquiry'}
                      </Button>
                    </div>
                  </div>
                ) : null}
              </div>
            ) : null}
          </div>

          {isStep2 ? (
            <div className="p-6 bg-surface-container-low rounded-xl opacity-30 flex items-center gap-4">
              <span aria-hidden className="material-symbols-outlined">
                pending
              </span>
              <div>
                <h4 className="text-sm font-bold text-on-surface">Timeline &amp; Budget</h4>
                <p className="text-xs text-on-surface-variant">Finalize your sourcing window in the next step.</p>
              </div>
            </div>
          ) : null}
        </div>
      </section>
    </PublicPageShell>
  )
}

