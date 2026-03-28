import { create } from 'zustand'

export interface Activity {
  id: number
  date: string
  start_time: string
  end_time: string
  name: string
  category_id: number | null
  is_event: number
  event_id: number | null
  category_icon?: string
  category_color?: string
  category_name_en?: string
  category_name_sr?: string
}

export interface ActivityInput {
  id?: number
  date: string
  start_time: string
  end_time: string
  name: string
  category_id?: number | null
  is_event?: number
  event_id?: number | null
}

interface ActivityStore {
  activities: Activity[]
  currentWeekStart: string
  loadWeek: (weekStart: string, weekEnd: string) => Promise<void>
  upsertActivity: (input: ActivityInput) => Promise<Activity>
  deleteActivity: (id: number) => Promise<void>
  updateActivityCategory: (id: number, categoryId: number | null) => Promise<void>
}

export const useActivityStore = create<ActivityStore>((set, get) => ({
  activities: [],
  currentWeekStart: '',
  loadWeek: async (weekStart, weekEnd) => {
    const activities = await window.api.activities.getWeek(weekStart, weekEnd)
    set({ activities: activities as Activity[], currentWeekStart: weekStart })
  },
  upsertActivity: async (input) => {
    const result = await window.api.activities.upsert(input) as Activity
    const { activities } = get()
    if (input.id) {
      set({ activities: activities.map(a => a.id === input.id ? result : a) })
    } else {
      set({ activities: [...activities, result] })
    }
    return result
  },
  deleteActivity: async (id) => {
    await window.api.activities.delete(id)
    set(state => ({ activities: state.activities.filter(a => a.id !== id) }))
  },
  updateActivityCategory: async (id, categoryId) => {
    await window.api.activities.updateCategory(id, categoryId)
    set(state => ({
      activities: state.activities.map(a => a.id === id ? { ...a, category_id: categoryId } : a)
    }))
  }
}))
