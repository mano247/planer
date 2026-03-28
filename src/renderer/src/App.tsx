import { useState, useEffect } from 'react'
import { useTranslation } from 'react-i18next'
import { useSettingsStore } from './stores/settingsStore'
import { useCategoryStore } from './stores/categoryStore'
import Header from './components/layout/Header'
import TabNav from './components/layout/TabNav'
import SettingsPanel from './components/layout/SettingsPanel'
import SplashScreen from './components/layout/SplashScreen'
import BottomBar from './components/layout/BottomBar'
import WeeklySchedule from './components/tabs/WeeklySchedule'
import CalendarTab from './components/tabs/Calendar'
import Statistics from './components/tabs/Statistics'
import TodoList from './components/tabs/TodoList'
import DailyNotes from './components/tabs/DailyNotes'

export type TabId = 'schedule' | 'calendar' | 'statistics' | 'todos' | 'notes'

export default function App(): JSX.Element {
  const { t } = useTranslation()
  const [activeTab, setActiveTab] = useState<TabId>('schedule')
  const [settingsOpen, setSettingsOpen] = useState(false)
  const [ready, setReady] = useState(false)
  const [calendarTargetDate, setCalendarTargetDate] = useState<string | null>(null)
  const { loadSettings, theme } = useSettingsStore()
  const { loadCategories } = useCategoryStore()

  useEffect(() => {
    const init = async () => {
      await loadSettings()
      await loadCategories()
      const lastTab = await window.api.settings.get('last_tab')
      if (lastTab && ['schedule', 'calendar', 'statistics', 'todos', 'notes'].includes(lastTab)) {
        setActiveTab(lastTab as TabId)
      }
      setTimeout(() => setReady(true), 800)
    }
    init()
  }, [])

  const handleTabChange = (tab: TabId) => {
    setActiveTab(tab)
    window.api.settings.set('last_tab', tab)
  }

  const handleBottomBarEventClick = (date: string) => {
    setCalendarTargetDate(date)
    handleTabChange('calendar')
  }

  const tabs = [
    { id: 'schedule' as TabId, label: t('tabs.schedule') },
    { id: 'calendar' as TabId, label: t('tabs.calendar') },
    { id: 'statistics' as TabId, label: t('tabs.statistics') },
    { id: 'todos' as TabId, label: t('tabs.todos') },
    { id: 'notes' as TabId, label: t('tabs.notes') }
  ]

  if (!ready) return <SplashScreen />

  return (
    <div className={`flex flex-col w-full h-full overflow-hidden ${theme === 'light' ? 'light' : ''}`}
      style={{ backgroundColor: 'var(--c-base)', color: 'var(--c-text)' }}
    >
      <Header onOpenSettings={() => setSettingsOpen(true)} />
      <TabNav tabs={tabs} activeTab={activeTab} onTabChange={handleTabChange} />

      <main className="flex-1 overflow-hidden relative">
        <div className={activeTab === 'schedule' ? 'block h-full' : 'hidden'}>
          <WeeklySchedule />
        </div>
        <div className={activeTab === 'calendar' ? 'block h-full' : 'hidden'}>
          <CalendarTab targetDate={calendarTargetDate} onTargetDateConsumed={() => setCalendarTargetDate(null)} />
        </div>
        <div className={activeTab === 'statistics' ? 'block h-full' : 'hidden'}>
          <Statistics />
        </div>
        <div className={activeTab === 'todos' ? 'block h-full' : 'hidden'}>
          <TodoList />
        </div>
        <div className={activeTab === 'notes' ? 'block h-full' : 'hidden'}>
          <DailyNotes />
        </div>
      </main>

      <BottomBar onEventClick={handleBottomBarEventClick} />

      {settingsOpen && <SettingsPanel onClose={() => setSettingsOpen(false)} />}
    </div>
  )
}
