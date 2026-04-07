'use client'

import { useEffect, useState, useCallback } from 'react'
import { supabase } from '@/lib/supabase'
import { Goal, GoalCategory, Year, GoalStatus } from '@/types'
import GoalCard from '@/components/GoalCard'
import Modal from '@/components/Modal'
import { getYearProgress } from '@/lib/utils'

const STATUS_FILTERS: { label: string; value: GoalStatus | 'all' }[] = [
  { label: 'All', value: 'all' },
  { label: 'Not Started', value: 'not-started' },
  { label: 'In Progress', value: 'in-progress' },
  { label: 'Complete', value: 'complete' },
  { label: 'Parked', value: 'parked' },
]

export default function GoalsPage() {
  const [years, setYears] = useState<Year[]>([])
  const [selectedYear, setSelectedYear] = useState<string>('')
  const [categories, setCategories] = useState<GoalCategory[]>([])
  const [goals, setGoals] = useState<Goal[]>([])
  const [filter, setFilter] = useState<GoalStatus | 'all'>('all')
  const [loading, setLoading] = useState(true)

  // Modals
  const [addGoalModal, setAddGoalModal] = useState<{ open: boolean; categoryId: string }>({ open: false, categoryId: '' })
  const [addCategoryModal, setAddCategoryModal] = useState(false)

  // Form states
  const [newGoal, setNewGoal] = useState({ name: '', detail: '', type: '', timeline: '', due_date: '', status: 'not-started' as GoalStatus })
  const [newCategory, setNewCategory] = useState({ name: '', icon: '', color: '#FF6044' })
  const [saving, setSaving] = useState(false)

  const loadData = useCallback(async (yearId: string) => {
    const [{ data: catsData }, { data: goalsData }] = await Promise.all([
      supabase.from('goal_categories').select('*').eq('year_id', yearId).order('sort_order'),
      supabase.from('goals').select('*').eq('year_id', yearId).order('sort_order'),
    ])
    setCategories(catsData ?? [])
    setGoals(goalsData ?? [])
    setLoading(false)
  }, [])

  useEffect(() => {
    supabase.from('years').select('*').order('start_date').then(({ data }) => {
      if (data && data.length > 0) {
        setYears(data)
        setSelectedYear(data[0].id)
        loadData(data[0].id)
      }
    })
  }, [loadData])

  useEffect(() => {
    if (selectedYear) loadData(selectedYear)
  }, [selectedYear, loadData])

  const handleStatusChange = async (goalId: string, newStatus: GoalStatus) => {
    setGoals((prev) => prev.map((g) => g.id === goalId ? { ...g, status: newStatus } : g))
    await supabase.from('goals').update({ status: newStatus }).eq('id', goalId)
  }

  const handleAddGoal = async () => {
    if (!newGoal.name.trim() || !addGoalModal.categoryId) return
    setSaving(true)
    const { data, error } = await supabase.from('goals').insert({
      name: newGoal.name.trim(),
      detail: newGoal.detail || null,
      type: newGoal.type || null,
      timeline: newGoal.timeline || null,
      due_date: newGoal.due_date || null,
      status: newGoal.status,
      category_id: addGoalModal.categoryId,
      year_id: selectedYear,
    }).select().single()
    if (!error && data) {
      setGoals((prev) => [...prev, data])
      setAddGoalModal({ open: false, categoryId: '' })
      setNewGoal({ name: '', detail: '', type: '', timeline: '', due_date: '', status: 'not-started' })
    }
    setSaving(false)
  }

  const handleAddCategory = async () => {
    if (!newCategory.name.trim()) return
    setSaving(true)
    const { data, error } = await supabase.from('goal_categories').insert({
      name: newCategory.name.trim(),
      icon: newCategory.icon || null,
      color: newCategory.color,
      year_id: selectedYear,
      sort_order: categories.length,
    }).select().single()
    if (!error && data) {
      setCategories((prev) => [...prev, data])
      setAddCategoryModal(false)
      setNewCategory({ name: '', icon: '', color: '#FF6044' })
    }
    setSaving(false)
  }

  const filteredGoals = (catId: string) =>
    goals.filter((g) => g.category_id === catId && (filter === 'all' || g.status === filter))

  const currentYear = years.find((y) => y.id === selectedYear)

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-start justify-between gap-4 flex-wrap">
        <div>
          <h1 className="font-heading text-2xl font-bold">Goals</h1>
          <p className="text-text-muted text-sm mt-0.5">Your yearly targets & milestones</p>
        </div>
        <div className="flex items-center gap-2">
          {years.length > 1 && (
            <select
              value={selectedYear}
              onChange={(e) => setSelectedYear(e.target.value)}
              className="input w-auto"
            >
              {years.map((y) => (
                <option key={y.id} value={y.id}>{y.label}</option>
              ))}
            </select>
          )}
          <button onClick={() => setAddCategoryModal(true)} className="btn-ghost border border-border">
            + Category
          </button>
        </div>
      </div>

      {/* Year progress bar */}
      {currentYear && (
        <div className="card">
          <div className="flex items-center justify-between mb-2">
            <span className="text-sm text-text-muted">{currentYear.label}</span>
            <span className="text-coral text-sm font-medium">
              {getYearProgress(currentYear.start_date, currentYear.end_date)}%
            </span>
          </div>
          <div className="progress-bar">
            <div className="progress-fill" style={{ width: `${getYearProgress(currentYear.start_date, currentYear.end_date)}%` }} />
          </div>
        </div>
      )}

      {/* Status filter */}
      <div className="flex gap-2 flex-wrap">
        {STATUS_FILTERS.map((f) => (
          <button
            key={f.value}
            onClick={() => setFilter(f.value)}
            className={`px-3 py-1.5 rounded-lg text-xs font-medium transition-all border ${
              filter === f.value
                ? 'bg-coral text-white border-coral'
                : 'text-text-muted border-border hover:text-text-primary hover:border-coral/30'
            }`}
          >
            {f.label}
          </button>
        ))}
      </div>

      {loading ? (
        <div className="flex items-center justify-center h-32">
          <div className="w-6 h-6 border-2 border-coral/30 border-t-coral rounded-full animate-spin" />
        </div>
      ) : categories.length === 0 ? (
        <div className="card text-center py-12">
          <p className="text-text-muted text-2xl mb-3">🎯</p>
          <p className="text-text-primary font-medium">No categories yet</p>
          <p className="text-text-muted text-sm mt-1">Add your first goal category to get started</p>
          <button onClick={() => setAddCategoryModal(true)} className="btn-primary mt-4">
            Add Category
          </button>
        </div>
      ) : (
        <div className="space-y-6">
          {categories.map((cat) => {
            const catGoals = goals.filter((g) => g.category_id === cat.id)
            const catComplete = catGoals.filter((g) => g.status === 'complete').length
            const progress = catGoals.length > 0 ? Math.round((catComplete / catGoals.length) * 100) : 0
            const shown = filteredGoals(cat.id)

            return (
              <div key={cat.id} className="card">
                {/* Category header */}
                <div className="flex items-center justify-between mb-3">
                  <div className="flex items-center gap-2">
                    {cat.icon && <span className="text-lg">{cat.icon}</span>}
                    <h2 className="font-heading font-semibold" style={{ color: cat.color ?? '#F5F5F5' }}>
                      {cat.name}
                    </h2>
                    <span className="text-xs text-text-muted bg-white/5 border border-border px-2 py-0.5 rounded-full">
                      {catComplete}/{catGoals.length}
                    </span>
                  </div>
                  <button
                    onClick={() => setAddGoalModal({ open: true, categoryId: cat.id })}
                    className="text-xs text-coral hover:underline"
                  >
                    + Add goal
                  </button>
                </div>

                {/* Progress */}
                <div className="progress-bar mb-4">
                  <div
                    className="h-full rounded-full transition-all duration-500"
                    style={{ width: `${progress}%`, backgroundColor: cat.color ?? '#FF6044' }}
                  />
                </div>

                {/* Goals */}
                {shown.length === 0 ? (
                  <p className="text-text-muted text-sm py-4 text-center">
                    {filter !== 'all' ? `No ${filter.replace('-', ' ')} goals in this category` : 'No goals yet — add your first one'}
                  </p>
                ) : (
                  <div className="space-y-2">
                    {shown.map((goal) => (
                      <GoalCard key={goal.id} goal={goal} onStatusChange={handleStatusChange} />
                    ))}
                  </div>
                )}
              </div>
            )
          })}
        </div>
      )}

      {/* Add Goal Modal */}
      <Modal
        isOpen={addGoalModal.open}
        onClose={() => setAddGoalModal({ open: false, categoryId: '' })}
        title="Add Goal"
      >
        <div className="space-y-4">
          <div>
            <label className="label">Goal name *</label>
            <input
              className="input"
              placeholder="What do you want to achieve?"
              value={newGoal.name}
              onChange={(e) => setNewGoal({ ...newGoal, name: e.target.value })}
            />
          </div>
          <div>
            <label className="label">Detail</label>
            <textarea
              className="input resize-none"
              rows={3}
              placeholder="Add context or description..."
              value={newGoal.detail}
              onChange={(e) => setNewGoal({ ...newGoal, detail: e.target.value })}
            />
          </div>
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="label">Type</label>
              <select
                className="input"
                value={newGoal.type}
                onChange={(e) => setNewGoal({ ...newGoal, type: e.target.value })}
              >
                <option value="">Select type</option>
                <option value="one-off">One-off</option>
                <option value="recurring">Recurring</option>
                <option value="multi-step">Multi-step</option>
                <option value="milestone">Milestone</option>
                <option value="conditional">Conditional</option>
                <option value="measurable">Measurable</option>
                <option value="ongoing">Ongoing</option>
              </select>
            </div>
            <div>
              <label className="label">Status</label>
              <select
                className="input"
                value={newGoal.status}
                onChange={(e) => setNewGoal({ ...newGoal, status: e.target.value as GoalStatus })}
              >
                <option value="not-started">Not Started</option>
                <option value="in-progress">In Progress</option>
                <option value="complete">Complete</option>
                <option value="parked">Parked</option>
              </select>
            </div>
          </div>
          <div>
            <label className="label">Timeline</label>
            <input
              className="input"
              placeholder="e.g. Q2 2026, By Dec 2026"
              value={newGoal.timeline}
              onChange={(e) => setNewGoal({ ...newGoal, timeline: e.target.value })}
            />
          </div>
          <div>
            <label className="label">Due date</label>
            <input
              type="date"
              className="input"
              value={newGoal.due_date}
              onChange={(e) => setNewGoal({ ...newGoal, due_date: e.target.value })}
            />
          </div>
          <div className="flex justify-end gap-2 pt-2">
            <button onClick={() => setAddGoalModal({ open: false, categoryId: '' })} className="btn-ghost">
              Cancel
            </button>
            <button onClick={handleAddGoal} disabled={saving || !newGoal.name.trim()} className="btn-primary">
              {saving ? 'Saving...' : 'Add Goal'}
            </button>
          </div>
        </div>
      </Modal>

      {/* Add Category Modal */}
      <Modal isOpen={addCategoryModal} onClose={() => setAddCategoryModal(false)} title="Add Category">
        <div className="space-y-4">
          <div>
            <label className="label">Category name *</label>
            <input
              className="input"
              placeholder="e.g. Learning, Business"
              value={newCategory.name}
              onChange={(e) => setNewCategory({ ...newCategory, name: e.target.value })}
            />
          </div>
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="label">Icon (emoji)</label>
              <input
                className="input"
                placeholder="e.g. 📚"
                value={newCategory.icon}
                onChange={(e) => setNewCategory({ ...newCategory, icon: e.target.value })}
              />
            </div>
            <div>
              <label className="label">Color</label>
              <input
                type="color"
                className="input h-10 cursor-pointer"
                value={newCategory.color}
                onChange={(e) => setNewCategory({ ...newCategory, color: e.target.value })}
              />
            </div>
          </div>
          <div className="flex justify-end gap-2 pt-2">
            <button onClick={() => setAddCategoryModal(false)} className="btn-ghost">Cancel</button>
            <button onClick={handleAddCategory} disabled={saving || !newCategory.name.trim()} className="btn-primary">
              {saving ? 'Saving...' : 'Add Category'}
            </button>
          </div>
        </div>
      </Modal>
    </div>
  )
}
