import { getDb } from '.'

export interface CategoryRow {
  id: number
  name_en: string
  name_sr: string
  icon: string
  color: string
  is_default: number
  created_at: string
  keywords: string[]
}

export interface CategoryInput {
  name_en: string
  name_sr: string
  icon: string
  color: string
  keywords: string[]
}

export function getAllCategories(): CategoryRow[] {
  const db = getDb()
  const cats = db.all('SELECT * FROM categories ORDER BY is_default DESC, id ASC') as Omit<CategoryRow, 'keywords'>[]
  return cats.map(cat => ({
    ...cat,
    keywords: (db.all('SELECT keyword FROM keywords WHERE category_id = ?', [cat.id]) as { keyword: string }[]).map(r => r.keyword)
  }))
}

export function createCategory(input: CategoryInput): CategoryRow {
  const db = getDb()
  const result = db.run(
    'INSERT INTO categories (name_en, name_sr, icon, color, is_default) VALUES (?,?,?,?,0)',
    [input.name_en, input.name_sr, input.icon, input.color]
  )
  const catId = Number(result.lastInsertRowid)
  for (const kw of input.keywords) {
    if (kw.trim()) db.run('INSERT INTO keywords (category_id, keyword) VALUES (?,?)', [catId, kw.toLowerCase().trim()])
  }
  return getAllCategories().find(c => c.id === catId)!
}

export function updateCategory(id: number, input: Partial<CategoryInput>): void {
  const db = getDb()
  if (input.name_en !== undefined) db.run('UPDATE categories SET name_en=? WHERE id=?', [input.name_en, id])
  if (input.name_sr !== undefined) db.run('UPDATE categories SET name_sr=? WHERE id=?', [input.name_sr, id])
  if (input.icon !== undefined) db.run('UPDATE categories SET icon=? WHERE id=?', [input.icon, id])
  if (input.color !== undefined) db.run('UPDATE categories SET color=? WHERE id=?', [input.color, id])
  if (input.keywords !== undefined) {
    db.run('DELETE FROM keywords WHERE category_id=?', [id])
    for (const kw of input.keywords) {
      if (kw.trim()) db.run('INSERT INTO keywords (category_id, keyword) VALUES (?,?)', [id, kw.toLowerCase().trim()])
    }
  }
}

export function deleteCategory(id: number): void {
  const db = getDb()
  db.run('UPDATE activities SET category_id=NULL WHERE category_id=?', [id])
  db.run('DELETE FROM categories WHERE id=?', [id])
}
