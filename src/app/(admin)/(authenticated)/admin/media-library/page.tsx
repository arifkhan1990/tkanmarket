import type { Metadata } from 'next'

import { AdminMediaLibraryClient } from '@/components/admin/marketplace-suite/AdminMediaLibraryClient'

export const metadata: Metadata = {
  title: 'TkanMarket | Media library',
  description: 'Browse fabric images and media assets from the catalog.'
}

export default function MediaLibraryPage() {
  return <AdminMediaLibraryClient />
}
