import { useState, useEffect } from 'react'
import { Trophy, Scale, Ruler, Hash, EyeOff, Lock } from 'lucide-react'
import { motion, AnimatePresence } from 'framer-motion'
import { cn } from '../lib/utils'
import Loader from '../components/Loader'
import { RankingCustomer } from '~/src/shared/types/interfaces'

export default function Ranking() {
  const [loading, setLoading] = useState(true)
  const [activeTab, setActiveTab] =
    useState<'geral' | 'peso' | 'quantidade' | 'tamanho'>('geral')

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
      case 'peso':
        return [...teams].sort(
          (a, b) => b.peso_total - a.peso_total
        )

      case 'quantidade':
        return [...teams].sort(
          (a, b) => b.quantidade - a.quantidade
        )

      case 'tamanho':
        return [...teams].sort(
          (a, b) => b.tamanho - a.tamanho
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

      <div className="space-y-8">
        {/* HEADER */}
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div>
            <h1 className="text-3xl font-bold text-gray-900">
              Ranking em Tempo Real
            </h1>
            <p className="text-gray-500 mt-1">
              Acompanhe a liderança do campeonato
            </p>
          </div>

          <div className="flex items-center gap-3">
            <div className="flex items-center gap-2 bg-green-50 text-green-700 px-3 py-1 rounded-full text-sm font-medium animate-pulse">
              <div className="w-2 h-2 rounded-full bg-green-500" />
              Atualizando ao vivo
            </div>

            <button
              onClick={handleRevealClick}
              className={cn(
                'flex items-center gap-2 px-4 py-2 rounded-lg font-medium transition-all shadow-md',
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
        <div className="flex flex-wrap gap-2 bg-white p-1 rounded-xl shadow-sm border border-gray-100 w-fit">
          {[
            { id: 'geral', label: 'Geral', icon: Trophy },
            { id: 'peso', label: 'Maior Peso', icon: Scale },
            { id: 'quantidade', label: 'Quantidade', icon: Hash },
            { id: 'tamanho', label: 'Maior Peixe', icon: Ruler }
          ].map((tab) => (
            <button
              key={tab.id}
              onClick={() =>
                setActiveTab(tab.id as any)
              }
              className={cn(
                'flex items-center gap-2 px-4 py-2 rounded-lg text-sm font-medium transition-all',
                activeTab === tab.id
                  ? 'bg-blue-600 text-white shadow-md'
                  : 'text-gray-600 hover:bg-gray-50'
              )}
            >
              <tab.icon className="w-4 h-4" />
              {tab.label}
            </button>
          ))}
        </div>

        {/* PODIUM */}
        <div className="grid grid-cols-3 gap-4 items-end max-w-3xl mx-auto h-64 mb-12">
          {/* 2º */}
          <motion.div className="flex flex-col items-center">
            <div className="mb-2 text-center">
              <div className="w-16 h-16 rounded-full bg-gray-200 flex items-center justify-center text-xl font-bold mb-2 mx-auto">
                {top3[1]?.equipe_nome?.charAt(0)}
              </div>

              <p className="font-bold text-sm truncate w-24 mx-auto">
                {isRevealed
                  ? top3[1]?.equipe_nome
                  : '•••••'}
              </p>

              <p className="text-gray-500 text-xs">
                {maskValue(top3[1]?.pontos)} pts
              </p>
            </div>

            <div className="w-full h-32 bg-gray-200 rounded-t-lg flex items-end justify-center pb-4">
              <span className="text-4xl font-bold text-gray-400">
                2
              </span>
            </div>
          </motion.div>

          {/* 1º */}
          <motion.div className="flex flex-col items-center z-10">
            <div className="mb-2 text-center">
              <div className="relative">
                <Trophy className="w-8 h-8 text-yellow-400 absolute -top-6 left-1/2 -translate-x-1/2" />

                <div className="w-20 h-20 rounded-full bg-yellow-100 flex items-center justify-center text-2xl font-bold mb-2 mx-auto">
                  {top3[0]?.equipe_nome?.charAt(0)}
                </div>
              </div>

              <p className="font-bold truncate w-32 mx-auto">
                {isRevealed
                  ? top3[0]?.equipe_nome
                  : '•••••'}
              </p>

              <p className="text-blue-600 font-bold text-sm">
                {maskValue(top3[0]?.pontos)} pts
              </p>
            </div>

            <div className="w-full h-40 bg-yellow-200 rounded-t-lg flex items-end justify-center pb-4">
              <span className="text-5xl font-bold text-yellow-600">
                1
              </span>
            </div>
          </motion.div>

          {/* 3º */}
          <motion.div className="flex flex-col items-center">
            <div className="mb-2 text-center">
              <div className="w-16 h-16 rounded-full bg-gray-200 flex items-center justify-center text-xl font-bold mb-2 mx-auto">
                {top3[2]?.equipe_nome?.charAt(0)}
              </div>

              <p className="font-bold text-sm truncate w-24 mx-auto">
                {isRevealed
                  ? top3[2]?.equipe_nome
                  : '•••••'}
              </p>

              <p className="text-gray-500 text-xs">
                {maskValue(top3[2]?.pontos)} pts
              </p>
            </div>

            <div className="w-full h-24 bg-orange-200 rounded-t-lg flex items-end justify-center pb-4">
              <span className="text-4xl font-bold text-orange-500">
                3
              </span>
            </div>
          </motion.div>
        </div>

        {/* LISTA */}
        <div className="bg-white rounded-xl shadow-sm border border-gray-100 overflow-hidden">
          <div className="grid grid-cols-12 gap-4 p-4 bg-gray-50 border-b text-xs font-semibold text-gray-500 uppercase">
            <div className="col-span-1 text-center">#</div>
            <div className="col-span-5">Equipe</div>
            <div className="col-span-2 text-right hidden md:block">
              Peso Total
            </div>
            <div className="col-span-2 text-right hidden md:block">
              Qtd
            </div>
            <div className="col-span-2 text-right">
              Pontos
            </div>
          </div>

          <div className="divide-y">
            {sortedTeams.map((team, index) => (
              <motion.div
                key={team.id}
                className="grid grid-cols-12 gap-4 p-4 items-center"
              >
                <div className="col-span-1 text-center">
                  {index + 1}
                </div>

                <div className="col-span-5">
                  <p className="font-medium">
                    {isRevealed
                      ? team.equipe_nome
                      : '•••••'}
                  </p>

                  <p className="text-xs text-gray-400 md:hidden">
                    {maskValue(team.peso_total.toFixed(1))}kg •{' '}
                    {maskValue(team.quantidade)} peixes
                  </p>
                </div>

                <div className="col-span-2 text-right hidden md:block">
                  {maskValue(team.peso_total.toFixed(1))}kg
                </div>

                <div className="col-span-2 text-right hidden md:block">
                  {maskValue(team.quantidade)}
                </div>

                <div className="col-span-2 text-right font-bold text-blue-600">
                  {maskValue(team.pontos)}
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
                className="bg-white rounded-xl max-w-sm w-full p-6"
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
                    e.key === 'Enter' &&
                    handlePasswordSubmit()
                  }
                  className="w-full border rounded p-2"
                />

                {passwordError && (
                  <p className="text-red-500 text-sm mt-1">
                    {passwordError}
                  </p>
                )}

                <div className="flex gap-2 mt-4">
                  <button
                    onClick={() =>
                      setShowPasswordModal(false)
                    }
                    className="flex-1 border rounded p-2"
                  >
                    Cancelar
                  </button>

                  <button
                    onClick={handlePasswordSubmit}
                    className="flex-1 bg-yellow-500 text-white rounded p-2"
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
