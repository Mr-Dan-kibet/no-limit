'use client'

import Link from 'next/link'
import { Project, Milestone } from '@/types'
import { getStatusColor, getStatusLabel } from '@/lib/utils'

interface ProjectCardProps {
  project: Project & { milestones?: Milestone[] }
}

export default function ProjectCard({ project }: ProjectCardProps) {
  const milestones = project.milestones ?? []
  const completed = milestones.filter((m) => m.completed).length
  const total = milestones.length
  const progress = total > 0 ? Math.round((completed / total) * 100) : 0

  const categoryColors: Record<string, string> = {
    developer: '#FF6044',
    business: '#FFC107',
    learning: '#4CAF50',
    other: '#888888',
  }

  const accentColor = categoryColors[project.category] ?? project.color

  return (
    <Link href={`/projects/${project.id}`}>
      <div className="card hover:border-coral/20 transition-all group relative overflow-hidden">
        {/* Left accent bar */}
        <div
          className="absolute left-0 top-0 bottom-0 w-1 rounded-l-xl"
          style={{ backgroundColor: accentColor }}
        />
        <div className="pl-3">
          <div className="flex items-start justify-between gap-2 mb-3">
            <h3 className="font-heading font-semibold text-text-primary group-hover:text-coral transition-colors">
              {project.name}
            </h3>
            <span className={`status-badge ${getStatusColor(project.status)}`}>
              {getStatusLabel(project.status)}
            </span>
          </div>

          {project.description && (
            <p className="text-sm text-text-muted mb-3 line-clamp-2">{project.description}</p>
          )}

          <div className="flex items-center justify-between">
            <span
              className="text-xs px-2 py-0.5 rounded border"
              style={{ color: accentColor, borderColor: `${accentColor}40`, backgroundColor: `${accentColor}10` }}
            >
              {project.category}
            </span>
            {total > 0 && (
              <span className="text-xs text-text-muted">{completed}/{total} milestones</span>
            )}
          </div>

          {total > 0 && (
            <div className="progress-bar mt-2">
              <div className="progress-fill" style={{ width: `${progress}%`, backgroundColor: accentColor }} />
            </div>
          )}
        </div>
      </div>
    </Link>
  )
}
