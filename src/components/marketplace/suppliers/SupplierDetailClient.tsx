'use client'

import Image from 'next/image'
import Link from 'next/link'
import { usePathname, useRouter } from 'next/navigation'
import { useEffect, useMemo, useState, type FormEvent, type ReactNode } from 'react'

import {
  Activity,
  BadgeCheck,
  Eye,
  Factory,
  Globe,
  Layers,
  MapPin,
  Package,
  Send,
  Share2,
  Sparkles,
  TrendingDown,
  TrendingUp
} from 'lucide-react'
import { toast } from 'sonner'

import { Breadcrumb } from '@/components/common/Breadcrumb'
import { EmptyState } from '@/components/common/EmptyState'
import { SupplierProfileCatalogSection } from '@/components/marketplace/suppliers/supplier-profile-catalog-section'
import { PublicPageShell } from '@/components/shared/public-page-shell'
import { Button } from '@/components/ui/button'
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from '@/components/ui/dialog'
import { Input } from '@/components/ui/input'
import { Textarea } from '@/components/ui/textarea'
import { useCreateLead } from '@/hooks/useCreateLead'
import { useI18n } from '@/hooks/useI18n'
import { SupplierDetailSkeleton, useSupplier } from '@/hooks/useSupplier'
import { useSupplierPartnerOverviewQuery } from '@/hooks/useSupplierPartnerOverview'
import { getLocaleFromPathname, withLocaleUrl } from '@/lib/i18n/locale-path'
import { LEAD_SUCCESS_PATH } from '@/lib/routes/lead-success'
import { cn, isRemoteImageSrc } from '@/lib/utils'
import type { CreateLeadInput } from '@/lib/validations/lead.validation'
import { DEFAULT_LOCALE } from '@/types/i18n.types'
import type { SupplierDetail } from '@/types/marketplace.types'
import type { SupplierPartnerFabricRow } from '@/types/supplier-partner-overview.types'

const SECTION_IDS = {
  overview: 'supplier-overview',
  trending: 'supplier-trending',
  catalog: 'supplier-catalog',
  contact: 'supplier-contact'
} as const

type SectionKey = keyof typeof SECTION_IDS

function formatMoqRange(moqMin: number | null, moqMax: number | null, empty: string): string {
  if (moqMin == null && moqMax == null) return empty
  if (moqMin != null && moqMax != null && moqMin === moqMax) return `${moqMin} m`
  if (moqMin != null && moqMax != null) return `${moqMin}–${moqMax} m`
  return `${moqMin ?? moqMax} m`
}

function buildLocationLine(s: SupplierDetail): string {
  return [s.city, s.province, s.country].filter(Boolean).join(', ')
}

function mapsSearchUrl(query: string): string {
  return `https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(query)}`
}

/** Embeddable map preview (requires `frame-src` in CSP for Google Maps). */
function mapsEmbedSrc(query: string): string {
  const q = query.trim() || 'Earth'
  return `https://maps.google.com/maps?q=${encodeURIComponent(q)}&output=embed&z=11`
}

function isValidEmail(value: string): boolean {
  return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(value.trim())
}

