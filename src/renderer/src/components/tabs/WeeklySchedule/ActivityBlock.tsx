import { useTranslation } from 'react-i18next'
import { Activity } from '../../../stores/activityStore'

function slotIndex(time: string): number {
  const [h, m] = time.split(':').map(Number)
  return h * 2 + (m >= 30 ? 1 : 0)
}

function durationLabel(start: string, end: string): string {
  const [sh, sm] = start.split(':').map(Number)
  const [eh, em] = end.split(':').map(Number)
  const mins = (eh * 60 + em) - (sh * 60 + sm)
  if (mins < 60) return `${mins}m`
  const h = Math.floor(mins / 60)
  const m = mins % 60
  return m > 0 ? `${h}h ${m}m` : `${h}h`
}

interface ActivityBlockProps {
  activity: Activity
  slotHeight: number
  columnWidth: number
  onContextMenu: (e: React.MouseEvent) => void
}

export default function ActivityBlock({ activity, slotHeight, columnWidth, onContextMenu }: ActivityBlockProps): JSX.Element {
  const { i18n } = useTranslation()
  const startIdx = slotIndex(activity.start_time)
  const endIdx = slotIndex(activity.end_time)
  const spanCount = Math.max(1, endIdx - startIdx)
  const height = spanCount * slotHeight
  const top = startIdx * slotHeight

  const color = activity.category_color ?? '#4f46e5'
  const icon = activity.category_icon ?? ''
  const duration = durationLabel(activity.start_time, activity.end_time)

  return (
    <div
      className="absolute left-1 right-1 rounded flex flex-col px-1.5 py-0.5 overflow-hidden cursor-context-menu z-10 group"
      style={{
        top: top + 1,
        height: height - 2,
        backgroundColor: color + '33',
        borderLeft: `3px solid ${color}`
      }}
      onContextMenu={onContextMenu}
    >
      <div className="flex items-center gap-1 min-w-0">
        {icon && <span className="text-xs shrink-0">{icon}</span>}
        <span className="text-xs font-medium truncate" style={{ color }}>
          {activity.name}
        </span>
      </div>
      {spanCount > 1 && (
        <span className="text-[10px] opacity-60" style={{ color }}>
          {duration}
        </span>
      )}
    </div>
  )
}
