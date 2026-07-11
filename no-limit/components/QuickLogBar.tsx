'use client'

import { useEffect, useMemo, useState } from 'react'
import { Clock, CornerDownLeft, Loader2, SlidersHorizontal, Sparkles, TriangleAlert } from 'lucide-react'
import { supabase } from '@/lib/supabase'
import { reportError } from '@/lib/errors'
import { CategoryIcon } from '@/lib/categoryIcons'
import { TimeBlock, TimeCategory, TimetableSlot, Project, Goal } from '@/types'
import {
  ACTIVITY_TYPES,
  QuickLogDraft,
  fmtDuration,
  parseQuickLog,
  to12h,
  toMinutes,
} from '@/lib/quickLog'

interface Props {
  date: string
  categories: TimeCategory[]
  projects: Project[]
  goals: Goal[]
  slots: TimetableSlot[]
  blocks: TimeBlock[]
  onLogged: (block: TimeBlock) => void
}

type LinkType = 'project' | 'goal' | 'none'

interface Overrides {
  startTime?: string
  endTime?: string
  categoryId?: string | null
  linkType?: LinkType
  projectId?: string | null
  goalId?: string | null
  activityType?: string | null
}

interface Suggestion {
  label: string
  text: string
}

export default function QuickLogBar({ date, categories, projects, goals, slots, blocks, onLogged }: Props) {
  const [text, setText] = useState('')
  const [overrides, setOverrides] = useState<Overrides>({})
  const [adjusting, setAdjusting] = useState(false)
  const [saving, setSaving] = useState(false)
  const [error, setError] = useState<{ message: string; code?: string } | null>(null)
  const [suggestions, setSuggestions] = useState<Suggestion[]>([])

  // Recent project + activity pairs, so repeat work is one tap away.
  useEffect(() => {
    async function loadRecents() {
      const { data } = await supabase
        .from('time_entries')
        .select('activity_type, projects(name), goals(name)')
        .order('created_at', { ascending: false })
        .limit(40)

      const seen = new Set<string>()
      const recents: Suggestion[] = []

      for (const entry of (data ?? []) as unknown as {
        activity_type: string | null
        projects: { name: string } | null
        goals: { name: string } | null
      }[]) {
        const target = entry.projects?.name ?? entry.goals?.name ?? null
        const activity = entry.activity_type
        if (!target && !activity) continue

        const label = [activity, target && `on ${target}`].filter(Boolean).join(' ')
        if (seen.has(label)) continue
        seen.add(label)
        recents.push({ label, text: label })
        if (recents.length === 4) break
      }

      setSuggestions(recents)
    }

    loadRecents()
  }, [])

  const draft: QuickLogDraft = useMemo(
    () => parseQuickLog(text, { projects, goals, categories, slots, blocks, date, now: new Date() }),
    [text, projects, goals, categories, slots, blocks, date]
  )

  // What actually gets saved: the parse, with any manual corrections layered on top.
  const effective = useMemo(() => {
    const startTime = overrides.startTime ?? draft.startTime
    const endTime = overrides.endTime ?? draft.endTime

    const linkType: LinkType =
      overrides.linkType ?? (draft.projectId ? 'project' : draft.goalId ? 'goal' : 'none')

    const projectId = linkType === 'project' ? (overrides.projectId ?? draft.projectId) : null
    const goalId = linkType === 'goal' ? (overrides.goalId ?? draft.goalId) : null
    const categoryId = overrides.categoryId !== undefined ? overrides.categoryId : draft.categoryId
    const activityType =
      overrides.activityType !== undefined ? overrides.activityType : draft.activityType

    const durationMinutes = toMinutes(endTime) - toMinutes(startTime)

    const linkedName =
      linkType === 'project'
        ? projects.find((p) => p.id === projectId)?.name ?? null
        : linkType === 'goal'
          ? goals.find((g) => g.id === goalId)?.name ?? null
          : null

    return { startTime, endTime, durationMinutes, categoryId, linkType, projectId, goalId, activityType, linkedName }
  }, [draft, overrides, projects, goals])

  const category = categories.find((c) => c.id === effective.categoryId) ?? null
  const isValid = text.trim().length > 0 && effective.durationMinutes > 0

  const reset = () => {
    setText('')
    setOverrides({})
    setAdjusting(false)
    setError(null)
  }

  const handleSave = async () => {
    if (!isValid || saving) return
    setSaving(true)
    setError(null)

    // PostgREST has no transaction across two inserts, so if the entry fails we
    // roll the block back by hand — a block with no entry is invisible work.
    const { data: block, error: blockError } = await supabase
      .from('time_blocks')
      .insert({
        date,
        start_time: effective.startTime,
        end_time: effective.endTime,
        category_id: effective.categoryId,
        notes: draft.notes,
      })
      .select('*, time_categories(*)')
      .single()

    if (blockError || !block) {
      setError(reportError(blockError, 'quick-log:insert-block'))
      setSaving(false)
      return
    }

    const { data: entry, error: entryError } = await supabase
      .from('time_entries')
      .insert({
        block_id: block.id,
        project_id: effective.projectId,
        goal_id: effective.goalId,
        activity_type: effective.activityType,
        duration_minutes: effective.durationMinutes,
        notes: draft.notes,
      })
      .select('*, projects(id, name), goals(id, name)')
      .single()

    if (entryError || !entry) {
      await supabase.from('time_blocks').delete().eq('id', block.id)
      setError(reportError(entryError, 'quick-log:insert-entry'))
      setSaving(false)
      return
    }

    onLogged({ ...block, entries: [entry] })
    setSaving(false)
    reset()
  }

  return (
    <div className="card space-y-3">
      {/* Input row */}
      <div className="flex gap-2">
        <div className="relative flex-1">
          <Sparkles size={15} className="absolute left-3 top-1/2 -translate-y-1/2 text-coral pointer-events-none" />
          <input
            className="input pl-9"
            placeholder="What did you do? e.g. coding on Kapgrade 2h"
            value={text}
            onChange={(e) => { setText(e.target.value); setError(null) }}
            onKeyDown={(e) => { if (e.key === 'Enter') handleSave() }}
            aria-label="Quick log an activity"
          />
        </div>
        <button
          onClick={handleSave}
          disabled={!isValid || saving}
          className="btn-primary flex items-center gap-2 shrink-0 disabled:opacity-40"
        >
          {saving ? <Loader2 size={14} className="animate-spin" /> : <CornerDownLeft size={14} />}
          Log
        </button>
      </div>

      {/* Live parse preview */}
      {text.trim().length > 0 && (
        <div className="space-y-2">
          <div className="flex items-center gap-2 flex-wrap">
            <span className="text-xs text-text-primary bg-white/5 border border-border px-2.5 py-1 rounded-full flex items-center gap-1.5">
              <Clock size={11} className="text-text-muted" />
              {to12h(effective.startTime)} – {to12h(effective.endTime)}
              <span className="text-text-muted">· {fmtDuration(effective.durationMinutes)}</span>
            </span>

            {category && (
              <span
                className="text-xs px-2.5 py-1 rounded-full font-medium flex items-center gap-1.5"
                style={{ backgroundColor: category.color + '22', color: category.color }}
              >
                <CategoryIcon name={category.name} size={11} color={category.color} />
                {category.name}
                {draft.categorySource === 'timetable' && !overrides.categoryId && (
                  <span className="opacity-60">· timetable</span>
                )}
              </span>
            )}

            {effective.linkedName && (
              <span className="text-xs text-coral bg-coral/10 border border-coral/20 px-2.5 py-1 rounded-full">
                {effective.linkedName}
              </span>
            )}

            {effective.activityType && (
              <span className="text-xs text-text-muted bg-white/5 border border-border px-2.5 py-1 rounded-full capitalize">
                {effective.activityType}
              </span>
            )}

            <button
              onClick={() => setAdjusting((p) => !p)}
              className="text-xs text-text-muted hover:text-text-primary flex items-center gap-1.5 px-2 py-1 rounded-lg hover:bg-white/5 transition-all"
            >
              <SlidersHorizontal size={11} />
              {adjusting ? 'Done' : 'Adjust'}
            </button>
          </div>

          {draft.warning && !adjusting && (
            <p className="text-xs text-warning flex items-center gap-1.5">
              <TriangleAlert size={12} />
              {draft.warning}
            </p>
          )}

          {/* Corrections — only for when the parse guessed wrong */}
          {adjusting && (
            <div className="grid grid-cols-2 md:grid-cols-3 gap-2 pt-1">
              <div>
                <label className="label text-xs">Start</label>
                <input
                  type="time"
                  className="input text-sm py-1.5"
                  value={effective.startTime}
                  onChange={(e) => setOverrides({ ...overrides, startTime: e.target.value })}
                />
              </div>
              <div>
                <label className="label text-xs">End</label>
                <input
                  type="time"
                  className="input text-sm py-1.5"
                  value={effective.endTime}
                  onChange={(e) => setOverrides({ ...overrides, endTime: e.target.value })}
                />
              </div>
              <div>
                <label className="label text-xs">Category</label>
                <select
                  className="input text-sm py-1.5"
                  value={effective.categoryId ?? ''}
                  onChange={(e) => setOverrides({ ...overrides, categoryId: e.target.value || null })}
                >
                  <option value="">No category</option>
                  {categories.map((c) => (
                    <option key={c.id} value={c.id}>{c.name}</option>
                  ))}
                </select>
              </div>
              <div>
                <label className="label text-xs">Link to</label>
                <select
                  className="input text-sm py-1.5"
                  value={effective.linkType}
                  onChange={(e) => setOverrides({ ...overrides, linkType: e.target.value as LinkType })}
                >
                  <option value="project">Project</option>
                  <option value="goal">Goal</option>
                  <option value="none">General</option>
                </select>
              </div>
              {effective.linkType !== 'none' && (
                <div>
                  <label className="label text-xs">{effective.linkType === 'project' ? 'Project' : 'Goal'}</label>
                  <select
                    className="input text-sm py-1.5"
                    value={(effective.linkType === 'project' ? effective.projectId : effective.goalId) ?? ''}
                    onChange={(e) => setOverrides({
                      ...overrides,
                      [effective.linkType === 'project' ? 'projectId' : 'goalId']: e.target.value || null,
                    })}
                  >
                    <option value="">Select...</option>
                    {(effective.linkType === 'project' ? projects : goals).map((item) => (
                      <option key={item.id} value={item.id}>{item.name}</option>
                    ))}
                  </select>
                </div>
              )}
              <div>
                <label className="label text-xs">Activity</label>
                <select
                  className="input text-sm py-1.5"
                  value={effective.activityType ?? ''}
                  onChange={(e) => setOverrides({ ...overrides, activityType: e.target.value || null })}
                >
                  <option value="">None</option>
                  {ACTIVITY_TYPES.map((t) => (
                    <option key={t} value={t} className="capitalize">{t}</option>
                  ))}
                </select>
              </div>

              {draft.warning && (
                <p className="col-span-full text-xs text-warning flex items-center gap-1.5">
                  <TriangleAlert size={12} />
                  {draft.warning}
                </p>
              )}
            </div>
          )}
        </div>
      )}

      {/* Recents */}
      {text.trim().length === 0 && suggestions.length > 0 && (
        <div className="flex items-center gap-2 flex-wrap">
          <span className="text-xs text-text-muted">Again:</span>
          {suggestions.map((s) => (
            <button
              key={s.label}
              onClick={() => setText(s.text)}
              className="text-xs text-text-muted hover:text-coral border border-border hover:border-coral/30 px-2.5 py-1 rounded-full transition-all first-letter:uppercase"
            >
              {s.label}
            </button>
          ))}
        </div>
      )}

      {error && (
        <div role="alert" className="rounded-lg border border-red-500/30 bg-red-500/10 px-3 py-2">
          <p className="text-xs text-red-300">{error.message}</p>
          {error.code && (
            <p className="text-xs text-red-300/70 mt-0.5">
              Support code: <code className="font-mono">{error.code}</code>
            </p>
          )}
        </div>
      )}
    </div>
  )
}
