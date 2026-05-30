'use client'

import { useState } from 'react'
import Link from 'next/link'
import { usePathname } from 'next/navigation'
import {
  LayoutDashboard, BookOpen, Wallet, Users, ShoppingBag,
  LogOut, ChevronLeft, ChevronRight,
} from 'lucide-react'
import { logout } from '@/app/actions/auth'

const NAV_ITEMS = [
  { href: '/',            icon: LayoutDashboard, label: 'Dashboard',   hex: '#ffffff' },
  { href: '/academic',    icon: BookOpen,        label: 'Academic',    hex: '#6366f1' },
  { href: '/finance',     icon: Wallet,          label: 'Finance',     hex: '#10b981' },
  { href: '/social',      icon: Users,           label: 'Social',      hex: '#f43f5e' },
  { href: '/marketplace', icon: ShoppingBag,     label: 'Marketplace', hex: '#f59e0b' },
]

function NavItem({
  href, icon: Icon, label, hex, expanded, isActive,
}: {
  href: string
  icon: React.ElementType
  label: string
  hex: string
  expanded: boolean
  isActive: boolean
}) {
  const [hovered, setHovered] = useState(false)
  const lit = isActive || hovered

  return (
    <Link
      href={href}
      title={!expanded ? label : undefined}
      onMouseEnter={() => setHovered(true)}
      onMouseLeave={() => setHovered(false)}
      style={lit ? { color: hex, backgroundColor: `${hex}${isActive ? '20' : '12'}` } : undefined}
      className="relative flex items-center gap-3 px-3 py-2.5 rounded-xl text-white/40 transition-colors duration-150 min-w-0"
    >
      {isActive && (
        <span
          className="absolute left-0 top-2.5 bottom-2.5 w-[3px] rounded-full"
          style={{ backgroundColor: hex }}
        />
      )}
      <Icon size={18} className="flex-shrink-0" />
      {expanded && (
        <span className="text-sm font-medium whitespace-nowrap overflow-hidden">{label}</span>
      )}
    </Link>
  )
}

export function Sidebar({ expanded, onToggle }: { expanded: boolean; onToggle: () => void }) {
  const pathname = usePathname()

  return (
    <>
      {/* ── Desktop sidebar ── */}
      <aside
        style={{ width: expanded ? 220 : 60 }}
        className="hidden md:flex flex-col h-screen fixed left-0 top-0 bg-[#09090b] border-r border-white/[0.06] z-50 transition-[width] duration-300 ease-in-out overflow-hidden"
      >
        {/* Logo + toggle */}
        <div className="h-[60px] border-b border-white/[0.06] flex-shrink-0 flex items-center">
          {expanded ? (
            /* Expanded: logo + wordmark + collapse button */
            <div className="flex items-center gap-2.5 w-full px-3">
              <div className="w-7 h-7 rounded-lg bg-gradient-to-br from-[#6366f1] to-[#f59e0b] flex items-center justify-center flex-shrink-0">
                <span className="text-white font-black text-xs leading-none">Q</span>
              </div>
              <span className="text-white font-bold text-base tracking-wide flex-1 whitespace-nowrap">
                Quad
              </span>
              <button
                onClick={onToggle}
                title="Collapse sidebar"
                className="p-1.5 rounded-lg text-white/30 hover:text-white/80 hover:bg-white/8 transition-colors flex-shrink-0"
              >
                <ChevronLeft size={15} />
              </button>
            </div>
          ) : (
            /* Collapsed: Q logo is the expand button */
            <button
              onClick={onToggle}
              title="Expand sidebar"
              className="w-full h-full flex items-center justify-center hover:bg-white/5 transition-colors"
            >
              <div className="w-8 h-8 rounded-lg bg-gradient-to-br from-[#6366f1] to-[#f59e0b] flex items-center justify-center pointer-events-none">
                <span className="text-white font-black text-sm leading-none">Q</span>
              </div>
            </button>
          )}
        </div>

        {/* Nav items */}
        <nav className="flex-1 flex flex-col gap-0.5 p-2 overflow-hidden">
          {NAV_ITEMS.map(item => (
            <NavItem
              key={item.href}
              {...item}
              expanded={expanded}
              isActive={item.href === '/' ? pathname === '/' : pathname.startsWith(item.href)}
            />
          ))}
        </nav>

        {/* Logout */}
        <div className="p-2 border-t border-white/[0.06] flex-shrink-0">
          <form action={logout}>
            <button
              type="submit"
              title={!expanded ? 'Sign out' : undefined}
              className="w-full flex items-center gap-3 px-3 py-2.5 rounded-xl text-white/30 hover:text-red-400 hover:bg-red-500/10 transition-colors duration-150"
            >
              <LogOut size={18} className="flex-shrink-0" />
              {expanded && (
                <span className="text-sm font-medium whitespace-nowrap">Sign out</span>
              )}
            </button>
          </form>
        </div>
      </aside>

      {/* ── Mobile bottom tab bar ── */}
      <nav className="md:hidden fixed bottom-0 left-0 right-0 bg-[#09090b] border-t border-white/[0.06] flex justify-around items-center h-16 z-50 px-2">
        {NAV_ITEMS.map(({ href, icon: Icon, label, hex }) => {
          const isActive = href === '/' ? pathname === '/' : pathname.startsWith(href)
          return (
            <Link
              key={href}
              href={href}
              style={isActive ? { color: hex } : undefined}
              className="flex flex-col items-center gap-0.5 flex-1 py-2 text-white/35 transition-colors duration-150"
            >
              <Icon size={20} />
              <span className="text-[10px] font-medium leading-none">{label}</span>
            </Link>
          )
        })}
      </nav>
    </>
  )
}
