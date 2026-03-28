import { ElectronAPI } from '@electron-toolkit/preload'

declare global {
  interface Window {
    electron: ElectronAPI
    api: {
      activities: {
        getWeek: (weekStart: string, weekEnd: string) => Promise<unknown[]>
        getRange: (startDate: string, endDate: string) => Promise<unknown[]>
        upsert: (input: object) => Promise<unknown>
        delete: (id: number) => Promise<void>
        updateCategory: (id: number, categoryId: number | null) => Promise<void>
      }
      categories: {
        getAll: () => Promise<unknown[]>
        create: (input: object) => Promise<unknown>
        update: (id: number, input: object) => Promise<void>
        delete: (id: number) => Promise<void>
      }
      events: {
        getMonth: (year: number, month: number) => Promise<unknown[]>
        getRange: (startDate: string, endDate: string) => Promise<unknown[]>
        create: (input: object) => Promise<unknown>
        update: (id: number, input: object) => Promise<void>
        delete: (id: number) => Promise<void>
      }
      todos: {
        getAll: () => Promise<unknown[]>
        create: (input: object) => Promise<unknown>
        update: (id: number, input: object) => Promise<void>
        delete: (id: number) => Promise<void>
      }
      books: {
        getAll: () => Promise<unknown[]>
        create: (input: object) => Promise<unknown>
        update: (id: number, input: object) => Promise<void>
        delete: (id: number) => Promise<void>
      }
      notes: {
        getByDate: (date: string) => Promise<unknown>
        getDatesWithNotes: () => Promise<string[]>
        upsert: (date: string, content: string) => Promise<unknown>
      }
      settings: {
        get: (key: string) => Promise<string | null>
        set: (key: string, value: string) => Promise<void>
        getAll: () => Promise<Record<string, string>>
      }
      data: {
        export: () => Promise<{ success: boolean; path?: string }>
        import: () => Promise<{ success: boolean }>
      }
    }
  }
}
