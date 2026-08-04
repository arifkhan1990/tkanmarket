'use client'

import { useState } from 'react'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardHeader } from '@/components/ui/card'
import { AdminDeleteConfirmDialog } from '@/components/admin/admin-delete-confirm-dialog'
import type { TextPromptRule } from '@/types/prompt-rules'

interface TextRuleCardProps {
  rule: TextPromptRule
  onToggleActive: (rule: TextPromptRule) => void
  onEdit: (rule: TextPromptRule) => void
  onDelete: (id: number) => void
}

export function TextRuleCard({ rule, onToggleActive, onEdit, onDelete }: TextRuleCardProps) {
  const [isExpanded, setIsExpanded] = useState(true)

  return (
    <Card className={`transition-all hover:shadow-md ${rule.isActive ? 'border-outline-variant' : 'border-outline-variant/60 bg-surface-container-lowest/50 opacity-75'}`}>
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
              <Button size="sm" variant="ghost" onClick={() => setIsExpanded(!isExpanded)} className="h-8 text-xs gap-1">
                <svg className={`h-3.5 w-3.5 transition-transform ${isExpanded ? 'rotate-180' : ''}`} fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M19 9l-7 7-7-7" />
                </svg>
                {isExpanded ? 'Hide Details' : 'View Details'}
              </Button>
              <Button size="sm" variant="outline" onClick={() => onEdit(rule)} className="h-8 text-xs gap-1">
                <svg className="h-3.5 w-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" />
                </svg>
                Edit
              </Button>
              <AdminDeleteConfirmDialog
                title="Delete text prompt rule?"
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
            {rule.conditions.length === 0 ? 'Always Matches (Default Rule)' : `${rule.conditions.length} Condition(s)`}
          </Badge>

          <Badge intent="default" className="font-normal gap-1 bg-primary/10 text-primary">
            📝 4 AI Text Templates
          </Badge>
        </div>

        {/* Condition Chips */}
        {rule.conditions.length > 0 && (
          <div className="flex flex-wrap gap-1.5 pt-1">
            {rule.conditions.map((c, idx) => (
              <span key={idx} className="inline-flex items-center gap-1 rounded-md bg-surface-container-low px-2 py-0.5 font-mono text-[11px] text-on-surface">
                <span className="font-semibold text-primary">{c.field}</span>
                <span className="text-on-surface-variant">{c.operator}</span>
                <span className="font-semibold text-on-surface">&ldquo;{Array.isArray(c.value) ? c.value.join(', ') : c.value}&rdquo;</span>
              </span>
            ))}
          </div>
        )}

        {/* Expanded Details */}
        {isExpanded && (
          <div className="mt-3 space-y-3 rounded-xl border border-outline-variant/60 bg-surface-container-lowest/80 p-3.5 text-xs">
            <div className="grid gap-3 sm:grid-cols-2">
              {/* Product Enrichment */}
              <div className="rounded-lg border border-primary/20 bg-primary/5 p-3 space-y-1 text-xs">
                <div className="font-bold text-primary flex items-center justify-between">
                  <span>🤖 Product Enrichment Prompt</span>
                  <span className="text-[10px] font-normal opacity-80">JSON Output</span>
                </div>
                {rule.enrichmentSystemPrompt && (
                  <p className="font-mono text-[11px] text-on-surface-variant line-clamp-2 italic">Sys: {rule.enrichmentSystemPrompt}</p>
                )}
                {rule.enrichmentUserTemplate && (
                  <div className="font-mono text-[11px] text-on-surface font-medium bg-surface p-2 rounded border border-primary/10 max-h-32 overflow-y-auto whitespace-pre-wrap">
                    {rule.enrichmentUserTemplate}
                  </div>
                )}
              </div>

              {/* Social Media Post */}
              <div className="rounded-lg border border-indigo-500/20 bg-indigo-500/5 p-3 space-y-1 text-xs">
                <div className="font-bold text-indigo-600 dark:text-indigo-400 flex items-center justify-between">
                  <span>📱 Social Copy Generator</span>
                  <span className="text-[10px] font-normal opacity-80">Captions / Reels</span>
                </div>
                {rule.socialSystemPrompt && (
                  <p className="font-mono text-[11px] text-on-surface-variant line-clamp-2 italic">Sys: {rule.socialSystemPrompt}</p>
                )}
                {rule.socialUserTemplate && (
                  <div className="font-mono text-[11px] text-on-surface font-medium bg-surface p-2 rounded border border-indigo-500/10 max-h-32 overflow-y-auto whitespace-pre-wrap">
                    {rule.socialUserTemplate}
                  </div>
                )}
              </div>

              {/* Translation & Localization */}
              <div className="rounded-lg border border-emerald-500/20 bg-emerald-500/5 p-3 space-y-1 text-xs">
                <div className="font-bold text-emerald-600 dark:text-emerald-400">🌐 Translation & Localization</div>
                {rule.translationUserTemplate ? (
                  <div className="font-mono text-[11px] text-on-surface font-medium bg-surface p-2 rounded border border-emerald-500/10 max-h-32 overflow-y-auto whitespace-pre-wrap">
                    {rule.translationUserTemplate}
                  </div>
                ) : (
                  <span className="text-[10px] text-on-surface-variant italic">Default translation system prompt</span>
                )}
              </div>

              {/* Blog Generator */}
              <div className="rounded-lg border border-amber-500/20 bg-amber-500/5 p-3 space-y-1 text-xs">
                <div className="font-bold text-amber-600 dark:text-amber-400">📰 Blog Article Generator</div>
                {rule.blogUserTemplate ? (
                  <div className="font-mono text-[11px] text-on-surface font-medium bg-surface p-2 rounded border border-amber-500/10 max-h-32 overflow-y-auto whitespace-pre-wrap">
                    {rule.blogUserTemplate}
                  </div>
                ) : (
                  <span className="text-[10px] text-on-surface-variant italic">Default B2B blog template</span>
                )}
              </div>
            </div>
          </div>
        )}
      </CardContent>
    </Card>
  )
}
