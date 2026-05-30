'use server'

import { createClient } from '@/lib/supabase/server'
import { revalidatePath } from 'next/cache'

// ─── Clubs ────────────────────────────────────────────────────────────────────

export async function joinClub(clubId: string): Promise<void> {
  const supabase = await createClient()
  const {
    data: { user },
  } = await supabase.auth.getUser()
  if (!user) return
  await supabase
    .from('club_memberships')
    .insert({ user_id: user.id, club_id: clubId })
  revalidatePath('/social')
  revalidatePath('/social/clubs')
}

export async function leaveClub(clubId: string): Promise<void> {
  const supabase = await createClient()
  const {
    data: { user },
  } = await supabase.auth.getUser()
  if (!user) return
  await supabase
    .from('club_memberships')
    .delete()
    .eq('user_id', user.id)
    .eq('club_id', clubId)
  revalidatePath('/social')
  revalidatePath('/social/clubs')
}

export async function seedClubsIfEmpty(): Promise<void> {
  const supabase = await createClient()
  const { count } = await supabase
    .from('clubs')
    .select('*', { count: 'exact', head: true })
  if ((count ?? 0) > 0) return
  await supabase.from('clubs').insert(CLUB_SEED)
}

// ─── Events ───────────────────────────────────────────────────────────────────

export async function createEvent(
  _: unknown,
  formData: FormData,
): Promise<{ error?: string; success?: boolean }> {
  const supabase = await createClient()
  const {
    data: { user },
  } = await supabase.auth.getUser()
  if (!user) return { error: 'Unauthorized' }

  const hasCost = formData.get('has_cost') === 'true'
  const costPerPerson = hasCost
    ? Number(formData.get('cost_per_person')) || null
    : null

  const { error } = await supabase.from('events').insert({
    created_by: user.id,
    club_id: (formData.get('club_id') as string) || null,
    title: formData.get('title') as string,
    description: (formData.get('description') as string) || null,
    location: (formData.get('location') as string) || null,
    starts_at: formData.get('starts_at') as string,
    ends_at: (formData.get('ends_at') as string) || null,
    has_cost: hasCost,
    cost_per_person: costPerPerson,
  })

  if (error) return { error: error.message }
  revalidatePath('/social')
  return { success: true }
}

export async function rsvpEvent(eventId: string): Promise<void> {
  const supabase = await createClient()
  const {
    data: { user },
  } = await supabase.auth.getUser()
  if (!user) return
  await supabase
    .from('event_rsvps')
    .insert({ event_id: eventId, user_id: user.id })
  revalidatePath('/social')
}

export async function cancelRsvp(eventId: string): Promise<void> {
  const supabase = await createClient()
  const {
    data: { user },
  } = await supabase.auth.getUser()
  if (!user) return
  await supabase
    .from('event_rsvps')
    .delete()
    .eq('event_id', eventId)
    .eq('user_id', user.id)
  revalidatePath('/social')
}

// ─── Study Sessions ───────────────────────────────────────────────────────────

export async function createStudySession(
  _: unknown,
  formData: FormData,
): Promise<{ error?: string; success?: boolean }> {
  const supabase = await createClient()
  const {
    data: { user },
  } = await supabase.auth.getUser()
  if (!user) return { error: 'Unauthorized' }

  const { data: session, error } = await supabase
    .from('study_sessions')
    .insert({
      created_by: user.id,
      course_id: (formData.get('course_id') as string) || null,
      title: formData.get('title') as string,
      location: (formData.get('location') as string) || null,
      starts_at: formData.get('starts_at') as string,
      max_participants: Number(formData.get('max_participants')) || null,
      notes: (formData.get('notes') as string) || null,
    })
    .select()
    .single()

  if (error || !session) return { error: error?.message ?? 'Failed to create session' }

  // Auto-join the creator
  await supabase
    .from('study_session_participants')
    .insert({ session_id: session.id, user_id: user.id })

  revalidatePath('/social/study')
  return { success: true }
}

export async function joinStudySession(sessionId: string): Promise<void> {
  const supabase = await createClient()
  const {
    data: { user },
  } = await supabase.auth.getUser()
  if (!user) return
  await supabase
    .from('study_session_participants')
    .insert({ session_id: sessionId, user_id: user.id })
  revalidatePath('/social/study')
}

