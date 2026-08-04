'use client'

import { useState } from 'react'
import { Button } from '@/components/ui/button'
import { Card, CardContent } from '@/components/ui/card'
import { Textarea } from '@/components/ui/textarea'
import { api } from './prompt-rules-helpers'

export function ImportPage({ onClose }: { onClose: () => void }) {
  const [jsonText, setJsonText] = useState('')
  const [importing, setImporting] = useState(false)
  const [result, setResult] = useState<string | null>(null)

  const handleImport = async () => {
    setImporting(true)
    let parsed: unknown
    try {
      parsed = JSON.parse(jsonText)
    } catch {
      alert('Invalid JSON format')
      setImporting(false)
      return
    }
    const res = await api<{ imported: number }>('/api/v1/admin/prompt-rules/import', {
      method: 'POST',
      body: JSON.stringify(parsed)
    })
    setImporting(false)
    if (res.error) {
      setResult(`Error: ${res.error}`)
      return
    }
    setResult(`Successfully imported ${res.data?.imported ?? 0} rule(s)`)
  }

  return (
    <div className="space-y-6 max-w-3xl">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="font-heading text-heading-xl font-extrabold tracking-tight">Import Prompt Rules</h1>
          <p className="mt-2 text-sm text-on-surface-variant">Paste a JSON array of rules</p>
        </div>
        <div className="flex gap-2">
          <Button variant="outline" onClick={onClose}>
            Back
          </Button>
          <Button onClick={handleImport} disabled={importing || !jsonText.trim()}>
            {importing ? 'Importing...' : 'Import'}
          </Button>
        </div>
      </div>

      <div className="space-y-2">
        <label className="text-sm font-medium">JSON Rules</label>
        <Textarea
          value={jsonText}
          onChange={(e) => setJsonText(e.target.value)}
          rows={16}
          placeholder='{"rules": [{"name": "...", ...}]}'
          className="font-mono text-sm"
        />
      </div>

      {result && (
        <Card>
          <CardContent className="py-4">
            <p className="text-sm">{result}</p>
          </CardContent>
        </Card>
      )}
    </div>
  )
}
