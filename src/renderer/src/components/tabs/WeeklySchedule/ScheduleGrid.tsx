import { useEffect, useRef, useState, useCallback } from 'react'
import { useTranslation } from 'react-i18next'
import { useActivityStore, Activity } from '../../../stores/activityStore'
import { useCategoryStore } from '../../../stores/categoryStore'
import SlotCell from './SlotCell'
import ActivityBlock from './ActivityBlock'

const TIME_SLOTS: string[] = Array.from({ length: 48 }, (_, i) => {
  const h = Math.floor(i / 2)
  const m = i % 2 === 0 ? '00' : '30'
  return `${String(h).padStart(2, '0')}:${m}`
})

const SLOT_HEIGHT = 28
const TIME_COL_WIDTH = 52
const DAY_COL_WIDTH = (1280 - TIME_COL_WIDTH - 16) / 7

const DAY_NAMES_EN = ['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun']
const DAY_NAMES_SR = ['Pon', 'Uto', 'Sre', 'Čet', 'Pet', 'Sub', 'Ned']

function toISO(date: Date): string {
  return `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, '0')}-${String(date.getDate()).padStart(2, '0')}`
}

function getCurrentSlot(): string {
  const now = new Date()
  const h = now.getHours()
  const m = now.getMinutes() < 30 ? '00' : '30'
  return `${String(h).padStart(2, '0')}:${m}`
}

function addMinutes(time: string, mins: number): string {
  const [h, m] = time.split(':').map(Number)
  const total = h * 60 + m + mins
  return `${String(Math.floor(total / 60) % 24).padStart(2, '0')}:${String(total % 60).padStart(2, '0')}`
}

function slotIndex(time: string): number {
  const [h, m] = time.split(':').map(Number)
  return h * 2 + (m >= 30 ? 1 : 0)
}

interface ScheduleGridProps {
  weekStart: string
  isCurrentWeek: boolean
  weekDates: string[]
}

