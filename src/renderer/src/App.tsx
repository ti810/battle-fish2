import { BrowserRouter, Route, Routes } from 'react-router-dom'
import Atletas from './pages/Atletas'
import Layout from './components/Layout'
import Custodia from './pages/Custodia'
import Grupos from './pages/Equipes'
import Usuarios from './pages/Usuarios'
import Ranking from './pages/Ranking'
import Login from './pages/Login'
import Campeonatos from './pages/Campeonatos'
import { useState } from 'react'
import { Toaster } from 'sonner'

export default function App(): React.JSX.Element {
  const [usuario, setUsuario] = useState<any | null>(null)

  const handleLogin = (userData: any) => {
    setUsuario(userData)
  }

  // if (!usuario) {
  //   return <Login onLogin={handleLogin} />
  // }

  return (
    <>
      <Toaster richColors position='bottom-right' />
      <BrowserRouter>
        <Routes>
          <Route path="/" element={<Layout />}>
            <Route index element={<Ranking />} />
            <Route path="/atletas" element={<Atletas />} />
            <Route path="/equipes" element={<Grupos />} />
            <Route path="/usuarios" element={<Usuarios />} />
            <Route path="/campeonatos" element={<Campeonatos />} />
            <Route path="/custodia" element={<Custodia />} />
          </Route>
        </Routes>
      </BrowserRouter>
    </>

  )
}
