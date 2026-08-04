import { AdminSupplierDiscoveryClient } from '@/components/admin/supplier-discovery/admin-supplier-discovery-client'
import { requireAdminOrRedirect } from '@/lib/auth/admin-page-guard'

export default async function AdminSupplierDiscoveryPage() {
  await requireAdminOrRedirect()
  return <AdminSupplierDiscoveryClient />
}
