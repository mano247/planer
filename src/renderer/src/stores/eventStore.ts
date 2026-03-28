import { create } from 'zustand'

export interface CalendarEvent {
  id: number
  date: string
  title: string
  note: string | null
  created_at: string
}

interface EventStore {
  events: CalendarEvent[]
  upcomingEvents: CalendarEvent[]
  currentYear: number
  currentMonth: number
  loadMonth: (year: number, month: number) => Promise<void>
  loadUpcoming: () => Promise<void>
  createEvent: (input: { date: string; title: string; note?: string }) => Promise<void>
  updateEvent: (id: number, input: { title?: string; note?: string }) => Promise<void>
  deleteEvent: (id: number) => Promise<void>
}

export const useEventStore = create<EventStore>((set, get) => ({
  events: [],
  upcomingEvents: [],
  currentYear: new Date().getFullYear(),
  currentMonth: new Date().getMonth() + 1,
  loadMonth: async (year, month) => {
    const events = await window.api.events.getMonth(year, month)
    set({ events: events as CalendarEvent[], currentYear: year, currentMonth: month })
  },
  loadUpcoming: async () => {
    const today = new Date()
    const start = today.toISOString().slice(0, 10)
    const end60 = new Date(today)
    end60.setDate(today.getDate() + 60)
    const end = end60.toISOString().slice(0, 10)
    const events = await window.api.events.getRange(start, end)
    set({ upcomingEvents: events as CalendarEvent[] })
  },
  createEvent: async (input) => {
    await window.api.events.create(input)
    const { currentYear, currentMonth } = get()
    const events = await window.api.events.getMonth(currentYear, currentMonth)
    set({ events: events as CalendarEvent[] })
    get().loadUpcoming()
  },
  updateEvent: async (id, input) => {
    await window.api.events.update(id, input)
    const { currentYear, currentMonth } = get()
    const events = await window.api.events.getMonth(currentYear, currentMonth)
    set({ events: events as CalendarEvent[] })
    get().loadUpcoming()
  },
  deleteEvent: async (id) => {
    await window.api.events.delete(id)
    set(state => ({ events: state.events.filter(e => e.id !== id) }))
    get().loadUpcoming()
  }
}))
