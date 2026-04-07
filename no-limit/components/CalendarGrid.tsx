'use client'

import { useState } from 'react'
import { format, startOfMonth, endOfMonth, eachDayOfInterval, isSameMonth, isToday, isSameDay, parseISO, startOfWeek, endOfWeek } from 'date-fns'
import { CalendarEvent } from '@/types'
import { getEventTypeColor, formatDate } from '@/lib/utils'

interface CalendarGridProps {
  events: CalendarEvent[]
  onAddEvent: (date: string) => void
}

export default function CalendarGrid({ events, onAddEvent }: CalendarGridProps) {
  const [currentMonth, setCurrentMonth] = useState(new Date())
  const [selectedDay, setSelectedDay] = useState<Date | null>(null)

  const monthStart = startOfMonth(currentMonth)
  const monthEnd = endOfMonth(currentMonth)
  const calStart = startOfWeek(monthStart, { weekStartsOn: 1 })
  const calEnd = endOfWeek(monthEnd, { weekStartsOn: 1 })
  const days = eachDayOfInterval({ start: calStart, end: calEnd })

  const getEventsForDay = (day: Date) =>
    events.filter((e) => isSameDay(parseISO(e.date), day))

  const selectedEvents = selectedDay ? getEventsForDay(selectedDay) : []

  return (
    <div className="flex gap-4 flex-col lg:flex-row">
      {/* Calendar */}
      <div className="flex-1">
        {/* Header */}
        <div className="flex items-center justify-between mb-4">
          <button
            onClick={() => setCurrentMonth(new Date(currentMonth.getFullYear(), currentMonth.getMonth() - 1))}
            className="p-2 rounded-lg hover:bg-white/5 text-text-muted hover:text-text-primary transition-all"
          >
            ←
          </button>
          <h2 className="font-heading font-semibold text-lg">
            {format(currentMonth, 'MMMM yyyy')}
          </h2>
          <button
            onClick={() => setCurrentMonth(new Date(currentMonth.getFullYear(), currentMonth.getMonth() + 1))}
            className="p-2 rounded-lg hover:bg-white/5 text-text-muted hover:text-text-primary transition-all"
          >
            →
          </button>
        </div>

        {/* Day headers */}
        <div className="grid grid-cols-7 mb-2">
          {['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun'].map((d) => (
            <div key={d} className="text-center text-xs text-text-muted py-2 font-medium">{d}</div>
          ))}
        </div>

        {/* Days */}
        <div className="grid grid-cols-7 gap-1">
          {days.map((day) => {
            const dayEvents = getEventsForDay(day)
            const isCurrentMonth = isSameMonth(day, currentMonth)
            const isSelected = selectedDay && isSameDay(day, selectedDay)
            const isTodayDay = isToday(day)

            return (
              <button
                key={day.toString()}
                onClick={() => setSelectedDay(isSelected ? null : day)}
                className={`relative aspect-square min-h-[40px] rounded-lg p-1 flex flex-col items-center transition-all text-sm ${
                  !isCurrentMonth ? 'opacity-30' : ''
                } ${isSelected ? 'bg-coral/20 border border-coral/40' : 'hover:bg-white/5'} ${
                  isTodayDay && !isSelected ? 'border border-coral/30' : ''
                }`}
              >
                <span className={`text-xs font-medium ${
                  isTodayDay ? 'text-coral' : isCurrentMonth ? 'text-text-primary' : 'text-text-muted'
                }`}>
                  {format(day, 'd')}
                </span>
                {dayEvents.length > 0 && (
                  <div className="flex gap-0.5 mt-0.5 flex-wrap justify-center">
                    {dayEvents.slice(0, 3).map((e) => (
                      <span
                        key={e.id}
                        className="w-1.5 h-1.5 rounded-full"
                        style={{ backgroundColor: getEventTypeColor(e.type) }}
                      />
                    ))}
                  </div>
                )}
              </button>
            )
          })}
        </div>
      </div>

      {/* Side panel */}
      <div className={`lg:w-72 transition-all ${selectedDay ? 'block' : 'hidden lg:block'}`}>
        <div className="card h-full min-h-[200px]">
          {selectedDay ? (
            <>
              <div className="flex items-center justify-between mb-4">
                <h3 className="font-heading font-semibold">{format(selectedDay, 'EEEE, MMM d')}</h3>
                <button
                  onClick={() => onAddEvent(format(selectedDay, 'yyyy-MM-dd'))}
                  className="btn-primary text-xs px-3 py-1.5"
                >
                  + Add
                </button>
              </div>
              {selectedEvents.length === 0 ? (
                <div className="text-center py-6">
                  <p className="text-text-muted text-sm">No events this day</p>
                  <button
                    onClick={() => onAddEvent(format(selectedDay, 'yyyy-MM-dd'))}
                    className="text-coral text-xs mt-2 hover:underline"
                  >
                    Add one
                  </button>
                </div>
              ) : (
                <div className="space-y-2">
                  {selectedEvents.map((event) => (
                    <div
                      key={event.id}
                      className="p-3 rounded-lg bg-space-black border border-border"
                      style={{ borderLeftColor: getEventTypeColor(event.type), borderLeftWidth: 3 }}
                    >
                      <p className="text-sm font-medium text-text-primary">{event.title}</p>
                      <p className="text-xs text-text-muted mt-0.5 capitalize">{event.type}</p>
                      {event.notes && (
                        <p className="text-xs text-text-muted mt-1">{event.notes}</p>
                      )}
                    </div>
                  ))}
                </div>
              )}
            </>
          ) : (
            <div className="flex items-center justify-center h-full py-12">
              <p className="text-text-muted text-sm text-center">Click a day to see events</p>
            </div>
          )}
        </div>
      </div>
    </div>
  )
}
