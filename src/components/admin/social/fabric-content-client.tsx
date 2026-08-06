'use client'

import { useEffect, useState } from 'react'
import Image from 'next/image'
import Link from 'next/link'
import { useRouter } from 'next/navigation'

import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardHeader } from '@/components/ui/card'
import { Skeleton } from '@/components/ui/skeleton'

interface FabricPost {
  id: number
  platform: string
  contentType: string
  status: string
  reviewState?: string | null
  revisionNumber?: number | null
  supersedesPostId?: number | null
  captionText: string | null
  scheduledAt: string | null
  publishedAt: string | null
  reach: number | null
  likes: number | null
  shares: number | null
  linkClicks: number | null
  errorMessage: string | null
  primaryImageUrl: string | null
  fabricTitle: string | null
  fabricSku: string | null
  supplierName: string | null
  publishCredentialId?: number | null
  platformAccountId?: string | null
  publishedVersion?: number | null
  timezone?: string | null
}

interface FabricSummary {
  id: number
  fabricTitle: string | null
  fabricSku: string | null
  supplierName: string | null
}

const STATUS_STYLES: Record<string, string> = {
  DRAFT: 'bg-slate-100 text-slate-700',
  APPROVED: 'bg-emerald-50 text-emerald-700',
  SCHEDULED: 'bg-blue-50 text-blue-700',
  PUBLISHED: 'bg-green-100 text-green-800',
  FAILED: 'bg-red-50 text-red-700',
  VIDEO_PENDING: 'bg-amber-50 text-amber-700',
  PUBLISHING: 'bg-violet-50 text-violet-700'
}

const REVIEW_STYLES: Record<string, string> = {
  NOT_REVIEWED: 'bg-slate-100 text-slate-500',
  CONTENT_APPROVED: 'bg-cyan-50 text-cyan-700',
  VIDEO_APPROVED: 'bg-teal-50 text-teal-700',
  FULLY_APPROVED: 'bg-emerald-100 text-emerald-800',
  REJECTED: 'bg-red-100 text-red-800'
}

