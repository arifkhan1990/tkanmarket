import AdminRawUploadClient from '@/components/admin/raw-upload/AdminRawUploadClient'

export default function AdminRawUploadPage() {
  return (
    <div className="flex-1 space-y-4 p-8 pt-6">
      <div className="flex items-center justify-between">
        <h2 className="text-2xl font-bold tracking-tight">Raw Data Uploads</h2>
      </div>
      <AdminRawUploadClient />
    </div>
  )
}