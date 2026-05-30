import Link from 'next/link'
import { createClient } from '@/lib/supabase/server'
import { BookOpen, Wallet, Users, ShoppingBag, ArrowRight, Calendar, MapPin } from 'lucide-react'
import { formatDueDate } from '@/lib/academic-utils'

// ─── Pillar card ───────────────────────────────────────────────────────────

function PillarCard({
  href, label, icon: Icon, hex, children,
}: {
  href: string; label: string; icon: React.ElementType; hex: string; children: React.ReactNode
}) {
  return (
    <Link
      href={href}
      className="flex flex-col bg-card border border-border rounded-2xl p-4 active:opacity-80 transition-opacity"
      style={{ borderTopColor: hex, borderTopWidth: 3 }}
    >
      <div className="flex items-center justify-between mb-3">
        <div className="flex items-center gap-2">
          <div
            className="w-7 h-7 rounded-lg flex items-center justify-center shrink-0"
            style={{ backgroundColor: `${hex}18`, color: hex }}
          >
            <Icon size={14} />
          </div>
          <span className="text-sm font-semibold" style={{ color: hex }}>{label}</span>
        </div>
        <ArrowRight size={13} className="text-muted-foreground/40 shrink-0" />
      </div>
      <div>{children}</div>
    </Link>
  )
}

// ─── Helpers ───────────────────────────────────────────────────────────────

function DueBadge({ due }: { due: string }) {
  const diff = Math.ceil((new Date(due).getTime() - Date.now()) / 86400000)
  const cls = diff <= 1 ? 'bg-red-500/10 text-red-500' : diff <= 3 ? 'bg-amber-500/10 text-amber-600' : 'bg-emerald-500/10 text-emerald-600'
  return <span className={`inline-flex px-2 py-0.5 rounded-full text-xs font-medium ${cls}`}>{formatDueDate(due)}</span>
}

function BudgetBar({ pct }: { pct: number }) {
  const fill = Math.min(pct, 100)
  const color = pct >= 100 ? '#ef4444' : pct >= 75 ? '#f59e0b' : '#10b981'
  return (
    <div className="w-full h-1.5 bg-muted rounded-full overflow-hidden">
      <div className="h-full rounded-full" style={{ width: `${fill}%`, backgroundColor: color }} />
    </div>
  )
}

function Empty({ message, cta }: { message: string; cta: string }) {
  return (
    <div className="space-y-0.5">
      <p className="text-sm text-muted-foreground">{message}</p>
      <p className="text-xs text-muted-foreground/60">{cta}</p>
    </div>
  )
}

function fmtEvent(iso: string) {
  const d = new Date(iso)
  const diff = Math.floor((d.getTime() - Date.now()) / 86400000)
  const t = d.toLocaleTimeString('en-US', { hour: 'numeric', minute: '2-digit' })
  if (diff === 0) return `Today · ${t}`
  if (diff === 1) return `Tomorrow · ${t}`
  return d.toLocaleDateString('en-US', { month: 'short', day: 'numeric' }) + ` · ${t}`
}

// ─── Page ──────────────────────────────────────────────────────────────────

