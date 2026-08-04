'use client'

import { useState, type FormEvent, useEffect } from 'react'
import { Lock, UserRound } from 'lucide-react'
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
import type { ApiEnvelope } from '@/types/api-envelope.types'

export function InviteAcceptClient() {
  const { messages } = useI18n()
  const a = messages.authPublic
  const params = useSearchParams()
  const [token, setToken] = useState('')
  const [name, setName] = useState('')
  const [password, setPassword] = useState('')
  const [loading, setLoading] = useState(false)

  useEffect(() => {
    const t = params.get('token')
    if (t) setToken(t)
  }, [params])

  const onSubmit = async (e: FormEvent) => {
    e.preventDefault()
    if (!token.trim()) {
      toast.error(a.invalidLink)
      return
    }
    setLoading(true)
    try {
      const res = await fetch('/api/v1/auth/invite/accept', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ token: token.trim(), name, password })
      })
      const json = (await res.json()) as ApiEnvelope<{ ok: boolean }>
      if (!res.ok || !json.success) {
        toast.error(!json.success ? json.error.message : a.invalidLink)
        return
      }
      toast.success(a.inviteDone)
    } catch {
      toast.error(a.invalidLink)
    } finally {
      setLoading(false)
    }
  }

  return (
    <PublicAuthFormShell>
      <h1 className="font-heading text-3xl font-extrabold tracking-tight text-on-surface">{a.inviteTitle}</h1>
      <p className="mt-2 leading-relaxed text-on-surface-variant">{a.inviteSubtitle}</p>
      <form onSubmit={onSubmit} className="mt-8 space-y-6">
        <div>
          <label className="mb-2 block font-heading text-sm font-semibold text-on-surface" htmlFor="invite-name">
            {a.nameLabel}
          </label>
          <div className="group relative">
            <UserRound
              className="pointer-events-none absolute left-4 top-1/2 h-5 w-5 -translate-y-1/2 text-outline transition-colors group-focus-within:text-primary"
              aria-hidden
            />
            <Input
              id="invite-name"
              value={name}
              onChange={(e) => setName(e.target.value)}
              placeholder={a.nameLabel}
              required
              className="h-14 rounded-xl border-none bg-surface-container-highest pl-12 pr-4 text-on-surface shadow-none transition-all placeholder:text-outline/60 focus-visible:bg-surface-container-lowest focus-visible:ring-2 focus-visible:ring-primary/20"
              autoComplete="name"
            />
          </div>
        </div>
        <div>
          <label className="mb-2 block font-heading text-sm font-semibold text-on-surface" htmlFor="invite-password">
            {messages.admin.login.passwordLabel}
          </label>
          <div className="group relative">
            <Lock
              className="pointer-events-none absolute left-4 top-1/2 h-5 w-5 -translate-y-1/2 text-outline transition-colors group-focus-within:text-primary"
              aria-hidden
            />
            <Input
              id="invite-password"
              type="password"
              required
              minLength={8}
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              placeholder={messages.admin.login.passwordPlaceholder}
              className="h-14 rounded-xl border-none bg-surface-container-highest pl-12 pr-4 text-on-surface shadow-none transition-all placeholder:text-outline/60 focus-visible:bg-surface-container-lowest focus-visible:ring-2 focus-visible:ring-primary/20"
              autoComplete="new-password"
            />
          </div>
        </div>
        <Button type="submit" className={authPublicPrimaryCtaClass} disabled={loading}>
          {a.inviteSubmit}
        </Button>
      </form>
      <AuthBackToLoginLink />
    </PublicAuthFormShell>
  )
}
