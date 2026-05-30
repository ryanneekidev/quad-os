import Link from 'next/link'
import { createClient } from '@/lib/supabase/server'
import { BookOpen, Library, Layers, CalendarDays, GraduationCap, ArrowRight } from 'lucide-react'
import { computeGPA, type CourseWithAssignments, type AssignmentWithCourse } from '@/lib/academic-utils'
import { CoursesSection } from './_components/courses-section'
import { UpcomingAssignments } from './_components/upcoming-assignments'

export default async function AcademicPage() {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()

  const [{ data: courses }, { data: upcoming }] = await Promise.all([
    supabase
      .from('courses')
      .select('*, assignments(*)')
      .eq('user_id', user!.id)
      .order('created_at'),
    supabase
      .from('assignments')
      .select('*, courses(name, code)')
      .eq('user_id', user!.id)
      .neq('status', 'graded')
      .order('due_date', { ascending: true })
      .limit(10),
  ])

  const typedCourses = (courses ?? []) as CourseWithAssignments[]
  const typedUpcoming = (upcoming ?? []) as AssignmentWithCourse[]
  const gpa = computeGPA(typedCourses)

  const SUB_LINKS = [
    { href: '/academic/resources', icon: Library,     label: 'Resource Library', sub: 'PDFs, links & notes' },
    { href: '/academic/flashcards', icon: Layers,     label: 'Flashcards',       sub: 'AI-generated study cards' },
    { href: '/academic/planner',   icon: CalendarDays, label: 'Study Planner',  sub: 'AI day-by-day schedule' },
  ]

  return (
    <div className="p-5 md:p-8 max-w-5xl mx-auto space-y-8">

      {/* Header */}
      <div className="flex items-start justify-between gap-4">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-xl bg-academic/10 text-academic flex items-center justify-center flex-shrink-0">
            <BookOpen size={20} />
          </div>
          <div>
            <h1 className="text-2xl font-bold tracking-tight">Academic</h1>
            <p className="text-sm text-muted-foreground">
              {typedCourses.length} course{typedCourses.length !== 1 ? 's' : ''} · {typedUpcoming.length} upcoming
            </p>
          </div>
        </div>
        {gpa !== null && (
          <div className="text-right flex-shrink-0">
            <p className="text-[10px] font-semibold text-muted-foreground uppercase tracking-widest">GPA</p>
            <p className="text-4xl font-black text-academic leading-none mt-1">{gpa.toFixed(2)}</p>
          </div>
        )}
      </div>

      {/* Cross-pillar: GPA threshold → scholarship alert */}
      {gpa !== null && gpa >= 3.5 && (
        <Link
          href="/finance/scholarships"
          className="flex items-center gap-3 p-4 rounded-2xl border border-finance/30 bg-finance/5 hover:bg-finance/8 hover:shadow-sm transition-all group"
        >
          <div className="w-9 h-9 rounded-xl bg-finance/10 text-finance flex items-center justify-center flex-shrink-0">
            <GraduationCap size={18} />
          </div>
          <div className="flex-1 min-w-0">
            <p className="text-sm font-semibold text-finance">
              Your GPA qualifies you for merit-based scholarships
            </p>
            <p className="text-xs text-muted-foreground mt-0.5">
              GPA {gpa.toFixed(2)} · See AI-matched awards
            </p>
          </div>
          <ArrowRight size={15} className="text-finance/50 group-hover:text-finance group-hover:translate-x-0.5 transition-all flex-shrink-0" />
        </Link>
      )}

      <CoursesSection courses={typedCourses} />
      <UpcomingAssignments assignments={typedUpcoming} />

      {/* Sub-section quick links */}
      <div>
        <p className="text-xs font-semibold text-muted-foreground uppercase tracking-wider mb-3">Tools</p>
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
          {SUB_LINKS.map(({ href, icon: Icon, label, sub }) => (
            <Link
              key={href}
              href={href}
              className="group flex items-center gap-3 p-4 bg-card border border-border rounded-2xl hover:shadow-md hover:-translate-y-0.5 transition-all"
              style={{ borderTopColor: '#6366f1', borderTopWidth: 2 }}
            >
              <div className="w-9 h-9 rounded-xl bg-academic/10 text-academic flex items-center justify-center flex-shrink-0">
                <Icon size={17} />
              </div>
              <div className="min-w-0 flex-1">
                <p className="font-semibold text-sm">{label}</p>
                <p className="text-xs text-muted-foreground truncate">{sub}</p>
              </div>
              <ArrowRight size={13} className="text-muted-foreground/40 group-hover:text-academic group-hover:translate-x-0.5 transition-all flex-shrink-0" />
            </Link>
          ))}
        </div>
      </div>
    </div>
  )
}
