import { useTranslation } from 'react-i18next'

interface SummaryCardsProps {
  totalHours: number
  topCategory: { name: string; icon: string; hours: number } | undefined
  mostActiveDay: string | null
  remainingHours: number
  totalHoursInPeriod: number
  period: string
}

export default function SummaryCards({ totalHours, topCategory, mostActiveDay, remainingHours, totalHoursInPeriod, period }: SummaryCardsProps): JSX.Element {
  const { t } = useTranslation()
  const pctUsed = totalHoursInPeriod > 0 ? (totalHours / totalHoursInPeriod) * 100 : 0
  const remainingKey = period === 'month' ? 'statistics.remainingMonth' : 'statistics.remainingWeek'

  const cardStyle = { backgroundColor: 'var(--c-surface)', borderColor: 'var(--c-border)' }

  return (
    <div className="grid grid-cols-4 gap-4">
      {/* Total hours */}
      <div className="rounded-xl p-4 border" style={cardStyle}>
        <div className="text-xs mb-1" style={{ color: 'var(--c-text-dim)' }}>{t('statistics.totalHours')}</div>
        <div className="text-2xl font-bold" style={{ color: 'var(--c-text)' }}>{totalHours.toFixed(1)}h</div>
        <div className="text-xs mt-1" style={{ color: 'var(--c-text-dim)' }}>{t('statistics.hoursLogged')}</div>
      </div>

      {/* Top category */}
      <div className="rounded-xl p-4 border" style={cardStyle}>
        <div className="text-xs mb-1" style={{ color: 'var(--c-text-dim)' }}>{t('statistics.topCategory')}</div>
        {topCategory ? (
          <>
            <div className="text-xl font-bold flex items-center gap-2" style={{ color: 'var(--c-text)' }}>
              <span>{topCategory.icon}</span>
              <span>{topCategory.hours.toFixed(1)}h</span>
            </div>
            <div className="text-xs mt-1 truncate" style={{ color: 'var(--c-text-muted)' }}>{topCategory.name}</div>
          </>
        ) : (
          <div className="text-sm" style={{ color: 'var(--c-text-dim)' }}>—</div>
        )}
      </div>

      {/* Most active day */}
      <div className="rounded-xl p-4 border" style={cardStyle}>
        <div className="text-xs mb-1" style={{ color: 'var(--c-text-dim)' }}>{t('statistics.mostActiveDay')}</div>
        <div className="text-2xl font-bold" style={{ color: 'var(--c-text)' }}>{mostActiveDay ?? '—'}</div>
      </div>

      {/* Remaining */}
      <div className="rounded-xl p-4 border" style={cardStyle}>
        <div className="text-xs mb-1" style={{ color: 'var(--c-text-dim)' }}>{t(remainingKey)}</div>
        <div className="text-2xl font-bold text-indigo-400">{remainingHours.toFixed(0)}h</div>
        <div className="text-xs mt-1" style={{ color: 'var(--c-text-dim)' }}>{t('statistics.hoursRemaining')}</div>
        <div className="mt-2 h-1.5 rounded-full overflow-hidden" style={{ backgroundColor: 'var(--c-element)' }}>
          <div className="h-full bg-indigo-600 rounded-full transition-all" style={{ width: `${Math.min(100, pctUsed)}%` }} />
        </div>
        <div className="text-[10px] mt-0.5" style={{ color: 'var(--c-text-dim)' }}>{pctUsed.toFixed(0)}% used</div>
      </div>
    </div>
  )
}
