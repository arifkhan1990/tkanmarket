'use client'

import { useState, type FormEvent } from 'react'
import Link from 'next/link'
import { useRouter } from 'next/navigation'
import { signIn } from 'next-auth/react'
import { Eye, EyeOff, Grid3x3, Languages, Lock, LogIn, Mail } from 'lucide-react'
import { toast } from 'sonner'

import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { useI18n } from '@/hooks/useI18n'
import { withLocaleUrl } from '@/lib/i18n/locale-path'

function adminLoginDocsHref(): string | null {
  const u = process.env.NEXT_PUBLIC_DOCS_URL?.trim()
  return u && u.length > 0 ? u : null
}

export function AdminLoginClient() {
  const router = useRouter()
  const { messages, locale } = useI18n()
  const docsHref = adminLoginDocsHref()

  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [totpCode, setTotpCode] = useState('')
  const [showPassword, setShowPassword] = useState(false)
  const [submitting, setSubmitting] = useState(false)

  const m = messages.admin.login

  const onSubmit = async (e: FormEvent<HTMLFormElement>) => {
    e.preventDefault()
    setSubmitting(true)
    try {
      const res = await signIn('credentials', {
        email,
        password,
        totpCode: totpCode.trim().length >= 6 ? totpCode.trim() : undefined,
        redirect: false
      })

      if (!res || !res.ok) {
        toast.error(m.invalidCredentials)
        return
      }

      toast.success(m.welcomeBack)
      router.push('/admin/dashboard')
    } catch {
      toast.error(m.loginFailed)
    } finally {
      setSubmitting(false)
    }
  }

  return (
    <main className="relative flex min-h-screen items-center justify-center overflow-hidden bg-background p-6 font-sans text-on-surface antialiased selection:bg-primary-fixed selection:text-on-primary">
      <div className="pointer-events-none absolute inset-0 z-0">
        <div className="absolute -left-24 -top-24 h-96 w-96 rounded-full bg-primary/5 blur-[100px]" />
        <div className="absolute -right-48 top-1/2 h-[30rem] w-[30rem] rounded-full bg-secondary-container/10 blur-[120px]" />
        <div className="absolute -bottom-12 left-1/4 h-64 w-64 rounded-full bg-tertiary-fixed/20 blur-[80px]" />
      </div>

      <div className="relative z-10 w-full max-w-[460px]">
        <div className="mb-10 text-center">
          <div className="mb-6 inline-flex h-16 w-16 items-center justify-center rounded-2xl bg-surface-container-highest shadow-sm">
            <Grid3x3 className="h-8 w-8 text-primary" strokeWidth={2.5} aria-hidden />
          </div>
          <h1 className="font-heading text-display text-3xl font-extrabold tracking-tighter text-on-surface">
            {messages.common.brand}
          </h1>
          <p className="mt-2 font-heading text-lg font-bold tracking-tight text-on-surface-variant">
            {m.brandSubtitle}
          </p>
        </div>

        <div className="glass-card rounded-3xl border border-white/40 p-10 dark:border-white/10">
          <div className="mb-8">
            <h2 className="font-heading text-xl font-bold text-on-surface">{m.secureAccessTitle}</h2>
            <p className="mt-2 text-sm leading-relaxed text-on-surface-variant">{m.secureAccessDescription}</p>
          </div>

          <form onSubmit={onSubmit} className="space-y-6">
            <div className="space-y-2">
              <label className="ml-1 font-heading text-sm font-bold text-on-surface" htmlFor="admin-email">
                {m.workEmailLabel}
              </label>
              <div className="group relative">
                <Mail
                  className="pointer-events-none absolute left-4 top-1/2 h-5 w-5 -translate-y-1/2 text-outline transition-colors group-focus-within:text-primary"
                  aria-hidden
                />
                <Input
                  id="admin-email"
                  className="h-12 rounded-xl border-none bg-surface-container-highest pl-11 pr-4 text-on-surface shadow-none transition-all placeholder:text-outline/60 focus-visible:bg-surface-container-lowest focus-visible:ring-2 focus-visible:ring-primary/20"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  placeholder={m.emailPlaceholder}
                  inputMode="email"
                  autoComplete="email"
                  required
                />
              </div>
            </div>

            <div className="space-y-2">
              <div className="flex items-center justify-between px-1">
                <label className="font-heading text-sm font-bold text-on-surface" htmlFor="admin-password">
                  {m.passwordLabel}
                </label>
                <Link
                  href={withLocaleUrl('/forgot-password', locale)}
                  className="text-xs font-semibold text-primary transition-colors hover:text-primary-container"
                >
                  {m.forgotPassword}
                </Link>
              </div>
              <div className="group relative">
                <Lock
                  className="pointer-events-none absolute left-4 top-1/2 h-5 w-5 -translate-y-1/2 text-outline transition-colors group-focus-within:text-primary"
                  aria-hidden
                />
                <Input
                  id="admin-password"
                  className="h-12 rounded-xl border-none bg-surface-container-highest py-3.5 pl-11 pr-12 text-on-surface shadow-none transition-all placeholder:text-outline/60 focus-visible:bg-surface-container-lowest focus-visible:ring-2 focus-visible:ring-primary/20"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  placeholder={m.passwordPlaceholder}
                  type={showPassword ? 'text' : 'password'}
                  autoComplete="current-password"
                  required
                />
                <button
                  type="button"
                  className="absolute inset-y-0 right-0 flex items-center pr-4 text-outline transition-colors hover:text-on-surface"
                  onClick={() => setShowPassword((v) => !v)}
                  aria-label={showPassword ? m.hidePassword : m.showPassword}
                >
                  {showPassword ? <EyeOff className="h-5 w-5" /> : <Eye className="h-5 w-5" />}
                </button>
              </div>
            </div>

            <Button
              type="submit"
              disabled={submitting}
              className="group primary-gradient h-auto w-full rounded-2xl py-4 font-heading text-base font-bold text-on-primary shadow-lg shadow-primary/20 transition-all duration-200 hover:scale-[1.02] active:scale-[0.98]"
            >
              <span className="flex items-center justify-center gap-2">
                {submitting ? m.signingIn : m.authenticateSession}
                <LogIn className="h-5 w-5 transition-transform group-hover:translate-x-1" aria-hidden />
              </span>
            </Button>

            <p className="text-xs text-on-surface-variant">
              {m.envHintPrefix} <span className="font-mono">ADMIN_EMAIL</span> {m.envHintAnd}{' '}
              <span className="font-mono">ADMIN_PASSWORD</span> {m.envHintSuffix}
            </p>
          </form>

          <div className="mt-8 flex flex-col gap-4 border-t border-outline-variant/40 pt-8">
            <div className="flex flex-wrap items-center justify-center gap-4 sm:gap-6">
              <Link
                href={withLocaleUrl('/about', locale)}
                className="text-xs font-medium text-outline transition-colors hover:text-on-surface"
              >
                {m.footerSystemStatus}
              </Link>
              {docsHref ? (
                <a
                  href={docsHref}
                  className="text-xs font-medium text-outline transition-colors hover:text-on-surface"
                  rel="noreferrer"
                  target="_blank"
                >
                  {m.footerDocumentation}
                </a>
              ) : (
                <Link
                  href={withLocaleUrl('/contact', locale)}
                  className="text-xs font-medium text-outline transition-colors hover:text-on-surface"
                >
                  {m.footerDocumentation}
                </Link>
              )}
              <Link
                href={withLocaleUrl('/cookie-preferences', locale)}
                className="text-xs font-medium text-outline transition-colors hover:text-on-surface"
              >
                {m.footerSecurityAudit}
              </Link>
            </div>
          </div>
        </div>

        <div className="mt-10 flex flex-col items-center justify-between gap-4 px-2 md:flex-row">
          <div className="flex items-center gap-2">
            <Languages className="h-4 w-4 text-outline" aria-hidden />
            <span className="text-xs font-medium text-outline">{m.instanceLabel}</span>
          </div>
          <div className="flex items-center gap-4">
            <p className="font-mono text-xs tracking-tighter text-outline/70">{m.buildVersion}</p>
            <div
              className="h-2 w-2 rounded-full bg-emerald-500 shadow-[0_0_8px_rgba(16,185,129,0.5)]"
              aria-hidden
            />
          </div>
        </div>
      </div>

      <div className="pointer-events-none fixed bottom-0 right-0 hidden p-8 opacity-40 lg:block">
        <div className="flex h-48 w-48 items-center justify-center rounded-full border-[12px] border-primary-container/10">
          <div className="h-24 w-24 rounded-full border-[8px] border-primary-container/5" />
        </div>
      </div>
    </main>
  )
}
