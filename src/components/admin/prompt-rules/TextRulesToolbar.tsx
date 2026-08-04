'use client'

import { Button } from '@/components/ui/button'
import { Card } from '@/components/ui/card'
import { Input } from '@/components/ui/input'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'

export type TextSortOption =
  | 'priority-asc'
  | 'priority-desc'
  | 'name-asc'
  | 'name-desc'
  | 'created-desc'
  | 'updated-desc'

interface TextRulesToolbarProps {
  search: string
  onSearchChange: (val: string) => void
  statusFilter: 'all' | 'active' | 'inactive'
  onStatusFilterChange: (val: 'all' | 'active' | 'inactive') => void
  sortBy: TextSortOption
  onSortByChange: (val: TextSortOption) => void
  allExpanded: boolean
  onToggleExpandAll: () => void
  onSeedDefaults: () => void
  textLoading: boolean
  onNewRule: () => void
  onResetFilters: () => void
}

export function TextRulesToolbar({
  search,
  onSearchChange,
  statusFilter,
  onStatusFilterChange,
  sortBy,
  onSortByChange,
  allExpanded,
  onToggleExpandAll,
  onSeedDefaults,
  textLoading,
  onNewRule,
  onResetFilters
}: TextRulesToolbarProps) {
  const hasActiveFilters = search || statusFilter !== 'all'

  return (
    <div className="space-y-4">
      {/* Top Header & New Button */}
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h1 className="font-heading text-heading-xl font-extrabold tracking-tight">AI Text Prompt Rules</h1>
          <p className="mt-1 text-sm text-on-surface-variant">
            Configure system & user prompts for AI Product Enrichment, Translations, Social Media & Blog generators.
          </p>
        </div>
        <div className="flex flex-wrap items-center gap-2">
          <Button variant="outline" onClick={onSeedDefaults} disabled={textLoading} className="gap-2 text-xs">
            🌱 Seed Default Text Rules
          </Button>
          <Button onClick={onNewRule} className="gap-2">
            <svg className="h-4 w-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 4v16m8-8H4" />
            </svg>
            New Text Rule
          </Button>
        </div>
      </div>

      {/* Toolbar Controls */}
      <Card className="p-4 shadow-xs">
        <div className="flex flex-col gap-3 md:flex-row md:items-center md:justify-between">
          {/* Search Input */}
          <div className="relative flex-1">
            <svg
              className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-on-surface-variant"
              fill="none"
              stroke="currentColor"
              viewBox="0 0 24 24"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth="2"
                d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z"
              />
            </svg>
            <Input
              value={search}
              onChange={(e) => onSearchChange(e.target.value)}
              placeholder="Search text rules by name, condition, system prompt or template..."
              className="pl-9 pr-8"
            />
            {search && (
              <button
                onClick={() => onSearchChange('')}
                className="absolute right-2.5 top-1/2 -translate-y-1/2 text-on-surface-variant hover:text-on-surface"
              >
                ✕
              </button>
            )}
          </div>

          {/* Filters & Sort Controls */}
          <div className="flex flex-wrap items-center gap-2">
            <div className="w-32">
              <Select value={statusFilter} onValueChange={(v) => onStatusFilterChange(v as 'all' | 'active' | 'inactive')}>
                <SelectTrigger className="h-9 text-xs">
                  <SelectValue placeholder="Status" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All Status</SelectItem>
                  <SelectItem value="active">Active Only</SelectItem>
                  <SelectItem value="inactive">Inactive Only</SelectItem>
                </SelectContent>
              </Select>
            </div>

            <div className="w-44">
              <Select value={sortBy} onValueChange={(v) => onSortByChange(v as TextSortOption)}>
                <SelectTrigger className="h-9 text-xs">
                  <SelectValue placeholder="Sort By" />
                </SelectTrigger>
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

            {hasActiveFilters && (
              <Button variant="ghost" size="sm" onClick={onResetFilters} className="h-9 text-xs">
                Reset
              </Button>
            )}

            <Button variant="outline" size="sm" onClick={onToggleExpandAll} className="h-9 text-xs gap-1.5">
              <svg className="h-3.5 w-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M19 9l-7 7-7-7" />
              </svg>
              {allExpanded ? 'Collapse All' : 'Expand All Details'}
            </Button>
          </div>
        </div>
      </Card>
    </div>
  )
}
