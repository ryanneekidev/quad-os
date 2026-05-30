import Link from 'next/link'
import { formatDueDate, type AssignmentWithCourse } from '@/lib/academic-utils'

export function UpcomingAssignments({ assignments }: { assignments: AssignmentWithCourse[] }) {
  if (assignments.length === 0) return null

  return (
    <section>
      <h2 className="text-base font-semibold mb-4">Upcoming assignments</h2>
      <div className="space-y-2">
        {assignments.map(a => {
          const isOverdue = !!a.due_date && a.status === 'pending' && new Date(a.due_date) < new Date()
          const dueDateStr = a.due_date ? formatDueDate(a.due_date) : null
          const diffDays = a.due_date
            ? Math.ceil((new Date(a.due_date).getTime() - Date.now()) / 86400000)
            : 999

          const urgencyBadge = isOverdue
            ? { cls: 'bg-red-500/10 text-red-500', label: dueDateStr ?? 'Overdue' }
            : diffDays <= 1
            ? { cls: 'bg-red-500/10 text-red-500', label: dueDateStr ?? '' }
            : diffDays <= 3
            ? { cls: 'bg-amber-500/10 text-amber-600', label: dueDateStr ?? '' }
            : { cls: 'bg-muted text-muted-foreground', label: dueDateStr ?? '' }

          const dotCls = a.status === 'submitted'
            ? 'bg-academic'
            : isOverdue ? 'bg-red-500'
            : diffDays <= 3 ? 'bg-amber-500'
            : 'bg-muted-foreground/40'

          return (
            <Link
              key={a.id}
              href={`/academic/${a.course_id}`}
              className="flex items-center justify-between p-4 bg-card border border-border rounded-xl hover:shadow-sm hover:-translate-y-px transition-all group"
            >
              <div className="flex items-center gap-3 min-w-0">
                <span className={`w-2 h-2 rounded-full flex-shrink-0 ${dotCls}`} />
                <div className="min-w-0">
                  <p className="text-sm font-semibold truncate">{a.title}</p>
                  <p className="text-xs text-muted-foreground mt-0.5">
                    {a.courses?.name}
                    {a.weight > 0 && ` · ${a.weight}% of grade`}
                    {a.status === 'submitted' && ' · Submitted'}
                  </p>
                </div>
              </div>
              {dueDateStr && (
                <span className={`ml-3 flex-shrink-0 px-2 py-0.5 rounded-full text-xs font-medium ${urgencyBadge.cls}`}>
                  {urgencyBadge.label}
                </span>
              )}
            </Link>
          )
        })}
      </div>
    </section>
  )
}
