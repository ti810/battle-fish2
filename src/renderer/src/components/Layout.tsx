import { useEffect, useState } from 'react'
import { NavLink, Outlet, useLocation } from 'react-router-dom'
import {
  Trophy,
  Users,
  UserCircle,
  ClipboardList,
  AlignCenterVertical,
  Fish,
  Menu,
  Minus,
  Square,
  Copy,
  X,
  Anchor,
  Scale,
  Settings,
  LogOut
} from 'lucide-react'
import { motion, AnimatePresence } from 'framer-motion'
import { cn } from '../lib/utils'
import { AuthUserCustomer } from '~/src/shared/types/interfaces'
import appLogo from '../assets/images/novo_icone_battle_fish.png'

type SidebarProps = {
  isOpen: boolean
  setIsOpen: (v: boolean) => void
  usuario: AuthUserCustomer
  onLogout: () => void
}

type TitleBarProps = {
  usuario: AuthUserCustomer
  isSidebarOpen: boolean
  setIsSidebarOpen: (value: boolean) => void
}

const Sidebar = ({ isOpen, setIsOpen, usuario, onLogout }: SidebarProps) => {
  const links = [
    { to: '/dashboard', icon: Scale, label: 'Dashboard' },
    { to: '/', icon: Trophy, label: 'Ranking' },
    { to: '/campeonatos', icon: AlignCenterVertical, label: 'Campeonatos' },
    { to: '/equipes', icon: Fish, label: 'Equipes' },
    { to: '/atletas', icon: Users, label: 'Atletas' },
    { to: '/usuarios', icon: UserCircle, label: 'Usuarios' },
    { to: '/custodia', icon: ClipboardList, label: 'Custodia' },
    ...(Number(usuario.is_master) === 1
      ? [{ to: '/configuracoes', icon: Settings, label: 'Configuracoes' }]
      : [])
  ]

  return (
    <>
      <AnimatePresence>
        {isOpen && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 0.5 }}
            exit={{ opacity: 0 }}
            onClick={() => setIsOpen(false)}
            className="fixed inset-0 top-11 bg-black z-40 md:hidden"
          />
        )}
      </AnimatePresence>

      <motion.div
        className={cn(
          'fixed top-11 left-0 h-[calc(100%-2.75rem)] w-64 bg-blue-900 shadow-black/20 z-50 transform md:translate-x-0 md:static md:h-full md:top-0 md:shadow-lg',
          isOpen ? 'translate-x-0' : '-translate-x-full'
        )}
        transition={{ type: 'spring', stiffness: 300, damping: 30 }}
      >
        <div className="h-16 flex items-center justify-center border-b border-blue-800 bg-blue-900">
          <div className="flex items-center gap-2 text-blue-50 font-bold text-xl">
            <Anchor className="w-6 h-6" />
            <span>BattleFish</span>
          </div>
        </div>

        <nav className="p-4 space-y-2 pb-36">
          {links.map((link) => (
            <NavLink
              key={link.to}
              to={link.to}
              onClick={() => setIsOpen(false)}
              className={({ isActive }) =>
                cn(
                  'flex items-center gap-3 px-4 py-3 rounded-lg transition-all duration-200',
                  isActive
                    ? 'bg-blue-700/40 text-white shadow-sm font-medium translate-x-1'
                    : 'text-blue-100 hover:bg-blue-800/60 hover:text-white'
                )
              }
            >
              <link.icon className="w-5 h-5" />
              {link.label}
            </NavLink>
          ))}
        </nav>

        <div className="absolute bottom-0 left-0 right-0 p-4 border-t border-blue-800 bg-blue-900">
          <div className="flex items-center gap-3 mb-3">
            <div className="w-10 h-10 rounded-full bg-blue-700 flex items-center justify-center text-white font-bold shadow-md uppercase">
              {usuario.nome?.charAt(0) || 'U'}
            </div>
            <div className="flex-1 min-w-0">
              <p className="font-semibold text-blue-50 truncate">{usuario.nome}</p>
              <p className="text-xs text-blue-200 truncate">
                {Number(usuario.is_master) === 1 ? 'Master' : 'Operador'}
              </p>
            </div>
          </div>

          <button
            type="button"
            onClick={() => {
              onLogout()
              setIsOpen(false)
            }}
            className="w-full inline-flex items-center justify-center gap-2 rounded-lg border border-blue-700 bg-blue-800/70 text-blue-50 py-2 hover:bg-blue-800 transition-colors"
          >
            <LogOut className="w-4 h-4" />
            Sair
          </button>
        </div>
      </motion.div>
    </>
  )
}

