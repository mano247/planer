import { useState } from 'react'
import { useTranslation } from 'react-i18next'

interface EventModalProps {
  date: string
  initialTitle: string
  initialNote: string
  isEditing: boolean
  onSave: (title: string, note: string) => void
  onDelete?: () => void
  onClose: () => void
}

export default function EventModal({ date, initialTitle, initialNote, isEditing, onSave, onDelete, onClose }: EventModalProps): JSX.Element {
  const { t } = useTranslation()
  const [title, setTitle] = useState(initialTitle)
  const [note, setNote] = useState(initialNote)

  const formatDate = (iso: string): string => {
    return new Date(iso + 'T12:00:00').toLocaleDateString(undefined, { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' })
  }

  const inputCls = 'w-full rounded-lg px-3 py-2 text-sm focus:outline-none focus:border-indigo-500 border'
  const inputStyle = { backgroundColor: 'var(--c-element)', borderColor: 'var(--c-border)', color: 'var(--c-text)' }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60" onClick={onClose}>
      <div
        className="rounded-xl p-6 w-[420px] shadow-2xl border"
        style={{ backgroundColor: 'var(--c-surface)', borderColor: 'var(--c-border)' }}
        onClick={e => e.stopPropagation()}
      >
        <h3 className="font-semibold mb-1" style={{ color: 'var(--c-text)' }}>
          {isEditing ? t('calendar.editEvent') : t('calendar.addEvent')}
        </h3>
        <p className="text-sm mb-4" style={{ color: 'var(--c-text-dim)' }}>{formatDate(date)}</p>

        <div className="space-y-3">
          <input
            autoFocus type="text"
            className={inputCls} style={inputStyle}
            placeholder={t('calendar.eventTitle')}
            value={title} onChange={e => setTitle(e.target.value)}
            onKeyDown={e => e.key === 'Enter' && onSave(title, note)}
          />
          <textarea
            className={`${inputCls} resize-none`} style={inputStyle}
            placeholder={t('calendar.eventNote')} rows={3}
            value={note} onChange={e => setNote(e.target.value)}
          />
        </div>

        <div className="flex gap-2 mt-4">
          <button
            onClick={() => onSave(title, note)} disabled={!title.trim()}
            className="flex-1 py-2 bg-indigo-600 hover:bg-indigo-700 disabled:opacity-40 disabled:cursor-not-allowed rounded-lg text-sm font-medium text-white transition-colors"
          >
            {t('calendar.save')}
          </button>
          {onDelete && (
            <button onClick={onDelete}
              className="px-4 py-2 bg-red-900/30 hover:bg-red-900/50 border border-red-900/50 rounded-lg text-sm text-red-400 transition-colors">
              {t('common.delete')}
            </button>
          )}
          <button onClick={onClose}
            className="px-4 py-2 rounded-lg text-sm border transition-colors"
            style={{ backgroundColor: 'var(--c-element)', borderColor: 'var(--c-border)', color: 'var(--c-text-muted)' }}>
            {t('calendar.cancel')}
          </button>
        </div>
      </div>
    </div>
  )
}
