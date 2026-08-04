'use client'

import { useRouter } from 'next/navigation'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardHeader } from '@/components/ui/card'
import { AdminDeleteConfirmDialog } from '@/components/admin/admin-delete-confirm-dialog'
import type { PromptRule, RuleCondition } from '@/types/prompt-rules'

interface ImageRuleCardProps {
  rule: PromptRule
  isExpanded: boolean
  onToggleExpand: () => void
  onToggleActive: (rule: PromptRule) => void
  onDelete: (id: number) => void
  formatDate: (d?: string | Date | null) => string | null
}

export function ImageRuleCard({ rule, isExpanded, onToggleExpand, onToggleActive, onDelete, formatDate }: ImageRuleCardProps) {
  const router = useRouter()
  const totalImages = rule.imagePrompts.reduce((sum, p) => sum + p.count, 0)

  return (
    <Card
      className={`transition-all hover:shadow-md ${rule.isActive ? 'border-outline-variant' : 'border-outline-variant/60 bg-surface-container-lowest/50 opacity-75'}`}
    >
      <CardHeader className="pb-3">
        <div className="flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between">
          <div className="space-y-1">
            <div className="flex items-center gap-2">
              <span className="font-mono text-xs font-bold text-on-surface-variant/80">P{rule.priority}</span>
              <h3 className="text-lg font-bold text-on-surface">{rule.name}</h3>
            </div>
            {rule.description && <p className="text-sm text-on-surface-variant">{rule.description}</p>}
          </div>

          <div className="flex items-center gap-3">
            <button
              onClick={() => onToggleActive(rule)}
              className={`inline-flex items-center gap-1.5 rounded-full px-3 py-1 text-xs font-semibold transition-colors ${rule.isActive
                ? 'bg-emerald-500/15 text-emerald-700 dark:text-emerald-300 hover:bg-emerald-500/25'
                : 'bg-amber-500/15 text-amber-700 dark:text-amber-300 hover:bg-amber-500/25'
              }`}
              title="Click to toggle rule activation state"
            >
              <span className={`h-2 w-2 rounded-full ${rule.isActive ? 'bg-emerald-500' : 'bg-amber-500'}`} />
              {rule.isActive ? 'Active' : 'Inactive'}
            </button>

            <div className="flex items-center gap-1">
              <Button size="sm" variant="ghost" onClick={onToggleExpand} className="h-8 text-xs gap-1">
                <svg className={`h-3.5 w-3.5 transition-transform ${isExpanded ? 'rotate-180' : ''}`} fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M19 9l-7 7-7-7" />
                </svg>
                {isExpanded ? 'Hide Details' : 'View Details'}
              </Button>
              <Button size="sm" variant="outline" onClick={() => router.push(`/admin/prompt-rules/${rule.id}`)} className="h-8 text-xs gap-1">
                <svg className="h-3.5 w-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" />
                </svg>
                Edit
              </Button>
              <AdminDeleteConfirmDialog
                title="Delete prompt rule?"
                description="This will soft-delete the rule and mark it as archived. No data will be permanently removed. This action cannot be undone."
                confirmLabel="Delete rule"
                onConfirm={async () => {
                  onDelete(rule.id)
                }}
              >
                <Button size="sm" variant="destructive" className="h-8 text-xs gap-1">
                  <svg className="h-3.5 w-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                  </svg>
                  Delete
                </Button>
              </AdminDeleteConfirmDialog>
            </div>
          </div>
        </div>
      </CardHeader>

      <CardContent className="space-y-3 pt-0">
        {/* Meta Pills */}
        <div className="flex flex-wrap items-center gap-2 text-xs">
          <Badge intent="default" className="font-normal gap-1 bg-surface-container-high text-on-surface">
            <svg className="h-3 w-3 text-on-surface-variant" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M3 4a1 1 0 011-1h16a1 1 0 011 1v2.586a1 1 0 01-.293.707l-6.414 6.414a1 1 0 00-.293.707V17l-4 4v-6.586a1 1 0 00-.293-.707L3.293 7.293A1 1 0 013 6.586V4z" />
            </svg>
            {rule.conditions.length === 0 ? 'Always Matches (Default)' : `${rule.conditions.length} Condition(s)`}
          </Badge>

          <Badge intent="default" className="font-normal gap-1 bg-surface-container-high text-on-surface">
            <svg className="h-3 w-3 text-on-surface-variant" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z" />
            </svg>
            {totalImages} Image(s) ({rule.imagePrompts.length} Prompt Types)
          </Badge>

          {rule.videoPromptEnabled && rule.videoPrompt ? (
            <Badge intent="default" className="font-normal gap-1 bg-indigo-500/10 text-indigo-700 dark:text-indigo-300">
              <svg className="h-3 w-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M15 10l4.553-2.276A1 1 0 0121 8.618v6.764a1 1 0 01-1.447.894L15 14M5 18h8a2 2 0 002-2V8a2 2 0 00-2-2H5a2 2 0 00-2 2v8a2 2 0 002 2z" />
              </svg>
              Video: {rule.videoDurationSeconds ?? 8}s ({rule.videoAspectRatio ?? '9:16'})
            </Badge>
          ) : (
            <span className="text-on-surface-variant/60">No Video Rule</span>
          )}

          {rule.createdAt && (
            <Badge intent="default" className="font-normal gap-1 bg-surface-container-high text-on-surface-variant">
              <svg className="h-3 w-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" />
              </svg>
              Added: {formatDate(rule.createdAt)}
            </Badge>
          )}
          {rule.updatedAt && (
            <Badge intent="default" className="font-normal gap-1 bg-surface-container-high text-on-surface-variant">
              <svg className="h-3 w-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" />
              </svg>
              Updated: {formatDate(rule.updatedAt)}
            </Badge>
          )}
        </div>

        {/* Condition Chips */}
        {rule.conditions.length > 0 && (
          <div className="flex flex-wrap gap-1.5 pt-1">
            {rule.conditions.map((c: RuleCondition, idx: number) => (
              <span
                key={idx}
                className="inline-flex items-center gap-1 rounded-md bg-surface-container-low px-2 py-0.5 font-mono text-[11px] text-on-surface"
              >
                <span className="font-semibold text-primary">{c.field}</span>
                <span className="text-on-surface-variant">{c.operator}</span>
                <span className="font-semibold text-on-surface">&ldquo;{Array.isArray(c.value) ? c.value.join(', ') : c.value}&rdquo;</span>
              </span>
            ))}
          </div>
        )}

        {/* Expanded Full Details */}
        {isExpanded && (
          <div className="mt-3 space-y-3.5 rounded-xl border border-outline-variant/60 bg-surface-container-lowest/80 p-3.5 text-xs">
            {rule.imagePrompts.length > 0 && (
              <div className="space-y-2">
                <div className="flex items-center justify-between">
                  <span className="font-bold uppercase tracking-wider text-on-surface-variant text-[11px] flex items-center gap-1.5">
                    <svg className="h-3.5 w-3.5 text-primary" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z" />
                    </svg>
                    Image Prompts ({rule.imagePrompts.length})
                  </span>
                </div>
                <div className="grid gap-2">
                  {rule.imagePrompts.map((ip, i) => (
                    <div key={i} className="rounded-lg border border-outline-variant/50 bg-surface p-3 space-y-1.5 shadow-2xs">
                      <div className="flex items-center justify-between">
                        <span className="font-bold text-on-surface text-xs">{ip.label || `Prompt #${i + 1}`}</span>
                        <span className="rounded-full bg-primary/10 px-2.5 py-0.5 font-mono text-[10px] font-semibold text-primary">
                          Generates {ip.count} Image(s)
                        </span>
                      </div>
                      <div className="rounded-md bg-surface-container-lowest p-2.5 font-mono text-[11px] leading-relaxed text-on-surface border border-outline-variant/40 max-h-48 overflow-y-auto whitespace-pre-wrap selection:bg-primary/20">
                        {ip.prompt}
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {rule.videoPromptEnabled && rule.videoPrompt && (
              <div className="space-y-1.5 pt-1">
                <div className="flex items-center justify-between">
                  <span className="font-bold uppercase tracking-wider text-indigo-600 dark:text-indigo-400 text-[11px] flex items-center gap-1.5">
                    <svg className="h-3.5 w-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M15 10l4.553-2.276A1 1 0 0121 8.618v6.764a1 1 0 01-1.447.894L15 14M5 18h8a2 2 0 002-2V8a2 2 0 00-2-2H5a2 2 0 00-2 2v8a2 2 0 002 2z" />
                    </svg>
                    Video Generation Prompt ({rule.videoDurationSeconds ?? 8}s • {rule.videoAspectRatio ?? '9:16'})
                  </span>
                </div>
                <div className="rounded-md bg-surface-container-lowest p-2.5 font-mono text-[11px] leading-relaxed text-on-surface border border-outline-variant/40 max-h-48 overflow-y-auto whitespace-pre-wrap selection:bg-indigo-500/20">
                  {rule.videoPrompt}
                </div>
              </div>
            )}
          </div>
        )}
      </CardContent>
    </Card>
  )
}
