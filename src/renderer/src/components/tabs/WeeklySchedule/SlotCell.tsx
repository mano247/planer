import { useEffect, useRef } from 'react'
import { useTranslation } from 'react-i18next'

function slotIndex(time: string): number {
  const [h, m] = time.split(':').map(Number)
  return h * 2 + (m >= 30 ? 1 : 0)
}

interface SlotCellProps {
  date: string
  startSlot: string
  endSlot: string
  slotHeight: number
  onSave: (name: string) => void
  onCancel: () => void
}

export default function SlotCell({ startSlot, endSlot, slotHeight, onSave, onCancel }: SlotCellProps): JSX.Element {
  const { t } = useTranslation()
  const inputRef = useRef<HTMLInputElement>(null)
  const startIdx = slotIndex(startSlot)
  const endIdx = slotIndex(endSlot)
  const spanCount = Math.max(1, endIdx - startIdx)
  const height = spanCount * slotHeight

  useEffect(() => {
    inputRef.current?.focus()
  }, [])

  const handleKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === 'Enter') onSave(e.currentTarget.value)
    if (e.key === 'Escape') onCancel()
  }

  return (
    <div
      className="absolute left-0 right-0 z-10 px-1"
      style={{ top: startIdx * slotHeight, height }}
    >
      <input
        ref={inputRef}
        type="text"
        className="w-full h-full bg-indigo-700/80 border border-indigo-500 rounded px-2 text-sm text-white placeholder-indigo-300 outline-none focus:ring-1 focus:ring-indigo-400"
        placeholder={t('schedule.addActivity')}
        onKeyDown={handleKeyDown}
        onBlur={e => onSave(e.target.value)}
        onClick={e => e.stopPropagation()}
      />
    </div>
  )
}
