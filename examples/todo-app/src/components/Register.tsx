import { useState } from 'react'
import { api } from '../lib/api'
import type { RegisterRequest } from '../types'

interface RegisterProps {
  onRegistered: () => void
  onSwitch: () => void
}

export default function Register({ onRegistered, onSwitch }: RegisterProps) {
  const [form, setForm] = useState<RegisterRequest>({
    email: '',
    password: '',
    full_name: '',
  })
  const [error, setError] = useState('')
  const [loading, setLoading] = useState(false)

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setError('')
    setLoading(true)
    try {
      await api.register(form)
      onRegistered()
    } catch (err: any) {
      setError(err.message || 'Error al registrarse')
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="container">
      <h1>Todo App + Moonsbow</h1>
      <div className="card">
        <h2>Crear cuenta</h2>
        {error && <div className="error">{error}</div>}
        <form onSubmit={handleSubmit}>
          <input
            type="text"
            placeholder="Nombre completo (opcional)"
            value={form.full_name || ''}
            onChange={(e) => setForm({ ...form, full_name: e.target.value })}
          />
          <input
            type="email"
            placeholder="Email"
            required
            value={form.email}
            onChange={(e) => setForm({ ...form, email: e.target.value })}
          />
          <input
            type="password"
            placeholder="Contraseña"
            required
            value={form.password}
            onChange={(e) => setForm({ ...form, password: e.target.value })}
          />
          <button type="submit" disabled={loading}>
            {loading ? 'Creando...' : 'Crear cuenta'}
          </button>
        </form>
        <p style={{ marginTop: '1rem', textAlign: 'center', fontSize: '0.875rem' }}>
          ¿Ya tienes cuenta?{' '}
          <span className="link" onClick={onSwitch}>
            Inicia sesión
          </span>
        </p>
      </div>
    </div>
  )
}
