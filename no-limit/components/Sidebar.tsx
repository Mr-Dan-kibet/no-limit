'use client'

import Link from 'next/link'
import { usePathname } from 'next/navigation'

const navLinks = [
  { href: '/', label: 'Dashboard', icon: '⚡' },
  { href: '/goals', label: 'Goals', icon: '🎯' },
  { href: '/projects', label: 'Projects', icon: '🚀' },
  { href: '/calendar', label: 'Calendar', icon: '📅' },
  { href: '/checklists', label: 'Checklists', icon: '✅' },
]

export default function Sidebar() {
  const pathname = usePathname()

  return (
    <aside className="hidden md:flex flex-col fixed left-0 top-0 h-full w-[220px] bg-surface border-r border-border z-50">
      {/* Logo */}
      <div className="p-5 border-b border-border">
        <h1 className="font-heading font-bold text-xl text-coral tracking-wider">NO LIMIT</h1>
        <p className="text-text-muted text-xs mt-0.5">Personal OS</p>
      </div>

      {/* Nav */}
      <nav className="flex-1 p-3 space-y-1">
        {navLinks.map((link) => {
          const isActive = pathname === link.href
          return (
            <Link
              key={link.href}
              href={link.href}
              className={`flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm font-medium transition-all ${
                isActive
                  ? 'bg-coral/10 text-coral border border-coral/20'
                  : 'text-text-muted hover:text-text-primary hover:bg-white/5'
              }`}
            >
              <span className="text-base">{link.icon}</span>
              {link.label}
            </Link>
          )
        })}
      </nav>

      {/* Footer */}
      <div className="p-4 border-t border-border">
        <p className="text-text-muted text-xs">April 2026 – March 2027</p>
      </div>
    </aside>
  )
}
