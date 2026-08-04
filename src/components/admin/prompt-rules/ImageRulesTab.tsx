'use client'

import { useCallback, useEffect, useState } from 'react'
import { useRouter } from 'next/navigation'
import { Button } from '@/components/ui/button'
import { Card, CardContent } from '@/components/ui/card'
import type { PromptRule } from '@/types/prompt-rules'
import { api } from './prompt-rules-helpers'
import { ImageRulesStats } from './ImageRulesStats'
import { ImageRulesToolbar, type ImageSortOption } from './ImageRulesToolbar'
import { ImageRuleCard } from './ImageRuleCard'
import { PromptRulesPagination } from './PromptRulesPagination'

export function ImageRulesTab() {
  const router = useRouter()
  const [rules, setRules] = useState<PromptRule[]>([])
  const [loading, setLoading] = useState(true)

  /* Search, Filter, Sort, Pagination & Details States */
  const [search, setSearch] = useState('')
  const [statusFilter, setStatusFilter] = useState<'all' | 'active' | 'inactive'>('all')
  const [videoFilter, setVideoFilter] = useState<'all' | 'video' | 'no-video'>('all')
  const [sortBy, setSortBy] = useState<ImageSortOption>('priority-asc')
  
  const [currentPage, setCurrentPage] = useState(1)
  const [pageSize, setPageSize] = useState(10)

  /* Details expansion state */
  const [expandedRuleIds, setExpandedRuleIds] = useState<Record<number, boolean>>({})
  const [allExpanded, setAllExpanded] = useState(true)

  const toggleExpand = (id: number) => {
    setExpandedRuleIds((prev) => ({
      ...prev,
      [id]: prev[id] !== undefined ? !prev[id] : !allExpanded
    }))
  }

  const toggleExpandAll = () => {
    const nextState = !allExpanded
    setAllExpanded(nextState)
    setExpandedRuleIds({})
  }

  const fetchRules = useCallback(async (showLoading = false) => {
    if (showLoading) setLoading(true)
    const res = await api<PromptRule[]>('/api/v1/admin/prompt-rules')
    if (res.data) setRules(res.data)
    setLoading(false)
  }, [])

  useEffect(() => {
    let isMounted = true
    api<PromptRule[]>('/api/v1/admin/prompt-rules').then((res) => {
      if (isMounted) {
        if (res.data) setRules(res.data)
        setLoading(false)
      }
    })
    return () => {
      isMounted = false
    }
  }, [])

  const handleDelete = async (id: number) => {
    await api(`/api/v1/admin/prompt-rules/${id}`, { method: 'DELETE' })
    fetchRules()
  }

  const handleToggleActive = async (rule: PromptRule) => {
    const nextState = !rule.isActive
    setRules((prev) => prev.map((r) => (r.id === rule.id ? { ...r, isActive: nextState } : r)))
    const res = await api(`/api/v1/admin/prompt-rules/${rule.id}`, {
      method: 'PUT',
      body: JSON.stringify({ isActive: nextState })
    })
    if (res.error) {
      fetchRules()
    }
  }

  const handleExport = async () => {
    const res = await api<{ rules: unknown[] }>('/api/v1/admin/prompt-rules/export')
    if (res.data) {
      const blob = new Blob([JSON.stringify(res.data, null, 2)], { type: 'application/json' })
      const url = URL.createObjectURL(blob)
      const a = document.createElement('a')
      a.href = url
      a.download = 'prompt-rules-export.json'
      a.click()
      URL.revokeObjectURL(url)
    }
  }

  /* Compute Filtered & Sorted Rules */
  const filteredRules = rules
    .filter((rule) => {
      if (search.trim()) {
        const q = search.toLowerCase()
        const matchName = rule.name.toLowerCase().includes(q)
        const matchDesc = rule.description?.toLowerCase().includes(q)
        const matchConditions = rule.conditions.some(
          (c) => c.field.toLowerCase().includes(q) || String(c.value).toLowerCase().includes(q)
        )
        const matchPrompts = rule.imagePrompts.some(
          (ip) => ip.label.toLowerCase().includes(q) || ip.prompt.toLowerCase().includes(q)
        )
        const matchVideo = rule.videoPrompt?.toLowerCase().includes(q)
        if (!matchName && !matchDesc && !matchConditions && !matchPrompts && !matchVideo) {
          return false
        }
      }

      if (statusFilter === 'active' && !rule.isActive) return false
      if (statusFilter === 'inactive' && rule.isActive) return false

      if (videoFilter === 'video' && (!rule.videoPrompt || !rule.videoPromptEnabled)) return false
      if (videoFilter === 'no-video' && rule.videoPrompt && rule.videoPromptEnabled) return false

      return true
    })
    .sort((a, b) => {
      if (sortBy === 'priority-asc') return a.priority - b.priority
      if (sortBy === 'priority-desc') return b.priority - a.priority
      if (sortBy === 'name-asc') return a.name.localeCompare(b.name)
      if (sortBy === 'name-desc') return b.name.localeCompare(a.name)
      if (sortBy === 'created-desc')
        return new Date(b.createdAt ?? 0).getTime() - new Date(a.createdAt ?? 0).getTime()
      if (sortBy === 'updated-desc')
        return new Date(b.updatedAt ?? 0).getTime() - new Date(a.updatedAt ?? 0).getTime()
      return 0
    })

  // Pagination calculations
  const totalItems = filteredRules.length
  const totalPages = Math.ceil(totalItems / pageSize) || 1
  const validCurrentPage = Math.min(Math.max(1, currentPage), totalPages)
  const startIndex = (validCurrentPage - 1) * pageSize
  const paginatedRules = filteredRules.slice(startIndex, startIndex + pageSize)

  // Stats
  const totalRulesCount = rules.length
  const activeCount = rules.filter((r) => r.isActive).length
  const inactiveCount = rules.filter((r) => !r.isActive).length
  const videoEnabledCount = rules.filter((r) => r.videoPromptEnabled && r.videoPrompt).length

  return (
    <>
      {/* Page Title & Top Actions */}
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h1 className="font-heading text-heading-xl font-extrabold tracking-tight">AI Prompt Rules</h1>
          <p className="mt-1 text-sm text-on-surface-variant">
            Define automated image & video generation rules and fabric visual mapping.
          </p>
        </div>
        <div className="flex flex-wrap items-center gap-2">
          <Button variant="outline" onClick={handleExport} className="gap-2">
            <svg className="h-4 w-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth="2"
                d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-4l-4 4m0 0l-4-4m4 4V4"
              />
            </svg>
            Export
          </Button>
          <Button variant="outline" onClick={() => router.push('/admin/prompt-rules/import')} className="gap-2">
            <svg className="h-4 w-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth="2"
                d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-8l-4-4m0 0L8 8m4-4v12"
              />
            </svg>
            Import
          </Button>
          <Button onClick={() => router.push('/admin/prompt-rules/new')} className="gap-2">
            <svg className="h-4 w-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 4v16m8-8H4" />
            </svg>
            New Rule
          </Button>
        </div>
      </div>

      {/* Overview Stats Cards */}
      <ImageRulesStats
        totalCount={totalRulesCount}
        activeCount={activeCount}
        inactiveCount={inactiveCount}
        videoEnabledCount={videoEnabledCount}
      />

      {/* Toolbar */}
      <ImageRulesToolbar
        search={search}
        onSearchChange={(val) => {
          setSearch(val)
          setCurrentPage(1)
        }}
        statusFilter={statusFilter}
        onStatusFilterChange={(val) => {
          setStatusFilter(val)
          setCurrentPage(1)
        }}
        videoFilter={videoFilter}
        onVideoFilterChange={(val) => {
          setVideoFilter(val)
          setCurrentPage(1)
        }}
        sortBy={sortBy}
        onSortByChange={setSortBy}
        allExpanded={allExpanded}
        onToggleExpandAll={toggleExpandAll}
        onResetFilters={() => {
          setSearch('')
          setStatusFilter('all')
          setVideoFilter('all')
          setCurrentPage(1)
        }}
      />

      {/* Rules Count info */}
      <div className="flex items-center justify-between text-xs text-on-surface-variant px-1">
        <div>
          Found <strong className="text-on-surface">{filteredRules.length}</strong> matching rule(s)
          {search && <span> for &ldquo;{search}&rdquo;</span>}
        </div>
        <div>
          Showing page {validCurrentPage} of {totalPages}
        </div>
      </div>

      {/* Empty State */}
      {filteredRules.length === 0 && (
        <Card className="py-12 text-center text-on-surface-variant">
          <CardContent className="space-y-3">
            <div className="mx-auto flex h-12 w-12 items-center justify-center rounded-full bg-surface-container-high">
              <svg className="h-6 w-6 text-on-surface-variant" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth="2"
                  d="M19 11H5m14 0a2 2 0 012 2v6a2 2 0 01-2 2H5a2 2 0 01-2-2v-6a2 2 0 012-2m14 0V9a2 2 0 00-2-2M5 11V9a2 2 0 012-2m0 0V5a2 2 0 012-2h6a2 2 0 012 2v2M7 7h10"
                />
              </svg>
            </div>
            <p className="text-base font-semibold text-on-surface">No prompt rules matched your criteria.</p>
            <p className="text-sm">Try clearing filters or search keywords.</p>
          </CardContent>
        </Card>
      )}

      {/* Rules Card Grid */}
      <div className="space-y-4">
        {paginatedRules.map((rule) => {
          const isExpanded = Boolean(expandedRuleIds[rule.id] ?? allExpanded)
          return (
            <ImageRuleCard
              key={rule.id}
              rule={rule}
              isExpanded={isExpanded}
              onToggleExpand={() => toggleExpand(rule.id)}
              onToggleActive={handleToggleActive}
              onDelete={handleDelete}
              formatDate={(d) => (d ? new Date(d).toLocaleDateString() : null)}
            />
          )
        })}
      </div>

      {/* Pagination Bar */}
      {filteredRules.length > 0 && (
        <PromptRulesPagination
          currentPage={validCurrentPage}
          pageSize={pageSize}
          totalItems={totalItems}
          totalPages={totalPages}
          onPageChange={setCurrentPage}
          onPageSizeChange={setPageSize}
        />
      )}
    </>
  )
}
