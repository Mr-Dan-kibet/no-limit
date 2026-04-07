'use client'

import { useState } from 'react'
import { Goal, GoalStatus } from '@/types'
import { getStatusColor, getStatusLabel, cycleGoalStatus, formatDate } from '@/lib/utils'

interface GoalCardProps {
  goal: Goal
  onStatusChange: (goalId: string, newStatus: GoalStatus) => void
}

export default function GoalCard({ goal, onStatusChange }: GoalCardProps) {
  const [expanded, setExpanded] = useState(false)

  return (
    <div
      className="bg-space-black border border-border rounded-xl p-4 hover:border-border/80 transition-all cursor-pointer"
      onClick={() => setExpanded(!expanded)}
    >
      <div className="flex items-start justify-between gap-3">
        <div className="flex-1 min-w-0">
          <p className="text-sm font-medium text-text-primary truncate">{goal.name}</p>
          <div className="flex items-center gap-2 mt-1.5 flex-wrap">
            {goal.type && (
              <span className="text-[11px] text-text-muted bg-white/5 px-2 py-0.5 rounded border border-border">
                {goal.type}
              </span>
            )}
            {goal.timeline && (
              <span className="text-[11px] text-text-muted">{goal.timeline}</span>
            )}
          </div>
        </div>
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

      {expanded && goal.detail && (
        <div className="mt-3 pt-3 border-t border-border">
          <p className="text-sm text-text-muted leading-relaxed">{goal.detail}</p>
          {goal.due_date && (
            <p className="text-xs text-text-muted mt-2">
              <span className="text-coral">Due:</span> {formatDate(goal.due_date)}
            </p>
          )}
        </div>
      )}
    </div>
  )
}
