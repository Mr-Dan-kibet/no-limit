'use client'

import { Milestone } from '@/types'
import { formatDateShort } from '@/lib/utils'

interface MilestoneItemProps {
  milestone: Milestone
  onToggle: (milestoneId: string, completed: boolean) => void
}

export default function MilestoneItem({ milestone, onToggle }: MilestoneItemProps) {
  return (
    <div className="flex items-start gap-3 p-3 rounded-lg hover:bg-white/5 transition-all group">
      <button
        onClick={() => onToggle(milestone.id, !milestone.completed)}
        className={`w-5 h-5 rounded border-2 flex items-center justify-center shrink-0 mt-0.5 transition-all ${
          milestone.completed
            ? 'bg-success border-success'
            : 'border-border hover:border-coral'
        }`}
      >
        {milestone.completed && (
          <svg className="w-3 h-3 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={3} d="M5 13l4 4L19 7" />
          </svg>
        )}
      </button>
      <div className="flex-1 min-w-0">
        <p className={`text-sm ${milestone.completed ? 'line-through text-text-muted' : 'text-text-primary'}`}>
          {milestone.name}
        </p>
        {milestone.notes && (
          <p className="text-xs text-text-muted mt-0.5">{milestone.notes}</p>
        )}
      </div>
      {milestone.due_date && (
        <span className="text-xs text-text-muted shrink-0">{formatDateShort(milestone.due_date)}</span>
      )}
    </div>
  )
}
