import { getDb } from '.'

export interface TodoRow {
  id: number
  title: string
  description: string | null
  due_date: string | null
  priority: 'high' | 'medium' | 'low'
  task_type: 'daily' | 'longterm'
  completed: number
  created_at: string
  updated_at: string
}

export interface TodoInput {
  title: string
  description?: string
  due_date?: string
  priority?: 'high' | 'medium' | 'low'
  task_type?: 'daily' | 'longterm'
}

export function getAllTodos(): TodoRow[] {
  return getDb().all(
    'SELECT * FROM todos ORDER BY completed ASC, priority DESC, due_date ASC, created_at DESC'
  ) as TodoRow[]
}

export function createTodo(input: TodoInput): TodoRow {
  const db = getDb()
  const result = db.run(
    'INSERT INTO todos (title, description, due_date, priority, task_type) VALUES (?,?,?,?,?)',
    [input.title, input.description ?? null, input.due_date ?? null, input.priority ?? 'medium', input.task_type ?? 'daily']
  )
  return db.get('SELECT * FROM todos WHERE id=?', [Number(result.lastInsertRowid)]) as TodoRow
}

export function updateTodo(id: number, input: Partial<TodoInput & { completed: boolean }>): void {
  const db = getDb()
  if (input.title !== undefined) db.run("UPDATE todos SET title=?, updated_at=datetime('now') WHERE id=?", [input.title, id])
  if (input.description !== undefined) db.run("UPDATE todos SET description=?, updated_at=datetime('now') WHERE id=?", [input.description, id])
  if (input.due_date !== undefined) db.run("UPDATE todos SET due_date=?, updated_at=datetime('now') WHERE id=?", [input.due_date, id])
  if (input.priority !== undefined) db.run("UPDATE todos SET priority=?, updated_at=datetime('now') WHERE id=?", [input.priority, id])
  if (input.task_type !== undefined) db.run("UPDATE todos SET task_type=?, updated_at=datetime('now') WHERE id=?", [input.task_type, id])
  if (input.completed !== undefined) db.run("UPDATE todos SET completed=?, updated_at=datetime('now') WHERE id=?", [input.completed ? 1 : 0, id])
}

export function deleteTodo(id: number): void {
  getDb().run('DELETE FROM todos WHERE id=?', [id])
}
