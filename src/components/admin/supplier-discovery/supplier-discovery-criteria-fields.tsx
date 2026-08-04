'use client'

import { Input } from '@/components/ui/input'
import type { SupplierDiscoveryCriteriaFormState } from '@/types/supplier-discovery-form.types'

export interface SupplierDiscoveryCriteriaFieldLabels {
  criteriaSection: string
  criteriaHint: string
  minYearsLabel: string
  minCatalogLabel: string
  maxMoqLabel: string
  minPhotosLabel: string
  minPhotoScoreLabel: string
}

export function SupplierDiscoveryCriteriaFields(props: {
  values: SupplierDiscoveryCriteriaFormState
  onChange: (patch: Partial<SupplierDiscoveryCriteriaFormState>) => void
  labels: SupplierDiscoveryCriteriaFieldLabels
}) {
  const { values, onChange, labels } = props
  const patch = (key: keyof SupplierDiscoveryCriteriaFormState, v: string) => {
    onChange({ [key]: v })
  }

  return (
    <div className="mt-4 rounded-lg border border-outline/10 bg-surface-container-lowest/40 p-4">
      <h3 className="text-xs font-semibold uppercase tracking-wide text-on-surface-variant">
        {labels.criteriaSection}
      </h3>
      <p className="mt-1 text-xs text-on-surface-variant">{labels.criteriaHint}</p>
      <div className="mt-4 grid gap-4 sm:grid-cols-2 lg:grid-cols-5">
        <div className="space-y-2">
          <label className="text-xs font-medium text-on-surface-variant" htmlFor="crit-years">
            {labels.minYearsLabel}
          </label>
          <Input
            id="crit-years"
            inputMode="numeric"
            value={values.minYearsExperience}
            onChange={(e) => patch('minYearsExperience', e.target.value)}
          />
        </div>
        <div className="space-y-2">
          <label className="text-xs font-medium text-on-surface-variant" htmlFor="crit-catalog">
            {labels.minCatalogLabel}
          </label>
          <Input
            id="crit-catalog"
            inputMode="numeric"
            value={values.minCatalogSize}
            onChange={(e) => patch('minCatalogSize', e.target.value)}
          />
        </div>
        <div className="space-y-2">
          <label className="text-xs font-medium text-on-surface-variant" htmlFor="crit-moq">
            {labels.maxMoqLabel}
          </label>
          <Input
            id="crit-moq"
            inputMode="numeric"
            value={values.maxMoqMeters}
            onChange={(e) => patch('maxMoqMeters', e.target.value)}
          />
        </div>
        <div className="space-y-2">
          <label className="text-xs font-medium text-on-surface-variant" htmlFor="crit-photos">
            {labels.minPhotosLabel}
          </label>
          <Input
            id="crit-photos"
            inputMode="numeric"
            value={values.minProductPhotos}
            onChange={(e) => patch('minProductPhotos', e.target.value)}
          />
        </div>
        <div className="space-y-2">
          <label className="text-xs font-medium text-on-surface-variant" htmlFor="crit-score">
            {labels.minPhotoScoreLabel}
          </label>
          <Input
            id="crit-score"
            inputMode="decimal"
            value={values.minPhotoQualityScore}
            onChange={(e) => patch('minPhotoQualityScore', e.target.value)}
          />
        </div>
      </div>
    </div>
  )
}
