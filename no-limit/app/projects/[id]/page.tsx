'use client'

import { useEffect, useState } from 'react'
import { useParams, useRouter } from 'next/navigation'
import { supabase } from '@/lib/supabase'
import { Project, Milestone, Goal, ProjectStatus } from '@/types'
import MilestoneItem from '@/components/MilestoneItem'
import { getStatusColor, getStatusLabel } from '@/lib/utils'

export default function ProjectDetailPage() {
  const { id } = useParams<{ id: string }>()
  const router = useRouter()
  const [project, setProject] = useState<Project | null>(null)
  const [milestones, setMilestones] = useState<Milestone[]>([])
  const [linkedGoal, setLinkedGoal] = useState<Goal | null>(null)
  const [loading, setLoading] = useState(true)
  const [editingStatus, setEditingStatus] = useState(false)
  const [newMilestone, setNewMilestone] = useState({ name: '', due_date: '', notes: '' })
  const [addingMilestone, setAddingMilestone] = useState(false)

  useEffect(() => {
    async function load() {
      const [{ data: projectData }, { data: milestonesData }] = await Promise.all([
        supabase.from('projects').select('*').eq('id', id).single(),
        supabase.from('milestones').select('*').eq('project_id', id).order('sort_order'),
      ])
      setProject(projectData)
      setMilestones(milestonesData ?? [])

      if (projectData?.goal_id) {
        const { data: goalData } = await supabase.from('goals').select('*').eq('id', projectData.goal_id).single()
        setLinkedGoal(goalData)
      }
      setLoading(false)
    }
    load()
  }, [id])

  const handleStatusChange = async (newStatus: ProjectStatus) => {
    if (!project) return
    setProject({ ...project, status: newStatus })
    setEditingStatus(false)
    await supabase.from('projects').update({ status: newStatus }).eq('id', id)
  }

  const handleMilestoneToggle = async (milestoneId: string, completed: boolean) => {
    setMilestones((prev) =>
      prev.map((m) =>
        m.id === milestoneId
          ? { ...m, completed, completed_at: completed ? new Date().toISOString() : null }
          : m
      )
    )
    await supabase.from('milestones').update({
      completed,
      completed_at: completed ? new Date().toISOString() : null,
    }).eq('id', milestoneId)
  }

  const handleAddMilestone = async () => {
    if (!newMilestone.name.trim() || !project) return
    const { data, error } = await supabase.from('milestones').insert({
      project_id: project.id,
      name: newMilestone.name.trim(),
      due_date: newMilestone.due_date || null,
      notes: newMilestone.notes || null,
      sort_order: milestones.length,
    }).select().single()
    if (!error && data) {
      setMilestones((prev) => [...prev, data])
      setNewMilestone({ name: '', due_date: '', notes: '' })
      setAddingMilestone(false)
    }
  }

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="w-8 h-8 border-2 border-coral/30 border-t-coral rounded-full animate-spin" />
      </div>
    )
  }

  if (!project) {
    return (
      <div className="text-center py-20">
        <p className="text-text-muted">Project not found</p>
        <button onClick={() => router.push('/projects')} className="btn-primary mt-4">Back to Projects</button>
      </div>
    )
  }

  const completedCount = milestones.filter((m) => m.completed).length
  const progress = milestones.length > 0 ? Math.round((completedCount / milestones.length) * 100) : 0

  return (
    <div className="space-y-6 max-w-2xl">
      {/* Back */}
      <button
        onClick={() => router.push('/projects')}
        className="flex items-center gap-2 text-text-muted hover:text-text-primary transition-colors text-sm"
      >
        ← Back to Projects
      </button>

      {/* Header */}
      <div className="card">
        <div className="flex items-start justify-between gap-4 flex-wrap">
          <div className="flex-1">
            <h1 className="font-heading text-2xl font-bold text-text-primary">{project.name}</h1>
            {project.description && (
              <p className="text-text-muted text-sm mt-1">{project.description}</p>
            )}
            <div className="flex items-center gap-2 mt-3 flex-wrap">
              <span className="text-xs px-2 py-0.5 rounded border border-border bg-white/5 capitalize">
                {project.category}
              </span>
              {linkedGoal && (
                <span className="text-xs px-2 py-0.5 rounded border border-coral/20 bg-coral/5 text-coral">
                  🎯 {linkedGoal.name}
                </span>
              )}
            </div>
          </div>
          <div className="relative">
            {editingStatus ? (
              <div className="flex flex-col gap-1 bg-surface border border-border rounded-xl p-2 shadow-xl">
                {(['not-started', 'in-progress', 'complete', 'parked'] as ProjectStatus[]).map((s) => (
                  <button
                    key={s}
                    onClick={() => handleStatusChange(s)}
                    className={`status-badge ${getStatusColor(s)} justify-start`}
                  >
                    {getStatusLabel(s)}
                  </button>
                ))}
              </div>
            ) : (
              <button
                onClick={() => setEditingStatus(true)}
                className={`status-badge ${getStatusColor(project.status)}`}
              >
                {getStatusLabel(project.status)} ↓
              </button>
            )}
          </div>
        </div>
      </div>

      {/* Milestones */}
      <div className="card">
        <div className="flex items-center justify-between mb-4">
          <div>
            <h2 className="font-heading font-semibold">Milestones</h2>
            <p className="text-text-muted text-xs mt-0.5">{completedCount}/{milestones.length} complete</p>
          </div>
          <button
            onClick={() => setAddingMilestone(!addingMilestone)}
            className="text-xs text-coral hover:underline"
          >
            + Add milestone
          </button>
        </div>

        {/* Progress */}
        {milestones.length > 0 && (
          <div className="mb-4">
            <div className="flex justify-between text-xs text-text-muted mb-1">
              <span>Progress</span>
              <span>{progress}%</span>
            </div>
            <div className="progress-bar h-2">
              <div className="progress-fill" style={{ width: `${progress}%` }} />
            </div>
          </div>
        )}

        {/* Add milestone inline */}
        {addingMilestone && (
          <div className="p-3 rounded-xl bg-space-black border border-coral/20 mb-3 space-y-2">
            <input
              className="input"
              placeholder="Milestone name"
              value={newMilestone.name}
              onChange={(e) => setNewMilestone({ ...newMilestone, name: e.target.value })}
              autoFocus
            />
            <div className="grid grid-cols-2 gap-2">
              <input
                type="date"
                className="input text-xs"
                value={newMilestone.due_date}
                onChange={(e) => setNewMilestone({ ...newMilestone, due_date: e.target.value })}
              />
              <input
                className="input text-xs"
                placeholder="Notes (optional)"
                value={newMilestone.notes}
                onChange={(e) => setNewMilestone({ ...newMilestone, notes: e.target.value })}
              />
            </div>
            <div className="flex gap-2">
              <button onClick={handleAddMilestone} disabled={!newMilestone.name.trim()} className="btn-primary text-xs py-1.5">
                Add
              </button>
              <button onClick={() => setAddingMilestone(false)} className="btn-ghost text-xs py-1.5">
                Cancel
              </button>
            </div>
          </div>
        )}

        {milestones.length === 0 && !addingMilestone ? (
          <div className="text-center py-8">
            <p className="text-text-muted text-sm">No milestones yet</p>
            <button onClick={() => setAddingMilestone(true)} className="text-coral text-xs mt-2 hover:underline">
              Add the first milestone
            </button>
          </div>
        ) : (
          <div className="space-y-1">
            {milestones.map((milestone) => (
              <MilestoneItem key={milestone.id} milestone={milestone} onToggle={handleMilestoneToggle} />
            ))}
          </div>
        )}
      </div>
    </div>
  )
}
