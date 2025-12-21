import React from 'react'
import { NavLink, Outlet, useLocation } from 'react-router-dom'
import { Trophy, Users, UserCircle, Fish, Menu, X, Anchor } from 'lucide-react'
import { motion, AnimatePresence } from 'framer-motion'
import { cn } from '../lib/utils'

import logo from '../assets/images/logo.png'

const Sidebar = ({ isOpen, setIsOpen }: { isOpen: boolean; setIsOpen: (v: boolean) => void }) => {
  const links = [
    { to: '/', icon: Trophy, label: 'Ranking' },
    { to: '/grupos', icon: Fish, label: 'Grupos' },
    { to: '/membros', icon: Users, label: 'Integrantes' },
    { to: '/usuarios', icon: UserCircle, label: 'Usuários' }
  ]

  return (
    <>
      {/* Mobile Overlay */}
      <AnimatePresence>
        {isOpen && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 0.5 }}
            exit={{ opacity: 0 }}
            onClick={() => setIsOpen(false)}
            className="fixed inset-0 bg-black z-40 md:hidden"
          />
        )}
      </AnimatePresence>

      {/* Sidebar */}
      <motion.div
        className={cn(
          'fixed h-full md:h-auto top-0 left-0 w-64 bg-linear-to-bl from-blue-50 to-blue-100 shadow-gray-400 z-50 transform md:translate-x-0 md:static md:shadow-lg',
          isOpen ? 'translate-x-0' : '-translate-x-full'
        )}
        transition={{ type: 'spring', stiffness: 300, damping: 30 }}
      >
        <div className="h-16 flex items-center justify-center border-b border-gray-100 bg-blue-600">
          <div className="flex items-center gap-2 text-white font-bold text-xl">
            <img className="w-[50px] h-[50px] object-contain rounded-2xl" src={logo} />
            {/* <Anchor className="w-6 h-6" /> */}
            <span>BattleFish</span>
          </div>
        </div>

        <nav className="p-4 space-y-2">
          {links.map((link) => (
            <NavLink
              key={link.to}
              to={link.to}
              onClick={() => setIsOpen(false)}
              className={({ isActive }) =>
                cn(
                  'flex items-center gap-3 px-4 py-3 rounded-lg transition-all duration-200',
                  isActive
                    ? 'bg-blue-50 text-blue-600 shadow-sm font-medium translate-x-1'
                    : 'text-gray-600 hover:bg-gray-50 hover:text-gray-900'
                )
              }
            >
              <link.icon className="w-5 h-5" />
              {link.label}
            </NavLink>
          ))}
        </nav>

        <div className="absolute bottom-0 left-0 right-0 p-4 shadow-top">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-full bg-linear-to-br from-blue-500 to-blue-600 flex items-center justify-center text-white font-bold shadow-md">
              A
            </div>
            <div className="flex-1 min-w-0">
              <p className="font-semibold text-gray-900 truncate">Admin</p>
              <p className="text-xs text-gray-500 truncate">Organizador</p>
            </div>
          </div>
        </div>
      </motion.div>
    </>
  )
}

export default function Layout() {
  const [isSidebarOpen, setIsSidebarOpen] = React.useState(false)
  const location = useLocation()

  return (
    <div className="min-h-screen bg-slate-50 flex overflow-hidden font-sans">
      <Sidebar isOpen={isSidebarOpen} setIsOpen={setIsSidebarOpen} />

      <div className="flex-1 flex flex-col h-screen overflow-hidden">
        {/* Mobile Header */}
        <header className="h-16 bg-white shadow-sm flex items-center justify-between px-4 md:hidden z-30">
          <div className="flex items-center gap-2 font-bold text-blue-600">
            <Anchor className="w-6 h-6" />
            <span>BattleFishSystem</span>
          </div>
          <button
            onClick={() => setIsSidebarOpen(!isSidebarOpen)}
            className="p-2 rounded-md hover:bg-gray-100 text-gray-600"
          >
            {isSidebarOpen ? <X /> : <Menu />}
          </button>
        </header>

        {/* Main Content */}
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
  )
}
