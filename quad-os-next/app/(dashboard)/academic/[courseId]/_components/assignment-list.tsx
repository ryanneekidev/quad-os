'use client'

import { useState, useTransition, useRef } from 'react'
import { Plus, Trash2, Award, CheckCircle } from 'lucide-react'
import { formatDueDate, type Assignment } from '@/lib/academic-utils'
import {
  createAssignment,
  gradeAssignment,
  submitAssignment,
  deleteAssignment,
} from '@/app/actions/academic'

const STATUS_LABEL: Record<string, string> = {
  pending: 'Pending',
  submitted: 'Submitted',
  graded: 'Graded',
}

export function AssignmentList({
  assignments,
  courseId,
}: {
  assignments: Assignment[]
  courseId: string
}) {
  const [dialogOpen, setDialogOpen] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [gradingId, setGradingId] = useState<string | null>(null)
  const [gradeInput, setGradeInput] = useState('')
  const [isPending, startTransition] = useTransition()
  const formRef = useRef<HTMLFormElement>(null)

  function handleAdd(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault()
    const formData = new FormData(e.currentTarget)
    formData.set('course_id', courseId)
    setError(null)
    startTransition(async () => {
      const result = await createAssignment(undefined, formData)
      if (result?.error) {
        setError(result.error)
      } else {
        setDialogOpen(false)
        formRef.current?.reset()
      }
    })
  }

  function handleGrade(id: string) {
    const score = parseFloat(gradeInput)
    if (isNaN(score) || score < 0 || score > 100) return
    startTransition(async () => {
      await gradeAssignment(id, courseId, score)
      setGradingId(null)
      setGradeInput('')
    })
  }

  return (
    <section>
      <div className="flex items-center justify-between mb-4">
        <h2 className="text-lg font-semibold">Assignments</h2>
        <button
          onClick={() => setDialogOpen(true)}
          className="flex items-center gap-1.5 text-sm font-medium text-academic hover:underline"
        >
          <Plus size={16} /> Add assignment
        </button>
      </div>

      {assignments.length === 0 ? (
        <div className="text-center py-10 border border-dashed border-border rounded-xl">
          <p className="text-muted-foreground text-sm">No assignments yet.</p>
          <button
            onClick={() => setDialogOpen(true)}
            className="mt-1 text-sm text-academic hover:underline"
          >
            Add your first assignment →
          </button>
        </div>
      ) : (
        <div className="space-y-2">
          {assignments.map(a => {
            const isOverdue = !!a.due_date && a.status === 'pending' && new Date(a.due_date) < new Date()
            return (
              <div
                key={a.id}
                className={`flex items-center gap-3 p-3 rounded-lg border ${
                  a.status === 'graded' ? 'border-border bg-muted/30' : 'border-border bg-card'
                }`}
              >
                {/* Status dot */}
                <span className={`w-2 h-2 rounded-full flex-shrink-0 ${
                  a.status === 'graded' ? 'bg-emerald-500' :
                  a.status === 'submitted' ? 'bg-academic' :
                  isOverdue ? 'bg-destructive' : 'bg-amber-500'
                }`} />

                {/* Info */}
                <div className="flex-1 min-w-0">
                  <p className={`text-sm font-medium truncate ${
                    a.status === 'graded' ? 'text-muted-foreground' : ''
                  }`}>
                    {a.title}
                  </p>
                  <p className="text-xs text-muted-foreground">
                    {a.weight}% of grade
                    {a.due_date && (
                      <span className={isOverdue ? ' · text-destructive font-medium' : ''}>
                        {' · '}{formatDueDate(a.due_date)}
                      </span>
                    )}
                    <span className="ml-1 text-muted-foreground/60">· {STATUS_LABEL[a.status]}</span>
                  </p>
                </div>

                {/* Actions */}
                <div className="flex items-center gap-1.5 flex-shrink-0">
                  {a.status === 'graded' && a.score !== null ? (
                    <span className="text-sm font-bold text-emerald-500 tabular-nums">
                      {a.score}%
                    </span>
                  ) : gradingId === a.id ? (
                    <div className="flex items-center gap-1">
                      <input
                        type="number" min={0} max={100}
                        value={gradeInput}
                        onChange={e => setGradeInput(e.target.value)}
                        onKeyDown={e => e.key === 'Enter' && handleGrade(a.id)}
                        placeholder="0–100"
                        autoFocus
                        className="w-20 px-2 py-1 text-sm border border-input rounded-lg focus:outline-none focus:ring-2 focus:ring-ring"
                      />
                      <button
                        onClick={() => handleGrade(a.id)}
                        disabled={isPending}
                        className="p-1 text-academic hover:opacity-70 transition-opacity"
                      >
                        <CheckCircle size={16} />
                      </button>
                      <button
                        onClick={() => setGradingId(null)}
                        className="p-1 text-muted-foreground hover:text-foreground text-xs"
                      >
                        ✕
                      </button>
                    </div>
                  ) : (
                    <>
                      {a.status === 'pending' && (
                        <button
                          onClick={() => startTransition(() => submitAssignment(a.id, courseId))}
                          disabled={isPending}
                          className="text-xs px-2 py-1 rounded-md border border-border text-muted-foreground hover:bg-muted transition-colors"
                        >
                          Submit
                        </button>
                      )}
                      <button
                        onClick={() => { setGradingId(a.id); setGradeInput('') }}
                        className="p-1 text-muted-foreground hover:text-academic transition-colors"
                        title="Enter grade"
                      >
                        <Award size={15} />
                      </button>
                    </>
                  )}

                  <button
                    onClick={() => startTransition(() => deleteAssignment(a.id, courseId))}
                    disabled={isPending}
                    className="p-1 text-muted-foreground hover:text-destructive transition-colors"
                  >
                    <Trash2 size={14} />
                  </button>
                </div>
              </div>
            )
          })}
        </div>
      )}

      {/* Add Assignment Dialog */}
      {dialogOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
          <div className="absolute inset-0 bg-black/50" onClick={() => setDialogOpen(false)} />
          <div className="relative bg-card border border-border rounded-xl p-6 w-full max-w-md shadow-xl">
            <h3 className="text-lg font-semibold mb-4">Add assignment</h3>
            <form ref={formRef} onSubmit={handleAdd} className="space-y-3">
              <div>
                <label className="text-sm font-medium">Title *</label>
                <input
                  name="title" required placeholder="Midterm Exam"
                  className="mt-1 w-full px-3 py-2 rounded-lg border border-input bg-background text-sm focus:outline-none focus:ring-2 focus:ring-ring"
                />
              </div>
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="text-sm font-medium">Weight (%)</label>
                  <input
                    name="weight" type="number" min={0} max={100} defaultValue={10}
                    className="mt-1 w-full px-3 py-2 rounded-lg border border-input bg-background text-sm focus:outline-none focus:ring-2 focus:ring-ring"
                  />
                </div>
                <div>
                  <label className="text-sm font-medium">Due date</label>
                  <input
                    name="due_date" type="datetime-local"
                    className="mt-1 w-full px-3 py-2 rounded-lg border border-input bg-background text-sm focus:outline-none focus:ring-2 focus:ring-ring"
                  />
                </div>
              </div>
              {error && <p className="text-sm text-destructive">{error}</p>}
              <div className="flex gap-2 pt-1">
                <button
                  type="button" onClick={() => setDialogOpen(false)}
                  className="flex-1 py-2 rounded-lg border border-border text-sm font-medium hover:bg-muted transition-colors"
                >
                  Cancel
                </button>
                <button
                  type="submit" disabled={isPending}
                  className="flex-1 py-2 rounded-lg bg-academic text-white text-sm font-medium hover:opacity-90 disabled:opacity-50 transition-opacity"
                >
                  {isPending ? 'Adding…' : 'Add assignment'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </section>
  )
}
