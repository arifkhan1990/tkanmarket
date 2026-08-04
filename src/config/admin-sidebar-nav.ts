import {
    Activity,
    BarChart2,
    BarChart3,
    Bell,
    Bot,
    Building2,
    CircleDollarSign,
    ClipboardList,
    Cog,
    Construction,
    Eye,
    FileJson2,
    FileText,
    Fingerprint,
    HardDrive,
    History,
    Images,
    Inbox,
    KeyRound,
    LayoutDashboard,
    LayoutGrid,
    LineChart,
    Link2,
    ListChecks,
    ListOrdered,
    Lock,
    Megaphone,
    MessageSquare,
    Package,
    Percent,
    ScrollText,
    Search,
    Settings2,
    Share2,
    Shield,
    ShieldCheck,
    Ship,
    ShoppingCart,
    Shuffle,
    SlidersHorizontal,
    Smartphone,
    Sparkles,
    SquareTerminal,
    Star,
    Stethoscope,
    Store,
    Tags,
    Terminal,
    Timer,
    TrendingUp,
    UserCircle,
    UserCog,
    Users,
    UsersRound,
    Wallet,
    Warehouse,
    Wifi,
    Boxes
} from 'lucide-react'

import type { Messages } from '@/lib/i18n/get-messages'
import type { AdminNavSection } from '@/types/admin-nav.types'

