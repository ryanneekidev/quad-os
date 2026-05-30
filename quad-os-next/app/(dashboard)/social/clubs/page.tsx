import { createClient } from '@/lib/supabase/server'
import { Users } from 'lucide-react'
import { seedClubsIfEmpty } from '@/app/actions/social'
import type { Club } from '@/lib/social-utils'
import { ClubDirectory } from './_components/club-directory'

export default async function ClubsPage() {
  const supabase = await createClient()
  const {
    data: { user },
  } = await supabase.auth.getUser()

  await seedClubsIfEmpty()

  const [{ data: clubs }, { data: memberships }, { data: profile }] =
    await Promise.all([
      supabase.from('clubs').select('*').order('name'),
      supabase
        .from('club_memberships')
        .select('club_id')
        .eq('user_id', user!.id),
      supabase
        .from('profiles')
        .select('major, year_of_study')
        .eq('id', user!.id)
        .single(),
    ])

  const joinedIds = new Set((memberships ?? []).map((m) => m.club_id))
  const typedClubs = (clubs ?? []) as Club[]

  const studentProfile = {
    major: profile?.major ?? null,
    year_of_study: profile?.year_of_study ?? null,
  }

  return (
    <div className="p-6 max-w-5xl mx-auto space-y-6">
      <div className="flex items-center gap-3">
        <div className="p-2 rounded-lg bg-social/10 text-social">
          <Users size={22} />
        </div>
        <div>
          <h1 className="text-2xl font-bold tracking-tight">Club Directory</h1>
          <p className="text-sm text-muted-foreground">
            {typedClubs.length} clubs · {joinedIds.size} joined
          </p>
        </div>
      </div>

      <ClubDirectory
        clubs={typedClubs}
        joinedIds={joinedIds}
        studentProfile={studentProfile}
      />
    </div>
  )
}
