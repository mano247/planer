import { useState, useEffect, useRef, useCallback } from 'react'
import { useTranslation } from 'react-i18next'

function toISO(date: Date): string {
  return `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, '0')}-${String(date.getDate()).padStart(2, '0')}`
}

function formatDisplayDate(iso: string, locale: string): string {
  return new Date(iso + 'T12:00:00').toLocaleDateString(locale, {
    weekday: 'long', year: 'numeric', month: 'long', day: 'numeric'
  })
}

export default function DailyNotes(): JSX.Element {
  const { t, i18n } = useTranslation()
  const [currentDate, setCurrentDate] = useState(toISO(new Date()))
  const [content, setContent] = useState('')
  const [savedMsg, setSavedMsg] = useState(false)
  const [datesWithNotes, setDatesWithNotes] = useState<string[]>([])
  const saveTimer = useRef<ReturnType<typeof setTimeout> | null>(null)

  const locale = i18n.language === 'sr' ? 'sr-RS' : 'en-GB'
  const today = toISO(new Date())

  // Load note for current date
  useEffect(() => {
    window.api.notes.getByDate(currentDate).then((note: unknown) => {
      setContent((note as { content?: string } | null)?.content ?? '')
    })
  }, [currentDate])

  // Load dates that have notes (for navigation hints)
  useEffect(() => {
    window.api.notes.getDatesWithNotes().then(dates => setDatesWithNotes(dates))
  }, [savedMsg])

  // Auto-save with debounce
  const autoSave = useCallback((text: string) => {
    if (saveTimer.current) clearTimeout(saveTimer.current)
    saveTimer.current = setTimeout(async () => {
      await window.api.notes.upsert(currentDate, text)
      setSavedMsg(true)
      setTimeout(() => setSavedMsg(false), 2000)
    }, 800)
  }, [currentDate])

  const handleChange = (value: string) => {
    setContent(value)
    autoSave(value)
  }

  const prevDay = () => {
    const d = new Date(currentDate + 'T12:00:00')
    d.setDate(d.getDate() - 1)
    setCurrentDate(toISO(d))
  }

  const nextDay = () => {
    const d = new Date(currentDate + 'T12:00:00')
    d.setDate(d.getDate() + 1)
    setCurrentDate(toISO(d))
  }

  const hasPrevNote = datesWithNotes.some(d => d < currentDate)

  return (
    <div className="flex flex-col h-full p-6">
      {/* Date navigation */}
      <div className="flex items-center justify-between mb-4">
        <button
          onClick={prevDay}
          className="p-2 rounded transition-colors hover:brightness-110"
          style={{ color: 'var(--c-text-muted)' }}
        >
          <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
          </svg>
        </button>

        <div className="flex flex-col items-center gap-1">
          <span className="text-lg font-semibold capitalize" style={{ color: 'var(--c-text)' }}>
            {formatDisplayDate(currentDate, locale)}
          </span>
          {currentDate !== today && (
            <button
              onClick={() => setCurrentDate(today)}
              className="text-xs text-indigo-400 hover:text-indigo-300"
            >
              {t('schedule.today')}
            </button>
          )}
        </div>

        <button
          onClick={nextDay}
          disabled={currentDate >= today}
          className="p-2 rounded transition-colors hover:brightness-110 disabled:opacity-30 disabled:cursor-not-allowed"
          style={{ color: 'var(--c-text-muted)' }}
        >
          <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
          </svg>
        </button>
      </div>

      {/* Note editor */}
      <div className="flex-1 relative">
        <textarea
          className="w-full h-full rounded-xl px-5 py-4 text-sm focus:outline-none focus:border-indigo-500/50 resize-none leading-relaxed border"
          style={{ backgroundColor: 'var(--c-surface)', borderColor: 'var(--c-border)', color: 'var(--c-text)' }}
          placeholder={t('notes.placeholder')}
          value={content}
          onChange={e => handleChange(e.target.value)}
        />
        {savedMsg && (
          <div className="absolute bottom-4 right-4 text-xs text-green-400 bg-green-900/20 border border-green-900/40 rounded px-2 py-1">
            ✓ {t('notes.saved')}
          </div>
        )}
      </div>

      {/* Notes history hint */}
      {datesWithNotes.length > 0 && (
        <div className="mt-3 flex items-center gap-2 text-xs" style={{ color: 'var(--c-text-dim)' }}>
          <span>Notes exist for:</span>
          <div className="flex gap-1 flex-wrap">
            {datesWithNotes.slice(0, 5).map(d => (
              <button
                key={d}
                onClick={() => setCurrentDate(d)}
                className={`px-2 py-0.5 rounded text-xs transition-colors ${
                  d === currentDate ? 'bg-indigo-600/30 text-indigo-400' : ''
                }`}
                style={d !== currentDate ? { backgroundColor: 'var(--c-element)', color: 'var(--c-text-dim)' } : undefined}
              >
                {new Date(d + 'T12:00:00').toLocaleDateString(locale, { month: 'short', day: 'numeric' })}
              </button>
            ))}
          </div>
        </div>
      )}
    </div>
  )
}
