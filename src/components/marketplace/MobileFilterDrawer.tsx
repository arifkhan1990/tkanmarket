'use client'

import { Filter } from 'lucide-react'
import { useMemo } from 'react'

import { Sheet, SheetContent, SheetHeader, SheetTitle, SheetTrigger } from '@/components/ui/sheet'
import { Button } from '@/components/ui/button'
import type { FabricQueryParams } from '@/lib/validations/fabric.validation'
import { FilterSidebar, type CategoryCount } from '@/components/marketplace/FilterSidebar'
import type { JunctionCategoryCount } from '@/types/marketplace.types'
import { countActiveFabricFilters } from '@/lib/marketplace/active-filters'
import { useI18n } from '@/hooks/useI18n'

type FabricFilters = FabricQueryParams

export function MobileFilterDrawer(props: {
  currentFilters: FabricFilters
  categoryCounts: CategoryCount[]
  junctionCategoryCounts: JunctionCategoryCount[]
}) {
  const activeCount = useMemo(() => countActiveFabricFilters(props.currentFilters), [props.currentFilters])
  const { messages } = useI18n()

  return (
    <div className="fixed bottom-6 right-6 z-40 lg:hidden">
      <Sheet>
        <SheetTrigger asChild>
          <Button className="rounded-full shadow-soft h-12 px-5">
            <Filter className="mr-2 h-4 w-4" aria-hidden />
            {messages.fabrics.filters.title}
            {activeCount > 0 ? (
              <span className="ml-2 inline-flex h-6 min-w-6 items-center justify-center rounded-full bg-background text-on-surface text-xs font-extrabold px-2">
                {activeCount}
              </span>
            ) : null}
          </Button>
        </SheetTrigger>
        <SheetContent side="bottom" className="max-h-[85vh] overflow-y-auto">
          <SheetHeader>
            <SheetTitle>{messages.fabrics.filters.title}</SheetTitle>
          </SheetHeader>
          <div className="mt-6">
            <FilterSidebar
              currentFilters={props.currentFilters}
              categoryCounts={props.categoryCounts}
              junctionCategoryCounts={props.junctionCategoryCounts}
            />
          </div>
        </SheetContent>
      </Sheet>
    </div>
  )
}

