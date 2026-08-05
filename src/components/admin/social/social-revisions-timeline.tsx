'use client'

import { useState } from 'react'
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { toast } from 'sonner'
import { History, RotateCcw, ChevronDown, ChevronUp } from 'lucide-react'

import { Button } from '@/components/ui/button'
import { Card, CardContent, CardHeader } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'

interface RevisionItem {
  id: number
  revisionNumber: number
  changeType: string
  snapshot: Record<string, unknown> | null
  before: Record<string, unknown> | null
  after: Record<string, unknown> | null
  changedByUserId: number | null
  createdAt: string
}

export function SocialRevisionsTimeline({ postId }: { postId: number }) {
  const queryClient = useQueryClient()
  const [expandedId, setExpandedId] = useState<number | null>(null)

  const { data, isLoading } = useQuery<{ id: number; revisions: RevisionItem[] }>({
    queryKey: ['social-revisions', postId],
    queryFn: async () => {
      const res = await fetch(`/api/v1/admin/social/${postId}/revisions`)
      const json = await res.json()
      if (!res.ok) throw new Error(json.error ?? 'Failed to load revisions')
      return json.data
    }
  })

  const restoreMutation = useMutation({
    mutationFn: async (revisionId: number) => {
      const res = await fetch(`/api/v1/admin/social/${postId}/restore`, {
        method: 'POST',
        headers: { 'content-type': 'application/json' },
        body: JSON.stringify({ revision_id: revisionId })
      })
      const json = await res.json()
      if (!res.ok) throw new Error(json.error ?? 'Failed to restore revision')
      return json.data
    },
    onSuccess: () => {
      toast.success('Version restored successfully')
      void queryClient.invalidateQueries({ queryKey: ['social-post', postId] })
      void queryClient.invalidateQueries({ queryKey: ['social-revisions', postId] })
    },
    onError: (err) => {
      toast.error(err instanceof Error ? err.message : 'Restore failed')
    }
  })

  const revisions = data?.revisions ?? []

  if (isLoading) {
    return <div className="text-xs text-slate-400">Loading version history...</div>
  }

  if (revisions.length === 0) {
    return <div className="text-xs text-slate-400">No version history recorded yet.</div>
  }

  return (
    <Card className="mt-6">
      <CardHeader className="flex flex-row items-center justify-between pb-3">
        <div className="flex items-center gap-2">
          <History className="h-4 w-4 text-slate-500" />
          <h3 className="text-sm font-semibold text-slate-900">Revision History ({revisions.length})</h3>
        </div>
      </CardHeader>
      <CardContent className="space-y-3">
        {revisions.map((rev) => {
          const isExpanded = expandedId === rev.id
          const snap = (rev.snapshot ?? {}) as Record<string, unknown>
          return (
            <div key={rev.id} className="rounded-lg border border-slate-200 bg-slate-50/50 p-3 text-xs">
              <div className="flex flex-wrap items-center justify-between gap-2">
                <div className="flex items-center gap-2">
                  <Badge intent="default" className="font-mono text-[10px]">rev {rev.revisionNumber}</Badge>
                  <span className="font-medium text-slate-800">{rev.changeType}</span>
                  <span className="text-slate-400">{new Date(rev.createdAt).toLocaleString()}</span>
                </div>
                <div className="flex items-center gap-2">
                  <Button
                    variant="ghost"
                    size="sm"
                    className="h-7 text-xs"
                    onClick={() => setExpandedId(isExpanded ? null : rev.id)}
                  >
                    {isExpanded ? <ChevronUp className="h-3.5 w-3.5" /> : <ChevronDown className="h-3.5 w-3.5" />}
                    {isExpanded ? 'Hide snapshot' : 'View snapshot'}
                  </Button>
                  <Button
                    variant="outline"
                    size="sm"
                    className="h-7 gap-1 text-xs text-brand-700 hover:bg-brand-50"
                    onClick={() => restoreMutation.mutate(rev.id)}
                    disabled={restoreMutation.isPending}
                  >
                    <RotateCcw className="h-3 w-3" /> Restore
                  </Button>
                </div>
              </div>

              {isExpanded && (
                <div className="mt-3 space-y-2 border-t border-slate-200 pt-3">
                  {snap.caption ? (
                    <div>
                      <span className="font-semibold text-slate-700">Caption:</span>
                      <p className="mt-0.5 text-slate-600 whitespace-pre-wrap">{String(snap.caption)}</p>
                    </div>
                  ) : null}
                  {Array.isArray(snap.hashtags) && snap.hashtags.length > 0 && (
                    <div>
                      <span className="font-semibold text-slate-700">Hashtags:</span>
                      <p className="mt-0.5 text-slate-600">{(snap.hashtags as string[]).join(' ')}</p>
                    </div>
                  )}
                  {snap.script ? (
                    <div>
                      <span className="font-semibold text-slate-700">Script:</span>
                      <p className="mt-0.5 text-slate-600 whitespace-pre-wrap">{String(snap.script)}</p>
                    </div>
                  ) : null}
                </div>
              )}
            </div>
          )
        })}
      </CardContent>
    </Card>
  )
}
