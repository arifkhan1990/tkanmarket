'use client'

import { ArrowRight, Settings2, Trash2 } from 'lucide-react'

import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
type FieldOpt = { key: string; label: string }

export function AdminCatalogExportMappingBlock(props: {
  fieldOptions: readonly FieldOpt[]
  activeKeys: string[]
  exportKeyByField: Record<string, string>
  onExportKeyChange: (fieldKey: string, value: string) => void
  onRemoveMapping: (fieldKey: string) => void
  format: string
  previewJson: string
}) {
  const { fieldOptions, activeKeys, exportKeyByField, onExportKeyChange, onRemoveMapping, format, previewJson } = props

  return (
    <div className="grid grid-cols-1 gap-8 lg:grid-cols-12">
      <div className="space-y-6 lg:col-span-8">
        <div className="space-y-6 rounded-xl bg-surface-container-lowest p-6 shadow-sm">
          <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
            <div className="flex items-center gap-3">
              <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-primary/10 text-primary">
                <Settings2 className="h-5 w-5" aria-hidden />
              </div>
              <h2 className="font-headline text-xl font-bold text-on-surface">Field mapping & schema</h2>
            </div>
            <div className="flex flex-wrap gap-2">
              <span className="rounded-full bg-surface-container-high px-3 py-1 font-mono text-xs font-medium text-muted-foreground">
                FORMAT: {format}
              </span>
              <span className="rounded-full bg-primary/10 px-3 py-1 font-mono text-xs font-medium text-primary">
                ENCODING: UTF-8
              </span>
            </div>
          </div>

          <div className="space-y-3">
            {activeKeys.map((key) => {
              const label = fieldOptions.find((f) => f.key === key)?.label ?? key
              return (
                <div
                  key={key}
                  className="grid grid-cols-1 items-center gap-3 rounded-xl bg-surface-container-low p-4 md:grid-cols-12"
                >
                  <div className="md:col-span-4">
                    <p className="text-[10px] font-bold uppercase text-muted-foreground">Database source</p>
                    <p className="font-mono text-sm text-on-surface">{key}</p>
                    <p className="text-xs text-muted-foreground">{label}</p>
                  </div>
                  <div className="flex justify-center md:col-span-1">
                    <ArrowRight className="h-5 w-5 text-muted-foreground" aria-hidden />
                  </div>
                  <div className="md:col-span-4">
                    <label className="text-[10px] font-bold uppercase text-muted-foreground" htmlFor={`ex-${key}`}>
                      Export key
                    </label>
                    <Input
                      id={`ex-${key}`}
                      value={exportKeyByField[key] ?? key}
                      onChange={(e) => onExportKeyChange(key, e.target.value)}
                      className="mt-1 font-mono text-sm"
                    />
                  </div>
                  <div className="flex justify-end gap-1 md:col-span-3">
                    <Button type="button" variant="ghost" size="icon" className="text-muted-foreground" disabled>
                      <Settings2 className="h-4 w-4" aria-hidden />
                    </Button>
                    <Button
                      type="button"
                      variant="ghost"
                      size="icon"
                      className="text-muted-foreground hover:text-destructive"
                      onClick={() => onRemoveMapping(key)}
                      aria-label={`Remove ${label}`}
                    >
                      <Trash2 className="h-4 w-4" />
                    </Button>
                  </div>
                </div>
              )
            })}
          </div>
        </div>

        <div className="relative overflow-hidden rounded-xl bg-surface-container-highest p-6 text-on-surface shadow-xl">
          <div className="mb-4 flex items-center justify-between">
            <h3 className="font-headline text-lg font-semibold">Live preview</h3>
            <div className="flex gap-1.5" aria-hidden>
              <div className="h-3 w-3 rounded-full bg-red-500/80" />
              <div className="h-3 w-3 rounded-full bg-amber-500/80" />
              <div className="h-3 w-3 rounded-full bg-emerald-500/80" />
            </div>
          </div>
          <pre className="max-h-64 overflow-y-auto font-mono text-xs leading-relaxed text-on-surface-variant">{previewJson}</pre>
        </div>
      </div>

      <aside className="space-y-6 lg:col-span-4">
        <div className="rounded-xl bg-surface-container-high p-6">
          <h3 className="font-headline text-lg font-bold">Export parameters</h3>
          <p className="mt-2 text-xs text-muted-foreground">
            Mapping labels affect the JSON preview. The export job still uses canonical fabric fields server-side.
          </p>
        </div>
      </aside>
    </div>
  )
}
