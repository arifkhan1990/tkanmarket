'use client'

import { useState, type FormEvent } from 'react'
import { Mail } from 'lucide-react'
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

export function ForgotPasswordClient() {
  const { messages } = useI18n()
  const a = messages.authPublic
  const [email, setEmail] = useState('')
  const [loading, setLoading] = useState(false)

  const onSubmit = async (e: FormEvent) => {
    e.preventDefault()
    setLoading(true)
    try {
      const res = await fetch('/api/v1/auth/forgot-password', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email })
      })
      const json = (await res.json()) as ApiEnvelope<{ ok: boolean }>
      if (!res.ok || !json.success) {
        toast.error(!json.success ? json.error.message : a.requestFailed)
        return
      }
      toast.success(a.emailSent)
    } catch {
      toast.error(a.requestFailed)
    } finally {
      setLoading(false)
    }
  }

  return (
    <PublicAuthFormShell>
      <h1 className="font-heading text-3xl font-extrabold tracking-tight text-on-surface">{a.forgotTitle}</h1>
      <p className="mt-2 leading-relaxed text-on-surface-variant">{a.forgotDescription}</p>
      <form onSubmit={onSubmit} className="mt-8 space-y-6">
        <div>
          <label className="mb-2 block font-heading text-sm font-semibold text-on-surface" htmlFor="forgot-email">
            {a.emailLabel}
          </label>
          <div className="group relative">
            <Mail
              className="pointer-events-none absolute left-4 top-1/2 h-5 w-5 -translate-y-1/2 text-outline transition-colors group-focus-within:text-primary"
              aria-hidden
            />
            <Input
              id="forgot-email"
              type="email"
              required
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              placeholder="name@company.com"
              className="h-14 rounded-xl border-none bg-surface-container-highest pl-12 pr-4 text-on-surface shadow-none transition-all placeholder:text-outline/60 focus-visible:bg-surface-container-lowest focus-visible:ring-2 focus-visible:ring-primary/20"
              autoComplete="email"
            />
          </div>
        </div>
        <Button type="submit" className={authPublicPrimaryCtaClass} disabled={loading}>
          {a.sendLink}
        </Button>
      </form>
      <AuthBackToLoginLink />
    </PublicAuthFormShell>
  )
}
