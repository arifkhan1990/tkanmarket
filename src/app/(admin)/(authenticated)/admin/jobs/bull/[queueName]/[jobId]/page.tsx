import type { Metadata } from 'next'
import { notFound } from 'next/navigation'

import { QUEUE_NAMES } from '@/constants'
import { AdminBullJobDetailClient } from '@/components/admin/job-queue/AdminBullJobDetailClient'

const QUEUES = new Set<string>([
  QUEUE_NAMES.CRAWLER,
  QUEUE_NAMES.AI,
  QUEUE_NAMES.IMAGE,
  QUEUE_NAMES.SOCIAL
])

type Props = { params: Promise<{ queueName: string; jobId: string }> }

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { queueName, jobId } = await params
  return {
    title: `Queue job ${jobId} | TkanMarket Admin`,
    description: `BullMQ job in ${queueName}.`
  }
}

export default async function AdminBullJobDetailPage({ params }: Props) {
  const { queueName: rawQ, jobId: rawJ } = await params
  const queueName = decodeURIComponent(rawQ)
  const jobId = decodeURIComponent(rawJ)
  if (!QUEUES.has(queueName) || jobId.length < 1) notFound()
  return <AdminBullJobDetailClient queueName={queueName} jobId={jobId} />
}
