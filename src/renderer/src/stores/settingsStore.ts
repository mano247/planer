import { create } from 'zustand'
import i18n from '../i18n'

type Theme = 'dark' | 'light'

interface SettingsStore {
  language: 'en' | 'sr'
  theme: Theme
  setLanguage: (lang: 'en' | 'sr') => void
  setTheme: (theme: Theme) => void
  loadSettings: () => Promise<void>
}

export const useSettingsStore = create<SettingsStore>((set) => ({
  language: 'en',
  theme: 'dark',
  setLanguage: async (lang) => {
    set({ language: lang })
    i18n.changeLanguage(lang)
    await window.api.settings.set('language', lang)
  },
  setTheme: async (theme) => {
    set({ theme })
    await window.api.settings.set('theme', theme)
  },
  loadSettings: async () => {
    const settings = await window.api.settings.getAll()
    const lang = (settings['language'] as 'en' | 'sr') ?? 'en'
    const theme = (settings['theme'] as Theme) ?? 'dark'
    set({ language: lang, theme })
    i18n.changeLanguage(lang)
  }
}))
