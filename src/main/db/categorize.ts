import { CategoryRow } from './categories'

export function categorizeActivity(name: string, categories: CategoryRow[]): number | null {
  const lower = name.toLowerCase()
  for (const cat of categories) {
    for (const kw of cat.keywords) {
      if (lower.includes(kw)) return cat.id
    }
  }
  return null
}
