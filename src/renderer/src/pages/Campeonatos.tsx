import { useEffect, useRef, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { Plus, AlignEndVertical, MoreVertical, Edit2, PowerCircle } from 'lucide-react'
import { motion } from 'framer-motion'
import { agoraParaSQLite } from '../lib/utils'
import { CampeonatoCustomer, NewCampeonatoCustomer } from '~/src/shared/types/interfaces'
import { toast } from 'sonner'
import Loader from '../components/Loader'

type CampeonatoFormState = {
  nome: string
  data_inicial: string
}

const initialFormState: CampeonatoFormState = {
  nome: '',
  data_inicial: ''
}

function toDateTimeLocal(value: string): string {
  if (!value) return ''

  if (value.includes('T')) {
    return value.slice(0, 16)
  }

  const parsed = new Date(value)

  if (Number.isNaN(parsed.getTime())) {
    return ''
  }

  const pad = (n: number) => String(n).padStart(2, '0')

  return `${parsed.getFullYear()}-${pad(parsed.getMonth() + 1)}-${pad(parsed.getDate())}T${pad(parsed.getHours())}:${pad(parsed.getMinutes())}`
}

function formatDateTime(value: string): string {
  if (!value) return '-'

  const parsed = new Date(value)

  if (Number.isNaN(parsed.getTime())) {
    return value
  }

  return parsed.toLocaleString('pt-BR')
}

export default function Campeonatos() {
  const navigate = useNavigate()

  const [openId, setOpenId] = useState<number | null>(null)
  const dropdownRef = useRef<HTMLDivElement | null>(null)

  const [showAddCampeonatoModal, setShowAddCampeonatoModal] = useState(false)
  const [showEditCampeonatoModal, setShowEditCampeonatoModal] = useState(false)

  const [loading, setLoading] = useState(false)

  const [campeonatos, setCampeonatos] = useState<CampeonatoCustomer[]>([])
  const [equipesCountByCampeonato, setEquipesCountByCampeonato] = useState<Record<number, number>>({})

  const [editingCampeonato, setEditingCampeonato] = useState<CampeonatoCustomer | null>(null)

  const [campeonatoForm, setCampeonatoForm] = useState<CampeonatoFormState>(initialFormState)

  const toggleMenu = (id: number) => {
    setOpenId(openId === id ? null : id)
  }

  const clearForm = () => {
    setCampeonatoForm(initialFormState)
  }

  const validateCampeonatoForm = () => {
    const nome = campeonatoForm.nome.trim()
    const dataInicial = campeonatoForm.data_inicial

    if (!nome) {
      return { valid: false, message: 'Nome do campeonato e obrigatorio.' }
    }

    if (nome.length < 4) {
      return { valid: false, message: 'Nome do campeonato muito curto (minimo 4 caracteres).' }
    }

    if (!dataInicial) {
      return { valid: false, message: 'Data inicial e obrigatoria.' }
    }

    const startDate = new Date(dataInicial)

    if (Number.isNaN(startDate.getTime())) {
      return { valid: false, message: 'Data inicial invalida.' }
    }

    return { valid: true }
  }

  const carregarDados = async () => {
    const res = await window.api.listarCampeonatos()

    if (!res.success) {
      setCampeonatos([])
      setEquipesCountByCampeonato({})
      return
    }

    const campeonatosData = res.data as CampeonatoCustomer[]
    setCampeonatos(campeonatosData)

    const equipesResponses = await Promise.all(
      campeonatosData.map(async (campeonato) => {
        const data = await window.api.listarEquipesByCampeonatoId(campeonato.id)
        return {
          campeonatoId: campeonato.id,
          total: Number(data?.data?.totalEquipes ?? 0)
        }
      })
    )

    const nextCountMap = equipesResponses.reduce<Record<number, number>>((acc, item) => {
      acc[item.campeonatoId] = item.total
      return acc
    }, {})

    setEquipesCountByCampeonato(nextCountMap)
  }

  const handleOpenAddModal = () => {
    setEditingCampeonato(null)
    clearForm()
    setShowAddCampeonatoModal(true)
  }

  const handleOpenEditModal = (campeonato: CampeonatoCustomer) => {
    setEditingCampeonato(campeonato)
    setCampeonatoForm({
      nome: campeonato.nome,
      data_inicial: toDateTimeLocal(campeonato.data_inicial)
    })
    setShowEditCampeonatoModal(true)
    setOpenId(null)
  }

  const handleAddCampeonato = async () => {
    try {
      const validation = validateCampeonatoForm()

      if (!validation.valid) {
        toast.error(validation.message)
        return
      }

      const campeonatosExistentes = await window.api.listarCampeonatos()
      const hasCampeonatoAnterior =
        Boolean(campeonatosExistentes?.success) &&
        Array.isArray(campeonatosExistentes?.data) &&
        campeonatosExistentes.data.length > 0

      if (hasCampeonatoAnterior) {
        const confirmacao1 = await window.api.showMessageBox({
          type: 'question',
          buttons: ['Sim', 'Nao'],
          defaultId: 1,
          cancelId: 1,
          title: 'Confirmacao',
          message: 'Deseja realmente apagar o campeonato atual para criar um novo?'
        })

        if (confirmacao1.response !== 0) {
          return
        }

        const confirmacao2 = await window.api.showMessageBox({
          type: 'warning',
          buttons: ['Sim', 'Nao'],
          defaultId: 1,
          cancelId: 1,
          title: 'Atencao',
          message:
            'Todos os dados do campeonato anterior (equipes, atletas e capturas) serao apagados. Deseja continuar?'
        })

        if (confirmacao2.response !== 0) {
          return
        }
      }

      const payload: NewCampeonatoCustomer = {
        nome: campeonatoForm.nome.trim(),
        data_inicial: campeonatoForm.data_inicial,
        data_final: '',
        criado_em: agoraParaSQLite()
      }

      const novo = await window.api.addNovoCampeonato(payload)

      if (!novo?.success) {
        toast.error(novo?.message || 'Nao foi possivel criar o campeonato.')
        return
      }

      toast.success(`Campeonato ${novo.data.nome} criado com sucesso.`)
      setShowAddCampeonatoModal(false)
      clearForm()
      await carregarDados()
    } catch (error) {
      console.error('Erro ao salvar dados do Campeonato', error)
      toast.error(`Erro ao salvar dados do Campeonato ${error}`)
    }
  }

  const handleEditCampeonato = async () => {
    try {
      if (!editingCampeonato?.id) {
        toast.error('Campeonato nao selecionado para edicao.')
        return
      }

      const validation = validateCampeonatoForm()

      if (!validation.valid) {
        toast.error(validation.message)
        return
      }

      const payload: CampeonatoCustomer = {
        id: editingCampeonato.id,
        nome: campeonatoForm.nome.trim(),
        data_inicial: campeonatoForm.data_inicial,
        data_final: editingCampeonato.data_final,
        ativo: editingCampeonato.ativo ?? 0,
        criado_em: editingCampeonato.criado_em
      }

      const result = await window.api.editCampeonatoById(payload)

      if (!result?.success) {
        toast.error(result?.message || 'Nao foi possivel alterar o campeonato.')
        return
      }

      toast.success('Campeonato alterado com sucesso.')
      setShowEditCampeonatoModal(false)
      setEditingCampeonato(null)
      clearForm()
      await carregarDados()
    } catch (error) {
      console.error('Erro ao alterar dados do Campeonato', error)
      toast.error(`Erro ao alterar dados do Campeonato ${error}`)
    }
  }

  const handleEncerrarCampeonato = async (campeonato: CampeonatoCustomer) => {
    const resposta = await window.api.showMessageBox({
      type: 'question',
      buttons: ['Sim', 'Nao'],
      defaultId: 1,
      cancelId: 1,
      title: 'Encerrar campeonato',
      message: `Deseja encerrar o campeonato ${campeonato.nome}?`
    })

    if (resposta.response !== 0) {
      return
    }

    const result = await window.api.encerrarCampeonato(campeonato.id)

    if (!result?.success) {
      toast.error(result?.message || 'Nao foi possivel encerrar o campeonato.')
      return
    }

    toast.success(`Campeonato ${campeonato.nome} encerrado com sucesso.`)
    setOpenId(null)
    await carregarDados()
  }

  useEffect(() => {
    carregarDados()
  }, [])

  useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) {
        setOpenId(null)
      }
    }

    document.addEventListener('mousedown', handleClickOutside)
    return () => document.removeEventListener('mousedown', handleClickOutside)
  }, [])

  return (
    <>
      <Loader show={loading} />

      <div className="space-y-6">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div>
            <h1 className="text-2xl font-bold text-gray-900">Campeonatos</h1>
            <p className="text-gray-500">Gerencie campeonatos ativos e inativos</p>
          </div>

          <div className="flex ml-auto gap-2">
            <button
              onClick={handleOpenAddModal}
              className="flex items-center justify-center gap-2 bg-blue-600 hover:bg-blue-700 text-white px-4 py-2 rounded-lg transition-colors shadow-lg shadow-blue-200"
            >
              <AlignEndVertical className="w-4 h-4" />
              Novo Campeonato
            </button>
          </div>
        </div>

        <div className="grid grid-cols-1 gap-4">
          {campeonatos.map((camp, idx) => {
            const isAtivo = Number(camp.ativo) === 1
            const totalEquipes = equipesCountByCampeonato[camp.id] ?? 0

            return (
              <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: idx * 0.08 }}
                key={camp.id}
                className="bg-white p-5 rounded-xl shadow-sm border border-gray-100 hover:shadow-md transition-shadow group"
              >
                <div className="flex gap-3 justify-between items-start mb-4">
                  <div className="flex items-center gap-3">
                    <div className="w-10 h-10 rounded-lg bg-blue-100 flex items-center justify-center text-blue-600 font-bold text-lg">
                      {camp.nome.charAt(0)}
                    </div>
                    <div>
                      <h3 className="font-semibold text-gray-900">{camp.nome}</h3>
                      <p className="text-xs text-gray-500">Inicio: {formatDateTime(camp.data_inicial)}</p>
                      {!isAtivo && (
                        <p className="text-xs text-gray-500">Encerrado em: {formatDateTime(camp.data_final)}</p>
                      )}
                      <span
                        className={`text-xs px-2 py-0.5 rounded-full ${
                          isAtivo ? 'bg-green-100 text-green-700' : 'bg-yellow-100 text-yellow-700'
                        }`}
                      >
                        {isAtivo ? 'ATIVO' : 'INATIVO'}
                      </span>
                    </div>
                  </div>

                  <div className="bg-white relative" ref={openId === camp.id ? dropdownRef : null}>
                    <div className="right-0 absolute flex flex-col items-end">
                      <button
                        onClick={() => toggleMenu(camp.id)}
                        type="button"
                        className="text-gray-400 hover:text-gray-600"
                      >
                        <MoreVertical className="w-5 h-5" />
                      </button>

                      {camp.id === openId && (
                        <div className="dropdown-menu active float-right text-gray-500 bg-white drop-shadow-lg drop-shadow-gray-700 rounded-[5px] text-left">
                          <button
                            type="button"
                            onClick={() => handleOpenEditModal(camp)}
                            className="w-full px-4 py-2 rounded-tl-[5px] rounded-tr-[5px] hover:bg-gray-300 flex flex-row text-blue-600"
                          >
                            <Edit2 className="w-5 h-5" />
                            &nbsp;&nbsp;Alterar
                          </button>

                          <button
                            type="button"
                            onClick={() => handleEncerrarCampeonato(camp)}
                            disabled={!isAtivo}
                            className="w-full px-4 py-2 rounded-bl-[5px] rounded-br-[5px] hover:bg-gray-300 disabled:opacity-40 disabled:cursor-not-allowed flex flex-row text-red-600"
                          >
                            <PowerCircle className="w-5 h-5" />
                            &nbsp;&nbsp;Encerrar
                          </button>
                        </div>
                      )}
                    </div>
                  </div>
                </div>

                <div className="flex items-center justify-between text-xs text-gray-500 pt-3 border-t border-gray-50">
                  <div className="text-gray-600 flex items-center gap-1">
                    <span className="flex font-semibold from-green-600 to-gray-600 bg-linear-to-l w-7 h-7 rounded-full justify-center items-center text-white text-lg">
                      {totalEquipes}
                    </span>{' '}
                    Equipe{totalEquipes > 1 && 's'} participando no momento
                  </div>

                  <button
                    onClick={() => {
                      if (!isAtivo) {
                        toast.error('Campeonato inativo. Nao e possivel adicionar novas equipes.')
                        return
                      }
                      navigate('/equipes?', { state: { openModal: true } })
                    }}
                    className={`flex items-center gap-1 ${
                      isAtivo ? 'text-blue-600' : 'text-gray-400 cursor-not-allowed'
                    }`}
                    type="button"
                  >
                    <Plus className="w-3 h-3" />
                    Adicionar Equipe
                  </button>
                </div>
              </motion.div>
            )
          })}
        </div>

        {showAddCampeonatoModal && (
          <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
            <motion.div
              initial={{ scale: 0.9, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              className="bg-white rounded-xl shadow-2xl max-w-md w-full p-6"
            >
              <h2 className="text-xl font-bold mb-4 flex items-center gap-2">
                <AlignEndVertical className="w-6 h-6 text-blue-600" />
                Criar Novo Campeonato
              </h2>

              <div className="space-y-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Nome do Campeonato <span className="text-red-600">*</span>
                  </label>
                  <input
                    type="text"
                    value={campeonatoForm.nome}
                    onChange={(e) => setCampeonatoForm((prev) => ({ ...prev, nome: e.target.value }))}
                    className="w-full border border-gray-300 rounded-lg p-2 focus:ring-2 focus:ring-blue-200 focus:outline-none"
                    placeholder="Ex: Campeonato Sul Baiano 2026"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Data de Inicio <span className="text-red-600">*</span>
                  </label>
                  <input
                    type="datetime-local"
                    value={campeonatoForm.data_inicial}
                    onChange={(e) =>
                      setCampeonatoForm((prev) => ({ ...prev, data_inicial: e.target.value }))
                    }
                    className="w-full border border-gray-300 rounded-lg p-2 focus:ring-2 focus:ring-blue-200 focus:outline-none"
                  />
                </div>

                <div className="flex gap-3 mt-6">
                  <button
                    onClick={() => {
                      setShowAddCampeonatoModal(false)
                      clearForm()
                    }}
                    className="flex-1 px-4 py-2 border border-gray-300 rounded-lg text-gray-700 hover:bg-gray-50 transition-colors"
                  >
                    Cancelar
                  </button>
                  <button
                    onClick={handleAddCampeonato}
                    className="flex-1 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors shadow-md"
                  >
                    Criar Campeonato
                  </button>
                </div>
              </div>
            </motion.div>
          </div>
        )}

        {showEditCampeonatoModal && (
          <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
            <motion.div
              initial={{ scale: 0.9, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              className="bg-white rounded-xl shadow-2xl max-w-md w-full p-6"
            >
              <h2 className="text-xl font-bold mb-4 flex items-center gap-2">
                <Edit2 className="w-6 h-6 text-blue-600" />
                Alterar Campeonato
              </h2>

              <div className="space-y-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Nome do Campeonato <span className="text-red-600">*</span>
                  </label>
                  <input
                    type="text"
                    value={campeonatoForm.nome}
                    onChange={(e) => setCampeonatoForm((prev) => ({ ...prev, nome: e.target.value }))}
                    className="w-full border border-gray-300 rounded-lg p-2 focus:ring-2 focus:ring-blue-200 focus:outline-none"
                    placeholder="Ex: Campeonato Sul Baiano 2026"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Data de Inicio <span className="text-red-600">*</span>
                  </label>
                  <input
                    type="datetime-local"
                    value={campeonatoForm.data_inicial}
                    onChange={(e) =>
                      setCampeonatoForm((prev) => ({ ...prev, data_inicial: e.target.value }))
                    }
                    className="w-full border border-gray-300 rounded-lg p-2 focus:ring-2 focus:ring-blue-200 focus:outline-none"
                  />
                </div>

                <div className="flex gap-3 mt-6">
                  <button
                    onClick={() => {
                      setShowEditCampeonatoModal(false)
                      setEditingCampeonato(null)
                      clearForm()
                    }}
                    className="flex-1 px-4 py-2 border border-gray-300 rounded-lg text-gray-700 hover:bg-gray-50 transition-colors"
                  >
                    Cancelar
                  </button>
                  <button
                    onClick={handleEditCampeonato}
                    className="flex-1 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors shadow-md"
                  >
                    Salvar Alteracoes
                  </button>
                </div>
              </div>
            </motion.div>
          </div>
        )}
      </div>
    </>
  )
}
