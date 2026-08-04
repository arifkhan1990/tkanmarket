'use client'

import { useCallback, useEffect, useState } from 'react'
import { useRouter } from 'next/navigation'
import { Button } from '@/components/ui/button'
import { Card, CardContent } from '@/components/ui/card'
import { Input } from '@/components/ui/input'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { Skeleton } from '@/components/ui/skeleton'
import { AdminDeleteConfirmDialog } from '@/components/admin/admin-delete-confirm-dialog'
import type { PromptRule } from '@/types/prompt-rules'
import { ImageRuleCard } from './ImageRuleCard'

async function api<T>(url: string, options?: RequestInit): Promise<{ data?: T; error?: string }> {
  try {
    const res = await fetch(url, { headers: { 'Content-Type': 'application/json', ...options?.headers }, ...options })
    const json = await res.json() as { data?: T; error?: string }
    return json
  } catch { return { error: 'Network error' } }
}

function formatDate(dateStr?: string | Date | null) {
  if (!dateStr) return null
  const d = new Date(dateStr)
  if (isNaN(d.getTime())) return null
  return d.toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric', hour: '2-digit', minute: '2-digit' })
}

export function ImageRulesSection() {
  const router = useRouter()
  const [rules, setRules] = useState<PromptRule[]>([])
  const [loading, setLoading] = useState(true)
  const [search, setSearch] = useState('')
  const [statusFilter, setStatusFilter] = useState<'all' | 'active' | 'inactive'>('all')
  const [videoFilter, setVideoFilter] = useState<'all' | 'video' | 'no-video'>('all')
  const [sortBy, setSortBy] = useState<'priority-asc' | 'priority-desc' | 'name-asc' | 'name-desc' | 'created-desc' | 'updated-desc'>('priority-asc')
  const [currentPage, setCurrentPage] = useState(1)
  const [pageSize, setPageSize] = useState(10)
  const [expandedRuleIds, setExpandedRuleIds] = useState<Record<number, boolean>>({})
  const [allExpanded, setAllExpanded] = useState(true)

  const toggleExpand = (id: number) => {
    setExpandedRuleIds((prev) => ({ ...prev, [id]: prev[id] !== undefined ? !prev[id] : !allExpanded }))
  }
  const toggleExpandAll = () => { setAllExpanded((p) => !p); setExpandedRuleIds({}) }

  const fetchRules = useCallback(async (showLoading = false) => {
    if (showLoading) setLoading(true)
    const res = await api<PromptRule[]>('/api/v1/admin/prompt-rules')
    if (res.data) setRules(res.data)
    setLoading(false)
  }, [])

  useEffect(() => {
    let isMounted = true
    api<PromptRule[]>('/api/v1/admin/prompt-rules').then((res) => {
      if (isMounted) { if (res.data) setRules(res.data); setLoading(false) }
    })
    return () => { isMounted = false }
  }, [])

  const handleDelete = async (id: number) => {
    await api(`/api/v1/admin/prompt-rules/${id}`, { method: 'DELETE' })
    fetchRules()
  }

  const handleToggleActive = async (rule: PromptRule) => {
    const nextState = !rule.isActive
    setRules((prev) => prev.map((r) => r.id === rule.id ? { ...r, isActive: nextState } : r))
    const res = await api(`/api/v1/admin/prompt-rules/${rule.id}`, { method: 'PUT', body: JSON.stringify({ isActive: nextState }) })
    if (res.error) fetchRules()
  }

  const handleExport = async () => {
    const res = await api<{ rules: unknown[] }>('/api/v1/admin/prompt-rules/export')
    if (res.data) {
      const blob = new Blob([JSON.stringify(res.data, null, 2)], { type: 'application/json' })
      const url = URL.createObjectURL(blob)
      const a = document.createElement('a')
      a.href = url; a.download = 'prompt-rules-export.json'; a.click()
      URL.revokeObjectURL(url)
    }
  }

  const filteredRules = rules.filter((rule) => {
    if (search.trim()) {
      const q = search.toLowerCase()
      const matchName = rule.name.toLowerCase().includes(q)
      const matchDesc = rule.description?.toLowerCase().includes(q)
      const matchConditions = rule.conditions.some((c) => c.field.toLowerCase().includes(q) || String(c.value).toLowerCase().includes(q))
      const matchPrompts = rule.imagePrompts.some((ip) => ip.label.toLowerCase().includes(q) || ip.prompt.toLowerCase().includes(q))
      const matchVideo = rule.videoPrompt?.toLowerCase().includes(q)
      if (!matchName && !matchDesc && !matchConditions && !matchPrompts && !matchVideo) return false
    }
    if (statusFilter === 'active' && !rule.isActive) return false
    if (statusFilter === 'inactive' && rule.isActive) return false
    if (videoFilter === 'video' && (!rule.videoPrompt || !rule.videoPromptEnabled)) return false
    if (videoFilter === 'no-video' && (rule.videoPrompt && rule.videoPromptEnabled)) return false
    return true
  }).sort((a, b) => {
    if (sortBy === 'priority-asc') return a.priority - b.priority
    if (sortBy === 'priority-desc') return b.priority - a.priority
    if (sortBy === 'name-asc') return a.name.localeCompare(b.name)
    if (sortBy === 'name-desc') return b.name.localeCompare(a.name)
    if (sortBy === 'created-desc') return new Date(b.createdAt ?? 0).getTime() - new Date(a.createdAt ?? 0).getTime()
    if (sortBy === 'updated-desc') return new Date(b.updatedAt ?? 0).getTime() - new Date(a.updatedAt ?? 0).getTime()
    return 0
  })

  const totalItems = filteredRules.length
  const totalPages = Math.ceil(totalItems / pageSize) || 1
  const validCurrentPage = Math.min(Math.max(1, currentPage), totalPages)
  const startIndex = (validCurrentPage - 1) * pageSize
  const paginatedRules = filteredRules.slice(startIndex, startIndex + pageSize)

  const totalRulesCount = rules.length
  const activeCount = rules.filter((r) => r.isActive).length
  const inactiveCount = rules.filter((r) => !r.isActive).length
  const videoEnabledCount = rules.filter((r) => r.videoPromptEnabled && r.videoPrompt).length

  if (loading) {
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
          <h1 className="font-heading text-heading-xl font-extrabold tracking-tight">AI Prompt Rules</h1>
          <p className="mt-1 text-sm text-on-surface-variant">Define automated image & video generation rules and fabric visual mapping.</p>
        </div>
        <div className="flex flex-wrap items-center gap-2">
          <Button variant="outline" onClick={handleExport} className="gap-2">
            <svg className="h-4 w-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-4l-4 4m0 0l-4-4m4 4V4" /></svg>
            Export
          </Button>
          <Button variant="outline" onClick={() => router.push('/admin/prompt-rules/import')} className="gap-2">
            <svg className="h-4 w-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-8l-4-4m0 0L8 8m4-4v12" /></svg>
            Import
          </Button>
          <Button onClick={() => router.push('/admin/prompt-rules/new')} className="gap-2">
            <svg className="h-4 w-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 4v16m8-8H4" /></svg>
            New Rule
          </Button>
        </div>
      </div>

      {/* Stats Cards */}
      <div className="grid grid-cols-2 gap-3 sm:grid-cols-4">
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
        <div className="rounded-xl border border-outline-variant bg-surface p-4 shadow-sm">
          <div className="text-xs font-semibold uppercase tracking-wider text-indigo-600 dark:text-indigo-400">Video Enabled</div>
          <div className="mt-2 text-2xl font-extrabold text-indigo-600 dark:text-indigo-400">{videoEnabledCount}</div>
        </div>
      </div>

      {/* Toolbar */}
      <Card className="p-4 shadow-sm">
        <div className="flex flex-col gap-3 md:flex-row md:items-center md:justify-between">
          <div className="relative flex-1">
            <svg className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-on-surface-variant" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" /></svg>
            <Input value={search} onChange={(e) => { setSearch(e.target.value); setCurrentPage(1) }} placeholder="Search rules by name, condition, or prompt text..." className="pl-9 pr-8" />
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
            <div className="w-36">
              <Select value={videoFilter} onValueChange={(v) => { setVideoFilter(v as typeof videoFilter); setCurrentPage(1) }}>
                <SelectTrigger className="h-9 text-xs"><SelectValue placeholder="Video" /></SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All Video Modes</SelectItem>
                  <SelectItem value="video">Has Video</SelectItem>
                  <SelectItem value="no-video">No Video</SelectItem>
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
                  <SelectItem value="created-desc">Newest Created First</SelectItem>
                  <SelectItem value="updated-desc">Recently Updated First</SelectItem>
                </SelectContent>
              </Select>
            </div>
            {(search || statusFilter !== 'all' || videoFilter !== 'all') && (
              <Button variant="ghost" size="sm" onClick={() => { setSearch(''); setStatusFilter('all'); setVideoFilter('all'); setCurrentPage(1) }} className="h-9 text-xs">
                Reset
              </Button>
            )}
            <Button variant="outline" size="sm" onClick={toggleExpandAll} className="h-9 text-xs gap-1.5">
              <svg className="h-3.5 w-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M19 9l-7 7-7-7" /></svg>
              {allExpanded ? 'Collapse All' : 'Expand All Details'}
            </Button>
          </div>
        </div>
      </Card>

      {/* Count Info */}
      <div className="flex items-center justify-between text-xs text-on-surface-variant px-1">
        <div>Found <strong className="text-on-surface">{filteredRules.length}</strong> matching rule(s){search && <span> for &ldquo;{search}&rdquo;</span>}</div>
        <div>Showing page {validCurrentPage} of {totalPages}</div>
      </div>

      {/* Empty State */}
      {filteredRules.length === 0 && (
        <Card className="py-12 text-center text-on-surface-variant">
          <CardContent className="space-y-3">
            <div className="mx-auto flex h-12 w-12 items-center justify-center rounded-full bg-surface-container-high">
              <svg className="h-6 w-6 text-on-surface-variant" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M19 11H5m14 0a2 2 0 012 2v6a2 2 0 01-2 2H5a2 2 0 01-2-2v-6a2 2 0 012-2m14 0V9a2 2 0 00-2-2M5 11V9a2 2 0 012-2m0 0V5a2 2 0 012-2h6a2 2 0 012 2v2M7 7h10" /></svg>
            </div>
            <p className="text-base font-semibold text-on-surface">No prompt rules matched your criteria.</p>
            <p className="text-sm">Try clearing filters or search keywords.</p>
          </CardContent>
        </Card>
      )}

      {/* Rules Cards */}
      <div className="space-y-4">
        {paginatedRules.map((rule) => {
          const isExpanded = expandedRuleIds[rule.id] !== undefined ? expandedRuleIds[rule.id] : allExpanded
          return (
            <ImageRuleCard
              key={rule.id}
              rule={rule}
              isExpanded={Boolean(isExpanded)}
              onToggleExpand={() => toggleExpand(rule.id)}
              onToggleActive={handleToggleActive}
              onDelete={handleDelete}
              formatDate={formatDate}
            />
          )
        })}
      </div>

      {/* Pagination */}
      {filteredRules.length > 0 && (
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
    </>
  )
}
