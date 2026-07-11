import { TimeBlock, TimeCategory, TimetableSlot } from '@/types'

export const ACTIVITY_TYPES = [
  'research', 'calls', 'planning', 'coding', 'reading',
  'admin', 'meetings', 'exercise', 'travel', 'rest', 'other',
] as const

/** Words people actually type, mapped to the canonical activity_type values. */
const ACTIVITY_SYNONYMS: Record<string, string> = {
  research: 'research', researching: 'research', reviewing: 'research',
  call: 'calls', calls: 'calls', calling: 'calls', pitching: 'calls', pitch: 'calls',
  plan: 'planning', planning: 'planning', planned: 'planning',
  code: 'coding', coding: 'coding', coded: 'coding', building: 'coding', build: 'coding', debugging: 'coding',
  read: 'reading', reading: 'reading',
  admin: 'admin', email: 'admin', emails: 'admin', invoicing: 'admin',
  meeting: 'meetings', meetings: 'meetings', meet: 'meetings', standup: 'meetings',
  exercise: 'exercise', gym: 'exercise', workout: 'exercise', run: 'exercise', running: 'exercise',
  travel: 'travel', commute: 'travel', commuting: 'travel', driving: 'travel',
  rest: 'rest', resting: 'rest', nap: 'rest', sleep: 'rest', break: 'rest',
}

const FILLER_WORDS = new Set([
  'on', 'for', 'the', 'a', 'an', 'of', 'did', 'do', 'doing', 'spent', 'worked',
  'work', 'working', 'at', 'with', 'to', 'my', 'some', 'and', 'in',
])

const DEFAULT_DURATION_MINUTES = 60
const DAY_END_MINUTES = 24 * 60

export interface QuickLogContext {
  projects: { id: string; name: string }[]
  goals: { id: string; name: string }[]
  categories: TimeCategory[]
  slots: TimetableSlot[]
  /** Blocks already logged on the target date — used to chain new entries after them. */
  blocks: TimeBlock[]
  /** Target date, yyyy-MM-dd. */
  date: string
  now: Date
}

export type TimeSource = 'range' | 'duration' | 'default'
export type CategorySource = 'explicit' | 'timetable' | 'none'

export interface QuickLogDraft {
  startTime: string
  endTime: string
  durationMinutes: number
  timeSource: TimeSource
  categoryId: string | null
  categorySource: CategorySource
  projectId: string | null
  goalId: string | null
  /** Display name of whatever the entry got linked to. */
  linkedName: string | null
  activityType: string | null
  notes: string | null
  warning: string | null
}

export function toMinutes(time: string): number {
  const [h, m] = time.split(':').map(Number)
  return h * 60 + (m || 0)
}

export function toTimeString(minutes: number): string {
  const clamped = Math.max(0, Math.min(DAY_END_MINUTES, Math.round(minutes)))
  const h = Math.floor(clamped / 60) % 24
  const m = clamped % 60
  return `${String(h).padStart(2, '0')}:${String(m).padStart(2, '0')}`
}

export function to12h(time: string): string {
  const [h, m] = time.split(':').map(Number)
  const period = h >= 12 ? 'PM' : 'AM'
  const hour = h % 12 || 12
  return `${hour}:${String(m).padStart(2, '0')} ${period}`
}

export function fmtDuration(minutes: number): string {
  if (minutes <= 0) return '0min'
  const h = Math.floor(minutes / 60)
  const m = minutes % 60
  if (h === 0) return `${m}min`
  if (m === 0) return `${h}hr`
  return `${h}hr ${m}min`
}

function normalizeWords(text: string): string[] {
  return text.toLowerCase().split(/[^a-z0-9]+/).filter(Boolean)
}

/** Rounds down to the nearest 5 minutes — logging is retrospective, not stopwatch-precise. */
function roundDownTo5(minutes: number): number {
  return Math.floor(minutes / 5) * 5
}

interface TimeRange { start: number; end: number }

/**
 * Matches "9-11", "9am-11:30am", "14:00 - 15:30", "9 to 11".
 * With no am/pm, hours are read literally on a 24h clock — predictable beats
 * clever, and the preview chip shows the result before it is saved.
 */
