import { useState, useEffect } from 'react'
import { Trophy, Scale, Ruler, Hash, EyeOff, Lock } from 'lucide-react'
import { motion, AnimatePresence } from 'framer-motion'
import { cn } from '../lib/utils'
import Loader from '../components/Loader'

// Mock data types
interface Team {
  id: string
  name: string
  points: number
  biggestFish: number // weight
  totalWeight: number
  totalQuantity: number
  avatar: string
}

const MOCK_TEAMS: Team[] = [
  {
    id: '1',
    name: 'Pescadores do Sul',
    points: 1250,
    biggestFish: 12.5,
    totalWeight: 45.2,
    totalQuantity: 15,
    avatar: 'bg-red-100 text-red-600'
  },
  {
    id: '2',
    name: 'Anzol de Ouro',
    points: 1100,
    biggestFish: 8.2,
    totalWeight: 38.5,
    totalQuantity: 12,
    avatar: 'bg-blue-100 text-blue-600'
  },
  {
    id: '3',
    name: 'Maré Alta',
    points: 980,
    biggestFish: 15.1,
    totalWeight: 32.0,
    totalQuantity: 8,
    avatar: 'bg-green-100 text-green-600'
  },
  {
    id: '4',
    name: 'Tubarões',
    points: 850,
    biggestFish: 6.5,
    totalWeight: 28.5,
    totalQuantity: 18,
    avatar: 'bg-yellow-100 text-yellow-600'
  },
  {
    id: '5',
    name: 'Pesca & Cia',
    points: 720,
    biggestFish: 5.0,
    totalWeight: 22.1,
    totalQuantity: 6,
    avatar: 'bg-purple-100 text-purple-600'
  }
]

