'use client'

import { Button } from '@/components/ui/button'
import { Card } from '@/components/ui/card'
import { Input } from '@/components/ui/input'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'

export type ImageSortOption =
  | 'priority-asc'
  | 'priority-desc'
  | 'name-asc'
  | 'name-desc'
  | 'created-desc'
  | 'updated-desc'

interface ImageRulesToolbarProps {
  search: string
  onSearchChange: (val: string) => void
  statusFilter: 'all' | 'active' | 'inactive'
  onStatusFilterChange: (val: 'all' | 'active' | 'inactive') => void
  videoFilter: 'all' | 'video' | 'no-video'
  onVideoFilterChange: (val: 'all' | 'video' | 'no-video') => void
  sortBy: ImageSortOption
  onSortByChange: (val: ImageSortOption) => void
  allExpanded: boolean
  onToggleExpandAll: () => void
  onResetFilters: () => void
}

export function ImageRulesToolbar({
  search,
  onSearchChange,
  statusFilter,
  onStatusFilterChange,
  videoFilter,
  onVideoFilterChange,
  sortBy,
  onSortByChange,
  allExpanded,
  onToggleExpandAll,
  onResetFilters
}: ImageRulesToolbarProps) {
  const hasActiveFilters = search || statusFilter !== 'all' || videoFilter !== 'all'

  return (
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
            placeholder="Search rules by name, condition, or prompt text..."
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

          <div className="w-36">
            <Select value={videoFilter} onValueChange={(v) => onVideoFilterChange(v as 'all' | 'video' | 'no-video')}>
              <SelectTrigger className="h-9 text-xs">
                <SelectValue placeholder="Video" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Video Modes</SelectItem>
                <SelectItem value="video">Has Video</SelectItem>
                <SelectItem value="no-video">No Video</SelectItem>
              </SelectContent>
            </Select>
          </div>

          <div className="w-44">
            <Select value={sortBy} onValueChange={(v) => onSortByChange(v as ImageSortOption)}>
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
  )
}