function parseRange(text: string): { range: TimeRange; matched: string } | null {
  const re = /(\d{1,2})(?::(\d{2}))?\s*(am|pm)?\s*(?:-|–|—|to)\s*(\d{1,2})(?::(\d{2}))?\s*(am|pm)?/i
  const m = text.match(re)
  if (!m) return null

  const [matched, sh, sm, sMer, eh, em, eMer] = m

  // A bare "1h30" style token must not be read as a range.
  if (!sMer && !eMer && !sm && !em && matched.length <= 3) return null

  const applyMeridiem = (hour: number, meridiem?: string): number => {
    if (!meridiem) return hour
    const lower = meridiem.toLowerCase()
    if (lower === 'pm') return hour === 12 ? 12 : hour + 12
    return hour === 12 ? 0 : hour
  }

  let startHour = Number(sh)
  let endHour = Number(eh)
  if (startHour > 23 || endHour > 23) return null

  // "2-4pm" — the trailing meridiem governs both halves.
  const effectiveStartMeridiem = sMer || (eMer && Number(sh) <= Number(eh) ? eMer : undefined)

  const start = applyMeridiem(startHour, effectiveStartMeridiem) * 60 + Number(sm || 0)
  const end = applyMeridiem(endHour, eMer) * 60 + Number(em || 0)

  return { range: { start, end }, matched }
}

/** Matches "2h", "1h30", "1h 30m", "1.5h", "90m", "45 mins". */
function parseDuration(text: string): { minutes: number; matched: string } | null {
  const hoursAndMins = text.match(/(\d+(?:\.\d+)?)\s*(?:h|hr|hrs|hour|hours)\s*(\d{1,2})?\s*(?:m|min|mins|minute|minutes)?/i)
  if (hoursAndMins) {
    const hours = parseFloat(hoursAndMins[1])
    const extraMins = hoursAndMins[2] ? Number(hoursAndMins[2]) : 0
    const minutes = Math.round(hours * 60) + extraMins
    if (minutes > 0) return { minutes, matched: hoursAndMins[0] }
  }

  const minsOnly = text.match(/(\d+)\s*(?:m|min|mins|minute|minutes)\b/i)
  if (minsOnly) {
    const minutes = Number(minsOnly[1])
    if (minutes > 0) return { minutes, matched: minsOnly[0] }
  }

  return null
}

/**
 * Scores each candidate by how many of its name-words appear in the input, so
 * "kapgrade" finds "Kapgrade Dairy" without needing the full name typed out.
 */
function fuzzyMatch<T extends { id: string; name: string }>(
  candidates: T[],
  words: string[]
): { item: T; matchedWords: string[] } | null {
  const wordSet = new Set(words)
  let best: { item: T; matchedWords: string[]; score: number } | null = null

  for (const candidate of candidates) {
    const nameWords = normalizeWords(candidate.name).filter((w) => w.length >= 3)
    if (nameWords.length === 0) continue

    const matchedWords = nameWords.filter((w) => wordSet.has(w))
    if (matchedWords.length === 0) continue

    const score = matchedWords.length / nameWords.length
    if (!best || score > best.score) {
      best = { item: candidate, matchedWords, score }
    }
  }

  return best ? { item: best.item, matchedWords: best.matchedWords } : null
}

function findCategoryByToken(categories: TimeCategory[], token: string): TimeCategory | null {
  const normalized = token.toLowerCase()
  return (
    categories.find((c) => c.name.toLowerCase() === normalized) ??
    categories.find((c) => c.name.toLowerCase().startsWith(normalized)) ??
    null
  )
}

/** The timetable is the user's declared intent for that hour — a solid category default. */
function categoryFromTimetable(
  slots: TimetableSlot[],
  date: string,
  startMinutes: number
): string | null {
  const dayOfWeek = new Date(`${date}T00:00:00`).getDay()

  const slot = slots.find((s) => {
    if (!s.active || !s.days_of_week?.includes(dayOfWeek)) return false
    const start = toMinutes(s.start_time)
    const end = toMinutes(s.end_time)
    return startMinutes >= start && startMinutes < end
  })

  return slot?.category_id ?? null
}

function anchorStart(ctx: QuickLogContext, durationMinutes: number): number {
  const isToday = ctx.date === formatDate(ctx.now)

  const lastEnd = ctx.blocks.length
    ? Math.max(...ctx.blocks.map((b) => toMinutes(b.end_time)))
    : null

  if (isToday) {
    const nowMinutes = roundDownTo5(ctx.now.getHours() * 60 + ctx.now.getMinutes())

    // Chain onto the last block when the new entry still fits before "now" — so
    // logging two activities back to back fills the day sequentially.
    if (lastEnd !== null && lastEnd + durationMinutes <= nowMinutes) {
      return lastEnd
    }
    return Math.max(0, nowMinutes - durationMinutes)
  }

  // Past or future date: continue after whatever is already logged.
  return lastEnd ?? toMinutes('09:00')
}

function formatDate(date: Date): string {
  const y = date.getFullYear()
  const m = String(date.getMonth() + 1).padStart(2, '0')
  const d = String(date.getDate()).padStart(2, '0')
  return `${y}-${m}-${d}`
}

