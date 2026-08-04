'use client'

import * as React from 'react'
import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { z } from 'zod'
import { useMutation } from '@tanstack/react-query'
import { toast } from 'sonner'
import { useRouter } from 'next/navigation'

import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { useCategoryCounts } from '@/hooks/useCategoryCounts'
import { CIS_COUNTRIES } from '@/constants'
import type { ApiEnvelope } from '@/types/api-envelope.types'
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog'

const BulkAdminSchema = z.object({
  company_name: z.string().trim().min(1),
  email: z.string().trim().email(),
  country: z.enum(CIS_COUNTRIES),
  primary_interest: z.string().trim().min(1),
  required_quantity: z.coerce.number().int().positive(),
  target_price: z.coerce.number().positive().optional(),
  timeline: z.enum(['URGENT', 'STANDARD', 'FLEXIBLE'])
})

type BulkAdminValues = z.infer<typeof BulkAdminSchema>

function buildInquiryText(values: BulkAdminValues) {
  const parts = [
    `Fabric interest: ${values.primary_interest}`,
    `Quantity: ${values.required_quantity} m`,
    values.target_price ? `Target price: $${values.target_price} / m` : null,
    `Timeline: ${
      values.timeline === 'URGENT' ? '< 30 Days' : values.timeline === 'STANDARD' ? '30-90 Days' : '90+ Days'
    }`
  ].filter(Boolean)
  return parts.join('\n')
}

