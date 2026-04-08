'use client'

import { useState } from 'react'
import { Plus, Pencil, Power } from 'lucide-react'
import { TimetableSlot, TimeCategory } from '@/types'
import { supabase } from '@/lib/supabase'
import { CategoryIcon } from '@/lib/categoryIcons'

const DAYS = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat']

interface Props {
  slots: TimetableSlot[]
  categories: TimeCategory[]
  onSlotsChange: (slots: TimetableSlot[]) => void
}

function timeToMinutes(time: string) {
  const [h, m] = time.split(':').map(Number)
  return h * 60 + m
}

function to12h(time: string) {
  const [h, m] = time.split(':').map(Number)
  const period = h >= 12 ? 'PM' : 'AM'
  const hour = h % 12 || 12
  return `${hour}:${String(m).padStart(2, '0')} ${period}`
}

const PRESET_COLORS = [
  '#FF6044', '#378ADD', '#9F7AEA', '#48BB78',
  '#888888', '#F6AD55', '#63B3ED', '#FC8181',
  '#F687B3', '#68D391', '#FBD38D', '#76E4F7',
]

export default function TimetableTimeline({ slots, categories, onSlotsChange }: Props) {
  const [selectedDay, setSelectedDay] = useState(new Date().getDay())
  const [showAddForm, setShowAddForm] = useState(false)
  const [editingSlot, setEditingSlot] = useState<TimetableSlot | null>(null)
  const [saving, setSaving] = useState(false)
  const [showCatForm, setShowCatForm] = useState(false)
  const [newCat, setNewCat] = useState({ name: '', icon: '', color: '#FF6044' })
  const [catSaving, setCatSaving] = useState(false)
  const [localCategories, setLocalCategories] = useState<TimeCategory[]>(categories)

  const emptyForm = {
    label: '',
    category_id: '',
    start_time: '08:00',
    end_time: '09:00',
    days_of_week: [1, 2, 3, 4, 5] as number[],
  }
  const [form, setForm] = useState(emptyForm)

  const daySlots = slots
    .filter((s) => s.active && s.days_of_week.includes(selectedDay))
    .sort((a, b) => timeToMinutes(a.start_time) - timeToMinutes(b.start_time))

  const toggleDay = (d: number) => {
    setForm((f) => ({
      ...f,
      days_of_week: f.days_of_week.includes(d)
        ? f.days_of_week.filter((x) => x !== d)
        : [...f.days_of_week, d],
    }))
  }

  const handleSave = async () => {
    if (!form.label.trim()) return
    setSaving(true)
    if (editingSlot) {
      const { data, error } = await supabase
        .from('timetable_slots')
        .update({
          label: form.label.trim(),
          category_id: form.category_id || null,
          start_time: form.start_time,
          end_time: form.end_time,
          days_of_week: form.days_of_week,
        })
        .eq('id', editingSlot.id)
        .select('*, time_categories(*)')
        .single()
      if (!error && data) {
        onSlotsChange(slots.map((s) => s.id === editingSlot.id ? data : s))
      }
      setEditingSlot(null)
    } else {
      const { data, error } = await supabase
        .from('timetable_slots')
        .insert({
          label: form.label.trim(),
          category_id: form.category_id || null,
          start_time: form.start_time,
          end_time: form.end_time,
          days_of_week: form.days_of_week,
          sort_order: slots.length,
        })
        .select('*, time_categories(*)')
        .single()
      if (!error && data) {
        onSlotsChange([...slots, data])
      }
      setShowAddForm(false)
    }
    setForm(emptyForm)
    setSaving(false)
  }

  const handleToggleActive = async (slot: TimetableSlot) => {
    await supabase.from('timetable_slots').update({ active: !slot.active }).eq('id', slot.id)
    onSlotsChange(slots.map((s) => s.id === slot.id ? { ...s, active: !s.active } : s))
  }

  const startEdit = (slot: TimetableSlot) => {
    setEditingSlot(slot)
    setForm({
      label: slot.label,
      category_id: slot.category_id ?? '',
      start_time: slot.start_time.slice(0, 5),
      end_time: slot.end_time.slice(0, 5),
      days_of_week: slot.days_of_week,
    })
    setShowAddForm(false)
  }

  const handleAddCategory = async () => {
    if (!newCat.name.trim()) return
    setCatSaving(true)
    const { data, error } = await supabase
      .from('time_categories')
      .insert({ name: newCat.name.trim(), icon: newCat.icon || null, color: newCat.color, sort_order: localCategories.length })
      .select()
      .single()
    if (!error && data) {
      setLocalCategories((prev) => [...prev, data])
      setForm((f) => ({ ...f, category_id: data.id }))
      setNewCat({ name: '', icon: '', color: '#FF6044' })
      setShowCatForm(false)
    }
    setCatSaving(false)
  }

  const SlotForm = () => (
    <div className="border border-border rounded-xl p-4 space-y-3 bg-surface">
      <p className="text-sm font-medium text-text-primary">{editingSlot ? 'Edit slot' : 'Add slot'}</p>
      <div>
        <label className="label">Label</label>
        <input
          className="input"
          placeholder="e.g. Morning Deep Work"
          value={form.label}
          onChange={(e) => setForm({ ...form, label: e.target.value })}
        />
      </div>
      <div>
        <div className="flex items-center justify-between mb-1">
          <label className="label">Category</label>
          <button onClick={() => setShowCatForm((p) => !p)} className="text-xs text-coral hover:underline">
            + New category
          </button>
        </div>
        {showCatForm && (
          <div className="border border-border rounded-lg p-3 space-y-2 mb-2 bg-space-black">
            <input
              className="input text-sm py-1.5"
              placeholder="Category name"
              value={newCat.name}
              onChange={(e) => setNewCat({ ...newCat, name: e.target.value })}
            />
            <div className="grid grid-cols-1 gap-2">
              <div>
                <p className="label text-xs mb-1">Color</p>
                <div className="flex flex-wrap gap-1.5">
                  {PRESET_COLORS.map((c) => (
                    <button
                      key={c}
                      onClick={() => setNewCat({ ...newCat, color: c })}
                      className={`w-6 h-6 rounded-full border-2 transition-all ${newCat.color === c ? 'border-white scale-110' : 'border-transparent'}`}
                      style={{ backgroundColor: c }}
                    />
                  ))}
                </div>
                <div className="flex items-center gap-2 mt-2">
                  <input
                    type="color"
                    className="w-8 h-8 rounded cursor-pointer border border-border bg-transparent"
                    value={newCat.color}
                    onChange={(e) => setNewCat({ ...newCat, color: e.target.value })}
                  />
                  <span className="text-xs text-text-muted">{newCat.color}</span>
                </div>
              </div>
            </div>
            <div className="flex gap-2">
              <button onClick={() => setShowCatForm(false)} className="btn-ghost text-xs py-1.5 px-3">Cancel</button>
              <button onClick={handleAddCategory} disabled={catSaving || !newCat.name.trim()} className="btn-primary text-xs py-1.5 px-3">
                {catSaving ? 'Saving...' : 'Add'}
              </button>
            </div>
          </div>
        )}
        <select
          className="input"
          value={form.category_id}
          onChange={(e) => setForm({ ...form, category_id: e.target.value })}
        >
          <option value="">No category</option>
          {localCategories.map((c) => (
            <option key={c.id} value={c.id}>{c.name}</option>
          ))}
        </select>
      </div>
      <div className="grid grid-cols-2 gap-3">
        <div>
          <label className="label">Start time</label>
          <input
            type="time"
            className="input"
            value={form.start_time}
            onChange={(e) => setForm({ ...form, start_time: e.target.value })}
          />
        </div>
        <div>
          <label className="label">End time</label>
          <input
            type="time"
            className="input"
            value={form.end_time}
            onChange={(e) => setForm({ ...form, end_time: e.target.value })}
          />
        </div>
      </div>
      <div>
        <label className="label">Days of week</label>
        <div className="flex gap-1.5 flex-wrap">
          {DAYS.map((day, i) => (
            <button
              key={day}
              onClick={() => toggleDay(i)}
              className={`px-2.5 py-1 rounded-lg text-xs font-medium border transition-all ${
                form.days_of_week.includes(i)
                  ? 'bg-coral/10 text-coral border-coral/30'
                  : 'text-text-muted border-border hover:border-coral/20'
              }`}
            >
              {day}
            </button>
          ))}
        </div>
      </div>
      <div className="flex gap-2">
        <button
          onClick={() => { setShowAddForm(false); setEditingSlot(null); setForm(emptyForm) }}
          className="btn-ghost text-sm"
        >
          Cancel
        </button>
        <button onClick={handleSave} disabled={saving || !form.label.trim()} className="btn-primary text-sm">
          {saving ? 'Saving...' : editingSlot ? 'Update' : 'Add Slot'}
        </button>
      </div>
    </div>
  )

  return (
    <div className="space-y-4">
      {/* Day filter */}
      <div className="flex gap-1.5 flex-wrap">
        {DAYS.map((day, i) => (
          <button
            key={day}
            onClick={() => setSelectedDay(i)}
            className={`px-3 py-1.5 rounded-lg text-xs font-medium border transition-all ${
              selectedDay === i
                ? 'bg-coral text-white border-coral'
                : 'text-text-muted border-border hover:text-text-primary hover:border-coral/30'
            }`}
          >
            {day}
          </button>
        ))}
      </div>

      {/* Add / Edit form */}
      {(showAddForm || editingSlot) && <SlotForm />}

      {/* Timeline */}
      <div className="relative">
        {/* Hour markers */}
        <div className="space-y-0">
          {Array.from({ length: 25 }, (_, h) => (
            <div key={h} className="flex items-start gap-3" style={{ height: '40px' }}>
              <span className="text-xs text-text-muted w-12 shrink-0 pt-0">{h === 0 ? '12 AM' : h < 12 ? `${h} AM` : h === 12 ? '12 PM' : `${h - 12} PM`}</span>
              <div className="flex-1 border-t border-border/30 pt-0 relative">
                {/* Slots that start at this hour */}
                {daySlots.filter((s) => {
                  const startH = parseInt(s.start_time.split(':')[0])
                  const startM = parseInt(s.start_time.split(':')[1])
                  return startH === h && startM < 30
                }).map((slot) => {
                  const cat = localCategories.find((c) => c.id === slot.category_id)
                  const startMin = timeToMinutes(slot.start_time.slice(0, 5))
                  const endMin = timeToMinutes(slot.end_time.slice(0, 5))
                  const durationH = (endMin - startMin) / 60
                  return (
                    <div
                      key={slot.id}
                      className="absolute left-0 right-0 rounded-lg px-3 py-1.5 flex items-center justify-between group"
                      style={{
                        backgroundColor: (cat?.color ?? '#888888') + '22',
                        borderLeft: `3px solid ${cat?.color ?? '#888888'}`,
                        top: '1px',
                        minHeight: `${Math.max(durationH * 40, 32)}px`,
                        zIndex: 10,
                      }}
                    >
                      <div>
                        <p className="text-xs font-medium flex items-center gap-1" style={{ color: cat?.color ?? '#888888' }}>
                          {cat && <CategoryIcon name={cat.name} size={11} color={cat.color} />}
                          {slot.label}
                        </p>
                        <p className="text-xs text-text-muted">{to12h(slot.start_time.slice(0, 5))} – {to12h(slot.end_time.slice(0, 5))}</p>
                      </div>
                      <div className="flex items-center gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                        <button
                          onClick={() => startEdit(slot)}
                          className="p-1 rounded text-text-muted hover:text-text-primary hover:bg-white/10 transition-all"
                        >
                          <Pencil size={11} />
                        </button>
                        <button
                          onClick={() => handleToggleActive(slot)}
                          className={`p-1 rounded transition-all ${slot.active ? 'text-success hover:text-text-muted' : 'text-text-muted hover:text-success'} hover:bg-white/10`}
                        >
                          <Power size={11} />
                        </button>
                      </div>
                    </div>
                  )
                })}
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Add slot button */}
      {!showAddForm && !editingSlot && (
        <button
          onClick={() => { setShowAddForm(true); setEditingSlot(null) }}
          className="flex items-center gap-2 text-sm text-coral hover:underline"
        >
          <Plus size={15} /> Add slot
        </button>
      )}

      {/* Inactive slots */}
      {slots.filter((s) => !s.active && s.days_of_week.includes(selectedDay)).length > 0 && (
        <div className="mt-4">
          <p className="text-xs text-text-muted mb-2 uppercase tracking-wide">Inactive slots</p>
          <div className="space-y-1">
            {slots.filter((s) => !s.active && s.days_of_week.includes(selectedDay)).map((slot) => {
              const cat = localCategories.find((c) => c.id === slot.category_id)
              return (
                <div key={slot.id} className="flex items-center gap-3 p-2.5 rounded-lg border border-border opacity-50">
                  <div className="w-2 h-2 rounded-full shrink-0" style={{ backgroundColor: cat?.color ?? '#888' }} />
                  <span className="text-sm text-text-muted flex-1">{slot.label}</span>
                  <span className="text-xs text-text-muted">{to12h(slot.start_time.slice(0, 5))} – {to12h(slot.end_time.slice(0, 5))}</span>
                  <button
                    onClick={() => handleToggleActive(slot)}
                    className="p-1 rounded text-text-muted hover:text-success hover:bg-white/10 transition-all"
                  >
                    <Power size={13} />
                  </button>
                </div>
              )
            })}
          </div>
        </div>
      )}
    </div>
  )
}
