import { useState } from 'react'
import { useTranslation } from 'react-i18next'
import { useSettingsStore } from '../../stores/settingsStore'
import { useCategoryStore, Category } from '../../stores/categoryStore'

interface SettingsPanelProps {
  onClose: () => void
}

export default function SettingsPanel({ onClose }: SettingsPanelProps): JSX.Element {
  const { t } = useTranslation()
  const { language, setLanguage } = useSettingsStore()
  const { categories, createCategory, updateCategory, deleteCategory } = useCategoryStore()
  const [expandedCat, setExpandedCat] = useState<number | null>(null)
  const [editingCat, setEditingCat] = useState<Category | null>(null)
  const [addingNew, setAddingNew] = useState(false)
  const [newCat, setNewCat] = useState({ name_en: '', name_sr: '', icon: '', color: '#6366f1', keywords: [] as string[] })
  const [newKwInput, setNewKwInput] = useState('')
  const [exportMsg, setExportMsg] = useState('')

  const inputCls = 'rounded px-3 py-1.5 text-sm focus:outline-none focus:border-indigo-500'
  const inputStyle = { backgroundColor: 'var(--c-surface)', borderWidth: 1, borderStyle: 'solid', borderColor: 'var(--c-border)', color: 'var(--c-text)' }

  const handleExport = async () => {
    const result = await window.api.data.export()
    if (result.success) setExportMsg(t('settings.exportSuccess'))
    setTimeout(() => setExportMsg(''), 3000)
  }

  const handleImport = async () => {
    if (!confirm(t('settings.importConfirm'))) return
    const result = await window.api.data.import()
    if (result.success) {
      setExportMsg(t('settings.importSuccess'))
      setTimeout(() => { setExportMsg(''); window.location.reload() }, 2000)
    }
  }

  const handleSaveEdit = async () => {
    if (!editingCat) return
    await updateCategory(editingCat.id, {
      name_en: editingCat.name_en, name_sr: editingCat.name_sr,
      icon: editingCat.icon, color: editingCat.color, keywords: editingCat.keywords
    })
    setEditingCat(null)
  }

  const handleCreateNew = async () => {
    if (!newCat.name_en.trim()) return
    await createCategory({
      name_en: newCat.name_en, name_sr: newCat.name_sr,
      icon: newCat.icon || '📌', color: newCat.color,
      keywords: newKwInput.split(',').map(k => k.trim()).filter(Boolean)
    })
    setAddingNew(false)
    setNewCat({ name_en: '', name_sr: '', icon: '', color: '#6366f1', keywords: [] })
    setNewKwInput('')
  }

  return (
    <div className="fixed inset-0 z-50 flex justify-end" onClick={onClose}>
      <div
        className="w-[400px] h-full flex flex-col shadow-2xl overflow-hidden border-l"
        style={{ backgroundColor: 'var(--c-surface)', borderColor: 'var(--c-border)' }}
        onClick={e => e.stopPropagation()}
      >
        {/* Header */}
        <div className="flex items-center justify-between px-5 py-4 border-b" style={{ borderColor: 'var(--c-border)' }}>
          <h2 className="font-semibold" style={{ color: 'var(--c-text)' }}>{t('settings.title')}</h2>
          <button onClick={onClose} className="p-1" style={{ color: 'var(--c-text-muted)' }}>
            <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
            </svg>
          </button>
        </div>

        <div className="flex-1 overflow-y-auto p-5 space-y-6">
          {/* Language */}
          <section>
            <h3 className="text-xs font-semibold uppercase tracking-wider mb-3" style={{ color: 'var(--c-text-muted)' }}>
              {t('settings.language')}
            </h3>
            <div className="flex gap-2">
              {(['en', 'sr'] as const).map(lang => (
                <button
                  key={lang}
                  onClick={() => setLanguage(lang)}
                  className={`flex-1 py-2 rounded-md text-sm font-medium transition-colors border ${
                    language === lang ? 'bg-indigo-600 border-indigo-600 text-white' : ''
                  }`}
                  style={language !== lang ? { borderColor: 'var(--c-border)', color: 'var(--c-text-muted)' } : undefined}
                >
                  {lang === 'en' ? '🇬🇧 English' : '🇷🇸 Srpski'}
                </button>
              ))}
            </div>
          </section>

          {/* Categories */}
          <section>
            <div className="flex items-center justify-between mb-3">
              <h3 className="text-xs font-semibold uppercase tracking-wider" style={{ color: 'var(--c-text-muted)' }}>
                {t('settings.categories')}
              </h3>
              <button onClick={() => setAddingNew(true)} className="text-xs text-indigo-400 hover:text-indigo-300">
                + {t('settings.addCategory')}
              </button>
            </div>

            {addingNew && (
              <div className="rounded-lg p-4 mb-3 space-y-3" style={{ backgroundColor: 'var(--c-element)' }}>
                <div className="grid grid-cols-2 gap-2">
                  <input className={inputCls} style={inputStyle}
                    placeholder={t('settings.categoryNameEn')} value={newCat.name_en}
                    onChange={e => setNewCat(p => ({ ...p, name_en: e.target.value }))} />
                  <input className={inputCls} style={inputStyle}
                    placeholder={t('settings.categoryNameSr')} value={newCat.name_sr}
                    onChange={e => setNewCat(p => ({ ...p, name_sr: e.target.value }))} />
                </div>
                <div className="flex gap-2">
                  <input className={`${inputCls} w-16 text-center`} style={inputStyle}
                    placeholder="🎯" value={newCat.icon}
                    onChange={e => setNewCat(p => ({ ...p, icon: e.target.value }))} />
                  <input type="color" className="rounded h-9 w-12 cursor-pointer bg-transparent border"
                    style={{ borderColor: 'var(--c-border)' }}
                    value={newCat.color} onChange={e => setNewCat(p => ({ ...p, color: e.target.value }))} />
                  <input className={`${inputCls} flex-1`} style={inputStyle}
                    placeholder={t('settings.keywords')} value={newKwInput}
                    onChange={e => setNewKwInput(e.target.value)} />
                </div>
                <div className="flex gap-2">
                  <button onClick={handleCreateNew}
                    className="flex-1 py-1.5 bg-indigo-600 hover:bg-indigo-700 rounded text-sm text-white">
                    {t('settings.save')}
                  </button>
                  <button onClick={() => setAddingNew(false)}
                    className="flex-1 py-1.5 rounded text-sm border"
                    style={{ backgroundColor: 'var(--c-surface)', borderColor: 'var(--c-border)', color: 'var(--c-text-muted)' }}>
                    {t('settings.cancel')}
                  </button>
                </div>
              </div>
            )}

            <div className="space-y-1">
              {categories.map(cat => (
                <div key={cat.id} className="rounded-lg overflow-hidden" style={{ backgroundColor: 'var(--c-element)' }}>
                  <div
                    className="flex items-center gap-3 px-4 py-2.5 cursor-pointer transition-colors hover:brightness-110"
                    onClick={() => setExpandedCat(expandedCat === cat.id ? null : cat.id)}
                  >
                    <span className="text-lg">{cat.icon}</span>
                    <div className="flex-1">
                      <div className="text-sm font-medium" style={{ color: 'var(--c-text)' }}>
                        {language === 'sr' ? cat.name_sr : cat.name_en}
                      </div>
                      <div className="text-xs" style={{ color: 'var(--c-text-dim)' }}>
                        {cat.keywords.slice(0, 4).join(', ')}{cat.keywords.length > 4 ? '...' : ''}
                      </div>
                    </div>
                    <div className="w-3 h-3 rounded-full shrink-0" style={{ backgroundColor: cat.color }} />
                    <svg className={`w-4 h-4 transition-transform ${expandedCat === cat.id ? 'rotate-180' : ''}`}
                      style={{ color: 'var(--c-text-dim)' }} fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
                    </svg>
                  </div>

                  {expandedCat === cat.id && (
                    <div className="px-4 pb-4 space-y-3 border-t" style={{ borderColor: 'var(--c-surface)' }}>
                      {editingCat?.id === cat.id ? (
                        <>
                          <div className="grid grid-cols-2 gap-2 mt-3">
                            <input className={inputCls} style={inputStyle}
                              value={editingCat.name_en} placeholder={t('settings.categoryNameEn')}
                              onChange={e => setEditingCat(p => p ? { ...p, name_en: e.target.value } : p)} />
                            <input className={inputCls} style={inputStyle}
                              value={editingCat.name_sr} placeholder={t('settings.categoryNameSr')}
                              onChange={e => setEditingCat(p => p ? { ...p, name_sr: e.target.value } : p)} />
                          </div>
                          <div className="flex gap-2">
                            <input className={`${inputCls} w-16 text-center`} style={inputStyle}
                              value={editingCat.icon}
                              onChange={e => setEditingCat(p => p ? { ...p, icon: e.target.value } : p)} />
                            <input type="color" className="rounded h-9 w-12 cursor-pointer bg-transparent border"
                              style={{ borderColor: 'var(--c-border)' }}
                              value={editingCat.color}
                              onChange={e => setEditingCat(p => p ? { ...p, color: e.target.value } : p)} />
                            <input className={`${inputCls} flex-1`} style={inputStyle}
                              value={editingCat.keywords.join(', ')} placeholder={t('settings.keywords')}
                              onChange={e => setEditingCat(p => p ? { ...p, keywords: e.target.value.split(',').map(k => k.trim()) } : p)} />
                          </div>
                          <div className="flex gap-2">
                            <button onClick={handleSaveEdit}
                              className="flex-1 py-1.5 bg-indigo-600 hover:bg-indigo-700 rounded text-sm text-white">
                              {t('settings.save')}
                            </button>
                            <button onClick={() => setEditingCat(null)}
                              className="flex-1 py-1.5 rounded text-sm border"
                              style={{ backgroundColor: 'var(--c-surface)', borderColor: 'var(--c-border)', color: 'var(--c-text-muted)' }}>
                              {t('settings.cancel')}
                            </button>
                          </div>
                        </>
                      ) : (
                        <div className="flex gap-2 mt-3">
                          <button onClick={() => setEditingCat({ ...cat })}
                            className="flex-1 py-1.5 rounded text-sm border hover:brightness-110"
                            style={{ backgroundColor: 'var(--c-surface)', borderColor: 'var(--c-border)', color: 'var(--c-text-secondary)' }}>
                            {t('common.edit')}
                          </button>
                          {!cat.is_default && (
                            <button
                              onClick={() => { if (confirm(t('common.confirm'))) deleteCategory(cat.id) }}
                              className="px-3 py-1.5 bg-red-900/30 border border-red-900/50 rounded text-sm text-red-400 hover:text-red-300"
                            >
                              {t('common.delete')}
                            </button>
                          )}
                        </div>
                      )}
                    </div>
                  )}
                </div>
              ))}
            </div>
          </section>

          {/* Export / Import */}
          <section>
            <h3 className="text-xs font-semibold uppercase tracking-wider mb-3" style={{ color: 'var(--c-text-muted)' }}>Data</h3>
            {exportMsg && (
              <div className="mb-2 text-sm text-green-400 bg-green-900/20 border border-green-900/40 rounded px-3 py-2">
                {exportMsg}
              </div>
            )}
            <div className="flex gap-2">
              <button onClick={handleExport}
                className="flex-1 py-2 rounded text-sm hover:brightness-110 transition-colors border"
                style={{ backgroundColor: 'var(--c-element)', borderColor: 'var(--c-border)', color: 'var(--c-text-secondary)' }}>
                📤 {t('settings.export')}
              </button>
              <button onClick={handleImport}
                className="flex-1 py-2 rounded text-sm hover:brightness-110 transition-colors border"
                style={{ backgroundColor: 'var(--c-element)', borderColor: 'var(--c-border)', color: 'var(--c-text-secondary)' }}>
                📥 {t('settings.import')}
              </button>
            </div>
          </section>
        </div>
      </div>
    </div>
  )
}
