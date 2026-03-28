import { useEffect, useRef } from 'react'
import { useEventStore, CalendarEvent } from '../../stores/eventStore'

interface BottomBarProps {
  onEventClick: (date: string) => void
}

function formatCardDate(iso: string): string {
  const d = new Date(iso + 'T12:00:00')
  return d.toLocaleDateString(undefined, { month: 'short', day: 'numeric' })
}

function daysUntil(iso: string): number {
  const today = new Date()
  today.setHours(0, 0, 0, 0)
  const target = new Date(iso + 'T00:00:00')
  return Math.round((target.getTime() - today.getTime()) / 86400000)
}

function urgencyColor(days: number): { bg: string; border: string; text: string } {
  if (days === 0) return { bg: 'rgba(239,68,68,0.15)', border: 'rgba(239,68,68,0.4)', text: '#f87171' }
  if (days <= 2) return { bg: 'rgba(245,158,11,0.12)', border: 'rgba(245,158,11,0.35)', text: '#fbbf24' }
  if (days <= 7) return { bg: 'rgba(99,102,241,0.12)', border: 'rgba(99,102,241,0.30)', text: '#818cf8' }
  return { bg: 'rgba(99,102,241,0.07)', border: 'rgba(99,102,241,0.20)', text: '#94a3b8' }
}

function EventCard({ event, onClick }: { event: CalendarEvent; onClick: () => void }) {
  const days = daysUntil(event.date)
  const colors = urgencyColor(days)

  return (
    <button
      onClick={onClick}
      className="shrink-0 flex flex-col gap-0.5 px-3 py-2 rounded-lg border text-left transition-opacity hover:opacity-80"
      style={{ backgroundColor: colors.bg, borderColor: colors.border, minWidth: 110, maxWidth: 160 }}
      title={`${event.title} — ${formatCardDate(event.date)}`}
    >
      <span className="text-[10px] font-semibold truncate" style={{ color: colors.text }}>
        {days === 0 ? 'Today' : days === 1 ? 'Tomorrow' : formatCardDate(event.date)}
      </span>
      <span className="text-xs truncate" style={{ color: 'var(--c-text-secondary)' }}>
        {event.title}
      </span>
    </button>
  )
}

export default function BottomBar({ onEventClick }: BottomBarProps): JSX.Element {
  const { upcomingEvents, loadUpcoming } = useEventStore()
  const scrollRef = useRef<HTMLDivElement>(null)

  useEffect(() => {
    loadUpcoming()
  }, [])

  if (upcomingEvents.length === 0) {
    return (
      <div
        className="shrink-0 flex items-center px-5 border-t"
        style={{ height: 44, backgroundColor: 'var(--c-surface)', borderColor: 'var(--c-border)' }}
      >
        <span className="text-xs" style={{ color: 'var(--c-text-dim)' }}>📅 No upcoming events</span>
      </div>
    )
  }

  return (
    <div
      className="shrink-0 flex items-center gap-3 px-4 border-t"
      style={{ height: 52, backgroundColor: 'var(--c-surface)', borderColor: 'var(--c-border)' }}
    >
      <span className="text-xs shrink-0" style={{ color: 'var(--c-text-dim)' }}>📅</span>
      <div
        ref={scrollRef}
        className="flex items-center gap-2 overflow-x-auto flex-1"
        style={{ scrollbarWidth: 'none' }}
      >
        {upcomingEvents.map(ev => (
          <EventCard
            key={ev.id}
            event={ev}
            onClick={() => onEventClick(ev.date)}
          />
        ))}
      </div>
    </div>
  )
}
