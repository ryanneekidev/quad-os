'use client'

import { useState } from 'react'
import { TrendingUp } from 'lucide-react'
import { computeCourseGrade, percentToGPA, gradeColor, type Assignment } from '@/lib/academic-utils'

export function GradeTracker({ assignments }: { assignments: Assignment[] }) {
  const graded = assignments.filter(a => a.status === 'graded' && a.score !== null)
  const pending = assignments.filter(a => a.status !== 'graded')

  const [hypothetical, setHypothetical] = useState<Record<string, number>>(
    Object.fromEntries(pending.map(a => [a.id, 75]))
  )

  const currentGrade = computeCourseGrade(assignments)

  function computeProjected(): number | null {
    const all = [
      ...graded.map(a => ({ score: a.score!, weight: a.weight })),
      ...pending.map(a => ({ score: hypothetical[a.id] ?? 75, weight: a.weight })),
    ]
    const totalWeight = all.reduce((s, a) => s + a.weight, 0)
    if (totalWeight === 0) return null
    return all.reduce((s, a) => s + a.score * a.weight, 0) / totalWeight
  }

  const projected = computeProjected()

  if (assignments.length === 0) {
    return (
      <div className="bg-card border border-border rounded-xl p-5">
        <div className="flex items-center gap-2 mb-2">
          <TrendingUp size={18} className="text-academic" />
          <h2 className="text-lg font-semibold">Grade Tracker</h2>
        </div>
        <p className="text-sm text-muted-foreground">Add assignments to start tracking your grade.</p>
      </div>
    )
  }

  return (
    <div className="bg-card border border-border rounded-xl p-5 space-y-5">
      <div className="flex items-center gap-2">
        <TrendingUp size={18} className="text-academic" />
        <h2 className="text-lg font-semibold">Grade Tracker</h2>
      </div>

      <div className="flex gap-8">
        <div>
          <p className="text-xs text-muted-foreground uppercase tracking-wide mb-1">Current</p>
          {currentGrade !== null ? (
            <>
              <p className={`text-3xl font-bold ${gradeColor(currentGrade)}`}>
                {currentGrade.toFixed(1)}%
              </p>
              <p className="text-sm text-muted-foreground mt-0.5">
                GPA {percentToGPA(currentGrade).toFixed(1)}
              </p>
            </>
          ) : (
            <p className="text-3xl font-bold text-muted-foreground">—</p>
          )}
        </div>

        {pending.length > 0 && projected !== null && (
          <div>
            <p className="text-xs text-muted-foreground uppercase tracking-wide mb-1">Projected</p>
            <p className={`text-3xl font-bold ${gradeColor(projected)}`}>
              {projected.toFixed(1)}%
            </p>
            <p className="text-sm text-muted-foreground mt-0.5">
              GPA {percentToGPA(projected).toFixed(1)}
            </p>
          </div>
        )}
      </div>

      {pending.length > 0 && (
        <div className="space-y-4 pt-1">
          <p className="text-sm font-medium text-muted-foreground">What-if scenarios</p>
          {pending.map(a => (
            <div key={a.id} className="space-y-1.5">
              <div className="flex items-center justify-between text-sm">
                <span className="truncate max-w-xs text-foreground">{a.title}</span>
                <span className="font-semibold tabular-nums ml-4">
                  {hypothetical[a.id] ?? 75}%
                </span>
              </div>
              <input
                type="range" min={0} max={100}
                value={hypothetical[a.id] ?? 75}
                onChange={e =>
                  setHypothetical(prev => ({ ...prev, [a.id]: Number(e.target.value) }))
                }
                className="w-full accent-academic h-1.5"
              />
            </div>
          ))}
        </div>
      )}
    </div>
  )
}
