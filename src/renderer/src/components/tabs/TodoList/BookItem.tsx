import { useState } from 'react'
import { useTranslation } from 'react-i18next'
import { Book } from '../../../stores/bookStore'

interface BookItemProps {
  book: Book
  onUpdate: (input: Partial<{ title: string; author: string; total_pages: number; pages_read: number; completed: boolean }>) => void
  onDelete: () => void
}

export default function BookItem({ book, onUpdate, onDelete }: BookItemProps): JSX.Element {
  const { t } = useTranslation()
  const [editing, setEditing] = useState(false)
  const [editTitle, setEditTitle] = useState(book.title)
  const [editAuthor, setEditAuthor] = useState(book.author ?? '')
  const [editTotal, setEditTotal] = useState(String(book.total_pages))
  const [editRead, setEditRead] = useState(String(book.pages_read))
  const [localRead, setLocalRead] = useState(book.pages_read)

  const pct = book.total_pages > 0 ? Math.min(100, Math.round((localRead / book.total_pages) * 100)) : 0
  const completed = !!book.completed

  const handlePageChange = (value: number) => {
    const clamped = Math.max(0, Math.min(book.total_pages, value))
    setLocalRead(clamped)
    onUpdate({ pages_read: clamped })
  }

  const handleSaveEdit = () => {
    onUpdate({ title: editTitle, author: editAuthor || undefined, total_pages: parseInt(editTotal) || 0, pages_read: parseInt(editRead) || 0 })
    setLocalRead(parseInt(editRead) || 0)
    setEditing(false)
  }

  const inputCls = 'w-full rounded-lg px-3 py-2 text-sm focus:outline-none focus:border-indigo-500 border'
  const inputStyle = { backgroundColor: 'var(--c-surface)', borderColor: 'var(--c-border)', color: 'var(--c-text)' }
  const btnSmStyle = { backgroundColor: 'var(--c-element)', color: 'var(--c-text-muted)' }

  if (editing) {
    return (
      <div className="rounded-xl p-4 space-y-3 border border-indigo-500/40" style={{ backgroundColor: 'var(--c-element)' }}>
        <input autoFocus className={inputCls} style={inputStyle}
          value={editTitle} onChange={e => setEditTitle(e.target.value)} placeholder="Book title" />
        <input className={inputCls} style={inputStyle}
          value={editAuthor} onChange={e => setEditAuthor(e.target.value)} placeholder="Author (optional)" />
        <div className="flex gap-2">
          <div className="flex-1">
            <label className="text-xs mb-1 block" style={{ color: 'var(--c-text-dim)' }}>Total pages</label>
            <input type="number" min={0} className={inputCls} style={inputStyle}
              value={editTotal} onChange={e => setEditTotal(e.target.value)} />
          </div>
          <div className="flex-1">
            <label className="text-xs mb-1 block" style={{ color: 'var(--c-text-dim)' }}>Pages read</label>
            <input type="number" min={0} className={inputCls} style={inputStyle}
              value={editRead} onChange={e => setEditRead(e.target.value)} />
          </div>
        </div>
        <div className="flex gap-2">
          <button onClick={handleSaveEdit} className="flex-1 py-2 bg-indigo-600 hover:bg-indigo-700 rounded-lg text-sm text-white">Save</button>
          <button onClick={() => setEditing(false)} className="px-4 py-2 rounded-lg text-sm border"
            style={{ backgroundColor: 'var(--c-surface)', borderColor: 'var(--c-border)', color: 'var(--c-text-muted)' }}>
            Cancel
          </button>
        </div>
      </div>
    )
  }

  return (
    <div className={`flex items-start gap-3 p-4 rounded-xl border transition-colors group ${completed ? 'opacity-60' : ''}`}
      style={{ backgroundColor: 'var(--c-surface)', borderColor: 'var(--c-border)' }}
    >
      {/* Complete toggle */}
      <button
        onClick={() => onUpdate({ completed: !completed })}
        className={`mt-0.5 w-5 h-5 rounded-full border-2 flex items-center justify-center shrink-0 transition-colors ${
          completed ? 'border-amber-500 bg-amber-600' : 'border-slate-600 hover:border-amber-500'
        }`}
        title={completed ? 'Mark as unread' : 'Mark as read'}
      >
        {completed && (
          <svg className="w-3 h-3 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={3} d="M5 13l4 4L19 7" />
          </svg>
        )}
      </button>

      <div className="flex-1 min-w-0">
        <div className="flex items-baseline gap-2 mb-0.5">
          <span className={`text-sm font-medium ${completed ? 'line-through' : ''}`}
            style={{ color: completed ? 'var(--c-text-dim)' : 'var(--c-text)' }}>
            📖 {book.title}
          </span>
          {book.author && <span className="text-xs" style={{ color: 'var(--c-text-dim)' }}>{book.author}</span>}
        </div>

        {/* Progress bar */}
        {!completed && book.total_pages > 0 && (
          <div className="space-y-1">
            <div className="flex items-center gap-2">
              <div className="flex-1 h-1.5 rounded-full overflow-hidden" style={{ backgroundColor: 'var(--c-element)' }}>
                <div className="h-full bg-amber-500 rounded-full transition-all" style={{ width: `${pct}%` }} />
              </div>
              <span className="text-xs tabular-nums" style={{ color: 'var(--c-text-dim)' }}>{localRead}/{book.total_pages}p</span>
              <span className="text-xs text-amber-400">{pct}%</span>
            </div>
            {/* Quick page update */}
            <div className="flex items-center gap-1">
              {[-10, -1].map(d => (
                <button key={d} onClick={() => handlePageChange(localRead + d)}
                  className="px-2 py-0.5 text-xs rounded hover:brightness-110"
                  style={btnSmStyle}>{d}</button>
              ))}
              <input
                type="number"
                className="w-16 text-center text-xs rounded px-1 py-0.5 focus:outline-none border"
                style={{ backgroundColor: 'var(--c-element)', borderColor: 'var(--c-border)', color: 'var(--c-text)' }}
                value={localRead} min={0} max={book.total_pages}
                onChange={e => setLocalRead(Number(e.target.value))}
                onBlur={e => handlePageChange(Number(e.target.value))}
              />
              {[1, 10].map(d => (
                <button key={d} onClick={() => handlePageChange(localRead + d)}
                  className="px-2 py-0.5 text-xs rounded hover:brightness-110"
                  style={btnSmStyle}>+{d}</button>
              ))}
            </div>
          </div>
        )}
        {completed && (
          <p className="text-xs text-amber-400">{book.total_pages > 0 ? `${book.total_pages} pages` : ''} ✓ Read</p>
        )}
      </div>

      <div className="flex gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
        <button onClick={() => setEditing(true)} className="p-1 rounded" style={{ color: 'var(--c-text-dim)' }}>
          <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2}
              d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" />
          </svg>
        </button>
        <button onClick={onDelete} className="p-1 rounded text-slate-500 hover:text-red-400">
          <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2}
              d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
          </svg>
        </button>
      </div>
    </div>
  )
}