export default function FabricContentClient({ fabricId }: { fabricId: number }) {
  const router = useRouter()
  const [fabric, setFabric] = useState<FabricSummary | null>(null)
  const [posts, setPosts] = useState<FabricPost[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    let cancelled = false
    async function load() {
      try {
        setLoading(true)
        const res = await fetch(`/api/v1/admin/social?fabric_id=${fabricId}&limit=100`)
        const json = await res.json()
        if (!res.ok) throw new Error(json.error ?? 'Failed to load fabric content')
        const items: FabricPost[] = (json.data?.items ?? []) as FabricPost[]
        if (cancelled) return
        setPosts(items)
        const first = items[0]
        if (first) {
          setFabric({ id: fabricId, fabricTitle: first.fabricTitle, fabricSku: first.fabricSku, supplierName: first.supplierName })
        } else {
          setFabric({ id: fabricId, fabricTitle: null, fabricSku: null, supplierName: null })
        }
      } catch (err) {
        if (!cancelled) setError(err instanceof Error ? err.message : 'Unknown error')
      } finally {
        if (!cancelled) setLoading(false)
      }
    }
    load()
    return () => {
      cancelled = true
    }
  }, [fabricId])

  if (loading) {
    return (
      <div className="space-y-4">
        <Skeleton className="h-8 w-72" />
        <Skeleton className="h-64 w-full" />
      </div>
    )
  }

  if (error) {
    return (
      <div className="rounded-lg border border-red-200 bg-red-50 p-6 text-sm text-red-700">
        {error}
      </div>
    )
  }

  return (
    <div className="space-y-6">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div>
          <h1 className="text-xl font-semibold text-slate-900">{fabric?.fabricTitle ?? `Fabric #${fabricId}`}</h1>
          {fabric?.fabricSku && <p className="mt-1 text-sm text-slate-500">SKU: {fabric.fabricSku} · {fabric.supplierName}</p>}
          {!fabric?.fabricSku && <p className="mt-1 text-sm text-slate-500">No social posts yet — open the post management page to generate content.</p>}
        </div>
        <div className="flex gap-2">
          <Button variant="outline" size="sm" onClick={() => router.push(`/admin/social?fabric_id=${fabricId}`)}>
            Open post manager
          </Button>
          <Button variant="outline" size="sm" onClick={() => router.push(`/admin/fabrics/${fabricId}`)}>
            Fabric detail
          </Button>
        </div>
      </div>

      {posts.length === 0 ? (
        <Card>
          <CardContent className="flex flex-col items-center gap-3 py-12 text-center">
            <p className="text-sm text-slate-500">No social posts for this fabric yet.</p>
            <div className="flex gap-2">
              <Link href={`/admin/social?fabric_id=${fabricId}`}>
                <Button size="sm" variant="outline">Create in post manager</Button>
              </Link>
            </div>
          </CardContent>
        </Card>
      ) : (
        <Card>
          <CardHeader>
            <h2 className="text-base font-semibold text-slate-900">Posts ({posts.length})</h2>
          </CardHeader>
          <CardContent className="space-y-3">
            {posts.map((post) => (
              <div key={post.id} className="flex flex-wrap items-start justify-between gap-3 rounded-lg border border-slate-200 p-4">
                <div className="flex items-start gap-3">
                  {post.primaryImageUrl ? (
                    <Image
                      src={post.primaryImageUrl}
                      alt=""
                      width={56}
                      height={56}
                      unoptimized={post.primaryImageUrl.startsWith('http')}
                      className="h-14 w-14 rounded-md object-cover"
                    />
                  ) : (
                    <div className="flex h-14 w-14 items-center justify-center rounded-md bg-slate-100 text-lg">{post.platform[0]}</div>
                  )}
                  <div className="min-w-0">
                    <div className="flex flex-wrap items-center gap-2">
                      <span className="text-sm font-medium text-slate-900">{post.platform}</span>
                      <Badge intent="default" className="text-[10px] uppercase tracking-wide">{post.contentType}</Badge>
                      <Badge intent="default" className={`text-[10px] uppercase tracking-wide ${STATUS_STYLES[post.status] ?? 'bg-slate-100 text-slate-700'}`}>{post.status}</Badge>
                      {post.reviewState && (
                        <Badge intent="default" className={`text-[10px] uppercase tracking-wide ${REVIEW_STYLES[post.reviewState] ?? 'bg-slate-100 text-slate-500'}`}>{post.reviewState.replaceAll('_', ' ')}</Badge>
                      )}
                    </div>
                    <p className="mt-1 line-clamp-2 max-w-xl text-sm text-slate-600">
                      {post.captionText || 'No caption'}
                    </p>
                    <div className="mt-1 flex flex-wrap gap-x-4 gap-y-1 text-xs text-slate-400">
                      {post.revisionNumber !== undefined && <span>rev {post.revisionNumber}</span>}
                      {post.publishedVersion !== undefined && post.publishedVersion != null && <span>published v{post.publishedVersion}</span>}
                      {post.platformAccountId && <span>{post.platformAccountId}</span>}
                      {post.publishedAt && <span>{new Date(post.publishedAt).toLocaleString()}</span>}
                      {post.scheduledAt && <span>scheduled {new Date(post.scheduledAt).toLocaleString()}</span>}
                    </div>
                    {post.errorMessage && <p className="mt-1 text-xs text-red-600">{post.errorMessage}</p>}
                  </div>
                </div>
                <div className="flex items-center gap-3">
                  {(post.reach != null || post.likes != null) && (
                    <div className="text-right text-xs text-slate-500">
                      {post.reach != null && <div>reach {post.reach}</div>}
                      {post.likes != null && <div>{post.likes} likes</div>}
                      {post.shares != null && <div>{post.shares} shares</div>}
                    </div>
                  )}
                  <Link href={`/admin/social/${post.id}/preview`}>
                    <Button variant="outline" size="sm">Preview</Button>
                  </Link>
                </div>
              </div>
            ))}
          </CardContent>
        </Card>
      )}

    </div>
  )
}
