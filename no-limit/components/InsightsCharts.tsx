'use client'

import {
  BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer, Legend,
  PieChart, Pie, Cell,
  LineChart, Line, CartesianGrid,
} from 'recharts'
import { TimeBlock, TimeEntry, TimeCategory, TimetableSlot } from '@/types'
import { CategoryIcon } from '@/lib/categoryIcons'

interface Props {
  blocks: TimeBlock[]
  categories: TimeCategory[]
  timetableSlots: TimetableSlot[]
  dateRange: { start: string; end: string }
  filterCategory: string
}

function blockDurationMinutes(start: string, end: string) {
  const [sh, sm] = start.split(':').map(Number)
  const [eh, em] = end.split(':').map(Number)
  return (eh * 60 + em) - (sh * 60 + sm)
}

function fmtHours(minutes: number) {
  return parseFloat((minutes / 60).toFixed(1))
}

function getDatesInRange(start: string, end: string): string[] {
  const dates: string[] = []
  const cur = new Date(start + 'T00:00:00')
  const endDate = new Date(end + 'T00:00:00')
  while (cur <= endDate) {
    dates.push(cur.toISOString().split('T')[0])
    cur.setDate(cur.getDate() + 1)
  }
  return dates
}

function shortDate(d: string) {
  const dt = new Date(d + 'T00:00:00')
  return dt.toLocaleDateString('en-US', { month: 'short', day: 'numeric' })
}

const CustomTooltip = ({ active, payload, label }: { active?: boolean; payload?: { name: string; value: number; color: string }[]; label?: string }) => {
  if (!active || !payload?.length) return null
  return (
    <div className="bg-surface border border-border rounded-lg p-3 text-xs shadow-xl">
      <p className="text-text-muted mb-2 font-medium">{label}</p>
      {payload.map((p) => (
        <div key={p.name} className="flex items-center gap-2 mb-1">
          <div className="w-2 h-2 rounded-full" style={{ backgroundColor: p.color }} />
          <span className="text-text-muted">{p.name}:</span>
          <span className="text-text-primary font-medium">{p.value}h</span>
        </div>
      ))}
    </div>
  )
}

