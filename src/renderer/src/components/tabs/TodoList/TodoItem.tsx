import { useState } from 'react'
import { useTranslation } from 'react-i18next'
import { Todo, TodoInput } from '../../../stores/todoStore'

const PRIORITY_CONFIG = {
  high:   { dot: 'bg-red-500',    label: 'High',   labelSr: 'Visok'  },
  medium: { dot: 'bg-yellow-400', label: 'Medium', labelSr: 'Srednji'},
  low:    { dot: 'bg-green-500',  label: 'Low',    labelSr: 'Nizak'  }
}

interface TodoItemProps {
  todo: Todo
  isEditing: boolean
  onEdit: () => void
  onCancelEdit: () => void
  onUpdate: (input: Partial<TodoInput & { completed: boolean }>) => void
  onToggle: () => void
  onDelete: () => void
}

export default function TodoItem({ todo, isEditing, onEdit, onCancelEdit, onUpdate, onToggle, onDelete }: TodoItemProps): JSX.Element {
  const { t } = useTranslation()
  const [editTitle, setEditTitle] = useState(todo.title)
  const [editDesc, setEditDesc] = useState(todo.description ?? '')
  const [editDue, setEditDue] = useState(todo.due_date ?? '')
  const [editPriority, setEditPriority] = useState(todo.priority)
  const [editTaskType, setEditTaskType] = useState(todo.task_type ?? 'daily')

  const priority = PRIORITY_CONFIG[todo.priority]

  const formatDue = (date: string | null): string | null => {
    if (!date) return null
    return new Date(date + 'T12:00:00').toLocaleDateString(undefined, { day: 'numeric', month: 'short', year: 'numeric' })
  }

  const isOverdue = todo.due_date && !todo.completed && new Date(todo.due_date) < new Date(new Date().toISOString().slice(0, 10))

  const inputCls = 'w-full rounded-lg px-3 py-2 text-sm focus:outline-none focus:border-indigo-500 border'
  const inputStyle = { backgroundColor: 'var(--c-surface)', borderColor: 'var(--c-border)', color: 'var(--c-text)' }

  if (isEditing) {
    return (
      <div className="rounded-xl p-4 space-y-3 border border-indigo-500/50"
        style={{ backgroundColor: 'var(--c-element)' }}
      >
        {/* Task type toggle */}
        <div className="flex rounded-lg p-1 gap-1" style={{ backgroundColor: 'var(--c-surface)' }}>
          <button
            onClick={() => setEditTaskType('daily')}
            className={`flex-1 py-1 rounded text-xs font-medium transition-colors ${editTaskType === 'daily' ? 'bg-indigo-600 text-white' : ''}`}
            style={editTaskType !== 'daily' ? { color: 'var(--c-text-muted)' } : undefined}
          >
            📅 Daily
          </button>
          <button
            onClick={() => setEditTaskType('longterm')}
            className={`flex-1 py-1 rounded text-xs font-medium transition-colors ${editTaskType === 'longterm' ? 'bg-violet-600 text-white' : ''}`}
            style={editTaskType !== 'longterm' ? { color: 'var(--c-text-muted)' } : undefined}
          >
            🎯 Long-term
          </button>
        </div>
        <input autoFocus className={inputCls} style={inputStyle}
          value={editTitle} onChange={e => setEditTitle(e.target.value)} />
        <input className={inputCls} style={inputStyle}
          placeholder={t('todos.description')}
          value={editDesc} onChange={e => setEditDesc(e.target.value)} />
        <div className="flex gap-2">
          <input type="date" className={`flex-1 ${inputCls}`} style={inputStyle}
            value={editDue} onChange={e => setEditDue(e.target.value)} />
          <select className={`flex-1 ${inputCls}`} style={inputStyle}
            value={editPriority} onChange={e => setEditPriority(e.target.value as typeof editPriority)}
          >
            <option value="high">{t('todos.high')}</option>
            <option value="medium">{t('todos.medium')}</option>
            <option value="low">{t('todos.low')}</option>
          </select>
        </div>
        <div className="flex gap-2">
          <button
            onClick={() => onUpdate({ title: editTitle, description: editDesc, due_date: editDue || undefined, priority: editPriority, task_type: editTaskType })}
            className="flex-1 py-2 bg-indigo-600 hover:bg-indigo-700 rounded-lg text-sm text-white"
          >
            {t('todos.save')}
          </button>
          <button onClick={onCancelEdit}
            className="px-4 py-2 rounded-lg text-sm border"
            style={{ backgroundColor: 'var(--c-surface)', borderColor: 'var(--c-border)', color: 'var(--c-text-muted)' }}
          >
            {t('todos.cancel')}
          </button>
        </div>
      </div>
    )
  }

  return (
    <div className={`flex items-start gap-3 p-4 rounded-xl border transition-colors group ${
      todo.completed ? 'opacity-60' : ''
    }`}
      style={{ backgroundColor: 'var(--c-surface)', borderColor: 'var(--c-border)' }}
    >
      {/* Checkbox */}
      <button
        onClick={onToggle}
        className={`mt-0.5 w-5 h-5 rounded-full border-2 flex items-center justify-center shrink-0 transition-colors ${
          todo.completed ? 'border-indigo-500 bg-indigo-600' : 'border-slate-600 hover:border-indigo-500'
        }`}
      >
        {todo.completed && (
          <svg className="w-3 h-3 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={3} d="M5 13l4 4L19 7" />
          </svg>
        )}
      </button>

      <div className="flex-1 min-w-0">
        <div className="flex items-center gap-2">
          <span className={`w-2 h-2 rounded-full shrink-0 ${priority.dot}`} title={priority.label} />
          <span className={`text-sm font-medium ${todo.completed ? 'line-through' : ''}`}
            style={{ color: todo.completed ? 'var(--c-text-dim)' : 'var(--c-text)' }}>
            {todo.title}
          </span>
        </div>
        {todo.description && (
          <p className="text-xs mt-0.5 ml-4" style={{ color: 'var(--c-text-dim)' }}>{todo.description}</p>
        )}
        {todo.due_date && (
          <p className={`text-xs mt-0.5 ml-4 ${isOverdue ? 'text-red-400' : ''}`}
            style={!isOverdue ? { color: 'var(--c-text-dim)' } : undefined}>
            📅 {formatDue(todo.due_date)} {isOverdue ? '⚠️' : ''}
          </p>
        )}
      </div>

      {/* Actions */}
      <div className="flex gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
        <button onClick={onEdit} className="p-1 rounded" style={{ color: 'var(--c-text-dim)' }}>
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
