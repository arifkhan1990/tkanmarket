export type AdminAnnouncementImportance = 'LOW' | 'MEDIUM' | 'HIGH'

export type AdminAnnouncementAuthor = {
  id: number
  name: string
  avatarUrl: string | null
}

export type AdminAnnouncementListItem = {
  id: number
  title: string
  body: string
  importance: AdminAnnouncementImportance
  referenceCode: string | null
  createdAt: string
  ackCount: number
  teamSize: number
  recentAckAuthors: AdminAnnouncementAuthor[]
  iconKey: 'settings_suggest' | 'rocket_launch' | 'security' | 'campaign'
}

export type AdminAnnouncementsOverview = {
  openRatePercent: number
  activeAdminUsers: number
  teamSize: number
}

export type AdminAnnouncementsListResponse = {
  overview: AdminAnnouncementsOverview
  items: AdminAnnouncementListItem[]
}

export type AdminAnnouncementCreateInput = {
  title: string
  body: string
  importance: AdminAnnouncementImportance
  referenceCode?: string | null
}
