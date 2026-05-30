import { notFound } from 'next/navigation'
import Link from 'next/link'
import { ChevronLeft, BookOpen } from 'lucide-react'
import { createClient } from '@/lib/supabase/server'
import { type CourseWithAssignments } from '@/lib/academic-utils'
import { GradeTracker } from './_components/grade-tracker'
import { AssignmentList } from './_components/assignment-list'

export default async function CourseDetailPage({
  params,
}: {
  params: Promise<{ courseId: string }>
}) {
  const { courseId } = await params
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()

  const { data: course } = await supabase
    .from('courses')
    .select('*, assignments(*)')
    .eq('id', courseId)
    .eq('user_id', user!.id)
    .single()

  if (!course) notFound()

  const typed = course as CourseWithAssignments
  const sortedAssignments = [...typed.assignments].sort((a, b) => {
    if (!a.due_date) return 1
    if (!b.due_date) return -1
    return new Date(a.due_date).getTime() - new Date(b.due_date).getTime()
  })

  return (
    <div className="p-6 max-w-4xl mx-auto space-y-8">
      <div>
        <Link
          href="/academic"
          className="inline-flex items-center gap-1 text-sm text-muted-foreground hover:text-foreground mb-4 transition-colors"
        >
          <ChevronLeft size={14} /> Academic
        </Link>
        <div className="flex items-center gap-3">
          <div className="p-2 rounded-lg bg-academic/10 text-academic">
            <BookOpen size={22} />
          </div>
          <div>
            <h1 className="text-2xl font-bold tracking-tight">{typed.name}</h1>
            <p className="text-sm text-muted-foreground">
              {[typed.code, typed.semester, `${typed.credits} credits`].filter(Boolean).join(' · ')}
            </p>
          </div>
        </div>
      </div>

      <GradeTracker assignments={sortedAssignments} />
      <AssignmentList assignments={sortedAssignments} courseId={courseId} />
    </div>
  )
}
