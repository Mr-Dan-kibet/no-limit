export interface Year {
  id: string
  label: string
  start_date: string
  end_date: string
  created_at: string
}

export interface GoalCategory {
  id: string
  name: string
  icon: string | null
  color: string | null
  year_id: string | null
  sort_order: number
  created_at: string
}

export type GoalStatus = 'not-started' | 'in-progress' | 'complete' | 'parked'
export type GoalType = 'one-off' | 'recurring' | 'multi-step' | 'milestone' | 'conditional' | 'carry-over' | 'fresh' | 'measurable' | 'ongoing'

export interface Goal {
  id: string
  category_id: string | null
  year_id: string | null
  name: string
  detail: string | null
  status: GoalStatus
  type: GoalType | null
  timeline: string | null
  due_date: string | null
  sort_order: number
  created_at: string
  goal_categories?: GoalCategory
}

export type ProjectStatus = 'not-started' | 'in-progress' | 'complete' | 'parked'
export type ProjectCategory = 'developer' | 'business' | 'learning' | 'other'

export interface Project {
  id: string
  name: string
  description: string | null
  category: ProjectCategory
  status: ProjectStatus
  year_id: string | null
  goal_id: string | null
  color: string
  created_at: string
  milestones?: Milestone[]
  goals?: Goal
}

export interface Milestone {
  id: string
  project_id: string
  name: string
  due_date: string | null
  completed: boolean
  completed_at: string | null
  notes: string | null
  sort_order: number
  created_at: string
}

export type EventType = 'deadline' | 'milestone' | 'birthday' | 'event' | 'reminder'

export interface CalendarEvent {
  id: string
  title: string
  date: string
  type: EventType
  color: string
  notes: string | null
  project_id: string | null
  goal_id: string | null
  recurring: string | null
  created_at: string
}

export type ChecklistFrequency = 'daily' | 'weekly' | 'monthly' | 'quarterly'

export interface Checklist {
  id: string
  title: string
  frequency: ChecklistFrequency
  sort_order: number
  active: boolean
  created_at: string
}

export interface ChecklistCompletion {
  id: string
  checklist_id: string
  completed_date: string
  created_at: string
}
