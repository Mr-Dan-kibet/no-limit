'use client'

import { useState } from 'react'
import { supabase } from '@/lib/supabase'
import { TimeBlock, TimeEntry, Project, Goal } from '@/types'

const ACTIVITY_TYPES = [
  'research', 'calls', 'planning', 'coding', 'reading',
  'admin', 'meetings', 'exercise', 'travel', 'rest', 'other',
]

interface Props {
  block: TimeBlock
  projects: Project[]
  goals: Goal[]
  remainingMinutes: number
  onAdded: (entry: TimeEntry) => void
  onCancel: () => void
}

export default function TimeEntryForm({ block, projects, goals, remainingMinutes, onAdded, onCancel }: Props) {
  const [form, setForm] = useState({
    link_type: 'project' as 'project' | 'goal' | 'none',
    project_id: '',
    goal_id: '',
    activity_type: '',
    duration_minutes: '',
    notes: '',
  })
  const [saving, setSaving] = useState(false)
  const [error, setError] = useState('')

  const duration = parseInt(form.duration_minutes) || 0

  const handleSave = async () => {
    if (duration <= 0) { setError('Enter a duration'); return }
    if (duration > remainingMinutes) { setError(`Max ${remainingMinutes} min remaining in this block`); return }
    setSaving(true)
    setError('')

    const payload = {
      block_id: block.id,
      project_id: form.link_type === 'project' && form.project_id ? form.project_id : null,
      goal_id: form.link_type === 'goal' && form.goal_id ? form.goal_id : null,
      activity_type: form.activity_type || null,
      duration_minutes: duration,
      notes: form.notes || null,
    }

    const { data, error: err } = await supabase
      .from('time_entries')
      .insert(payload)
      .select('*, projects(id, name), goals(id, name)')
      .single()

    if (!err && data) {
      onAdded(data as TimeEntry)
    } else {
      setError('Failed to save. Try again.')
    }
    setSaving(false)
  }

  return (
    <div className="border border-border rounded-lg p-3 space-y-3 bg-surface mt-2">
      <p className="text-xs font-medium text-text-muted uppercase tracking-wide">Add Split</p>

      <div className="grid grid-cols-3 gap-1">
        {(['project', 'goal', 'none'] as const).map((t) => (
          <button
            key={t}
            onClick={() => setForm({ ...form, link_type: t })}
            className={`text-xs py-1.5 rounded-lg border transition-all capitalize ${
              form.link_type === t
                ? 'bg-coral/10 text-coral border-coral/30'
                : 'text-text-muted border-border hover:border-coral/20'
            }`}
          >
            {t === 'none' ? 'General' : t}
          </button>
        ))}
      </div>

      {form.link_type === 'project' && (
        <select
          className="input text-sm py-1.5"
          value={form.project_id}
          onChange={(e) => setForm({ ...form, project_id: e.target.value })}
        >
          <option value="">Select project...</option>
          {projects.map((p) => (
            <option key={p.id} value={p.id}>{p.name}</option>
          ))}
        </select>
      )}

      {form.link_type === 'goal' && (
        <select
          className="input text-sm py-1.5"
          value={form.goal_id}
          onChange={(e) => setForm({ ...form, goal_id: e.target.value })}
        >
          <option value="">Select goal...</option>
          {goals.map((g) => (
            <option key={g.id} value={g.id}>{g.name}</option>
          ))}
        </select>
      )}

      <div className="grid grid-cols-2 gap-2">
        <div>
          <label className="label text-xs">Activity type</label>
          <select
            className="input text-sm py-1.5"
            value={form.activity_type}
            onChange={(e) => setForm({ ...form, activity_type: e.target.value })}
          >
            <option value="">Select...</option>
            {ACTIVITY_TYPES.map((t) => (
              <option key={t} value={t} className="capitalize">{t}</option>
            ))}
          </select>
        </div>
        <div>
          <label className="label text-xs">Duration (min)</label>
          <input
            type="number"
            className="input text-sm py-1.5"
            placeholder={`max ${remainingMinutes}`}
            min={1}
            max={remainingMinutes}
            value={form.duration_minutes}
            onChange={(e) => { setForm({ ...form, duration_minutes: e.target.value }); setError('') }}
          />
        </div>
      </div>

      <div>
        <label className="label text-xs">Notes (optional)</label>
        <input
          className="input text-sm py-1.5"
          placeholder="Quick note..."
          value={form.notes}
          onChange={(e) => setForm({ ...form, notes: e.target.value })}
        />
      </div>

      {error && <p className="text-xs text-red-400">{error}</p>}

      <div className="flex gap-2">
        <button onClick={onCancel} className="btn-ghost text-xs py-1.5 px-3">Cancel</button>
        <button onClick={handleSave} disabled={saving || duration <= 0} className="btn-primary text-xs py-1.5 px-3">
          {saving ? 'Saving...' : 'Add Split'}
        </button>
      </div>
    </div>
  )
}
