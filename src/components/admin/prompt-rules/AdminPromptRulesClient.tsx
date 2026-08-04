'use client'

import { useState } from 'react'
import { usePathname, useRouter } from 'next/navigation'
import { PromptRuleFormPage } from './PromptRuleFormPage'
import { ImportPage } from './ImportPage'
import { ImageRulesSection } from './ImageRulesSection'
import { TextRulesSection } from './TextRulesSection'

export function AdminPromptRulesClient() {
  const pathname = usePathname()
  const router = useRouter()

  const isNewPage = pathname.endsWith('/new')
  const isImportPage = pathname.endsWith('/import')
  const isEditPage = pathname.includes('/prompt-rules/') && !isNewPage && !isImportPage
  const editId = isEditPage ? Number(pathname.split('/').pop()) : null

  if (isNewPage) return <PromptRuleFormPage onClose={() => router.push('/admin/prompt-rules')} />
  if (isImportPage) return <ImportPage onClose={() => router.push('/admin/prompt-rules')} />
  if (isEditPage && editId) return <PromptRuleFormPage ruleId={editId} onClose={() => router.push('/admin/prompt-rules')} />
  return <RulesListPage />
}

function RulesListPage() {
  const [activeTab, setActiveTab] = useState<'image' | 'text'>('image')

  return (
    <div className="space-y-6">
      {/* Tab Switcher */}
      <div className="flex gap-1 rounded-lg bg-surface-container-low p-1">
        <button
          onClick={() => setActiveTab('image')}
          className={`flex-1 rounded-md px-4 py-2 text-sm font-medium transition-all ${activeTab === 'image'
            ? 'bg-surface font-semibold text-primary shadow-sm'
            : 'text-on-surface-variant hover:text-on-surface'
          }`}
        >
          Image & Video Rules
        </button>
        <button
          onClick={() => setActiveTab('text')}
          className={`flex-1 rounded-md px-4 py-2 text-sm font-medium transition-all ${activeTab === 'text'
            ? 'bg-surface font-semibold text-primary shadow-sm'
            : 'text-on-surface-variant hover:text-on-surface'
          }`}
        >
          Text Prompt Rules
        </button>
      </div>

      {activeTab === 'image' && <ImageRulesSection />}
      {activeTab === 'text' && <TextRulesSection />}
    </div>
  )
}