const TitleBar = ({ usuario, isSidebarOpen, setIsSidebarOpen }: TitleBarProps) => {
  const [horarioAtual, setHorarioAtual] = useState('')
  const [isMaximized, setIsMaximized] = useState(false)

  useEffect(() => {
    const updateClock = () => {
      setHorarioAtual(
        new Date().toLocaleTimeString('pt-BR', {
          hour: '2-digit',
          minute: '2-digit',
          second: '2-digit'
        })
      )
    }

    updateClock()

    const timer = window.setInterval(updateClock, 1000)

    return () => window.clearInterval(timer)
  }, [])

  useEffect(() => {
    let isMounted = true

    const syncWindowState = async () => {
      const response = await window.api.windowIsMaximized()
      if (isMounted) {
        setIsMaximized(Boolean(response?.isMaximized))
      }
    }

    syncWindowState()

    const onResize = () => {
      syncWindowState()
    }

    window.addEventListener('resize', onResize)

    return () => {
      isMounted = false
      window.removeEventListener('resize', onResize)
    }
  }, [])

  const handleToggleMaximize = async () => {
    const response = await window.api.windowToggleMaximize()
    setIsMaximized(Boolean(response?.isMaximized))
  }

  return (
    <header className="titlebar-drag h-11 bg-white border-b border-slate-200 shadow-sm px-2 flex items-center justify-between z-[60]">
      <div className="flex items-center gap-2 min-w-0">
        <button
          type="button"
          onClick={() => setIsSidebarOpen(!isSidebarOpen)}
          className="titlebar-no-drag md:hidden h-8 w-8 inline-flex items-center justify-center rounded hover:bg-slate-100 text-slate-600"
          aria-label="Abrir menu"
        >
          <Menu className="w-5 h-5" />
        </button>

        <img src={appLogo} alt="Battle Fish" className="w-5 h-5 rounded-sm" />
        <span className="text-sm font-semibold text-slate-800 truncate">Battle Fish System</span>
      </div>

      <div className="hidden md:flex items-center gap-4 text-xs text-slate-600">
        <span className="titlebar-no-drag">Usuario: {usuario.nome}</span>
        <span>{horarioAtual}</span>
      </div>

      <div className="titlebar-no-drag flex items-center gap-1">
        <button
          type="button"
          onClick={() => window.api.windowMinimize()}
          className="h-7 w-8 inline-flex items-center justify-center rounded hover:bg-slate-100 text-slate-700"
          aria-label="Minimizar"
          title="Minimizar"
        >
          <Minus className="w-4 h-4" />
        </button>

        <button
          type="button"
          onClick={handleToggleMaximize}
          className="h-7 w-8 inline-flex items-center justify-center rounded hover:bg-slate-100 text-slate-700"
          aria-label={isMaximized ? 'Restaurar' : 'Maximizar'}
          title={isMaximized ? 'Restaurar' : 'Maximizar'}
        >
          {isMaximized ? <Copy className="w-3.5 h-3.5" /> : <Square className="w-3.5 h-3.5" />}
        </button>

        <button
          type="button"
          onClick={() => window.api.windowClose()}
          className="h-7 w-8 inline-flex items-center justify-center rounded hover:bg-red-600 hover:text-white text-slate-700"
          aria-label="Fechar"
          title="Fechar"
        >
          <X className="w-4 h-4" />
        </button>
      </div>
    </header>
  )
}

export default function Layout({
  usuario,
  onLogout
}: {
  usuario: AuthUserCustomer
  onLogout: () => void
}) {
  const [isSidebarOpen, setIsSidebarOpen] = useState(false)
  const location = useLocation()

  return (
    <div className="h-screen bg-slate-50 flex flex-col overflow-hidden font-sans">
      <TitleBar usuario={usuario} isSidebarOpen={isSidebarOpen} setIsSidebarOpen={setIsSidebarOpen} />

      <div className="flex flex-1 overflow-hidden">
        <Sidebar isOpen={isSidebarOpen} setIsOpen={setIsSidebarOpen} usuario={usuario} onLogout={onLogout} />

        <div className="flex-1 flex flex-col overflow-hidden">
          <main className="flex-1 overflow-y-auto p-4 md:p-8">
            <AnimatePresence mode="wait">
              <motion.div
                key={location.pathname}
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -20 }}
                transition={{ duration: 0.3 }}
                className="max-w-7xl mx-auto"
              >
                <Outlet />
              </motion.div>
            </AnimatePresence>
          </main>
        </div>
      </div>
    </div>
  )
}
