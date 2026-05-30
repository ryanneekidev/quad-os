'use client'

import { useState, useEffect } from 'react'
import { Sidebar } from '@/components/sidebar'

export function DashboardShell({ children }: { children: React.ReactNode }) {
  const [expanded, setExpanded] = useState(false)
  const [mounted, setMounted] = useState(false)

  useEffect(() => {
    const saved = localStorage.getItem('quad-sidebar')
    if (saved === '1') setExpanded(true)
    setMounted(true)
  }, [])

  function toggle() {
    setExpanded(prev => {
      const next = !prev
      localStorage.setItem('quad-sidebar', next ? '1' : '0')
      return next
    })
  }

  return (
    <div className="flex min-h-screen bg-background overflow-x-hidden">
      <Sidebar expanded={expanded} onToggle={toggle} />
      <main
        className={`min-w-0 flex-1 overflow-x-hidden pb-16 md:pb-0 transition-[margin] duration-300 ease-in-out ${
          mounted && expanded ? 'md:ml-[220px]' : 'md:ml-[60px]'
        }`}
      >
        {children}
      </main>
    </div>
  )
}
