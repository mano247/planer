import { getDb } from '.'

export interface BookRow {
  id: number
  title: string
  author: string | null
  total_pages: number
  pages_read: number
  completed: number
  created_at: string
  updated_at: string
}

export interface BookInput {
  title: string
  author?: string
  total_pages: number
  pages_read?: number
}

export function getAllBooks(): BookRow[] {
  return getDb().all('SELECT * FROM books ORDER BY completed ASC, created_at DESC') as BookRow[]
}

export function createBook(input: BookInput): BookRow {
  const db = getDb()
  const result = db.run(
    'INSERT INTO books (title, author, total_pages, pages_read) VALUES (?,?,?,?)',
    [input.title, input.author ?? null, input.total_pages, input.pages_read ?? 0]
  )
  return db.get('SELECT * FROM books WHERE id=?', [Number(result.lastInsertRowid)]) as BookRow
}

export function updateBook(id: number, input: Partial<BookInput & { completed: boolean; pages_read: number }>): void {
  const db = getDb()
  if (input.title !== undefined) db.run("UPDATE books SET title=?, updated_at=datetime('now') WHERE id=?", [input.title, id])
  if (input.author !== undefined) db.run("UPDATE books SET author=?, updated_at=datetime('now') WHERE id=?", [input.author, id])
  if (input.total_pages !== undefined) db.run("UPDATE books SET total_pages=?, updated_at=datetime('now') WHERE id=?", [input.total_pages, id])
  if (input.pages_read !== undefined) db.run("UPDATE books SET pages_read=?, updated_at=datetime('now') WHERE id=?", [input.pages_read, id])
  if (input.completed !== undefined) {
    const completed = input.completed ? 1 : 0
    db.run("UPDATE books SET completed=?, updated_at=datetime('now') WHERE id=?", [completed, id])
    // If marking as complete, set pages_read = total_pages
    if (input.completed) {
      db.run("UPDATE books SET pages_read=total_pages WHERE id=? AND completed=1", [id])
    }
  }
}

export function deleteBook(id: number): void {
  getDb().run('DELETE FROM books WHERE id=?', [id])
}
