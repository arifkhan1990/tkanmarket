'use client'

import Image from 'next/image'
import Link from 'next/link'
import { useSearchParams } from 'next/navigation'
import { useEffect, useMemo, useRef } from 'react'
import { ArrowRight, CheckCircle2, Headphones, Mail, Rocket, Database } from 'lucide-react'

import { useI18n } from '@/hooks/useI18n'
import { withLocaleUrl } from '@/lib/i18n/locale-path'
import { sanitizeLeadSuccessContactParam } from '@/lib/sanitize-lead-success-contact'
import { cn } from '@/lib/utils'
import type { LeadSuccessClientProps } from '@/types/lead-success.types'

/** Numeric portion shown before locale-specific “business hours” suffix (see `messages.leads.successPage.body`). */
const RESPONSE_HOURS = '4'

const DECOR_IMAGE =
  'https://lh3.googleusercontent.com/aida-public/AB6AXuAHKWYw1W2mhhxUZ6ZKm8Rac2PMEcbI8GRjTZeWEVMum5n7FCDzUtlnrSK1-XN7oxDAF1xSP0kyA7rh4YT6N0j_lhzORnCvZGpfsSlm3AwkISnzTCsCwuBIc3CUMT_aOvWe1J5HJHOrW2Kiia64nOoCSOsFJplxXdSZMYnRbdNOk43651DxkaFKnGgJCY3Pjj7YYZ7t_nuI8JLJyR0dcTbw0nNZsvCJqUcvcEcHkXiHUvR4fGsRggmmQ7f6cZPJBsu0sf8IzEJ-DiM'

const LEAD_SUCCESS_HEADING_ID = 'lead-success-heading'

export function LeadSuccessClient({ initialContactFromCookie = null }: LeadSuccessClientProps) {
  const { messages, locale } = useI18n()
  const m = messages.leads.successPage
  const sp = useSearchParams()
  const contactParam = sp.get('contact')
  const name = useMemo(() => {
    if (initialContactFromCookie) return initialContactFromCookie
    return sanitizeLeadSuccessContactParam(contactParam) ?? m.defaultContactName
  }, [initialContactFromCookie, contactParam, m.defaultContactName])

  const headingRef = useRef<HTMLHeadingElement>(null)
  useEffect(() => {
    headingRef.current?.focus()
  }, [])

  const title = m.title.replace('{name}', name)
  const bodyParts = m.body.split('{hours}')
  const bodyBefore = bodyParts[0] ?? ''
  const bodyAfter = bodyParts[1] ?? ''

  return (
    <div className="relative flex min-h-screen flex-col">
      <div
        className="pointer-events-none fixed top-0 right-0 -z-10 h-full w-1/3 overflow-hidden opacity-[0.10] md:opacity-[0.20]"
        aria-hidden
      >
        <Image
          src={DECOR_IMAGE}
          alt=""
          fill
          className="object-cover"
          sizes="33vw"
          priority={false}
          fetchPriority="low"
        />
      </div>

      <main
        className="text-on-surface bg-background flex flex-1 flex-col items-center justify-center px-6 py-16 md:py-24"
        aria-labelledby={LEAD_SUCCESS_HEADING_ID}
      >
        <div className="flex w-full max-w-4xl flex-col items-center text-center">
          <div className="relative mb-12">
            <div className="bg-primary-fixed/30 absolute -inset-8 rounded-full blur-3xl" aria-hidden />
            <div className="border-outline/10 bg-surface-container-lowest relative flex h-48 w-48 items-center justify-center rounded-xl shadow-[0_20px_50px_rgba(24,28,32,0.08)] md:h-64 md:w-64">
              <div className="bg-primary/5 absolute top-0 right-0 -mt-8 -mr-8 h-24 w-24 rounded-full" aria-hidden />
              <div className="bg-secondary/5 absolute bottom-0 left-0 -mb-12 -ml-12 h-32 w-32 rounded-full" aria-hidden />
              <CheckCircle2 className="text-primary relative h-20 w-20 md:h-24 md:w-24" strokeWidth={1.75} aria-hidden />
            </div>
          </div>

          <div className="max-w-2xl space-y-6">
            <h1
              ref={headingRef}
              id={LEAD_SUCCESS_HEADING_ID}
              tabIndex={-1}
              className="font-heading text-4xl font-extrabold tracking-tight text-on-surface outline-none ring-offset-background focus-visible:ring-2 focus-visible:ring-primary md:text-5xl lg:text-6xl"
            >
              {title}
            </h1>
            <p className="text-on-surface-variant text-lg leading-relaxed md:text-xl">
              {bodyBefore}
              <span className="text-primary font-mono font-semibold">{RESPONSE_HOURS}</span>
              {bodyAfter}
            </p>
          </div>

          <section className="mt-10 w-full max-w-4xl pt-4">
            <h2 className="sr-only">{m.nextStepsSection}</h2>
            <ul className="m-0 grid list-none grid-cols-1 gap-4 p-0 text-left md:grid-cols-3">
              {[
                { icon: Mail, title: m.card1Title, body: m.card1Body },
                { icon: Headphones, title: m.card2Title, body: m.card2Body },
                { icon: Rocket, title: m.card3Title, body: m.card3Body }
              ].map((c) => (
                <li key={c.title} className="bg-surface-container-low space-y-3 rounded-xl p-6">
                  <div className="bg-surface-container-highest text-primary flex h-10 w-10 items-center justify-center rounded-lg">
                    <c.icon className="h-5 w-5" aria-hidden />
                  </div>
                  <h3 className="font-heading text-sm font-bold">{c.title}</h3>
                  <p className="text-on-surface-variant text-xs leading-normal">{c.body}</p>
                </li>
              ))}
            </ul>
          </section>

          <div className="mt-12 flex flex-col items-center gap-4 sm:flex-row">
            <Link
              href={withLocaleUrl('/', locale)}
              className={cn(
                'from-primary to-primary-container text-on-primary font-heading inline-flex items-center gap-2 rounded-xl px-8 py-4 text-base font-bold shadow-lg shadow-primary/25',
                'bg-gradient-to-br transition-all hover:opacity-95 active:scale-[0.98]'
              )}
            >
              {m.home}
              <ArrowRight className="h-4 w-4" aria-hidden />
            </Link>
            <Link
              href={withLocaleUrl('/fabrics', locale)}
              className="bg-surface-container-high text-on-surface font-heading hover:bg-surface-container-highest rounded-xl px-8 py-4 text-base font-bold transition-all hover:scale-[0.98] active:opacity-90"
            >
              {m.catalog}
            </Link>
          </div>

          <footer className="mt-16 flex flex-col items-center gap-4">
            <div className="bg-outline-variant/30 h-px w-24" />
            <p className="text-on-surface-variant text-sm">
              <span>{m.supportIntro}</span>{' '}
              <Link href={withLocaleUrl('/contact', locale)} className="text-primary font-semibold hover:underline">
                {m.support}
              </Link>
            </p>
            <div className="text-on-surface-variant mt-4 flex items-center gap-2 opacity-50 grayscale transition-all hover:opacity-100 hover:grayscale-0">
              <Database className="text-primary h-5 w-5" aria-hidden />
              <span className="font-heading text-on-surface tracking-tighter">{messages.common.brand}</span>
            </div>
          </footer>
        </div>
      </main>
    </div>
  )
}
