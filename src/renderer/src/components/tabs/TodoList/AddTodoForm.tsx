import { useState } from 'react'
import { useTranslation } from 'react-i18next'
import { TodoInput } from '../../../stores/todoStore'

interface AddTodoFormProps {
  onAdd: (input: TodoInput) => void
  onClose: () => void
  defaultTaskType?: 'daily' | 'longterm'
}

export default function AddTodoForm({ onAdd, onClose, defaultTaskType = 'daily' }: AddTodoFormProps): JSX.Element {
  const { t } = useTranslation()
  const [title, setTitle] = useState('')
  const [description, setDescription] = useState('')
  const [dueDate, setDueDate] = useState('')
  const [priority, setPriority] = useState<'high' | 'medium' | 'low'>('medium')
  const [taskType, setTaskType] = useState<'daily' | 'longterm'>(defaultTaskType)

  const inputCls = 'w-full rounded-lg px-3 py-2 text-sm focus:outline-none focus:border-indigo-500 border'
  const inputStyle = { backgroundColor: 'var(--c-element)', borderColor: 'var(--c-border)', color: 'var(--c-text)' }

  const handleSubmit = () => {
    if (!title.trim()) return
    onAdd({ title, description: description || undefined, due_date: dueDate || undefined, priority, task_type: taskType })
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60" onClick={onClose}>
      <div
        className="rounded-xl p-6 w-[440px] shadow-2xl border"
        style={{ backgroundColor: 'var(--c-surface)', borderColor: 'var(--c-border)' }}
        onClick={e => e.stopPropagation()}
      >
        <h3 className="font-semibold mb-4" style={{ color: 'var(--c-text)' }}>{t('todos.addTask')}</h3>

        {/* Task type selector */}
        <div className="flex mb-4 rounded-lg p-1 gap-1" style={{ backgroundColor: 'var(--c-element)' }}>
          <button
            onClick={() => setTaskType('daily')}
            className={`flex-1 py-1.5 rounded text-xs font-medium transition-colors ${
              taskType === 'daily' ? 'bg-indigo-600 text-white' : ''
            }`}
            style={taskType !== 'daily' ? { color: 'var(--c-text-muted)' } : undefined}
          >
            📅 Daily
          </button>
          <button
            onClick={() => setTaskType('longterm')}
            className={`flex-1 py-1.5 rounded text-xs font-medium transition-colors ${
              taskType === 'longterm' ? 'bg-violet-600 text-white' : ''
            }`}
            style={taskType !== 'longterm' ? { color: 'var(--c-text-muted)' } : undefined}
          >
            🎯 Long-term
          </button>
        </div>

        <div className="space-y-3">
          <input
            autoFocus type="text"
            className={inputCls} style={inputStyle}
            placeholder={t('todos.addTask')}
            value={title} onChange={e => setTitle(e.target.value)}
            onKeyDown={e => e.key === 'Enter' && handleSubmit()}
          />
          <input
            type="text"
            className={inputCls} style={inputStyle}
            placeholder={t('todos.description')}
            value={description} onChange={e => setDescription(e.target.value)}
          />
          <div className="flex gap-2">
            <input
              type="date"
              className={`flex-1 ${inputCls}`} style={inputStyle}
              value={dueDate} onChange={e => setDueDate(e.target.value)}
            />
            <select
              className={`flex-1 ${inputCls}`} style={inputStyle}
              value={priority} onChange={e => setPriority(e.target.value as typeof priority)}
            >
              <option value="high">🔴 {t('todos.high')}</option>
              <option value="medium">🟡 {t('todos.medium')}</option>
              <option value="low">🟢 {t('todos.low')}</option>
            </select>
          </div>
        </div>
        <div className="flex gap-2 mt-4">
          <button
            onClick={handleSubmit}
            disabled={!title.trim()}
            className="flex-1 py-2 bg-indigo-600 hover:bg-indigo-700 disabled:opacity-40 rounded-lg text-sm font-medium text-white"
          >
            {t('todos.add')}
          </button>
          <button
            onClick={onClose}
            className="px-4 py-2 rounded-lg text-sm border"
            style={{ backgroundColor: 'var(--c-element)', borderColor: 'var(--c-border)', color: 'var(--c-text-muted)' }}
          >
            {t('todos.cancel')}
          </button>
        </div>
      </div>
    </div>
  )
}
