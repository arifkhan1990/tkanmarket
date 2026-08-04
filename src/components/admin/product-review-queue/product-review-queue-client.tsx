'use client'

import * as React from 'react'
import { useQueryClient } from '@tanstack/react-query'
import { useMemo, useState } from 'react'
import { toast } from 'sonner'

import {
  AlertDialog,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle
} from '@/components/ui/alert-dialog'
import { Button } from '@/components/ui/button'
import { Textarea } from '@/components/ui/textarea'
import { useAdminFabricDetailQuery } from '@/hooks/admin/useAdminFabricDetailQuery'
import { useApproveRejectFabrics, useFabricSupervisionFlag } from '@/hooks/admin/useAdminFabrics'
import { useProductReviewQueueQuery } from '@/hooks/admin/useProductReviewQueueQuery'
import { useI18n } from '@/hooks/useI18n'

import { ProductReviewQueueDetailPanel, ProductReviewDetailSkeleton } from './product-review-queue-detail-panel'
import {
  ProductReviewQueueDetailErrorPanel,
  ProductReviewQueueEmptyHero,
  ProductReviewQueueMainLoading
} from './product-review-queue-empty-hero'
import { ProductReviewQueueSidebar } from './product-review-queue-sidebar'

export function ProductReviewQueueClient() {
  const { messages, locale } = useI18n()
  const p = messages.admin.productReviewQueuePage
  const qc = useQueryClient()
  const pageSize = 12
  const [page, setPage] = useState(1)
  const [filter, setFilter] = useState<'pending' | 'processing' | 'all'>('pending')
  const [userSelectedId, setUserSelectedId] = useState<number | null>(null)
  const [rejectOpen, setRejectOpen] = useState(false)
  const [rejectReason, setRejectReason] = useState('')
  const [flagOpen, setFlagOpen] = useState(false)
  const [flagNote, setFlagNote] = useState('')

  const onFilterChange = (next: typeof filter) => {
    setFilter(next)
    setPage(1)
    setUserSelectedId(null)
  }

  const listQuery = useProductReviewQueueQuery({ page, limit: pageSize, filter })
  const items = useMemo(() => listQuery.data?.items ?? [], [listQuery.data?.items])
  const total = listQuery.data?.meta.total ?? 0
  const totalPages = listQuery.data?.meta.totalPages ?? 0
  const counts = listQuery.data?.counts

  const selectedId = useMemo(() => {
    if (items.length === 0) return null
    if (userSelectedId !== null && items.some((i) => i.id === userSelectedId)) return userSelectedId
    return items[0]?.id ?? null
  }, [items, userSelectedId])

  const detailQuery = useAdminFabricDetailQuery(selectedId)
  const fabric = detailQuery.data
  const { approve, reject } = useApproveRejectFabrics()
  const flag = useFabricSupervisionFlag()

  const titleDisplay = useMemo(() => {
    if (!fabric) return '—'
    return (fabric.title_en ?? fabric.title_ru).trim() || fabric.title_ru
  }, [fabric])

  const invalidateQueue = async () => {
    await qc.invalidateQueries({ queryKey: ['admin-product-review-queue'] })
    await qc.invalidateQueries({ queryKey: ['admin-fabrics'] })
  }

  const refreshQueue = async () => {
    await listQuery.refetch()
  }

  React.useEffect(() => {
    if (!detailQuery.isError) return
    toast.error(p.detailError)
  }, [detailQuery.isError, p.detailError])

  const onApprove = () => {
    if (!selectedId) return
    approve.mutate(selectedId, {
      onSuccess: async () => {
        toast.success(p.approveSuccessToast)
        await invalidateQueue()
        if (selectedId) await qc.invalidateQueries({ queryKey: ['admin-fabric-detail', selectedId] })
      }
    })
  }

  const confirmReject = () => {
    const reason = rejectReason.trim()
    if (!selectedId || reason.length < 3) {
      toast.error(p.rejectReasonMinError)
      return
    }
    reject.mutate(
      { id: selectedId, reason },
      {
        onSuccess: async () => {
          toast.success(p.rejectSuccessToast)
          setRejectOpen(false)
          setRejectReason('')
          await invalidateQueue()
          setUserSelectedId(null)
          if (selectedId) await qc.invalidateQueries({ queryKey: ['admin-fabric-detail', selectedId] })
        }
      }
    )
  }

  const confirmFlag = () => {
    if (!selectedId) return
    const note = flagNote.trim()
    flag.mutate(
      { id: selectedId, note: note.length > 0 ? note : undefined },
      {
        onSuccess: async () => {
          toast.success(p.flagSuccessToast)
          setFlagOpen(false)
          setFlagNote('')
          if (selectedId) await qc.invalidateQueries({ queryKey: ['admin-fabric-detail', selectedId] })
        }
      }
    )
  }

  return (
    <>
      <div className="flex min-h-[calc(100dvh-5rem)] flex-col bg-surface lg:min-h-0 lg:flex-row lg:items-start">
        <ProductReviewQueueSidebar
          p={p}
          filter={filter}
          onFilterChange={onFilterChange}
          counts={counts}
          items={items}
          listLoading={listQuery.isLoading}
          selectedId={selectedId}
          onSelect={setUserSelectedId}
          page={page}
          totalPages={totalPages}
          onPageChange={setPage}
          onRefresh={refreshQueue}
          isRefreshing={listQuery.isFetching && !listQuery.isLoading}
          total={total}
        />

        <section className="relative min-w-0 max-lg:min-h-[50vh] flex-1 bg-surface p-4 md:p-8">
          {listQuery.isLoading ? (
            <ProductReviewQueueMainLoading />
          ) : items.length > 0 && selectedId != null && detailQuery.isLoading ? (
            <ProductReviewDetailSkeleton />
          ) : items.length > 0 && selectedId != null && detailQuery.isError ? (
            <ProductReviewQueueDetailErrorPanel
              message={p.detailError}
              retryLabel={p.detailRetry}
              onRetry={() => void detailQuery.refetch()}
            />
          ) : fabric ? (
            <ProductReviewQueueDetailPanel
              p={p}
              fabric={fabric}
              locale={locale}
              titleDisplay={titleDisplay}
              onApprove={onApprove}
              onRejectClick={() => setRejectOpen(true)}
              onFlagClick={() => setFlagOpen(true)}
              approvePending={approve.isPending}
              rejectPending={reject.isPending}
              flagPending={flag.isPending}
            />
          ) : (
            <ProductReviewQueueEmptyHero
              p={p}
              locale={locale}
              onRefresh={refreshQueue}
              isRefreshing={listQuery.isFetching && !listQuery.isLoading}
            />
          )}
        </section>
      </div>

      <AlertDialog
        open={rejectOpen}
        onOpenChange={(open) => {
          setRejectOpen(open)
          if (!open) setRejectReason('')
        }}
      >
        <AlertDialogContent className="max-w-md">
          <AlertDialogHeader>
            <AlertDialogTitle>{p.rejectDialogTitle}</AlertDialogTitle>
            <AlertDialogDescription>{p.rejectDialogDescription}</AlertDialogDescription>
          </AlertDialogHeader>
          <Textarea
            value={rejectReason}
            onChange={(e) => setRejectReason(e.target.value)}
            placeholder={p.rejectReasonPlaceholder}
            rows={4}
            className="rounded-xl"
          />
          <AlertDialogFooter>
            <AlertDialogCancel>{p.dialogCancel}</AlertDialogCancel>
            <Button
              type="button"
              variant="destructive"
              className="rounded-xl"
              disabled={reject.isPending || rejectReason.trim().length < 3}
              onClick={confirmReject}
            >
              {p.rejectConfirm}
            </Button>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>

      <AlertDialog
        open={flagOpen}
        onOpenChange={(open) => {
          setFlagOpen(open)
          if (!open) setFlagNote('')
        }}
      >
        <AlertDialogContent className="max-w-md">
          <AlertDialogHeader>
            <AlertDialogTitle>{p.flagDialogTitle}</AlertDialogTitle>
            <AlertDialogDescription>{p.flagDialogDescription}</AlertDialogDescription>
          </AlertDialogHeader>
          <Textarea
            value={flagNote}
            onChange={(e) => setFlagNote(e.target.value)}
            placeholder={p.flagNotePlaceholder}
            rows={3}
            className="rounded-xl"
          />
          <AlertDialogFooter>
            <AlertDialogCancel>{p.dialogCancel}</AlertDialogCancel>
            <Button type="button" className="rounded-xl" disabled={flag.isPending} onClick={confirmFlag}>
              {p.flagConfirm}
            </Button>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </>
  )
}
