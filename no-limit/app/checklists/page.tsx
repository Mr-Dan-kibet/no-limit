'use client'

import { useEffect, useState, useCallback } from 'react'
import { supabase } from '@/lib/supabase'
import { Checklist, ChecklistCompletion, ChecklistFrequency } from '@/types'
import ChecklistItem from '@/components/ChecklistItem'
import Modal from '@/components/Modal'
import { getChecklistPeriodStart } from '@/lib/utils'
import { parseISO, differenceInDays } from 'date-fns'
import { Plus, ListTodo } from 'lucide-react'

const TABS: { label: string; value: ChecklistFrequency }[] = [
  { label: 'Daily', value: 'daily' },
  { label: 'Weekly', value: 'weekly' },
  { label: 'Monthly', value: 'monthly' },
  { label: 'Quarterly', value: 'quarterly' },
]

function getStreak(checklistId: string, completions: ChecklistCompletion[]): number {
  const sorted = completions
    .filter((c) => c.checklist_id === checklistId)
    .map((c) => c.completed_date)
    .sort((a, b) => b.localeCompare(a))

  if (sorted.length === 0) return 0

  let streak = 0
  let current = new Date()

  for (const dateStr of sorted) {
    const d = parseISO(dateStr)
    const diff = differenceInDays(current, d)
    if (diff <= 1) {
      streak++
      current = d
    } else {
      break
    }
  }
  return streak
}

