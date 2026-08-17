'use client'

import * as React from 'react'
import { Check, ChevronsUpDown, Search } from 'lucide-react'

import { ALL_COUNTRIES } from '@/constants'
import { cn } from '@/lib/utils'
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover'
import { Button } from '@/components/ui/button'

export interface SearchableCountrySelectProps {
  value?: string
  onChange?: (value: string) => void
  onValueChange?: (value: string) => void
  placeholder?: string
  disabled?: boolean
  className?: string
  ariaLabel?: string
  countries?: readonly string[]
}

export function SearchableCountrySelect({
  value,
  onChange,
  onValueChange,
  placeholder = 'Select country',
  disabled = false,
  className,
  ariaLabel = 'Select country',
  countries = ALL_COUNTRIES
}: SearchableCountrySelectProps) {
  const [open, setOpen] = React.useState(false)
  const [searchQuery, setSearchQuery] = React.useState('')

  const handleSelect = (val: string) => {
    onChange?.(val)
    onValueChange?.(val)
    setOpen(false)
    setSearchQuery('')
  }

  const filteredCountries = React.useMemo(() => {
    if (!searchQuery.trim()) return countries
    const query = searchQuery.toLowerCase().trim()
    return countries.filter((c) => c.toLowerCase().includes(query))
  }, [countries, searchQuery])

  return (
    <Popover open={open} onOpenChange={setOpen}>
      <PopoverTrigger asChild>
        <Button
          type="button"
          variant="outline"
          role="combobox"
          aria-expanded={open}
          aria-label={ariaLabel}
          disabled={disabled}
          className={cn(
            'w-full justify-between rounded-xl bg-surface-container-highest border border-outline/10 px-4 py-3 h-auto text-sm font-bold text-on-surface hover:bg-surface-container-high focus:ring-2 focus:ring-primary focus:ring-offset-0',
            !value && 'text-on-surface-variant/70 font-normal',
            className
          )}
        >
          <span className="truncate">{value || placeholder}</span>
          <ChevronsUpDown className="ml-2 h-4 w-4 shrink-0 opacity-50" />
        </Button>
      </PopoverTrigger>
      <PopoverContent className="w-[var(--radix-popover-trigger-width)] min-w-[240px] p-2 rounded-2xl bg-surface-container-lowest border border-outline/20 shadow-lg z-50">
        <div className="flex items-center gap-2 border-b border-outline/10 px-3 pb-2 pt-1 mb-2">
          <Search className="h-4 w-4 shrink-0 opacity-50" />
          <input
            type="text"
            className="w-full bg-transparent text-sm font-medium outline-none placeholder:text-on-surface-variant/60"
            placeholder="Search country..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            autoFocus
          />
        </div>

        <div className="max-h-60 overflow-y-auto space-y-1 pr-1 custom-scrollbar">
          {filteredCountries.length === 0 ? (
            <div className="py-4 text-center text-xs font-medium text-on-surface-variant">
              No country found.
            </div>
          ) : (
            filteredCountries.map((country) => {
              const isSelected = value === country
              return (
                <button
                  key={country}
                  type="button"
                  onClick={() => handleSelect(country)}
                  className={cn(
                    'w-full flex items-center justify-between px-3 py-2 text-sm font-medium rounded-xl text-left transition-colors',
                    isSelected
                      ? 'bg-primary/10 text-primary font-bold'
                      : 'text-on-surface hover:bg-surface-container-high'
                  )}
                >
                  <span className="truncate">{country}</span>
                  {isSelected && <Check className="h-4 w-4 shrink-0 text-primary" />}
                </button>
              )
            })
          )}
        </div>
      </PopoverContent>
    </Popover>
  )
}
