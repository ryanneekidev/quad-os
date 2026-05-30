import Link from 'next/link'
import { ChevronLeft, CalendarDays } from 'lucide-react'
import { createClient } from '@/lib/supabase/server'
import type { CourseWithAssignments } from '@/lib/academic-utils'
import { StudyPlanner } from './_components/study-planner'

export default async function PlannerPage() {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()

  const { data: courses } = await supabase
    .from('courses')
    .select('*, assignments(*)')
    .eq('user_id', user!.id)
    .order('name')

  const typedCourses = (courses ?? []) as CourseWithAssignments[]

  const assignments = typedCourses.flatMap(c =>
    c.assignments
      .filter(a => a.status !== 'graded')
      .map(a => ({
        course: c.name,
        title: a.title,
        due_date: a.due_date,
        weight: a.weight,
        status: a.status,
      }))
  )

  return (
    <div className="p-6 max-w-3xl mx-auto space-y-6">
      <div>
        <Link
          href="/academic"
          className="inline-flex items-center gap-1 text-sm text-muted-foreground hover:text-foreground mb-4 transition-colors"
        >
          <ChevronLeft size={14} /> Academic
        </Link>
        <div className="flex items-center gap-3">
          <div className="p-2 rounded-lg bg-academic/10 text-academic">
            <CalendarDays size={22} />
          </div>
          <div>
            <h1 className="text-2xl font-bold tracking-tight">AI Study Planner</h1>
            <p className="text-sm text-muted-foreground">
              {assignments.length} pending assignment{assignments.length !== 1 ? 's' : ''} to schedule
            </p>
          </div>
        </div>
      </div>

      <StudyPlanner assignments={assignments} />
    </div>
  )
}
