export type Club = {
  id: string
  name: string
  description: string
  category: string
  university: string | null
  contact_email: string | null
  logo_url: string | null
}

export type ClubWithMembership = Club & { joined: boolean }

export type ClubMembership = {
  id: string
  user_id: string
  club_id: string
  joined_at: string
}

export type Event = {
  id: string
  created_by: string
  club_id: string | null
  title: string
  description: string | null
  location: string | null
  starts_at: string
  ends_at: string | null
  has_cost: boolean
  cost_per_person: number | null
  clubs: { name: string } | null
  event_rsvps: { id: string; user_id: string }[]
}

export type StudySession = {
  id: string
  created_by: string
  course_id: string | null
  title: string
  location: string | null
  starts_at: string
  max_participants: number | null
  notes: string | null
  created_at: string
  courses: { name: string; code: string | null } | null
  study_session_participants: { id: string; user_id: string }[]
}

export const CLUB_CATEGORIES = [
  'Technology',
  'Engineering',
  'Science',
  'Business',
  'Humanities',
  'Arts',
  'Sports',
  'Community',
  'Cultural',
  'Wellness',
] as const

export function formatEventDate(dateStr: string): string {
  const d = new Date(dateStr)
  const now = new Date()
  const diffDays = Math.floor((d.getTime() - now.getTime()) / 86400000)

  const time = d.toLocaleTimeString('en-US', { hour: 'numeric', minute: '2-digit' })

  if (diffDays === 0) return `Today at ${time}`
  if (diffDays === 1) return `Tomorrow at ${time}`
  if (diffDays > 0 && diffDays < 7)
    return d.toLocaleDateString('en-US', { weekday: 'long' }) + ` at ${time}`
  return (
    d.toLocaleDateString('en-US', { month: 'short', day: 'numeric' }) +
    ` at ${time}`
  )
}

export function formatSessionDate(dateStr: string): string {
  return formatEventDate(dateStr)
}
