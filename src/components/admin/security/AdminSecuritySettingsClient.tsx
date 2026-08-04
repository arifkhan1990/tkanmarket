'use client'

import Link from 'next/link'
import { ExternalLink, KeyRound, Laptop, Shield, Smartphone, Sparkles } from 'lucide-react'

import { Button } from '@/components/ui/button'
import { Card, CardContent, CardHeader } from '@/components/ui/card'
import { useI18n } from '@/hooks/useI18n'
import { cn } from '@/lib/utils'

export function AdminSecuritySettingsClient() {
  const { messages } = useI18n()
  const s = messages.admin.securitySettingsPage

  return (
    <div className="space-y-6 pb-16">
      <header className="mb-10">
        <h1 className="font-heading text-3xl font-extrabold tracking-tight text-on-surface sm:text-4xl">{s.title}</h1>
        <p className="mt-2 max-w-2xl text-lg text-on-surface-variant">{s.subtitle}</p>
      </header>

      <div className="grid grid-cols-1 gap-8 lg:grid-cols-12">
        <div className="flex flex-col gap-8 lg:col-span-7">
          <Card className="shadow-[0_20px_50px_rgba(24,28,32,0.04)]">
            <CardHeader className="flex flex-row items-start justify-between gap-4 pb-2">
              <div className="flex gap-4">
                <div className="rounded-2xl bg-primary/10 p-3">
                  <Shield className="h-8 w-8 text-primary" aria-hidden />
                </div>
                <div>
                  <h2 className="text-xl font-bold text-on-surface">{s.totpTitle}</h2>
                  <p className="text-sm text-on-surface-variant">{s.totpSubtitle}</p>
                </div>
              </div>
              <span className="rounded-full bg-emerald-100 px-3 py-1 text-xs font-bold uppercase tracking-wide text-emerald-800 dark:bg-emerald-900/40 dark:text-emerald-200">
                {s.totpActive}
              </span>
            </CardHeader>
            <CardContent className="space-y-3">
              <div className="flex flex-col justify-between gap-3 rounded-2xl bg-surface-container-low p-4 sm:flex-row sm:items-center">
                <div className="flex items-center gap-3">
                  <Smartphone className="h-5 w-5 text-on-surface-variant" aria-hidden />
                  <div>
                    <p className="text-sm font-semibold text-on-surface">{s.totpApp}</p>
                    <p className="text-xs text-on-surface-variant">{s.totpAppHint}</p>
                  </div>
                </div>
                <Button variant="link" className="h-auto p-0 text-primary" asChild>
                  <Link href="/admin/security/2fa">{s.totpConfigure}</Link>
                </Button>
              </div>
            </CardContent>
          </Card>

          <Card className="shadow-[0_20px_50px_rgba(24,28,32,0.04)]">
            <CardHeader className="flex gap-4 pb-2">
              <div className="rounded-2xl bg-secondary/10 p-3">
                <KeyRound className="h-8 w-8 text-secondary" aria-hidden />
              </div>
              <div>
                <h2 className="text-xl font-bold text-on-surface">{s.passwordTitle}</h2>
                <p className="text-sm text-on-surface-variant">{s.passwordSubtitle}</p>
              </div>
            </CardHeader>
            <CardContent>
              <p className="rounded-2xl bg-surface-container-low px-4 py-3 text-sm text-on-surface-variant">{s.passwordHint}</p>
              <div className="mt-6 flex flex-wrap gap-3">
                <Button variant="outline" className="rounded-xl" asChild>
                  <Link href="/admin/profile">{s.linkProfile}</Link>
                </Button>
              </div>
            </CardContent>
          </Card>
        </div>

        <div className="flex flex-col gap-8 lg:col-span-5">
          <Card className="shadow-[0_20px_50px_rgba(24,28,32,0.04)]">
            <CardHeader className="flex flex-row items-center justify-between pb-2">
              <h2 className="text-xl font-bold text-on-surface">{s.sessionsTitle}</h2>
              <Button variant="link" className="h-auto p-0 text-xs font-bold uppercase text-error" asChild>
                <Link href="/admin/profile">{s.sessionsRevoke}</Link>
              </Button>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="flex gap-4">
                <div className="flex h-10 w-10 items-center justify-center rounded-full bg-surface-container">
                  <Laptop className="h-5 w-5 text-on-surface-variant" aria-hidden />
                </div>
                <div>
                  <p className="text-sm font-bold text-on-surface">Browser</p>
                  <p className="text-xs text-on-surface-variant">{s.sessionsSubtitle}</p>
                </div>
              </div>
              <Button variant="secondary" className="w-full rounded-xl" asChild>
                <Link href="/admin/profile">{s.sessionsManage}</Link>
              </Button>
            </CardContent>
          </Card>

          <Card className="flex grow flex-col shadow-[0_20px_50px_rgba(24,28,32,0.04)]">
            <CardHeader className="flex flex-row items-center justify-between pb-2">
              <h2 className="text-xl font-bold text-on-surface">{s.auditTitle}</h2>
              <Button variant="outline" size="icon" className="rounded-full" asChild>
                <Link href="/admin/audit-log" aria-label={s.auditOpen}>
                  <ExternalLink className="h-4 w-4" />
                </Link>
              </Button>
            </CardHeader>
            <CardContent className="space-y-4">
              <p className="text-sm text-on-surface-variant">{s.auditEmpty}</p>
              <Button variant="outline" className="w-full rounded-xl" asChild>
                <Link href="/admin/audit-log">{s.auditOpen}</Link>
              </Button>
            </CardContent>
          </Card>
        </div>
      </div>

      <div className="mt-10 flex flex-col justify-end gap-4 sm:flex-row">
        <Button variant="secondary" className="rounded-2xl px-8 py-6" type="button" disabled>
          {s.discard}
        </Button>
        <Button className="rounded-2xl px-10 py-6" type="button" disabled title={s.saveNote}>
          <Sparkles className="h-4 w-4" aria-hidden />
          {s.save}
        </Button>
      </div>
      <p className="mt-3 text-center text-xs text-on-surface-variant sm:text-right">{s.saveNote}</p>
    </div>
  )
}