export function SupplierDetailClient({ slug }: { slug: string }) {
  const router = useRouter()
  const pathname = usePathname()
  const locale = getLocaleFromPathname(pathname) ?? DEFAULT_LOCALE
  const { messages } = useI18n()
  const m = messages.suppliers

  const supplierQuery = useSupplier(slug)
  const supplier = supplierQuery.data

  // Public partner-overview powers trust signals + trending fabrics. Only loaded
  // once we know the slug resolves, and we never render PII (lead names) from it.
  const overviewQuery = useSupplierPartnerOverviewQuery(
    supplier ? slug : null,
    m.supplierNotFoundDescription
  )
  const overview = overviewQuery.data

  const createLead = useCreateLead({ suppressSuccessToast: true })
  const [open, setOpen] = useState(false)
  const [intent, setIntent] = useState<'inquiry' | 'sample'>('inquiry')
  const [showStickyNav, setShowStickyNav] = useState(false)
  const [activeSection, setActiveSection] = useState<SectionKey>('overview')
  const [quickDraft, setQuickDraft] = useState('')

  const [companyName, setCompanyName] = useState('')
  const [contactName, setContactName] = useState('')
  const [email, setEmail] = useState('')
  const [phone, setPhone] = useState('')
  const [country, setCountry] = useState(() => messages.contactPage.placeholders.country)
  const [inquiryText, setInquiryText] = useState('')

  // Sticky nav appears once we scroll past the hero card.
  useEffect(() => {
    const onScroll = () => setShowStickyNav(window.scrollY > 480)
    onScroll()
    window.addEventListener('scroll', onScroll, { passive: true })
    return () => window.removeEventListener('scroll', onScroll)
  }, [])

  // Lightweight scroll-spy: pick the section whose top is closest to the
  // sticky-nav anchor (96px from the top of the viewport).
  useEffect(() => {
    if (!supplier) return
    const sectionIds = Object.entries(SECTION_IDS) as Array<[SectionKey, string]>
    const update = () => {
      let current: SectionKey = 'overview'
      for (const [key, id] of sectionIds) {
        const el = document.getElementById(id)
        if (!el) continue
        const top = el.getBoundingClientRect().top
        if (top - 120 <= 0) current = key
      }
      setActiveSection(current)
    }
    update()
    window.addEventListener('scroll', update, { passive: true })
    return () => window.removeEventListener('scroll', update)
  }, [supplier])

  const breadcrumbItems = useMemo(() => {
    const thirdLabel = supplier
      ? supplier.name
      : supplierQuery.isLoading
        ? messages.common.ellipsis
        : m.supplierNotFoundTitle
    return [
      { label: messages.breadcrumbs.home, href: withLocaleUrl('/', locale) },
      { label: messages.breadcrumbs.suppliers, href: withLocaleUrl('/suppliers', locale) },
      { label: thirdLabel }
    ]
  }, [
    supplier,
    supplierQuery.isLoading,
    messages.breadcrumbs.home,
    messages.breadcrumbs.suppliers,
    messages.common.ellipsis,
    m.supplierNotFoundTitle,
    locale
  ])

  const openInquiry = (mode: 'inquiry' | 'sample' = 'inquiry', prefill?: string) => {
    setIntent(mode)
    if (prefill?.trim()) {
      setInquiryText((prev) => (prev.trim() ? prev : prefill.trim()))
    }
    setOpen(true)
  }

  const onShareSupplier = async () => {
    if (typeof window === 'undefined') return
    const url = window.location.href
    const title = supplier?.name ?? 'TkanMarket'

    const tryClipboard = async (): Promise<boolean> => {
      try {
        const clipboard = (globalThis as { navigator?: Navigator }).navigator?.clipboard
        if (clipboard?.writeText) {
          await clipboard.writeText(url)
          return true
        }
      } catch {
        return false
      }
      return false
    }

    try {
      const nav = (globalThis as { navigator?: Navigator }).navigator
      if (nav && 'share' in nav && typeof nav.share === 'function') {
        await nav.share({ title, url })
        return
      }
    } catch {
      // user cancelled the system share sheet — fall through to clipboard fallback
    }

    if (await tryClipboard()) {
      toast.success(m.shareLinkCopied)
      return
    }
    toast.error(m.shareLinkFailed)
  }

  const scrollTo = (key: SectionKey) => {
    const el = document.getElementById(SECTION_IDS[key])
    if (!el) return
    const top = el.getBoundingClientRect().top + window.scrollY - 96
    window.scrollTo({ top, behavior: 'smooth' })
  }

  const onSubmit = (e: FormEvent<HTMLFormElement>) => {
    e.preventDefault()
    if (
      !companyName.trim() ||
      !contactName.trim() ||
      !isValidEmail(email) ||
      !country.trim() ||
      !inquiryText.trim()
    ) {
      toast.error(m.inquiryFormErrorRequired)
      return
    }

    const input: CreateLeadInput = {
      source: intent === 'sample' ? 'SAMPLE_REQUEST' : 'MARKETPLACE_INQUIRY',
      company_name: companyName.trim(),
      contact_name: contactName.trim(),
      email: email.trim(),
      phone: phone.trim() ? phone.trim() : undefined,
      country: country.trim(),
      city: undefined,
      fabric_id: undefined,
      inquiry_text: inquiryText.trim(),
      utm_source: 'supplier_profile',
      utm_campaign: supplier?.slug
    }

    createLead.mutate(input, {
      onSuccess: () => {
        toast.success(m.inquiryFormSuccess)
        setOpen(false)
        router.push(withLocaleUrl(LEAD_SUCCESS_PATH, locale))
      }
    })
  }

  const onQuickRequest = () => {
    const d = quickDraft.trim()
    if (d) setInquiryText((prev) => (prev.trim() ? `${prev}\n\n${d}` : d))
    setQuickDraft('')
    openInquiry('inquiry')
  }

  if (supplierQuery.isLoading) {
    return (
      <PublicPageShell className="py-6 md:py-10" blur="sm" fullWidth contentClassName="pb-10 md:pb-14">
        <div className="mx-auto w-full max-w-screen-2xl px-6 py-6 md:py-8 md:px-8">
          <Breadcrumb items={breadcrumbItems} />
        </div>
        <SupplierDetailSkeleton />
      </PublicPageShell>
    )
  }

  if (!supplier) {
    return (
      <PublicPageShell className="py-10 md:py-14" blur="sm">
        <div className="mx-auto w-full max-w-screen-2xl px-6 md:px-8">
          <Breadcrumb items={breadcrumbItems} />
        </div>
        <div className="mx-auto mt-8 max-w-screen-2xl px-6 md:px-8">
          <EmptyState title={m.supplierNotFoundTitle} description={m.supplierNotFoundDescription} />
        </div>
      </PublicPageShell>
    )
  }

  const coverUrl = supplier.featuredFabrics[0]?.imageUrl ?? null
  const locationLine = buildLocationLine(supplier)
  const displayLocation = locationLine || supplier.country || '—'
  const mapsQuery = locationLine || supplier.country || supplier.name
  const mapsUrl = mapsSearchUrl(mapsQuery)
  const mapIframeSrc = mapsEmbedSrc(mapsQuery)
  const fabricTypeRows = supplier.insights.fabricTypeCounts
  const primaryFabricType = fabricTypeRows[0]?.fabricType ?? null
  const secondaryFabricTypes = fabricTypeRows
    .slice(1, 5)
    .map((r) => r.fabricType)
    .join(', ')

  const trendingFabrics: SupplierPartnerFabricRow[] =
    overview?.top_fabrics?.filter((f) => f.views_count > 0) ?? []

  const responseRate = overview?.metrics.response_rate_percent ?? null
  const sampleRequests = overview?.metrics.sample_request_leads ?? null
  const momDelta = overview?.metrics.month_over_month_inquiry_delta_percent ?? null

  const trendLabel: { text: string; tone: 'up' | 'down' | 'flat' | 'none' } = (() => {
    if (momDelta == null) return { text: '—', tone: 'none' }
    if (momDelta > 0) return { text: m.inquiryTrendUp.replace('{value}', String(momDelta)), tone: 'up' }
    if (momDelta < 0) return { text: m.inquiryTrendDown.replace('{value}', String(momDelta)), tone: 'down' }
    return { text: m.inquiryTrendFlat, tone: 'flat' }
  })()

  const navItems: Array<{ key: SectionKey; label: string }> = [
    { key: 'overview', label: m.pageNavOverview },
    ...(trendingFabrics.length > 0 ? [{ key: 'trending' as SectionKey, label: m.pageNavTrending }] : []),
    ...(supplier.insights.approvedFabricCount > 0
      ? [{ key: 'catalog' as SectionKey, label: m.pageNavCatalog }]
      : []),
    { key: 'contact', label: m.pageNavContact }
  ]

  return (
    <>
      <PublicPageShell className="py-6 md:py-10" blur="sm" fullWidth contentClassName="space-y-0 pb-12 md:pb-16">
        <div className="mx-auto w-full max-w-screen-2xl px-6 py-6 md:py-8 md:px-8">
          <Breadcrumb items={breadcrumbItems} />
        </div>

        {/* HERO COVER */}
        <section className="relative mt-6 h-[min(360px,56vh)] min-h-[220px] w-full overflow-hidden md:mt-8">
          {coverUrl ? (
            <Image
              src={coverUrl}
              alt={m.profileCoverAlt}
              fill
              className="object-cover"
              sizes="100vw"
              priority
              unoptimized={isRemoteImageSrc(coverUrl)}
            />
          ) : (
            <div
              className="absolute inset-0 bg-gradient-to-br from-surface-container-low via-surface-container to-primary/15 dark:from-surface-container dark:via-background dark:to-primary/25"
              aria-hidden
            />
          )}
          <div className="pointer-events-none absolute inset-0 bg-gradient-to-t from-background via-background/35 to-transparent dark:from-background dark:via-background/45" />
        </section>

        {/* HERO CARD */}
        <div className="relative z-10 mx-auto -mt-24 w-full max-w-screen-2xl px-6 md:-mt-28 md:px-8">
          <div className="rounded-2xl border border-outline/10 bg-surface-container-lowest p-6 shadow-xl dark:bg-card md:p-8">
            <div className="flex flex-col gap-8 md:flex-row md:items-end md:justify-between">
              <div className="flex flex-col gap-6 md:flex-row md:items-center">
                <div className="flex h-32 w-32 shrink-0 items-center justify-center overflow-hidden rounded-2xl border-4 border-surface-container-lowest bg-background shadow-lg dark:border-card dark:bg-card">
                  <div className="relative h-24 w-24">
                    {supplier.logoUrl ? (
                      <Image
                        src={supplier.logoUrl}
                        alt={supplier.name}
                        fill
                        sizes="96px"
                        className="object-contain"
                        unoptimized={isRemoteImageSrc(supplier.logoUrl)}
                      />
                    ) : (
                      <div
                        className="flex h-full w-full items-center justify-center rounded-lg bg-surface-container-high text-2xl font-black text-on-surface-variant"
                        aria-hidden
                      >
                        {supplier.name.slice(0, 1).toUpperCase()}
                      </div>
                    )}
                  </div>
                </div>
                <div className="min-w-0 space-y-3">
                  <div className="flex flex-wrap items-center gap-3">
                    <h1 className="font-heading text-3xl font-black tracking-tight text-on-background md:text-4xl">
                      {supplier.name}
                    </h1>
                    {supplier.verified ? (
                      <span className="inline-flex items-center gap-1 rounded-full bg-primary/10 px-3 py-1 text-xs font-bold uppercase tracking-widest text-primary">
                        <BadgeCheck className="h-3.5 w-3.5 shrink-0" aria-hidden />
                        {m.badgeVerified}
                      </span>
                    ) : (
                      <span className="inline-flex items-center rounded-full bg-surface-container-high px-3 py-1 text-xs font-bold uppercase tracking-widest text-on-surface-variant">
                        {m.badgeUnverified}
                      </span>
                    )}
                  </div>
                  <div className="flex flex-col gap-4 text-on-surface-variant sm:flex-row sm:flex-wrap sm:items-center sm:gap-6">
                    <div className="flex items-center gap-1.5 font-medium text-on-surface">
                      <MapPin className="h-5 w-5 shrink-0 text-outline" aria-hidden />
                      <span>{displayLocation}</span>
                    </div>
                    <div className="flex flex-wrap items-center gap-0 border-outline/30 sm:border-l sm:pl-6">
                      <div className="px-0 sm:px-3">
                        <p className="text-[10px] font-medium uppercase tracking-wider text-outline">
                          {m.foundedLabel}
                        </p>
                        <p className="text-sm font-bold text-on-surface">
                          {supplier.establishedYear ?? '—'}
                        </p>
                      </div>
                      <div className="border-l border-outline/30 px-3">
                        <p className="text-[10px] font-medium uppercase tracking-wider text-outline">
                          {m.catalogLabel}
                        </p>
                        <p className="text-sm font-bold text-on-surface">
                          {supplier.insights.approvedFabricCount} {m.statsFabrics}
                        </p>
                      </div>
                    </div>
                  </div>
                </div>
              </div>
              <div className="flex w-full flex-col gap-3 sm:flex-row md:w-auto md:flex-none">
                <Button
                  type="button"
                  className="h-12 flex-1 rounded-lg bg-gradient-to-br from-primary to-primary/90 font-bold shadow-md hover:brightness-110 md:h-14 md:flex-none md:px-8"
                  onClick={() => openInquiry('inquiry')}
                >
                  {m.contactSupplier}
                </Button>
                <Button
                  type="button"
                  variant="outline"
                  className="h-12 flex-1 rounded-lg border-outline/30 bg-surface-container-lowest font-bold text-primary hover:bg-surface-container-low dark:bg-card md:h-14 md:flex-none md:px-8"
                  onClick={() => openInquiry('sample')}
                >
                  {m.requestSample}
                </Button>
                <Button
                  type="button"
                  variant="ghost"
                  className="h-12 rounded-lg font-bold text-on-surface-variant hover:bg-surface-container-low md:h-14 md:px-4"
                  onClick={onShareSupplier}
                  aria-label={m.shareSupplier}
                >
                  <Share2 className="h-5 w-5" aria-hidden />
                  <span className="ml-2 hidden md:inline">{m.shareSupplier}</span>
                </Button>
              </div>
            </div>
          </div>
        </div>

        {/* STICKY IN-PAGE NAV */}
        <div
          className={cn(
            'sticky top-16 z-30 -mb-px mt-8 border-b border-outline/10 bg-background/95 backdrop-blur-md transition-all duration-300 md:top-20',
            showStickyNav ? 'opacity-100' : 'pointer-events-none -translate-y-2 opacity-0'
          )}
        >
          <div className="mx-auto flex w-full max-w-screen-2xl items-center justify-between gap-4 px-6 py-3 md:px-8">
            <nav className="flex min-w-0 items-center gap-1 overflow-x-auto" aria-label="Supplier sections">
              {navItems.map((item) => {
                const active = activeSection === item.key
                return (
                  <button
                    key={item.key}
                    type="button"
                    onClick={() => scrollTo(item.key)}
                    aria-current={active ? 'true' : undefined}
                    className={cn(
                      'whitespace-nowrap rounded-lg px-4 py-2 text-sm font-bold transition-colors',
                      active
                        ? 'bg-primary/10 text-primary'
                        : 'text-on-surface-variant hover:bg-surface-container-low hover:text-on-surface'
                    )}
                  >
                    {item.label}
                  </button>
                )
              })}
            </nav>
            <div className="hidden shrink-0 md:flex">
              <Button
                type="button"
                size="sm"
                className="rounded-lg bg-primary font-bold hover:brightness-110"
                onClick={() => openInquiry('inquiry')}
              >
                <Send className="mr-2 h-4 w-4" aria-hidden />
                {m.contactSupplier}
              </Button>
            </div>
          </div>
        </div>

        <section className="mx-auto mt-10 grid w-full max-w-screen-2xl grid-cols-1 gap-8 px-6 md:mt-12 md:px-8 lg:grid-cols-12 lg:gap-10">
          <div className="space-y-12 lg:col-span-8">
            {/* OVERVIEW */}
            <div id={SECTION_IDS.overview} className="scroll-mt-28 space-y-6">
              <h2 className="font-heading text-2xl font-black tracking-tight text-on-surface">
                {m.aboutSupplier}
              </h2>
              <p className="max-w-3xl text-lg leading-relaxed text-on-surface-variant">
                {supplier.description ? supplier.description : m.descriptionUnavailable}
              </p>
              {supplier.insights.topTags.length > 0 ? (
                <div className="flex flex-wrap gap-3 pt-2">
                  {supplier.insights.topTags.slice(0, 8).map((tag) => (
                    <span
                      key={tag}
                      className="rounded-full bg-secondary-container/40 px-4 py-1.5 text-xs font-bold uppercase tracking-wider text-on-secondary-container dark:bg-secondary-container/25"
                    >
                      {tag}
                    </span>
                  ))}
                </div>
              ) : null}
            </div>

            {/* TRUST SIGNALS — powered by partner-overview API */}
            <div className="space-y-4">
              <div className="flex items-center gap-2">
                <Sparkles className="h-5 w-5 text-primary" aria-hidden />
                <h2 className="font-heading text-lg font-black uppercase tracking-widest text-on-surface">
                  {m.metricsHeading}
                </h2>
              </div>
              <div className="grid grid-cols-2 gap-4 md:grid-cols-4">
                <MetricCard
                  icon={<Activity className="h-5 w-5 text-primary" aria-hidden />}
                  label={m.responseRateLabel}
                  value={
                    overviewQuery.isLoading
                      ? '…'
                      : responseRate != null
                        ? `${responseRate}%`
                        : '—'
                  }
                  hint={m.responseRateHint}
                />
                <MetricCard
                  icon={<Send className="h-5 w-5 text-primary" aria-hidden />}
                  label={m.sampleRequestsLabel}
                  value={
                    overviewQuery.isLoading
                      ? '…'
                      : sampleRequests != null
                        ? String(sampleRequests)
                        : '—'
                  }
                  hint={m.sampleRequestsHint}
                />
                <MetricCard
                  icon={
                    trendLabel.tone === 'down' ? (
                      <TrendingDown className="h-5 w-5 text-tertiary" aria-hidden />
                    ) : (
                      <TrendingUp className="h-5 w-5 text-primary" aria-hidden />
                    )
                  }
                  label={m.inquiryTrendLabel}
                  value={overviewQuery.isLoading ? '…' : trendLabel.text}
                  hint={m.inquiryTrendNew}
                />
                <MetricCard
                  icon={<Package className="h-5 w-5 text-primary" aria-hidden />}
                  label={m.statsFabrics}
                  value={String(supplier.insights.approvedFabricCount)}
                  hint={m.catalogLabel}
                />
              </div>
            </div>

            {/* CAPABILITIES */}
            <div className="grid grid-cols-1 gap-6 md:grid-cols-3">
              <CapabilityCard
                icon={<Package className="h-6 w-6 text-primary" aria-hidden />}
                label={m.moqShort}
                value={formatMoqRange(supplier.insights.moqMin, supplier.insights.moqMax, '—')}
                hint={m.capabilityMoqHint}
              />
              <CapabilityCard
                icon={<Factory className="h-6 w-6 text-primary" aria-hidden />}
                label={m.leadTime}
                value={m.capabilityLeadTimeValue}
                hint={m.capabilityLeadTimeHint}
              />
              <CapabilityCard
                icon={<Layers className="h-6 w-6 text-primary" aria-hidden />}
                label={m.fabricTypesShort}
                value={primaryFabricType ?? '—'}
                hint={secondaryFabricTypes || m.capabilityFabricTypesHint}
              />
            </div>

            {/* TRENDING FABRICS — only renders when partner-overview returns view data */}
            {trendingFabrics.length > 0 ? (
              <div id={SECTION_IDS.trending} className="scroll-mt-28 space-y-6">
                <div>
                  <h2 className="font-heading text-2xl font-black tracking-tight text-on-surface">
                    {m.trendingFabricsTitle}
                  </h2>
                  <p className="mt-1 text-sm text-on-surface-variant">{m.trendingFabricsSubtitle}</p>
                </div>
                <div className="grid grid-cols-2 gap-4 sm:gap-5 md:grid-cols-4">
                  {trendingFabrics.map((f) => (
                    <Link
                      key={f.id}
                      href={withLocaleUrl(`/fabrics/${f.slug}`, locale)}
                      className="group block overflow-hidden rounded-xl border border-outline/10 bg-surface-container-lowest shadow-sm transition-all hover:-translate-y-0.5 hover:border-primary/30 hover:shadow-md dark:bg-card"
                    >
                      <div className="relative aspect-square w-full overflow-hidden bg-surface-container">
                        {f.image_url ? (
                          <Image
                            src={f.image_url}
                            alt={f.title}
                            fill
                            sizes="(max-width: 768px) 50vw, 25vw"
                            className="object-cover transition-transform duration-300 group-hover:scale-105"
                            unoptimized={isRemoteImageSrc(f.image_url)}
                          />
                        ) : (
                          <div className="flex h-full w-full items-center justify-center bg-surface-container-high text-on-surface-variant">
                            <Package className="h-8 w-8" aria-hidden />
                          </div>
                        )}
                      </div>
                      <div className="space-y-1 p-3">
                        <p className="line-clamp-2 text-sm font-bold text-on-surface group-hover:text-primary">
                          {f.title}
                        </p>
                        <div className="flex items-center justify-between gap-2 text-xs text-on-surface-variant">
                          {f.sku ? (
                            <span className="truncate">
                              {m.skuLabel}: {f.sku}
                            </span>
                          ) : (
                            <span />
                          )}
                          <span className="inline-flex shrink-0 items-center gap-1 font-semibold">
                            <Eye className="h-3.5 w-3.5" aria-hidden />
                            {m.viewsCount.replace('{count}', String(f.views_count))}
                          </span>
                        </div>
                      </div>
                    </Link>
                  ))}
                </div>
              </div>
            ) : null}

            {/* FULL CATALOG */}
            <div id={SECTION_IDS.catalog} className="scroll-mt-28 pt-2">
              <SupplierProfileCatalogSection
                supplierId={supplier.id}
                totalApproved={supplier.insights.approvedFabricCount}
                fabricTypeCounts={supplier.insights.fabricTypeCounts}
                locale={locale}
                messages={messages}
              />
            </div>
          </div>

          {/* SIDEBAR */}
          <aside className="space-y-8 lg:sticky lg:top-24 lg:col-span-4 lg:self-start">
            <div className="overflow-hidden rounded-2xl border border-outline/10 bg-surface-container-lowest shadow-sm dark:bg-card">
              <div className="border-b border-outline/10 px-5 py-4 sm:px-6 sm:py-5">
                <h3 className="font-heading text-lg font-bold leading-tight text-on-surface">{m.headquarters}</h3>
              </div>
              <div className="relative aspect-[16/10] min-h-[11rem] w-full overflow-hidden bg-surface-container sm:min-h-[12rem]">
                <iframe
                  title={`${m.headquarters} — ${displayLocation}`}
                  src={mapIframeSrc}
                  className="absolute inset-0 h-full w-full border-0"
                  loading="lazy"
                  referrerPolicy="no-referrer-when-downgrade"
                  allowFullScreen
                />
              </div>
              <div className="space-y-4 p-5 sm:p-6">
                <div className="flex gap-3">
                  <MapPin className="mt-0.5 h-5 w-5 shrink-0 self-start text-outline" aria-hidden />
                  <p className="min-w-0 flex-1 text-sm leading-relaxed text-on-surface-variant">{displayLocation}</p>
                </div>
                <Button variant="secondary" className="h-11 w-full rounded-lg font-bold sm:h-12" asChild>
                  <a href={mapsUrl} target="_blank" rel="noopener noreferrer">
                    {m.getDirections}
                  </a>
                </Button>
              </div>
            </div>

            <div className="space-y-5 rounded-2xl border border-outline/10 bg-surface-container-lowest p-6 shadow-sm dark:bg-card">
              <h3 className="font-heading text-lg font-bold text-on-surface">{m.certifications}</h3>
              {supplier.verified ? (
                <div className="flex items-start gap-4 rounded-lg bg-surface-container-low p-4 dark:bg-surface-container/60">
                  <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-md bg-background shadow-sm dark:bg-card">
                    <BadgeCheck className="h-5 w-5 text-green-600 dark:text-green-500" aria-hidden />
                  </div>
                  <p className="text-sm leading-relaxed text-on-surface-variant">
                    {m.verificationExplainer}
                  </p>
                </div>
              ) : (
                <p className="text-sm text-on-surface-variant">{m.badgeUnverified}</p>
              )}
              {supplier.websiteUrl ? (
                <a
                  href={supplier.websiteUrl}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="flex items-center gap-3 rounded-lg border border-outline/10 bg-surface-container-low/50 p-4 transition-colors hover:border-primary/40 hover:bg-surface-container-low dark:bg-surface-container/40"
                >
                  <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-md bg-primary/10">
                    <Globe className="h-5 w-5 text-primary" aria-hidden />
                  </div>
                  <div className="min-w-0">
                    <p className="text-[10px] font-bold uppercase tracking-widest text-outline">
                      {m.website}
                    </p>
                    <p className="mt-0.5 truncate text-sm font-semibold text-primary">
                      {supplier.websiteUrl}
                    </p>
                  </div>
                </a>
              ) : null}
            </div>

            <div
              id={SECTION_IDS.contact}
              className="relative scroll-mt-28 overflow-hidden rounded-2xl border border-white/20 bg-gradient-to-br from-primary via-brand-700 to-brand-900 text-white shadow-[0_20px_50px_-12px_rgba(12,86,208,0.45)] dark:border-white/15 dark:shadow-[0_24px_60px_-16px_rgba(0,0,0,0.55)]"
            >
              <div className="pointer-events-none absolute inset-0 bg-[radial-gradient(ellipse_at_top_right,rgba(255,255,255,0.14),transparent_55%)]" aria-hidden />
              <div className="relative p-5 sm:p-6 md:p-7">
                <div className="flex items-start gap-4">
                  <div className="flex h-12 w-12 shrink-0 items-center justify-center rounded-2xl bg-white/15 ring-1 ring-white/25 backdrop-blur-sm">
                    <Send className="h-6 w-6 text-white" aria-hidden />
                  </div>
                  <div className="min-w-0 flex-1 space-y-1.5">
                    <h3 className="font-heading text-lg font-bold leading-snug text-white sm:text-xl">{m.customQuoteTitle}</h3>
                    <p className="text-sm leading-relaxed text-white/85">{m.customQuoteBody}</p>
                  </div>
                </div>
                <div className="mt-6 rounded-xl border border-white/20 bg-black/15 p-4 backdrop-blur-sm sm:p-5">
                  <Input
                    value={quickDraft}
                    onChange={(e) => setQuickDraft(e.target.value)}
                    onKeyDown={(e) => {
                      if (e.key === 'Enter') {
                        e.preventDefault()
                        onQuickRequest()
                      }
                    }}
                    placeholder={m.customQuotePlaceholder}
                    className={cn(
                      'h-11 border border-white/30 bg-white text-on-surface shadow-sm placeholder:text-on-surface-variant/70 sm:h-12',
                      'focus-visible:ring-2 focus-visible:ring-white/70'
                    )}
                    autoComplete="off"
                  />
                  <Button
                    type="button"
                    variant="secondary"
                    className="mt-3 h-11 w-full rounded-xl border border-white/40 !bg-white text-base font-bold !text-primary shadow-md transition-colors hover:!bg-white/95 hover:!text-primary sm:h-12"
                    onClick={onQuickRequest}
                  >
                    {m.customQuoteCta}
                  </Button>
                </div>
              </div>
            </div>
          </aside>
        </section>
      </PublicPageShell>

      <Dialog open={open} onOpenChange={setOpen}>
        <DialogContent className="max-w-2xl">
          <DialogHeader>
            <DialogTitle>{intent === 'sample' ? m.requestSample : m.dialogTitle}</DialogTitle>
            <DialogDescription>{m.dialogDescription}</DialogDescription>
          </DialogHeader>
          <form onSubmit={onSubmit} className="mt-6 space-y-5">
            <div className="grid gap-4 md:grid-cols-2">
              <FormField label={m.formCompany}>
                <Input
                  value={companyName}
                  onChange={(e) => setCompanyName(e.target.value)}
                  placeholder={m.formCompanyPlaceholder}
                  required
                />
              </FormField>
              <FormField label={m.formContact}>
                <Input
                  value={contactName}
                  onChange={(e) => setContactName(e.target.value)}
                  placeholder={m.formContactPlaceholder}
                  required
                />
              </FormField>
              <FormField label={m.formEmail}>
                <Input
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  placeholder={m.formEmailPlaceholder}
                  inputMode="email"
                  type="email"
                  required
                />
              </FormField>
              <FormField label={m.formPhoneOptional}>
                <Input
                  value={phone}
                  onChange={(e) => setPhone(e.target.value)}
                  placeholder={m.formPhonePlaceholder}
                  inputMode="tel"
                />
              </FormField>
              <div className="md:col-span-2">
                <FormField label={m.formCountry}>
                  <Input
                    value={country}
                    onChange={(e) => setCountry(e.target.value)}
                    placeholder={m.formCountryPlaceholder}
                    required
                  />
                </FormField>
              </div>
              <div className="md:col-span-2">
                <FormField label={m.formMessage}>
                  <Textarea
                    value={inquiryText}
                    onChange={(e) => setInquiryText(e.target.value)}
                    placeholder={m.formMessagePlaceholder}
                    required
                    rows={5}
                  />
                </FormField>
              </div>
            </div>
            <Button type="submit" className="w-full rounded-full" disabled={createLead.isPending}>
              {createLead.isPending ? `${m.formSubmit}…` : m.formSubmit}
            </Button>
          </form>
        </DialogContent>
      </Dialog>
    </>
  )
}

