import { TabId } from '../../App'

interface Tab {
  id: TabId
  label: string
}

interface TabNavProps {
  tabs: Tab[]
  activeTab: TabId
  onTabChange: (tab: TabId) => void
}

export default function TabNav({ tabs, activeTab, onTabChange }: TabNavProps): JSX.Element {
  return (
    <nav className="flex border-b shrink-0 px-4"
      style={{ backgroundColor: 'var(--c-surface)', borderColor: 'var(--c-border)' }}
    >
      {tabs.map(tab => (
        <button
          key={tab.id}
          onClick={() => onTabChange(tab.id)}
          className={`px-5 py-3 text-sm font-medium border-b-2 transition-colors ${
            activeTab === tab.id
              ? 'border-indigo-500 text-indigo-400'
              : 'border-transparent hover:border-slate-600'
          }`}
          style={activeTab !== tab.id ? { color: 'var(--c-text-muted)' } : undefined}
        >
          {tab.label}
        </button>
      ))}
    </nav>
  )
}
