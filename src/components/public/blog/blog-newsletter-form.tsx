'use client'

import { useState, type FormEvent } from 'react'
import { Loader2 } from 'lucide-react'
import { toast } from 'sonner'

import { Button } from '@/components/ui/button'
import { useNewsletterSubscribe } from '@/hooks/usePublicBlog'
import type { Locale } from '@/types/i18n.types'

type Props = {
  locale: Locale
  title: string
  subtitle: string
  placeholder: string
  button: string
  footnote: string
  toastSuccess: string
  toastInvalid: string
  toastAlready: string
  toastError: string
  submittingLabel: string
}

const EMAIL_REGEX = /^[^\s@]+@[^\s@]+\.[^\s@]+$/

export function BlogNewsletterForm({
  locale,
  title,
  subtitle,
  placeholder,
  button,
  footnote,
  toastSuccess,
  toastInvalid,
  toastAlready,
  toastError,
  submittingLabel
}: Props) {
  const [email, setEmail] = useState('')
  const subscribe = useNewsletterSubscribe()

  function onSubmit(e: FormEvent<HTMLFormElement>) {
    e.preventDefault()
    const trimmed = email.trim()
    if (!EMAIL_REGEX.test(trimmed) || trimmed.length > 200) {
      toast.error(toastInvalid)
      return
    }
    subscribe.mutate(
      { email: trimmed, locale, source: 'blog_footer' },
      {
        onSuccess: (data) => {
          toast.success(data.created ? toastSuccess : toastAlready)
          setEmail('')
        },
        onError: (err) => {
          toast.error(err instanceof Error ? err.message : toastError)
        }
      }
    )
  }

  const isSubmitting = subscribe.isPending

  return (
    <section className="mb-16 w-full md:mb-24">
      <div className="mx-auto max-w-4xl px-0 text-center">
        <h2 className="mb-6 font-heading text-3xl font-extrabold tracking-tight text-on-surface md:text-4xl">
          {title}
        </h2>
        <p className="mb-10 text-lg text-on-surface-variant">{subtitle}</p>
        <form onSubmit={onSubmit} className="mx-auto flex max-w-xl flex-col gap-4 md:flex-row">
          <label className="sr-only" htmlFor="blog-newsletter-email">
            Email
          </label>
          <input
            id="blog-newsletter-email"
            name="email"
            type="email"
            autoComplete="email"
            value={email}
            onChange={(ev) => setEmail(ev.target.value)}
            placeholder={placeholder}
            maxLength={200}
            spellCheck={false}
            disabled={isSubmitting}
            required
            className="min-h-[52px] flex-grow rounded-xl border border-outline-variant/20 bg-surface-container-lowest px-6 py-4 text-on-surface outline-none transition-all placeholder:text-on-surface/40 focus:border-transparent focus:ring-2 focus:ring-primary disabled:opacity-70"
          />
          <Button
            type="submit"
            disabled={isSubmitting}
            className="h-auto min-h-[52px] whitespace-nowrap rounded-xl bg-primary px-8 py-4 font-bold text-on-primary shadow-sm transition-all hover:opacity-90 hover:shadow-xl active:scale-[0.98] disabled:opacity-70"
          >
            {isSubmitting ? (
              <span className="inline-flex items-center gap-2">
                <Loader2 className="h-4 w-4 animate-spin" aria-hidden />
                {submittingLabel}
              </span>
            ) : (
              button
            )}
          </Button>
        </form>
        <p className="mt-4 text-xs text-on-surface/40">{footnote}</p>
      </div>
    </section>
  )
}
