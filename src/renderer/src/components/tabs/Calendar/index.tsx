import { useState, useEffect } from 'react'
import { useTranslation } from 'react-i18next'
import { useEventStore } from '../../../stores/eventStore'
import MonthView from './MonthView'
import EventModal from './EventModal'
import { CalendarEvent } from '../../../stores/eventStore'

interface CalendarTabProps {
  targetDate?: string | null
  onTargetDateConsumed?: () => void
}

export default function CalendarTab({ targetDate, onTargetDateConsumed }: CalendarTabProps): JSX.Element {
  const { t } = useTranslation()
  const { events, createEvent, updateEvent, deleteEvent, loadMonth } = useEventStore()
  const [modalDate, setModalDate] = useState<string | null>(null)
  const [editingEvent, setEditingEvent] = useState<CalendarEvent | null>(null)

  const today = new Date()
  const [year, setYear] = useState(today.getFullYear())
  const [month, setMonth] = useState(today.getMonth() + 1)

  useEffect(() => {
    loadMonth(year, month)
  }, [year, month])

  // When bottom bar sends us to a specific date, navigate to that month and open the event
  useEffect(() => {
    if (!targetDate) return
    const [y, m] = targetDate.split('-').map(Number)
    setYear(y)
    setMonth(m)
    // Open the event for that date
    const ev = events.find(e => e.date === targetDate)
    if (ev) setEditingEvent(ev)
    else setModalDate(targetDate)
    onTargetDateConsumed?.()
  }, [targetDate])

  const prevMonth = () => {
    if (month === 1) { setMonth(12); setYear(y => y - 1) }
    else setMonth(m => m - 1)
  }

  const nextMonth = () => {
    if (month === 12) { setMonth(1); setYear(y => y + 1) }
    else setMonth(m => m + 1)
  }

  const eventsByDate = new Map<string, CalendarEvent[]>()
  for (const ev of events) {
    if (!eventsByDate.has(ev.date)) eventsByDate.set(ev.date, [])
    eventsByDate.get(ev.date)!.push(ev)
  }

  const handleDayClick = (date: string) => {
    const dayEvents = eventsByDate.get(date)
    if (dayEvents && dayEvents.length > 0) setEditingEvent(dayEvents[0])
    else setModalDate(date)
  }

  const handleSave = async (title: string, note: string) => {
    if (editingEvent) {
      await updateEvent(editingEvent.id, { title, note })
      setEditingEvent(null)
    } else if (modalDate) {
      await createEvent({ date: modalDate, title, note })
      setModalDate(null)
    }
  }

  const handleDelete = async () => {
    if (editingEvent) {
      await deleteEvent(editingEvent.id)
      setEditingEvent(null)
    }
  }

  const { i18n } = useTranslation()
  const monthNames = t('calendar.months', { returnObjects: true }) as string[]

  return (
    <div className="flex flex-col h-full p-5">
      {/* Month/year navigation */}
      <div className="flex items-center justify-between mb-5">
        <button onClick={prevMonth} className="p-2 rounded transition-colors hover:brightness-110"
          style={{ color: 'var(--c-text-muted)', backgroundColor: 'transparent' }}>
          <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
          </svg>
        </button>
        <h2 className="text-xl font-semibold" style={{ color: 'var(--c-text)' }}>
          {monthNames[month - 1]} {year}
        </h2>
        <button onClick={nextMonth} className="p-2 rounded transition-colors hover:brightness-110"
          style={{ color: 'var(--c-text-muted)', backgroundColor: 'transparent' }}>
          <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
          </svg>
        </button>
      </div>

      <MonthView year={year} month={month} eventsByDate={eventsByDate} onDayClick={handleDayClick} />

      {(modalDate || editingEvent) && (
        <EventModal
          date={modalDate ?? editingEvent!.date}
          initialTitle={editingEvent?.title ?? ''}
          initialNote={editingEvent?.note ?? ''}
          isEditing={!!editingEvent}
          onSave={handleSave}
          onDelete={editingEvent ? handleDelete : undefined}
          onClose={() => { setModalDate(null); setEditingEvent(null) }}
        />
      )}
    </div>
  )
}