function overlapWarning(ctx: QuickLogContext, start: number, end: number): string | null {
  const clash = ctx.blocks.find((b) => {
    const bStart = toMinutes(b.start_time)
    const bEnd = toMinutes(b.end_time)
    return start < bEnd && end > bStart
  })

  if (!clash) return null
  return `Overlaps your ${to12h(clash.start_time.slice(0, 5))}–${to12h(clash.end_time.slice(0, 5))} block`
}

export function parseQuickLog(input: string, ctx: QuickLogContext): QuickLogDraft {
  let remaining = ` ${input} `

  const consume = (matched: string) => {
    const index = remaining.toLowerCase().indexOf(matched.toLowerCase())
    if (index === -1) return
    remaining = remaining.slice(0, index) + ' ' + remaining.slice(index + matched.length)
  }

  // --- Time ---
  const rangeMatch = parseRange(remaining)
  if (rangeMatch) consume(rangeMatch.matched)

  const durationMatch = !rangeMatch ? parseDuration(remaining) : null
  if (durationMatch) consume(durationMatch.matched)

  // --- Explicit #category ---
  let categoryId: string | null = null
  let categorySource: CategorySource = 'none'
  const categoryToken = remaining.match(/#([\w-]+)/)
  if (categoryToken) {
    const category = findCategoryByToken(ctx.categories, categoryToken[1])
    if (category) {
      categoryId = category.id
      categorySource = 'explicit'
    }
    consume(categoryToken[0])
  }

  // --- Explicit @project ---
  let projectId: string | null = null
  let goalId: string | null = null
  let linkedName: string | null = null
  const atToken = remaining.match(/@([\w-]+)/)
  if (atToken) {
    const token = atToken[1].toLowerCase()
    const project = ctx.projects.find((p) => normalizeWords(p.name).some((w) => w.startsWith(token)))
    const goal = !project
      ? ctx.goals.find((g) => normalizeWords(g.name).some((w) => w.startsWith(token)))
      : null

    if (project) {
      projectId = project.id
      linkedName = project.name
    } else if (goal) {
      goalId = goal.id
      linkedName = goal.name
    }
    consume(atToken[0])
  }

  const words = normalizeWords(remaining)

  // --- Implicit project/goal match ---
  if (!projectId && !goalId) {
    const projectMatch = fuzzyMatch(ctx.projects, words)
    if (projectMatch) {
      projectId = projectMatch.item.id
      linkedName = projectMatch.item.name
      projectMatch.matchedWords.forEach(consume)
    } else {
      const goalMatch = fuzzyMatch(ctx.goals, words)
      if (goalMatch) {
        goalId = goalMatch.item.id
        linkedName = goalMatch.item.name
        goalMatch.matchedWords.forEach(consume)
      }
    }
  }

  // --- Activity type ---
  let activityType: string | null = null
  for (const word of normalizeWords(remaining)) {
    const canonical = ACTIVITY_SYNONYMS[word]
    if (canonical) {
      activityType = canonical
      consume(word)
      break
    }
  }

  // --- Resolve the time range ---
  let start: number
  let end: number
  let timeSource: TimeSource
  let warning: string | null = null

  if (rangeMatch) {
    start = rangeMatch.range.start
    end = rangeMatch.range.end
    timeSource = 'range'
    if (end <= start) {
      warning = 'End time is before the start time'
      end = start + DEFAULT_DURATION_MINUTES
    }
  } else {
    const duration = durationMatch?.minutes ?? DEFAULT_DURATION_MINUTES
    timeSource = durationMatch ? 'duration' : 'default'
    start = anchorStart(ctx, duration)
    end = start + duration
  }

  if (end > DAY_END_MINUTES) {
    end = DAY_END_MINUTES
    warning = warning ?? 'Trimmed to the end of the day'
  }

  // --- Category fallback from the timetable ---
  if (!categoryId) {
    const fromTimetable = categoryFromTimetable(ctx.slots, ctx.date, start)
    if (fromTimetable) {
      categoryId = fromTimetable
      categorySource = 'timetable'
    }
  }

  warning = warning ?? overlapWarning(ctx, start, end)

  // --- Whatever is left is the note ---
  const notes = remaining
    .split(/\s+/)
    .filter(Boolean)
    .filter((w) => !FILLER_WORDS.has(w.toLowerCase()))
    .join(' ')
    .trim()

  return {
    startTime: toTimeString(start),
    endTime: toTimeString(end),
    durationMinutes: end - start,
    timeSource,
    categoryId,
    categorySource,
    projectId,
    goalId,
    linkedName,
    activityType,
    notes: notes || null,
    warning,
  }
}
