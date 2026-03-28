import { ipcMain, dialog, app } from 'electron'
import { writeFileSync, readFileSync } from 'fs'
import {
  getActivitiesByWeek, getActivitiesByDateRange, upsertActivity, deleteActivity, updateActivityCategory
} from '../db/activities'
import { getAllCategories, createCategory, updateCategory, deleteCategory } from '../db/categories'
import { getEventsByMonth, getEventsByDateRange, createEvent, updateEvent, deleteEvent } from '../db/events'
import { getAllTodos, createTodo, updateTodo, deleteTodo } from '../db/todos'
import { getAllBooks, createBook, updateBook, deleteBook } from '../db/books'
import { getNoteByDate, getDatesWithNotes, upsertNote } from '../db/notes'
import { getSetting, setSetting, getAllSettings } from '../db/settings'
import { categorizeActivity } from '../db/categorize'
import { getDb } from '../db'
import { BrowserWindow } from 'electron'

export function registerAllHandlers(): void {
  // ── Activities ──────────────────────────────────────────────────────
  ipcMain.handle('activities:getWeek', (_e, weekStart: string, weekEnd: string) =>
    getActivitiesByWeek(weekStart, weekEnd)
  )
  ipcMain.handle('activities:getRange', (_e, startDate: string, endDate: string) =>
    getActivitiesByDateRange(startDate, endDate)
  )
  ipcMain.handle('activities:upsert', (_e, input) => {
    if (input.category_id === undefined || input.category_id === null) {
      const categories = getAllCategories()
      input.category_id = categorizeActivity(input.name, categories)
    }
    return upsertActivity(input)
  })
  ipcMain.handle('activities:delete', (_e, id: number) => deleteActivity(id))
  ipcMain.handle('activities:updateCategory', (_e, id: number, categoryId: number | null) =>
    updateActivityCategory(id, categoryId)
  )

  // ── Categories ──────────────────────────────────────────────────────
  ipcMain.handle('categories:getAll', () => getAllCategories())
  ipcMain.handle('categories:create', (_e, input) => createCategory(input))
  ipcMain.handle('categories:update', (_e, id: number, input) => updateCategory(id, input))
  ipcMain.handle('categories:delete', (_e, id: number) => deleteCategory(id))

  // ── Calendar Events ─────────────────────────────────────────────────
  ipcMain.handle('events:getMonth', (_e, year: number, month: number) =>
    getEventsByMonth(year, month)
  )
  ipcMain.handle('events:getRange', (_e, startDate: string, endDate: string) =>
    getEventsByDateRange(startDate, endDate)
  )
  ipcMain.handle('events:create', (_e, input) => createEvent(input))
  ipcMain.handle('events:update', (_e, id: number, input) => updateEvent(id, input))
  ipcMain.handle('events:delete', (_e, id: number) => deleteEvent(id))

  // ── Todos ───────────────────────────────────────────────────────────
  ipcMain.handle('todos:getAll', () => getAllTodos())
  ipcMain.handle('todos:create', (_e, input) => createTodo(input))
  ipcMain.handle('todos:update', (_e, id: number, input) => updateTodo(id, input))
  ipcMain.handle('todos:delete', (_e, id: number) => deleteTodo(id))

  // ── Books ────────────────────────────────────────────────────────────
  ipcMain.handle('books:getAll', () => getAllBooks())
  ipcMain.handle('books:create', (_e, input) => createBook(input))
  ipcMain.handle('books:update', (_e, id: number, input) => updateBook(id, input))
  ipcMain.handle('books:delete', (_e, id: number) => deleteBook(id))

  // ── Notes ───────────────────────────────────────────────────────────
  ipcMain.handle('notes:getByDate', (_e, date: string) => getNoteByDate(date))
  ipcMain.handle('notes:getDatesWithNotes', () => getDatesWithNotes())
  ipcMain.handle('notes:upsert', (_e, date: string, content: string) => upsertNote(date, content))

  // ── Settings ────────────────────────────────────────────────────────
  ipcMain.handle('settings:get', (_e, key: string) => getSetting(key))
  ipcMain.handle('settings:set', (_e, key: string, value: string) => setSetting(key, value))
  ipcMain.handle('settings:getAll', () => getAllSettings())

  // ── Export / Import ─────────────────────────────────────────────────
  ipcMain.handle('data:export', async (event) => {
    const win = BrowserWindow.fromWebContents(event.sender)
    const result = await dialog.showSaveDialog(win!, {
      title: 'Export Planner Data',
      defaultPath: `planner-backup-${new Date().toISOString().slice(0, 10)}.json`,
      filters: [{ name: 'JSON', extensions: ['json'] }]
    })
    if (result.canceled || !result.filePath) return { success: false }

    const db = getDb()
    const data = {
      exportedAt: new Date().toISOString(),
      version: app.getVersion(),
      categories: db.all('SELECT * FROM categories'),
      keywords: db.all('SELECT * FROM keywords'),
      activities: db.all('SELECT * FROM activities'),
      calendar_events: db.all('SELECT * FROM calendar_events'),
      todos: db.all('SELECT * FROM todos'),
      books: db.all('SELECT * FROM books'),
      daily_notes: db.all('SELECT * FROM daily_notes'),
      settings: db.all('SELECT * FROM settings')
    }
    writeFileSync(result.filePath, JSON.stringify(data, null, 2), 'utf-8')
    return { success: true, path: result.filePath }
  })

  ipcMain.handle('data:import', async (event) => {
    const win = BrowserWindow.fromWebContents(event.sender)
    const result = await dialog.showOpenDialog(win!, {
      title: 'Import Planner Data',
      filters: [{ name: 'JSON', extensions: ['json'] }],
      properties: ['openFile']
    })
    if (result.canceled || !result.filePaths[0]) return { success: false }

    const raw = readFileSync(result.filePaths[0], 'utf-8')
    const data = JSON.parse(raw)
    const db = getDb()

    db.exec('DELETE FROM activities')
    db.exec('DELETE FROM calendar_events')
    db.exec('DELETE FROM todos')
    db.exec('DELETE FROM books')
    db.exec('DELETE FROM daily_notes')
    db.exec('DELETE FROM keywords')
    db.exec('DELETE FROM categories')
    db.exec('DELETE FROM settings')

    for (const row of (data.categories ?? []) as Record<string, unknown>[]) {
      db.run('INSERT INTO categories (id,name_en,name_sr,icon,color,is_default,created_at) VALUES (?,?,?,?,?,?,?)',
        [row.id, row.name_en, row.name_sr, row.icon, row.color, row.is_default, row.created_at])
    }
    for (const row of (data.keywords ?? []) as Record<string, unknown>[]) {
      db.run('INSERT INTO keywords (id,category_id,keyword) VALUES (?,?,?)', [row.id, row.category_id, row.keyword])
    }
    for (const row of (data.calendar_events ?? []) as Record<string, unknown>[]) {
      db.run('INSERT INTO calendar_events (id,date,title,note,created_at) VALUES (?,?,?,?,?)',
        [row.id, row.date, row.title, row.note, row.created_at])
    }
    for (const row of (data.activities ?? []) as Record<string, unknown>[]) {
      db.run('INSERT INTO activities (id,date,start_time,end_time,name,category_id,is_event,event_id,created_at,updated_at) VALUES (?,?,?,?,?,?,?,?,?,?)',
        [row.id, row.date, row.start_time, row.end_time, row.name, row.category_id, row.is_event, row.event_id, row.created_at, row.updated_at])
    }
    for (const row of (data.todos ?? []) as Record<string, unknown>[]) {
      db.run('INSERT INTO todos (id,title,description,due_date,priority,task_type,completed,created_at,updated_at) VALUES (?,?,?,?,?,?,?,?,?)',
        [row.id, row.title, row.description, row.due_date, row.priority, row.task_type ?? 'daily', row.completed, row.created_at, row.updated_at])
    }
    for (const row of (data.books ?? []) as Record<string, unknown>[]) {
      db.run('INSERT INTO books (id,title,author,total_pages,pages_read,completed,created_at,updated_at) VALUES (?,?,?,?,?,?,?,?)',
        [row.id, row.title, row.author, row.total_pages, row.pages_read, row.completed, row.created_at, row.updated_at])
    }
    for (const row of (data.daily_notes ?? []) as Record<string, unknown>[]) {
      db.run('INSERT INTO daily_notes (id,date,content,created_at,updated_at) VALUES (?,?,?,?,?)',
        [row.id, row.date, row.content, row.created_at, row.updated_at])
    }
    for (const row of (data.settings ?? []) as Record<string, unknown>[]) {
      db.run('INSERT INTO settings (key,value) VALUES (?,?)', [row.key, row.value])
    }

    return { success: true }
  })
}
