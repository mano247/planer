import { create } from 'zustand'

export interface Book {
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

interface BookStore {
  books: Book[]
  loadBooks: () => Promise<void>
  createBook: (input: BookInput) => Promise<void>
  updateBook: (id: number, input: Partial<BookInput & { completed: boolean; pages_read: number }>) => Promise<void>
  deleteBook: (id: number) => Promise<void>
}

export const useBookStore = create<BookStore>((set) => ({
  books: [],
  loadBooks: async () => {
    const books = await window.api.books.getAll()
    set({ books: books as Book[] })
  },
  createBook: async (input) => {
    await window.api.books.create(input)
    const books = await window.api.books.getAll()
    set({ books: books as Book[] })
  },
  updateBook: async (id, input) => {
    await window.api.books.update(id, input)
    const books = await window.api.books.getAll()
    set({ books: books as Book[] })
  },
  deleteBook: async (id) => {
    await window.api.books.delete(id)
    set(state => ({ books: state.books.filter(b => b.id !== id) }))
  }
}))