function MetricCard({
  icon,
  label,
  value,
  hint
}: {
  icon: ReactNode
  label: string
  value: string
  hint: string
}) {
  return (
    <div className="rounded-xl border border-outline/10 bg-surface-container-lowest p-4 shadow-sm dark:bg-card">
      <div className="flex items-center gap-2">
        {icon}
        <p className="text-[10px] font-bold uppercase tracking-widest text-outline">{label}</p>
      </div>
      <p className="mt-3 font-heading text-xl font-black text-on-surface">{value}</p>
      <p className="mt-1 text-[11px] text-on-surface-variant">{hint}</p>
    </div>
  )
}

function CapabilityCard({
  icon,
  label,
  value,
  hint
}: {
  icon: ReactNode
  label: string
  value: string
  hint: string
}) {
  return (
    <div className="rounded-xl border border-transparent bg-surface-container-low p-6 transition-colors hover:border-outline/30 dark:bg-surface-container/80">
      <div className="mb-4">{icon}</div>
      <h3 className="mb-2 text-sm font-bold uppercase tracking-widest text-outline">{label}</h3>
      <p className="font-heading text-xl font-black text-on-surface">{value}</p>
      <p className="mt-1 text-xs text-on-surface-variant">{hint}</p>
    </div>
  )
}

function FormField({ label, children }: { label: string; children: ReactNode }) {
  return (
    <div className="space-y-2">
      <div className="text-xs font-bold uppercase tracking-widest text-outline/80">{label}</div>
      {children}
    </div>
  )
}
