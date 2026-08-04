'use client'

import { useEffect } from 'react'
import Link from 'next/link'
import Image from 'next/image'

import { Button } from '@/components/ui/button'
import { logger } from '@/lib/logger'
import { withLocaleUrl } from '@/lib/i18n/locale-path'
import { DEFAULT_LOCALE } from '@/types/i18n.types'

/** Inline copy so this boundary never calls `useI18n()` — Providers may be unavailable during prerender. */
const ERROR_COPY = {
  title: 'Something went wrong',
  description: 'We’re already working on a fix. Try refreshing, or go back to the home page.',
  tryAgain: 'Try again',
  goHome: 'Back to home'
} as const

export default function AppError({ error, reset }: { error: Error & { digest?: string }; reset: () => void }) {

  useEffect(() => {
    logger.error('Unhandled app error', { message: error.message, digest: error.digest })
    // Production: forward to error tracking here (Sentry, etc.)
  }, [error])

  return (
    <div className="flex min-h-[70vh] items-center justify-center px-6 py-16">
      <div className="grid w-full max-w-5xl items-center gap-16 lg:grid-cols-2">
        {/* Illustration */}
        <div className="relative order-2 lg:order-1">
          <div className="relative aspect-square overflow-hidden rounded-3xl bg-surface-container-low shadow-soft">
            <Image
              src="https://lh3.googleusercontent.com/aida-public/AB6AXuC7MElaGKmBFZo0ZWdwUoCaPbgiwcf-GH8JYLPnl0oPN_PhwG-QEBuI7o3tMpYcHq1t8ZPphCtqeCxjAImd4N9vHO5JKvbIaxypY6YuT53VITw42FYCd_8wDDMsNs7ww0iDTZs6WXeqjRzCTQv019xnj8e9O4_yY4pZhLLC7cLyPr2KvmbaYcyX2hspBW4QhKQQxNz6dHKqTfLR6HABq-kIAsvBaC1WZPjnQFm5d9XBfAmM-Lyos4PN7Na_ezWIWn0leNrx45P8ZEY"
              alt="System error illustration"
              fill
              sizes="(max-width: 768px) 80vw, 40vw"
              className="object-cover mix-blend-multiply opacity-80 transition-transform duration-700"
              priority
            />
            <div className="pointer-events-none absolute inset-0 bg-gradient-to-tr from-primary/10 to-transparent" />

            <div className="absolute bottom-6 left-6 rounded-xl border border-white/20 bg-surface-container-lowest/90 px-4 py-3 backdrop-blur-md shadow-2xl">
              <div className="flex items-center gap-3">
                <span className="h-2 w-2 rounded-full bg-error" />
                <span className="font-mono text-xs text-on-surface-variant">
                  {error.digest ?? 'ERR_SYSTEM_FIBER_RUPTURE'}
                </span>
              </div>
            </div>
          </div>

          <div className="absolute -top-12 -left-12 -z-10 h-64 w-64 rounded-full bg-primary-fixed/30 blur-[100px]" />
          <div className="absolute -bottom-12 -right-12 -z-10 h-48 w-48 rounded-full bg-secondary-fixed/30 blur-[80px]" />
        </div>

        {/* Content */}
        <div className="order-1 space-y-8 lg:order-2">
          <div className="space-y-4">
            <div className="inline-flex items-center gap-2 rounded-full bg-error-container px-3 py-1 font-mono text-xs font-bold uppercase tracking-widest text-on-error-container">
              <span>500</span>
              <span>SERVER ERROR</span>
            </div>

            <h1 className="text-4xl font-extrabold leading-tight tracking-tight text-on-surface md:text-5xl font-heading">
              {ERROR_COPY.title}
            </h1>
            <p className="max-w-lg text-lg leading-relaxed text-on-surface-variant">{ERROR_COPY.description}</p>
          </div>

          <div className="flex flex-col gap-4 pt-4 sm:flex-row">
            <Button
              type="button"
              onClick={reset}
              className="rounded-xl px-8 py-4 text-lg font-bold"
            >
              {ERROR_COPY.tryAgain}
            </Button>
            <Button
              asChild
              variant="outline"
              className="rounded-xl px-8 py-4 text-lg font-bold"
            >
              <Link href={withLocaleUrl('/', DEFAULT_LOCALE)}>{ERROR_COPY.goHome}</Link>
            </Button>
          </div>
        </div>
      </div>
    </div>
  )
}