export async function leaveStudySession(sessionId: string): Promise<void> {
  const supabase = await createClient()
  const {
    data: { user },
  } = await supabase.auth.getUser()
  if (!user) return
  await supabase
    .from('study_session_participants')
    .delete()
    .eq('session_id', sessionId)
    .eq('user_id', user.id)
  revalidatePath('/social/study')
}

// ─── Club Seed Data ───────────────────────────────────────────────────────────

const CLUB_SEED = [
  {
    name: 'Computer Science Club',
    description: 'Weekly coding challenges, hackathon prep, and guest talks from industry engineers.',
    category: 'Technology',
    university: null,
    contact_email: null,
    logo_url: null,
  },
  {
    name: 'Engineering Society',
    description: 'Bridging theory and practice with design competitions, site visits, and networking events.',
    category: 'Engineering',
    university: null,
    contact_email: null,
    logo_url: null,
  },
  {
    name: 'Robotics Team',
    description: 'Build and compete with autonomous robots in national and international competitions.',
    category: 'Engineering',
    university: null,
    contact_email: null,
    logo_url: null,
  },
  {
    name: 'Pre-Med Society',
    description: 'MCAT prep, hospital volunteering, and mentorship from medical students and doctors.',
    category: 'Science',
    university: null,
    contact_email: null,
    logo_url: null,
  },
  {
    name: 'Math & Statistics Club',
    description: 'Problem-solving competitions, Putnam prep, and applied statistics workshops.',
    category: 'Science',
    university: null,
    contact_email: null,
    logo_url: null,
  },
  {
    name: 'Business & Finance Club',
    description: 'Case competitions, stock pitch events, and networking with finance professionals.',
    category: 'Business',
    university: null,
    contact_email: null,
    logo_url: null,
  },
  {
    name: 'Entrepreneurship Society',
    description: 'Pitch nights, startup workshops, and connections to local incubators and investors.',
    category: 'Business',
    university: null,
    contact_email: null,
    logo_url: null,
  },
  {
    name: 'Debate Society',
    description: 'Competitive debate, public speaking workshops, and national tournament travel.',
    category: 'Humanities',
    university: null,
    contact_email: null,
    logo_url: null,
  },
  {
    name: 'Creative Writing Club',
    description: 'Weekly workshops, open mic nights, and a student-run literary journal.',
    category: 'Humanities',
    university: null,
    contact_email: null,
    logo_url: null,
  },
  {
    name: 'Photography Club',
    description: 'Darkroom access, photo walks, and an annual student gallery exhibition.',
    category: 'Arts',
    university: null,
    contact_email: null,
    logo_url: null,
  },
  {
    name: 'Film Society',
    description: 'Screenings, short film productions, and critiques of classic and contemporary cinema.',
    category: 'Arts',
    university: null,
    contact_email: null,
    logo_url: null,
  },
  {
    name: 'Dance Ensemble',
    description: 'Contemporary and traditional dance styles, open rehearsals, and a spring showcase.',
    category: 'Arts',
    university: null,
    contact_email: null,
    logo_url: null,
  },
  {
    name: 'Basketball Club',
    description: 'Casual pickup games, intramural leagues, and training sessions open to all skill levels.',
    category: 'Sports',
    university: null,
    contact_email: null,
    logo_url: null,
  },
  {
    name: 'Soccer Club',
    description: 'Co-ed recreational and competitive leagues, weekly practice, and social matches.',
    category: 'Sports',
    university: null,
    contact_email: null,
    logo_url: null,
  },
  {
    name: 'Volunteer Corps',
    description: 'Organised community service events, food drives, tutoring programmes, and charity runs.',
    category: 'Community',
    university: null,
    contact_email: null,
    logo_url: null,
  },
  {
    name: 'Environmental Action Club',
    description: 'Campus sustainability initiatives, clean-up drives, and climate advocacy campaigns.',
    category: 'Community',
    university: null,
    contact_email: null,
    logo_url: null,
  },
  {
    name: 'International Students Association',
    description: 'Cultural exchange events, language exchange partners, and support for international students.',
    category: 'Cultural',
    university: null,
    contact_email: null,
    logo_url: null,
  },
  {
    name: 'Mental Health Awareness Club',
    description: 'Peer support circles, mindfulness sessions, and destigmatisation campaigns on campus.',
    category: 'Wellness',
    university: null,
    contact_email: null,
    logo_url: null,
  },
]
