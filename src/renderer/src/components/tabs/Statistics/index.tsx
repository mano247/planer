import { useState, useEffect, useMemo } from 'react'
import { useTranslation } from 'react-i18next'
import { useCategoryStore } from '../../../stores/categoryStore'
import SummaryCards from './SummaryCards'
import CategoryPieChart from './CategoryPieChart'
import CategoryBarChart from './CategoryBarChart'

type Period = 'day' | 'week' | 'month'

export interface ActivityData {
  date: string
  start_time: string
  end_time: string
  name: string
  category_id: number | null
  category_name_en?: string
  category_name_sr?: string
  category_icon?: string
  category_color?: string
}

function toISO(date: Date): string {
  const y = date.getFullYear()
  const m = String(date.getMonth() + 1).padStart(2, '0')
  const d = String(date.getDate()).padStart(2, '0')
  return `${y}-${m}-${d}`
}

function getDurationMins(start: string, end: string): number {
  const [sh, sm] = start.split(':').map(Number)
  const [eh, em] = end.split(':').map(Number)
  return (eh * 60 + em) - (sh * 60 + sm)
}

function getMondayOfWeek(date: Date): Date {
  const day = date.getDay()
  const diff = day === 0 ? -6 : 1 - day
  const monday = new Date(date)
  monday.setDate(date.getDate() + diff)
  monday.setHours(0, 0, 0, 0)
  return monday
}

export default function Statistics(): JSX.Element {
  const { t, i18n } = useTranslation()
  const { categories } = useCategoryStore()
  const [period, setPeriod] = useState<Period>('week')
  const [activities, setActivities] = useState<ActivityData[]>([])

  const today = new Date()

  const dateRange = useMemo((): [string, string] => {
    if (period === 'day') {
      const iso = toISO(today)
      return [iso, iso]
    }
    if (period === 'week') {
      const monday = getMondayOfWeek(today)
      const sunday = new Date(monday)
      sunday.setDate(monday.getDate() + 6)
      return [toISO(monday), toISO(sunday)]
    }
    // month
    const start = new Date(today.getFullYear(), today.getMonth(), 1)
    const end = new Date(today.getFullYear(), today.getMonth() + 1, 0)
    return [toISO(start), toISO(end)]
  }, [period])

  useEffect(() => {
    window.api.activities.getRange(dateRange[0], dateRange[1]).then(data => {
      setActivities(data as ActivityData[])
    })
  }, [dateRange])

  // Aggregate by category
  const categoryStats = useMemo(() => {
    const map = new Map<number | null, { minutes: number; icon: string; color: string; name: string }>()

    for (const a of activities) {
      const mins = getDurationMins(a.start_time, a.end_time)
      if (mins <= 0) continue
      const key = a.category_id
      if (!map.has(key)) {
        map.set(key, {
          minutes: 0,
          icon: a.category_icon ?? '📌',
          color: a.category_color ?? '#64748b',
          name: (i18n.language === 'sr' ? a.category_name_sr : a.category_name_en) ?? t('schedule.noCategory')
        })
      }
      map.get(key)!.minutes += mins
    }

    return Array.from(map.entries())
      .map(([id, data]) => ({ id, ...data, hours: data.minutes / 60 }))
      .sort((a, b) => b.minutes - a.minutes)
  }, [activities, i18n.language])

  const totalMinutes = categoryStats.reduce((sum, c) => sum + c.minutes, 0)

  // Remaining hours calculation (17h/day baseline)
  const WAKING_HOURS_PER_DAY = 17
  const remainingStats = useMemo(() => {
    const now = new Date()
    let remainingDays = 0

    if (period === 'day') {
      remainingDays = 1
    } else if (period === 'week') {
      const monday = getMondayOfWeek(now)
      const sunday = new Date(monday)
      sunday.setDate(monday.getDate() + 6)
      const daysLeft = Math.ceil((sunday.getTime() - now.getTime()) / (1000 * 60 * 60 * 24))
      remainingDays = Math.max(0, daysLeft)
    } else {
      const lastDay = new Date(now.getFullYear(), now.getMonth() + 1, 0)
      remainingDays = lastDay.getDate() - now.getDate() + 1
    }

    const totalHoursInPeriod = (period === 'day' ? 1 : period === 'week' ? 7 : new Date(today.getFullYear(), today.getMonth() + 1, 0).getDate()) * WAKING_HOURS_PER_DAY
    const loggedHours = totalMinutes / 60
    const remainingHours = Math.max(0, remainingDays * WAKING_HOURS_PER_DAY - (period === 'day' ? loggedHours : 0))

    return { loggedHours, remainingHours, totalHoursInPeriod }
  }, [period, totalMinutes])

  const DAY_NAMES = ['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun']
  const mostActiveDay = useMemo(() => {
    if (period === 'day') return null
    const dayMap = new Map<string, number>()
    for (const a of activities) {
      const mins = getDurationMins(a.start_time, a.end_time)
      dayMap.set(a.date, (dayMap.get(a.date) ?? 0) + mins)
    }
    if (dayMap.size === 0) return null
    const [date] = [...dayMap.entries()].sort((a, b) => b[1] - a[1])[0]
    const d = new Date(date + 'T00:00:00')
    const dayIdx = d.getDay()
    return DAY_NAMES[dayIdx === 0 ? 6 : dayIdx - 1]
  }, [activities, period])

  return (
    <div className="flex flex-col h-full p-5 space-y-5 overflow-y-auto">
      {/* Period selector */}
      <div className="flex items-center gap-1 rounded-lg p-1 w-fit" style={{ backgroundColor: 'var(--c-element)' }}>
        {(['day', 'week', 'month'] as Period[]).map(p => (
          <button
            key={p}
            onClick={() => setPeriod(p)}
            className={`px-4 py-1.5 rounded-md text-sm font-medium transition-colors ${
              period === p ? 'bg-indigo-600 text-white' : 'hover:text-slate-200'
            }`}
          >
            {t(`statistics.${p}`)}
          </button>
        ))}
      </div>

      {activities.length === 0 ? (
        <div className="flex-1 flex items-center justify-center" style={{ color: 'var(--c-text-dim)' }}>
          {t('statistics.noData')}
        </div>
      ) : (
        <>
          <SummaryCards
            totalHours={remainingStats.loggedHours}
            topCategory={categoryStats[0]}
            mostActiveDay={mostActiveDay}
            remainingHours={remainingStats.remainingHours}
            totalHoursInPeriod={remainingStats.totalHoursInPeriod}
            period={period}
          />

          <div className="grid grid-cols-2 gap-5">
            <div className="rounded-xl p-4 border" style={{ backgroundColor: 'var(--c-surface)', borderColor: 'var(--c-border)' }}>
              <h3 className="text-sm font-medium mb-3" style={{ color: 'var(--c-text-muted)' }}>{t('statistics.distribution')}</h3>
              <CategoryPieChart data={categoryStats} />
            </div>
            <div className="rounded-xl p-4 border" style={{ backgroundColor: 'var(--c-surface)', borderColor: 'var(--c-border)' }}>
              <h3 className="text-sm font-medium mb-3" style={{ color: 'var(--c-text-muted)' }}>{t('statistics.byCategory')}</h3>
              <CategoryBarChart data={categoryStats} />
            </div>
          </div>
        </>
      )}
    </div>
  )
}
