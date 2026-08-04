'use client'

import { useState, useEffect, useCallback } from 'react'
import {
  Sparkles,
  Search,
  RefreshCw,
  CheckCircle2,
  XCircle,
  Clock,
  Cpu,
  DollarSign,
  Layers,
  Eye,
  Copy,
  Check,
  ChevronLeft,
  ChevronRight,
  ExternalLink,
  Image as ImageIcon,
  Video as VideoIcon,
  Calendar
} from 'lucide-react'
import Link from 'next/link'

import { Card, CardContent, CardHeader } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Badge } from '@/components/ui/badge'
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle
} from '@/components/ui/dialog'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue
} from '@/components/ui/select'
import type { AiPromptLogItem, AiPromptLogsStats } from '@/types/ai-prompt-logs-admin.types'

export function AdminAiPromptLogsClient() {
  const [loading, setLoading] = useState(true)
  const [items, setItems] = useState<AiPromptLogItem[]>([])
  const [stats, setStats] = useState<AiPromptLogsStats>({
    total_prompts: 0,
    total_tokens: 0,
    total_input_tokens: 0,
    total_output_tokens: 0,
    total_cost_usd: 0,
    avg_duration_ms: 0,
    success_rate_pct: 0
  })
  const [page, setPage] = useState(1)
  const [totalPages, setTotalPages] = useState(1)
  const [totalItems, setTotalItems] = useState(0)

  // Filters
  const [q, setQ] = useState('')
  const [source, setSource] = useState('all')
  const [model, setModel] = useState('all')
  const [status, setStatus] = useState('all')
  const [fromDate, setFromDate] = useState('')
  const [toDate, setToDate] = useState('')

  // Selected item for detail modal
  const [selectedLog, setSelectedLog] = useState<AiPromptLogItem | null>(null)
  const [isDetailOpen, setIsDetailOpen] = useState(false)
  const [copiedField, setCopiedField] = useState<string | null>(null)

  const fetchLogs = useCallback(async () => {
    try {
      setLoading(true)
      const params = new URLSearchParams()
      params.set('page', page.toString())
      params.set('limit', '25')
      if (q) params.set('q', q)
      if (source && source !== 'all') params.set('source', source)
      if (model && model !== 'all') params.set('model', model)
      if (status && status !== 'all') params.set('status', status)
      if (fromDate) params.set('from', fromDate)
      if (toDate) params.set('to', toDate)

      const res = await fetch(`/api/v1/admin/ai-prompt-logs?${params.toString()}`)
      const json = await res.json()

      if (json.success && json.data) {
        setItems(json.data.items)
        setStats(json.data.stats)
        if (json.data.meta) {
          setTotalPages(json.data.meta.totalPages)
          setTotalItems(json.data.meta.total)
        }
      }
    } catch (err) {
      console.error('Failed to load AI prompt logs', err)
    } finally {
      setLoading(false)
    }
  }, [page, q, source, model, status, fromDate, toDate])

  useEffect(() => {
    fetchLogs()
  }, [fetchLogs])

  const handleCopy = (text: string, fieldKey: string) => {
    navigator.clipboard.writeText(text)
    setCopiedField(fieldKey)
    setTimeout(() => setCopiedField(null), 2000)
  }

  const formatCost = (costStr: string | null) => {
    if (!costStr) return '$0.0000'
    const num = parseFloat(costStr)
    if (isNaN(num)) return '$0.0000'
    return `$${num < 0.0001 ? num.toFixed(6) : num.toFixed(4)}`
  }

  const getSourceIntent = (src: string): 'default' | 'success' | 'warning' | 'error' | 'brand' => {
    switch (src) {
      case 'enrichment':
        return 'brand'
      case 'translation':
        return 'default'
      case 'social':
        return 'warning'
      case 'blog':
        return 'brand'
      case 'image':
      case 'video':
        return 'success'
      default:
        return 'default'
    }
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h1 className="text-2xl font-bold tracking-tight text-foreground flex items-center gap-2">
            <Sparkles className="h-6 w-6 text-primary" />
            AI Prompts & Execution Logs
          </h1>
          <p className="text-sm text-muted-foreground">
            Detailed telemetry of LLM prompts, input/output tokens, model responses, media generation, and costs.
          </p>
        </div>
        <div className="flex items-center gap-2">
          <Button variant="outline" size="sm" onClick={() => fetchLogs()} disabled={loading}>
            <RefreshCw className={`h-4 w-4 mr-2 ${loading ? 'animate-spin' : ''}`} />
            Refresh
          </Button>
        </div>
      </div>

      {/* KPI Stats Cards */}
      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4">
        <Card className="rounded-2xl border bg-card">
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <div className="text-sm font-medium text-muted-foreground">Total AI Requests</div>
            <Layers className="h-4 w-4 text-primary" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{stats.total_prompts.toLocaleString()}</div>
            <p className="text-xs text-muted-foreground mt-1">
              Success rate: <span className="font-semibold text-emerald-600">{stats.success_rate_pct}%</span>
            </p>
          </CardContent>
        </Card>

        <Card className="rounded-2xl border bg-card">
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <div className="text-sm font-medium text-muted-foreground">Token Breakdown (In / Out)</div>
            <Cpu className="h-4 w-4 text-blue-500" />
          </CardHeader>
          <CardContent>
            <div className="text-xl font-bold font-mono">
              {stats.total_tokens.toLocaleString()}
            </div>
            <div className="text-xs text-muted-foreground mt-1 flex gap-2">
              <span className="text-blue-600 font-medium">In: {stats.total_input_tokens.toLocaleString()}</span>
              <span>•</span>
              <span className="text-purple-600 font-medium">Out: {stats.total_output_tokens.toLocaleString()}</span>
            </div>
          </CardContent>
        </Card>

        <Card className="rounded-2xl border bg-card">
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <div className="text-sm font-medium text-muted-foreground">Total Cost (USD)</div>
            <DollarSign className="h-4 w-4 text-emerald-500" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold font-mono">${stats.total_cost_usd.toFixed(4)}</div>
            <p className="text-xs text-muted-foreground mt-1">Accumulated API expense</p>
          </CardContent>
        </Card>

        <Card className="rounded-2xl border bg-card">
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <div className="text-sm font-medium text-muted-foreground">Avg Latency & Status</div>
            <Clock className="h-4 w-4 text-purple-500" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{stats.avg_duration_ms} ms</div>
            <p className="text-xs text-muted-foreground mt-1">
              Health: <span className="font-semibold text-emerald-600">{stats.success_rate_pct >= 95 ? 'Optimal' : 'Needs Review'}</span>
            </p>
          </CardContent>
        </Card>
      </div>

      {/* Filters Bar with Date-wise filtering */}
      <Card className="rounded-2xl border bg-card p-4">
        <div className="grid grid-cols-1 gap-3 sm:grid-cols-2 lg:grid-cols-6">
          <div className="relative lg:col-span-1">
            <Search className="absolute left-3 top-2.5 h-4 w-4 text-muted-foreground" />
            <Input
              placeholder="Search prompt..."
              value={q}
              onChange={(e) => {
                setQ(e.target.value)
                setPage(1)
              }}
              className="pl-9"
            />
          </div>

          <Select
            value={source}
            onValueChange={(val) => {
              setSource(val)
              setPage(1)
            }}
          >
            <SelectTrigger>
              <SelectValue placeholder="All Sources" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All Sources</SelectItem>
              <SelectItem value="enrichment">Enrichment</SelectItem>
              <SelectItem value="translation">Translation</SelectItem>
              <SelectItem value="social">Social Media</SelectItem>
              <SelectItem value="blog">Blog Articles</SelectItem>
              <SelectItem value="image">Image Generation</SelectItem>
              <SelectItem value="video">Video Generation</SelectItem>
            </SelectContent>
          </Select>

          <Select
            value={model}
            onValueChange={(val) => {
              setModel(val)
              setPage(1)
            }}
          >
            <SelectTrigger>
              <SelectValue placeholder="All Models" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All Models</SelectItem>
              <SelectItem value="gemini-3.6-flash">gemini-3.6-flash</SelectItem>
              <SelectItem value="gemini-3.1-flash-image">gemini-3.1-flash-image</SelectItem>
              <SelectItem value="gemini-omni-flash-preview">gemini-omni-flash-preview</SelectItem>
              <SelectItem value="gpt-4o">gpt-4o</SelectItem>
            </SelectContent>
          </Select>

          <Select
            value={status}
            onValueChange={(val) => {
              setStatus(val)
              setPage(1)
            }}
          >
            <SelectTrigger>
              <SelectValue placeholder="All Statuses" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All Statuses</SelectItem>
              <SelectItem value="success">Success</SelectItem>
              <SelectItem value="error">Error</SelectItem>
            </SelectContent>
          </Select>

          {/* Date Wise Filters */}
          <div className="flex items-center gap-1">
            <Calendar className="h-4 w-4 text-muted-foreground shrink-0" />
            <Input
              type="date"
              value={fromDate}
              onChange={(e) => {
                setFromDate(e.target.value)
                setPage(1)
              }}
              className="text-xs"
              title="From Date"
            />
          </div>

          <div className="flex items-center gap-2">
            <Input
              type="date"
              value={toDate}
              onChange={(e) => {
                setToDate(e.target.value)
                setPage(1)
              }}
              className="text-xs"
              title="To Date"
            />
            <Button
              variant="outline"
              size="sm"
              onClick={() => {
                setQ('')
                setSource('all')
                setModel('all')
                setStatus('all')
                setFromDate('')
                setToDate('')
                setPage(1)
              }}
              className="shrink-0 text-xs px-2"
              title="Reset all filters"
            >
              Reset
            </Button>
          </div>
        </div>
      </Card>

      {/* Main Table */}
      <Card className="rounded-2xl border bg-card overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-left text-sm">
            <thead className="bg-muted/50 border-b text-xs font-semibold uppercase tracking-wider text-muted-foreground">
              <tr>
                <th className="px-4 py-3">ID / Time</th>
                <th className="px-4 py-3">Source & Fabric</th>
                <th className="px-4 py-3">Model</th>
                <th className="px-4 py-3">Prompt Preview</th>
                <th className="px-4 py-3 text-right">Tokens (In / Out)</th>
                <th className="px-4 py-3 text-right">Cost ($)</th>
                <th className="px-4 py-3 text-right">Duration</th>
                <th className="px-4 py-3 text-center">Status</th>
                <th className="px-4 py-3 text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y">
              {loading ? (
                <tr>
                  <td colSpan={9} className="px-4 py-8 text-center text-muted-foreground">
                    <RefreshCw className="h-6 w-6 animate-spin mx-auto mb-2" />
                    Loading AI prompt logs...
                  </td>
                </tr>
              ) : items.length === 0 ? (
                <tr>
                  <td colSpan={9} className="px-4 py-12 text-center text-muted-foreground">
                    <Sparkles className="h-8 w-8 mx-auto mb-2 opacity-40" />
                    No AI prompt logs found matching your criteria.
                  </td>
                </tr>
              ) : (
                items.map((log) => (
                  <tr key={log.id} className="hover:bg-muted/30 transition-colors">
                    <td className="px-4 py-3">
                      <div className="font-medium">#{log.id}</div>
                      <div className="text-xs text-muted-foreground">
                        {new Date(log.created_at).toLocaleString()}
                      </div>
                    </td>
                    <td className="px-4 py-3 space-y-1">
                      <Badge intent={getSourceIntent(log.source)}>
                        {log.source}
                      </Badge>
                      {log.fabric_id ? (
                        <div>
                          <Link
                            href={`/admin/fabrics/${log.fabric_id}`}
                            className="text-xs font-semibold text-primary hover:underline inline-flex items-center gap-1 mt-0.5"
                          >
                            Fabric #{log.fabric_id} {log.fabric_title ? `— ${log.fabric_title.slice(0, 20)}...` : ''}
                            <ExternalLink className="h-3 w-3" />
                          </Link>
                        </div>
                      ) : (
                        <div className="text-[11px] text-muted-foreground">Global / System</div>
                      )}
                    </td>
                    <td className="px-4 py-3 font-mono text-xs font-semibold">{log.model}</td>
                    <td className="px-4 py-3 max-w-xs truncate text-muted-foreground" title={log.prompt}>
                      {log.prompt}
                    </td>
                    <td className="px-4 py-3 text-right font-mono text-xs">
                      <div>{log.total_token_count ? log.total_token_count.toLocaleString() : '—'}</div>
                      <div className="text-[11px] text-muted-foreground">
                        In: {log.prompt_token_count ?? 0} / Out: {log.candidates_token_count ?? 0}
                      </div>
                    </td>
                    <td className="px-4 py-3 text-right font-mono text-xs font-semibold text-emerald-600">
                      {formatCost(log.cost_usd)}
                    </td>
                    <td className="px-4 py-3 text-right font-mono text-xs">
                      {log.duration_ms ? `${log.duration_ms} ms` : '—'}
                    </td>
                    <td className="px-4 py-3 text-center">
                      {log.status === 'success' ? (
                        <Badge intent="success">
                          <CheckCircle2 className="h-3 w-3 mr-1 inline" /> Success
                        </Badge>
                      ) : (
                        <Badge intent="error">
                          <XCircle className="h-3 w-3 mr-1 inline" /> Error
                        </Badge>
                      )}
                    </td>
                    <td className="px-4 py-3 text-right">
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => {
                          setSelectedLog(log)
                          setIsDetailOpen(true)
                        }}
                      >
                        <Eye className="h-4 w-4 mr-1" /> View
                      </Button>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>

        {/* Pagination with explicit page numbers */}
        <div className="flex flex-col gap-3 sm:flex-row items-center justify-between border-t px-4 py-3">
          <div className="text-xs text-muted-foreground">
            Showing page <span className="font-semibold">{page}</span> of <span className="font-semibold">{totalPages}</span> ({totalItems} total logs)
          </div>
          <div className="flex items-center gap-1 flex-wrap">
            <Button
              variant="outline"
              size="sm"
              disabled={page <= 1 || loading}
              onClick={() => setPage((p) => Math.max(1, p - 1))}
            >
              <ChevronLeft className="h-4 w-4 mr-1" /> Prev
            </Button>

            {Array.from({ length: totalPages }, (_, i) => i + 1)
              .filter((p) => p === 1 || p === totalPages || Math.abs(p - page) <= 2)
              .map((p, idx, arr) => {
                const showEllipsisBefore = idx > 0 && p - arr[idx - 1]! > 1
                return (
                  <span key={p} className="flex items-center">
                    {showEllipsisBefore && <span className="px-1 text-muted-foreground text-xs">...</span>}
                    <Button
                      variant={page === p ? 'default' : 'outline'}
                      size="sm"
                      className="h-8 w-8 p-0 text-xs font-mono"
                      onClick={() => setPage(p)}
                    >
                      {p}
                    </Button>
                  </span>
                )
              })}

            <Button
              variant="outline"
              size="sm"
              disabled={page >= totalPages || loading}
              onClick={() => setPage((p) => Math.min(totalPages, p + 1))}
            >
              Next <ChevronRight className="h-4 w-4 ml-1" />
            </Button>
          </div>
        </div>
      </Card>

      {/* Detail Dialog */}
      <Dialog open={isDetailOpen} onOpenChange={setIsDetailOpen}>
        <DialogContent className="max-w-4xl max-h-[85vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2 text-xl">
              <Sparkles className="h-5 w-5 text-primary" />
              AI Prompt Execution #{selectedLog?.id}
            </DialogTitle>
            <DialogDescription>
              Executed on {selectedLog ? new Date(selectedLog.created_at).toLocaleString() : ''} via source{' '}
              <span className="font-semibold text-foreground">{selectedLog?.source}</span> using model{' '}
              <span className="font-mono font-semibold text-foreground">{selectedLog?.model}</span>
            </DialogDescription>
          </DialogHeader>

          {selectedLog && (
            <div className="space-y-6 pt-2">
              {/* Meta Grid */}
              <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 bg-muted/40 p-4 rounded-xl text-xs">
                <div>
                  <span className="text-muted-foreground block">Status</span>
                  <span className="font-semibold capitalize text-foreground">{selectedLog.status}</span>
                </div>
                <div>
                  <span className="text-muted-foreground block">Duration</span>
                  <span className="font-mono font-semibold text-foreground">{selectedLog.duration_ms ?? 0} ms</span>
                </div>
                <div>
                  <span className="text-muted-foreground block">Cost (USD)</span>
                  <span className="font-mono font-semibold text-emerald-600">{formatCost(selectedLog.cost_usd)}</span>
                </div>
                <div>
                  <span className="text-muted-foreground block">Tokens (In / Out)</span>
                  <span className="font-mono font-semibold text-foreground">
                    {selectedLog.total_token_count?.toLocaleString() ?? 0} <br />
                    <span className="text-[11px] text-muted-foreground">
                      In: {selectedLog.prompt_token_count ?? 0} | Out: {selectedLog.candidates_token_count ?? 0}
                    </span>
                  </span>
                </div>
              </div>

              {/* Fabric / Actor info if present */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 text-xs bg-card border p-3 rounded-xl">
                <div>
                  <span className="text-muted-foreground block">Associated Fabric:</span>
                  {selectedLog.fabric_id ? (
                    <Link
                      href={`/admin/fabrics/${selectedLog.fabric_id}`}
                      className="font-semibold text-primary hover:underline inline-flex items-center gap-1 mt-1"
                    >
                      Fabric #{selectedLog.fabric_id} {selectedLog.fabric_title ? `(${selectedLog.fabric_title})` : ''}
                      <ExternalLink className="h-3 w-3" />
                    </Link>
                  ) : (
                    <span className="font-medium text-muted-foreground">Global / System level prompt</span>
                  )}
                </div>
                <div>
                  <span className="text-muted-foreground block">Triggered By Actor:</span>
                  <span className="font-semibold text-foreground">
                    {selectedLog.actor_name ? `${selectedLog.actor_name} (${selectedLog.actor_email})` : 'System / Background Worker'}
                  </span>
                </div>
              </div>

              {/* Media Generation Info (Image / Video) */}
              {(selectedLog.image_count || selectedLog.video_count) && (
                <div className="bg-emerald-500/10 border border-emerald-500/20 text-emerald-700 p-3 rounded-xl text-xs flex items-center gap-2">
                  {selectedLog.image_count ? (
                    <span className="inline-flex items-center gap-1 font-semibold">
                      <ImageIcon className="h-4 w-4" /> Generated {selectedLog.image_count} Image(s) successfully
                    </span>
                  ) : null}
                  {selectedLog.video_count ? (
                    <span className="inline-flex items-center gap-1 font-semibold">
                      <VideoIcon className="h-4 w-4" /> Generated {selectedLog.video_count} Video(s) successfully
                    </span>
                  ) : null}
                </div>
              )}

              {/* Error Message if any */}
              {selectedLog.error_message && (
                <div className="bg-destructive/10 border border-destructive/20 text-destructive p-3 rounded-xl text-sm">
                  <span className="font-bold block mb-1">Error Encountered:</span>
                  <p className="font-mono text-xs whitespace-pre-wrap">{selectedLog.error_message}</p>
                </div>
              )}

              {/* System Prompt */}
              {selectedLog.system_prompt && (
                <div className="space-y-1.5">
                  <div className="flex items-center justify-between text-xs font-semibold text-muted-foreground">
                    <span>SYSTEM PROMPT</span>
                    <Button
                      variant="ghost"
                      size="sm"
                      className="h-7 text-xs"
                      onClick={() => handleCopy(selectedLog.system_prompt || '', 'system_prompt')}
                    >
                      {copiedField === 'system_prompt' ? (
                        <>
                          <Check className="h-3 w-3 mr-1 text-emerald-600" /> Copied
                        </>
                      ) : (
                        <>
                          <Copy className="h-3 w-3 mr-1" /> Copy
                        </>
                      )}
                    </Button>
                  </div>
                  <pre className="p-3 bg-muted/60 rounded-xl font-mono text-xs overflow-x-auto max-h-40 whitespace-pre-wrap">
                    {selectedLog.system_prompt}
                  </pre>
                </div>
              )}

              {/* User Prompt */}
              <div className="space-y-1.5">
                <div className="flex items-center justify-between text-xs font-semibold text-muted-foreground">
                  <span>PROMPT / USER INPUT</span>
                  <Button
                    variant="ghost"
                    size="sm"
                    className="h-7 text-xs"
                    onClick={() => handleCopy(selectedLog.prompt, 'prompt')}
                  >
                    {copiedField === 'prompt' ? (
                      <>
                        <Check className="h-3 w-3 mr-1 text-emerald-600" /> Copied
                      </>
                    ) : (
                      <>
                        <Copy className="h-3 w-3 mr-1" /> Copy
                      </>
                    )}
                  </Button>
                </div>
                <pre className="p-3 bg-muted/60 rounded-xl font-mono text-xs overflow-x-auto max-h-60 whitespace-pre-wrap">
                  {selectedLog.prompt}
                </pre>
              </div>

              {/* Response Text / Output */}
              <div className="space-y-1.5">
                <div className="flex items-center justify-between text-xs font-semibold text-muted-foreground">
                  <span>MODEL RESPONSE / GENERATED OUTPUT</span>
                  <Button
                    variant="ghost"
                    size="sm"
                    className="h-7 text-xs"
                    onClick={() => handleCopy(selectedLog.response_text || '', 'response_text')}
                  >
                    {copiedField === 'response_text' ? (
                      <>
                        <Check className="h-3 w-3 mr-1 text-emerald-600" /> Copied
                      </>
                    ) : (
                      <>
                        <Copy className="h-3 w-3 mr-1" /> Copy
                      </>
                    )}
                  </Button>
                </div>
                <pre className="p-3 bg-muted/60 rounded-xl font-mono text-xs overflow-x-auto max-h-80 whitespace-pre-wrap">
                  {selectedLog.response_text ||
                    (selectedLog.image_count
                      ? `[Image generation output: ${selectedLog.image_count} image(s) generated successfully]`
                      : selectedLog.video_count
                      ? `[Video generation output: ${selectedLog.video_count} video(s) generated successfully]`
                      : '(No response text recorded)')}
                </pre>
              </div>
            </div>
          )}
        </DialogContent>
      </Dialog>
    </div>
  )
}
