import type { Metadata } from 'next'
import { notFound } from 'next/navigation'

import { AdminCrawlerJobDetailClient } from '@/components/admin/job-queue/AdminCrawlerJobDetailClient'

type Props = { params: Promise<{ runId: string }> }

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { runId } = await params
  return {
    title: `Crawler run #${runId} | TkanMarket Admin`,
    description: 'Crawler run detail, logs, and metrics.'
  }
}

export default async function AdminCrawlerJobDetailPage({ params }: Props) {
  const { runId } = await params
  const id = Number(runId)
  if (!Number.isInteger(id) || id < 1) notFound()
  return <AdminCrawlerJobDetailClient runId={id} />
}
