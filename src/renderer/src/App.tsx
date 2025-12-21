import { BrowserRouter, Route, Routes } from 'react-router-dom'
import Membros from './pages/Membros'
import Layout from './components/Layout'
import Grupos from './pages/Grupos'
import Usuarios from './pages/Usuarios'
import Ranking from './pages/Ranking'
import Login from './pages/Login'
import { useState } from 'react'

export default function App(): React.JSX.Element {
  const [usuario, setUsuario] = useState<any | null>(null)

  const handleLogin = (userData: any) => {
    setUsuario(userData)
  }

  // if (!usuario) {
  //   return <Login onLogin={handleLogin} />
  // }

  return (
    <BrowserRouter>
      <Routes>
        <Route path="/" element={<Layout />}>
          <Route index element={<Ranking />} />
          <Route path="/membros" element={<Membros />} />
          <Route path="/grupos" element={<Grupos />} />
          <Route path="/usuarios" element={<Usuarios />} />
        </Route>
      </Routes>
    </BrowserRouter>
  )
}