export default function ScheduleGrid({ weekStart, isCurrentWeek, weekDates }: ScheduleGridProps): JSX.Element {
  const { t, i18n } = useTranslation()
  const { activities, upsertActivity, deleteActivity, updateActivityCategory } = useActivityStore()
  const { categories } = useCategoryStore()
  const scrollRef = useRef<HTMLDivElement>(null)

  const [dragStart, setDragStart] = useState<{ date: string; slotIdx: number } | null>(null)
  const [dragEnd, setDragEnd] = useState<{ date: string; slotIdx: number } | null>(null)
  const [pendingInput, setPendingInput] = useState<{ date: string; startSlot: string; endSlot: string } | null>(null)
  const [contextMenu, setContextMenu] = useState<{ x: number; y: number; activity: Activity } | null>(null)
  const [catSubmenuOpen, setCatSubmenuOpen] = useState(false)

  const dayNames = i18n.language === 'sr' ? DAY_NAMES_SR : DAY_NAMES_EN
  const today = toISO(new Date())
  const currentSlot = getCurrentSlot()

  useEffect(() => {
    if (isCurrentWeek && scrollRef.current) {
      const idx = slotIndex(currentSlot)
      const scrollY = Math.max(0, idx * SLOT_HEIGHT - 150)
      scrollRef.current.scrollTop = scrollY
    }
  }, [isCurrentWeek, weekStart])

  const activitiesByDate = new Map<string, Activity[]>()
  for (const a of activities) {
    if (!activitiesByDate.has(a.date)) activitiesByDate.set(a.date, [])
    activitiesByDate.get(a.date)!.push(a)
  }

  const isSlotOccupied = useCallback((date: string, slot: string): Activity | undefined => {
    return (activitiesByDate.get(date) ?? []).find(a => {
      const startIdx = slotIndex(a.start_time)
      const endIdx = slotIndex(a.end_time)
      const slIdx = slotIndex(slot)
      return slIdx >= startIdx && slIdx < endIdx
    })
  }, [activities])

  const handleMouseDown = (date: string, slotIdx: number) => {
    const slot = TIME_SLOTS[slotIdx]
    if (isSlotOccupied(date, slot)) return
    setDragStart({ date, slotIdx })
    setDragEnd({ date, slotIdx })
  }

  const handleMouseEnter = (date: string, slotIdx: number) => {
    if (!dragStart || dragStart.date !== date) return
    setDragEnd({ date, slotIdx })
  }

  const handleMouseUp = () => {
    if (!dragStart || !dragEnd) { setDragStart(null); setDragEnd(null); return }
    const minIdx = Math.min(dragStart.slotIdx, dragEnd.slotIdx)
    const maxIdx = Math.max(dragStart.slotIdx, dragEnd.slotIdx)
    const startSlot = TIME_SLOTS[minIdx]
    const endSlot = addMinutes(TIME_SLOTS[maxIdx], 30)
    setPendingInput({ date: dragStart.date, startSlot, endSlot })
    setDragStart(null)
    setDragEnd(null)
  }

  const isDragHighlighted = (date: string, slotIdx: number): boolean => {
    if (!dragStart || !dragEnd || dragStart.date !== date) return false
    const min = Math.min(dragStart.slotIdx, dragEnd.slotIdx)
    const max = Math.max(dragStart.slotIdx, dragEnd.slotIdx)
    return slotIdx >= min && slotIdx <= max
  }

  const handleSaveActivity = async (name: string, date: string, startSlot: string, endSlot: string) => {
    if (!name.trim()) { setPendingInput(null); return }
    await upsertActivity({ date, start_time: startSlot, end_time: endSlot, name })
    setPendingInput(null)
  }

  const handleContextMenu = (e: React.MouseEvent, activity: Activity) => {
    e.preventDefault()
    e.stopPropagation()
    setCatSubmenuOpen(false)
    setContextMenu({ x: e.clientX, y: e.clientY, activity })
  }

  const handleDeleteActivity = async (id: number) => {
    await deleteActivity(id)
    setContextMenu(null)
  }

  const handleChangeCat = async (activityId: number, catId: number) => {
    await updateActivityCategory(activityId, catId)
    setContextMenu(null)
    setCatSubmenuOpen(false)
  }

  const closeContextMenu = () => {
    setContextMenu(null)
    setCatSubmenuOpen(false)
  }

  // Column background: alternate even/odd, today gets special color
  const colBg = (colIdx: number, isToday: boolean): string => {
    if (isToday) return 'var(--c-col-today)'
    return colIdx % 2 === 0 ? 'var(--c-col-even)' : 'var(--c-col-odd)'
  }

  // Row background: alternate even/odd, current slot gets special color
  const rowBg = (slotIdx: number, isCurrentSlot: boolean): string => {
    if (isCurrentSlot) return 'var(--c-row-now)'
    return slotIdx % 2 === 0 ? 'var(--c-row-even)' : 'var(--c-row-odd)'
  }

  return (
    <div
      className="flex flex-col flex-1 overflow-hidden"
      onMouseUp={handleMouseUp}
      onMouseLeave={handleMouseUp}
      onClick={closeContextMenu}
    >
      {/* Day header row */}
      <div className="flex shrink-0 border-b" style={{ paddingLeft: TIME_COL_WIDTH, backgroundColor: 'var(--c-surface)', borderColor: 'var(--c-border)' }}>
        {weekDates.map((date, i) => {
          const isToday = isCurrentWeek && date === today
          const d = new Date(date + 'T00:00:00')
          return (
            <div
              key={date}
              className="flex flex-col items-center justify-center py-2 border-r last:border-r-0"
              style={{
                width: DAY_COL_WIDTH, minWidth: DAY_COL_WIDTH,
                borderColor: 'var(--c-border)',
                backgroundColor: isToday ? 'var(--c-col-today)' : (i % 2 === 0 ? 'var(--c-col-even)' : 'var(--c-col-odd)')
              }}
            >
              <span className={`text-xs font-medium ${isToday ? 'text-indigo-400' : ''}`}
                style={!isToday ? { color: 'var(--c-text-muted)' } : undefined}>
                {dayNames[i]}
              </span>
              <span className={`text-sm font-semibold mt-0.5 w-7 h-7 flex items-center justify-center rounded-full ${
                isToday ? 'bg-indigo-600 text-white' : ''
              }`} style={!isToday ? { color: 'var(--c-text)' } : undefined}>
                {d.getDate()}
              </span>
            </div>
          )
        })}
      </div>

      {/* Scrollable grid body */}
      <div ref={scrollRef} className="flex-1 overflow-y-auto overflow-x-hidden relative select-none">
        <div className="flex" style={{ minHeight: TIME_SLOTS.length * SLOT_HEIGHT }}>
          {/* Time gutter */}
          <div className="shrink-0" style={{ width: TIME_COL_WIDTH, backgroundColor: 'var(--c-base)' }}>
            {TIME_SLOTS.map((slot, i) => (
              <div
                key={slot}
                className="flex items-start justify-end pr-2 border-b"
                style={{ height: SLOT_HEIGHT, borderColor: 'var(--c-border-subtle)' }}
              >
                {i % 2 === 0 && (
                  <span className="text-[10px] leading-none mt-1" style={{ color: 'var(--c-text-dim)' }}>{slot}</span>
                )}
              </div>
            ))}
          </div>

          {/* Day columns */}
          {weekDates.map((date, colIdx) => {
            const isToday = isCurrentWeek && date === today
            const dayActivities = activitiesByDate.get(date) ?? []

            return (
              <div
                key={date}
                className="relative border-r last:border-r-0"
                style={{
                  width: DAY_COL_WIDTH, minWidth: DAY_COL_WIDTH,
                  borderColor: 'var(--c-border)',
                  backgroundColor: colBg(colIdx, isToday)
                }}
              >
                {/* Slot rows */}
                {TIME_SLOTS.map((slot, slotIdx) => {
                  const isCurrentTimeSlot = isCurrentWeek && isToday && slot === currentSlot
                  const occupied = isSlotOccupied(date, slot)
                  const highlighted = isDragHighlighted(date, slotIdx)

                  return (
                    <div
                      key={slot}
                      className="border-b transition-colors"
                      style={{
                        height: SLOT_HEIGHT,
                        borderColor: 'var(--c-border-subtle)',
                        backgroundColor: highlighted ? 'rgba(99,102,241,0.2)' : rowBg(slotIdx, isCurrentTimeSlot),
                        cursor: !occupied && !highlighted ? 'pointer' : undefined
                      }}
                      onMouseDown={() => !occupied && handleMouseDown(date, slotIdx)}
                      onMouseEnter={() => handleMouseEnter(date, slotIdx)}
                    >
                      {isCurrentTimeSlot && (
                        <div className="absolute left-0 right-0 border-t-2 border-indigo-500 z-20 pointer-events-none" />
                      )}
                    </div>
                  )
                })}

                {/* Activity blocks */}
                {dayActivities.map(activity => (
                  <ActivityBlock
                    key={activity.id}
                    activity={activity}
                    slotHeight={SLOT_HEIGHT}
                    columnWidth={DAY_COL_WIDTH}
                    onContextMenu={(e) => handleContextMenu(e, activity)}
                  />
                ))}

                {/* Pending inline input */}
                {pendingInput && pendingInput.date === date && (
                  <SlotCell
                    date={date}
                    startSlot={pendingInput.startSlot}
                    endSlot={pendingInput.endSlot}
                    slotHeight={SLOT_HEIGHT}
                    onSave={(name) => handleSaveActivity(name, date, pendingInput.startSlot, pendingInput.endSlot)}
                    onCancel={() => setPendingInput(null)}
                  />
                )}
              </div>
            )
          })}
        </div>
      </div>

      {/* Cascading context menu */}
      {contextMenu && (
        <div
          className="fixed z-50 rounded-lg shadow-2xl py-1 min-w-[180px] border"
          style={{
            top: Math.min(contextMenu.y, window.innerHeight - 200),
            left: Math.min(contextMenu.x, window.innerWidth - 220),
            backgroundColor: 'var(--c-surface)',
            borderColor: 'var(--c-border)'
          }}
          onClick={e => e.stopPropagation()}
        >
          {/* Activity name header */}
          <div className="px-3 py-1.5 text-xs border-b truncate"
            style={{ color: 'var(--c-text-muted)', borderColor: 'var(--c-border)' }}>
            {contextMenu.activity.name}
          </div>

          {/* Categories → (cascading) */}
          <div
            className="relative"
            onMouseEnter={() => setCatSubmenuOpen(true)}
            onMouseLeave={() => setCatSubmenuOpen(false)}
          >
            <button
              className="flex items-center justify-between w-full px-3 py-2 text-sm transition-colors hover:bg-indigo-600/10"
              style={{ color: 'var(--c-text)' }}
            >
              <span>{t('schedule.changeCategory')}</span>
              <svg className="w-4 h-4 shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
              </svg>
            </button>

            {/* Submenu */}
            {catSubmenuOpen && (
              <div
                className="absolute left-full top-0 rounded-lg shadow-2xl py-1 min-w-[180px] border z-50"
                style={{ backgroundColor: 'var(--c-surface)', borderColor: 'var(--c-border)' }}
              >
                {categories.map(cat => (
                  <button
                    key={cat.id}
                    onClick={() => handleChangeCat(contextMenu.activity.id, cat.id)}
                    className="flex items-center gap-2 w-full px-3 py-1.5 text-sm transition-colors hover:bg-indigo-600/10"
                    style={{
                      color: contextMenu.activity.category_id === cat.id ? '#818cf8' : 'var(--c-text)'
                    }}
                  >
                    <span>{cat.icon}</span>
                    <span>{i18n.language === 'sr' ? cat.name_sr : cat.name_en}</span>
                    {contextMenu.activity.category_id === cat.id && (
                      <svg className="w-3.5 h-3.5 ml-auto text-indigo-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M5 13l4 4L19 7" />
                      </svg>
                    )}
                  </button>
                ))}
              </div>
            )}
          </div>

          {/* Delete */}
          <div className="border-t" style={{ borderColor: 'var(--c-border)' }}>
            <button
              onClick={() => handleDeleteActivity(contextMenu.activity.id)}
              className="flex items-center gap-2 w-full px-3 py-2 text-sm text-red-400 hover:bg-red-900/20 transition-colors"
            >
              <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2}
                  d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
              </svg>
              {t('schedule.deleteActivity')}
            </button>
          </div>
        </div>
      )}
    </div>
  )
}
