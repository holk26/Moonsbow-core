import { useState } from 'react'
import { api } from '../lib/api'
import type { LoginRequest } from '../types'

interface LoginProps {
  onLogin: (token: string) => void
  onSwitch: () => void
}

export default function Login({ onLogin, onSwitch }: LoginProps) {
  const [form, setForm] = useState<LoginRequest>({ email: '', password: '' })
  const [error, setError] = useState('')
  const [loading, setLoading] = useState(false)

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setError('')
    setLoading(true)
    try {
      const res = await api.login(form)
      localStorage.setItem('mb_token', res.access_token)
      onLogin(res.access_token)
    } catch (err: any) {
      setError(err.message || 'Error al iniciar sesión')
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="container">
      <h1>Todo App + Moonsbow</h1>
      <div className="card">
        <h2>Iniciar sesión</h2>
        {error && <div className="error">{error}</div>}
        <form onSubmit={handleSubmit}>
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
            {loading ? 'Entrando...' : 'Entrar'}
          </button>
        </form>
        <p style={{ marginTop: '1rem', textAlign: 'center', fontSize: '0.875rem' }}>
          ¿No tienes cuenta?{' '}
          <span className="link" onClick={onSwitch}>
            Regístrate
          </span>
        </p>
      </div>
    </div>
  )
}