export default function InsightsCharts({ blocks, categories, timetableSlots, dateRange, filterCategory }: Props) {
  const filteredBlocks = filterCategory
    ? blocks.filter((b) => b.category_id === filterCategory)
    : blocks

  // -- Chart 1: Daily stacked bar --
  const allDates = getDatesInRange(dateRange.start, dateRange.end)
  const dailyData = allDates.map((date) => {
    const dayBlocks = filteredBlocks.filter((b) => b.date === date)
    const row: Record<string, string | number> = { date: shortDate(date) }
    categories.forEach((cat) => {
      const mins = dayBlocks
        .filter((b) => b.category_id === cat.id)
        .reduce((sum, b) => sum + blockDurationMinutes(b.start_time, b.end_time), 0)
      row[cat.name] = fmtHours(mins)
    })
    return row
  })

  // -- Chart 2: Category distribution (donut) --
  const catTotals = categories.map((cat) => {
    const mins = filteredBlocks
      .filter((b) => b.category_id === cat.id)
      .reduce((sum, b) => sum + blockDurationMinutes(b.start_time, b.end_time), 0)
    return { name: cat.name, value: fmtHours(mins), color: cat.color, icon: cat.icon }
  }).filter((c) => c.value > 0)

  // -- Chart 3: Project time breakdown --
  const projectMap: Record<string, Record<string, number>> = {}
  filteredBlocks.forEach((block) => {
    ;(block.entries ?? []).forEach((entry) => {
      const projectName = entry.projects?.name ?? entry.goals?.name ?? null
      if (!projectName) return
      const actType = entry.activity_type ?? 'other'
      if (!projectMap[projectName]) projectMap[projectName] = {}
      projectMap[projectName][actType] = (projectMap[projectName][actType] ?? 0) + entry.duration_minutes
    })
  })
  const activityTypes = Array.from(
    new Set(
      Object.values(projectMap).flatMap((v) => Object.keys(v))
    )
  )
  const projectData = Object.entries(projectMap).map(([name, acts]) => {
    const row: Record<string, string | number> = { name }
    activityTypes.forEach((at) => { row[at] = fmtHours(acts[at] ?? 0) })
    return row
  })

  const ACT_COLORS = ['#FF6044', '#378ADD', '#9F7AEA', '#48BB78', '#F6AD55', '#63B3ED', '#FC8181', '#68D391', '#FBD38D']

  // -- Chart 4: Planned vs Actual --
  const planVsActual = categories.map((cat) => {
    const actualMins = filteredBlocks
      .filter((b) => b.category_id === cat.id)
      .reduce((sum, b) => sum + blockDurationMinutes(b.start_time, b.end_time), 0)
    const daysInRange = allDates.length
    const plannedMinsPerDay = timetableSlots
      .filter((s) => s.category_id === cat.id && s.active)
      .reduce((sum, s) => sum + blockDurationMinutes(s.start_time, s.end_time), 0)
    const plannedTotal = plannedMinsPerDay * daysInRange
    return {
      name: cat.name,
      Planned: fmtHours(plannedTotal),
      Actual: fmtHours(actualMins),
      color: cat.color,
    }
  }).filter((d) => d.Planned > 0 || d.Actual > 0)

  // -- Chart 5: Consistency line (hours per day) --
  const consistencyData = allDates.map((date) => {
    const dayMins = filteredBlocks
      .filter((b) => b.date === date)
      .reduce((sum, b) => sum + blockDurationMinutes(b.start_time, b.end_time), 0)
    return { date: shortDate(date), hours: fmtHours(dayMins) }
  })

  // -- Summary stats --
  const totalMins = filteredBlocks.reduce((sum, b) => sum + blockDurationMinutes(b.start_time, b.end_time), 0)
  const avgHoursPerDay = allDates.length > 0 ? fmtHours(totalMins / allDates.length) : 0
  const topCategory = catTotals.sort((a, b) => b.value - a.value)[0]
  const projectMinMap: Record<string, number> = {}
  filteredBlocks.forEach((b) => {
    ;(b.entries ?? []).forEach((e) => {
      if (e.projects?.name) {
        projectMinMap[e.projects.name] = (projectMinMap[e.projects.name] ?? 0) + e.duration_minutes
      }
    })
  })
  const topProject = Object.entries(projectMinMap).sort((a, b) => b[1] - a[1])[0]

  const isEmpty = filteredBlocks.length === 0

  if (isEmpty) {
    return (
      <div className="card text-center py-16">
        <p className="text-4xl mb-4">📊</p>
        <p className="text-text-primary font-medium font-heading">No time logged for this period</p>
        <p className="text-text-muted text-sm mt-1">Head to the Log tab to start tracking your time</p>
      </div>
    )
  }

  return (
    <div className="space-y-6">
      {/* Summary cards */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
        <div className="card">
          <p className="text-text-muted text-xs mb-1">Total hours</p>
          <p className="font-heading font-bold text-2xl text-coral">{fmtHours(totalMins)}h</p>
        </div>
        <div className="card">
          <p className="text-text-muted text-xs mb-1">Avg / day</p>
          <p className="font-heading font-bold text-2xl text-text-primary">{avgHoursPerDay}h</p>
        </div>
        <div className="card">
          <p className="text-text-muted text-xs mb-1">Top category</p>
          <p className="font-heading font-bold text-lg text-text-primary flex items-center gap-1.5 truncate">
            {topCategory ? <><CategoryIcon name={topCategory.name} size={16} color={topCategory.color} />{topCategory.name}</> : '—'}
          </p>
          {topCategory && <p className="text-xs text-text-muted">{topCategory.value}h</p>}
        </div>
        <div className="card">
          <p className="text-text-muted text-xs mb-1">Top project</p>
          <p className="font-heading font-bold text-lg text-text-primary truncate">
            {topProject ? topProject[0] : '—'}
          </p>
          {topProject && <p className="text-xs text-text-muted">{fmtHours(topProject[1])}h</p>}
        </div>
      </div>

      {/* Chart 1: Daily breakdown */}
      <div className="card">
        <h3 className="font-heading font-semibold mb-4">Daily Breakdown</h3>
        <ResponsiveContainer width="100%" height={220}>
          <BarChart data={dailyData} margin={{ top: 0, right: 0, left: -20, bottom: 0 }}>
            <XAxis dataKey="date" tick={{ fill: '#888888', fontSize: 11 }} axisLine={false} tickLine={false} />
            <YAxis tick={{ fill: '#888888', fontSize: 11 }} axisLine={false} tickLine={false} unit="h" />
            <Tooltip content={<CustomTooltip />} cursor={{ fill: 'rgba(255,255,255,0.04)' }} />
            <Legend wrapperStyle={{ fontSize: '11px', color: '#888888' }} />
            {categories.map((cat) => (
              <Bar key={cat.id} dataKey={cat.name} stackId="a" fill={cat.color} radius={[0, 0, 0, 0]} />
            ))}
          </BarChart>
        </ResponsiveContainer>
      </div>

      {/* Chart 2: Category donut */}
      <div className="card">
        <h3 className="font-heading font-semibold mb-4">Category Distribution</h3>
        <div className="flex flex-col md:flex-row items-center gap-6">
          <ResponsiveContainer width="100%" height={200}>
            <PieChart>
              <Pie
                data={catTotals}
                cx="50%"
                cy="50%"
                innerRadius={60}
                outerRadius={90}
                paddingAngle={2}
                dataKey="value"
              >
                {catTotals.map((entry, i) => (
                  <Cell key={i} fill={entry.color} />
                ))}
              </Pie>
              <Tooltip
                formatter={(v) => [`${v}h`, '']}
                contentStyle={{ backgroundColor: '#1C1C1C', border: '1px solid #2A2A2A', borderRadius: '8px', fontSize: '12px' }}
                labelStyle={{ color: '#888888' }}
              />
            </PieChart>
          </ResponsiveContainer>
          <div className="space-y-2 min-w-[160px]">
            {catTotals.map((cat) => (
              <div key={cat.name} className="flex items-center gap-2">
                <div className="w-3 h-3 rounded-full shrink-0" style={{ backgroundColor: cat.color }} />
                <span className="text-xs text-text-muted flex-1 flex items-center gap-1.5">
                  <CategoryIcon name={cat.name} size={12} color={cat.color} />
                  {cat.name}
                </span>
                <span className="text-xs font-medium text-text-primary">{cat.value}h</span>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* Chart 3: Project breakdown */}
      {projectData.length > 0 && (
        <div className="card">
          <h3 className="font-heading font-semibold mb-4">Project Time Breakdown</h3>
          <ResponsiveContainer width="100%" height={Math.max(200, projectData.length * 50)}>
            <BarChart data={projectData} layout="vertical" margin={{ top: 0, right: 20, left: 0, bottom: 0 }}>
              <XAxis type="number" tick={{ fill: '#888888', fontSize: 11 }} axisLine={false} tickLine={false} unit="h" />
              <YAxis
                type="category"
                dataKey="name"
                tick={{ fill: '#888888', fontSize: 11 }}
                axisLine={false}
                tickLine={false}
                width={110}
              />
              <Tooltip content={<CustomTooltip />} cursor={{ fill: 'rgba(255,255,255,0.04)' }} />
              <Legend wrapperStyle={{ fontSize: '11px', color: '#888888' }} />
              {activityTypes.map((at, i) => (
                <Bar key={at} dataKey={at} stackId="a" fill={ACT_COLORS[i % ACT_COLORS.length]} />
              ))}
            </BarChart>
          </ResponsiveContainer>
        </div>
      )}

      {/* Chart 4: Planned vs Actual */}
      {planVsActual.length > 0 && (
        <div className="card">
          <h3 className="font-heading font-semibold mb-4">Planned vs Actual</h3>
          <ResponsiveContainer width="100%" height={220}>
            <BarChart data={planVsActual} margin={{ top: 0, right: 0, left: -20, bottom: 0 }}>
              <XAxis dataKey="name" tick={{ fill: '#888888', fontSize: 11 }} axisLine={false} tickLine={false} />
              <YAxis tick={{ fill: '#888888', fontSize: 11 }} axisLine={false} tickLine={false} unit="h" />
              <Tooltip content={<CustomTooltip />} cursor={{ fill: 'rgba(255,255,255,0.04)' }} />
              <Legend wrapperStyle={{ fontSize: '11px', color: '#888888' }} />
              <Bar dataKey="Planned" fill="#2A2A2A" radius={[4, 4, 0, 0]} />
              <Bar
                dataKey="Actual"
                radius={[4, 4, 0, 0]}
                fill="#FF6044"
              />
            </BarChart>
          </ResponsiveContainer>
          <p className="text-xs text-text-muted mt-2">Bars in coral indicate categories where actual may be under plan</p>
        </div>
      )}

      {/* Chart 5: Consistency line */}
      <div className="card">
        <h3 className="font-heading font-semibold mb-4">Daily Consistency</h3>
        <ResponsiveContainer width="100%" height={180}>
          <LineChart data={consistencyData} margin={{ top: 4, right: 10, left: -20, bottom: 0 }}>
            <CartesianGrid strokeDasharray="3 3" stroke="#2A2A2A" />
            <XAxis dataKey="date" tick={{ fill: '#888888', fontSize: 11 }} axisLine={false} tickLine={false} />
            <YAxis tick={{ fill: '#888888', fontSize: 11 }} axisLine={false} tickLine={false} unit="h" />
            <Tooltip
              contentStyle={{ backgroundColor: '#1C1C1C', border: '1px solid #2A2A2A', borderRadius: '8px', fontSize: '12px' }}
              labelStyle={{ color: '#888888' }}
              formatter={(v) => [`${v}h`, 'Hours logged']}
            />
            <Line
              type="monotone"
              dataKey="hours"
              stroke="#FF6044"
              strokeWidth={2}
              dot={{ fill: '#FF6044', r: 3, strokeWidth: 0 }}
              activeDot={{ r: 5, fill: '#FF6044' }}
            />
          </LineChart>
        </ResponsiveContainer>
      </div>
    </div>
  )
}
