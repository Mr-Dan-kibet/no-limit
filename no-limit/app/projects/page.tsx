'use client'

import { useEffect, useState } from 'react'
import { supabase } from '@/lib/supabase'
import { Project, Milestone, Goal, ProjectStatus, ProjectCategory } from '@/types'
import ProjectCard from '@/components/ProjectCard'
import Modal from '@/components/Modal'

const CATEGORIES: ProjectCategory[] = ['developer', 'business', 'learning', 'other']
const STATUSES: { label: string; value: ProjectStatus | 'all' }[] = [
  { label: 'All', value: 'all' },
  { label: 'Not Started', value: 'not-started' },
  { label: 'In Progress', value: 'in-progress' },
  { label: 'Complete', value: 'complete' },
  { label: 'Parked', value: 'parked' },
]

export default function ProjectsPage() {
  const [projects, setProjects] = useState<(Project & { milestones: Milestone[] })[]>([])
  const [goals, setGoals] = useState<Pick<Goal, 'id' | 'name' | 'category_id'>[]>([])
  const [loading, setLoading] = useState(true)
  const [filterCategory, setFilterCategory] = useState<ProjectCategory | 'all'>('all')
  const [filterStatus, setFilterStatus] = useState<ProjectStatus | 'all'>('all')
  const [modal, setModal] = useState(false)
  const [newProject, setNewProject] = useState({
    name: '', description: '', category: 'developer' as ProjectCategory,
    status: 'not-started' as ProjectStatus, goal_id: '',
  })
  const [saving, setSaving] = useState(false)

  useEffect(() => {
    async function load() {
      const [{ data: projectsData }, { data: milestonesData }, { data: goalsData }] = await Promise.all([
        supabase.from('projects').select('*').order('created_at'),
        supabase.from('milestones').select('*').order('sort_order'),
        supabase.from('goals').select('id, name, category_id').order('name'),
      ])
      const ps = (projectsData ?? []).map((p: Project) => ({
        ...p,
        milestones: (milestonesData ?? []).filter((m: Milestone) => m.project_id === p.id),
      }))
      setProjects(ps)
      setGoals(goalsData ?? [])
      setLoading(false)
    }
    load()
  }, [])

  const handleAddProject = async () => {
    if (!newProject.name.trim()) return
    setSaving(true)
    const { data, error } = await supabase.from('projects').insert({
      name: newProject.name.trim(),
      description: newProject.description || null,
      category: newProject.category,
      status: newProject.status,
      goal_id: newProject.goal_id || null,
      color: '#FF6044',
    }).select().single()
    if (!error && data) {
      setProjects((prev) => [...prev, { ...data, milestones: [] }])
      setModal(false)
      setNewProject({ name: '', description: '', category: 'developer', status: 'not-started', goal_id: '' })
    }
    setSaving(false)
  }

  const filtered = projects.filter((p) => {
    if (filterCategory !== 'all' && p.category !== filterCategory) return false
    if (filterStatus !== 'all' && p.status !== filterStatus) return false
    return true
  })

  return (
    <div className="space-y-6">
      <div className="flex items-start justify-between gap-4 flex-wrap">
        <div>
          <h1 className="font-heading text-2xl font-bold">Projects</h1>
          <p className="text-text-muted text-sm mt-0.5">{projects.length} projects total</p>
        </div>
        <button onClick={() => setModal(true)} className="btn-primary">+ Add Project</button>
      </div>

      {/* Filters */}
      <div className="flex gap-2 flex-wrap">
        <div className="flex gap-1 flex-wrap">
          <button
            onClick={() => setFilterCategory('all')}
            className={`px-3 py-1.5 rounded-lg text-xs font-medium border transition-all ${
              filterCategory === 'all' ? 'bg-coral text-white border-coral' : 'text-text-muted border-border hover:border-coral/30'
            }`}
          >
            All
          </button>
          {CATEGORIES.map((cat) => (
            <button
              key={cat}
              onClick={() => setFilterCategory(cat)}
              className={`px-3 py-1.5 rounded-lg text-xs font-medium border transition-all capitalize ${
                filterCategory === cat ? 'bg-coral text-white border-coral' : 'text-text-muted border-border hover:border-coral/30'
              }`}
            >
              {cat}
            </button>
          ))}
        </div>
        <div className="w-px bg-border" />
        <div className="flex gap-1 flex-wrap">
          {STATUSES.map((s) => (
            <button
              key={s.value}
              onClick={() => setFilterStatus(s.value)}
              className={`px-3 py-1.5 rounded-lg text-xs font-medium border transition-all ${
                filterStatus === s.value ? 'bg-surface text-coral border-coral/40' : 'text-text-muted border-transparent hover:border-border'
              }`}
            >
              {s.label}
            </button>
          ))}
        </div>
      </div>

      {loading ? (
        <div className="flex justify-center py-12">
          <div className="w-6 h-6 border-2 border-coral/30 border-t-coral rounded-full animate-spin" />
        </div>
      ) : filtered.length === 0 ? (
        <div className="card text-center py-12">
          <p className="text-text-muted text-2xl mb-3">🚀</p>
          <p className="text-text-primary font-medium">No projects found</p>
          <p className="text-text-muted text-sm mt-1">Add your first project to get started</p>
          <button onClick={() => setModal(true)} className="btn-primary mt-4">Add Project</button>
        </div>
      ) : (
        <div className="grid md:grid-cols-2 xl:grid-cols-3 gap-4">
          {filtered.map((project) => (
            <ProjectCard key={project.id} project={project} />
          ))}
        </div>
      )}

      <Modal isOpen={modal} onClose={() => setModal(false)} title="Add Project">
        <div className="space-y-4">
          <div>
            <label className="label">Project name *</label>
            <input
              className="input"
              placeholder="What are you building?"
              value={newProject.name}
              onChange={(e) => setNewProject({ ...newProject, name: e.target.value })}
            />
          </div>
          <div>
            <label className="label">Description</label>
            <textarea
              className="input resize-none"
              rows={2}
              placeholder="Brief description..."
              value={newProject.description}
              onChange={(e) => setNewProject({ ...newProject, description: e.target.value })}
            />
          </div>
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="label">Category</label>
              <select
                className="input"
                value={newProject.category}
                onChange={(e) => setNewProject({ ...newProject, category: e.target.value as ProjectCategory })}
              >
                {CATEGORIES.map((c) => (
                  <option key={c} value={c} className="capitalize">{c}</option>
                ))}
              </select>
            </div>
            <div>
              <label className="label">Status</label>
              <select
                className="input"
                value={newProject.status}
                onChange={(e) => setNewProject({ ...newProject, status: e.target.value as ProjectStatus })}
              >
                <option value="not-started">Not Started</option>
                <option value="in-progress">In Progress</option>
                <option value="complete">Complete</option>
                <option value="parked">Parked</option>
              </select>
            </div>
          </div>
          <div>
            <label className="label">Link to goal (optional)</label>
            <select
              className="input"
              value={newProject.goal_id}
              onChange={(e) => setNewProject({ ...newProject, goal_id: e.target.value })}
            >
              <option value="">No linked goal</option>
              {goals.map((g) => (
                <option key={g.id} value={g.id}>{g.name}</option>
              ))}
            </select>
          </div>
          <div className="flex justify-end gap-2 pt-2">
            <button onClick={() => setModal(false)} className="btn-ghost">Cancel</button>
            <button onClick={handleAddProject} disabled={saving || !newProject.name.trim()} className="btn-primary">
              {saving ? 'Creating...' : 'Create Project'}
            </button>
          </div>
        </div>
      </Modal>
    </div>
  )
}
