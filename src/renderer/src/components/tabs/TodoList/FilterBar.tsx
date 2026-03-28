import { useTranslation } from 'react-i18next'
import { useTodoStore } from '../../../stores/todoStore'

export default function FilterBar(): JSX.Element {
  const { t } = useTranslation()
  const { filter, setFilter } = useTodoStore()

  return (
    <div className="flex items-center rounded-lg p-1 gap-0.5" style={{ backgroundColor: 'var(--c-element)' }}>
      {(['all', 'active', 'completed'] as const).map(f => (
        <button
          key={f}
          onClick={() => setFilter(f)}
          className={`px-3 py-1 rounded text-xs font-medium transition-colors ${
            filter === f ? 'bg-indigo-600 text-white' : ''
          }`}
          style={filter !== f ? { color: 'var(--c-text-muted)' } : undefined}
        >
          {t(`todos.${f}`)}
        </button>
      ))}
    </div>
  )
}
