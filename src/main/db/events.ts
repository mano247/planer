import { getDb } from '.'
import { upsertActivity } from './activities'

export interface CalendarEventRow {
  id: number
  date: string
  title: string
  note: string | null
  created_at: string
}

export interface CalendarEventInput {
  date: string
  title: string
  note?: string
}

export function getEventsByMonth(year: number, month: number): CalendarEventRow[] {
  const prefix = `${year}-${String(month).padStart(2, '0')}`
  return getDb().all("SELECT * FROM calendar_events WHERE date LIKE ? ORDER BY date", [`${prefix}%`]) as CalendarEventRow[]
}

export function getEventsByDateRange(startDate: string, endDate: string): CalendarEventRow[] {
  return getDb().all("SELECT * FROM calendar_events WHERE date >= ? AND date <= ? ORDER BY date", [startDate, endDate]) as CalendarEventRow[]
}

export function createEvent(input: CalendarEventInput): CalendarEventRow {
  const db = getDb()
  const result = db.run(
    'INSERT INTO calendar_events (date, title, note) VALUES (?,?,?)',
    [input.date, input.title, input.note ?? null]
  )
  const eventId = Number(result.lastInsertRowid)

  // Sync to schedule: find first available 30-min slot
  const existing = db.all('SELECT start_time FROM activities WHERE date=? ORDER BY start_time', [input.date]) as { start_time: string }[]
  const occupiedSlots = new Set(existing.map(r => r.start_time))
  const firstSlot = findFirstFreeSlot(occupiedSlots)

  upsertActivity({
    date: input.date,
    start_time: firstSlot,
    end_time: addMinutes(firstSlot, 30),
    name: input.title,
    category_id: null,
    is_event: 1,
    event_id: eventId
  })

  return db.get('SELECT * FROM calendar_events WHERE id=?', [eventId]) as CalendarEventRow
}

export function updateEvent(id: number, input: Partial<CalendarEventInput>): void {
  const db = getDb()
  if (input.title !== undefined) {
    db.run('UPDATE calendar_events SET title=? WHERE id=?', [input.title, id])
    db.run("UPDATE activities SET name=?, updated_at=datetime('now') WHERE event_id=?", [input.title, id])
  }
  if (input.note !== undefined) {
    db.run('UPDATE calendar_events SET note=? WHERE id=?', [input.note, id])
  }
}

export function deleteEvent(id: number): void {
  const db = getDb()
  db.run('DELETE FROM activities WHERE event_id=?', [id])
  db.run('DELETE FROM calendar_events WHERE id=?', [id])
}

function findFirstFreeSlot(occupied: Set<string>): string {
  for (let h = 0; h < 24; h++) {
    for (const m of [0, 30]) {
      const slot = `${String(h).padStart(2, '0')}:${String(m).padStart(2, '0')}`
      if (!occupied.has(slot)) return slot
    }
  }
  return '23:30'
}

function addMinutes(time: string, minutes: number): string {
  const [h, m] = time.split(':').map(Number)
  const total = h * 60 + m + minutes
  return `${String(Math.floor(total / 60) % 24).padStart(2, '0')}:${String(total % 60).padStart(2, '0')}`
}
