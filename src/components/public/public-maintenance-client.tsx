'use client'

import Link from 'next/link'
import Image from 'next/image'
import { usePathname } from 'next/navigation'
import { useEffect, useState } from 'react'

import {
  Building2,
  CheckCircle2,
  Cloud,
  Mail,
  RefreshCw,
  Rss,
  Server,
  Shield,
  Hourglass
} from 'lucide-react'

import { Button } from '@/components/ui/button'
import { usePublicMaintenance } from '@/hooks/admin/useAdminSystemConsole'
import { DEFAULT_LOCALE } from '@/types/i18n.types'
import { getLocaleFromPathname, withLocaleUrl } from '@/lib/i18n/locale-path'

function useCountdown(target: Date | null) {
  const [now, setNow] = useState(() => Date.now())
  useEffect(() => {
    if (!target) return
    const t = window.setInterval(() => setNow(Date.now()), 1000)
    return () => window.clearInterval(t)
  }, [target])
  if (!target) return { h: 0, m: 0, s: 0 }
  const diff = Math.max(0, target.getTime() - now)
  const s = Math.floor(diff / 1000) % 60
  const m = Math.floor(diff / (1000 * 60)) % 60
  const h = Math.floor(diff / (1000 * 60 * 60))
  return { h, m, s }
}

