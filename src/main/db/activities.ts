import { Database } from 'node-sqlite3-wasm'
import { getDb } from '.'

export interface ActivityRow {
  id: number
  date: string
  start_time: string
  end_time: string
  name: string
  category_id: number | null
  is_event: number
  event_id: number | null
  created_at: string
  updated_at: string
  category_icon?: string
  category_color?: string
  category_name_en?: string
  category_name_sr?: string
}

export interface ActivityInput {
  id?: number
  date: string
  start_time: string
  end_time: string
  name: string
  category_id?: number | null
  is_event?: number
  event_id?: number | null
}

const SELECT_WITH_CATEGORY = `
  SELECT a.*,
         c.icon as category_icon,
         c.color as category_color,
         c.name_en as category_name_en,
         c.name_sr as category_name_sr
  FROM activities a
  LEFT JOIN categories c ON a.category_id = c.id
`

export function getActivitiesByWeek(weekStart: string, weekEnd: string): ActivityRow[] {
  return getDb().all(
    `${SELECT_WITH_CATEGORY} WHERE a.date >= ? AND a.date <= ? ORDER BY a.date, a.start_time`,
    [weekStart, weekEnd]
  ) as ActivityRow[]
}

export function getActivitiesByDate(date: string): ActivityRow[] {
  return getDb().all(
    `${SELECT_WITH_CATEGORY} WHERE a.date = ? ORDER BY a.start_time`,
    [date]
  ) as ActivityRow[]
}

export function getActivitiesByDateRange(startDate: string, endDate: string): ActivityRow[] {
  return getDb().all(
    `${SELECT_WITH_CATEGORY} WHERE a.date >= ? AND a.date <= ? ORDER BY a.date, a.start_time`,
    [startDate, endDate]
  ) as ActivityRow[]
}

export function upsertActivity(input: ActivityInput): ActivityRow {
  const db = getDb()
  if (input.id) {
    db.run(
      `UPDATE activities SET date=?, start_time=?, end_time=?, name=?, category_id=?, updated_at=datetime('now') WHERE id=?`,
      [input.date, input.start_time, input.end_time, input.name, input.category_id ?? null, input.id]
    )
    return db.get(`${SELECT_WITH_CATEGORY} WHERE a.id = ?`, [input.id]) as ActivityRow
  } else {
    const result = db.run(
      `INSERT INTO activities (date, start_time, end_time, name, category_id, is_event, event_id) VALUES (?,?,?,?,?,?,?)`,
      [input.date, input.start_time, input.end_time, input.name, input.category_id ?? null, input.is_event ?? 0, input.event_id ?? null]
    )
    return db.get(`${SELECT_WITH_CATEGORY} WHERE a.id = ?`, [Number(result.lastInsertRowid)]) as ActivityRow
  }
}

export function deleteActivity(id: number): void {
  getDb().run('DELETE FROM activities WHERE id = ?', [id])
}

export function updateActivityCategory(id: number, categoryId: number | null): void {
  getDb().run("UPDATE activities SET category_id=?, updated_at=datetime('now') WHERE id=?", [categoryId, id])
}
