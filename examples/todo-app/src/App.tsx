import { useEffect, useState } from 'react'
import Login from './components/Login'
import Register from './components/Register'
import TodoList from './components/TodoList'

export default function App() {
  const [view, setView] = useState<'login' | 'register' | 'app'>('login')

  useEffect(() => {
    const token = localStorage.getItem('mb_token')
    if (token) {
      setView('app')
    }
  }, [])

  if (view === 'app') {
    return <TodoList />
  }

  if (view === 'register') {
    return (
      <Register
        onRegistered={() => setView('login')}
        onSwitch={() => setView('login')}
      />
    )
  }

  return (
    <Login
      onLogin={() => setView('app')}
      onSwitch={() => setView('register')}
    />
  )
}
