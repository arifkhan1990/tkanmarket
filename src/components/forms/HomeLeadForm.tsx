'use client'

import { useMemo, useState } from 'react'
import { useRouter } from 'next/navigation'
import { z } from 'zod'
import { toast } from 'sonner'
import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { Input } from '@/components/ui/input'
import { Button } from '@/components/ui/button'
import { Textarea } from '@/components/ui/textarea'
import { useCreateLead } from '@/hooks/useCreateLead'
import { withLocaleUrl } from '@/lib/i18n/locale-path'
import { LEAD_SUCCESS_PATH } from '@/lib/routes/lead-success'
import { CheckCircle2, Loader2, ShieldCheck } from 'lucide-react'

import { useI18n } from '@/hooks/useI18n'
import { cn } from '@/lib/utils'

const Countries = ['Russia', 'Kazakhstan', 'Belarus', 'Kyrgyzstan', 'Armenia', 'Azerbaijan', 'Uzbekistan', 'Tajikistan', 'Turkmenistan', 'Moldova', 'Georgia'] as const

export function HomeLeadForm() {
  const router = useRouter()
  const createLead = useCreateLead({ suppressSuccessToast: true })
  const [success, setSuccess] = useState(false)
  const { messages, locale } = useI18n()
  const p = messages.leads.home.placeholders

  /** Matches stitch/homepage/code.html lead section input styles (+ theme-aware focus background). */
  const fieldClass = cn(
    'w-full border-0 shadow-none rounded-xl py-4 px-6 h-auto min-h-[52px] text-base transition-all',
    'bg-surface-container-highest',
    'focus:ring-2 focus:ring-primary focus:ring-offset-0',
    'focus:bg-surface-container-lowest dark:focus:bg-surface-container-high',
    'placeholder:text-on-surface-variant/80'
  )

  const HomeLeadSchema = useMemo(() => {
    return z.object({
      company_name: z.string().trim().min(1, messages.leads.home.companyRequired),
      contact_name: z.string().trim().min(1, messages.leads.home.nameRequired),
      email: z.string().trim().email(messages.leads.home.emailInvalid),
      phone: z.string().trim().optional(),
      country: z.enum(Countries),
      message: z.string().trim().min(1, messages.leads.home.messageRequired),
    })
  }, [messages])

  type HomeLeadValues = z.infer<typeof HomeLeadSchema>

  const form = useForm<HomeLeadValues>({
    resolver: zodResolver(HomeLeadSchema),
    defaultValues: {
      company_name: '',
      contact_name: '',
      email: '',
      phone: '',
      country: 'Russia',
      message: ''
    },
    mode: 'onSubmit'
  })

  const canSubmit = useMemo(() => !createLead.isPending, [createLead.isPending])

  const onSubmit = form.handleSubmit((data) => {
    setSuccess(false)
    createLead.mutate(
      {
        source: 'DIRECT_CONTACT',
        company_name: data.company_name,
        contact_name: data.contact_name,
        email: data.email,
        phone: data.phone ? data.phone : undefined,
        country: data.country,
        city: undefined,
        fabric_id: undefined,
        inquiry_text: data.message,
        utm_source: undefined,
        utm_campaign: undefined
      },
      {
        onSuccess: () => {
          setSuccess(true)
          form.reset({ ...data, message: '' })
          router.push(withLocaleUrl(LEAD_SUCCESS_PATH, locale))
        },
        onError: () => {
          toast.error(messages.leads.home.errorToast)
        }
      }
    )
  })

  const labelClass = 'block text-sm font-bold text-outline mb-2 px-1 uppercase tracking-wider'

  return (
    <section className="py-24 bg-surface-container-lowest">
      <div className="mx-auto max-w-screen-xl px-8">
        <div className="flex flex-col items-center gap-16 rounded-[3rem] bg-surface-container p-12 lg:flex-row lg:p-20">
          <div className="w-full lg:w-1/2">
            <h2 className="font-heading text-4xl font-extrabold leading-tight text-on-surface sm:text-5xl mb-8">
              {messages.leads.home.titlePrefix}
              <span className="text-primary">{messages.leads.home.titleHighlight}</span>
            </h2>
            <p className="mb-8 text-xl leading-relaxed text-on-surface-variant">{messages.leads.home.subtitle}</p>
            <div className="flex items-center gap-4 text-on-surface-variant">
              <ShieldCheck className="h-7 w-7 shrink-0 text-primary" strokeWidth={2} aria-hidden />
              <p className="font-medium">{messages.leads.home.privacyNote}</p>
            </div>
          </div>

          <div className="w-full lg:w-1/2">
            <form onSubmit={onSubmit} className="space-y-6">
              <input type="hidden" {...form.register('country')} />
              <div className="grid grid-cols-1 gap-6 md:grid-cols-2">
                <div>
                  <label htmlFor="home-lead-company" className={labelClass}>
                    {messages.leads.home.fields.company}
                  </label>
                  <Input
                    id="home-lead-company"
                    className={fieldClass}
                    {...form.register('company_name')}
                    placeholder={p.company}
                    aria-invalid={Boolean(form.formState.errors.company_name)}
                  />
                  {form.formState.errors.company_name ? (
                    <div className="mt-1 text-xs text-red-600 dark:text-red-400">
                      {form.formState.errors.company_name.message}
                    </div>
                  ) : null}
                </div>
                <div>
                  <label htmlFor="home-lead-name" className={labelClass}>
                    {messages.leads.home.fields.name}
                  </label>
                  <Input
                    id="home-lead-name"
                    className={fieldClass}
                    {...form.register('contact_name')}
                    placeholder={p.name}
                    aria-invalid={Boolean(form.formState.errors.contact_name)}
                  />
                  {form.formState.errors.contact_name ? (
                    <div className="mt-1 text-xs text-red-600 dark:text-red-400">
                      {form.formState.errors.contact_name.message}
                    </div>
                  ) : null}
                </div>
              </div>
              <div className="grid grid-cols-1 gap-6 md:grid-cols-2">
                <div>
                  <label htmlFor="home-lead-email" className={labelClass}>
                    {messages.leads.home.fields.email}
                  </label>
                  <Input
                    id="home-lead-email"
                    className={fieldClass}
                    {...form.register('email')}
                    inputMode="email"
                    placeholder={p.email}
                    aria-invalid={Boolean(form.formState.errors.email)}
                  />
                  {form.formState.errors.email ? (
                    <div className="mt-1 text-xs text-red-600 dark:text-red-400">
                      {form.formState.errors.email.message}
                    </div>
                  ) : null}
                </div>
                <div>
                  <label htmlFor="home-lead-phone" className={labelClass}>
                    {messages.leads.home.fields.phone}
                  </label>
                  <Input
                    id="home-lead-phone"
                    className={fieldClass}
                    {...form.register('phone')}
                    inputMode="tel"
                    placeholder={p.phone}
                  />
                </div>
              </div>
              <div>
                <label htmlFor="home-lead-message" className={labelClass}>
                  {messages.leads.home.fields.message}
                </label>
                <Textarea
                  id="home-lead-message"
                  className={cn(fieldClass, 'min-h-[120px] resize-y')}
                  rows={4}
                  {...form.register('message')}
                  placeholder={p.message}
                  aria-invalid={Boolean(form.formState.errors.message)}
                />
                {form.formState.errors.message ? (
                  <div className="mt-1 text-xs text-red-600 dark:text-red-400">
                    {form.formState.errors.message.message}
                  </div>
                ) : null}
              </div>
              <Button
                type="submit"
                className={cn(
                  'w-full bg-none bg-primary py-5 h-auto text-lg font-bold text-on-primary',
                  'rounded-xl shadow-xl shadow-primary/30 transition-all hover:opacity-90 active:scale-[0.98]',
                  'disabled:opacity-60 disabled:active:scale-100'
                )}
                disabled={!canSubmit}
              >
                <span className="inline-flex items-center justify-center gap-2">
                  {createLead.isPending ? (
                    <>
                      <Loader2 className="h-5 w-5 shrink-0 animate-spin" aria-hidden />
                      {messages.leads.home.submitting}
                    </>
                  ) : (
                    messages.leads.home.submit
                  )}
                </span>
              </Button>

              {success ? (
                <div className="flex items-center gap-2 text-sm font-medium text-emerald-700 dark:text-emerald-400" role="status">
                  <CheckCircle2 className="h-5 w-5 shrink-0" aria-hidden />
                  {messages.leads.home.success}
                </div>
              ) : null}

              <p className="text-xs text-on-surface-variant">{messages.leads.home.consent}</p>
            </form>
          </div>
        </div>
      </div>
    </section>
  )
}
