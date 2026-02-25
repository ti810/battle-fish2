import { useState, useEffect } from 'react'
import { Trophy, Scale, Ruler, Hash, EyeOff, Lock } from 'lucide-react'
import { motion, AnimatePresence } from 'framer-motion'
import { cn } from '../lib/utils'
import Loader from '../components/Loader'
import { RankingCustomer } from '~/src/shared/types/interfaces'
import { formataPeso } from '../lib/utils'
import { maximum } from 'zod/v4-mini'

export default function Ranking() {
  const [loading, setLoading] = useState(true)
  const [activeTab, setActiveTab] =
    useState<'geral' | 'quantidade'>('geral')

  const [teams, setTeams] = useState<RankingCustomer[]>([])
  const [isRevealed, setIsRevealed] = useState(false)
  const [showPasswordModal, setShowPasswordModal] = useState(false)
  const [password, setPassword] = useState('')
  const [passwordError, setPasswordError] = useState('')

  const CORRECT_PASSWORD = '1234'

  const handleRevealClick = () => {
    if (!isRevealed) setShowPasswordModal(true)
    else setIsRevealed(false)
  }

  const handlePasswordSubmit = () => {
    if (password === CORRECT_PASSWORD) {
      setIsRevealed(true)
      setShowPasswordModal(false)
      setPassword('')
      setPasswordError('')
    } else {
      setPasswordError('Senha incorreta!')
    }
  }

  const maskValue = (value: string | number | undefined) => {
    return isRevealed ? value : '•••••'
  }

  useEffect(() => {
    let interval: ReturnType<typeof setInterval>

    async function loadRanking() {
      try {
        setLoading(true)
        const data = await window.api.listarRanking()   
        setTeams(data)
      } catch (err) {
        console.error('Erro ao carregar ranking', err)
      } finally {
        setLoading(false)
      }
    }

    loadRanking()

    interval = setInterval(loadRanking, 3000)

    return () => clearInterval(interval)
  }, [])

  // ✅ SORT CORRETO
  const getSortedTeams = () => {
    switch (activeTab) {
      case 'quantidade':
        return [...teams].sort(
          (a, b) => b.quantidade - a.quantidade
        )

      default:
        return [...teams].sort(
          (a, b) => b.pontos - a.pontos
        )
    }
  }

  const sortedTeams = getSortedTeams()
  const top3 = sortedTeams.slice(0, 3)

  return (
  <>
    <Loader show={loading} />

    <div className="space-y-10 max-w-7xl mx-auto">
      {/* HEADER */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h1 className="text-3xl md:text-4xl font-black tracking-tight bg-gradient-to-r from-blue-600 to-indigo-500 bg-clip-text text-transparent">
            Ranking em Tempo Real
          </h1>
          <p className="text-gray-500 mt-1">
            Acompanhe a liderança do campeonato
          </p>
        </div>

        <div className="flex items-center gap-3">
          <div className="flex items-center gap-2 bg-green-500/10 text-green-700 px-3 py-1 rounded-full text-sm font-semibold backdrop-blur border border-green-200 animate-pulse">
            <div className="w-2 h-2 rounded-full bg-green-500" />
            Atualizando ao vivo
          </div>

          <button
            onClick={handleRevealClick}
            className={cn(
              'flex items-center gap-2 px-4 py-2 rounded-xl font-semibold transition-all shadow-md active:scale-95',
              isRevealed
                ? 'bg-red-600 hover:bg-red-700 text-white'
                : 'bg-yellow-500 hover:bg-yellow-600 text-white'
            )}
          >
            {isRevealed ? (
              <>
                <EyeOff className="w-4 h-4" />
                Ocultar Resultados
              </>
            ) : (
              <>
                <Lock className="w-4 h-4" />
                Revelar Resultados
              </>
            )}
          </button>
        </div>
      </div>

      {/* TABS */}
      <div className="flex flex-wrap gap-2 bg-white p-1 rounded-2xl shadow-sm border border-gray-100 w-fit">
        {[
          { id: 'geral', label: 'Geral', icon: Trophy },
          { id: 'quantidade', label: 'Maior Quantidade', icon: Hash }
        ].map((tab) => (
          <button
            key={tab.id}
            onClick={() => setActiveTab(tab.id as any)}
            className={cn(
              'flex items-center gap-2 px-4 py-2 rounded-xl text-sm font-semibold transition-all duration-200 active:scale-95',
              activeTab === tab.id
                ? 'bg-gradient-to-r from-blue-600 to-indigo-600 text-white shadow-lg shadow-blue-500/30'
                : 'text-gray-600 hover:bg-gray-50'
            )}
          >
            <tab.icon className="w-4 h-4" />
            {tab.label}
          </button>
        ))}
      </div>

      {/* PODIUM */}
      <div className="grid grid-cols-3 gap-6 items-end max-w-4xl mx-auto h-72 mb-14">
        {/* 2º */}
        <motion.div className="flex flex-col items-center">
          <div className="mb-2 text-center">
            <div className="w-16 h-16 rounded-full bg-gray-200 flex items-center justify-center text-xl font-bold mb-2 mx-auto">
              {isRevealed ? top3[1]?.equipe_nome?.charAt(0) : '•••••'}
            </div>

            <p className="font-bold text-sm truncate w-24 mx-auto">
              {isRevealed ? top3[1]?.equipe_nome : '•••••'}
            </p>

            <p className="text-gray-500 text-xs">
              {maskValue(
                top3[1]?.pontos.toLocaleString('pt-BR', {
                  minimumFractionDigits: 2,
                  maximumFractionDigits: 2
                })
              )}{' '}
              pts
            </p>
          </div>

          <div className="w-full h-32 rounded-2xl bg-gradient-to-t from-slate-300 to-slate-100 shadow-lg flex items-end justify-center pb-4">
            <span className="text-4xl font-bold text-gray-400">2</span>
          </div>
        </motion.div>

        {/* 1º */}
        <motion.div className="flex flex-col items-center z-10">
          <div className="mb-2 text-center">
            <div className="relative">
              <Trophy className="w-8 h-8 text-yellow-400 absolute -top-6 left-1/2 -translate-x-1/2" />

              <div className="w-20 h-20 rounded-full bg-gradient-to-br from-yellow-200 to-yellow-100 ring-4 ring-yellow-400/40 flex items-center justify-center text-2xl font-black mb-2 mx-auto shadow-lg">
                {isRevealed ? top3[0]?.equipe_nome?.charAt(0) : '•••••'}
              </div>
            </div>

            <p className="font-bold truncate w-32 mx-auto">
              {isRevealed ? top3[0]?.equipe_nome : '•••••'}
            </p>

            <p className="text-blue-600 font-bold text-[12px]">
              {maskValue(
                top3[0]?.pontos.toLocaleString('pt-BR', {
                  minimumFractionDigits: 2,
                  maximumFractionDigits: 2
                })
              )}{' '}
              pts
            </p>
          </div>

          <div className="w-full h-40 rounded-2xl bg-gradient-to-t from-yellow-400 to-yellow-200 shadow-xl shadow-yellow-400/40 flex items-end justify-center pb-4">
            <span className="text-5xl font-bold text-yellow-700">1</span>
          </div>
        </motion.div>

        {/* 3º */}
        <motion.div className="flex flex-col items-center">
          <div className="mb-2 text-center">
            <div className="w-16 h-16 rounded-full bg-gray-200 flex items-center justify-center text-xl font-bold mb-2 mx-auto">
              {top3[2]?.equipe_nome?.charAt(0)}
            </div>

            <p className="font-bold text-sm truncate w-24 mx-auto">
              {isRevealed ? top3[2]?.equipe_nome : '•••••'}
            </p>
          </div>

          <div className="w-full h-24 rounded-2xl bg-gradient-to-t from-orange-300 to-orange-100 shadow-lg flex items-end justify-center pb-4">
            <span className="text-4xl font-bold text-orange-600">3</span>
          </div>
        </motion.div>
      </div>

      {/* LISTA */}
      <div className="bg-white/80 backdrop-blur rounded-2xl shadow-xl border border-gray-100 overflow-hidden">
        <div className="grid grid-cols-12 gap-4 p-4 bg-gray-50 border-b text-xs font-semibold text-gray-500 uppercase">
          <div className="col-span-1 text-center">#</div>
          <div className="col-span-5">Equipe</div>
          <div className="col-span-2 text-right hidden md:block">
            Peso Total
          </div>
          <div className="col-span-2 text-right hidden md:block">
            Qtd de peixes
          </div>
          <div className="col-span-2 text-right">
            Pontos
          </div>
        </div>

        <div className="divide-y">
          {sortedTeams.map((team, index) => (
            <motion.div
              layout
              key={index}
              className={cn(
                'grid grid-cols-12 gap-4 p-4 items-center transition-all hover:bg-blue-50/60 hover:scale-[1.01]',
                index === 0 && 'bg-yellow-50',
                index === 1 && 'bg-slate-50',
                index === 2 && 'bg-orange-50'
              )}
            >
              <div className="col-span-1 flex justify-center">
                <span className="w-8 h-8 rounded-full bg-gray-100 flex items-center justify-center font-bold text-sm">
                  {index + 1}
                </span>
              </div>

              <div className="col-span-5">
                <p
                  className={cn(
                    'font-medium',
                    index === 0 && 'text-yellow-700',
                    index === 1 && 'text-slate-600',
                    index === 2 && 'text-orange-700'
                  )}
                >
                  {isRevealed ? team.equipe_nome : '•••••'}
                </p>
              </div>

              <div className="col-span-2 text-right hidden md:block">
                {maskValue(formataPeso(team.peso_total))}
              </div>

              <div className="col-span-2 text-right hidden md:block">
                {maskValue(team.quantidade)}
              </div>

              {/* BADGE DE PONTOS COM MEDALHA + ANIMAÇÃO */}
              <div className="col-span-2 flex justify-end">
                <motion.span
                  animate={
                    index === 0
                      ? {
                          scale: [1, 1.08, 1],
                          boxShadow: [
                            '0 0 0px rgba(250,204,21,0)',
                            '0 0 18px rgba(250,204,21,0.8)',
                            '0 0 0px rgba(250,204,21,0)'
                          ]
                        }
                      : undefined
                  }
                  transition={
                    index === 0
                      ? { duration: 1.6, repeat: Infinity, ease: 'easeInOut' }
                      : undefined
                  }
                  className={cn(
                    'font-bold px-3 py-1 rounded-lg inline-flex items-center gap-1',

                    index === 0 &&
                      'text-yellow-800 bg-yellow-100 ring-1 ring-yellow-300',

                    index === 1 &&
                      'text-slate-700 bg-slate-100 ring-1 ring-slate-300',

                    index === 2 &&
                      'text-orange-700 bg-orange-100 ring-1 ring-orange-300',

                    index > 2 && 'text-blue-600'
                  )}
                >
                  {index === 0 && <span>🥇</span>}
                  {index === 1 && <span>🥈</span>}
                  {index === 2 && <span>🥉</span>}

                  {maskValue(
                    team.pontos.toLocaleString('pt-BR', {
                      minimumFractionDigits: 2,
                      maximumFractionDigits: 2
                    })
                  )}
                </motion.span>
              </div>
            </motion.div>
          ))}
        </div>
      </div>

      {/* MODAL SENHA */}
      <AnimatePresence>
        {showPasswordModal && (
          <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
            <motion.div
              initial={{ scale: 0.9, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0.9, opacity: 0 }}
              className="bg-white/90 backdrop-blur rounded-2xl max-w-sm w-full p-6 shadow-2xl"
            >
              <h2 className="text-xl font-bold mb-2">
                Área Protegida
              </h2>

              <input
                type="password"
                value={password}
                onChange={(e) => {
                  setPassword(e.target.value)
                  setPasswordError('')
                }}
                onKeyDown={(e) =>
                  e.key === 'Enter' && handlePasswordSubmit()
                }
                className="w-full border rounded-lg p-2 focus:outline-none focus:ring-2 focus:ring-yellow-400"
              />

              {passwordError && (
                <p className="text-red-500 text-sm mt-1">
                  {passwordError}
                </p>
              )}

              <div className="flex gap-2 mt-4">
                <button
                  onClick={() => setShowPasswordModal(false)}
                  className="flex-1 border rounded-lg p-2 hover:bg-gray-50"
                >
                  Cancelar
                </button>

                <button
                  onClick={handlePasswordSubmit}
                  className="flex-1 bg-yellow-500 hover:bg-yellow-600 text-white rounded-lg p-2 font-semibold"
                >
                  Revelar
                </button>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>
    </div>
  </>
)
}
