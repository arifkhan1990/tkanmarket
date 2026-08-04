'use client'

import Link from 'next/link'
import { useEffect } from 'react'

import { Button } from '@/components/ui/button'
import { logger } from '@/lib/logger'
import { withLocaleUrl } from '@/lib/i18n/locale-path'
import { DEFAULT_LOCALE } from '@/types/i18n.types'

/** Inline copy so this boundary never calls `useI18n()` — Providers may be unavailable during prerender. */
const COPY = {
  title: 'Could not load the fabric catalog',
  description: 'We hit a problem fetching fabrics. Please try again in a moment.',
  tryAgain: 'Try again',
  goHome: 'Back to home'
} as const

export default function FabricsError({
  error,
  reset
}: {
  error: Error & { digest?: string }
  reset: () => void
}) {
  useEffect(() => {
    logger.error('Fabric catalog route error', {
      message: error.message,
      digest: error.digest
    })
  }, [error])

  return (
    <div className="flex min-h-[60vh] items-center justify-center px-6 py-16">
      <div className="w-full max-w-xl space-y-6 text-center">
        <div className="inline-flex items-center gap-2 rounded-full bg-error-container px-3 py-1 font-mono text-xs font-bold uppercase tracking-widest text-on-error-container">
          <span>500</span>
          <span>CATALOG ERROR</span>
        </div>

        <h1 className="font-heading text-3xl font-extrabold leading-tight tracking-tight text-on-surface md:text-4xl">
          {COPY.title}
        </h1>
        <p className="text-base leading-relaxed text-on-surface-variant">{COPY.description}</p>

        <div className="flex flex-col justify-center gap-3 pt-2 sm:flex-row">
          <Button type="button" onClick={reset} className="rounded-xl px-6 py-3 font-bold">
            {COPY.tryAgain}
          </Button>
          <Button asChild variant="outline" className="rounded-xl px-6 py-3 font-bold">
            <Link href={withLocaleUrl('/', DEFAULT_LOCALE)}>{COPY.goHome}</Link>
          </Button>
        </div>

        {error.digest ? (
          <p className="font-mono text-xs text-on-surface-variant/70">ref: {error.digest}</p>
        ) : null}
      </div>
    </div>
  )
}
