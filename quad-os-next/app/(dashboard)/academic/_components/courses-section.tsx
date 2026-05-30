'use client'

import { useState, useTransition, useRef } from 'react'
import Link from 'next/link'
import { Plus, Trash2, ArrowRight, BookOpen } from 'lucide-react'
import { createCourse, deleteCourse } from '@/app/actions/academic'
import { computeCourseGrade, gradeColor, type CourseWithAssignments } from '@/lib/academic-utils'

export function CoursesSection({ courses }: { courses: CourseWithAssignments[] }) {
  const [open, setOpen] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [isPending, startTransition] = useTransition()
  const formRef = useRef<HTMLFormElement>(null)

  function handleAdd(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault()
    const formData = new FormData(e.currentTarget)
    setError(null)
    startTransition(async () => {
      const result = await createCourse(undefined, formData)
      if (result?.error) {
        setError(result.error)
      } else {
        setOpen(false)
        formRef.current?.reset()
      }
    })
  }

  return (
    <section>
      <div className="flex items-center justify-between mb-4">
        <h2 className="text-base font-semibold">Courses</h2>
        <button
          onClick={() => setOpen(true)}
          className="flex items-center gap-1.5 text-sm font-medium text-academic hover:opacity-80 transition-opacity"
        >
          <Plus size={15} /> Add course
        </button>
      </div>

      {courses.length === 0 ? (
        <div className="flex flex-col items-center justify-center py-16 border-2 border-dashed border-border rounded-2xl">
          <div className="w-12 h-12 rounded-2xl bg-academic/10 text-academic flex items-center justify-center mb-3">
            <BookOpen size={22} />
          </div>
          <p className="text-sm font-medium">No courses yet</p>
          <p className="text-xs text-muted-foreground mt-1 mb-4">Add your courses to start tracking grades</p>
          <button
            onClick={() => setOpen(true)}
            className="px-4 py-2 rounded-xl bg-academic text-white text-sm font-medium hover:opacity-90 transition-opacity"
          >
            Add your first course
          </button>
        </div>
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
          {courses.map(course => {
            const grade = computeCourseGrade(course.assignments)
            return (
              <div
                key={course.id}
                className="group relative bg-card border border-border rounded-2xl p-5 hover:shadow-md hover:-translate-y-0.5 transition-all flex flex-col gap-3"
                style={{ borderTopColor: '#6366f1', borderTopWidth: 3 }}
              >
                <div className="flex items-start justify-between gap-2">
                  <div className="min-w-0 flex-1">
                    <p className="font-bold leading-tight">{course.name}</p>
                    {course.code && (
                      <p className="text-xs text-muted-foreground mt-0.5 font-mono">{course.code}</p>
                    )}
                  </div>
                  {grade !== null && (
                    <span className={`text-2xl font-black flex-shrink-0 tabular-nums ${gradeColor(grade)}`}>
                      {grade.toFixed(0)}%
                    </span>
                  )}
                </div>

                <p className="text-xs text-muted-foreground">
                  {[course.semester, `${course.credits} cr`, `${course.assignments.length} assignment${course.assignments.length !== 1 ? 's' : ''}`]
                    .filter(Boolean)
                    .join(' · ')}
                </p>

                <div className="flex items-center justify-between mt-auto pt-1">
                  <Link
                    href={`/academic/${course.id}`}
                    className="flex items-center gap-1 text-sm font-medium text-academic hover:opacity-80 transition-opacity"
                  >
                    View course <ArrowRight size={13} />
                  </Link>
                  <button
                    onClick={() => startTransition(() => deleteCourse(course.id))}
                    disabled={isPending}
                    className="opacity-0 group-hover:opacity-100 p-1.5 rounded-lg text-muted-foreground hover:text-destructive hover:bg-destructive/10 transition-all"
                    title="Delete course"
                  >
                    <Trash2 size={13} />
                  </button>
                </div>
              </div>
            )
          })}
        </div>
      )}

      {/* Add course dialog */}
      {open && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
          <div className="absolute inset-0 bg-black/60 backdrop-blur-sm" onClick={() => setOpen(false)} />
          <div className="relative bg-card border border-border rounded-2xl p-6 w-full max-w-md shadow-2xl">
            <h3 className="text-lg font-bold mb-5">Add course</h3>
            <form ref={formRef} onSubmit={handleAdd} className="space-y-4">
              <div>
                <label className="text-sm font-medium">Course name *</label>
                <input
                  name="name" required placeholder="Calculus II"
                  className="mt-1.5 w-full px-3 py-2.5 rounded-xl border border-input bg-background text-sm focus:outline-none focus:ring-2 focus:ring-academic/50"
                />
              </div>
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="text-sm font-medium">Code</label>
                  <input
                    name="code" placeholder="MATH 201"
                    className="mt-1.5 w-full px-3 py-2.5 rounded-xl border border-input bg-background text-sm focus:outline-none focus:ring-2 focus:ring-academic/50"
                  />
                </div>
                <div>
                  <label className="text-sm font-medium">Credits</label>
                  <input
                    name="credits" type="number" min={1} max={12} defaultValue={3}
                    className="mt-1.5 w-full px-3 py-2.5 rounded-xl border border-input bg-background text-sm focus:outline-none focus:ring-2 focus:ring-academic/50"
                  />
                </div>
              </div>
              <div>
                <label className="text-sm font-medium">Semester</label>
                <input
                  name="semester" placeholder="Fall 2026"
                  className="mt-1.5 w-full px-3 py-2.5 rounded-xl border border-input bg-background text-sm focus:outline-none focus:ring-2 focus:ring-academic/50"
                />
              </div>
              {error && <p className="text-sm text-destructive">{error}</p>}
              <div className="flex gap-2 pt-1">
                <button
                  type="button" onClick={() => setOpen(false)}
                  className="flex-1 py-2.5 rounded-xl border border-border text-sm font-medium hover:bg-muted transition-colors"
                >
                  Cancel
                </button>
                <button
                  type="submit" disabled={isPending}
                  className="flex-1 py-2.5 rounded-xl bg-academic text-white text-sm font-medium hover:opacity-90 disabled:opacity-50 transition-opacity"
                >
                  {isPending ? 'Adding…' : 'Add course'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </section>
  )
}
