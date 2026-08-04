'use client'

import { useCallback, useEffect, useState, type FormEvent } from 'react'
import Link from 'next/link'
import { Cookie } from 'lucide-react'
import { toast } from 'sonner'

import { Button } from '@/components/ui/button'
import { Checkbox } from '@/components/ui/checkbox'
import { authPublicPrimaryCtaClass, PublicAuthFormShell } from '@/components/public/auth/public-auth-form-shell'
import { useI18n } from '@/hooks/useI18n'
import type { ApiEnvelope } from '@/types/api-envelope.types'
import { cn } from '@/lib/utils'
import { withLocaleUrl } from '@/lib/i18n/locale-path'

const VISITOR_KEY = 'tkan_visitor_consent'
const PREFS_KEY = 'tkan_cookie_prefs'

type Prefs = { necessary: boolean; functional: boolean; analytics: boolean; marketing: boolean }

function getOrCreateVisitorKey(): string {
  if (typeof window === 'undefined') return ''
  let k = window.localStorage.getItem(VISITOR_KEY)
  if (!k || k.length < 8) {
    k = `v_${crypto.randomUUID().replace(/-/g, '')}`
    window.localStorage.setItem(VISITOR_KEY, k)
  }
  return k
}

function readPrefs(): Partial<Prefs> | null {
  const raw = typeof window !== 'undefined' ? window.localStorage.getItem(PREFS_KEY) : null
  if (!raw) return null
  try {
    return JSON.parse(raw) as Partial<Prefs>
  } catch {
    return null
  }
}

