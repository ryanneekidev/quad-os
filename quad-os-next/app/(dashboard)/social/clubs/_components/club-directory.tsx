'use client'

import { useState, useTransition } from 'react'
import { Sparkles, Search, UserPlus, UserMinus } from 'lucide-react'
import { joinClub, leaveClub } from '@/app/actions/social'
import { CLUB_CATEGORIES, type Club } from '@/lib/social-utils'

type StudentProfile = { major: string | null; year_of_study: number | null }

async function fetchMatches(
  profile: StudentProfile,
  clubs: Club[],
): Promise<string[]> {
  const res = await fetch('/api/ai', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      action: 'club_matcher',
      profile,
      clubs: clubs.map((c) => ({
        id: c.id,
        name: c.name,
        category: c.category,
        description: c.description,
      })),
    }),
  })
  if (!res.ok) throw new Error('Matching failed')
  const data = await res.json()
  return (data.matches ?? []) as string[]
}

export function ClubDirectory({
  clubs,
  joinedIds: initialJoinedIds,
  studentProfile,
}: {
  clubs: Club[]
  joinedIds: Set<string>
  studentProfile: StudentProfile
}) {
  const [joinedIds, setJoinedIds] = useState(new Set(initialJoinedIds))
  const [search, setSearch] = useState('')
  const [activeCategory, setActiveCategory] = useState<string | null>(null)
  const [matchedIds, setMatchedIds] = useState<string[] | null>(null)
  const [matchLoading, setMatchLoading] = useState(false)
  const [matchError, setMatchError] = useState<string | null>(null)
  const [isPending, startTransition] = useTransition()

  async function handleMatch() {
    setMatchLoading(true)
    setMatchError(null)
    try {
      const ids = await fetchMatches(studentProfile, clubs)
      setMatchedIds(ids)
      setActiveCategory(null)
      setSearch('')
    } catch (e) {
      setMatchError(e instanceof Error ? e.message : 'Matching failed')
    } finally {
      setMatchLoading(false)
    }
  }

  function toggle(clubId: string, isJoined: boolean) {
    startTransition(async () => {
      if (isJoined) {
        await leaveClub(clubId)
        setJoinedIds((prev) => {
          const next = new Set(prev)
          next.delete(clubId)
          return next
        })
      } else {
        await joinClub(clubId)
        setJoinedIds((prev) => new Set(prev).add(clubId))
      }
    })
  }

  const filtered = clubs.filter((c) => {
    const matchesSearch =
      search === '' ||
      c.name.toLowerCase().includes(search.toLowerCase()) ||
      c.description.toLowerCase().includes(search.toLowerCase())
    const matchesCategory =
      activeCategory === null || c.category === activeCategory
    return matchesSearch && matchesCategory
  })

  const sorted = matchedIds
    ? [
        ...matchedIds
          .map((id) => filtered.find((c) => c.id === id))
          .filter((c): c is Club => !!c),
        ...filtered.filter((c) => !matchedIds.includes(c.id)),
      ]
    : [
        ...filtered.filter((c) => joinedIds.has(c.id)),
        ...filtered.filter((c) => !joinedIds.has(c.id)),
      ]

  return (
    <div className="space-y-5">
      {/* Search + AI matcher */}
      <div className="flex gap-2">
        <div className="relative flex-1">
          <Search
            size={15}
            className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground"
          />
          <input
            value={search}
            onChange={(e) => {
              setSearch(e.target.value)
              setMatchedIds(null)
            }}
            placeholder="Search clubs…"
            className="w-full pl-9 pr-3 py-2 rounded-lg border border-input bg-background text-sm focus:outline-none focus:ring-2 focus:ring-ring"
          />
        </div>
        <button
          onClick={handleMatch}
          disabled={matchLoading}
          className="flex items-center gap-1.5 px-4 py-2 rounded-lg bg-social text-white text-sm font-medium hover:opacity-90 disabled:opacity-50 transition-opacity whitespace-nowrap"
        >
          <Sparkles size={14} />
          {matchLoading ? 'Matching…' : 'Match me'}
        </button>
      </div>

      {matchError && (
        <p className="text-sm text-destructive">{matchError}</p>
      )}

      {/* Category filter */}
      <div className="flex gap-2 flex-wrap">
        <button
          onClick={() => {
            setActiveCategory(null)
            setMatchedIds(null)
          }}
          className={`px-3 py-1 rounded-full text-xs font-medium transition-colors ${
            activeCategory === null && !matchedIds
              ? 'bg-social text-white'
              : 'bg-muted text-muted-foreground hover:bg-muted/80'
          }`}
        >
          All
        </button>
        {CLUB_CATEGORIES.map((cat) => (
          <button
            key={cat}
            onClick={() => {
              setActiveCategory(activeCategory === cat ? null : cat)
              setMatchedIds(null)
            }}
            className={`px-3 py-1 rounded-full text-xs font-medium transition-colors ${
              activeCategory === cat
                ? 'bg-social text-white'
                : 'bg-muted text-muted-foreground hover:bg-muted/80'
            }`}
          >
            {cat}
          </button>
        ))}
      </div>

      {matchedIds && (
        <div className="flex items-center justify-between">
          <p className="text-sm text-social font-medium">
            ✦ Showing your top {Math.min(matchedIds.length, 5)} matches first
          </p>
          <button
            onClick={() => setMatchedIds(null)}
            className="text-xs text-muted-foreground hover:underline"
          >
            Clear
          </button>
        </div>
      )}

      {/* Club grid */}
      {sorted.length === 0 ? (
        <p className="text-sm text-muted-foreground text-center py-10">
          No clubs match your search.
        </p>
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
          {sorted.map((club, idx) => {
            const isJoined = joinedIds.has(club.id)
            const isTopMatch = matchedIds && idx < 5 && matchedIds.includes(club.id)

            return (
              <div
                key={club.id}
                className={`bg-card border rounded-xl p-4 flex flex-col gap-3 ${
                  isJoined
                    ? 'border-social/40'
                    : isTopMatch
                      ? 'border-social/30'
                      : 'border-border'
                }`}
              >
                <div className="flex items-start justify-between gap-2">
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-1.5 flex-wrap">
                      <p className="font-semibold text-sm leading-tight">
                        {club.name}
                      </p>
                      {isTopMatch && (
                        <span className="text-[10px] font-medium bg-social/10 text-social px-1.5 py-0.5 rounded-full">
                          Top match
                        </span>
                      )}
                    </div>
                    <span className="text-[11px] text-muted-foreground mt-0.5 block">
                      {club.category}
                    </span>
                  </div>
                  {isJoined && (
                    <span className="text-[10px] font-medium bg-social/10 text-social px-1.5 py-0.5 rounded-full flex-shrink-0">
                      Joined
                    </span>
                  )}
                </div>

                <p className="text-xs text-muted-foreground leading-relaxed flex-1">
                  {club.description}
                </p>

                <button
                  onClick={() => toggle(club.id, isJoined)}
                  disabled={isPending}
                  className={`flex items-center justify-center gap-1.5 w-full py-1.5 rounded-lg text-xs font-medium transition-colors disabled:opacity-50 ${
                    isJoined
                      ? 'border border-social/30 text-social hover:bg-social/10'
                      : 'border border-border text-muted-foreground hover:bg-muted'
                  }`}
                >
                  {isJoined ? (
                    <>
                      <UserMinus size={12} /> Leave
                    </>
                  ) : (
                    <>
                      <UserPlus size={12} /> Join
                    </>
                  )}
                </button>
              </div>
            )
          })}
        </div>
      )}
    </div>
  )
}
