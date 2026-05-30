import { createClient } from '@/lib/supabase/server'
import { GraduationCap } from 'lucide-react'
import { seedScholarshipsIfEmpty } from '@/app/actions/finance'
import { computeGPA, type CourseWithAssignments } from '@/lib/academic-utils'
import type { Scholarship } from '@/lib/finance-utils'
import { ScholarshipList } from './_components/scholarship-list'

export default async function ScholarshipsPage() {
  const supabase = await createClient()
  const {
    data: { user },
  } = await supabase.auth.getUser()

  await seedScholarshipsIfEmpty()

  const [{ data: scholarships }, { data: profile }, { data: courses }] =
    await Promise.all([
      supabase.from('scholarships').select('*').order('deadline'),
      supabase
        .from('profiles')
        .select('major, year_of_study')
        .eq('id', user!.id)
        .single(),
      supabase
        .from('courses')
        .select('*, assignments(*)')
        .eq('user_id', user!.id),
    ])

  const typedScholarships = (scholarships ?? []) as Scholarship[]
  const gpa = computeGPA((courses ?? []) as CourseWithAssignments[])

  const studentProfile = {
    major: profile?.major ?? null,
    year_of_study: profile?.year_of_study ?? null,
    gpa,
  }

  const deadlineSoon = typedScholarships.filter((s) => {
    const days =
      (new Date(s.deadline).getTime() - Date.now()) / 86400000
    return days >= 0 && days <= 14
  })

  return (
    <div className="p-6 max-w-3xl mx-auto space-y-6">
      <div className="flex items-start justify-between">
        <div className="flex items-center gap-3">
          <div className="p-2 rounded-lg bg-finance/10 text-finance">
            <GraduationCap size={22} />
          </div>
          <div>
            <h1 className="text-2xl font-bold tracking-tight">Scholarships</h1>
            <p className="text-sm text-muted-foreground">
              {typedScholarships.length} available · AI-matched to your profile
            </p>
          </div>
        </div>
        {gpa !== null && (
          <div className="text-right">
            <p className="text-xs text-muted-foreground uppercase tracking-wide">
              GPA
            </p>
            <p className="text-2xl font-bold text-finance">{gpa.toFixed(2)}</p>
          </div>
        )}
      </div>

      {deadlineSoon.length > 0 && (
        <div className="border border-amber-300 bg-amber-50 dark:bg-amber-950/20 rounded-xl p-4">
          <p className="text-sm font-semibold text-amber-700 dark:text-amber-400 mb-1">
            ⏰ Deadlines within 2 weeks
          </p>
          <ul className="space-y-1">
            {deadlineSoon.map((s) => (
              <li key={s.id} className="text-sm text-amber-800 dark:text-amber-300">
                {s.title} — due{' '}
                {new Date(s.deadline).toLocaleDateString('en-US', {
                  month: 'short',
                  day: 'numeric',
                })}
              </li>
            ))}
          </ul>
        </div>
      )}

      <ScholarshipList
        scholarships={typedScholarships}
        studentProfile={studentProfile}
      />
    </div>
  )
}