export default function ChecklistsPage() {
  const [tab, setTab] = useState<ChecklistFrequency>('daily')
  const [checklists, setChecklists] = useState<Checklist[]>([])
  const [completions, setCompletions] = useState<ChecklistCompletion[]>([])
  const [allCompletions, setAllCompletions] = useState<ChecklistCompletion[]>([])
  const [loading, setLoading] = useState(true)
  const [modal, setModal] = useState(false)
  const [newItem, setNewItem] = useState({ title: '' })
  const [saving, setSaving] = useState(false)

  const loadCompletions = useCallback(async (frequency: ChecklistFrequency) => {
    const periodStart = getChecklistPeriodStart(frequency)
    const { data } = await supabase
      .from('checklist_completions')
      .select('*')
      .gte('completed_date', periodStart)
    setCompletions(data ?? [])
  }, [])

  useEffect(() => {
    async function load() {
      const [{ data: checklistsData }, { data: allCompData }] = await Promise.all([
        supabase.from('checklists').select('*').eq('active', true).order('sort_order'),
        supabase.from('checklist_completions').select('*').order('completed_date', { ascending: false }).limit(500),
      ])
      setChecklists(checklistsData ?? [])
      setAllCompletions(allCompData ?? [])
      await loadCompletions('daily')
      setLoading(false)
    }
    load()
  }, [loadCompletions])

  useEffect(() => {
    loadCompletions(tab)
  }, [tab, loadCompletions])

  const handleToggle = async (checklistId: string, completed: boolean) => {
    const today = getChecklistPeriodStart(tab)
    if (completed) {
      const { data } = await supabase.from('checklist_completions').insert({
        checklist_id: checklistId,
        completed_date: today,
      }).select().single()
      if (data) {
        setCompletions((prev) => [...prev, data])
        setAllCompletions((prev) => [...prev, data])
      }
    } else {
      await supabase.from('checklist_completions')
        .delete()
        .eq('checklist_id', checklistId)
        .eq('completed_date', today)
      setCompletions((prev) => prev.filter((c) => !(c.checklist_id === checklistId && c.completed_date === today)))
      setAllCompletions((prev) => prev.filter((c) => !(c.checklist_id === checklistId && c.completed_date === today)))
    }
  }

  const handleEdit = async (checklistId: string, newTitle: string) => {
    setChecklists((prev) => prev.map((c) => c.id === checklistId ? { ...c, title: newTitle } : c))
    await supabase.from('checklists').update({ title: newTitle }).eq('id', checklistId)
  }

  const handleDelete = async (checklistId: string) => {
    setChecklists((prev) => prev.filter((c) => c.id !== checklistId))
    await supabase.from('checklists').delete().eq('id', checklistId)
  }

  const handleAddItem = async () => {
    if (!newItem.title.trim()) return
    setSaving(true)
    const existing = checklists.filter((c) => c.frequency === tab)
    const { data, error } = await supabase.from('checklists').insert({
      title: newItem.title.trim(),
      frequency: tab,
      sort_order: existing.length,
      active: true,
    }).select().single()
    if (!error && data) {
      setChecklists((prev) => [...prev, data])
      setModal(false)
      setNewItem({ title: '' })
    }
    setSaving(false)
  }

  const tabItems = checklists.filter((c) => c.frequency === tab)
  const completedIds = new Set(completions.map((c) => c.checklist_id))
  const completedCount = tabItems.filter((c) => completedIds.has(c.id)).length

  return (
    <div className="space-y-6">
      <div className="flex items-start justify-between gap-4 flex-wrap">
        <div>
          <h1 className="font-heading text-2xl font-bold">Checklists</h1>
          <p className="text-text-muted text-sm mt-0.5">Daily habits & recurring reviews</p>
        </div>
        <button onClick={() => setModal(true)} className="btn-primary flex items-center gap-2">
          <Plus size={15} /> Add Item
        </button>
      </div>

      {/* Tabs */}
      <div className="flex gap-1 bg-surface border border-border rounded-xl p-1 w-fit">
        {TABS.map((t) => (
          <button
            key={t.value}
            onClick={() => setTab(t.value)}
            className={`px-4 py-2 rounded-lg text-sm font-medium transition-all ${
              tab === t.value
                ? 'bg-coral text-white shadow-sm'
                : 'text-text-muted hover:text-text-primary'
            }`}
          >
            {t.label}
          </button>
        ))}
      </div>

      {/* Progress summary */}
      {tabItems.length > 0 && (
        <div className="card">
          <div className="flex items-center justify-between mb-2">
            <span className="text-sm text-text-muted capitalize">{tab} progress</span>
            <span className="text-coral font-medium text-sm">{completedCount}/{tabItems.length}</span>
          </div>
          <div className="progress-bar h-2">
            <div
              className="progress-fill"
              style={{ width: `${tabItems.length > 0 ? Math.round((completedCount / tabItems.length) * 100) : 0}%` }}
            />
          </div>
        </div>
      )}

      {loading ? (
        <div className="flex justify-center py-12">
          <div className="w-6 h-6 border-2 border-coral/30 border-t-coral rounded-full animate-spin" />
        </div>
      ) : tabItems.length === 0 ? (
        <div className="card text-center py-12">
          <div className="flex justify-center mb-3"><ListTodo size={32} className="text-text-muted" strokeWidth={1.5} /></div>
          <p className="text-text-primary font-medium">No {tab} items yet</p>
          <p className="text-text-muted text-sm mt-1">Add your first {tab} checklist item</p>
          <button onClick={() => setModal(true)} className="btn-primary mt-4">Add Item</button>
        </div>
      ) : (
        <div className="space-y-2">
          {tabItems.map((item) => (
            <ChecklistItem
              key={item.id}
              checklist={item}
              isCompleted={completedIds.has(item.id)}
              streak={tab === 'daily' ? getStreak(item.id, allCompletions) : undefined}
              onToggle={handleToggle}
              onEdit={handleEdit}
              onDelete={handleDelete}
            />
          ))}
        </div>
      )}

      <Modal isOpen={modal} onClose={() => setModal(false)} title={`Add ${tab.charAt(0).toUpperCase() + tab.slice(1)} Item`}>
        <div className="space-y-4">
          <div>
            <label className="label">Item name *</label>
            <input
              className="input"
              placeholder="What needs to happen?"
              value={newItem.title}
              onChange={(e) => setNewItem({ title: e.target.value })}
              autoFocus
              onKeyDown={(e) => { if (e.key === 'Enter') handleAddItem() }}
            />
          </div>
          <p className="text-text-muted text-xs">This will be added to your <span className="text-coral">{tab}</span> checklist.</p>
          <div className="flex justify-end gap-2 pt-2">
            <button onClick={() => setModal(false)} className="btn-ghost">Cancel</button>
            <button onClick={handleAddItem} disabled={saving || !newItem.title.trim()} className="btn-primary">
              {saving ? 'Adding...' : 'Add Item'}
            </button>
          </div>
        </div>
      </Modal>
    </div>
  )
}
