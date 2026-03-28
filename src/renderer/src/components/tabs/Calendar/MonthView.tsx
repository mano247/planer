import { useTranslation } from 'react-i18next'
import { CalendarEvent } from '../../../stores/eventStore'

interface MonthViewProps {
  year: number
  month: number
  eventsByDate: Map<string, CalendarEvent[]>
  onDayClick: (date: string) => void
}

function getDaysInMonth(year: number, month: number): Date[] {
  const days: Date[] = []
  const date = new Date(year, month - 1, 1)
  while (date.getMonth() === month - 1) {
    days.push(new Date(date))
    date.setDate(date.getDate() + 1)
  }
  return days
}

function toISO(date: Date): string {
  return `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, '0')}-${String(date.getDate()).padStart(2, '0')}`
}

function getFirstDayOffset(year: number, month: number): number {
  const firstDay = new Date(year, month - 1, 1).getDay()
  return firstDay === 0 ? 6 : firstDay - 1
}

export default function MonthView({ year, month, eventsByDate, onDayClick }: MonthViewProps): JSX.Element {
  const { t } = useTranslation()
  const dayLabels = t('calendar.days', { returnObjects: true }) as string[]
  const days = getDaysInMonth(year, month)
  const offset = getFirstDayOffset(year, month)
  const todayISO = toISO(new Date())

  const cells: (Date | null)[] = [
    ...Array.from({ length: offset }, () => null),
    ...days
  ]
  while (cells.length % 7 !== 0) cells.push(null)

  return (
    <div className="flex-1">
      {/* Day header */}
      <div className="grid grid-cols-7 mb-2">
        {dayLabels.map(day => (
          <div key={day} className="text-center text-xs font-semibold py-2" style={{ color: 'var(--c-text-dim)' }}>
            {day}
          </div>
        ))}
      </div>

      {/* Calendar grid */}
      <div className="grid grid-cols-7 gap-1">
        {cells.map((date, i) => {
          if (!date) return <div key={i} />
          const iso = toISO(date)
          const isToday = iso === todayISO
          const eventList = eventsByDate.get(iso) ?? []

          return (
            <div
              key={iso}
              onClick={() => onDayClick(iso)}
              className="min-h-[80px] rounded-lg p-2 cursor-pointer transition-all border"
              style={{
                borderColor: isToday ? '#6366f1' : 'var(--c-border)',
                backgroundColor: isToday ? 'var(--c-col-today)' : 'var(--c-surface)'
              }}
              onMouseEnter={e => {
                if (!isToday) (e.currentTarget as HTMLDivElement).style.borderColor = 'rgba(99,102,241,0.5)'
              }}
              onMouseLeave={e => {
                if (!isToday) (e.currentTarget as HTMLDivElement).style.borderColor = 'var(--c-border)'
              }}
            >
              <span className={`inline-flex items-center justify-center w-6 h-6 rounded-full text-sm font-medium ${
                isToday ? 'bg-indigo-600 text-white' : ''
              }`} style={!isToday ? { color: 'var(--c-text-secondary)' } : undefined}>
                {date.getDate()}
              </span>

              <div className="mt-1 space-y-0.5">
                {eventList.slice(0, 2).map(ev => (
                  <div key={ev.id}
                    className="text-[10px] bg-indigo-600/20 text-indigo-300 rounded px-1 truncate border border-indigo-600/30">
                    📅 {ev.title}
                  </div>
                ))}
                {eventList.length > 2 && (
                  <div className="text-[10px]" style={{ color: 'var(--c-text-dim)' }}>+{eventList.length - 2} more</div>
                )}
              </div>
            </div>
          )
        })}
      </div>
    </div>
  )
}
