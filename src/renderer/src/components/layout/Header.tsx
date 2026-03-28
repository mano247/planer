import { useState, useEffect } from 'react'
import { useTranslation } from 'react-i18next'
import { useSettingsStore } from '../../stores/settingsStore'

interface HeaderProps {
  onOpenSettings: () => void
}

export default function Header({ onOpenSettings }: HeaderProps): JSX.Element {
  const { t } = useTranslation()
  const { language, setLanguage, theme, setTheme } = useSettingsStore()
  const [time, setTime] = useState(new Date())

  useEffect(() => {
    const timer = setInterval(() => setTime(new Date()), 1000)
    return () => clearInterval(timer)
  }, [])

  const formatTime = (date: Date): string => {
    return date.toLocaleTimeString('en-GB', { hour: '2-digit', minute: '2-digit', second: '2-digit' })
  }

  const formatDate = (date: Date): string => {
    return date.toLocaleDateString(language === 'sr' ? 'sr-RS' : 'en-GB', {
      weekday: 'long', year: 'numeric', month: 'long', day: 'numeric'
    })
  }

  return (
    <header className="flex items-center justify-between px-5 py-3 border-b shrink-0"
      style={{ backgroundColor: 'var(--c-surface)', borderColor: 'var(--c-border)' }}
    >
      {/* Logo */}
      <div className="flex items-center gap-2">
        <span className="text-lg">📋</span>
        <span className="font-semibold tracking-wide" style={{ color: 'var(--c-text)' }}>Planner</span>
      </div>

      {/* Clock */}
      <div className="flex flex-col items-center">
        <span className="font-mono text-xl font-semibold text-indigo-400 tabular-nums">
          {formatTime(time)}
        </span>
        <span className="text-xs capitalize" style={{ color: 'var(--c-text-dim)' }}>
          {formatDate(time)}
        </span>
      </div>

      {/* Right controls */}
      <div className="flex items-center gap-3">
        {/* Language toggle */}
        <div className="flex items-center rounded-md overflow-hidden border"
          style={{ backgroundColor: 'var(--c-element)', borderColor: 'var(--c-border)' }}
        >
          <button
            onClick={() => setLanguage('en')}
            className={`px-3 py-1 text-xs font-medium transition-colors ${
              language === 'en' ? 'bg-indigo-600 text-white' : 'hover:text-slate-200'
            }`}
            style={language !== 'en' ? { color: 'var(--c-text-muted)' } : undefined}
          >
            EN
          </button>
          <button
            onClick={() => setLanguage('sr')}
            className={`px-3 py-1 text-xs font-medium transition-colors ${
              language === 'sr' ? 'bg-indigo-600 text-white' : 'hover:text-slate-200'
            }`}
            style={language !== 'sr' ? { color: 'var(--c-text-muted)' } : undefined}
          >
            SR
          </button>
        </div>

        {/* Dark/Light theme toggle */}
        <button
          onClick={() => setTheme(theme === 'dark' ? 'light' : 'dark')}
          className="p-2 rounded-md transition-colors hover:bg-[#242736]"
          style={{ color: 'var(--c-text-muted)' }}
          title={theme === 'dark' ? 'Switch to light mode' : 'Switch to dark mode'}
        >
          {theme === 'dark' ? (
            /* Sun icon */
            <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5}
                d="M12 3v1m0 16v1m9-9h-1M4 12H3m15.364-6.364l-.707.707M6.343 17.657l-.707.707M17.657 17.657l-.707-.707M6.343 6.343l-.707-.707M12 7a5 5 0 100 10A5 5 0 0012 7z" />
            </svg>
          ) : (
            /* Moon icon */
            <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5}
                d="M20.354 15.354A9 9 0 018.646 3.646 9.003 9.003 0 0012 21a9.003 9.003 0 008.354-5.646z" />
            </svg>
          )}
        </button>

        {/* Settings gear */}
        <button
          onClick={onOpenSettings}
          className="p-2 rounded-md transition-colors hover:bg-[#242736]"
          style={{ color: 'var(--c-text-muted)' }}
          title={t('settings.title')}
        >
          <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5}
              d="M10.325 4.317c.426-1.756 2.924-1.756 3.35 0a1.724 1.724 0 002.573 1.066c1.543-.94 3.31.826 2.37 2.37a1.724 1.724 0 001.065 2.572c1.756.426 1.756 2.924 0 3.35a1.724 1.724 0 00-1.066 2.573c.94 1.543-.826 3.31-2.37 2.37a1.724 1.724 0 00-2.572 1.065c-.426 1.756-2.924 1.756-3.35 0a1.724 1.724 0 00-2.573-1.066c-1.543.94-3.31-.826-2.37-2.37a1.724 1.724 0 00-1.065-2.572c-1.756-.426-1.756-2.924 0-3.35a1.724 1.724 0 001.066-2.573c-.94-1.543.826-3.31 2.37-2.37.996.608 2.296.07 2.572-1.065z" />
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
          </svg>
        </button>
      </div>
    </header>
  )
}
