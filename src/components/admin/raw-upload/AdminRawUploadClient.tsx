'use client'

import { useState, useCallback } from 'react'
import { toast } from 'sonner'

import { Button } from '@/components/ui/button'
import { Card, CardContent, CardHeader } from '@/components/ui/card'
import { Input } from '@/components/ui/input'
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow
} from '@/components/ui/table'
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger
} from '@/components/ui/dialog'
import { Badge } from '@/components/ui/badge'
import {
  UploadCloud,
  RefreshCw,
  CheckCircle2,
  XCircle,
  Clock,
  AlertTriangle,
  FileText,
  Database,
  ChevronRight
} from 'lucide-react'

import type { AdminRawUploadSummary, AdminRawUploadRowSummary } from '@/types/admin-raw-upload.types'

export default function AdminRawUploadClient() {
  const [uploads, setUploads] = useState<AdminRawUploadSummary[]>([])
  const [loading, setLoading] = useState(false)
  const [uploadDialogOpen, setUploadDialogOpen] = useState(false)
  const [selectedUpload, setSelectedUpload] = useState<AdminRawUploadSummary | null>(null)
  const [rows, setRows] = useState<AdminRawUploadRowSummary[]>([])
  const [rowsLoading, setRowsLoading] = useState(false)
  const [processing, setProcessing] = useState(false)
  const [enqueueing, setEnqueueing] = useState(false)

  const fetchUploads = useCallback(async () => {
    setLoading(true)
    try {
      const res = await fetch('/api/v1/admin/raw-uploads?limit=20')
      const json = await res.json()
      if (json.data) {
        setUploads(json.data.items ?? json.data)
      }
    } catch {
      toast.error('Failed to load uploads')
    } finally {
      setLoading(false)
    }
  }, [])

  const fetchRows = useCallback(
    async (uploadId: number) => {
      setRowsLoading(true)
      try {
        const res = await fetch(`/api/v1/admin/raw-uploads/${uploadId}/rows?limit=100`)
        const json = await res.json()
        if (json.data) {
          setRows(json.data.items ?? json.data)
        }
      } catch {
        toast.error('Failed to load rows')
      } finally {
        setRowsLoading(false)
      }
    },
    []
  )

  const handleUpload = useCallback(
    async (e: React.ChangeEvent<HTMLInputElement>) => {
      const file = e.target.files?.[0]
      if (!file) return

      const formData = new FormData()
      formData.append('file', file)

      try {
        const res = await fetch('/api/v1/admin/raw-uploads/upload', {
          method: 'POST',
          body: formData
        })
        const json = await res.json()
        if (json.error) {
          toast.error(json.error?.message ?? 'Upload failed')
        } else if (json.data) {
          toast.success('Upload successful', { description: `${json.data.totalRows} rows detected` })
          await fetchUploads()
          setUploadDialogOpen(false)
        }
      } catch {
        toast.error('Upload failed')
      }

      e.target.value = ''
    },
    [fetchUploads]
  )

  const handleProcess = useCallback(
    async (uploadId: number) => {
      setProcessing(true)
      try {
        const res = await fetch(`/api/v1/admin/raw-uploads/${uploadId}/process`, {
          method: 'POST'
        })
        const json = await res.json()
        if (json.error) {
          toast.error(json.error?.message ?? 'Processing failed')
        } else if (json.data) {
          toast.success('Processing complete', {
            description: `Processed: ${json.data.processedCount}, Errors: ${json.data.errorCount}`
          })
          await fetchUploads()
          setSelectedUpload((prev) => (prev?.id === uploadId ? { ...prev, ...json.data } : prev))
        }
      } catch {
        toast.error('Processing failed')
      } finally {
        setProcessing(false)
      }
    },
    [fetchUploads]
  )

  const handleEnqueueAI = useCallback(
    async (uploadId: number) => {
      setEnqueueing(true)
      try {
        const res = await fetch(`/api/v1/admin/raw-uploads/${uploadId}/enqueue-ai`, {
          method: 'POST'
        })
        const json = await res.json()
        if (json.error) {
          toast.error(json.error?.message ?? 'Enqueue failed')
        } else if (json.data) {
          toast.success('AI jobs enqueued', { description: `${json.data.enqueuedCount} fabrics queued` })
        }
      } catch {
        toast.error('Enqueue failed')
      } finally {
        setEnqueueing(false)
      }
    },
    []
  )

  const handleViewRows = useCallback(
    (upload: AdminRawUploadSummary) => {
      setSelectedUpload(upload)
      fetchRows(upload.id)
    },
    [fetchRows]
  )

  const statusIcon = (status: string) => {
    switch (status) {
      case 'COMPLETED':
        return <CheckCircle2 className="h-4 w-4 text-emerald-500" />
      case 'FAILED':
        return <XCircle className="h-4 w-4 text-red-500" />
      case 'PROCESSING':
        return <RefreshCw className="h-4 w-4 text-blue-500 animate-spin" />
      default:
        return <Clock className="h-4 w-4 text-muted-foreground" />
    }
  }

  const statusBadgeIntent = (status: string) => {
    switch (status) {
      case 'COMPLETED':
        return 'success' as const
      case 'FAILED':
        return 'error' as const
      case 'PROCESSING':
        return 'warning' as const
      default:
        return 'default' as const
    }
  }

  return (
    <div className="space-y-6">
      <Card>
        <CardHeader className="flex flex-row items-center justify-between">
          <h2 className="text-lg font-semibold flex items-center gap-2">
            <Database className="h-5 w-5" />
            Raw Data Uploads
          </h2>
          <div className="flex gap-2">
            <Dialog open={uploadDialogOpen} onOpenChange={setUploadDialogOpen}>
              <DialogTrigger asChild>
                <Button>
                  <UploadCloud className="mr-2 h-4 w-4" />
                  Upload File
                </Button>
              </DialogTrigger>
              <DialogContent>
                <DialogHeader>
                  <DialogTitle>Upload Raw Data File</DialogTitle>
                </DialogHeader>
                <div className="space-y-4 py-4">
                  <div className="space-y-2">
                    <span className="text-sm font-medium">File (Excel, CSV, JSON)</span>
                    <Input type="file" accept=".xlsx,.xls,.csv,.json" onChange={handleUpload} />
                  </div>
                </div>
              </DialogContent>
            </Dialog>
            <Button variant="outline" onClick={fetchUploads} disabled={loading}>
              <RefreshCw className={`mr-2 h-4 w-4 ${loading ? 'animate-spin' : ''}`} />
              Refresh
            </Button>
          </div>
        </CardHeader>
        <CardContent>
          {loading ? (
            <div className="flex items-center justify-center py-8">
              <RefreshCw className="h-6 w-6 animate-spin text-muted-foreground" />
            </div>
          ) : uploads.length === 0 ? (
            <div className="flex flex-col items-center justify-center py-8 text-muted-foreground">
              <Database className="mb-2 h-8 w-8 opacity-50" />
              <p>No uploads yet</p>
              <p className="text-xs">Upload a raw data file to get started</p>
            </div>
          ) : (
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>File</TableHead>
                  <TableHead>Type</TableHead>
                  <TableHead>Status</TableHead>
                  <TableHead>Rows</TableHead>
                  <TableHead>Processed</TableHead>
                  <TableHead>Errors</TableHead>
                  <TableHead>Created</TableHead>
                  <TableHead>Actions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {uploads.map((upload) => (
                  <TableRow key={upload.id}>
                    <TableCell className="font-medium">
                      <FileText className="mr-2 inline h-4 w-4 text-muted-foreground" />
                      {upload.filename}
                    </TableCell>
                    <TableCell>
                      <Badge intent="default">{upload.fileType}</Badge>
                    </TableCell>
                    <TableCell>{statusIcon(upload.status)}</TableCell>
                    <TableCell>{upload.totalRows}</TableCell>
                    <TableCell>{upload.processedRows}</TableCell>
                    <TableCell>
                      {upload.errorRows > 0 ? (
                        <span className="text-red-500">{upload.errorRows}</span>
                      ) : (
                        <span className="text-muted-foreground">0</span>
                      )}
                    </TableCell>
                    <TableCell className="text-xs text-muted-foreground">
                      {new Date(upload.createdAt).toLocaleString()}
                    </TableCell>
                    <TableCell className="flex gap-2">
                      <Button variant="ghost" size="sm" onClick={() => handleViewRows(upload)}>
                        <ChevronRight className="h-4 w-4" />
                      </Button>
                      {upload.status === 'COMPLETED' && (
                        <>
                          <Button
                            variant="ghost"
                            size="sm"
                            onClick={() => handleProcess(upload.id)}
                            disabled={processing}
                          >
                            <RefreshCw className="h-4 w-4" />
                          </Button>
                          <Button
                            variant="ghost"
                            size="sm"
                            onClick={() => handleEnqueueAI(upload.id)}
                            disabled={enqueueing}
                          >
                            <AlertTriangle className="h-4 w-4" />
                          </Button>
                        </>
                      )}
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          )}
        </CardContent>
      </Card>

      {selectedUpload && (
        <Card>
          <CardHeader>
            <h3 className="text-sm font-semibold flex items-center gap-2">
              <FileText className="h-4 w-4" />
              Rows for: {selectedUpload.filename}
              <Badge intent={statusBadgeIntent(selectedUpload.status)}>{selectedUpload.status}</Badge>
            </h3>
          </CardHeader>
          <CardContent>
            {rowsLoading ? (
              <div className="flex items-center justify-center py-4">
                <RefreshCw className="h-4 w-4 animate-spin text-muted-foreground" />
              </div>
            ) : rows.length === 0 ? (
              <p className="text-sm text-muted-foreground">No rows found</p>
            ) : (
              <div className="max-h-96 overflow-y-auto">
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead className="w-12">#</TableHead>
                      <TableHead>Raw Data</TableHead>
                      <TableHead>Status</TableHead>
                      <TableHead>Error</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {rows.map((row) => (
                      <TableRow key={row.id}>
                        <TableCell className="text-xs">{row.rowIndex}</TableCell>
                        <TableCell className="max-w-xs">
                          <pre className="truncate text-xs">{JSON.stringify(row.rawData)}</pre>
                        </TableCell>
                        <TableCell>{statusIcon(row.status)}</TableCell>
                        <TableCell className="text-xs text-red-500 max-w-xs truncate">
                          {row.errorMessage}
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </div>
            )}
          </CardContent>
        </Card>
      )}
    </div>
  )
}