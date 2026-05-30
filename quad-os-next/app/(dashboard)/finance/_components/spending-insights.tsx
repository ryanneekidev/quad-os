'use client'

import { useState } from 'react'
import { Sparkles, ChevronDown, ChevronUp } from 'lucide-react'
import { analyzeSpending } from '@/lib/claude'
import type { Transaction } from '@/lib/finance-utils'

function renderMarkdown(text: string) {
  return text.split('\n').map((line, i) => {
    if (line.startsWith('- ') || line.startsWith('• ')) {
      return (
        <li key={i} className="ml-4 list-disc text-sm">
          {line.replace(/^[-•]\s/, '')}
        </li>
      )
    }
    if (line.startsWith('**') && line.endsWith('**')) {
      return (
        <p key={i} className="text-sm font-semibold mt-2">
          {line.replace(/\*\*/g, '')}
        </p>
      )
    }
    if (line.trim() === '') return <div key={i} className="h-1" />
    return (
      <p key={i} className="text-sm">
        {line.replace(/\*\*(.+?)\*\*/g, '$1')}
      </p>
    )
  })
}

export function SpendingInsights({
  transactions,
}: {
  transactions: Transaction[]
}) {
  const [analysis, setAnalysis] = useState<string | null>(null)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [expanded, setExpanded] = useState(true)

  async function handleAnalyze() {
    setLoading(true)
    setError(null)
    try {
      const now = new Date()
      const cutoff = new Date(now.getFullYear(), now.getMonth() - 1, now.getDate())
        .toISOString()
        .split('T')[0]
      const recent = transactions.filter((t) => t.date >= cutoff)
      const result = await analyzeSpending(recent)
      setAnalysis(result)
      setExpanded(true)
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Failed to analyze')
    } finally {
      setLoading(false)
    }
  }

  return (
    <section>
      <div className="flex items-center justify-between mb-3">
        <h2 className="text-lg font-semibold">AI Spending Insights</h2>
        {analysis && (
          <button
            onClick={() => setExpanded((v) => !v)}
            className="text-muted-foreground hover:text-foreground"
          >
            {expanded ? <ChevronUp size={16} /> : <ChevronDown size={16} />}
          </button>
        )}
      </div>

      {!analysis ? (
        <div className="border border-dashed border-finance/30 rounded-xl p-5 flex flex-col items-center gap-3 bg-finance/5">
          <Sparkles size={20} className="text-finance" />
          <p className="text-sm text-center text-muted-foreground max-w-xs">
            Claude will analyze your last 30 days of spending and give you 3
            actionable tips.
          </p>
          <button
            onClick={handleAnalyze}
            disabled={loading || transactions.length === 0}
            className="px-4 py-2 rounded-lg bg-finance text-white text-sm font-medium hover:opacity-90 disabled:opacity-50 transition-opacity flex items-center gap-2"
          >
            <Sparkles size={14} />
            {loading ? 'Analyzing…' : 'Analyze my spending'}
          </button>
          {transactions.length === 0 && (
            <p className="text-xs text-muted-foreground">
              Add some transactions first.
            </p>
          )}
          {error && <p className="text-sm text-destructive">{error}</p>}
        </div>
      ) : (
        <div className="border border-finance/20 rounded-xl bg-finance/5">
          <div className="flex items-center gap-2 px-4 pt-4 pb-2">
            <Sparkles size={15} className="text-finance flex-shrink-0" />
            <p className="text-xs font-medium text-finance uppercase tracking-wide">
              Claude's analysis
            </p>
          </div>
          {expanded && (
            <div className="px-4 pb-4 space-y-0.5">
              {renderMarkdown(analysis)}
            </div>
          )}
          <div className="px-4 pb-3 border-t border-finance/10 pt-2 flex justify-between items-center">
            <p className="text-xs text-muted-foreground">Based on your last 30 days</p>
            <button
              onClick={handleAnalyze}
              disabled={loading}
              className="text-xs text-finance hover:underline disabled:opacity-50"
            >
              {loading ? 'Refreshing…' : 'Refresh'}
            </button>
          </div>
        </div>
      )}
    </section>
  )
}
