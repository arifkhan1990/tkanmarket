'use client'

import { useCallback, useEffect, useState } from 'react'
import { Card, CardContent } from '@/components/ui/card'
import type { TextPromptRule } from '@/types/prompt-rules'
import { api } from './prompt-rules-helpers'
import { TextRulesStats } from './TextRulesStats'
import { TextRulesToolbar, type TextSortOption } from './TextRulesToolbar'
import { TextRuleCard } from './TextRuleCard'
import { TextPromptRuleModal } from './TextPromptRuleModal'
import { PromptRulesPagination } from './PromptRulesPagination'

export function TextRulesTab() {
  const [textRules, setTextRules] = useState<TextPromptRule[]>([])
  const [textLoading, setTextLoading] = useState(true)
  const [textModalOpen, setTextModalOpen] = useState(false)
  const [editingTextRule, setEditingTextRule] = useState<TextPromptRule | null>(null)
  const [textSearch, setTextSearch] = useState('')
  const [textStatusFilter, setTextStatusFilter] = useState<'all' | 'active' | 'inactive'>('all')
  const [textSortBy, setTextSortBy] = useState<TextSortOption>('priority-asc')

  const [textCurrentPage, setTextCurrentPage] = useState(1)
  const [textPageSize, setTextPageSize] = useState(10)

  /* Text details expansion state */
  const [expandedTextRuleIds, setExpandedTextRuleIds] = useState<Record<number, boolean>>({})
  const [allTextExpanded, setAllTextExpanded] = useState(true)

  const toggleExpandText = (id: number) => {
    setExpandedTextRuleIds((prev) => ({
      ...prev,
      [id]: prev[id] !== undefined ? !prev[id] : !allTextExpanded
    }))
  }

  const toggleExpandAllText = () => {
    const nextState = !allTextExpanded
    setAllTextExpanded(nextState)
    setExpandedTextRuleIds({})
  }

  const fetchTextRules = useCallback(async (showLoading = false) => {
    if (showLoading) setTextLoading(true)
    const res = await api<TextPromptRule[]>('/api/v1/admin/text-prompt-rules')
    if (res.data) setTextRules(res.data)
    setTextLoading(false)
  }, [])

  useEffect(() => {
    let isMounted = true
    api<TextPromptRule[]>('/api/v1/admin/text-prompt-rules').then((res) => {
      if (isMounted) {
        if (res.data) setTextRules(res.data)
        setTextLoading(false)
      }
    })
    return () => {
      isMounted = false
    }
  }, [])

  const handleDeleteTextRule = async (id: number) => {
    await api(`/api/v1/admin/text-prompt-rules/${id}`, { method: 'DELETE' })
    fetchTextRules()
  }

  const handleToggleActiveTextRule = async (rule: TextPromptRule) => {
    const nextState = !rule.isActive
    setTextRules((prev) => prev.map((r) => (r.id === rule.id ? { ...r, isActive: nextState } : r)))
    const res = await api(`/api/v1/admin/text-prompt-rules/${rule.id}`, {
      method: 'PUT',
      body: JSON.stringify({ isActive: nextState })
    })
    if (res.error) {
      fetchTextRules()
    }
  }

  const handleSeedTextRules = async () => {
    setTextLoading(true)
    await api('/api/v1/admin/text-prompt-rules/seed', { method: 'POST' })
    fetchTextRules()
  }

  /* Compute Filtered Text Prompt Rules */
  const filteredTextRules = textRules
    .filter((rule) => {
      if (textSearch.trim()) {
        const q = textSearch.toLowerCase()
        const matchName = rule.name.toLowerCase().includes(q)
        const matchDesc = rule.description?.toLowerCase().includes(q)
        const matchConditions = rule.conditions.some(
          (c) => c.field.toLowerCase().includes(q) || String(c.value).toLowerCase().includes(q)
        )
        const matchPrompts =
          rule.enrichmentSystemPrompt?.toLowerCase().includes(q) ||
          rule.enrichmentUserTemplate?.toLowerCase().includes(q) ||
          rule.socialSystemPrompt?.toLowerCase().includes(q) ||
          rule.socialUserTemplate?.toLowerCase().includes(q) ||
          rule.blogSystemPrompt?.toLowerCase().includes(q) ||
          rule.blogUserTemplate?.toLowerCase().includes(q)

        if (!matchName && !matchDesc && !matchConditions && !matchPrompts) return false
      }

      if (textStatusFilter === 'active' && !rule.isActive) return false
      if (textStatusFilter === 'inactive' && rule.isActive) return false

      return true
    })
    .sort((a, b) => {
      if (textSortBy === 'priority-asc') return a.priority - b.priority
      if (textSortBy === 'priority-desc') return b.priority - a.priority
      if (textSortBy === 'name-asc') return a.name.localeCompare(b.name)
      if (textSortBy === 'name-desc') return b.name.localeCompare(a.name)
      if (textSortBy === 'created-desc')
        return new Date(b.createdAt ?? 0).getTime() - new Date(a.createdAt ?? 0).getTime()
      if (textSortBy === 'updated-desc')
        return new Date(b.updatedAt ?? 0).getTime() - new Date(a.updatedAt ?? 0).getTime()
      return 0
    })

  // Text Pagination calculations
  const totalTextItems = filteredTextRules.length
  const totalTextPages = Math.ceil(totalTextItems / textPageSize) || 1
  const validTextCurrentPage = Math.min(Math.max(1, textCurrentPage), totalTextPages)
  const startTextIndex = (validTextCurrentPage - 1) * textPageSize
  const paginatedTextRules = filteredTextRules.slice(startTextIndex, startTextIndex + textPageSize)

  // Text Stats
  const totalTextCount = textRules.length
  const activeTextCount = textRules.filter((r) => r.isActive).length
  const inactiveTextCount = textRules.filter((r) => !r.isActive).length
  const defaultTextCount = textRules.filter((r) => !r.conditions || r.conditions.length === 0).length

  return (
    <div className="space-y-6">
      <TextRulesToolbar
        search={textSearch}
        onSearchChange={(val) => {
          setTextSearch(val)
          setTextCurrentPage(1)
        }}
        statusFilter={textStatusFilter}
        onStatusFilterChange={(val) => {
          setTextStatusFilter(val)
          setTextCurrentPage(1)
        }}
        sortBy={textSortBy}
        onSortByChange={setTextSortBy}
        allExpanded={allTextExpanded}
        onToggleExpandAll={toggleExpandAllText}
        onSeedDefaults={handleSeedTextRules}
        textLoading={textLoading}
        onNewRule={() => {
          setEditingTextRule(null)
          setTextModalOpen(true)
        }}
        onResetFilters={() => {
          setTextSearch('')
          setTextStatusFilter('all')
          setTextCurrentPage(1)
        }}
      />

      {/* Overview Stats Cards */}
      <TextRulesStats
        totalCount={totalTextCount}
        activeCount={activeTextCount}
        inactiveCount={inactiveTextCount}
        defaultCount={defaultTextCount}
      />

      {/* Rules Count & Page info indicator */}
      <div className="flex items-center justify-between text-xs text-on-surface-variant px-1">
        <div>
          Found <strong className="text-on-surface">{filteredTextRules.length}</strong> matching text rule(s)
          {textSearch && <span> for &ldquo;{textSearch}&rdquo;</span>}
        </div>
        <div>
          Showing page {validTextCurrentPage} of {totalTextPages}
        </div>
      </div>

      {/* Empty State */}
      {filteredTextRules.length === 0 && (
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
            <p className="text-base font-semibold text-on-surface">No text prompt rules matched your criteria.</p>
            <p className="text-sm">Try clearing filters or search keywords.</p>
          </CardContent>
        </Card>
      )}

      {/* Text Rules Grid */}
      <div className="space-y-4">
        {paginatedTextRules.map((rule) => {
          const isExpanded = Boolean(expandedTextRuleIds[rule.id] ?? allTextExpanded)
          return (
            <TextRuleCard
              key={rule.id}
              rule={rule}
              onToggleActive={handleToggleActiveTextRule}
              onEdit={(r) => {
                setEditingTextRule(r)
                setTextModalOpen(true)
              }}
              onDelete={handleDeleteTextRule}
            />
          )
        })}
      </div>

      {/* Pagination Bar */}
      {filteredTextRules.length > 0 && (
        <PromptRulesPagination
          currentPage={validTextCurrentPage}
          pageSize={textPageSize}
          totalItems={totalTextItems}
          totalPages={totalTextPages}
          onPageChange={setTextCurrentPage}
          onPageSizeChange={setTextPageSize}
        />
      )}

      {/* Text Rule Create/Edit Modal */}
      <TextPromptRuleModal
        rule={editingTextRule}
        isOpen={textModalOpen}
        onClose={() => {
          setTextModalOpen(false)
          setEditingTextRule(null)
        }}
        onSaved={() => {
          fetchTextRules()
        }}
      />
    </div>
  )
}
