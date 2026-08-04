'use client'

import { useCallback, useEffect, useState } from 'react'
import { Button } from '@/components/ui/button'
import { Card, CardContent } from '@/components/ui/card'
import { Input } from '@/components/ui/input'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { Skeleton } from '@/components/ui/skeleton'
import type { TextPromptRule } from '@/types/prompt-rules'
import { TextRuleCard } from './TextRuleCard'
import { TextPromptRuleModal } from './TextPromptRuleModal'

async function api<T>(url: string, options?: RequestInit): Promise<{ data?: T; error?: string }> {
  try {
    const res = await fetch(url, { headers: { 'Content-Type': 'application/json', ...options?.headers }, ...options })
    const json = await res.json() as { data?: T; error?: string }
    return json
  } catch { return { error: 'Network error' } }
}

export function TextRulesSection() {
  const [textRules, setTextRules] = useState<TextPromptRule[]>([])
  const [textLoading, setTextLoading] = useState(true)
  const [textModalOpen, setTextModalOpen] = useState(false)
  const [editingTextRule, setEditingTextRule] = useState<TextPromptRule | null>(null)
  const [search, setSearch] = useState('')
  const [statusFilter, setStatusFilter] = useState<'all' | 'active' | 'inactive'>('all')
  const [sortBy, setSortBy] = useState<'priority-asc' | 'priority-desc' | 'name-asc' | 'name-desc'>('priority-asc')
  const [currentPage, setCurrentPage] = useState(1)
  const [pageSize, setPageSize] = useState(10)

  const fetchTextRules = useCallback(async (showLoading = false) => {
    if (showLoading) setTextLoading(true)
    const res = await api<TextPromptRule[]>('/api/v1/admin/text-prompt-rules')
    if (res.data) setTextRules(res.data)
    setTextLoading(false)
  }, [])

  useEffect(() => {
    let isMounted = true
    api<TextPromptRule[]>('/api/v1/admin/text-prompt-rules').then((res) => {
      if (isMounted) { if (res.data) setTextRules(res.data); setTextLoading(false) }
    })
    return () => { isMounted = false }
  }, [])

  const handleDeleteTextRule = async (id: number) => {
    await api(`/api/v1/admin/text-prompt-rules/${id}`, { method: 'DELETE' })
    fetchTextRules()
  }

  const handleToggleActiveTextRule = async (rule: TextPromptRule) => {
    const nextState = !rule.isActive
    setTextRules((prev) => prev.map((r) => r.id === rule.id ? { ...r, isActive: nextState } : r))
    const res = await api(`/api/v1/admin/text-prompt-rules/${rule.id}`, { method: 'PUT', body: JSON.stringify({ isActive: nextState }) })
    if (res.error) fetchTextRules()
  }

  const handleSeedTextRules = async () => {
    setTextLoading(true)
    await api('/api/v1/admin/text-prompt-rules/seed', { method: 'POST' })
    fetchTextRules()
  }

  const filteredTextRules = textRules.filter((rule) => {
    if (search.trim()) {
      const q = search.toLowerCase()
      const matchName = rule.name.toLowerCase().includes(q)
      const matchDesc = rule.description?.toLowerCase().includes(q)
      const matchConditions = rule.conditions.some((c) => c.field.toLowerCase().includes(q) || String(c.value).toLowerCase().includes(q))
      const matchPrompts =
        rule.enrichmentSystemPrompt?.toLowerCase().includes(q) ||
        rule.enrichmentUserTemplate?.toLowerCase().includes(q) ||
        rule.socialSystemPrompt?.toLowerCase().includes(q) ||
        rule.socialUserTemplate?.toLowerCase().includes(q) ||
        rule.blogSystemPrompt?.toLowerCase().includes(q) ||
        rule.blogUserTemplate?.toLowerCase().includes(q)
      if (!matchName && !matchDesc && !matchConditions && !matchPrompts) return false
    }
    if (statusFilter === 'active' && !rule.isActive) return false
    if (statusFilter === 'inactive' && rule.isActive) return false
    return true
  }).sort((a, b) => {
    if (sortBy === 'priority-asc') return a.priority - b.priority
    if (sortBy === 'priority-desc') return b.priority - a.priority
    if (sortBy === 'name-asc') return a.name.localeCompare(b.name)
    if (sortBy === 'name-desc') return b.name.localeCompare(a.name)
    return 0
  })

  const totalItems = filteredTextRules.length
  const totalPages = Math.ceil(totalItems / pageSize) || 1
  const validCurrentPage = Math.min(Math.max(1, currentPage), totalPages)
  const startIndex = (validCurrentPage - 1) * pageSize
  const paginatedTextRules = filteredTextRules.slice(startIndex, startIndex + pageSize)

  const totalRulesCount = textRules.length
  const activeCount = textRules.filter((r) => r.isActive).length
  const inactiveCount = textRules.filter((r) => !r.isActive).length

  if (textLoading) {
    return (
      <div className="space-y-4">
        <Skeleton className="h-20 w-full rounded-xl" />
        <Skeleton className="h-12 w-full rounded-lg" />
        <Skeleton className="h-32 w-full rounded-xl" />
        <Skeleton className="h-32 w-full rounded-xl" />
      </div>
    )
  }

  return (
    <>
      {/* Page Title & Top Actions */}
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h1 className="font-heading text-heading-xl font-extrabold tracking-tight">AI Text Prompt Rules</h1>
          <p className="mt-1 text-sm text-on-surface-variant">
            Configure system & user prompts for AI Product Enrichment, Translations, Social Media & Blog generators.
          </p>
        </div>
        <div className="flex flex-wrap items-center gap-2">
          <Button variant="outline" onClick={handleSeedTextRules} disabled={textLoading} className="gap-2">
            🌱 Seed Default Text Rules
          </Button>
          <Button
            onClick={() => {
              setEditingTextRule(null)
              setTextModalOpen(true)
            }}
            className="gap-2"
          >
            <svg className="h-4 w-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 4v16m8-8H4" /></svg>
            New Text Rule
          </Button>
        </div>
      </div>

      {/* Stats Cards - Exactly matching Image Rules Stats UI */}
      <div className="grid grid-cols-2 gap-3 sm:grid-cols-3">
        <div className="rounded-xl border border-outline-variant bg-surface p-4 shadow-sm">
          <div className="text-xs font-semibold uppercase tracking-wider text-on-surface-variant">Total Rules</div>
          <div className="mt-2 text-2xl font-extrabold text-on-surface">{totalRulesCount}</div>
        </div>
        <div className="rounded-xl border border-outline-variant bg-surface p-4 shadow-sm">
          <div className="text-xs font-semibold uppercase tracking-wider text-emerald-600 dark:text-emerald-400">Active Rules</div>
          <div className="mt-2 text-2xl font-extrabold text-emerald-600 dark:text-emerald-400">{activeCount}</div>
        </div>
        <div className="rounded-xl border border-outline-variant bg-surface p-4 shadow-sm">
          <div className="text-xs font-semibold uppercase tracking-wider text-amber-600 dark:text-amber-400">Inactive Rules</div>
          <div className="mt-2 text-2xl font-extrabold text-amber-600 dark:text-amber-400">{inactiveCount}</div>
        </div>
      </div>

      {/* Toolbar - Exactly matching Image Rules Toolbar UI */}
      <Card className="p-4 shadow-sm">
        <div className="flex flex-col gap-3 md:flex-row md:items-center md:justify-between">
          <div className="relative flex-1">
            <svg className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-on-surface-variant" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" /></svg>
            <Input
              value={search}
              onChange={(e) => { setSearch(e.target.value); setCurrentPage(1) }}
              placeholder="Search text rules by name, condition, or prompt text..."
              className="pl-9 pr-8"
            />
            {search && (
              <button onClick={() => { setSearch(''); setCurrentPage(1) }} className="absolute right-2.5 top-1/2 -translate-y-1/2 text-on-surface-variant hover:text-on-surface">✕</button>
            )}
          </div>
          <div className="flex flex-wrap items-center gap-2">
            <div className="w-32">
              <Select value={statusFilter} onValueChange={(v) => { setStatusFilter(v as typeof statusFilter); setCurrentPage(1) }}>
                <SelectTrigger className="h-9 text-xs"><SelectValue placeholder="Status" /></SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All Status</SelectItem>
                  <SelectItem value="active">Active Only</SelectItem>
                  <SelectItem value="inactive">Inactive Only</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div className="w-44">
              <Select value={sortBy} onValueChange={(v) => setSortBy(v as typeof sortBy)}>
                <SelectTrigger className="h-9 text-xs"><SelectValue placeholder="Sort By" /></SelectTrigger>
                <SelectContent>
                  <SelectItem value="priority-asc">Priority (Lowest First)</SelectItem>
                  <SelectItem value="priority-desc">Priority (Highest First)</SelectItem>
                  <SelectItem value="name-asc">Name (A → Z)</SelectItem>
                  <SelectItem value="name-desc">Name (Z → A)</SelectItem>
                </SelectContent>
              </Select>
            </div>
            {(search || statusFilter !== 'all') && (
              <Button variant="ghost" size="sm" onClick={() => { setSearch(''); setStatusFilter('all'); setCurrentPage(1) }} className="h-9 text-xs">
                Reset
              </Button>
            )}
          </div>
        </div>
      </Card>

      {/* Count Info */}
      <div className="flex items-center justify-between text-xs text-on-surface-variant px-1">
        <div>Found <strong className="text-on-surface">{filteredTextRules.length}</strong> matching text rule(s){search && <span> for &ldquo;{search}&rdquo;</span>}</div>
        <div>Showing page {validCurrentPage} of {totalPages}</div>
      </div>

      {/* Empty State */}
      {filteredTextRules.length === 0 && (
        <Card className="py-12 text-center text-on-surface-variant">
          <CardContent className="space-y-3">
            <div className="mx-auto flex h-12 w-12 items-center justify-center rounded-full bg-surface-container-high">
              <svg className="h-6 w-6 text-on-surface-variant" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M19 11H5m14 0a2 2 0 012 2v6a2 2 0 01-2 2H5a2 2 0 01-2-2v-6a2 2 0 012-2m14 0V9a2 2 0 00-2-2M5 11V9a2 2 0 012-2m0 0V5a2 2 0 012-2h6a2 2 0 012 2v2M7 7h10" /></svg>
            </div>
            <p className="text-base font-semibold text-on-surface">No text prompt rules matched your criteria.</p>
            <p className="text-sm">Try clearing filters or search keywords.</p>
          </CardContent>
        </Card>
      )}

      {/* Rules Cards List */}
      <div className="space-y-4">
        {paginatedTextRules.map((rule) => (
          <TextRuleCard
            key={rule.id}
            rule={rule}
            onToggleActive={handleToggleActiveTextRule}
            onEdit={(r) => { setEditingTextRule(r); setTextModalOpen(true) }}
            onDelete={handleDeleteTextRule}
          />
        ))}
      </div>

      {/* Pagination Bar */}
      {filteredTextRules.length > 0 && (
        <Card className="p-3">
          <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
            <div className="flex items-center gap-2 text-xs text-on-surface-variant">
              <span>Items per page:</span>
              <Select value={String(pageSize)} onValueChange={(v) => { setPageSize(Number(v)); setCurrentPage(1) }}>
                <SelectTrigger className="h-8 w-16 text-xs"><SelectValue /></SelectTrigger>
                <SelectContent>
                  <SelectItem value="5">5</SelectItem>
                  <SelectItem value="10">10</SelectItem>
                  <SelectItem value="20">20</SelectItem>
                  <SelectItem value="50">50</SelectItem>
                </SelectContent>
              </Select>
              <span>({startIndex + 1} - {Math.min(startIndex + pageSize, totalItems)} of {totalItems})</span>
            </div>
            <div className="flex items-center gap-1">
              <Button variant="outline" size="sm" onClick={() => setCurrentPage(1)} disabled={validCurrentPage <= 1} className="h-8 w-8 p-0" title="First Page">«</Button>
              <Button variant="outline" size="sm" onClick={() => setCurrentPage((p) => Math.max(1, p - 1))} disabled={validCurrentPage <= 1} className="h-8 px-2 text-xs">Previous</Button>
              <div className="flex items-center gap-1 px-1">
                {Array.from({ length: totalPages }, (_, i) => i + 1)
                  .filter((p) => p === 1 || p === totalPages || Math.abs(p - validCurrentPage) <= 1)
                  .map((p, idx, arr) => {
                    const prev = arr[idx - 1]
                    const showEllipsis = prev && p - prev > 1
                    return (
                      <div key={p} className="flex items-center gap-1">
                        {showEllipsis && <span className="text-xs text-on-surface-variant">...</span>}
                        <Button variant={p === validCurrentPage ? 'default' : 'outline'} size="sm" onClick={() => setCurrentPage(p)} className="h-8 w-8 p-0 text-xs font-semibold">{p}</Button>
                      </div>
                    )
                  })}
              </div>
              <Button variant="outline" size="sm" onClick={() => setCurrentPage((p) => Math.min(totalPages, p + 1))} disabled={validCurrentPage >= totalPages} className="h-8 px-2 text-xs">Next</Button>
              <Button variant="outline" size="sm" onClick={() => setCurrentPage(totalPages)} disabled={validCurrentPage >= totalPages} className="h-8 w-8 p-0" title="Last Page">»</Button>
            </div>
          </div>
        </Card>
      )}

      {/* Text Rule Create/Edit Modal */}
      <TextPromptRuleModal
        rule={editingTextRule}
        isOpen={textModalOpen}
        onClose={() => { setTextModalOpen(false); setEditingTextRule(null) }}
        onSaved={() => { fetchTextRules() }}
      />
    </>
  )
}
