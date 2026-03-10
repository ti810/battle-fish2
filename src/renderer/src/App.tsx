import { HashRouter, Navigate, Route, Routes } from 'react-router-dom'
import { useState } from 'react'
import { Toaster } from 'sonner'

import Atletas from './pages/Atletas'
import Layout from './components/Layout'
import Custodia from './pages/Custodia'
import Grupos from './pages/Equipes'
import Usuarios from './pages/Usuarios'
import Dashboard from './pages/Dashboard'
import Ranking from './pages/Ranking'
import Login from './pages/Login'
import Campeonatos from './pages/Campeonatos'
import ConfiguracoesSistema from './pages/ConfiguracoesSistema'
import { AuthUserCustomer } from '~/src/shared/types/interfaces'

const SESSION_KEY = 'battlefish.auth.user'

function getInitialUser(): AuthUserCustomer | null {
  try {
    const stored = localStorage.getItem(SESSION_KEY)

    if (!stored) {
      return null
    }

    return JSON.parse(stored) as AuthUserCustomer
  } catch (error) {
    console.error('Erro ao restaurar sessao:', error)
    return null
  }
}

function MasterRoute({
  usuario,
  children
}: {
  usuario: AuthUserCustomer | null
  children: React.ReactElement
}) {
  if (!usuario || Number(usuario.is_master) !== 1) {
    return <Navigate to="/" replace />
  }

  return children
}

export default function App(): React.JSX.Element {
  const [usuario, setUsuario] = useState<AuthUserCustomer | null>(() => getInitialUser())

  const handleLogin = (userData: AuthUserCustomer) => {
    setUsuario(userData)
    localStorage.setItem(SESSION_KEY, JSON.stringify(userData))
  }

  const handleLogout = () => {
    setUsuario(null)
    localStorage.removeItem(SESSION_KEY)
  }

  if (!usuario) {
    return (
      <>
        <Toaster richColors position="bottom-right" />
        <Login onLogin={handleLogin} />
      </>
    )
  }

  return (
    <>
      <Toaster richColors position="bottom-right" />

      <HashRouter>
        <Routes>
          <Route path="/" element={<Layout usuario={usuario} onLogout={handleLogout} />}>
            <Route index element={<Ranking />} />
            <Route path="/dashboard" element={<Dashboard />} />
            <Route path="/atletas" element={<Atletas />} />
            <Route path="/equipes" element={<Grupos />} />
            <Route path="/usuarios" element={<Usuarios />} />
            <Route path="/campeonatos" element={<Campeonatos />} />
            <Route path="/custodia" element={<Custodia />} />
            <Route
              path="/configuracoes"
              element={
                <MasterRoute usuario={usuario}>
                  <ConfiguracoesSistema usuario={usuario} />
                </MasterRoute>
              }
            />
          </Route>
        </Routes>
      </HashRouter>
    </>
  )
}
