'use client'

import { useState } from 'react'
import { Goal, GoalStatus, GoalMilestone } from '@/types'
import { getStatusColor, getStatusLabel, cycleGoalStatus, formatDate } from '@/lib/utils'
import { ChevronDown, ChevronUp, Plus, Check } from 'lucide-react'
import { supabase } from '@/lib/supabase'

interface GoalCardProps {
  goal: Goal & { goal_milestones?: GoalMilestone[] }
  onStatusChange: (goalId: string, newStatus: GoalStatus) => void
}

export default function GoalCard({ goal, onStatusChange }: GoalCardProps) {
  const [expanded, setExpanded] = useState(false)
  const [milestones, setMilestones] = useState<GoalMilestone[]>(goal.goal_milestones ?? [])
  const [addingItem, setAddingItem] = useState(false)
  const [newItemName, setNewItemName] = useState('')
  const [saving, setSaving] = useState(false)

  const completedCount = milestones.filter((m) => m.completed).length
  const totalCount = milestones.length
  const progress = totalCount > 0 ? Math.round((completedCount / totalCount) * 100) : 0

  const handleToggleMilestone = async (milestoneId: string, completed: boolean) => {
    setMilestones((prev) =>
      prev.map((m) =>
        m.id === milestoneId
          ? { ...m, completed, completed_at: completed ? new Date().toISOString() : null }
          : m
      )
    )
    await supabase.from('goal_milestones').update({
      completed,
      completed_at: completed ? new Date().toISOString() : null,
    }).eq('id', milestoneId)
  }

  const handleAddItem = async () => {
    const trimmed = newItemName.trim()
    if (!trimmed) return
    setSaving(true)
    const { data, error } = await supabase.from('goal_milestones').insert({
      goal_id: goal.id,
      name: trimmed,
      sort_order: milestones.length,
    }).select().single()
    if (!error && data) {
      setMilestones((prev) => [...prev, data])
      setNewItemName('')
      setAddingItem(false)
    }
    setSaving(false)
  }

  return (
    <div className="bg-space-black border border-border rounded-xl transition-all hover:border-border/80">
      {/* Main row */}
      <div className="flex items-start gap-3 p-4">
        {/* Expand toggle */}
        <button
          onClick={() => setExpanded(!expanded)}
          className="text-text-muted hover:text-coral transition-colors mt-0.5 shrink-0"
        >
          {expanded
            ? <ChevronUp size={15} />
            : <ChevronDown size={15} />
          }
        </button>

        <div className="flex-1 min-w-0">
          <p className="text-sm font-medium text-text-primary">{goal.name}</p>

          {/* Tags + milestone mini counter */}
          <div className="flex items-center gap-2 mt-1.5 flex-wrap">
            {goal.type && (
              <span className="text-[11px] text-text-muted bg-white/5 px-2 py-0.5 rounded border border-border">
                {goal.type}
              </span>
            )}
            {goal.timeline && (
              <span className="text-[11px] text-text-muted">{goal.timeline}</span>
            )}
            {totalCount > 0 && (
              <span className="text-[11px] text-text-muted flex items-center gap-1">
                <Check size={10} className="text-coral" />
                {completedCount}/{totalCount}
              </span>
            )}
          </div>

          {/* Sub-item progress bar */}
          {totalCount > 0 && (
            <div className="mt-2 h-1 bg-border rounded-full overflow-hidden w-full">
              <div
                className="h-full bg-coral rounded-full transition-all duration-500"
                style={{ width: `${progress}%` }}
              />
            </div>
          )}
        </div>

        {/* Status badge */}
        <button
          className={`status-badge shrink-0 ${getStatusColor(goal.status)}`}
          onClick={(e) => {
            e.stopPropagation()
            onStatusChange(goal.id, cycleGoalStatus(goal.status))
          }}
        >
          {getStatusLabel(goal.status)}
        </button>
      </div>

      {/* Expanded panel */}
      {expanded && (
        <div className="border-t border-border px-4 pb-4 pt-3 space-y-3">
          {/* Detail text */}
          {goal.detail && (
            <p className="text-sm text-text-muted leading-relaxed">{goal.detail}</p>
          )}
          {goal.due_date && (
            <p className="text-xs text-text-muted">
              <span className="text-coral">Due:</span> {formatDate(goal.due_date)}
            </p>
          )}

          {/* Sub-items */}
          <div>
            <div className="flex items-center justify-between mb-2">
              <p className="text-xs font-medium text-text-muted uppercase tracking-wide">Sub-items</p>
              <button
                onClick={() => setAddingItem(true)}
                className="flex items-center gap-1 text-xs text-coral hover:underline"
              >
                <Plus size={12} /> Add
              </button>
            </div>

            {milestones.length === 0 && !addingItem ? (
              <p className="text-xs text-text-muted py-2 text-center">
                No sub-items yet —{' '}
                <button onClick={() => setAddingItem(true)} className="text-coral hover:underline">
                  add one
                </button>
              </p>
            ) : (
              <div className="space-y-1">
                {milestones.map((m) => (
                  <div
                    key={m.id}
                    className={`flex items-center gap-2.5 p-2 rounded-lg transition-all ${
                      m.completed ? 'opacity-60' : 'hover:bg-white/5'
                    }`}
                  >
                    <button
                      onClick={() => handleToggleMilestone(m.id, !m.completed)}
                      className={`w-4 h-4 rounded border-2 flex items-center justify-center shrink-0 transition-all ${
                        m.completed
                          ? 'bg-success border-success'
                          : 'border-border hover:border-coral'
                      }`}
                    >
                      {m.completed && <Check size={9} strokeWidth={3} className="text-white" />}
                    </button>
                    <span className={`text-sm flex-1 ${m.completed ? 'line-through text-text-muted' : 'text-text-primary'}`}>
                      {m.name}
                    </span>
                  </div>
                ))}
              </div>
            )}

            {/* Inline add input */}
            {addingItem && (
              <div className="flex items-center gap-2 mt-2">
                <input
                  className="input text-sm py-1.5 flex-1"
                  placeholder="e.g. Book 1: Atomic Habits"
                  value={newItemName}
                  onChange={(e) => setNewItemName(e.target.value)}
                  autoFocus
                  onKeyDown={(e) => {
                    if (e.key === 'Enter') handleAddItem()
                    if (e.key === 'Escape') {
                      setAddingItem(false)
                      setNewItemName('')
                    }
                  }}
                />
                <button
                  onClick={handleAddItem}
                  disabled={saving || !newItemName.trim()}
                  className="btn-primary py-1.5 px-3 text-xs"
                >
                  {saving ? '...' : 'Add'}
                </button>
                <button
                  onClick={() => { setAddingItem(false); setNewItemName('') }}
                  className="text-text-muted hover:text-text-primary text-xs"
                >
                  Cancel
                </button>
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  )
}
