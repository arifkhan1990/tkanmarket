'use client'

import { useRouter } from 'next/navigation'
import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { z } from 'zod'
import { useMutation } from '@tanstack/react-query'
import { toast } from 'sonner'

import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from '@/components/ui/dialog'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Textarea } from '@/components/ui/textarea'
import { ALL_COUNTRIES } from '@/constants'
import { SearchableCountrySelect } from '@/components/ui/searchable-country-select'
import type { ApiEnvelope } from '@/types/api-envelope.types'
import { CreateLeadSchema } from '@/lib/validations/lead.validation'
import { useI18n } from '@/hooks/useI18n'
import { withLocaleUrl } from '@/lib/i18n/locale-path'
import { LEAD_SUCCESS_PATH } from '@/lib/routes/lead-success'

const BaseSchema = CreateLeadSchema.omit({
  source: true,
  fabric_id: true,
  utm_source: true,
  utm_campaign: true
}).extend({
  country: z.enum(ALL_COUNTRIES)
})

const BulkSchema = BaseSchema.extend({
  required_quantity: z.coerce.number().int().positive(),
  target_price: z.coerce.number().positive().optional(),
  timeline: z.string().trim().min(1)
})

type BulkValues = z.infer<typeof BulkSchema>

export function BulkInquiryModal(props: {
  fabric: { id: number; title: string }
  isOpen: boolean
  onClose: () => void
}) {
  const router = useRouter()
  const { messages, locale } = useI18n()

  const form = useForm<BulkValues>({
    resolver: zodResolver(BulkSchema),
    defaultValues: {
      company_name: '',
      contact_name: '',
      email: '',
      phone: '',
      country: 'Russia',
      city: '',
      inquiry_text: '',
      required_quantity: 1000,
      target_price: undefined,
      timeline: messages.leads.bulk.timelineDefault
    }
  })

  const mutation = useMutation({
    mutationFn: async (values: BulkValues) => {
      const inquiry = [
        values.inquiry_text,
        '',
        `${messages.leads.bulk.inquiryQuantityLabel}: ${values.required_quantity} m`,
        values.target_price ? `${messages.leads.bulk.inquiryTargetPriceLabel}: $${values.target_price} / m` : null,
        `${messages.leads.bulk.inquiryTimelineLabel}: ${values.timeline}`
      ]
        .filter(Boolean)
        .join('\n')

      const res = await fetch('/api/v1/leads', {
        method: 'POST',
        headers: { 'content-type': 'application/json' },
        body: JSON.stringify({
          source: 'MARKETPLACE_INQUIRY',
          company_name: values.company_name,
          contact_name: values.contact_name,
          email: values.email,
          phone: values.phone ? values.phone : undefined,
          country: values.country,
          city: values.city ? values.city : undefined,
          inquiry_text: inquiry,
          fabric_id: props.fabric.id
        })
      })
      const json = (await res.json()) as ApiEnvelope<{ id: number }>
      if (!res.ok || !json.success) {
        const message = json.success ? 'Request failed' : json.error.message
        throw new Error(message)
      }
      return json.data
    }
  })

  const onSubmit = form.handleSubmit(async (values) => {
    try {
      await mutation.mutateAsync(values)
      props.onClose()
      router.push(withLocaleUrl(LEAD_SUCCESS_PATH, locale))
    } catch (err) {
      const msg = err instanceof Error ? err.message : messages.leads.toast.requestFailed
      toast.error(msg)
    }
  })

  const errorText = mutation.error instanceof Error ? mutation.error.message : null

  return (
    <Dialog open={props.isOpen} onOpenChange={(v) => !v && props.onClose()}>
      <DialogContent className="max-w-xl">
        <DialogHeader>
          <DialogTitle>{messages.leads.bulk.title}</DialogTitle>
          <DialogDescription>{messages.leads.bulk.description}</DialogDescription>
        </DialogHeader>

        <div className="mt-4 rounded-2xl bg-surface-container-highest/40 border border-outline/10 p-4">
          <div className="text-xs font-bold uppercase tracking-widest text-outline">{messages.leads.bulk.fabric}</div>
          <div className="mt-2 text-sm font-extrabold">{props.fabric.title}</div>
        </div>

        <form onSubmit={onSubmit} className="mt-6 space-y-4">
          <div className="grid gap-4 sm:grid-cols-2">
            <div className="space-y-2">
              <div className="text-xs font-bold uppercase tracking-widest text-outline">{messages.leads.bulk.fields.company}</div>
              <Input {...form.register('company_name')} />
            </div>
            <div className="space-y-2">
              <div className="text-xs font-bold uppercase tracking-widest text-outline">{messages.leads.bulk.fields.name}</div>
              <Input {...form.register('contact_name')} />
            </div>
            <div className="space-y-2">
              <div className="text-xs font-bold uppercase tracking-widest text-outline">{messages.leads.bulk.fields.email}</div>
              <Input {...form.register('email')} inputMode="email" />
            </div>
            <div className="space-y-2">
              <div className="text-xs font-bold uppercase tracking-widest text-outline">{messages.leads.bulk.fields.phone}</div>
              <Input {...form.register('phone')} inputMode="tel" placeholder={messages.contactPage.placeholders.phone} />
            </div>

            <div className="space-y-2">
              <div className="text-xs font-bold uppercase tracking-widest text-outline">{messages.leads.bulk.quantityMeters}</div>
              <Input {...form.register('required_quantity')} inputMode="numeric" />
            </div>
            <div className="space-y-2">
              <div className="text-xs font-bold uppercase tracking-widest text-outline">{messages.leads.bulk.targetPrice}</div>
              <Input {...form.register('target_price')} inputMode="decimal" placeholder={messages.leads.bulk.examplePrice} />
            </div>

            <div className="space-y-2 sm:col-span-2">
              <div className="text-xs font-bold uppercase tracking-widest text-outline">{messages.leads.bulk.timeline}</div>
              <Input {...form.register('timeline')} />
            </div>

            <div className="space-y-2">
              <div className="text-xs font-bold uppercase tracking-widest text-outline">{messages.leads.bulk.country}</div>
              <SearchableCountrySelect
                value={form.watch('country')}
                onValueChange={(val) => form.setValue('country', val as BulkValues['country'])}
                ariaLabel={messages.leads.bulk.country}
              />
            </div>
            <div className="space-y-2">
              <div className="text-xs font-bold uppercase tracking-widest text-outline">{messages.leads.bulk.city}</div>
              <Input {...form.register('city')} />
            </div>

            <div className="space-y-2 sm:col-span-2">
              <div className="text-xs font-bold uppercase tracking-widest text-outline">{messages.leads.bulk.comment}</div>
              <Textarea {...form.register('inquiry_text')} rows={4} />
            </div>
          </div>

          {errorText ? <div className="text-sm text-red-600">{errorText}</div> : null}

          <Button type="submit" className="w-full rounded-full" disabled={mutation.isPending}>
            {mutation.isPending ? messages.leads.bulk.sending : messages.leads.bulk.send}
          </Button>
        </form>
      </DialogContent>
    </Dialog>
  )
}