export function buildAdminNavSections(messages: Messages): AdminNavSection[] {
  const s = messages.admin.sidebar

  return [
    {
      id: 'overview',
      title: s.sectionOverview,
      items: [{ href: '/admin/dashboard', label: s.dashboard, icon: LayoutDashboard }]
    },

    {
      id: 'catalog',
      title: s.sectionCatalog,
      items: [
        { href: '/admin/fabrics', label: s.allFabrics, icon: Store, badgeKey: 'fabricsPendingReview' },
        { href: '/admin/fabric-categories', label: s.fabricCategories, icon: Tags },
        { href: '/admin/fabric-types', label: s.fabricTypes, icon: SlidersHorizontal },
        { href: '/admin/product-review-queue', label: s.productReviewQueue, icon: Inbox },
        { href: '/admin/product-attribute-manager', label: s.productAttributeManager, icon: Tags },
        { href: '/admin/fabric-draft-preview', label: s.fabricDraftPreview, icon: Eye }
      ]
    },

    {
      id: 'suppliers',
      title: s.sectionSuppliers,
      items: [
        { href: '/admin/suppliers', label: s.suppliers, icon: Building2 },
        { href: '/admin/supplier-discovery', label: s.supplierDiscovery, icon: Search },
        { href: '/admin/suppliers/analytics', label: s.supplierAnalytics, icon: BarChart3 },
        { href: '/admin/suppliers/compliance', label: s.supplierCompliance, icon: ShieldCheck },
        { href: '/admin/supplier-reviews', label: s.supplierReviews, icon: Star },
        { href: '/admin/supplier-verification', label: s.supplierVerification, icon: ListChecks },
        { href: '/admin/suppliers/withdrawals', label: s.supplierWithdrawals, icon: Wallet }
      ]
    },

    {
      id: 'leads',
      title: s.sectionLeads,
      items: [
        { href: '/admin/leads', label: s.allLeads, icon: ClipboardList },
        { href: '/admin/leads/scoring', label: s.leadScoring, icon: LineChart },
        { href: '/admin/leads/assignment-rules', label: s.leadAssignmentRules, icon: Shuffle }
      ]
    },

    {
      id: 'commerce',
      title: s.sectionCommerce,
      items: [
        { href: '/admin/bulk-order-management', label: s.bulkOrders, icon: ShoppingCart },
        { href: '/admin/bulk-inquiries', label: s.bulkInquiries, icon: ScrollText },
        { href: '/admin/commission-rules', label: s.commissionRules, icon: Percent },
        { href: '/admin/wholesale-pricing-simulator', label: s.wholesalePricingSimulator, icon: CircleDollarSign },
        { href: '/admin/wholesale-pricing/tiers', label: s.wholesalePricingTiers, icon: Percent },
        { href: '/admin/sample-inventory', label: s.sampleInventory, icon: Boxes },
        { href: '/admin/sample-lifecycle', label: s.sampleLifecycle, icon: Package }
      ]
    },

    {
      id: 'logistics',
      title: s.sectionLogistics,
      items: [
        { href: '/admin/carrier-management', label: s.carrierManagement, icon: ScrollText },
        { href: '/admin/global-shipping-logistics', label: s.globalShipping, icon: Ship },
        { href: '/admin/inventory-distribution-hub', label: s.inventoryDistributionHub, icon: Warehouse },
        { href: '/admin/inventory-health', label: s.inventoryHealth, icon: Activity },
        { href: '/admin/inventory-health-distribution', label: s.inventoryHealthDistribution, icon: LayoutGrid }
      ]
    },

    {
      id: 'analytics',
      title: s.sectionAnalytics,
      items: [
        { href: '/admin/marketplace-analytics', label: s.analytics, icon: LineChart },
        { href: '/admin/sales-performance', label: s.salesPerformance, icon: TrendingUp },
        { href: '/admin/pricing-analysis', label: s.pricingAnalysis, icon: CircleDollarSign },
        { href: '/admin/network-performance', label: s.networkPerformance, icon: Wifi },
        { href: '/admin/reports/custom-builder', label: s.customReportBuilder, icon: BarChart2 },
        { href: '/admin/alerts', label: s.alertsHub, icon: Bell }
      ]
    },

    {
      id: 'content',
      title: s.sectionContent,
      items: [
        { href: '/admin/social', label: s.content, icon: Smartphone },
        { href: '/admin/media-library', label: s.mediaLibrary, icon: Images },
        { href: '/admin/promotion-manager', label: s.promotionHub, icon: Sparkles },
        { href: '/admin/message-center', label: s.messageCenter, icon: MessageSquare },
        { href: '/admin/internal-communications', label: s.internalCommunications, icon: Megaphone },
        { href: '/admin/blog', label: s.blog, icon: FileText }
      ]
    },

    {
      id: 'data',
      title: s.sectionData,
      items: [
        { href: '/admin/bulk-data-operations', label: s.bulkDataOps, icon: ClipboardList },
        { href: '/admin/catalog-import-sync', label: s.catalogImport, icon: ClipboardList },
        { href: '/admin/catalog-export', label: s.catalogExport, icon: ScrollText },
        { href: '/admin/export-configurator', label: s.exportConfigurator, icon: FileJson2 },
        { href: '/admin/bulk-seo-editor', label: s.bulkSeoEditor, icon: ScrollText },
        { href: '/admin/data-migration-mapping', label: s.dataMigrationMapping, icon: Link2 }
      ]
    },

    {
      id: 'automation',
      title: s.sectionAutomation,
      items: [
        { href: '/admin/crawler/control', label: s.crawler, icon: Bot },
        { href: '/admin/prompt-rules', label: s.promptRules, icon: Sparkles },
        { href: '/admin/ai-prompt-logs', label: s.aiPromptLogs, icon: Sparkles },
        { href: '/admin/job-queue', label: s.jobQueue, icon: ListOrdered }
      ]
    },

    {
      id: 'team',
      title: s.sectionTeam,
      items: [
        { href: '/admin/teams', label: s.teams, icon: UsersRound },
        { href: '/admin/team-performance', label: s.teamPerformance, icon: TrendingUp }
      ]
    },

    {
      id: 'security',
      title: s.sectionSecurity,
      items: [
        { href: '/admin/security/auth-log', label: s.securityAuthLog, icon: Shield },
        { href: '/admin/security/settings', label: s.securitySettings, icon: Lock },
        { href: '/admin/audit-log', label: s.auditLog, icon: ScrollText },
        { href: '/admin/activity-logs', label: s.activityLogs, icon: ScrollText },
        { href: '/admin/activity-timeline', label: s.activityTimeline, icon: Timer }
      ]
    },

    {
      id: 'system',
      title: s.sectionPlatform,
      items: [
        { href: '/admin/system-health-monitor', label: s.systemHealth, icon: Activity },
        { href: '/admin/system-backup-recovery', label: s.systemBackupRecovery, icon: HardDrive },
        { href: '/admin/system/integrations', label: s.systemIntegrations, icon: Share2 },
        { href: '/admin/system/logs', label: s.systemLogs, icon: Terminal },
        { href: '/admin/system/preferences', label: s.systemPreferences, icon: SlidersHorizontal },
        { href: '/admin/system/platform-settings', label: s.systemPlatformSettings, icon: Settings2 },
        { href: '/admin/system/update-log', label: s.systemUpdateLog, icon: History },
        { href: '/admin/system/maintenance', label: s.systemMaintenance, icon: Construction },
        { href: '/admin/technical-diagnostics', label: s.technicalDiagnostics, icon: Stethoscope },
        { href: '/admin/api-keys', label: s.apiKeys, icon: KeyRound },
        { href: '/admin/api-sandbox', label: s.apiSandbox, icon: SquareTerminal }
      ]
    },

    {
      id: 'account',
      title: s.sectionAccount,
      items: [
        { href: '/admin/profile', label: s.profile, icon: UserCircle },
        { href: '/admin/roles-permissions', label: s.rolesPermissions, icon: Fingerprint },
        { href: '/admin/user-access', label: s.userAccess, icon: Users },
        { href: '/admin/access', label: s.accessControl, icon: UserCog },
        { href: '/admin/settings', label: s.settings, icon: Cog }
      ]
    }
  ]
}
