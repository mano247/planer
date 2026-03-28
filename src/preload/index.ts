import { contextBridge, ipcRenderer } from 'electron'
import { electronAPI } from '@electron-toolkit/preload'

const api = {
  activities: {
    getWeek: (weekStart: string, weekEnd: string) =>
      ipcRenderer.invoke('activities:getWeek', weekStart, weekEnd),
    getRange: (startDate: string, endDate: string) =>
      ipcRenderer.invoke('activities:getRange', startDate, endDate),
    upsert: (input: object) => ipcRenderer.invoke('activities:upsert', input),
    delete: (id: number) => ipcRenderer.invoke('activities:delete', id),
    updateCategory: (id: number, categoryId: number | null) =>
      ipcRenderer.invoke('activities:updateCategory', id, categoryId)
  },
  categories: {
    getAll: () => ipcRenderer.invoke('categories:getAll'),
    create: (input: object) => ipcRenderer.invoke('categories:create', input),
    update: (id: number, input: object) => ipcRenderer.invoke('categories:update', id, input),
    delete: (id: number) => ipcRenderer.invoke('categories:delete', id)
  },
  events: {
    getMonth: (year: number, month: number) => ipcRenderer.invoke('events:getMonth', year, month),
    getRange: (startDate: string, endDate: string) => ipcRenderer.invoke('events:getRange', startDate, endDate),
    create: (input: object) => ipcRenderer.invoke('events:create', input),
    update: (id: number, input: object) => ipcRenderer.invoke('events:update', id, input),
    delete: (id: number) => ipcRenderer.invoke('events:delete', id)
  },
  todos: {
    getAll: () => ipcRenderer.invoke('todos:getAll'),
    create: (input: object) => ipcRenderer.invoke('todos:create', input),
    update: (id: number, input: object) => ipcRenderer.invoke('todos:update', id, input),
    delete: (id: number) => ipcRenderer.invoke('todos:delete', id)
  },
  books: {
    getAll: () => ipcRenderer.invoke('books:getAll'),
    create: (input: object) => ipcRenderer.invoke('books:create', input),
    update: (id: number, input: object) => ipcRenderer.invoke('books:update', id, input),
    delete: (id: number) => ipcRenderer.invoke('books:delete', id)
  },
  notes: {
    getByDate: (date: string) => ipcRenderer.invoke('notes:getByDate', date),
    getDatesWithNotes: () => ipcRenderer.invoke('notes:getDatesWithNotes'),
    upsert: (date: string, content: string) => ipcRenderer.invoke('notes:upsert', date, content)
  },
  settings: {
    get: (key: string) => ipcRenderer.invoke('settings:get', key),
    set: (key: string, value: string) => ipcRenderer.invoke('settings:set', key, value),
    getAll: () => ipcRenderer.invoke('settings:getAll')
  },
  data: {
    export: () => ipcRenderer.invoke('data:export'),
    import: () => ipcRenderer.invoke('data:import')
  }
}

if (process.contextIsolated) {
  try {
    contextBridge.exposeInMainWorld('electron', electronAPI)
    contextBridge.exposeInMainWorld('api', api)
  } catch (error) {
    console.error(error)
  }
} else {
  // @ts-ignore
  window.electron = electronAPI
  // @ts-ignore
  window.api = api
}
