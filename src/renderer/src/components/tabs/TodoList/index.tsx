import { useEffect, useState } from 'react'
import { useTranslation } from 'react-i18next'
import { useTodoStore, Todo, TodoInput } from '../../../stores/todoStore'
import { useBookStore, BookInput } from '../../../stores/bookStore'
import TodoItem from './TodoItem'
import BookItem from './BookItem'
import AddTodoForm from './AddTodoForm'
import FilterBar from './FilterBar'

type Section = 'tasks' | 'books'

function TodoSection({
  label,
  icon,
  todos,
  editingId,
  accentClass,
  onEdit,
  onCancelEdit,
  onUpdate,
  onToggle,
  onDelete,
  onAdd,
  defaultTaskType
}: {
  label: string
  icon: string
  todos: Todo[]
  editingId: number | null
  accentClass: string
  onEdit: (id: number) => void
  onCancelEdit: () => void
  onUpdate: (id: number, input: Partial<TodoInput & { completed: boolean }>) => void
  onToggle: (id: number, completed: boolean) => void
  onDelete: (id: number) => void
  onAdd: (defaultTaskType: 'daily' | 'longterm') => void
  defaultTaskType: 'daily' | 'longterm'
}) {
  return (
    <div>
      {/* Section header */}
      <div className="flex items-center justify-between mb-3">
        <div className="flex items-center gap-2">
          <span className="text-base">{icon}</span>
          <span className="text-sm font-semibold" style={{ color: 'var(--c-text-secondary)' }}>{label}</span>
          <span className="text-xs px-2 py-0.5 rounded-full" style={{ backgroundColor: 'var(--c-element)', color: 'var(--c-text-dim)' }}>
            {todos.filter(t => !t.completed).length}
          </span>
        </div>
        <button
          onClick={() => onAdd(defaultTaskType)}
          className={`flex items-center gap-1 px-3 py-1.5 rounded-lg text-xs font-medium text-white transition-colors ${accentClass}`}
        >
          <svg className="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
          </svg>
          Add
        </button>
      </div>

      {todos.length === 0 ? (
        <div className="flex items-center justify-center h-16 rounded-xl border border-dashed text-xs"
          style={{ borderColor: 'var(--c-border)', color: 'var(--c-text-dim)' }}>
          No tasks here
        </div>
      ) : (
        <div className="space-y-2">
          {todos.map(todo => (
            <TodoItem
              key={todo.id}
              todo={todo}
              isEditing={editingId === todo.id}
              onEdit={() => onEdit(todo.id)}
              onCancelEdit={onCancelEdit}
              onUpdate={async (input) => { await onUpdate(todo.id, input) }}
              onToggle={() => onToggle(todo.id, !todo.completed)}
              onDelete={() => onDelete(todo.id)}
            />
          ))}
        </div>
      )}
    </div>
  )
}

