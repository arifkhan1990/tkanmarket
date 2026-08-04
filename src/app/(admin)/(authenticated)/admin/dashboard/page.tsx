import type { Metadata } from 'next'
import { requireAdminOrRedirect } from '@/lib/auth/admin-page-guard'
import { StatsCard } from '@/components/admin/StatsCard'
import { FabricsPublishedChart } from '@/components/admin/charts/FabricsPublishedChart'
import { LeadsBySourceChart } from '@/components/admin/charts/LeadsBySourceChart'
import { ActivityFeed } from '@/components/admin/ActivityFeed'
import { StatsService } from '@/services/stats.service'
import { AdminDashboardQuickLinks } from '@/components/admin/dashboard/AdminDashboardQuickLinks'
import { DashboardExportButton } from '@/components/admin/dashboard/DashboardExportButton'
import { TrafficVsConversionsChart } from '@/components/admin/charts/TrafficVsConversionsChart'
import { TopFabricCategoriesChart } from '@/components/admin/charts/TopFabricCategoriesChart'
import { unstable_noStore as noStore } from 'next/cache'
import { getServerLocale } from '@/lib/i18n/get-locale'
import { getMessages } from '@/lib/i18n/get-messages'

export async function generateMetadata(): Promise<Metadata> {
  const locale = await getServerLocale()
  const m = getMessages(locale)
  return {
    title: m.admin.meta.dashboard.title,
    description: m.admin.meta.dashboard.description,
  }
}

