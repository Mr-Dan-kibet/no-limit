'use client'

import { useState } from 'react'
import Link from 'next/link'
import { usePathname, useRouter } from 'next/navigation'
import { LayoutDashboard, Target, FolderKanban, ListTodo, BarChart2, LogOut } from 'lucide-react'
import { supabase } from '@/lib/supabase'

const navLinks = [
  { href: '/',            label: 'Home',      icon: LayoutDashboard },
  { href: '/goals',       label: 'Goals',     icon: Target },
  { href: '/projects',    label: 'Projects',  icon: FolderKanban },
  { href: '/checklists',  label: 'Lists',     icon: ListTodo },
  { href: '/analytics',   label: 'Stats',     icon: BarChart2 },
]

export default function BottomNav() {
  const pathname = usePathname()
  const router = useRouter()
  const [signingOut, setSigningOut] = useState(false)

  const handleSignOut = async () => {
    setSigningOut(true)
    await supabase.auth.signOut()
    router.replace('/login')
    router.refresh()
  }

  return (
    <nav className="md:hidden fixed bottom-0 left-0 right-0 bg-surface border-t border-border z-50">
      <div className="flex items-center justify-around px-1 py-2">
        {navLinks.map(({ href, label, icon: Icon }) => {
          const isActive = pathname === href
          return (
            <Link
              key={href}
              href={href}
              className={`flex flex-col items-center gap-1 px-2 py-1 rounded-lg transition-all ${
                isActive ? 'text-coral' : 'text-text-muted'
              }`}
            >
              <Icon size={20} strokeWidth={isActive ? 2.2 : 1.8} />
              <span className="text-[10px] font-medium">{label}</span>
            </Link>
          )
        })}

        <button
          onClick={handleSignOut}
          disabled={signingOut}
          aria-label="Sign out"
          className="flex flex-col items-center gap-1 px-2 py-1 rounded-lg text-text-muted transition-all disabled:opacity-60"
        >
          <LogOut size={20} strokeWidth={1.8} />
          <span className="text-[10px] font-medium">Exit</span>
        </button>
      </div>
    </nav>
  )
}
