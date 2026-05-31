import { useEffect, useState } from 'react'
import { api } from '../lib/api'
import type { Todo, User } from '../types'

function generateId() {
  return Math.random().toString(36).slice(2) + Date.now().toString(36)
}

export default function TodoList() {
  const [user, setUser] = useState<User | null>(null)
  const [todos, setTodos] = useState<Todo[]>(() => {
    const raw = localStorage.getItem('mb_todos')
    return raw ? JSON.parse(raw) : []
  })
  const [text, setText] = useState('')
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')

  useEffect(() => {
    api
      .me()
      .then(setUser)
      .catch((err) => setError(err.message))
      .finally(() => setLoading(false))
  }, [])

  useEffect(() => {
    localStorage.setItem('mb_todos', JSON.stringify(todos))
  }, [todos])

  const handleAdd = (e: React.FormEvent) => {
    e.preventDefault()
    if (!text.trim()) return
    const todo: Todo = {
      id: generateId(),
      text: text.trim(),
      completed: false,
      createdAt: new Date().toISOString(),
    }
    setTodos([todo, ...todos])
    setText('')
  }

  const toggle = (id: string) => {
    setTodos(todos.map((t) => (t.id === id ? { ...t, completed: !t.completed } : t)))
  }

  const remove = (id: string) => {
    setTodos(todos.filter((t) => t.id !== id))
  }

  const logout = () => {
    localStorage.removeItem('mb_token')
    localStorage.removeItem('mb_todos')
    window.location.reload()
  }

  if (loading) {
    return (
      <div className="container">
        <p style={{ textAlign: 'center' }}>Cargando...</p>
      </div>
    )
  }

  return (
    <div className="container">
      <h1>Todo App + Moonsbow</h1>

      <div className="user-bar">
        <div>
          <small>Conectado como</small>
          <div>{user?.email}</div>
        </div>
        <button className="secondary" onClick={logout} style={{ width: 'auto' }}>
          Cerrar sesión
        </button>
      </div>

      {error && <div className="error">{error}</div>}

      <div className="card">
        <form onSubmit={handleAdd} style={{ display: 'flex', gap: '0.5rem' }}>
          <input
            style={{ marginBottom: 0, flex: 1 }}
            placeholder="¿Qué necesitas hacer?"
            value={text}
            onChange={(e) => setText(e.target.value)}
          />
          <button type="submit" style={{ width: 'auto' }}>
            Agregar
          </button>
        </form>
      </div>

      <div>
        {todos.length === 0 && (
          <p style={{ textAlign: 'center', color: '#64748b', marginTop: '2rem' }}>
            No hay tareas. ¡Agrega una arriba!
          </p>
        )}
        {todos.map((todo) => (
          <div
            key={todo.id}
            className={`todo-item ${todo.completed ? 'completed' : ''}`}
          >
            <input
              type="checkbox"
              checked={todo.completed}
              onChange={() => toggle(todo.id)}
            />
            <span>{todo.text}</span>
            <button onClick={() => remove(todo.id)}>Eliminar</button>
          </div>
        ))}
      </div>
    </div>
  )
}
