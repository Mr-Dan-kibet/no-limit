'use client'

import { useEffect, useState } from 'react'
import { supabase } from '@/lib/supabase'
import { CalendarEvent, EventType, Project, Goal } from '@/types'
import CalendarGrid from '@/components/CalendarGrid'
import Modal from '@/components/Modal'
import { getEventTypeBg } from '@/lib/utils'

export default function CalendarPage() {
  const [events, setEvents] = useState<CalendarEvent[]>([])
  const [projects, setProjects] = useState<Pick<Project, 'id' | 'name'>[]>([])
  const [goals, setGoals] = useState<Pick<Goal, 'id' | 'name'>[]>([])
  const [loading, setLoading] = useState(true)
  const [modal, setModal] = useState(false)
  const [newEvent, setNewEvent] = useState({
    title: '', date: '', type: 'event' as EventType,
    notes: '', project_id: '', goal_id: '', recurring: '',
  })
  const [saving, setSaving] = useState(false)

  useEffect(() => {
    async function load() {
      const [{ data: eventsData }, { data: projectsData }, { data: goalsData }] = await Promise.all([
        supabase.from('events').select('*').order('date'),
        supabase.from('projects').select('id, name'),
        supabase.from('goals').select('id, name'),
      ])
      setEvents(eventsData ?? [])
      setProjects(projectsData ?? [])
      setGoals(goalsData ?? [])
      setLoading(false)
    }
    load()
  }, [])

  const handleAddEvent = async () => {
    if (!newEvent.title.trim() || !newEvent.date) return
    setSaving(true)

    const typeColors: Record<EventType, string> = {
      deadline: '#FF6044',
      milestone: '#FFC107',
      birthday: '#4CAF50',
      event: '#FF6044',
      reminder: '#888888',
    }

    const { data, error } = await supabase.from('events').insert({
      title: newEvent.title.trim(),
      date: newEvent.date,
      type: newEvent.type,
      color: typeColors[newEvent.type],
      notes: newEvent.notes || null,
      project_id: newEvent.project_id || null,
      goal_id: newEvent.goal_id || null,
      recurring: newEvent.recurring || null,
    }).select().single()

    if (!error && data) {
      setEvents((prev) => [...prev, data].sort((a, b) => a.date.localeCompare(b.date)))
      setModal(false)
      setNewEvent({ title: '', date: '', type: 'event', notes: '', project_id: '', goal_id: '', recurring: '' })
    }
    setSaving(false)
  }

  const openAddEvent = (date: string) => {
    setNewEvent((prev) => ({ ...prev, date }))
    setModal(true)
  }

  if (loading) {
    return (
      <div className="flex justify-center py-20">
        <div className="w-6 h-6 border-2 border-coral/30 border-t-coral rounded-full animate-spin" />
      </div>
    )
  }

  return (
    <div className="space-y-6">
      <div className="flex items-start justify-between gap-4 flex-wrap">
        <div>
          <h1 className="font-heading text-2xl font-bold">Calendar</h1>
          <p className="text-text-muted text-sm mt-0.5">Deadlines, milestones & key dates</p>
        </div>
        <button onClick={() => setModal(true)} className="btn-primary">+ Add Event</button>
      </div>

      {/* Legend */}
      <div className="flex items-center gap-3 flex-wrap">
        {(['deadline', 'milestone', 'birthday', 'event', 'reminder'] as EventType[]).map((type) => (
          <span key={type} className={`status-badge ${getEventTypeBg(type)} capitalize`}>
            {type}
          </span>
        ))}
      </div>

      <CalendarGrid events={events} onAddEvent={openAddEvent} />

      <Modal isOpen={modal} onClose={() => setModal(false)} title="Add Event">
        <div className="space-y-4">
          <div>
            <label className="label">Title *</label>
            <input
              className="input"
              placeholder="Event title"
              value={newEvent.title}
              onChange={(e) => setNewEvent({ ...newEvent, title: e.target.value })}
            />
          </div>
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="label">Date *</label>
              <input
                type="date"
                className="input"
                value={newEvent.date}
                onChange={(e) => setNewEvent({ ...newEvent, date: e.target.value })}
              />
            </div>
            <div>
              <label className="label">Type</label>
              <select
                className="input"
                value={newEvent.type}
                onChange={(e) => setNewEvent({ ...newEvent, type: e.target.value as EventType })}
              >
                <option value="event">Event</option>
                <option value="deadline">Deadline</option>
                <option value="milestone">Milestone</option>
                <option value="birthday">Birthday</option>
                <option value="reminder">Reminder</option>
              </select>
            </div>
          </div>
          <div>
            <label className="label">Notes</label>
            <textarea
              className="input resize-none"
              rows={2}
              placeholder="Optional notes..."
              value={newEvent.notes}
              onChange={(e) => setNewEvent({ ...newEvent, notes: e.target.value })}
            />
          </div>
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="label">Link to Project</label>
              <select
                className="input"
                value={newEvent.project_id}
                onChange={(e) => setNewEvent({ ...newEvent, project_id: e.target.value })}
              >
                <option value="">None</option>
                {projects.map((p) => <option key={p.id} value={p.id}>{p.name}</option>)}
              </select>
            </div>
            <div>
              <label className="label">Link to Goal</label>
              <select
                className="input"
                value={newEvent.goal_id}
                onChange={(e) => setNewEvent({ ...newEvent, goal_id: e.target.value })}
              >
                <option value="">None</option>
                {goals.map((g) => <option key={g.id} value={g.id}>{g.name}</option>)}
              </select>
            </div>
          </div>
          <div>
            <label className="label">Recurring</label>
            <select
              className="input"
              value={newEvent.recurring}
              onChange={(e) => setNewEvent({ ...newEvent, recurring: e.target.value })}
            >
              <option value="">No recurrence</option>
              <option value="daily">Daily</option>
              <option value="weekly">Weekly</option>
              <option value="monthly">Monthly</option>
              <option value="yearly">Yearly</option>
            </select>
          </div>
          <div className="flex justify-end gap-2 pt-2">
            <button onClick={() => setModal(false)} className="btn-ghost">Cancel</button>
            <button
              onClick={handleAddEvent}
              disabled={saving || !newEvent.title.trim() || !newEvent.date}
              className="btn-primary"
            >
              {saving ? 'Saving...' : 'Add Event'}
            </button>
          </div>
        </div>
      </Modal>
    </div>
  )
}
