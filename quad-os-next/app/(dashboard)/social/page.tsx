import Link from 'next/link'
import { createClient } from '@/lib/supabase/server'
import { Users, BookOpen, ArrowRight } from 'lucide-react'
import { seedClubsIfEmpty } from '@/app/actions/social'
import type { Club, Event, StudySession } from '@/lib/social-utils'
import { EventFeed } from './_components/event-feed'
import { StudySessionPreview } from './_components/study-session-preview'

export default async function SocialPage() {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()

  await seedClubsIfEmpty()

  const now = new Date().toISOString()

  const [{ data: memberships }, { data: events }, { data: sessions }] = await Promise.all([
    supabase.from('club_memberships').select('club_id, clubs(id, name, category)').eq('user_id', user!.id),
    supabase.from('events').select('*, clubs(name), event_rsvps(id, user_id)').gte('starts_at', now).order('starts_at', { ascending: true }).limit(20),
    supabase.from('study_sessions').select('*, courses(name, code), study_session_participants(id, user_id)').gte('starts_at', now).order('starts_at', { ascending: true }).limit(10),
  ])

  const joinedClubs = (memberships ?? []).map(m => m.clubs as unknown as Club).filter(Boolean)
  const typedEvents   = (events   ?? []) as Event[]
  const typedSessions = (sessions ?? []) as StudySession[]

  const userRsvpIds = new Set(
    typedEvents.flatMap(e => e.event_rsvps.filter(r => r.user_id === user!.id).map(() => e.id)),
  )
  const userSessionIds = new Set(
    typedSessions.filter(s => s.study_session_participants.some(p => p.user_id === user!.id)).map(s => s.id),
  )

  const SUB_LINKS = [
    { href: '/social/clubs', icon: Users,    label: 'Club Directory', sub: 'Find & join clubs' },
    { href: '/social/study', icon: BookOpen, label: 'Study Sessions', sub: 'Find study groups' },
  ]

  return (
    <div className="p-5 md:p-8 max-w-5xl mx-auto space-y-8">

      {/* Header */}
      <div className="flex items-center gap-3">
        <div className="w-10 h-10 rounded-xl bg-social/10 text-social flex items-center justify-center flex-shrink-0">
          <Users size={20} />
        </div>
        <div>
          <h1 className="text-2xl font-bold tracking-tight">Social</h1>
          <p className="text-sm text-muted-foreground">
            {joinedClubs.length} club{joinedClubs.length !== 1 ? 's' : ''} joined · {typedEvents.length} event{typedEvents.length !== 1 ? 's' : ''} · {typedSessions.length} study session{typedSessions.length !== 1 ? 's' : ''}
          </p>
        </div>
      </div>

      {/* Joined clubs strip */}
      {joinedClubs.length > 0 && (
        <section>
          <p className="text-xs font-semibold text-muted-foreground uppercase tracking-wider mb-3">Your clubs</p>
          <div className="flex gap-2 flex-wrap">
            {joinedClubs.map(club => (
              <Link
                key={club.id}
                href="/social/clubs"
                className="px-3 py-1.5 bg-social/10 border border-social/25 text-social rounded-full text-sm font-medium hover:bg-social/20 transition-colors"
              >
                {club.name}
              </Link>
            ))}
            <Link
              href="/social/clubs"
              className="px-3 py-1.5 bg-muted border border-border text-muted-foreground rounded-full text-sm hover:bg-muted/80 transition-colors"
            >
              Browse all →
            </Link>
          </div>
        </section>
      )}

      {/* Events + Study sessions */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
        <EventFeed events={typedEvents} userRsvpIds={userRsvpIds} userId={user!.id} />
        <StudySessionPreview sessions={typedSessions} userSessionIds={userSessionIds} userId={user!.id} />
      </div>

      {/* Quick links */}
      <div>
        <p className="text-xs font-semibold text-muted-foreground uppercase tracking-wider mb-3">Explore</p>
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
          {SUB_LINKS.map(({ href, icon: Icon, label, sub }) => (
            <Link
              key={href}
              href={href}
              className="group flex items-center gap-3 p-4 bg-card border border-border rounded-2xl hover:shadow-md hover:-translate-y-0.5 transition-all"
              style={{ borderTopColor: '#f43f5e', borderTopWidth: 2 }}
            >
              <div className="w-9 h-9 rounded-xl bg-social/10 text-social flex items-center justify-center flex-shrink-0">
                <Icon size={17} />
              </div>
              <div className="min-w-0 flex-1">
                <p className="font-semibold text-sm">{label}</p>
                <p className="text-xs text-muted-foreground">{sub}</p>
              </div>
              <ArrowRight size={13} className="text-muted-foreground/40 group-hover:text-social group-hover:translate-x-0.5 transition-all flex-shrink-0" />
            </Link>
          ))}
        </div>
      </div>
    </div>
  )
}
