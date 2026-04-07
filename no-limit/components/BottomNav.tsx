'use client'

import Link from 'next/link'
import { usePathname } from 'next/navigation'
import { LayoutDashboard, Target, FolderKanban, CalendarDays, ListTodo } from 'lucide-react'

const navLinks = [
  { href: '/',            label: 'Home',      icon: LayoutDashboard },
  { href: '/goals',       label: 'Goals',     icon: Target },
  { href: '/projects',    label: 'Projects',  icon: FolderKanban },
  { href: '/calendar',    label: 'Calendar',  icon: CalendarDays },
  { href: '/checklists',  label: 'Lists',     icon: ListTodo },
]

export default function BottomNav() {
  const pathname = usePathname()

  return (
    <nav className="md:hidden fixed bottom-0 left-0 right-0 bg-surface border-t border-border z-50">
      <div className="flex items-center justify-around px-2 py-2">
        {navLinks.map(({ href, label, icon: Icon }) => {
          const isActive = pathname === href
          return (
            <Link
              key={href}
              href={href}
              className={`flex flex-col items-center gap-1 px-3 py-1 rounded-lg transition-all ${
                isActive ? 'text-coral' : 'text-text-muted'
              }`}
            >
              <Icon size={20} strokeWidth={isActive ? 2.2 : 1.8} />
              <span className="text-[10px] font-medium">{label}</span>
            </Link>
          )
        })}
      </div>
    </nav>
  )
}