export function PublicMaintenanceClient() {
  const q = usePublicMaintenance()
  const pathname = usePathname()
  const locale = getLocaleFromPathname(pathname) ?? DEFAULT_LOCALE
  const homeHref = withLocaleUrl('/', locale)
  const data = q.data
  const end = data?.scheduledEnd ? new Date(data.scheduledEnd) : null
  const cd = useCountdown(end)

  if (q.isLoading && !data) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-surface p-6">
        <div className="h-12 w-12 animate-pulse rounded-full bg-surface-container-high" />
      </div>
    )
  }
  if (q.isError || !data) {
    return (
      <div className="flex min-h-screen flex-col items-center justify-center gap-4 bg-surface p-6 text-center">
        <p className="text-on-surface-variant">Unable to load maintenance status.</p>
        <Button asChild>
          <Link href={homeHref}>Home</Link>
        </Button>
      </div>
    )
  }

  if (!data.isEnabled) {
    return (
      <div className="flex min-h-screen flex-col items-center justify-center gap-6 bg-surface p-6 text-center">
        <p className="max-w-md text-on-surface-variant">All systems operational. The marketplace is available.</p>
        <Button asChild className="rounded-full">
          <Link href={homeHref}>Continue to TkanMarket</Link>
        </Button>
      </div>
    )
  }

  const steps = data.migrationSteps
  const progress = data.migrationProgress

  return (
    <main className="relative flex min-h-screen flex-col items-center overflow-x-hidden bg-surface px-6 py-16 text-on-surface antialiased">
      <div className="pointer-events-none absolute inset-0 -z-10 overflow-hidden">
        <div className="absolute -right-[5%] -top-[10%] h-[40vw] w-[40vw] rounded-full bg-primary-container/10 blur-[120px]" />
        <div className="absolute -bottom-[10%] -left-[5%] h-[30vw] w-[30vw] rounded-full bg-secondary-container/20 blur-[100px]" />
      </div>

      <div className="mb-10 flex items-center gap-3">
        <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-primary-container shadow-lg shadow-primary-container/20">
          <Building2 className="h-7 w-7 text-primary-foreground" aria-hidden />
        </div>
        <span className="font-heading text-2xl font-extrabold tracking-tighter">TkanMarket</span>
      </div>

      <div className="grid w-full max-w-5xl grid-cols-1 items-stretch gap-6 md:grid-cols-12">
        <div className="relative flex flex-col justify-between overflow-hidden rounded-[2rem] bg-surface-container-lowest p-10 shadow-sm md:col-span-7">
          <div>
            <div className="mb-6 inline-flex items-center gap-2 rounded-full bg-primary-fixed px-3 py-1 text-xs font-bold uppercase tracking-wider text-on-primary-fixed-variant">
              <span className="h-2 w-2 animate-pulse rounded-full bg-primary" />
              Scheduled upgrade
            </div>
            <h1 className="font-heading text-4xl font-extrabold leading-tight tracking-tight text-on-surface md:text-5xl">
              Under <span className="text-primary-container">maintenance</span>
            </h1>
            <p className="mt-4 max-w-md text-lg leading-relaxed text-on-surface-variant">{data.body}</p>
          </div>
          <div className="relative mt-8 h-64 w-full overflow-hidden rounded-2xl">
            {data.heroImageUrl ? (
              <Image
                src={data.heroImageUrl}
                alt=""
                fill
                className="object-cover opacity-90 grayscale transition duration-700 hover:grayscale-0"
                sizes="(max-width: 768px) 100vw, 60vw"
                priority
              />
            ) : (
              <div className="h-full w-full bg-gradient-to-br from-primary/20 to-surface-container-high" />
            )}
            <div className="absolute inset-0 bg-gradient-to-t from-primary-container/40 to-transparent" />
          </div>
        </div>

        <div className="flex flex-col gap-6 md:col-span-5">
          <div className="rounded-[2rem] bg-surface-container-high p-8 shadow-sm">
            <h2 className="mb-6 text-sm font-bold uppercase tracking-widest text-on-surface-variant">
              Estimated restoration
            </h2>
            <div className="grid grid-cols-3 gap-4 text-center">
              <div>
                <span className="font-mono text-3xl font-bold tabular-nums">{String(cd.h).padStart(2, '0')}</span>
                <p className="mt-1 text-[10px] font-bold uppercase text-on-surface-variant/70">Hours</p>
              </div>
              <div className="border-x border-outline-variant/30">
                <span className="font-mono text-3xl font-bold tabular-nums">{String(cd.m).padStart(2, '0')}</span>
                <p className="mt-1 text-[10px] font-bold uppercase text-on-surface-variant/70">Minutes</p>
              </div>
              <div>
                <span className="font-mono text-3xl font-bold tabular-nums">{String(cd.s).padStart(2, '0')}</span>
                <p className="mt-1 text-[10px] font-bold uppercase text-on-surface-variant/70">Seconds</p>
              </div>
            </div>
          </div>

          <div className="flex flex-1 flex-col rounded-[2rem] border border-outline-variant/10 bg-surface-container-lowest p-8 shadow-sm">
            <div className="mb-6 flex items-end justify-between">
              <div>
                <h2 className="font-heading font-bold text-on-surface">Backend migrations</h2>
                <p className="text-xs text-on-surface-variant">Live progress from operations</p>
              </div>
              <span className="font-mono text-sm font-bold text-primary">{progress}%</span>
            </div>
            <div className="h-3 w-full overflow-hidden rounded-full bg-surface-container">
              <div
                className="h-full rounded-full bg-gradient-to-r from-primary to-primary-container transition-all"
                style={{ width: `${progress}%` }}
              />
            </div>
            <div className="mt-4 space-y-3">
              {steps.map((step) => (
                <div key={step.id} className="flex items-center justify-between gap-3">
                  <div className="flex items-center gap-3">
                    {step.state === 'done' ? (
                      <CheckCircle2 className="h-5 w-5 text-emerald-600" />
                    ) : step.state === 'in_progress' ? (
                      <RefreshCw className="h-5 w-5 animate-spin text-primary" />
                    ) : (
                      <Hourglass className="h-5 w-5 text-on-surface-variant" />
                    )}
                    <span className="text-sm font-medium">{step.label}</span>
                  </div>
                  <span className="text-[10px] font-mono capitalize text-on-surface-variant">{step.state.replace('_', ' ')}</span>
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>

      <div className="mt-10 grid w-full max-w-5xl grid-cols-1 gap-4 md:grid-cols-3">
        <div className="flex items-center gap-5 rounded-[1.5rem] bg-surface-container-low p-6 transition hover:bg-surface-container-high">
          <div className="flex h-12 w-12 items-center justify-center rounded-full bg-surface-container-lowest text-primary shadow-sm">
            <Shield className="h-6 w-6" aria-hidden />
          </div>
          <div>
            <h3 className="text-sm font-bold">Priority support</h3>
            <p className="text-xs text-on-surface-variant">Contact your account manager</p>
          </div>
        </div>
        <div className="flex items-center gap-5 rounded-[1.5rem] bg-surface-container-low p-6 transition hover:bg-surface-container-high">
          <div className="flex h-12 w-12 items-center justify-center rounded-full bg-surface-container-lowest text-primary shadow-sm">
            <Rss className="h-6 w-6" aria-hidden />
          </div>
          <div>
            <h3 className="text-sm font-bold">Status</h3>
            <p className="text-xs text-on-surface-variant">Infrastructure health</p>
          </div>
        </div>
        <div className="flex items-center gap-5 rounded-[1.5rem] bg-primary-container p-6 text-primary-foreground">
          <div className="flex h-12 w-12 items-center justify-center rounded-full bg-white/20 text-white">
            <Mail className="h-6 w-6" aria-hidden />
          </div>
          <div>
            <h3 className="text-sm font-bold">Get notified</h3>
            <p className="text-xs text-white/80">We will email when service resumes</p>
          </div>
        </div>
      </div>

      <p className="mt-12 max-w-2xl text-center text-sm text-on-surface-variant/60">
        System ID:{' '}
        <span className="rounded bg-surface-container px-2 py-0.5 font-mono text-xs">{data.systemIdLabel}</span>
      </p>

      <div className="mt-8 inline-flex flex-wrap items-center justify-center gap-6 rounded-full border border-white/40 bg-surface-container/50 px-8 py-3 shadow-xl backdrop-blur-xl">
        <div className="flex items-center gap-2">
          <Shield className="h-4 w-4 text-primary" />
          <span className="text-[10px] font-bold uppercase tracking-widest text-on-surface-variant">Encrypted</span>
        </div>
        <div className="h-4 w-px bg-outline-variant/30" />
        <div className="flex items-center gap-2">
          <Server className="h-4 w-4 text-primary" />
          <span className="text-[10px] font-bold uppercase tracking-widest text-on-surface-variant">Global nodes</span>
        </div>
        <div className="h-4 w-px bg-outline-variant/30" />
        <div className="flex items-center gap-2">
          <Cloud className="h-4 w-4 text-primary" />
          <span className="text-[10px] font-bold uppercase tracking-widest text-on-surface-variant">High availability</span>
        </div>
      </div>
    </main>
  )
}
