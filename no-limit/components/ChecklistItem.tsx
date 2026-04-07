'use client'

import { useState, useRef, useEffect } from 'react'
import { Checklist } from '@/types'
import { Pencil, Trash2, Check, Flame, X } from 'lucide-react'

interface ChecklistItemProps {
  checklist: Checklist
  isCompleted: boolean
  streak?: number
  onToggle: (checklistId: string, completed: boolean) => void
  onEdit: (checklistId: string, newTitle: string) => void
  onDelete: (checklistId: string) => void
}

export default function ChecklistItem({
  checklist,
  isCompleted,
  streak,
  onToggle,
  onEdit,
  onDelete,
}: ChecklistItemProps) {
  const [editing, setEditing] = useState(false)
  const [editValue, setEditValue] = useState(checklist.title)
  const [confirmDelete, setConfirmDelete] = useState(false)
  const inputRef = useRef<HTMLInputElement>(null)

  useEffect(() => {
    if (editing) inputRef.current?.focus()
  }, [editing])

  const handleSaveEdit = () => {
    const trimmed = editValue.trim()
    if (trimmed && trimmed !== checklist.title) {
      onEdit(checklist.id, trimmed)
    } else {
      setEditValue(checklist.title)
    }
    setEditing(false)
  }

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter') handleSaveEdit()
    if (e.key === 'Escape') {
      setEditValue(checklist.title)
      setEditing(false)
    }
  }

  return (
    <div
      className={`group flex items-center gap-3 p-3 rounded-xl border transition-all ${
        isCompleted
          ? 'border-success/20 bg-success/5'
          : 'border-border hover:border-coral/20 bg-surface'
      }`}
    >
      {/* Checkbox */}
      <button
        onClick={() => onToggle(checklist.id, !isCompleted)}
        className={`w-5 h-5 rounded-md border-2 flex items-center justify-center shrink-0 transition-all ${
          isCompleted
            ? 'bg-success border-success'
            : 'border-border hover:border-coral'
        }`}
      >
        {isCompleted && <Check size={11} strokeWidth={3} className="text-white" />}
      </button>

      {/* Title or edit input */}
      {editing ? (
        <input
          ref={inputRef}
          value={editValue}
          onChange={(e) => setEditValue(e.target.value)}
          onBlur={handleSaveEdit}
          onKeyDown={handleKeyDown}
          className="flex-1 bg-space-black border border-coral/40 rounded-lg px-2 py-1 text-sm text-text-primary focus:outline-none focus:border-coral"
        />
      ) : (
        <span
          className={`flex-1 text-sm ${
            isCompleted ? 'line-through text-text-muted' : 'text-text-primary'
          }`}
        >
          {checklist.title}
        </span>
      )}

      {/* Streak badge */}
      {!editing && checklist.frequency === 'daily' && streak !== undefined && streak > 1 && (
        <span className="flex items-center gap-1 text-xs text-warning bg-warning/10 border border-warning/20 px-2 py-0.5 rounded-full shrink-0">
          <Flame size={11} />
          {streak}d
        </span>
      )}

      {/* Actions */}
      {!editing && !confirmDelete && (
        <div className="flex items-center gap-1 opacity-0 group-hover:opacity-100 transition-opacity shrink-0">
          <button
            onClick={() => setEditing(true)}
            className="p-1.5 rounded-lg text-text-muted hover:text-coral hover:bg-coral/10 transition-all"
            title="Edit"
          >
            <Pencil size={13} />
          </button>
          <button
            onClick={() => setConfirmDelete(true)}
            className="p-1.5 rounded-lg text-text-muted hover:text-red-400 hover:bg-red-400/10 transition-all"
            title="Delete"
          >
            <Trash2 size={13} />
          </button>
        </div>
      )}

      {/* Delete confirm inline */}
      {confirmDelete && (
        <div className="flex items-center gap-2 shrink-0">
          <span className="text-xs text-text-muted">Delete?</span>
          <button
            onClick={() => onDelete(checklist.id)}
            className="flex items-center gap-1 text-xs text-red-400 bg-red-400/10 border border-red-400/20 px-2 py-1 rounded-lg hover:bg-red-400/20 transition-all"
          >
            <Trash2 size={11} /> Yes
          </button>
          <button
            onClick={() => setConfirmDelete(false)}
            className="p-1 rounded-lg text-text-muted hover:text-text-primary hover:bg-white/5 transition-all"
          >
            <X size={13} />
          </button>
        </div>
      )}
    </div>
  )
}
