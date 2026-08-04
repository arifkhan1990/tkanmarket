'use client'

import Link from 'next/link'
import { Download, Loader2, Save } from 'lucide-react'

import { Button } from '@/components/ui/button'
import { cn } from '@/lib/utils'
import type { WholesaleTiersWorkspaceCopy } from '@/types/wholesale-tiers-workspace.types'

type HeaderCopy = Pick<
  WholesaleTiersWorkspaceCopy,
  'listPageTitle' | 'listPageSubtitle' | 'openSimulator' | 'exportCsv' | 'saveChanges'
>

export function WholesaleTiersWorkspaceHeader(props: {
  layout: 'admin' | 'supplier'
  supplierUiTab: 'studio' | 'console'
  /** When set, subtitle becomes `{name} — {listPageSubtitle}` */
  supplierName: string | null
  p: HeaderCopy
  simulatorHref: string
  onExportCsv: () => void
  onSave: () => void
  savePending: boolean
  saveDisabled: boolean
}) {
  const {
    layout,
    supplierUiTab,
    supplierName,
    p,
    simulatorHref,
    onExportCsv,
    onSave,
    savePending,
    saveDisabled
  } = props

  return (
    <header
      className={cn(
        'mb-8 flex flex-col gap-4 md:flex-row md:items-end md:justify-between',
        layout === 'supplier' &&
          supplierUiTab === 'console' &&
          'rounded-2xl border border-outline/10 bg-surface-container-lowest/50 p-6'
      )}
    >
      <div>
        <h1 className="font-headline text-3xl font-extrabold tracking-tight text-on-surface md:text-4xl">{p.listPageTitle}</h1>
        <p className="mt-2 max-w-2xl text-on-surface-variant">
          {supplierName ? `${supplierName} — ${p.listPageSubtitle}` : p.listPageSubtitle}
        </p>
      </div>
      <div className="flex flex-wrap gap-2">
        <Button type="button" variant="outline" className="rounded-xl" asChild>
          <Link href={simulatorHref}>{p.openSimulator}</Link>
        </Button>
        <Button type="button" variant="outline" className="rounded-xl" onClick={onExportCsv}>
          <Download className="mr-2 h-4 w-4" />
          {p.exportCsv}
        </Button>
        <Button
          type="button"
          className="rounded-xl bg-gradient-to-br from-primary to-primary/90 font-semibold shadow-lg shadow-primary/20"
          disabled={saveDisabled}
          onClick={onSave}
        >
          {savePending ? <Loader2 className="h-4 w-4 animate-spin" /> : <Save className="mr-2 h-4 w-4" />}
          {p.saveChanges}
        </Button>
      </div>
    </header>
  )
}