export default function Ranking() {
  const [loading, setLoading] = useState(false);
  const [activeTab, setActiveTab] = useState<'geral' | 'peso' | 'quantidade' | 'tamanho'>('geral')
  const [teams, setTeams] = useState(MOCK_TEAMS)
  const [isRevealed, setIsRevealed] = useState(false)
  const [showPasswordModal, setShowPasswordModal] = useState(false)
  const [password, setPassword] = useState('')
  const [passwordError, setPasswordError] = useState('')

  const CORRECT_PASSWORD = '1234' // Change this to your desired password

  const handleRevealClick = () => {
    if (!isRevealed) {
      setShowPasswordModal(true)
    } else {
      setIsRevealed(false)
    }
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

  const maskValue = (value: string | number) => {
    return isRevealed ? value : '•••••'
  }

  // Simulate real-time updates
  useEffect(() => {

    try {
      setLoading(true)
      const interval = setInterval(() => {
        setTeams((prev) =>
          prev
            .map((team) => ({
              ...team,
              points: team.points + Math.floor(Math.random() * 10),
              totalWeight: +(team.totalWeight + Math.random()).toFixed(1)
            }))
            .sort((a, b) => b.points - a.points)
        )
      }, 3000)
      return () => clearInterval(interval)

    } catch (error) {
      console.log("Erro ao carregar Ranking", error)

    } finally {
      setLoading(false)
    }


  }, [])

  const getSortedTeams = () => {
    switch (activeTab) {
      case 'peso':
        return [...teams].sort((a, b) => b.totalWeight - a.totalWeight)
      case 'quantidade':
        return [...teams].sort((a, b) => b.totalQuantity - a.totalQuantity)
      case 'tamanho':
        return [...teams].sort((a, b) => b.biggestFish - a.biggestFish)
      default:
        return [...teams].sort((a, b) => b.points - a.points)
    }
  }

  const sortedTeams = getSortedTeams()
  const top3 = sortedTeams.slice(0, 3)

  return (
    <>
      <Loader show={loading} />
      <div className="space-y-8">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div>
            <h1 className="text-3xl font-bold text-gray-900">Ranking em Tempo Real</h1>
            <p className="text-gray-500 mt-1">Acompanhe a liderança do campeonato</p>
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

        {/* Categories Tabs */}
        <div className="flex flex-wrap gap-2 bg-white p-1 rounded-xl shadow-sm border border-gray-100 w-fit">
          {[
            { id: 'geral', label: 'Geral', icon: Trophy },
            { id: 'peso', label: 'Maior Peso', icon: Scale },
            { id: 'quantidade', label: 'Quantidade', icon: Hash },
            { id: 'tamanho', label: 'Maior Peixe', icon: Ruler }
          ].map((tab) => (
            <button
              key={tab.id}
              onClick={() => setActiveTab(tab.id as any)}
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

        {/* Podium */}
        <div className="grid grid-cols-3 gap-4 items-end max-w-3xl mx-auto h-64 mb-12">
          {/* 2nd Place */}
          <motion.div
            initial={{ height: 0, opacity: 0 }}
            animate={{ height: 'auto', opacity: 1 }}
            className="flex flex-col items-center"
          >
            <div className="mb-2 text-center">
              <div
                className={cn(
                  'w-16 h-16 rounded-full flex items-center justify-center text-xl font-bold mb-2 shadow-lg mx-auto',
                  top3[1]?.avatar
                )}
              >
                {top3[1]?.name.charAt(0)}
              </div>
              <p className="font-bold text-sm md:text-base truncate w-24 md:w-32 text-center">
                {isRevealed ? top3[1]?.name : '•••••'}
              </p>
              <p className="text-gray-500 text-xs">{maskValue(top3[1]?.points)} pts</p>
            </div>
            <div className="w-full h-32 bg-linear-to-t from-gray-300 to-gray-100 rounded-t-lg shadow-inner flex items-end justify-center pb-4 relative">
              <span className="text-4xl font-bold text-gray-400">2</span>
            </div>
          </motion.div>

          {/* 1st Place */}
          <motion.div
            initial={{ height: 0, opacity: 0 }}
            animate={{ height: 'auto', opacity: 1 }}
            transition={{ delay: 0.2 }}
            className="flex flex-col items-center z-10 -mx-2"
          >
            <div className="mb-2 text-center">
              <div className="relative">
                <Trophy className="w-8 h-8 text-yellow-400 absolute -top-6 left-1/2 -translate-x-1/2 drop-shadow-sm" />
                <div
                  className={cn(
                    'w-20 h-20 rounded-full flex items-center justify-center text-2xl font-bold mb-2 shadow-xl mx-auto ring-4 ring-yellow-100',
                    top3[0]?.avatar
                  )}
                >
                  {top3[0]?.name.charAt(0)}
                </div>
              </div>
              <p className="font-bold text-base md:text-lg truncate w-28 md:w-40 text-center">
                {isRevealed ? top3[0]?.name : '•••••'}
              </p>
              <p className="text-blue-600 font-bold text-sm">{maskValue(top3[0]?.points)} pts</p>
            </div>
            <div className="w-full h-40 bg-linear-to-t from-yellow-300 to-yellow-100 rounded-t-lg shadow-lg flex items-end justify-center pb-4">
              <span className="text-5xl font-bold text-yellow-600">1</span>
            </div>
          </motion.div>

          {/* 3rd Place */}
          <motion.div
            initial={{ height: 0, opacity: 0 }}
            animate={{ height: 'auto', opacity: 1 }}
            transition={{ delay: 0.1 }}
            className="flex flex-col items-center"
          >
            <div className="mb-2 text-center">
              <div
                className={cn(
                  'w-16 h-16 rounded-full flex items-center justify-center text-xl font-bold mb-2 shadow-lg mx-auto',
                  top3[2]?.avatar
                )}
              >
                {top3[2]?.name.charAt(0)}
              </div>
              <p className="font-bold text-sm md:text-base truncate w-24 md:w-32 text-center">
                {isRevealed ? top3[2]?.name : '•••••'}
              </p>
              <p className="text-gray-500 text-xs">{maskValue(top3[2]?.points)} pts</p>
            </div>
            <div className="w-full h-24 bg-linear-to-t from-orange-300 to-orange-100 rounded-t-lg shadow-inner flex items-end justify-center pb-4">
              <span className="text-4xl font-bold text-orange-500">3</span>
            </div>
          </motion.div>
        </div>

        {/* List View */}
        <div className="bg-white rounded-xl shadow-sm border border-gray-100 overflow-hidden">
          <div className="grid grid-cols-12 gap-4 p-4 bg-gray-50 border-b border-gray-100 text-xs font-semibold text-gray-500 uppercase tracking-wider">
            <div className="col-span-1 text-center">#</div>
            <div className="col-span-5">Equipe</div>
            <div className="col-span-2 text-right hidden md:block">Peso Total</div>
            <div className="col-span-2 text-right hidden md:block">Qtd</div>
            <div className="col-span-2 text-right">Pontos</div>
          </div>
          <div className="divide-y divide-gray-50">
            {sortedTeams.map((team, index) => (
              <motion.div
                layout
                key={team.id}
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                className={cn(
                  'grid grid-cols-12 gap-4 p-4 items-center hover:bg-blue-50/50 transition-colors',
                  index < 3 ? 'bg-linear-to-r from-transparent via-transparent to-yellow-50/30' : ''
                )}
              >
                <div className="col-span-1 flex justify-center">
                  <span
                    className={cn(
                      'w-6 h-6 rounded flex items-center justify-center text-sm font-bold',
                      index === 0
                        ? 'bg-yellow-100 text-yellow-700'
                        : index === 1
                          ? 'bg-gray-200 text-gray-700'
                          : index === 2
                            ? 'bg-orange-100 text-orange-700'
                            : 'text-gray-400'
                    )}
                  >
                    {index + 1}
                  </span>
                </div>
                <div className="col-span-5 flex items-center gap-3">
                  <div
                    className={cn(
                      'w-8 h-8 rounded-full flex items-center justify-center text-xs font-bold',
                      team.avatar
                    )}
                  >
                    {team.name.charAt(0)}
                  </div>
                  <div>
                    <p className="font-medium text-gray-900">{isRevealed ? team.name : '•••••'}</p>
                    <p className="text-xs text-gray-400 md:hidden">
                      {maskValue(team.totalWeight.toFixed(1))}kg • {maskValue(team.totalQuantity)}{' '}
                      peixes
                    </p>
                  </div>
                </div>
                <div className="col-span-2 text-right text-gray-600 hidden md:block font-mono">
                  {maskValue(team.totalWeight.toFixed(1))}kg
                </div>
                <div className="col-span-2 text-right text-gray-600 hidden md:block font-mono">
                  {maskValue(team.totalQuantity)}
                </div>
                <div className="col-span-2 text-right font-bold text-blue-600 font-mono">
                  {maskValue(team.points)}
                </div>
              </motion.div>
            ))}
          </div>
        </div>

        {/* Password Modal */}
        <AnimatePresence>
          {showPasswordModal && (
            <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
              <motion.div
                initial={{ scale: 0.9, opacity: 0 }}
                animate={{ scale: 1, opacity: 1 }}
                exit={{ scale: 0.9, opacity: 0 }}
                className="bg-white rounded-xl shadow-2xl max-w-sm w-full p-6"
              >
                <div className="flex items-center gap-3 mb-4">
                  <div className="w-12 h-12 bg-yellow-100 rounded-full flex items-center justify-center">
                    <Lock className="w-6 h-6 text-yellow-600" />
                  </div>
                  <div>
                    <h2 className="text-xl font-bold text-gray-900">Área Protegida</h2>
                    <p className="text-sm text-gray-500">Digite a senha para revelar</p>
                  </div>
                </div>

                <div className="space-y-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">Senha</label>
                    <input
                      type="password"
                      value={password}
                      onChange={(e) => {
                        setPassword(e.target.value)
                        setPasswordError('')
                      }}
                      onKeyPress={(e) => e.key === 'Enter' && handlePasswordSubmit()}
                      className={cn(
                        'w-full border rounded-lg p-3 focus:ring-2 focus:outline-none',
                        passwordError
                          ? 'border-red-300 focus:ring-red-200'
                          : 'border-gray-300 focus:ring-yellow-200'
                      )}
                      placeholder="••••••"
                      autoFocus
                    />
                    {passwordError && (
                      <p className="text-red-600 text-sm mt-1 flex items-center gap-1">
                        <span>⚠</span> {passwordError}
                      </p>
                    )}
                  </div>

                  <div className="flex gap-3 mt-6">
                    <button
                      onClick={() => {
                        setShowPasswordModal(false)
                        setPassword('')
                        setPasswordError('')
                      }}
                      className="flex-1 px-4 py-2 border border-gray-300 rounded-lg text-gray-700 hover:bg-gray-50 transition-colors"
                    >
                      Cancelar
                    </button>
                    <button
                      onClick={handlePasswordSubmit}
                      className="flex-1 px-4 py-2 bg-yellow-500 text-white rounded-lg hover:bg-yellow-600 transition-colors shadow-md font-medium"
                    >
                      Revelar
                    </button>
                  </div>
                </div>
              </motion.div>
            </div>
          )}
        </AnimatePresence>
      </div>
    </>

  )
}
