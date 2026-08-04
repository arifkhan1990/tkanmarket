'use client'

import { Eye, Terminal } from 'lucide-react'

import { Badge } from '@/components/ui/badge'
import { useI18n } from '@/hooks/useI18n'
import type { Locale } from '@/types/i18n.types'
import type { CatalogImportPreviewResponse } from '@/types/catalog-import.types'

function localeToBcp47(locale: Locale): string {
  if (locale === 'ru') return 'ru-RU'
  if (locale === 'zh') return 'zh-CN'
  return 'en-GB'
}

function formatWhen(iso: string | null, locale: Locale, dash: string) {
  if (!iso) return dash
  try {
    return new Intl.DateTimeFormat(localeToBcp47(locale), { dateStyle: 'medium', timeStyle: 'short' }).format(new Date(iso))
  } catch {
    return iso
  }
}

export function CatalogImportPreviewSection(props: {
  preview: CatalogImportPreviewResponse | undefined
  isLoading: boolean
}) {
  const { messages, locale } = useI18n()
  const c = messages.admin.catalogImportPage

  if (props.isLoading && !props.preview) {
    return (
      <div className="space-y-6">
        <div className="h-40 animate-pulse rounded-2xl bg-muted" />
        <div className="h-56 animate-pulse rounded-2xl bg-muted" />
      </div>
    )
  }

  const p = props.preview
  if (!p) return null

  return (
    <div className="space-y-6">
      <section className="overflow-hidden rounded-2xl bg-surface-container-low p-6 md:p-8">
        <div className="mb-6 flex items-center gap-3">
          <Eye className="h-5 w-5 text-muted-foreground" aria-hidden />
          <h3 className="text-xl font-bold text-on-surface">{c.previewTitle}</h3>
        </div>
        <div className="overflow-x-auto">
          <table className="w-full border-separate border-spacing-y-2">
            <thead>
              <tr className="text-left text-xs font-bold uppercase text-muted-foreground">
                <th className="px-4 pb-3">{c.colSku}</th>
                <th className="px-4 pb-3">{c.colTitle}</th>
                <th className="px-4 pb-3">{c.colPrice}</th>
                <th className="px-4 pb-3">{c.colStatus}</th>
              </tr>
            </thead>
            <tbody>
              {p.rows.length === 0 ? (
                <tr>
                  <td colSpan={4} className="rounded-xl bg-muted/40 px-4 py-6 text-center text-sm text-on-surface-variant">
                    {c.emptyPreview}
                  </td>
                </tr>
              ) : (
                p.rows.map((row) => (
                  <tr key={row.id} className="bg-background/80 hover:bg-background">
                    <td className="rounded-l-xl px-4 py-3 font-mono text-sm">{row.skuOrId}</td>
                    <td className={`px-4 py-3 text-sm font-semibold ${row.status === 'invalid' ? 'text-destructive' : ''}`}>
                      {row.title}
                    </td>
                    <td className="px-4 py-3 font-mono text-sm">{row.priceText ?? c.dash}</td>
                    <td className="rounded-r-xl px-4 py-3">
                      {row.status === 'valid' ? (
                        <Badge className="bg-emerald-100 text-emerald-800 hover:bg-emerald-100">{c.statusValid}</Badge>
                      ) : (
                        <Badge intent="error">{row.statusDetail ?? c.statusInvalid}</Badge>
                      )}
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </section>

      <div className="rounded-2xl border border-outline/10 bg-surface-container-high p-6">
        <h4 className="mb-3 flex items-center gap-2 text-sm font-bold">
          <Terminal className="h-4 w-4 text-primary" aria-hidden />
          {c.connectionTitle}
        </h4>
        <div className="space-y-3 text-xs">
          <div className="flex justify-between gap-4">
            <span className="text-muted-foreground">{c.feedLabel}</span>
            <span className="rounded bg-background px-2 py-0.5 font-mono">{p.connection.feedSourceLabel}</span>
          </div>
          <div className="flex justify-between gap-4">
            <span className="text-muted-foreground">{c.lastJob}</span>
            <span className="font-semibold text-emerald-700">{formatWhen(p.connection.lastSuccessfulAt, locale, c.dash)}</span>
          </div>
          <p className="text-muted-foreground leading-relaxed">{p.connection.refreshNote}</p>
        </div>
      </div>
    </div>
  )
}
