'use client'

import { useState } from 'react'

import Link from 'next/link'
import { ArrowRight, Bug, Sparkles, Users } from 'lucide-react'

import { Button } from '@/components/ui/button'
import { Card, CardContent } from '@/components/ui/card'
import { useAdminSystemReleases } from '@/hooks/admin/useAdminSystemConsole'
import { useI18n } from '@/hooks/useI18n'
import { cn } from '@/lib/utils'
import type { SystemReleaseEntryDto, SystemReleaseHighlightDto } from '@/types/system-console.types'

function iconForHighlight(h: SystemReleaseHighlightDto) {
  if (h.kind === 'fixed') return Bug
  if (h.kind === 'improved' || h.kind === 'new') return Sparkles
  return Users
}

export function AdminSystemUpdateLogClient() {
  const { messages } = useI18n()
  const [page, setPage] = useState(1)
  const q = useAdminSystemReleases(page, 10)

  const data = q.data?.data
  const meta = q.data?.meta

  if (q.isLoading && !data) {
    return <div className="h-96 animate-pulse rounded-3xl bg-surface-container-high" />
  }
  if (q.isError || !data) {
    return (
      <p className="text-sm text-destructive">
        {q.error instanceof Error ? q.error.message : messages.admin.systemConsole.loadFailed}
      </p>
    )
  }

  const { items, featured } = data

  return (
    <div className="space-y-12">
      <header>
        <h1 className="font-heading text-heading-xl font-extrabold tracking-tight text-on-surface">
          {messages.admin.sidebar.systemUpdateLog}
        </h1>
        <p className="mt-2 max-w-2xl text-lg text-on-surface-variant">
          Product changelog for TkanMarket: performance, security, and marketplace features.
        </p>
      </header>

      {featured ? (
        <section className="grid gap-6 md:grid-cols-3">
          <Card className="md:col-span-2 rounded-3xl border border-outline/10 shadow-sm">
            <CardContent className="space-y-6 p-8">
              <div className="flex flex-wrap items-center gap-3">
                <span className="rounded-full bg-primary/10 px-3 py-1 font-mono text-xs font-bold text-primary">
                  Latest stable
                </span>
                <span className="font-mono text-sm text-on-surface-variant">
                  {new Date(featured.releasedAt).toLocaleDateString()}
                </span>
              </div>
              <h2 className="font-heading text-2xl font-bold">
                {featured.versionLabel}: {featured.title}
              </h2>
              <p className="text-on-surface-variant">{featured.summary}</p>
              <div className="flex flex-wrap gap-3">
                <Button className="rounded-xl" asChild>
                  <Link href="/admin/help-support">View documentation</Link>
                </Button>
                <Button variant="secondary" className="rounded-xl">
                  Full changelog
                </Button>
              </div>
            </CardContent>
          </Card>
          <Card className="relative overflow-hidden rounded-3xl border-0 bg-primary text-primary-foreground">
            <CardContent className="flex h-full flex-col justify-between p-8">
              <div>
                <p className="font-heading text-2xl font-bold">99.9% uptime</p>
                <p className="mt-2 text-sm text-primary-foreground/80">
                  Edge nodes and monitored queues keep the marketplace responsive.
                </p>
              </div>
              <div className="mt-8">
                <p className="font-mono text-3xl font-bold">—</p>
                <p className="text-xs uppercase tracking-widest opacity-70">Ops metric</p>
              </div>
            </CardContent>
          </Card>
        </section>
      ) : null}

      <div className="mx-auto max-w-4xl space-y-10">
        {items.map((entry: SystemReleaseEntryDto) => (
          <div key={entry.id} className="relative border-l-2 border-surface-container-high pl-8">
            <span
              className={cn(
                'absolute -left-[11px] top-0 h-5 w-5 rounded-full border-4 border-surface bg-primary ring-4 ring-surface',
                !entry.isFeatured && 'h-4 w-4 bg-surface-container-high'
              )}
            />
            <Card className="rounded-2xl border border-outline/10 bg-surface-container-low">
              <CardContent className="space-y-4 p-8">
                <div className="flex flex-wrap items-center justify-between gap-4">
                  <div className="flex flex-wrap items-center gap-3">
                    <span className="font-mono text-2xl font-bold">{entry.versionLabel}</span>
                    <span className="rounded-lg bg-secondary-container px-3 py-1 text-xs font-bold uppercase tracking-wide text-on-secondary-container">
                      {entry.releaseKind}
                    </span>
                  </div>
                  <time className="text-on-surface-variant">{new Date(entry.releasedAt).toLocaleDateString()}</time>
                </div>
                <h3 className="font-heading text-xl font-bold">{entry.title}</h3>
                <ul className="space-y-4">
                  {entry.highlights.map((h, idx) => {
                    const Icon = iconForHighlight(h)
                    return (
                      <li key={`${entry.id}-${idx}`} className="flex gap-3">
                        <Icon className="mt-0.5 h-5 w-5 shrink-0 text-primary" aria-hidden />
                        <div>
                          <p className="font-semibold text-on-surface">{h.title}</p>
                          <p className="text-sm text-on-surface-variant">{h.body}</p>
                        </div>
                      </li>
                    )
                  })}
                </ul>
              </CardContent>
            </Card>
          </div>
        ))}
      </div>

      {meta && meta.totalPages > 1 ? (
        <footer className="flex flex-col items-center gap-4 border-t border-outline/10 pt-10">
          <p className="text-on-surface-variant">Page {meta.page} of {meta.totalPages}</p>
          <div className="flex gap-2">
            <Button variant="outline" size="sm" disabled={page <= 1} onClick={() => setPage((p) => p - 1)}>
              Previous
            </Button>
            <Button variant="outline" size="sm" disabled={page >= meta.totalPages} onClick={() => setPage((p) => p + 1)}>
              Next
            </Button>
          </div>
        </footer>
      ) : null}

      <div className="flex justify-center">
        <Button variant="ghost" className="gap-2 font-bold text-primary" asChild>
          <Link href="/admin/dashboard">
            Back to dashboard
            <ArrowRight className="h-4 w-4" />
          </Link>
        </Button>
      </div>
    </div>
  )
}
