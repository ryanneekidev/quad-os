'use client'

import { useState } from 'react'
import { Sparkles, Loader2, Calendar, Clock, BookOpen } from 'lucide-react'
import { generateStudyPlan, type PlanDay } from '@/lib/claude'

type Assignment = {
  course: string
  title: string
  due_date: string | null
  weight: number
  status: string
}

function formatDate(dateStr: string) {
  return new Date(dateStr + 'T00:00:00').toLocaleDateString('en-US', {
    weekday: 'long', month: 'short', day: 'numeric',
  })
}

function dayTotalHours(day: PlanDay) {
  return day.sessions.reduce((s, sess) => s + sess.hours, 0)
}

export function StudyPlanner({ assignments }: { assignments: Assignment[] }) {
  const [hoursPerDay, setHoursPerDay] = useState(4)
  const [loading, setLoading] = useState(false)
  const [plan, setPlan] = useState<PlanDay[] | null>(null)
  const [error, setError] = useState<string | null>(null)

  async function generate() {
    if (assignments.length === 0) return
    setLoading(true)
    setError(null)
    setPlan(null)
    try {
      const data = await generateStudyPlan(assignments, hoursPerDay)
      setPlan(data.plan)
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Something went wrong')
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="space-y-6">
      {/* Controls */}
      <div className="bg-card border border-border rounded-xl p-5 space-y-4">
        <div className="space-y-2">
          <div className="flex items-center justify-between text-sm">
            <label className="font-medium">Available hours per day</label>
            <span className="font-bold text-academic tabular-nums">{hoursPerDay}h</span>
          </div>
          <input
            type="range" min={1} max={12} value={hoursPerDay}
            onChange={e => setHoursPerDay(Number(e.target.value))}
            className="w-full accent-academic"
          />
          <div className="flex justify-between text-xs text-muted-foreground">
            <span>1h</span><span>12h</span>
          </div>
        </div>

        {assignments.length === 0 ? (
          <p className="text-sm text-muted-foreground text-center py-2">
            No pending assignments to plan. Add some from your courses first.
          </p>
        ) : (
          <button
            onClick={generate}
            disabled={loading}
            className="w-full flex items-center justify-center gap-2 py-2.5 rounded-lg bg-academic text-white text-sm font-medium hover:opacity-90 disabled:opacity-50 transition-opacity"
          >
            {loading
              ? <><Loader2 size={16} className="animate-spin" /> Generating…</>
              : <><Sparkles size={16} /> Generate plan</>
            }
          </button>
        )}
      </div>

      {/* Pending assignments context */}
      {assignments.length > 0 && !plan && !loading && (
        <div className="space-y-2">
          <p className="text-sm font-medium text-muted-foreground">Assignments to schedule</p>
          {assignments.map((a, i) => (
            <div key={i} className="flex items-center justify-between p-3 bg-card border border-border rounded-lg text-sm">
              <div>
                <span className="font-medium">{a.title}</span>
                <span className="text-muted-foreground"> · {a.course}</span>
              </div>
              <div className="flex items-center gap-3 text-xs text-muted-foreground">
                <span>{a.weight}%</span>
                {a.due_date && (
                  <span className="flex items-center gap-1">
                    <Calendar size={11} />
                    {new Date(a.due_date).toLocaleDateString('en-US', { month: 'short', day: 'numeric' })}
                  </span>
                )}
              </div>
            </div>
          ))}
        </div>
      )}

      {error && (
        <div className="p-4 rounded-xl border border-destructive/30 bg-destructive/5 text-sm text-destructive">
          {error}
        </div>
      )}

      {/* Generated plan */}
      {plan && (
        <div className="space-y-4">
          <div className="flex items-center justify-between">
            <p className="text-sm font-medium">Your study plan — {plan.length} day{plan.length !== 1 ? 's' : ''}</p>
            <button onClick={generate} className="text-xs text-academic hover:underline flex items-center gap-1">
              <Sparkles size={12} /> Regenerate
            </button>
          </div>

          {plan.map(day => (
            <div key={day.date} className="bg-card border border-border rounded-xl overflow-hidden">
              <div className="flex items-center justify-between px-4 py-3 border-b border-border bg-muted/30">
                <div className="flex items-center gap-2">
                  <Calendar size={14} className="text-academic" />
                  <span className="font-semibold text-sm">{formatDate(day.date)}</span>
                </div>
                <div className="flex items-center gap-1 text-xs text-muted-foreground">
                  <Clock size={11} />
                  <span>{dayTotalHours(day)}h total</span>
                </div>
              </div>
              <div className="divide-y divide-border">
                {day.sessions.map((sess, i) => (
                  <div key={i} className="px-4 py-3 flex gap-3">
                    <div className="mt-0.5 p-1.5 rounded-md bg-academic/10 text-academic flex-shrink-0 h-fit">
                      <BookOpen size={13} />
                    </div>
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center justify-between gap-2">
                        <p className="text-sm font-medium truncate">{sess.assignment}</p>
                        <span className="text-xs text-muted-foreground flex-shrink-0 flex items-center gap-1">
                          <Clock size={11} />{sess.hours}h
                        </span>
                      </div>
                      <p className="text-xs text-muted-foreground mt-0.5">{sess.course}</p>
                      {sess.focus && (
                        <p className="text-xs text-muted-foreground/70 mt-1 italic">{sess.focus}</p>
                      )}
                    </div>
                  </div>
                ))}
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  )
}
