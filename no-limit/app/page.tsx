'use client'

import { useEffect, useState } from 'react'
import { supabase } from '@/lib/supabase'
import { Goal, GoalCategory, Project, CalendarEvent, Checklist, ChecklistCompletion, Year } from '@/types'
import { getGreeting, getYearProgress, formatDateShort, getChecklistPeriodStart } from '@/lib/utils'
import { addDays, parseISO, isWithinInterval } from 'date-fns'
import Link from 'next/link'
import { Target, CheckCircle2, Zap, Rocket, CalendarClock, Flame, BarChart3 } from 'lucide-react'

export default function Dashboard() {
  const [goals, setGoals] = useState<Goal[]>([])
  const [categories, setCategories] = useState<GoalCategory[]>([])
  const [projects, setProjects] = useState<Project[]>([])
  const [events, setEvents] = useState<CalendarEvent[]>([])
  const [checklists, setChecklists] = useState<Checklist[]>([])
  const [completions, setCompletions] = useState<ChecklistCompletion[]>([])
  const [year, setYear] = useState<Year | null>(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    async function load() {
      const [
        { data: yearsData },
        { data: goalsData },
        { data: catsData },
        { data: projectsData },
        { data: eventsData },
        { data: checklistsData },
        { data: completionsData },
      ] = await Promise.all([
        supabase.from('years').select('*').limit(1).single(),
        supabase.from('goals').select('*'),
        supabase.from('goal_categories').select('*'),
        supabase.from('projects').select('*'),
        supabase.from('events').select('*'),
        supabase.from('checklists').select('*').eq('active', true).eq('frequency', 'daily'),
        supabase.from('checklist_completions').select('*').eq('completed_date', getChecklistPeriodStart('daily')),
      ])

      setYear(yearsData)
      setGoals(goalsData ?? [])
      setCategories(catsData ?? [])
      setProjects(projectsData ?? [])
      setEvents(eventsData ?? [])
      setChecklists(checklistsData ?? [])
      setCompletions(completionsData ?? [])
      setLoading(false)
    }
    load()
  }, [])

  const totalGoals = goals.length
  const completeGoals = goals.filter((g) => g.status === 'complete').length
  const inProgressGoals = goals.filter((g) => g.status === 'in-progress').length
  const activeProjects = projects.filter((p) => p.status === 'in-progress').length

  const now = new Date()
  const weekEnd = addDays(now, 7)
  const upcomingEvents = events.filter((e) => {
    try {
      const d = parseISO(e.date)
      return isWithinInterval(d, { start: now, end: weekEnd })
    } catch { return false }
  }).sort((a, b) => a.date.localeCompare(b.date))

  const todayStr = now.toISOString().split('T')[0]
  const todayGoals = goals.filter((g) => g.due_date === todayStr)
  const todayCompletedIds = new Set(completions.map((c) => c.checklist_id))
  const todayChecklists = checklists.slice(0, 5)

  const yearProgress = year ? getYearProgress(year.start_date, year.end_date) : 0

  const statCards = [
    { label: 'Total Goals',     value: totalGoals,      icon: Target,       accent: false },
    { label: 'Complete',        value: completeGoals,   icon: CheckCircle2, accent: false },
    { label: 'In Progress',     value: inProgressGoals, icon: Zap,          accent: true  },
    { label: 'Active Projects', value: activeProjects,  icon: Rocket,       accent: false },
  ]

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="w-8 h-8 border-2 border-coral/30 border-t-coral rounded-full animate-spin" />
      </div>
    )
  }

  return (
    <div className="space-y-6">
      {/* Greeting */}
      <div>
        <h1 className="font-heading text-2xl md:text-3xl font-bold">
          {getGreeting()}, <span className="text-coral">Dan</span> 👋
        </h1>
        <p className="text-text-muted mt-1 text-sm">Here's your day at a glance.</p>
      </div>

      {/* Stat cards */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
        {statCards.map((card) => {
          const Icon = card.icon
          return (
            <div
              key={card.label}
              className={`card flex flex-col gap-2 ${card.accent ? 'border-coral/30 bg-coral/5' : ''}`}
            >
              <Icon size={20} className={card.accent ? 'text-coral' : 'text-text-muted'} strokeWidth={1.8} />
              <span className={`text-2xl font-heading font-bold ${card.accent ? 'text-coral' : 'text-text-primary'}`}>
                {card.value}
              </span>
              <span className="text-xs text-text-muted">{card.label}</span>
            </div>
          )
        })}
      </div>

      {/* Year progress */}
      {year && (
        <div className="card">
          <div className="flex items-center justify-between mb-3">
            <div>
              <h2 className="font-heading font-semibold text-sm">Year Progress</h2>
              <p className="text-text-muted text-xs mt-0.5">{year.label}</p>
            </div>
            <span className="text-coral font-heading font-bold text-lg">{yearProgress}%</span>
          </div>
          <div className="progress-bar h-2">
            <div className="progress-fill" style={{ width: `${yearProgress}%` }} />
          </div>
        </div>
      )}

      <div className="grid md:grid-cols-2 gap-4">
        {/* Upcoming this week */}
        <div className="card">
          <h2 className="font-heading font-semibold mb-3 flex items-center gap-2">
            <CalendarClock size={16} className="text-coral" /> Upcoming this week
          </h2>
          {upcomingEvents.length === 0 ? (
            <p className="text-text-muted text-sm py-4 text-center">Nothing coming up this week</p>
          ) : (
            <div className="space-y-2">
              {upcomingEvents.slice(0, 5).map((event) => (
                <div key={event.id} className="flex items-center gap-3 p-2.5 rounded-lg bg-space-black border border-border">
                  <div className="w-1 h-8 rounded-full shrink-0" style={{ backgroundColor: event.color }} />
                  <div className="flex-1 min-w-0">
                    <p className="text-sm text-text-primary truncate">{event.title}</p>
                    <p className="text-xs text-text-muted capitalize">{event.type}</p>
                  </div>
                  <span className="text-xs text-text-muted shrink-0">{formatDateShort(event.date)}</span>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Focus today */}
        <div className="card">
          <h2 className="font-heading font-semibold mb-3 flex items-center gap-2">
            <Flame size={16} className="text-coral" /> Focus today
          </h2>
          <div className="space-y-2">
            {todayGoals.map((goal) => (
              <div key={goal.id} className="p-2.5 rounded-lg bg-space-black border border-border">
                <p className="text-sm text-text-primary">{goal.name}</p>
                <p className="text-xs text-coral mt-0.5">Goal due today</p>
              </div>
            ))}
            {todayChecklists.map((item) => (
              <div
                key={item.id}
                className={`flex items-center gap-3 p-2.5 rounded-lg bg-space-black border ${
                  todayCompletedIds.has(item.id) ? 'border-success/20' : 'border-border'
                }`}
              >
                <div className={`w-3 h-3 rounded-full shrink-0 ${
                  todayCompletedIds.has(item.id) ? 'bg-success' : 'bg-border'
                }`} />
                <p className={`text-sm ${todayCompletedIds.has(item.id) ? 'text-text-muted line-through' : 'text-text-primary'}`}>
                  {item.title}
                </p>
              </div>
            ))}
            {todayGoals.length === 0 && todayChecklists.length === 0 && (
              <p className="text-text-muted text-sm py-4 text-center">Nothing scheduled for today</p>
            )}
          </div>
          <Link href="/checklists" className="text-xs text-coral hover:underline mt-3 block">
            View all checklists →
          </Link>
        </div>
      </div>

      {/* Goals by category overview */}
      <div className="card">
        <h2 className="font-heading font-semibold mb-4 flex items-center gap-2">
          <BarChart3 size={16} className="text-coral" /> Goals by Category
        </h2>
        <div className="space-y-3">
          {categories.map((cat) => {
            const catGoals = goals.filter((g) => g.category_id === cat.id)
            const catComplete = catGoals.filter((g) => g.status === 'complete').length
            const progress = catGoals.length > 0 ? Math.round((catComplete / catGoals.length) * 100) : 0
            return (
              <div key={cat.id}>
                <div className="flex items-center justify-between mb-1">
                  <span className="text-sm text-text-primary flex items-center gap-2">
                    {cat.name}
                  </span>
                  <span className="text-xs text-text-muted">{catComplete}/{catGoals.length}</span>
                </div>
                <div className="progress-bar">
                  <div
                    className="h-full rounded-full transition-all duration-500"
                    style={{
                      width: `${progress}%`,
                      backgroundColor: cat.color ?? '#FF6044',
                    }}
                  />
                </div>
              </div>
            )
          })}
          {categories.length === 0 && (
            <p className="text-text-muted text-sm text-center py-4">No categories yet</p>
          )}
        </div>
      </div>
    </div>
  )
}
