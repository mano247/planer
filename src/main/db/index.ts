import { Database } from 'node-sqlite3-wasm'
import { app } from 'electron'
import { join } from 'path'
import { runMigrations } from './schema'

let db: Database | null = null

export function getDb(): Database {
  if (!db) throw new Error('Database not initialized')
  return db
}

export function initDatabase(): void {
  const dbPath = join(app.getPath('userData'), 'planner.db')
  db = new Database(dbPath)
  db.exec("PRAGMA journal_mode = WAL")
  db.exec("PRAGMA foreign_keys = ON")
  runMigrations(db)
}