export function AdminBulkInquiriesClient() {
  const router = useRouter()
  const categoriesQuery = useCategoryCounts()

  const [successId, setSuccessId] = React.useState<number | null>(null)
  const [confirmOpen, setConfirmOpen] = React.useState(false)

  const form = useForm<BulkAdminValues>({
    resolver: zodResolver(BulkAdminSchema),
    defaultValues: {
      company_name: '',
      email: '',
      country: 'Russia',
      primary_interest: '',
      required_quantity: 5000,
      target_price: undefined,
      timeline: 'STANDARD'
    }
  })

  const mutation = useMutation({
    mutationFn: async (values: BulkAdminValues) => {
      const payload: unknown = {
        source: 'MANUAL_ENTRY',
        company_name: values.company_name,
        contact_name: values.company_name,
        email: values.email,
        phone: undefined,
        country: values.country,
        city: undefined,
        fabric_id: undefined,
        inquiry_text: buildInquiryText(values)
      }

      const res = await fetch('/api/v1/leads', {
        method: 'POST',
        headers: { 'content-type': 'application/json' },
        body: JSON.stringify(payload)
      })

      const json = (await res.json()) as ApiEnvelope<{ id: number }>
      if (!res.ok) {
        const msg = json.success ? 'Request failed' : json.error.message
        throw new Error(msg)
      }
      if (!json.success) throw new Error(json.error.message)
      return json.data
    },
    onSuccess: async (data) => {
      setSuccessId(data.id)
      setConfirmOpen(true)
      toast.success('Inquiry submitted. Our team will contact you soon.')
    },
    onError: (err) => {
      toast.error(err instanceof Error ? err.message : 'Failed to submit inquiry')
    }
  })

  const timelineButtons: Array<{ key: BulkAdminValues['timeline']; label: string; hint: string }> = [
    { key: 'URGENT', label: 'URGENT', hint: '< 30 Days' },
    { key: 'STANDARD', label: 'STANDARD', hint: '30-90 Days' },
    { key: 'FLEXIBLE', label: 'FLEXIBLE', hint: '90+ Days' }
  ]

  const categories = categoriesQuery.data ?? []

  React.useEffect(() => {
    if (!categoriesQuery.isLoading && categories.length > 0 && !form.getValues('primary_interest')) {
      const first = categories[0]?.category
      if (first) form.setValue('primary_interest', first)
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [categoriesQuery.isLoading, categories.length])

  return (
    <div className="mx-auto max-w-[1600px] space-y-6 pb-10">
      <header className="flex flex-col gap-3 sm:flex-row sm:items-end sm:justify-between">
        <div className="min-w-0">
          <h1 className="font-heading text-3xl font-extrabold tracking-tight text-on-surface md:text-4xl">
            Bulk Procurement Inquiry
          </h1>
          <p className="mt-2 max-w-3xl text-sm text-on-surface-variant">
            Connect with our dedicated curation team for custom textile sourcing and wholesale pricing.
          </p>
        </div>
      </header>

      <div className="flex flex-col lg:flex-row gap-10">
        <section className="flex-1">
          <form
            className="space-y-8"
            onSubmit={form.handleSubmit(async (values) => {
              setSuccessId(null)
              await mutation.mutateAsync(values)
            })}
          >
            <section className="rounded-2xl border border-outline/10 bg-surface-container-lowest p-8 shadow-sm dark:border-outline/15">
              <div className="flex items-center gap-3 mb-6">
                <div className="h-12 w-12 rounded-xl bg-primary-container/20 flex items-center justify-center">
                  <span aria-hidden className="text-primary font-bold">
                    ✓
                  </span>
                </div>
                <h3 className="text-xl font-extrabold text-on-surface">Company Profile</h3>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div className="flex flex-col gap-2">
                  <label className="text-sm font-bold text-on-surface-variant px-1">Legal Entity Name</label>
                  <Input {...form.register('company_name')} placeholder="e.g. Global Textiles Ltd" />
                </div>

                <div className="flex flex-col gap-2">
                  <label className="text-sm font-bold text-on-surface-variant px-1">Contact Email</label>
                  <Input {...form.register('email')} type="email" placeholder="procurement@company.com" />
                </div>

                <div className="flex flex-col gap-2 md:col-span-2">
                  <label className="text-sm font-bold text-on-surface-variant px-1">Country</label>
                  <Select value={form.watch('country')} onValueChange={(v) => form.setValue('country', v as BulkAdminValues['country'])}>
                    <SelectTrigger className="rounded-xl">
                      <SelectValue placeholder="Select country" />
                    </SelectTrigger>
                    <SelectContent>
                      {(CIS_COUNTRIES as readonly string[]).map((c) => (
                        <SelectItem key={c} value={c}>
                          {c}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
              </div>
            </section>

            <section className="rounded-2xl border border-outline/10 bg-surface-container-lowest p-8 shadow-sm dark:border-outline/15">
              <div className="flex items-center gap-3 mb-6">
                <div className="h-12 w-12 rounded-xl bg-primary-container/20 flex items-center justify-center">
                  <span aria-hidden className="text-primary font-bold">
                    ⧉
                  </span>
                </div>
                <h3 className="text-xl font-extrabold text-on-surface">Fabric Specifications</h3>
              </div>

              <div className="space-y-6">
                <div className="flex flex-col gap-2">
                  <label className="text-sm font-bold text-on-surface-variant px-1">Primary Fabric Interest</label>
                  <Select
                    value={form.watch('primary_interest')}
                    onValueChange={(v) => form.setValue('primary_interest', v)}
                    disabled={categoriesQuery.isLoading}
                  >
                    <SelectTrigger className="bg-surface-container-highest rounded-xl">
                      <SelectValue placeholder={categoriesQuery.isLoading ? 'Loading...' : 'Select a category'} />
                    </SelectTrigger>
                    <SelectContent>
                      {categoriesQuery.isLoading ? null : categories.slice(0, 12).map((c) => (
                        <SelectItem key={c.category} value={c.category}>
                          {c.category}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                  <div className="flex flex-col gap-2">
                    <label className="text-sm font-bold text-on-surface-variant px-1">Quantity (Meters)</label>
                    <Input {...form.register('required_quantity')} inputMode="numeric" className="font-mono" placeholder="5000+" />
                  </div>
                  <div className="flex flex-col gap-2">
                    <label className="text-sm font-bold text-on-surface-variant px-1">Target Price</label>
                    <Input {...form.register('target_price')} inputMode="decimal" className="font-mono" placeholder="2.45" />
                  </div>
                  <div className="flex flex-col gap-2">
                    <label className="text-sm font-bold text-on-surface-variant px-1">Desired Timeline</label>
                    <div className="grid grid-cols-3 gap-3">
                      {timelineButtons.map((b) => {
                        const active = form.watch('timeline') === b.key
                        return (
                          <button
                            key={b.key}
                            type="button"
                            className={[
                              'p-3 rounded-xl border-2 transition-all text-center',
                              active
                                ? 'border-primary bg-primary/5 text-primary'
                                : 'border-transparent bg-surface-container-high text-on-surface-variant hover:bg-surface-container-highest'
                            ].join(' ')}
                            onClick={() => form.setValue('timeline', b.key)}
                          >
                            <div className="text-xs font-bold">{b.label}</div>
                            <div className="text-[10px] opacity-70">{b.hint}</div>
                          </button>
                        )
                      })}
                    </div>
                  </div>
                </div>
              </div>
            </section>

            <div className="flex justify-end">
              <Button type="submit" disabled={mutation.isPending} className="rounded-2xl px-12 py-5 text-lg">
                {mutation.isPending ? 'Sending...' : 'Submit Inquiry'}
              </Button>
            </div>
          </form>
        </section>

        <aside className="w-full lg:w-96 space-y-6">
          <div className="rounded-2xl border border-outline/10 bg-surface-container-low p-8 shadow-sm space-y-8 dark:border-outline/15">
            <h3 className="text-xl font-extrabold text-on-surface">Why sourcing with us?</h3>
            <div className="space-y-6">
              <div className="flex items-start gap-4">
                <div className="w-12 h-12 rounded-xl bg-primary-container/20 flex items-center justify-center flex-shrink-0">
                  <span aria-hidden className="text-primary font-bold">
                    ✓
                  </span>
                </div>
                <div>
                  <p className="font-extrabold text-on-surface">Certified Suppliers</p>
                  <p className="text-sm text-on-surface-variant leading-relaxed">
                    Verified factory network with quality checkpoints across bulk batches.
                  </p>
                </div>
              </div>
              <div className="flex items-start gap-4">
                <div className="w-12 h-12 rounded-xl bg-primary-container/20 flex items-center justify-center flex-shrink-0">
                  <span aria-hidden className="text-primary font-bold">
                    ↗
                  </span>
                </div>
                <div>
                  <p className="font-extrabold text-on-surface">Price Optimization</p>
                  <p className="text-sm text-on-surface-variant leading-relaxed">
                    Cost-aware sourcing for consistent wholesale pricing.
                  </p>
                </div>
              </div>
              <div className="flex items-start gap-4">
                <div className="w-12 h-12 rounded-xl bg-primary-container/20 flex items-center justify-center flex-shrink-0">
                  <span aria-hidden className="text-primary font-bold">
                    ⛭
                  </span>
                </div>
                <div>
                  <p className="font-extrabold text-on-surface">QC Assurance</p>
                  <p className="text-sm text-on-surface-variant leading-relaxed">
                    Dedicated inspection workflow before shipment release.
                  </p>
                </div>
              </div>
            </div>
          </div>

          <div className="relative overflow-hidden rounded-2xl h-64 shadow-lg bg-gradient-to-br from-primary/20 to-surface-container-highest">
            <div className="absolute inset-0 bg-gradient-to-t from-primary/80 to-transparent" />
            <div className="absolute bottom-6 left-6 right-6 text-white">
              <p className="text-xs font-bold tracking-widest uppercase opacity-80">Global Logistics</p>
              <p className="text-lg font-extrabold leading-tight">Sea &amp; Air freight options tailored to your deadline.</p>
            </div>
          </div>
        </aside>
      </div>

      <Dialog open={confirmOpen} onOpenChange={setConfirmOpen}>
        <DialogContent className="max-w-lg">
          <DialogHeader>
            <DialogTitle>Inquiry Submitted</DialogTitle>
          </DialogHeader>
          <div className="mt-2 text-sm text-on-surface-variant">
            Your request was created successfully{successId ? ` (Lead #${successId}).` : '.'} You can track it in
            admin leads.
          </div>
          <div className="mt-6 flex justify-end gap-3">
            <Button
              type="button"
              variant="outline"
              onClick={() => {
                setConfirmOpen(false)
              }}
            >
              Close
            </Button>
            <Button
              type="button"
              onClick={() => {
                setConfirmOpen(false)
                router.push('/admin/leads')
              }}
            >
              Go to Leads
            </Button>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  )
}

