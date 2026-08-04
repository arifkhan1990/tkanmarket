'use client'

import * as React from 'react'
import Link from 'next/link'
import { useRouter } from 'next/navigation'
import { Percent } from 'lucide-react'
import { toast } from 'sonner'

import { Button } from '@/components/ui/button'
import { Checkbox } from '@/components/ui/checkbox'
import { Input } from '@/components/ui/input'
import { Textarea } from '@/components/ui/textarea'
import { useAdminSupplierById } from '@/hooks/admin/useAdminSupplierById'
import { useAdminSupplierUpdate } from '@/hooks/admin/useAdminSupplierUpdate'
import { useI18n } from '@/hooks/useI18n'
import { withLocaleUrl } from '@/lib/i18n/locale-path'

export function SupplierEditClient({ supplierId }: { supplierId: number }) {
  const { messages, locale } = useI18n()
  const p = messages.admin.supplierEditPage
  const router = useRouter()
  const detail = useAdminSupplierById(supplierId)
  const update = useAdminSupplierUpdate(supplierId)

  const [name, setName] = React.useState('')
  const [slug, setSlug] = React.useState('')
  const [country, setCountry] = React.useState('')
  const [city, setCity] = React.useState('')
  const [province, setProvince] = React.useState('')
  const [description, setDescription] = React.useState('')
  const [logoUrl, setLogoUrl] = React.useState('')
  const [websiteUrl, setWebsiteUrl] = React.useState('')
  const [sourceUrl, setSourceUrl] = React.useState('')
  const [verified, setVerified] = React.useState(false)
  const [year, setYear] = React.useState('')

  React.useEffect(() => {
    const d = detail.data
    if (!d) return
    setName(d.name)
    setSlug(d.slug)
    setCountry(d.country)
    setCity(d.city ?? '')
    setProvince(d.province ?? '')
    setDescription(d.description ?? '')
    setLogoUrl(d.logoUrl ?? '')
    setWebsiteUrl(d.websiteUrl ?? '')
    setSourceUrl(d.sourceUrl ?? '')
    setVerified(d.verified)
    setYear(d.establishedYear != null ? String(d.establishedYear) : '')
  }, [detail.data])

  const onSubmit = (e: React.FormEvent) => {
    e.preventDefault()
    const y = year.trim() === '' ? null : Number(year)
    if (y != null && (!Number.isFinite(y) || y < 1800 || y > 2100)) {
      toast.error('Invalid year')
      return
    }
    update.mutate(
      {
        name,
        slug,
        country,
        city: city.trim() === '' ? null : city,
        province: province.trim() === '' ? null : province,
        description: description.trim() === '' ? null : description,
        logo_url: logoUrl.trim() === '' ? null : logoUrl,
        website_url: websiteUrl.trim() === '' ? null : websiteUrl,
        source_url: sourceUrl.trim() === '' ? null : sourceUrl,
        verified,
        established_year: y
      },
      {
        onSuccess: () => {
          toast.success(p.saved)
          router.refresh()
        },
        onError: (err) => {
          toast.error(err instanceof Error ? err.message : 'Error')
        }
      }
    )
  }

  if (detail.isLoading || !detail.data) {
    return (
      <div className="mx-auto max-w-3xl pb-12 space-y-6">
        <div className="h-10 w-1/2 animate-pulse rounded-xl bg-surface-container-low" />
        <div className="h-64 animate-pulse rounded-2xl bg-surface-container-low" />
      </div>
    )
  }

  return (
    <div className="mx-auto max-w-3xl pb-12">
      <div className="mb-8 flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h1 className="font-heading text-3xl font-extrabold tracking-tight text-on-surface">{p.title}</h1>
          <p className="mt-2 text-on-surface-variant">{p.subtitle}</p>
        </div>
        <div className="flex flex-wrap gap-2">
          <Button type="button" variant="outline" className="rounded-xl" asChild>
            <Link href={withLocaleUrl('/admin/suppliers', locale)}>{p.back}</Link>
          </Button>
          <Button type="button" variant="outline" className="rounded-xl" asChild>
            <Link href={withLocaleUrl(`/suppliers/${detail.data.slug}`, locale)}>{p.viewPublic}</Link>
          </Button>
          <Button type="button" variant="secondary" className="rounded-xl" asChild>
            <Link href={withLocaleUrl(`/admin/suppliers/${supplierId}/inquiries`, locale)}>{p.viewInquiries}</Link>
          </Button>
          <Button type="button" variant="outline" className="rounded-xl" asChild>
            <Link href={withLocaleUrl(`/admin/suppliers/${supplierId}/wholesale-pricing`, locale)}>
              <Percent className="mr-2 h-4 w-4" aria-hidden />
              {p.wholesalePricing}
            </Link>
          </Button>
        </div>
      </div>

      {detail.isError ? (
        <p className="mb-6 text-sm text-destructive">
          {detail.error instanceof Error ? detail.error.message : p.loadError}
        </p>
      ) : null}

      <form onSubmit={onSubmit} className="space-y-6 rounded-2xl border border-outline/10 bg-surface-container-lowest p-6 shadow-sm">
        <div className="grid gap-4 sm:grid-cols-2">
          <div className="space-y-2 sm:col-span-2">
            <label htmlFor="sup-name" className="text-sm font-medium text-on-surface">
              {p.fieldName}
            </label>
            <Input id="sup-name" value={name} onChange={(e) => setName(e.target.value)} required className="rounded-xl" />
          </div>
          <div className="space-y-2 sm:col-span-2">
            <label htmlFor="sup-slug" className="text-sm font-medium text-on-surface">
              {p.fieldSlug}
            </label>
            <Input id="sup-slug" value={slug} onChange={(e) => setSlug(e.target.value)} required className="rounded-xl font-mono text-sm" />
          </div>
          <div className="space-y-2">
            <label htmlFor="sup-country" className="text-sm font-medium text-on-surface">
              {p.fieldCountry}
            </label>
            <Input id="sup-country" value={country} onChange={(e) => setCountry(e.target.value)} required className="rounded-xl" />
          </div>
          <div className="space-y-2">
            <label htmlFor="sup-city" className="text-sm font-medium text-on-surface">
              {p.fieldCity}
            </label>
            <Input id="sup-city" value={city} onChange={(e) => setCity(e.target.value)} className="rounded-xl" />
          </div>
          <div className="space-y-2 sm:col-span-2">
            <label htmlFor="sup-prov" className="text-sm font-medium text-on-surface">
              {p.fieldProvince}
            </label>
            <Input id="sup-prov" value={province} onChange={(e) => setProvince(e.target.value)} className="rounded-xl" />
          </div>
          <div className="space-y-2 sm:col-span-2">
            <label htmlFor="sup-desc" className="text-sm font-medium text-on-surface">
              {p.fieldDescription}
            </label>
            <Textarea id="sup-desc" value={description} onChange={(e) => setDescription(e.target.value)} rows={5} className="rounded-xl" />
          </div>
          <div className="space-y-2 sm:col-span-2">
            <label htmlFor="sup-logo" className="text-sm font-medium text-on-surface">
              {p.fieldLogoUrl}
            </label>
            <Input id="sup-logo" value={logoUrl} onChange={(e) => setLogoUrl(e.target.value)} className="rounded-xl font-mono text-sm" />
          </div>
          <div className="space-y-2 sm:col-span-2">
            <label htmlFor="sup-web" className="text-sm font-medium text-on-surface">
              {p.fieldWebsite}
            </label>
            <Input id="sup-web" value={websiteUrl} onChange={(e) => setWebsiteUrl(e.target.value)} className="rounded-xl font-mono text-sm" />
          </div>
          <div className="space-y-2 sm:col-span-2">
            <label htmlFor="sup-src" className="text-sm font-medium text-on-surface">
              {p.fieldSource}
            </label>
            <Input id="sup-src" value={sourceUrl} onChange={(e) => setSourceUrl(e.target.value)} className="rounded-xl font-mono text-sm" />
          </div>
          <div className="space-y-2">
            <label htmlFor="sup-year" className="text-sm font-medium text-on-surface">
              {p.fieldYear}
            </label>
            <Input id="sup-year" value={year} onChange={(e) => setYear(e.target.value)} inputMode="numeric" className="rounded-xl font-mono" />
          </div>
          <div className="flex items-center gap-3 pt-8">
            <Checkbox id="sup-ver" checked={verified} onCheckedChange={(c) => setVerified(c === true)} />
            <label htmlFor="sup-ver" className="cursor-pointer text-sm font-medium text-on-surface">
              {p.fieldVerified}
            </label>
          </div>
        </div>
        <Button type="submit" className="rounded-xl" disabled={update.isPending}>
          {p.save}
        </Button>
      </form>
    </div>
  )
}
