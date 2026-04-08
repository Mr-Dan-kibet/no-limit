'use client'

import { useEffect, useState, useCallback } from 'react'
import { supabase } from '@/lib/supabase'
import { TimeCategory, TimetableSlot, TimeBlock, TimeEntry, Project, Goal } from '@/types'
import { ChevronLeft, ChevronRight, Plus, Filter } from 'lucide-react'
import { format, addDays, subDays, startOfWeek, endOfWeek, startOfMonth, endOfMonth, subWeeks, subMonths, parseISO } from 'date-fns'
import TimeBlockCard from '@/components/TimeBlockCard'
import TimetableTimeline from '@/components/TimetableTimeline'
import InsightsCharts from '@/components/InsightsCharts'

type Tab = 'log' | 'timetable' | 'insights'
type RangePreset = 'this-week' | 'last-week' | 'this-month' | 'last-month' | 'custom'

function todayStr() {
  return format(new Date(), 'yyyy-MM-dd')
}

function blockDurationMinutes(start: string, end: string) {
  const [sh, sm] = start.split(':').map(Number)
  const [eh, em] = end.split(':').map(Number)
  return (eh * 60 + em) - (sh * 60 + sm)
}

export default function AnalyticsPage() {
  const [tab, setTab] = useState<Tab>('log')

  // Shared data
  const [categories, setCategories] = useState<TimeCategory[]>([])
  const [slots, setSlots] = useState<TimetableSlot[]>([])
  const [projects, setProjects] = useState<Project[]>([])
  const [goals, setGoals] = useState<Goal[]>([])
  const [allBlocks, setAllBlocks] = useState<TimeBlock[]>([]) // for insights
  const [loading, setLoading] = useState(true)

  // Log tab
  const [logDate, setLogDate] = useState(todayStr())
  const [dayBlocks, setDayBlocks] = useState<TimeBlock[]>([])
  const [showAddBlock, setShowAddBlock] = useState(false)
  const [newBlock, setNewBlock] = useState({ start_time: '09:00', end_time: '10:00', category_id: '', notes: '' })
  const [addingSaving, setAddingSaving] = useState(false)

  // Insights tab
  const [rangePreset, setRangePreset] = useState<RangePreset>('this-week')
  const [customRange, setCustomRange] = useState({ start: todayStr(), end: todayStr() })
  const [filterCategory, setFilterCategory] = useState('')
  const [insightsLoading, setInsightsLoading] = useState(false)

  // Load base data once
  useEffect(() => {
    async function load() {
      const [
        { data: catsData },
        { data: slotsData },
        { data: projectsData },
        { data: goalsData },
      ] = await Promise.all([
        supabase.from('time_categories').select('*').eq('active', true).order('sort_order'),
        supabase.from('timetable_slots').select('*, time_categories(*)').order('start_time'),
        supabase.from('projects').select('id, name').order('name'),
        supabase.from('goals').select('id, name').order('name'),
      ])
      setCategories(catsData ?? [])
      setSlots(slotsData ?? [])
      setProjects((projectsData ?? []) as unknown as Project[])
      setGoals((goalsData ?? []) as unknown as Goal[])
      setLoading(false)
    }
    load()
  }, [])

  // Load day blocks
  const loadDayBlocks = useCallback(async (date: string) => {
    const { data: blocksData } = await supabase
      .from('time_blocks')
      .select('*, time_categories(*)')
      .eq('date', date)
      .order('start_time')

    const blocks = blocksData ?? []

    if (blocks.length > 0) {
      const { data: entriesData } = await supabase
        .from('time_entries')
        .select('*, projects(id, name), goals(id, name)')
        .in('block_id', blocks.map((b: TimeBlock) => b.id))

      const blockMap: Record<string, TimeEntry[]> = {}
      ;(entriesData ?? []).forEach((e: TimeEntry) => {
        if (!blockMap[e.block_id]) blockMap[e.block_id] = []
        blockMap[e.block_id].push(e)
      })

      setDayBlocks(blocks.map((b: TimeBlock) => ({ ...b, entries: blockMap[b.id] ?? [] })))
    } else {
      setDayBlocks([])
    }
  }, [])

  useEffect(() => {
    loadDayBlocks(logDate)
  }, [logDate, loadDayBlocks])

  // Load insights blocks
  const loadInsightsBlocks = useCallback(async (start: string, end: string) => {
    setInsightsLoading(true)
    const { data: blocksData } = await supabase
      .from('time_blocks')
      .select('*, time_categories(*)')
      .gte('date', start)
      .lte('date', end)
      .order('date')

    const blocks = blocksData ?? []
    if (blocks.length > 0) {
      const { data: entriesData } = await supabase
        .from('time_entries')
        .select('*, projects(id, name), goals(id, name)')
        .in('block_id', blocks.map((b: TimeBlock) => b.id))
      const blockMap: Record<string, TimeEntry[]> = {}
      ;(entriesData ?? []).forEach((e: TimeEntry) => {
        if (!blockMap[e.block_id]) blockMap[e.block_id] = []
        blockMap[e.block_id].push(e)
      })
      setAllBlocks(blocks.map((b: TimeBlock) => ({ ...b, entries: blockMap[b.id] ?? [] })))
    } else {
      setAllBlocks([])
    }
    setInsightsLoading(false)
  }, [])

  const getDateRange = useCallback(() => {
    const now = new Date()
    switch (rangePreset) {
      case 'this-week': return { start: format(startOfWeek(now, { weekStartsOn: 1 }), 'yyyy-MM-dd'), end: format(endOfWeek(now, { weekStartsOn: 1 }), 'yyyy-MM-dd') }
      case 'last-week': { const lw = subWeeks(now, 1); return { start: format(startOfWeek(lw, { weekStartsOn: 1 }), 'yyyy-MM-dd'), end: format(endOfWeek(lw, { weekStartsOn: 1 }), 'yyyy-MM-dd') } }
      case 'this-month': return { start: format(startOfMonth(now), 'yyyy-MM-dd'), end: format(endOfMonth(now), 'yyyy-MM-dd') }
      case 'last-month': { const lm = subMonths(now, 1); return { start: format(startOfMonth(lm), 'yyyy-MM-dd'), end: format(endOfMonth(lm), 'yyyy-MM-dd') } }
      case 'custom': return customRange
    }
  }, [rangePreset, customRange])

  useEffect(() => {
    if (tab === 'insights') {
      const range = getDateRange()
      loadInsightsBlocks(range.start, range.end)
    }
  }, [tab, rangePreset, customRange, getDateRange, loadInsightsBlocks])

  // Seed day from timetable slots
  const seedFromTimetable = async () => {
    const dow = parseISO(logDate).getDay()
    const todaySlots = slots.filter((s) => s.active && s.days_of_week.includes(dow))
    if (todaySlots.length === 0) return

    const inserts = todaySlots.map((s) => ({
      date: logDate,
      start_time: s.start_time,
      end_time: s.end_time,
      category_id: s.category_id,
      notes: null,
    }))

    const { data, error } = await supabase
      .from('time_blocks')
      .insert(inserts)
      .select('*, time_categories(*)')

    if (!error && data) {
      setDayBlocks((prev) => [...prev, ...data.map((b: TimeBlock) => ({ ...b, entries: [] }))])
    }
  }

  const handleAddBlock = async () => {
    if (!newBlock.start_time || !newBlock.end_time) return
    setAddingSaving(true)
    const { data, error } = await supabase
      .from('time_blocks')
      .insert({
        date: logDate,
        start_time: newBlock.start_time,
        end_time: newBlock.end_time,
        category_id: newBlock.category_id || null,
        notes: newBlock.notes || null,
      })
      .select('*, time_categories(*)')
      .single()

    if (!error && data) {
      setDayBlocks((prev) => [...prev, { ...data, entries: [] }])
      setNewBlock({ start_time: '09:00', end_time: '10:00', category_id: '', notes: '' })
      setShowAddBlock(false)
    }
    setAddingSaving(false)
  }

  const handleBlockDeleted = (id: string) => setDayBlocks((prev) => prev.filter((b) => b.id !== id))
  const handleBlockUpdated = (updated: TimeBlock) => setDayBlocks((prev) => prev.map((b) => b.id === updated.id ? { ...updated, entries: b.entries } : b))
  const handleEntryAdded = (entry: TimeEntry) => {
    setDayBlocks((prev) => prev.map((b) =>
      b.id === entry.block_id ? { ...b, entries: [...(b.entries ?? []), entry] } : b
    ))
  }
  const handleEntryDeleted = async (entryId: string, blockId: string) => {
    await supabase.from('time_entries').delete().eq('id', entryId)
    setDayBlocks((prev) => prev.map((b) =>
      b.id === blockId ? { ...b, entries: (b.entries ?? []).filter((e) => e.id !== entryId) } : b
    ))
  }

  const totalLoggedToday = dayBlocks.reduce(
    (sum, b) => sum + (b.entries ?? []).reduce((s, e) => s + e.duration_minutes, 0), 0
  )
  const totalBlockedToday = dayBlocks.reduce(
    (sum, b) => sum + blockDurationMinutes(b.start_time, b.end_time), 0
  )

  const dateRange = getDateRange()

  const TABS: { key: Tab; label: string }[] = [
    { key: 'log', label: 'Log' },
    { key: 'timetable', label: 'Timetable' },
    { key: 'insights', label: 'Insights' },
  ]

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="w-8 h-8 border-2 border-coral/30 border-t-coral rounded-full animate-spin" />
      </div>
    )
  }

  return (
    <div className="space-y-5">
      {/* Header */}
      <div>
        <h1 className="font-heading text-2xl font-bold">Analytics</h1>
        <p className="text-text-muted text-sm mt-0.5">Track your time, review your days</p>
      </div>

      {/* Tabs */}
      <div className="flex gap-1 bg-surface border border-border rounded-xl p-1 w-fit">
        {TABS.map(({ key, label }) => (
          <button
            key={key}
            onClick={() => setTab(key)}
            className={`px-4 py-2 rounded-lg text-sm font-medium transition-all ${
              tab === key
                ? 'bg-coral text-white'
                : 'text-text-muted hover:text-text-primary'
            }`}
          >
            {label}
          </button>
        ))}
      </div>

      {/* ===== LOG TAB ===== */}
      {tab === 'log' && (
        <div className="space-y-4">
          {/* Date nav */}
          <div className="flex items-center gap-3">
            <button
              onClick={() => setLogDate(format(subDays(parseISO(logDate), 1), 'yyyy-MM-dd'))}
              className="p-2 rounded-lg border border-border text-text-muted hover:text-text-primary hover:border-coral/30 transition-all"
            >
              <ChevronLeft size={16} />
            </button>
            <div className="flex-1 text-center">
              <p className="font-heading font-semibold">
                {format(parseISO(logDate), 'EEEE, MMM d')}
              </p>
              {logDate === todayStr() && (
                <p className="text-xs text-coral">Today</p>
              )}
            </div>
            <button
              onClick={() => setLogDate(format(addDays(parseISO(logDate), 1), 'yyyy-MM-dd'))}
              className="p-2 rounded-lg border border-border text-text-muted hover:text-text-primary hover:border-coral/30 transition-all"
            >
              <ChevronRight size={16} />
            </button>
          </div>

          {/* Daily summary pill */}
          {dayBlocks.length > 0 && (
            <div className="flex items-center gap-3 flex-wrap">
              <span className="text-xs text-text-muted bg-surface border border-border px-3 py-1.5 rounded-full">
                {Math.floor(totalBlockedToday / 60)}h {totalBlockedToday % 60}m scheduled
              </span>
              <span className="text-xs text-coral bg-coral/10 border border-coral/20 px-3 py-1.5 rounded-full">
                {Math.floor(totalLoggedToday / 60)}h {totalLoggedToday % 60}m logged
              </span>
            </div>
          )}

          {/* Blocks */}
          <div className="space-y-2">
            {dayBlocks.length === 0 ? (
              <div className="card text-center py-10">
                <p className="text-text-muted mb-3">No blocks for this day</p>
                <div className="flex justify-center gap-3">
                  <button
                    onClick={seedFromTimetable}
                    className="btn-ghost border border-border text-sm"
                  >
                    Load from timetable
                  </button>
                  <button
                    onClick={() => setShowAddBlock(true)}
                    className="btn-primary text-sm"
                  >
                    Add block
                  </button>
                </div>
              </div>
            ) : (
              dayBlocks.map((block) => (
                <TimeBlockCard
                  key={block.id}
                  block={block}
                  categories={categories}
                  projects={projects}
                  goals={goals}
                  onDelete={handleBlockDeleted}
                  onUpdate={handleBlockUpdated}
                  onEntryAdded={handleEntryAdded}
                  onEntryDeleted={handleEntryDeleted}
                />
              ))
            )}
          </div>

          {/* Add block form */}
          {showAddBlock ? (
            <div className="card space-y-3">
              <p className="text-sm font-medium text-text-primary">Add block</p>
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="label">Start</label>
                  <input
                    type="time"
                    className="input"
                    value={newBlock.start_time}
                    onChange={(e) => setNewBlock({ ...newBlock, start_time: e.target.value })}
                  />
                </div>
                <div>
                  <label className="label">End</label>
                  <input
                    type="time"
                    className="input"
                    value={newBlock.end_time}
                    onChange={(e) => setNewBlock({ ...newBlock, end_time: e.target.value })}
                  />
                </div>
              </div>
              <div>
                <label className="label">Category</label>
                <select
                  className="input"
                  value={newBlock.category_id}
                  onChange={(e) => setNewBlock({ ...newBlock, category_id: e.target.value })}
                >
                  <option value="">No category</option>
                  {categories.map((c) => (
                    <option key={c.id} value={c.id}>{c.name}</option>
                  ))}
                </select>
              </div>
              <div>
                <label className="label">Notes (optional)</label>
                <input
                  className="input"
                  placeholder="e.g. Business Management Course"
                  value={newBlock.notes}
                  onChange={(e) => setNewBlock({ ...newBlock, notes: e.target.value })}
                />
              </div>
              <div className="flex gap-2">
                <button onClick={() => setShowAddBlock(false)} className="btn-ghost">Cancel</button>
                <button onClick={handleAddBlock} disabled={addingSaving} className="btn-primary">
                  {addingSaving ? 'Saving...' : 'Add Block'}
                </button>
              </div>
            </div>
          ) : (
            dayBlocks.length > 0 && (
              <button
                onClick={() => setShowAddBlock(true)}
                className="flex items-center gap-2 text-sm text-coral hover:underline"
              >
                <Plus size={15} /> Add block
              </button>
            )
          )}
        </div>
      )}

      {/* ===== TIMETABLE TAB ===== */}
      {tab === 'timetable' && (
        <div className="space-y-4">
          <div className="flex items-center justify-between">
            <div>
              <h2 className="font-heading font-semibold">Your ideal 24-hour day</h2>
              <p className="text-text-muted text-xs mt-0.5">This template pre-fills your daily log</p>
            </div>
          </div>
          <TimetableTimeline
            slots={slots}
            categories={categories}
            onSlotsChange={setSlots}
          />
        </div>
      )}

      {/* ===== INSIGHTS TAB ===== */}
      {tab === 'insights' && (
        <div className="space-y-4">
          {/* Filters row */}
          <div className="flex flex-wrap items-center gap-3">
            {/* Range preset */}
            <div className="flex gap-1 flex-wrap">
              {(['this-week', 'last-week', 'this-month', 'last-month', 'custom'] as RangePreset[]).map((p) => (
                <button
                  key={p}
                  onClick={() => setRangePreset(p)}
                  className={`px-3 py-1.5 rounded-lg text-xs font-medium border transition-all capitalize ${
                    rangePreset === p
                      ? 'bg-coral text-white border-coral'
                      : 'text-text-muted border-border hover:text-text-primary hover:border-coral/30'
                  }`}
                >
                  {p.replace('-', ' ')}
                </button>
              ))}
            </div>

            {/* Category filter */}
            <div className="flex items-center gap-2">
              <Filter size={14} className="text-text-muted" />
              <select
                className="input py-1.5 text-xs w-auto"
                value={filterCategory}
                onChange={(e) => setFilterCategory(e.target.value)}
              >
                <option value="">All categories</option>
                {categories.map((c) => (
                  <option key={c.id} value={c.id}>{c.name}</option>
                ))}
              </select>
            </div>
          </div>

          {/* Custom range picker */}
          {rangePreset === 'custom' && (
            <div className="flex items-center gap-3 flex-wrap">
              <div>
                <label className="label text-xs">From</label>
                <input
                  type="date"
                  className="input py-1.5 text-sm"
                  value={customRange.start}
                  onChange={(e) => setCustomRange({ ...customRange, start: e.target.value })}
                />
              </div>
              <div>
                <label className="label text-xs">To</label>
                <input
                  type="date"
                  className="input py-1.5 text-sm"
                  value={customRange.end}
                  onChange={(e) => setCustomRange({ ...customRange, end: e.target.value })}
                />
              </div>
            </div>
          )}

          {/* Date range display */}
          <p className="text-xs text-text-muted">
            {format(parseISO(dateRange.start), 'MMM d')} – {format(parseISO(dateRange.end), 'MMM d, yyyy')}
          </p>

          {insightsLoading ? (
            <div className="flex items-center justify-center h-48">
              <div className="w-8 h-8 border-2 border-coral/30 border-t-coral rounded-full animate-spin" />
            </div>
          ) : (
            <InsightsCharts
              blocks={allBlocks}
              categories={categories}
              timetableSlots={slots}
              dateRange={dateRange}
              filterCategory={filterCategory}
            />
          )}
        </div>
      )}
    </div>
  )
}
