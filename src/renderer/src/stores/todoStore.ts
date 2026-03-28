import { create } from 'zustand'

export interface Todo {
  id: number
  title: string
  description: string | null
  due_date: string | null
  priority: 'high' | 'medium' | 'low'
  task_type: 'daily' | 'longterm'
  completed: number
  created_at: string
  updated_at: string
}

export interface TodoInput {
  title: string
  description?: string
  due_date?: string
  priority?: 'high' | 'medium' | 'low'
  task_type?: 'daily' | 'longterm'
}

interface TodoStore {
  todos: Todo[]
  filter: 'all' | 'active' | 'completed'
  setFilter: (filter: 'all' | 'active' | 'completed') => void
  loadTodos: () => Promise<void>
  createTodo: (input: TodoInput) => Promise<void>
  updateTodo: (id: number, input: Partial<TodoInput & { completed: boolean }>) => Promise<void>
  deleteTodo: (id: number) => Promise<void>
}

export const useTodoStore = create<TodoStore>((set) => ({
  todos: [],
  filter: 'all',
  setFilter: (filter) => set({ filter }),
  loadTodos: async () => {
    const todos = await window.api.todos.getAll()
    set({ todos: todos as Todo[] })
  },
  createTodo: async (input) => {
    await window.api.todos.create(input)
    const todos = await window.api.todos.getAll()
    set({ todos: todos as Todo[] })
  },
  updateTodo: async (id, input) => {
    await window.api.todos.update(id, input)
    const todos = await window.api.todos.getAll()
    set({ todos: todos as Todo[] })
  },
  deleteTodo: async (id) => {
    await window.api.todos.delete(id)
    set(state => ({ todos: state.todos.filter(t => t.id !== id) }))
  }
}))
