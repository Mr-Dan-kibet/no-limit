'use client'

import { useState } from 'react'
import { ChevronDown, ChevronUp, Clock, Pencil, Trash2, Plus } from 'lucide-react'
import { TimeBlock, TimeCategory, TimeEntry, Project, Goal } from '@/types'
import TimeEntryForm from './TimeEntryForm'
import { supabase } from '@/lib/supabase'
import { CategoryIcon } from '@/lib/categoryIcons'

interface Props {
  block: TimeBlock
  categories: TimeCategory[]
  projects: Project[]
  goals: Goal[]
  onDelete: (id: string) => void
  onUpdate: (block: TimeBlock) => void
  onEntryAdded: (entry: TimeEntry) => void
  onEntryDeleted: (entryId: string, blockId: string) => void
}

function to12h(time: string) {
  const [h, m] = time.split(':').map(Number)
  const period = h >= 12 ? 'PM' : 'AM'
  const hour = h % 12 || 12
  return `${hour}:${String(m).padStart(2, '0')} ${period}`
}

function blockDurationMinutes(block: TimeBlock) {
  const [sh, sm] = block.start_time.split(':').map(Number)
  const [eh, em] = block.end_time.split(':').map(Number)
  return (eh * 60 + em) - (sh * 60 + sm)
}

function fmtDuration(minutes: number) {
  if (minutes <= 0) return '0 min'
  const h = Math.floor(minutes / 60)
  const m = minutes % 60
  if (h === 0) return `${m}min`
  if (m === 0) return `${h}hr`
  return `${h}hr ${m}min`
}