export default async function AdminDashboardPage() {
  noStore()
  await requireAdminOrRedirect()

  const m = getMessages(await getServerLocale())
  const s = m.admin.dashboardStats
  const dash = m.admin.dashboard

  const [
    fabricStats,
    leadStats,
    socialStats,
    crawlerStats,
    fabricsPublishedSeries,
    leadsBySource,
    trafficVsConversions,
    topFabricCategories
  ] = await Promise.all([
    StatsService.getFabricStats(),
    StatsService.getLeadStats(),
    StatsService.getSocialStats(),
    StatsService.getCrawlerStats(),
    StatsService.getFabricsPublishedSeriesLast30Days(),
    StatsService.getLeadsBySourceLast30Days(),
    StatsService.getTrafficVsConversionsSeriesLast30Days(),
    StatsService.getTopFabricCategoriesLast30Days()
  ])

  const crawlerCardParts: string[] = []
  if (crawlerStats.last_run_status) crawlerCardParts.push(crawlerStats.last_run_status)
  if (crawlerStats.running_jobs > 0) crawlerCardParts.push(`${crawlerStats.running_jobs} ${dash.running}`)
  if (crawlerStats.products_saved_last_run > 0) {
    crawlerCardParts.push(`${crawlerStats.products_saved_last_run} ${dash.crawlerSavedHint}`)
  }
  const crawlerCardDescription = crawlerCardParts.length > 0 ? crawlerCardParts.join(' · ') : undefined

  return (
    <div className="space-y-6">
      <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h1 className="font-heading text-heading-xl font-extrabold tracking-tight">Business Analytics</h1>
          <p className="mt-1 text-sm text-on-surface-variant">Last 30 days performance overview.</p>
        </div>
        <div className="flex items-center gap-3">
          <div className="hidden rounded-full bg-surface-container-highest border border-outline/10 px-4 py-2 sm:block">
            <span className="text-xs font-bold uppercase tracking-widest text-on-surface-variant">Last 30 days</span>
          </div>
          <DashboardExportButton
            fabricStats={fabricStats}
            leadStats={leadStats}
            socialStats={socialStats}
            crawlerStats={crawlerStats}
            fabricsPublishedSeries={fabricsPublishedSeries}
            leadsBySource={leadsBySource}
            trafficVsConversions={trafficVsConversions}
            topFabricCategories={topFabricCategories}
          />
        </div>
      </div>

      <section
        className="rounded-2xl border border-outline/10 bg-surface-container-lowest/80 p-3 shadow-sm sm:p-4 dark:border-outline/15"
        aria-label="Key metrics"
      >
        <div className="grid gap-2.5 sm:grid-cols-2 sm:gap-3 lg:grid-cols-4">
          <StatsCard variant="compact" title={s.fabricsTotal} value={fabricStats.total} icon="package-search" color="blue" />
          <StatsCard variant="compact" title={s.pendingReview} value={fabricStats.pending_review} icon="clock" color="yellow" />
          <StatsCard variant="compact" title={s.aiProcessing} value={fabricStats.ai_processing} icon="bot" color="red" />
          <StatsCard variant="compact" title={s.publishedToday} value={fabricStats.published_today} icon="calendar-check2" color="green" />
          <StatsCard variant="compact" title={s.leadsTotal} value={leadStats.total} icon="target" color="blue" />
          <StatsCard variant="compact" title={s.newToday} value={leadStats.new_today} icon="sparkles" color="green" />
          <StatsCard variant="compact" title={s.open} value={leadStats.open} icon="flame" color="yellow" />
          <StatsCard variant="compact" title={s.wonThisMonth} value={leadStats.closed_won_this_month} icon="check-circle2" color="green" />
          <StatsCard variant="compact" title={s.postsThisWeek} value={socialStats.posts_this_week} icon="megaphone" color="blue" />
          <StatsCard variant="compact" title={s.scheduled} value={socialStats.scheduled} icon="file-text" color="yellow" />
          <StatsCard variant="compact" title={s.publishedTotal} value={socialStats.published_total} icon="check-circle2" color="green" />
          <StatsCard
            variant="compact"
            title={s.lastCrawlProducts}
            value={crawlerStats.products_found_last_run}
            description={crawlerCardDescription}
            href="/admin/crawler/control"
            icon="package-search"
            color="red"
          />
        </div>
      </section>

      <AdminDashboardQuickLinks
        title={dash.quickLinksTitle}
        links={[
          {
            href: '/admin/reports/custom-builder',
            title: dash.quickLinkReport,
            description: dash.quickLinkReportDesc
          },
          {
            href: '/admin/data-migration-mapping',
            title: dash.quickLinkMapping,
            description: dash.quickLinkMappingDesc
          },
          {
            href: '/admin/fabric-draft-preview',
            title: dash.quickLinkPreview,
            description: dash.quickLinkPreviewDesc
          },
          {
            href: '/admin/global-shipping-logistics',
            title: dash.quickLinkShipping,
            description: dash.quickLinkShippingDesc
          },
          {
            href: '/admin/help-support',
            title: dash.quickLinkHelp,
            description: dash.quickLinkHelpDesc
          },
          {
            href: '/admin/internal-communications',
            title: dash.quickLinkInternalComms,
            description: dash.quickLinkInternalCommsDesc
          },
          {
            href: '/admin/inventory-distribution-hub',
            title: dash.quickLinkInventoryHub,
            description: dash.quickLinkInventoryHubDesc
          },
          {
            href: '/admin/inventory-health',
            title: dash.quickLinkInventoryHealth,
            description: dash.quickLinkInventoryHealthDesc
          },
          {
            href: '/admin/inventory-health-distribution',
            title: dash.quickLinkHealthDistribution,
            description: dash.quickLinkHealthDistributionDesc
          },
          {
            href: '/admin/job-queue',
            title: dash.quickLinkJobQueue,
            description: dash.quickLinkJobQueueDesc
          },
          {
            href: '/admin/suppliers',
            title: dash.quickLinkSuppliers,
            description: dash.quickLinkSuppliersDesc
          }
        ]}
      />

      <div className="space-y-6">
        <TrafficVsConversionsChart data={trafficVsConversions} />

        <div className="grid gap-4 lg:grid-cols-2">
          <FabricsPublishedChart data={fabricsPublishedSeries} />
          <LeadsBySourceChart data={leadsBySource} />
        </div>

        <TopFabricCategoriesChart data={topFabricCategories} />
      </div>

      <div className="grid gap-4 lg:grid-cols-12">
        <div className="lg:col-span-12">
          <ActivityFeed />
        </div>
      </div>
    </div>
  )
}
