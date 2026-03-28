import { getDb } from '.'

export interface NoteRow {
  id: number
  date: string
  content: string
  created_at: string
  updated_at: string
}

export function getNoteByDate(date: string): NoteRow | null {
  return (getDb().get('SELECT * FROM daily_notes WHERE date=?', [date]) as NoteRow) ?? null
}

export function getDatesWithNotes(): string[] {
  const rows = getDb().all("SELECT date FROM daily_notes WHERE content != '' ORDER BY date DESC") as { date: string }[]
  return rows.map(r => r.date)
}

export function upsertNote(date: string, content: string): NoteRow {
  const db = getDb()
  const existing = db.get('SELECT id FROM daily_notes WHERE date=?', [date]) as { id: number } | null
  if (existing) {
    db.run("UPDATE daily_notes SET content=?, updated_at=datetime('now') WHERE date=?", [content, date])
  } else {
    db.run('INSERT INTO daily_notes (date, content) VALUES (?,?)', [date, content])
  }
  return db.get('SELECT * FROM daily_notes WHERE date=?', [date]) as NoteRow
}
