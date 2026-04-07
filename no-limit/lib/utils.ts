import { format, isToday, isTomorrow, isThisWeek, parseISO } from 'date-fns'
import { GoalStatus, ProjectStatus, EventType, ChecklistFrequency } from '@/types'

export function getGreeting(): string {
  const hour = new Date().getHours()
  if (hour < 12) return 'Good morning'
  if (hour < 17) return 'Good afternoon'
  return 'Good evening'
}

export function formatDate(dateStr: string): string {
  try {
    return format(parseISO(dateStr), 'MMM d, yyyy')
  } catch {
    return dateStr
  }
}

export function formatDateShort(dateStr: string): string {
  try {
    return format(parseISO(dateStr), 'MMM d')
  } catch {
    return dateStr
  }
}

export function getStatusColor(status: GoalStatus | ProjectStatus): string {
  switch (status) {
    case 'complete': return 'text-success bg-success/10 border-success/30'
    case 'in-progress': return 'text-coral bg-coral/10 border-coral/30'
    case 'parked': return 'text-text-muted bg-white/5 border-border'
    default: return 'text-text-muted bg-white/5 border-border'
  }
}

export function getStatusLabel(status: GoalStatus | ProjectStatus): string {
  switch (status) {
    case 'not-started': return 'Not Started'
    case 'in-progress': return 'In Progress'
    case 'complete': return 'Complete'
    case 'parked': return 'Parked'
    default: return status
  }
}

export function cycleGoalStatus(current: GoalStatus): GoalStatus {
  const cycle: GoalStatus[] = ['not-started', 'in-progress', 'complete']
  const idx = cycle.indexOf(current)
  if (idx === -1) return 'not-started'
  return cycle[(idx + 1) % cycle.length]
}

export function getEventTypeColor(type: EventType): string {
  switch (type) {
    case 'deadline': return '#FF6044'
    case 'milestone': return '#FFC107'
    case 'birthday': return '#4CAF50'
    case 'reminder': return '#888888'
    default: return '#FF6044'
  }
}

export function getEventTypeBg(type: EventType): string {
  switch (type) {
    case 'deadline': return 'bg-coral/20 text-coral border-coral/30'
    case 'milestone': return 'bg-warning/20 text-warning border-warning/30'
    case 'birthday': return 'bg-success/20 text-success border-success/30'
    case 'reminder': return 'bg-white/5 text-text-muted border-border'
    default: return 'bg-coral/20 text-coral border-coral/30'
  }
}

export function getYearProgress(startDate: string, endDate: string): number {
  const start = parseISO(startDate).getTime()
  const end = parseISO(endDate).getTime()
  const now = Date.now()
  if (now <= start) return 0
  if (now >= end) return 100
  return Math.round(((now - start) / (end - start)) * 100)
}

export function getChecklistPeriodStart(frequency: ChecklistFrequency): string {
  const now = new Date()
  switch (frequency) {
    case 'daily':
      return format(now, 'yyyy-MM-dd')
    case 'weekly': {
      const day = now.getDay()
      const diff = now.getDate() - day + (day === 0 ? -6 : 1)
      return format(new Date(now.setDate(diff)), 'yyyy-MM-dd')
    }
    case 'monthly':
      return format(new Date(now.getFullYear(), now.getMonth(), 1), 'yyyy-MM-dd')
    case 'quarterly': {
      const month = now.getMonth()
      const quarterStart = Math.floor(month / 3) * 3
      return format(new Date(now.getFullYear(), quarterStart, 1), 'yyyy-MM-dd')
    }
  }
}

export function clsx(...classes: (string | undefined | null | false)[]): string {
  return classes.filter(Boolean).join(' ')
}