export default function TodoList(): JSX.Element {
  const { t } = useTranslation()
  const { todos, filter, loadTodos, createTodo, updateTodo, deleteTodo } = useTodoStore()
  const { books, loadBooks, createBook, updateBook, deleteBook } = useBookStore()
  const [section, setSection] = useState<Section>('tasks')
  const [showForm, setShowForm] = useState(false)
  const [formDefaultType, setFormDefaultType] = useState<'daily' | 'longterm'>('daily')
  const [showBookForm, setShowBookForm] = useState(false)
  const [editingId, setEditingId] = useState<number | null>(null)
  const [newBook, setNewBook] = useState({ title: '', author: '', total_pages: '', pages_read: '0' })

  useEffect(() => { loadTodos(); loadBooks() }, [])

  const filtered = todos.filter(todo => {
    if (filter === 'active') return !todo.completed
    if (filter === 'completed') return !!todo.completed
    return true
  })

  const dailyTodos = filtered.filter(t => (t.task_type ?? 'daily') === 'daily')
  const longtermTodos = filtered.filter(t => t.task_type === 'longterm')

  const handleAdd = async (input: TodoInput) => {
    await createTodo(input)
    setShowForm(false)
  }

  const handleAddBook = async () => {
    if (!newBook.title.trim()) return
    await createBook({
      title: newBook.title,
      author: newBook.author || undefined,
      total_pages: parseInt(newBook.total_pages) || 0,
      pages_read: parseInt(newBook.pages_read) || 0
    })
    setNewBook({ title: '', author: '', total_pages: '', pages_read: '0' })
    setShowBookForm(false)
  }

  const openAddForm = (defaultType: 'daily' | 'longterm') => {
    setFormDefaultType(defaultType)
    setShowForm(true)
  }

  const inputCls = 'w-full rounded-lg px-3 py-2 text-sm focus:outline-none focus:border-amber-500 border'
  const inputStyle = { backgroundColor: 'var(--c-element)', borderColor: 'var(--c-border)', color: 'var(--c-text)' }

  return (
    <div className="flex flex-col h-full">
      {/* Section switcher + controls */}
      <div className="flex items-center justify-between px-6 py-3 border-b shrink-0"
        style={{ borderColor: 'var(--c-border)' }}
      >
        <div className="flex items-center gap-3">
          {/* Section toggle */}
          <div className="flex items-center rounded-lg p-1 gap-0.5" style={{ backgroundColor: 'var(--c-element)' }}>
            <button
              onClick={() => setSection('tasks')}
              className={`px-3 py-1 rounded text-xs font-medium transition-colors ${section === 'tasks' ? 'bg-indigo-600 text-white' : ''}`}
              style={section !== 'tasks' ? { color: 'var(--c-text-muted)' } : undefined}
            >
              ✓ {t('tabs.todos')}
            </button>
            <button
              onClick={() => setSection('books')}
              className={`px-3 py-1 rounded text-xs font-medium transition-colors ${section === 'books' ? 'bg-amber-600 text-white' : ''}`}
              style={section !== 'books' ? { color: 'var(--c-text-muted)' } : undefined}
            >
              📖 Books
            </button>
          </div>
          {section === 'tasks' && <FilterBar />}
        </div>

        {section === 'books' && (
          <button
            onClick={() => setShowBookForm(true)}
            className="flex items-center gap-2 px-4 py-2 bg-amber-600 hover:bg-amber-700 rounded-lg text-sm font-medium text-white transition-colors"
          >
            <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
            </svg>
            Add Book
          </button>
        )}
      </div>

      {/* List */}
      <div className="flex-1 overflow-y-auto px-6 py-4">
        {section === 'tasks' ? (
          <div className="space-y-6">
            {/* Daily tasks */}
            <TodoSection
              label="Daily Tasks"
              icon="📅"
              todos={dailyTodos}
              editingId={editingId}
              accentClass="bg-indigo-600 hover:bg-indigo-700"
              onEdit={id => setEditingId(id)}
              onCancelEdit={() => setEditingId(null)}
              onUpdate={async (id, input) => { await updateTodo(id, input); setEditingId(null) }}
              onToggle={(id, completed) => updateTodo(id, { completed })}
              onDelete={id => deleteTodo(id)}
              onAdd={openAddForm}
              defaultTaskType="daily"
            />

            {/* Divider */}
            <div className="border-t" style={{ borderColor: 'var(--c-border)' }} />

            {/* Long-term tasks */}
            <TodoSection
              label="Long-term Goals"
              icon="🎯"
              todos={longtermTodos}
              editingId={editingId}
              accentClass="bg-violet-600 hover:bg-violet-700"
              onEdit={id => setEditingId(id)}
              onCancelEdit={() => setEditingId(null)}
              onUpdate={async (id, input) => { await updateTodo(id, input); setEditingId(null) }}
              onToggle={(id, completed) => updateTodo(id, { completed })}
              onDelete={id => deleteTodo(id)}
              onAdd={openAddForm}
              defaultTaskType="longterm"
            />
          </div>
        ) : (
          books.length === 0 ? (
            <div className="flex items-center justify-center h-40" style={{ color: 'var(--c-text-dim)' }}>
              No books yet
            </div>
          ) : (
            <div className="space-y-2">
              {books.map(book => (
                <BookItem key={book.id} book={book}
                  onUpdate={(input) => updateBook(book.id, input)}
                  onDelete={() => deleteBook(book.id)} />
              ))}
            </div>
          )
        )}
      </div>

      {/* Add task modal */}
      {showForm && (
        <AddTodoForm
          onAdd={handleAdd}
          onClose={() => setShowForm(false)}
          defaultTaskType={formDefaultType}
        />
      )}

      {/* Add book modal */}
      {showBookForm && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60" onClick={() => setShowBookForm(false)}>
          <div className="rounded-xl p-6 w-[420px] shadow-2xl border" style={{ backgroundColor: 'var(--c-surface)', borderColor: 'var(--c-border)' }}
            onClick={e => e.stopPropagation()}>
            <h3 className="font-semibold mb-4" style={{ color: 'var(--c-text)' }}>📖 Add Book</h3>
            <div className="space-y-3">
              <input autoFocus type="text" className={inputCls} style={inputStyle} placeholder="Book title *"
                value={newBook.title} onChange={e => setNewBook(p => ({ ...p, title: e.target.value }))} />
              <input type="text" className={inputCls} style={inputStyle} placeholder="Author (optional)"
                value={newBook.author} onChange={e => setNewBook(p => ({ ...p, author: e.target.value }))} />
              <div className="flex gap-2">
                <div className="flex-1">
                  <label className="text-xs mb-1 block" style={{ color: 'var(--c-text-muted)' }}>Total pages</label>
                  <input type="number" min={0} className={inputCls} style={inputStyle}
                    value={newBook.total_pages} onChange={e => setNewBook(p => ({ ...p, total_pages: e.target.value }))} />
                </div>
                <div className="flex-1">
                  <label className="text-xs mb-1 block" style={{ color: 'var(--c-text-muted)' }}>Pages already read</label>
                  <input type="number" min={0} className={inputCls} style={inputStyle}
                    value={newBook.pages_read} onChange={e => setNewBook(p => ({ ...p, pages_read: e.target.value }))} />
                </div>
              </div>
            </div>
            <div className="flex gap-2 mt-4">
              <button onClick={handleAddBook} disabled={!newBook.title.trim()}
                className="flex-1 py-2 bg-amber-600 hover:bg-amber-700 disabled:opacity-40 rounded-lg text-sm font-medium text-white">
                Add Book
              </button>
              <button onClick={() => setShowBookForm(false)}
                className="px-4 py-2 rounded-lg text-sm border"
                style={{ backgroundColor: 'var(--c-element)', borderColor: 'var(--c-border)', color: 'var(--c-text-muted)' }}>
                Cancel
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
