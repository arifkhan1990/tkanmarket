'use client'

import * as React from 'react'

export type AdminLayoutState = {
  collapsed: boolean
  setCollapsed: (next: boolean) => void
  toggleCollapsed: () => void
  sidebarWidthPx: number
  mobileNavOpen: boolean
  setMobileNavOpen: (next: boolean) => void
  globalSearchOpen: boolean
  setGlobalSearchOpen: (next: boolean) => void
  quickSettingsOpen: boolean
  setQuickSettingsOpen: (next: boolean) => void
}

const AdminLayoutContext = React.createContext<AdminLayoutState | null>(null)

export function AdminLayoutProvider({
  children,
  value
}: {
  children: React.ReactNode
  value: AdminLayoutState
}) {
  return <AdminLayoutContext.Provider value={value}>{children}</AdminLayoutContext.Provider>
}

export function useAdminLayout() {
  const ctx = React.useContext(AdminLayoutContext)
  if (!ctx) throw new Error('useAdminLayout must be used within AdminLayoutProvider')
  return ctx
}

