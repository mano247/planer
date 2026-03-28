import { create } from 'zustand'

export interface Category {
  id: number
  name_en: string
  name_sr: string
  icon: string
  color: string
  is_default: number
  keywords: string[]
}

interface CategoryStore {
  categories: Category[]
  loadCategories: () => Promise<void>
  createCategory: (input: Omit<Category, 'id' | 'is_default'>) => Promise<void>
  updateCategory: (id: number, input: Partial<Omit<Category, 'id' | 'is_default'>>) => Promise<void>
  deleteCategory: (id: number) => Promise<void>
}

export const useCategoryStore = create<CategoryStore>((set) => ({
  categories: [],
  loadCategories: async () => {
    const cats = await window.api.categories.getAll()
    set({ categories: cats as Category[] })
  },
  createCategory: async (input) => {
    await window.api.categories.create(input)
    const cats = await window.api.categories.getAll()
    set({ categories: cats as Category[] })
  },
  updateCategory: async (id, input) => {
    await window.api.categories.update(id, input)
    const cats = await window.api.categories.getAll()
    set({ categories: cats as Category[] })
  },
  deleteCategory: async (id) => {
    await window.api.categories.delete(id)
    const cats = await window.api.categories.getAll()
    set({ categories: cats as Category[] })
  }
}))
