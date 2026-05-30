'use client'

import { useState } from 'react'
import { Sparkles, ExternalLink } from 'lucide-react'
import { daysUntil, formatCurrency, type Scholarship } from '@/lib/finance-utils'

type StudentProfile = {
  major: string | null
  year_of_study: number | null
  gpa: number | null
}

async function fetchMatches(
  profile: StudentProfile,
  scholarships: Scholarship[],
): Promise<string[]> {
  const res = await fetch('/api/ai', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      action: 'scholarship_matcher',
      profile,
      scholarships: scholarships.map((s) => ({
        id: s.id,
        title: s.title,
        min_gpa: s.min_gpa,
        tags: s.tags,
        amount: s.amount,
      })),
    }),
  })
  if (!res.ok) throw new Error('Matching failed')
  const data = await res.json()
  return (data.matches ?? []) as string[]
}

function deadlineLabel(days: number): { text: string; color: string } {
  if (days < 0) return { text: 'Closed', color: 'text-muted-foreground' }
  if (days === 0) return { text: 'Due today', color: 'text-destructive' }
  if (days <= 7) return { text: `${days}d left`, color: 'text-destructive' }
  if (days <= 14) return { text: `${days}d left`, color: 'text-amber-500' }
  return {
    text: new Date(
      new Date().setDate(new Date().getDate() + days),
    ).toLocaleDateString('en-US', { month: 'short', day: 'numeric' }),
    color: 'text-muted-foreground',
  }
}

export function ScholarshipList({
  scholarships,
  studentProfile,
}: {
  scholarships: Scholarship[]
  studentProfile: StudentProfile
}) {
  const [matchedIds, setMatchedIds] = useState<string[] | null>(null)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)

  async function handleMatch() {
    setLoading(true)
    setError(null)
    try {
      const ids = await fetchMatches(studentProfile, scholarships)
      setMatchedIds(ids)
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Matching failed')
    } finally {
      setLoading(false)
    }
  }

  const sorted = matchedIds
    ? [
        ...matchedIds
          .map((id) => scholarships.find((s) => s.id === id))
          .filter((s): s is Scholarship => !!s),
        ...scholarships.filter((s) => !matchedIds.includes(s.id)),
      ]
    : scholarships

  return (
    <div className="space-y-4">
      {!matchedIds && (
        <div className="border border-dashed border-finance/30 rounded-xl p-5 flex flex-col items-center gap-3 bg-finance/5">
          <Sparkles size={18} className="text-finance" />
          <p className="text-sm text-center text-muted-foreground max-w-xs">
            Claude will rank scholarships by how well they match your major,
            GPA, and study year.
          </p>
          <button
            onClick={handleMatch}
            disabled={loading}
            className="px-4 py-2 rounded-lg bg-finance text-white text-sm font-medium hover:opacity-90 disabled:opacity-50 transition-opacity flex items-center gap-2"
          >
            <Sparkles size={14} />
            {loading ? 'Finding matches…' : 'Find my matches'}
          </button>
          {error && <p className="text-sm text-destructive">{error}</p>}
        </div>
      )}

      {matchedIds && (
        <div className="flex items-center justify-between">
          <p className="text-sm text-finance font-medium">
            ✦ Showing top {Math.min(matchedIds.length, 5)} matches first
          </p>
          <button
            onClick={() => setMatchedIds(null)}
            className="text-xs text-muted-foreground hover:underline"
          >
            Clear
          </button>
        </div>
      )}

      <div className="space-y-3">
        {sorted.map((s, idx) => {
          const days = daysUntil(s.deadline)
          const { text: deadlineText, color: deadlineColor } = deadlineLabel(days)
          const isTopMatch = matchedIds && idx < 5 && matchedIds.includes(s.id)

          return (
            <div
              key={s.id}
              className={`bg-card border rounded-xl p-4 ${
                isTopMatch ? 'border-finance/40' : 'border-border'
              }`}
            >
              <div className="flex items-start justify-between gap-3">
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2 flex-wrap">
                    <p className="font-semibold text-sm">{s.title}</p>
                    {isTopMatch && (
                      <span className="text-[10px] font-medium bg-finance/10 text-finance px-1.5 py-0.5 rounded-full">
                        Top match
                      </span>
                    )}
                  </div>
                  <p className="text-xs text-muted-foreground mt-0.5">
                    {s.provider}
                  </p>
                </div>
                <div className="text-right flex-shrink-0">
                  <p className="text-sm font-bold text-finance">
                    {formatCurrency(s.amount)}
                  </p>
                  <p className={`text-xs ${deadlineColor}`}>{deadlineText}</p>
                </div>
              </div>

              <div className="flex items-center justify-between mt-3">
                <div className="flex gap-1.5 flex-wrap">
                  {s.tags.slice(0, 3).map((tag) => (
                    <span
                      key={tag}
                      className="text-[10px] bg-muted text-muted-foreground px-2 py-0.5 rounded-full"
                    >
                      {tag}
                    </span>
                  ))}
                  {s.min_gpa !== null && (
                    <span className="text-[10px] bg-muted text-muted-foreground px-2 py-0.5 rounded-full">
                      GPA ≥ {s.min_gpa}
                    </span>
                  )}
                </div>
                {s.url && (
                  <a
                    href={s.url}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="flex items-center gap-1 text-xs text-finance hover:underline"
                  >
                    Apply <ExternalLink size={11} />
                  </a>
                )}
              </div>
            </div>
          )
        })}
      </div>
    </div>
  )
}
