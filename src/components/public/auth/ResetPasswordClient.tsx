'use client'

import { useState, type FormEvent, useEffect } from 'react'
import { KeyRound, Lock } from 'lucide-react'
import Link from 'next/link'
import { useSearchParams } from 'next/navigation'
import { toast } from 'sonner'

import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import {
  AuthBackToLoginLink,
  authPublicPrimaryCtaClass,
  PublicAuthFormShell
} from '@/components/public/auth/public-auth-form-shell'
import { useI18n } from '@/hooks/useI18n'
import { withLocaleUrl } from '@/lib/i18n/locale-path'
import type { ApiEnvelope } from '@/types/api-envelope.types'

export function ResetPasswordClient() {
  const { messages, locale } = useI18n()
  const a = messages.authPublic
  const params = useSearchParams()
  const urlToken = params.get('token')
  const [token, setToken] = useState('')
  const [password, setPassword] = useState('')
  const [loading, setLoading] = useState(false)

  useEffect(() => {
    const t = params.get('token')
    if (t) setToken(t)
  }, [params])

  const showTokenField = !urlToken

  const onSubmit = async (e: FormEvent) => {
    e.preventDefault()
    if (!token.trim()) {
      toast.error(a.invalidLink)
      return
    }
    setLoading(true)
    try {
      const res = await fetch('/api/v1/auth/reset-password', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ token: token.trim(), password })
      })
      const json = (await res.json()) as ApiEnvelope<{ ok: boolean }>
      if (!res.ok || !json.success) {
        toast.error(!json.success ? json.error.message : a.invalidLink)
        return
      }
      toast.success(a.resetDone)
    } catch {
      toast.error(a.requestFailed)
    } finally {
      setLoading(false)
    }
  }

  const forgotHref = withLocaleUrl('/forgot-password', locale)

  return (
    <PublicAuthFormShell>
      <h1 className="font-heading text-3xl font-extrabold tracking-tight text-on-surface">{a.resetTitle}</h1>
      <p className="mt-2 leading-relaxed text-on-surface-variant">{a.resetDescription}</p>
      {showTokenField ? (
        <p className="mt-4 rounded-xl border border-outline/20 bg-surface-container-high/60 px-4 py-3 text-sm leading-relaxed text-on-surface-variant">
          {a.resetNoTokenHint}{' '}
          <Link
            href={forgotHref}
            className="font-semibold text-primary underline-offset-4 hover:underline focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary/30 rounded-sm"
          >
            {a.requestNewLink}
          </Link>
        </p>
      ) : null}
      <form onSubmit={onSubmit} className="mt-8 space-y-6">
        {showTokenField ? (
          <div>
            <label className="mb-2 block font-heading text-sm font-semibold text-on-surface" htmlFor="reset-token">
              {a.resetTokenLabel}
            </label>
            <div className="group relative">
              <KeyRound
                className="pointer-events-none absolute left-4 top-1/2 h-5 w-5 -translate-y-1/2 text-outline transition-colors group-focus-within:text-primary"
                aria-hidden
              />
              <Input
                id="reset-token"
                type="text"
                required={showTokenField}
                autoComplete="off"
                value={token}
                onChange={(e) => setToken(e.target.value)}
                placeholder={a.resetTokenPlaceholder}
                className="h-14 rounded-xl border-none bg-surface-container-highest pl-12 pr-4 font-mono text-sm text-on-surface shadow-none transition-all placeholder:text-outline/60 focus-visible:bg-surface-container-lowest focus-visible:ring-2 focus-visible:ring-primary/20"
              />
            </div>
          </div>
        ) : null}
        <div>
          <label className="mb-2 block font-heading text-sm font-semibold text-on-surface" htmlFor="reset-password">
            {a.newPassword}
          </label>
          <div className="group relative">
            <Lock
              className="pointer-events-none absolute left-4 top-1/2 h-5 w-5 -translate-y-1/2 text-outline transition-colors group-focus-within:text-primary"
              aria-hidden
            />
            <Input
              id="reset-password"
              type="password"
              required
              minLength={8}
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              placeholder={a.newPassword}
              className="h-14 rounded-xl border-none bg-surface-container-highest pl-12 pr-4 text-on-surface shadow-none transition-all placeholder:text-outline/60 focus-visible:bg-surface-container-lowest focus-visible:ring-2 focus-visible:ring-primary/20"
              autoComplete="new-password"
            />
          </div>
        </div>
        <Button type="submit" className={authPublicPrimaryCtaClass} disabled={loading}>
          {a.resetSubmit}
        </Button>
      </form>
      <AuthBackToLoginLink />
    </PublicAuthFormShell>
  )
}
