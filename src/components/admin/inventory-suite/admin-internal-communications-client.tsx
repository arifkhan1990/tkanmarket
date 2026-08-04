'use client'

import { useMemo, useState } from 'react'
import { Megaphone, Rocket, Settings, Shield } from 'lucide-react'

import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Textarea } from '@/components/ui/textarea'
import {
  useAdminAnnouncementsQuery,
  useAckAnnouncementMutation,
  useCreateAnnouncementMutation
} from '@/hooks/admin/useAdminAnnouncementsQuery'
import { useI18n } from '@/hooks/useI18n'
import type { AdminAnnouncementImportance } from '@/types/admin-announcements.types'
import { invPageWrap, invPanel, invPanelMuted, invText } from '@/components/admin/inventory-suite/inventory-suite-styles'
import { cn } from '@/lib/utils'

const iconMap = {
  settings_suggest: Settings,
  rocket_launch: Rocket,
  security: Shield,
  campaign: Megaphone
} as const

export function AdminInternalCommunicationsClient() {
  const { messages } = useI18n()
  const t = messages.admin.inventorySuite
  const q = useAdminAnnouncementsQuery()
  const createMut = useCreateAnnouncementMutation()
  const ackMut = useAckAnnouncementMutation()

  const [title, setTitle] = useState('')
  const [body, setBody] = useState('')
  const [referenceCode, setReferenceCode] = useState('')
  const [importance, setImportance] = useState<AdminAnnouncementImportance>('MEDIUM')
  const [qLocal, setQLocal] = useState('')

  const filtered = useMemo(() => {
    const items = q.data?.items ?? []
    const s = qLocal.trim().toLowerCase()
    if (!s) return items
    return items.filter((i) => i.title.toLowerCase().includes(s) || i.body.toLowerCase().includes(s))
  }, [q.data?.items, qLocal])

  const onSubmit = () => {
    if (!title.trim() || !body.trim()) return
    const ref = referenceCode.trim()
    createMut.mutate(
      { title: title.trim(), body: body.trim(), importance, referenceCode: ref.length > 0 ? ref : null },
      {
        onSuccess: () => {
          setTitle('')
          setBody('')
          setReferenceCode('')
          setImportance('MEDIUM')
        }
      }
    )
  }

  return (
    <div className={invPageWrap()}>
      <header className="flex flex-col gap-3 sm:flex-row sm:items-end sm:justify-between">
        <div className="min-w-0">
          <h1 className={cn('font-heading text-3xl font-extrabold tracking-tight md:text-4xl', invText.title)}>
            {t.communicationsTitle}
          </h1>
          <p className={cn('mt-2 max-w-3xl text-sm', invText.body)}>{t.communicationsSubtitle}</p>
        </div>
      </header>

      <div className="grid grid-cols-1 gap-8 lg:grid-cols-12">
        <div className="space-y-6 lg:col-span-5">
          <div className={invPanel('p-6 md:p-8')}>
            <div className="mb-6 flex items-center gap-3">
              <Megaphone className="h-6 w-6 text-brand-600 dark:text-brand-400" aria-hidden />
              <h2 className={cn('text-lg font-semibold', invText.title)}>{t.newBroadcast}</h2>
            </div>
            <div className="space-y-5">
              <div className="space-y-2">
                <label className={cn('text-xs font-semibold uppercase tracking-wide', invText.muted)}>{t.announcementTitle}</label>
                <Input value={title} onChange={(e) => setTitle(e.target.value)} placeholder="e.g. Crawler upgrade" />
              </div>
              <div className="space-y-2">
                <span className={cn('text-xs font-semibold uppercase tracking-wide', invText.muted)}>{t.importance}</span>
                <div className="grid grid-cols-3 gap-2">
                  {(['LOW', 'MEDIUM', 'HIGH'] as const).map((lvl) => (
                    <Button
                      key={lvl}
                      type="button"
                      variant={importance === lvl ? 'default' : 'outline'}
                      className={cn('rounded-xl text-xs', importance === lvl && 'bg-brand-600')}
                      onClick={() => setImportance(lvl)}
                    >
                      {lvl === 'LOW' ? t.importanceLow : lvl === 'MEDIUM' ? t.importanceMedium : t.importanceHigh}
                    </Button>
                  ))}
                </div>
              </div>
              <div className="space-y-2">
                <label className={cn('text-xs font-semibold uppercase tracking-wide', invText.muted)}>
                  {t.referenceCodeOptional}
                </label>
                <Input
                  value={referenceCode}
                  onChange={(e) => setReferenceCode(e.target.value)}
                  placeholder={t.referenceCodePlaceholder}
                  maxLength={80}
                />
              </div>
              <div className="space-y-2">
                <label className={cn('text-xs font-semibold uppercase tracking-wide', invText.muted)}>{t.content}</label>
                <Textarea
                  value={body}
                  onChange={(e) => setBody(e.target.value)}
                  rows={4}
                  placeholder="Describe the change and impact…"
                  className="min-h-[120px] resize-y"
                />
              </div>
              <Button
                className="w-full rounded-2xl py-6 font-semibold"
                onClick={onSubmit}
                disabled={createMut.isPending || !title.trim() || !body.trim()}
              >
                {t.postAnnouncement}
              </Button>
            </div>
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div className={invPanelMuted('p-5')}>
              <p className={cn('text-[10px] font-bold uppercase tracking-wider', invText.muted)}>{t.openRate}</p>
              <p className="mt-1 text-2xl font-black text-brand-600 dark:text-brand-400">
                {q.isLoading ? '—' : `${q.data?.overview.openRatePercent ?? 0}%`}
              </p>
            </div>
            <div className={invPanelMuted('p-5')}>
              <p className={cn('text-[10px] font-bold uppercase tracking-wider', invText.muted)}>{t.activeUsers}</p>
              <p className={cn('mt-1 text-2xl font-black', invText.strong)}>{q.data?.overview.teamSize ?? '—'}</p>
            </div>
          </div>
        </div>

        <div className="space-y-6 lg:col-span-7">
          <div className="mb-4 flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
            <h2 className={cn('text-lg font-semibold', invText.title)}>{t.recentUpdates}</h2>
            <Input
              className="max-w-sm"
              placeholder={t.searchAnnouncements}
              value={qLocal}
              onChange={(e) => setQLocal(e.target.value)}
            />
          </div>

          <div className={invPanel('p-6 md:p-8')}>
            {q.isLoading ? (
              <div className="space-y-4">
                {[1, 2, 3].map((i) => (
                  <div key={i} className="h-28 animate-pulse rounded-xl bg-surface-container-high" />
                ))}
              </div>
            ) : filtered.length === 0 ? (
              <p className={cn('text-sm', invText.muted)}>{t.noAnnouncements}</p>
            ) : (
              <ul className="space-y-4">
                {filtered.map((item) => {
                  const Icon = iconMap[item.iconKey] ?? Megaphone
                  return (
                    <li
                      key={item.id}
                      className="flex gap-4 rounded-2xl border border-transparent p-3 transition-colors hover:border-outline/10 hover:bg-surface-container-low"
                    >
                      <div className="flex h-12 w-12 shrink-0 items-center justify-center rounded-2xl bg-brand-100 text-brand-700 dark:bg-brand-950/60 dark:text-brand-300">
                        <Icon className="h-6 w-6" aria-hidden />
                      </div>
                      <div className="min-w-0 flex-1">
                        <div className="flex flex-wrap items-start justify-between gap-2">
                          <h3 className={cn('font-semibold', invText.title)}>{item.title}</h3>
                          {item.referenceCode ? (
                            <span className="rounded bg-surface-container-high px-2 py-0.5 font-mono text-[10px] font-bold uppercase text-on-surface">
                              {item.referenceCode}
                            </span>
                          ) : null}
                        </div>
                        <p className={cn('mt-1 line-clamp-3 text-sm', invText.body)}>{item.body}</p>
                        <div className="mt-3 flex flex-wrap items-center gap-3 border-t border-outline/10 pt-3">
                          <div className="flex -space-x-2">
                            {item.recentAckAuthors.slice(0, 3).map((u) => (
                              <div
                                key={u.id}
                                className="flex h-6 w-6 items-center justify-center overflow-hidden rounded-full border-2 border-surface-container-lowest bg-surface-container-high text-[9px] font-bold text-on-surface"
                              >
                                {u.name.slice(0, 2).toUpperCase()}
                              </div>
                            ))}
                          </div>
                          <span className={cn('text-xs', invText.muted)}>
                            {t.acknowledgements.replace('{ack}', String(item.ackCount)).replace('{team}', String(item.teamSize))}
                          </span>
                          {item.importance === 'HIGH' ? (
                            <span className="ml-auto text-xs font-semibold text-red-600">{t.importanceHigh}</span>
                          ) : null}
                          <Button
                            type="button"
                            variant="outline"
                            size="sm"
                            className="ml-auto sm:ml-0"
                            disabled={ackMut.isPending}
                            onClick={() => ackMut.mutate(item.id)}
                          >
                            {t.acknowledge}
                          </Button>
                        </div>
                      </div>
                    </li>
                  )
                })}
              </ul>
            )}
          </div>

          <div className="relative overflow-hidden rounded-2xl border border-outline/20 bg-on-surface p-6 text-background md:p-8">
            <div className="relative z-10">
              <p className="text-[10px] font-bold uppercase tracking-[0.2em] text-brand-200">{t.teamHighlight}</p>
              <p className="mt-2 max-w-lg text-lg font-semibold leading-snug">
                {(filtered[0]?.body ?? q.data?.items[0]?.body ?? '').slice(0, 160)}
                {(filtered[0]?.body ?? q.data?.items[0]?.body ?? '').length > 160 ? '…' : ''}
              </p>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}
