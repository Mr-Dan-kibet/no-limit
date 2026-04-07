'use client'

import { Checklist } from '@/types'

interface ChecklistItemProps {
  checklist: Checklist
  isCompleted: boolean
  streak?: number
  onToggle: (checklistId: string, completed: boolean) => void
}

export default function ChecklistItem({ checklist, isCompleted, streak, onToggle }: ChecklistItemProps) {
  return (
    <div className={`flex items-center gap-3 p-3 rounded-xl border transition-all ${
      isCompleted ? 'border-success/20 bg-success/5' : 'border-border hover:border-coral/20'
    }`}>
      <button
        onClick={() => onToggle(checklist.id, !isCompleted)}
        className={`w-5 h-5 rounded border-2 flex items-center justify-center shrink-0 transition-all ${
          isCompleted
            ? 'bg-success border-success'
            : 'border-border hover:border-coral'
        }`}
      >
        {isCompleted && (
          <svg className="w-3 h-3 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={3} d="M5 13l4 4L19 7" />
          </svg>
        )}
      </button>
      <span className={`flex-1 text-sm ${isCompleted ? 'line-through text-text-muted' : 'text-text-primary'}`}>
        {checklist.title}
      </span>
      {checklist.frequency === 'daily' && streak !== undefined && streak > 1 && (
        <span className="text-xs text-warning bg-warning/10 border border-warning/20 px-2 py-0.5 rounded-full">
          🔥 {streak}d
        </span>
      )}
    </div>
  )
}
