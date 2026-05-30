import { createClient } from '@/lib/supabase/server'
import { BookOpen } from 'lucide-react'
import type { StudySession } from '@/lib/social-utils'
import type { Course } from '@/lib/academic-utils'
import { StudyBoard } from './_components/study-board'

export default async function StudyPage() {
  const supabase = await createClient()
  const {
    data: { user },
  } = await supabase.auth.getUser()

  const [{ data: sessions }, { data: courses }] = await Promise.all([
    supabase
      .from('study_sessions')
      .select('*, courses(name, code), study_session_participants(id, user_id)')
      .gte('starts_at', new Date().toISOString())
      .order('starts_at', { ascending: true }),
    supabase
      .from('courses')
      .select('id, name, code')
      .eq('user_id', user!.id)
      .order('name'),
  ])

  const typedSessions = (sessions ?? []) as StudySession[]
  const typedCourses = (courses ?? []) as Pick<Course, 'id' | 'name' | 'code'>[]

  const userSessionIds = new Set(
    typedSessions
      .filter((s) =>
        s.study_session_participants.some((p) => p.user_id === user!.id),
      )
      .map((s) => s.id),
  )

  const joinedCount = userSessionIds.size

  return (
    <div className="p-6 max-w-3xl mx-auto space-y-6">
      <div className="flex items-center gap-3">
        <div className="p-2 rounded-lg bg-social/10 text-social">
          <BookOpen size={22} />
        </div>
        <div>
          <h1 className="text-2xl font-bold tracking-tight">Study Sessions</h1>
          <p className="text-sm text-muted-foreground">
            {typedSessions.length} upcoming ·{' '}
            {joinedCount} joined
          </p>
        </div>
      </div>

      <StudyBoard
        sessions={typedSessions}
        userSessionIds={userSessionIds}
        userId={user!.id}
        courses={typedCourses}
      />
    </div>
  )
}