export default async function HomePage() {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()

  const firstName = ((user?.user_metadata?.full_name as string | undefined) ?? '').split(' ')[0] || 'there'
  const now = new Date()
  const today = now.toISOString().split('T')[0]
  const startOfMonth = `${now.toISOString().slice(0, 7)}-01`
  const hour = now.getHours()
  const greeting = hour < 12 ? 'Good morning' : hour < 17 ? 'Good afternoon' : 'Good evening'
  const dateLabel = now.toLocaleDateString('en-US', { weekday: 'long', month: 'long', day: 'numeric' })

  // Academic
  const { data: rawA } = await supabase
    .from('assignments').select('title, due_date, courses(name)')
    .eq('user_id', user!.id).in('status', ['pending', 'submitted'])
    .gte('due_date', today).order('due_date', { ascending: true }).limit(1)
  const nextAssignment = (rawA?.[0] ?? null) as { title: string; due_date: string; courses: { name: string } | null } | null

  // Finance
  const { data: cats } = await supabase.from('budget_categories').select('id, name, monthly_limit').eq('user_id', user!.id)
  const { data: txs } = await supabase.from('transactions').select('category_id, amount').eq('user_id', user!.id).eq('type', 'expense').gte('date', startOfMonth)
  const spentBy: Record<string, number> = {}
  for (const t of txs ?? []) if (t.category_id) spentBy[t.category_id] = (spentBy[t.category_id] ?? 0) + Number(t.amount)
  const stressedCat = (cats ?? [])
    .filter(c => Number(c.monthly_limit) > 0)
    .map(c => ({ ...c, spent: spentBy[c.id] ?? 0, pct: ((spentBy[c.id] ?? 0) / Number(c.monthly_limit)) * 100 }))
    .sort((a, b) => b.pct - a.pct)[0] ?? null

  // Social
  const { data: evts } = await supabase.from('events').select('title, location, starts_at')
    .gte('starts_at', now.toISOString()).order('starts_at', { ascending: true }).limit(1)
  const nextEvent = (evts?.[0] ?? null) as { title: string; location: string | null; starts_at: string } | null

  // Marketplace
  const { data: listings } = await supabase.from('listings').select('title, price')
    .eq('seller_id', user!.id).eq('status', 'active').order('created_at', { ascending: false })
  const listingCount = listings?.length ?? 0
  const latestListing = (listings?.[0] ?? null) as { title: string; price: number } | null

  const ACTIONS = [
    { href: '/academic',             label: '+ Assignment', hex: '#6366f1' },
    { href: '/finance/transactions', label: '+ Expense',    hex: '#10b981' },
    { href: '/marketplace/new',      label: '+ Listing',    hex: '#f59e0b' },
    { href: '/social',               label: 'Find events',  hex: '#f43f5e' },
    { href: '/social/clubs',         label: 'Browse clubs', hex: '#f43f5e' },
    { href: '/finance/scholarships', label: 'Scholarships', hex: '#10b981' },
  ]

  return (
    <div className="w-full px-4 py-6 space-y-6">

      {/* Header */}
      <div>
        <h1 className="text-2xl font-bold tracking-tight">{greeting}, {firstName}</h1>
        <p className="text-sm text-muted-foreground mt-0.5">{dateLabel}</p>
      </div>

      {/* Quick actions — scrolls horizontally, clamped by overflow-hidden on shell */}
      <div className="flex gap-2 overflow-x-auto pb-1 no-scrollbar">
        {ACTIONS.map(({ href, label, hex }) => (
          <Link
            key={label}
            href={href}
            style={{ borderColor: `${hex}40`, color: hex }}
            className="shrink-0 px-3.5 py-2 rounded-full border bg-card text-sm font-medium"
          >
            {label}
          </Link>
        ))}
      </div>

      {/* Overview */}
      <div>
        <h2 className="text-lg font-bold mb-3">Overview</h2>
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">

          <PillarCard href="/academic" label="Academic" icon={BookOpen} hex="#6366f1">
            {nextAssignment ? (
              <div className="space-y-1.5">
                <p className="text-sm font-semibold line-clamp-2">{nextAssignment.title}</p>
                <p className="text-xs text-muted-foreground truncate">{nextAssignment.courses?.name ?? 'Unknown course'}</p>
                <DueBadge due={nextAssignment.due_date} />
              </div>
            ) : <Empty message="No upcoming assignments." cta="Add a course to get started →" />}
          </PillarCard>

          <PillarCard href="/finance" label="Finance" icon={Wallet} hex="#10b981">
            {stressedCat ? (
              <div className="space-y-2">
                <div className="flex items-center justify-between gap-2">
                  <p className="text-sm font-semibold truncate">{stressedCat.name}</p>
                  <span className={`w-2 h-2 rounded-full shrink-0 ${stressedCat.pct >= 100 ? 'bg-red-500' : stressedCat.pct >= 75 ? 'bg-amber-400' : 'bg-emerald-500'}`} />
                </div>
                <BudgetBar pct={stressedCat.pct} />
                <div className="flex justify-between text-xs text-muted-foreground">
                  <span>${stressedCat.spent.toFixed(0)} spent</span>
                  <span>${Number(stressedCat.monthly_limit).toFixed(0)} limit</span>
                </div>
              </div>
            ) : <Empty message="No budget categories yet." cta="Set up your budget →" />}
          </PillarCard>

          <PillarCard href="/social" label="Social" icon={Users} hex="#f43f5e">
            {nextEvent ? (
              <div className="space-y-1.5">
                <p className="text-sm font-semibold line-clamp-2">{nextEvent.title}</p>
                <div className="flex items-center gap-1.5 text-xs text-muted-foreground">
                  <Calendar size={11} className="shrink-0" />
                  <span className="truncate">{fmtEvent(nextEvent.starts_at)}</span>
                </div>
                {nextEvent.location && (
                  <div className="flex items-center gap-1.5 text-xs text-muted-foreground">
                    <MapPin size={11} className="shrink-0" />
                    <span className="truncate">{nextEvent.location}</span>
                  </div>
                )}
              </div>
            ) : <Empty message="No upcoming events." cta="Browse the event board →" />}
          </PillarCard>

          <PillarCard href="/marketplace" label="Marketplace" icon={ShoppingBag} hex="#f59e0b">
            {latestListing ? (
              <div className="space-y-1.5">
                <div className="flex items-baseline gap-2">
                  <span className="text-2xl font-bold shrink-0" style={{ color: '#f59e0b' }}>{listingCount}</span>
                  <span className="text-sm text-muted-foreground truncate">active listing{listingCount !== 1 ? 's' : ''}</span>
                </div>
                <div className="flex items-center justify-between gap-2">
                  <p className="text-xs text-muted-foreground truncate">{latestListing.title}</p>
                  <p className="text-sm font-semibold shrink-0">${Number(latestListing.price).toFixed(2)}</p>
                </div>
              </div>
            ) : <Empty message="No active listings." cta="Post your first item →" />}
          </PillarCard>

        </div>
      </div>
    </div>
  )
}
