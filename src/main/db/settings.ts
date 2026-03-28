import { getDb } from '.'

export function getSetting(key: string): string | null {
  const row = getDb().get('SELECT value FROM settings WHERE key=?', [key]) as { value: string } | null
  return row?.value ?? null
}

export function setSetting(key: string, value: string): void {
  getDb().run('INSERT INTO settings (key,value) VALUES (?,?) ON CONFLICT(key) DO UPDATE SET value=excluded.value', [key, value])
}

export function getAllSettings(): Record<string, string> {
  const rows = getDb().all('SELECT key, value FROM settings') as { key: string; value: string }[]
  return Object.fromEntries(rows.map(r => [r.key, r.value]))
}
