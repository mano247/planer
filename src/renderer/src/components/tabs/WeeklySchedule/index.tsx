import { useEffect, useRef, useState } from 'react'
import { useTranslation } from 'react-i18next'
import { useActivityStore } from '../../../stores/activityStore'
import { useCategoryStore } from '../../../stores/categoryStore'
import ScheduleGrid from './ScheduleGrid'

// Returns the ISO date string (YYYY-MM-DD) for the Monday of a week offset from today
function getMondayOfWeek(offsetWeeks: number): Date {
  const today = new Date()
  const day = today.getDay()
  const diffToMonday = day === 0 ? -6 : 1 - day
  const monday = new Date(today)
  monday.setDate(today.getDate() + diffToMonday + offsetWeeks * 7)
  monday.setHours(0, 0, 0, 0)
  return monday
}

function toISO(date: Date): string {
  const y = date.getFullYear()
  const m = String(date.getMonth() + 1).padStart(2, '0')
  const d = String(date.getDate()).padStart(2, '0')
  return `${y}-${m}-${d}`
}

function addDays(date: Date, days: number): Date {
  const d = new Date(date)
  d.setDate(d.getDate() + days)
  return d
}

export default function WeeklySchedule(): JSX.Element {
  const { t } = useTranslation()
  const { loadWeek } = useActivityStore()
  const { loadCategories } = useCategoryStore()
  const [weekOffset, setWeekOffset] = useState(0)

  const mondayDate = getMondayOfWeek(weekOffset)
  const sundayDate = addDays(mondayDate, 6)
  const weekStart = toISO(mondayDate)
  const weekEnd = toISO(sundayDate)

  const isCurrentWeek = weekOffset === 0

  useEffect(() => {
    loadCategories()
    loadWeek(weekStart, weekEnd)
  }, [weekStart, weekEnd])

  const formatWeekLabel = (): string => {
    const opts: Intl.DateTimeFormatOptions = { day: 'numeric', month: 'short', year: 'numeric' }
    return `${mondayDate.toLocaleDateString(undefined, opts)} – ${sundayDate.toLocaleDateString(undefined, opts)}`
  }

  return (
    <div className="flex flex-col h-full">
      {/* Week navigation header */}
      <div className="flex items-center justify-between px-5 py-2.5 bg-[#1a1d27] border-b border-[#2d3142] shrink-0">
        <button
          onClick={() => setWeekOffset(w => w - 1)}
          className="p-1.5 rounded hover:bg-[#242736] text-slate-400 hover:text-slate-100 transition-colors"
          title={t('schedule.prevWeek')}
        >
          <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
          </svg>
        </button>

        <div className="flex items-center gap-3">
          {isCurrentWeek && (
            <span className="px-2 py-0.5 rounded text-xs bg-indigo-600/20 text-indigo-400 border border-indigo-600/30">
              {t('schedule.currentWeek')}
            </span>
          )}
          <span className="text-sm font-medium text-slate-200">{formatWeekLabel()}</span>
          {!isCurrentWeek && (
            <button
              onClick={() => setWeekOffset(0)}
              className="text-xs text-indigo-400 hover:text-indigo-300"
            >
              {t('schedule.today')}
            </button>
          )}
        </div>

        <button
          onClick={() => setWeekOffset(w => w + 1)}
          className="p-1.5 rounded hover:bg-[#242736] text-slate-400 hover:text-slate-100 transition-colors"
          title={t('schedule.nextWeek')}
        >
          <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
          </svg>
        </button>
      </div>

      <ScheduleGrid
        weekStart={weekStart}
        isCurrentWeek={isCurrentWeek}
        weekDates={Array.from({ length: 7 }, (_, i) => toISO(addDays(mondayDate, i)))}
      />
    </div>
  )
}