export default function TimeBlockCard({ block, categories, projects, goals, onDelete, onUpdate, onEntryAdded, onEntryDeleted }: Props) {
  const [expanded, setExpanded] = useState(false)
  const [editing, setEditing] = useState(false)
  const [showEntryForm, setShowEntryForm] = useState(false)
  const [editForm, setEditForm] = useState({
    start_time: block.start_time.slice(0, 5),
    end_time: block.end_time.slice(0, 5),
    category_id: block.category_id ?? '',
    notes: block.notes ?? '',
  })
  const [saving, setSaving] = useState(false)

  const category = categories.find((c) => c.id === block.category_id)
  const entries = block.entries ?? []
  const totalDuration = blockDurationMinutes(block)
  const loggedMinutes = entries.reduce((sum, e) => sum + e.duration_minutes, 0)
  const remainingMinutes = totalDuration - loggedMinutes

  const handleSaveEdit = async () => {
    setSaving(true)
    const { data, error } = await supabase
      .from('time_blocks')
      .update({
        start_time: editForm.start_time,
        end_time: editForm.end_time,
        category_id: editForm.category_id || null,
        notes: editForm.notes || null,
      })
      .eq('id', block.id)
      .select('*, time_categories(*)')
      .single()
    if (!error && data) {
      onUpdate({ ...data, entries: block.entries })
      setEditing(false)
    }
    setSaving(false)
  }

  const handleDelete = async () => {
    await supabase.from('time_blocks').delete().eq('id', block.id)
    onDelete(block.id)
  }

  return (
    <div className="border border-border rounded-xl overflow-hidden">
      {/* Block header */}
      <div
        className="flex items-center gap-3 p-3 cursor-pointer hover:bg-white/5 transition-colors"
        onClick={() => setExpanded((p) => !p)}
      >
        {category && (
          <div className="w-1 h-10 rounded-full shrink-0" style={{ backgroundColor: category.color }} />
        )}
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-2 flex-wrap">
            <span className="text-sm font-medium text-text-primary">
              {to12h(block.start_time)} – {to12h(block.end_time)}
            </span>
            {category && (
              <span
                className="text-xs px-2 py-0.5 rounded-full font-medium flex items-center gap-1"
                style={{ backgroundColor: category.color + '22', color: category.color }}
              >
                <CategoryIcon name={category.name} size={11} color={category.color} />
                {category.name}
              </span>
            )}
          </div>
          <div className="flex items-center gap-3 mt-0.5">
            <span className="text-xs text-text-muted flex items-center gap-1">
              <Clock size={11} />
              {fmtDuration(totalDuration)}
            </span>
            {loggedMinutes > 0 && (
              <span className="text-xs text-text-muted">
                {fmtDuration(loggedMinutes)} logged
              </span>
            )}
            {remainingMinutes > 0 && (
              <span className="text-xs text-coral">
                {fmtDuration(remainingMinutes)} unlogged
              </span>
            )}
          </div>
        </div>
        <div className="flex items-center gap-1 shrink-0" onClick={(e) => e.stopPropagation()}>
          <button
            onClick={() => { setEditing((p) => !p); setExpanded(true) }}
            className="p-1.5 rounded-lg text-text-muted hover:text-text-primary hover:bg-white/10 transition-all"
          >
            <Pencil size={13} />
          </button>
          <button
            onClick={handleDelete}
            className="p-1.5 rounded-lg text-text-muted hover:text-red-400 hover:bg-red-400/10 transition-all"
          >
            <Trash2 size={13} />
          </button>
          {expanded ? <ChevronUp size={16} className="text-text-muted ml-1" /> : <ChevronDown size={16} className="text-text-muted ml-1" />}
        </div>
      </div>

      {/* Expanded content */}
      {expanded && (
        <div className="border-t border-border bg-space-black/50">
          {/* Edit form */}
          {editing && (
            <div className="p-3 border-b border-border space-y-3">
              <div className="grid grid-cols-2 gap-2">
                <div>
                  <label className="label text-xs">Start</label>
                  <input
                    type="time"
                    className="input text-sm py-1.5"
                    value={editForm.start_time}
                    onChange={(e) => setEditForm({ ...editForm, start_time: e.target.value })}
                  />
                </div>
                <div>
                  <label className="label text-xs">End</label>
                  <input
                    type="time"
                    className="input text-sm py-1.5"
                    value={editForm.end_time}
                    onChange={(e) => setEditForm({ ...editForm, end_time: e.target.value })}
                  />
                </div>
              </div>
              <div>
                <label className="label text-xs">Category</label>
                <select
                  className="input text-sm py-1.5"
                  value={editForm.category_id}
                  onChange={(e) => setEditForm({ ...editForm, category_id: e.target.value })}
                >
                  <option value="">No category</option>
                  {categories.map((c) => (
                    <option key={c.id} value={c.id}>{c.name}</option>
                  ))}
                </select>
              </div>
              <div>
                <label className="label text-xs">Notes</label>
                <input
                  className="input text-sm py-1.5"
                  placeholder="Optional note..."
                  value={editForm.notes}
                  onChange={(e) => setEditForm({ ...editForm, notes: e.target.value })}
                />
              </div>
              <div className="flex gap-2">
                <button onClick={() => setEditing(false)} className="btn-ghost text-xs py-1.5 px-3">Cancel</button>
                <button onClick={handleSaveEdit} disabled={saving} className="btn-primary text-xs py-1.5 px-3">
                  {saving ? 'Saving...' : 'Save'}
                </button>
              </div>
            </div>
          )}

          {/* Entries */}
          <div className="p-3 space-y-2">
            {entries.length === 0 ? (
              <p className="text-text-muted text-xs text-center py-2">No splits logged yet</p>
            ) : (
              entries.map((entry) => (
                <div key={entry.id} className="flex items-start gap-3 p-2.5 rounded-lg bg-surface border border-border">
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2 flex-wrap">
                      <span className="text-sm text-text-primary font-medium">
                        {entry.projects?.name ?? entry.goals?.name ?? 'General'}
                      </span>
                      {entry.activity_type && (
                        <span className="text-xs text-text-muted bg-white/5 border border-border px-1.5 py-0.5 rounded capitalize">
                          {entry.activity_type}
                        </span>
                      )}
                    </div>
                    {entry.notes && (
                      <p className="text-xs text-text-muted mt-0.5">{entry.notes}</p>
                    )}
                  </div>
                  <div className="flex items-center gap-2 shrink-0">
                    <span className="text-xs font-medium text-text-primary">{fmtDuration(entry.duration_minutes)}</span>
                    <button
                      onClick={() => onEntryDeleted(entry.id, block.id)}
                      className="p-1 rounded text-text-muted hover:text-red-400 hover:bg-red-400/10 transition-all"
                    >
                      <Trash2 size={11} />
                    </button>
                  </div>
                </div>
              ))
            )}

            {/* Progress bar */}
            {totalDuration > 0 && (
              <div className="mt-2">
                <div className="h-1 rounded-full bg-border overflow-hidden">
                  <div
                    className="h-full rounded-full transition-all duration-300"
                    style={{
                      width: `${Math.min(100, (loggedMinutes / totalDuration) * 100)}%`,
                      backgroundColor: category?.color ?? '#FF6044',
                    }}
                  />
                </div>
                <div className="flex justify-between mt-1">
                  <span className="text-xs text-text-muted">{fmtDuration(loggedMinutes)} logged</span>
                  <span className={`text-xs ${remainingMinutes > 0 ? 'text-coral' : 'text-success'}`}>
                    {remainingMinutes > 0 ? `${fmtDuration(remainingMinutes)} remaining` : 'Fully logged'}
                  </span>
                </div>
              </div>
            )}

            {/* Add split */}
            {showEntryForm ? (
              <TimeEntryForm
                block={block}
                projects={projects}
                goals={goals}
                remainingMinutes={remainingMinutes}
                onAdded={(entry) => { onEntryAdded(entry); setShowEntryForm(false) }}
                onCancel={() => setShowEntryForm(false)}
              />
            ) : (
              <button
                onClick={() => setShowEntryForm(true)}
                className="flex items-center gap-2 text-xs text-coral hover:underline mt-1"
              >
                <Plus size={13} /> Add split
              </button>
            )}
          </div>
        </div>
      )}
    </div>
  )
}