export function CookiePreferencesClient() {
  const { messages, locale } = useI18n()
  const p = messages.admin.cookiePreferencesPage
  const [functional, setFunctional] = useState(false)
  const [analytics, setAnalytics] = useState(false)
  const [marketing, setMarketing] = useState(false)
  const [loading, setLoading] = useState(false)

  useEffect(() => {
    const j = readPrefs()
    if (j) {
      if (typeof j.functional === 'boolean') setFunctional(j.functional)
      else setFunctional(true)
      if (typeof j.analytics === 'boolean') setAnalytics(j.analytics)
      if (typeof j.marketing === 'boolean') setMarketing(j.marketing)
    } else {
      setFunctional(true)
    }
  }, [])

  const persist = useCallback(
    async (preferences: Prefs) => {
      setLoading(true)
      const visitor_key = getOrCreateVisitorKey()
      try {
        const res = await fetch('/api/v1/public/cookie-consent', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ visitor_key, preferences })
        })
        const json = (await res.json()) as ApiEnvelope<{ id: number }>
        if (!res.ok || !json.success) {
          toast.error(!json.success ? json.error.message : p.saveFailed)
          return
        }
        window.localStorage.setItem(PREFS_KEY, JSON.stringify(preferences))
        toast.success(p.savedToast)
      } catch {
        toast.error(p.saveFailed)
      } finally {
        setLoading(false)
      }
    },
    [p.savedToast, p.saveFailed]
  )

  const onSubmit = useCallback(
    async (e: FormEvent) => {
      e.preventDefault()
      await persist({ necessary: true, functional, analytics, marketing })
    },
    [analytics, functional, marketing, persist]
  )

  const onAcceptEssential = useCallback(async () => {
    setFunctional(false)
    setAnalytics(false)
    setMarketing(false)
    await persist({ necessary: true, functional: false, analytics: false, marketing: false })
  }, [persist])

  return (
    <PublicAuthFormShell className="max-w-2xl">
      <div className="mb-6 flex items-start justify-between gap-4">
        <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-primary/10 text-primary">
          <Cookie className="h-7 w-7" aria-hidden />
        </div>
      </div>
      <h1 className="font-heading text-3xl font-bold tracking-tight text-on-surface">{p.title}</h1>
      <p className="mt-3 leading-relaxed text-on-surface-variant">{p.subtitle}</p>

      <form onSubmit={onSubmit} className="mt-8 space-y-4">
        <div className="rounded-2xl bg-surface-container-low p-6">
          <div className="flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">
            <div className="flex-1 space-y-2">
              <div className="flex flex-wrap items-center gap-2">
                <h3 className="font-heading font-bold text-on-surface">{p.necessary}</h3>
                <span className="rounded bg-secondary-container px-2 py-0.5 text-[10px] font-bold uppercase tracking-wider text-on-secondary-container">
                  {p.requiredBadge}
                </span>
              </div>
              <p className="text-sm leading-relaxed text-on-surface-variant">{p.necessaryDesc}</p>
              <p className="text-[11px] font-medium uppercase tracking-widest text-on-surface-variant/70">{p.sessionIdLabel}</p>
            </div>
            <div className="flex shrink-0 items-center gap-2 opacity-70" aria-hidden>
              <div className="relative h-6 w-11 rounded-full bg-primary/40">
                <div className="absolute left-6 top-1 h-4 w-4 rounded-full bg-white shadow" />
              </div>
            </div>
          </div>
        </div>

        <label
          className={cn(
            'flex cursor-pointer flex-col gap-4 rounded-2xl bg-surface-container-low p-6 transition-colors hover:bg-surface-container-high sm:flex-row sm:items-start sm:justify-between'
          )}
        >
          <div className="flex-1 space-y-1">
            <h3 className="font-heading font-bold text-on-surface">{p.functional}</h3>
            <p className="text-sm leading-relaxed text-on-surface-variant">{p.functionalDesc}</p>
          </div>
          <Checkbox
            checked={functional}
            onCheckedChange={(c) => setFunctional(c === true)}
            className="h-5 w-5 shrink-0 rounded-md"
            aria-label={p.functional}
          />
        </label>

        <label className="flex cursor-pointer flex-col gap-4 rounded-2xl bg-surface-container-low p-6 transition-colors hover:bg-surface-container-high sm:flex-row sm:items-start sm:justify-between">
          <div className="flex-1 space-y-1">
            <h3 className="font-heading font-bold text-on-surface">{p.analytics}</h3>
            <p className="text-sm leading-relaxed text-on-surface-variant">{p.analyticsDesc}</p>
          </div>
          <Checkbox checked={analytics} onCheckedChange={(c) => setAnalytics(c === true)} className="h-5 w-5 shrink-0" aria-label={p.analytics} />
        </label>

        <label className="flex cursor-pointer flex-col gap-4 rounded-2xl bg-surface-container-low p-6 transition-colors hover:bg-surface-container-high sm:flex-row sm:items-start sm:justify-between">
          <div className="flex-1 space-y-1">
            <h3 className="font-heading font-bold text-on-surface">{p.marketing}</h3>
            <p className="text-sm leading-relaxed text-on-surface-variant">{p.marketingDesc}</p>
          </div>
          <Checkbox checked={marketing} onCheckedChange={(c) => setMarketing(c === true)} className="h-5 w-5 shrink-0" aria-label={p.marketing} />
        </label>

        <div className="flex flex-col gap-3 pt-4 sm:flex-row">
          <Button
            type="button"
            variant="secondary"
            className="flex-1 rounded-2xl py-6 font-heading font-bold"
            disabled={loading}
            onClick={() => void onAcceptEssential()}
          >
            {p.acceptEssential}
          </Button>
          <Button type="submit" className={cn(authPublicPrimaryCtaClass, 'flex-[1.4] rounded-2xl py-6')} disabled={loading}>
            {p.save}
          </Button>
        </div>

        <div className="flex justify-center pt-2">
          <Link
            href={withLocaleUrl('/privacy-policy', locale)}
            className="inline-flex items-center gap-1 text-xs font-medium text-on-surface-variant/80 hover:text-primary"
          >
            {p.privacyLink}
          </Link>
        </div>
      </form>
    </PublicAuthFormShell>
  )
}
