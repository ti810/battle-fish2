import { useEffect, useState, useMemo } from 'react'
import { UserPlus, Search, Edit2, Trash2, X } from 'lucide-react'
import { motion, AnimatePresence } from 'framer-motion'
import { AtletaCustomer, NewAtletaCustomer, EquipeCustomer } from '~/src/shared/types/interfaces'
import { agoraParaSQLite } from '../lib/utils'
import { toast } from 'sonner'




export default function Atletas() {
  const [equipes, setEquipes] = useState<EquipeCustomer[]>([])
  const [atletas, setAtletas] = useState<AtletaCustomer[]>([])
  const [equipeSelecionada, setEquipeSelecionada] = useState<EquipeCustomer | undefined>(undefined)
  const [isEquipeSelecionada, setIsEquipeSelecionada] = useState(false);

  const [showModal, setShowModal] = useState(false)
  const [editingMember, setEditingMember] = useState<AtletaCustomer | null>(null)
  const [searchTerm, setSearchTerm] = useState('')

  const [atletaForm, setAtletaForm] = useState<NewAtletaCustomer>({
    nome: '',
    equipe_id: 0
  })


  useEffect(() => {
    console.log(equipeSelecionada)
  },[equipeSelecionada])

  useEffect(() => {
    loadAtletas()
    loadEquipes()
  }, [])

  async function loadAtletas() {
    const res = await window.api.atletaComSetor()

    if (!res?.success) return

    setAtletas(res.data)
  }



  async function loadEquipes() {
    const res = await window.api.listarEquipes()

    if (!res?.success) {
      setEquipes([])

      return
    }

    setEquipes(res.data)
  }


  const handleOpenModal = (atleta?: AtletaCustomer) => {
    if (atleta) {
      setEditingMember(atleta)

      setAtletaForm({
        nome: atleta.nome,
        equipe_id: atleta.equipe_id
      })
    } else {
      setEditingMember(null)

      setAtletaForm({
        nome: '',
        equipe_id: equipes[0]?.id ?? 0
      })
    }

    setShowModal(true)
  }


  const handleCloseModal = () => {
    setShowModal(false)
    setEditingMember(null)
  }


  const handleSaveMember = async () => {
    if (!atletaForm.nome || !atletaForm.equipe_id) return

    if (editingMember) {
      await window.api.editAtletaById({
        id: editingMember.id,
        nome: atletaForm.nome,
        equipe_id: atletaForm.equipe_id
      })
    } else {
      await window.api.addNovoAtleta({
        nome: atletaForm.nome,
        equipe_id: atletaForm.equipe_id
      })
    }

    await loadAtletas()
    handleCloseModal()
  }


  const handleDeleteMember = async (id: number) => {

    const resposta = await window.api.showMessageBox({
      type: 'question',
      buttons: ['Sim', 'Não'],
      defaultId: 1,
      cancelId: 1,
      title: 'Deseja Exluir?',
      message: `Tem certeza que deseja excluir este atleta? " #${atletaForm.nome}#`,
    })

    if (resposta.response === 0) {
      await window.api.deletarAtleta(id)
      toast.success(`Atleta ${atletaForm.nome} excluído com sucesso!`)
      await loadAtletas()
    }
  }

  const filteredMembers = atletas.filter(
    (m) =>    
      m.nome.toLowerCase().includes(searchTerm.toLowerCase()) ||
      m.equipe_nome?.toLowerCase().includes(searchTerm.toLowerCase())
  )

  // setor calculado a partir da equipe selecionada
  const setorSelecionado = useMemo(() => {
    return (equipes ?? []).find((e) => e.id === atletaForm.equipe_id)?.setor ?? ''
  }, [atletaForm.equipe_id, equipes])


  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Atletas</h1>
          <p className="text-gray-500">Gerencie todos os atletas do campeonato</p>
        </div>

        <button
          onClick={() => {
            handleOpenModal()
            setEquipeSelecionada(equipes.find(e => e.id === atletaForm.equipe_id))
            setIsEquipeSelecionada(false)
          }}
          className="flex items-center justify-center gap-2 bg-blue-600 hover:bg-blue-700 text-white px-4 py-2 rounded-lg transition-colors shadow-lg shadow-blue-200"
        >
          <UserPlus className="w-4 h-4" />
          Adicionar Atleta
        </button>
      </div>

      <div className="bg-white rounded-xl shadow-sm border border-gray-100 overflow-hidden">
        <div className="p-4 border-b border-gray-100 flex flex-col sm:flex-row gap-4">
          <div className="relative flex-1">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
            <input
              type="text"
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              placeholder="Buscar por nome ou equipe..."
              className="w-full pl-9 pr-4 py-2 bg-gray-50 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-100"
            />
          </div>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-sm text-left">
            <thead className="bg-gray-50 text-gray-500 font-medium border-b border-gray-100">
              <tr>
                <th className="px-6 py-3">Atleta</th>
                <th className="px-6 py-3">Equipe</th>
                <th className="px-6 py-3">Setor</th>
                <th className="px-6 py-3 text-right">Ações</th>
              </tr>
            </thead>

            <tbody className="divide-y divide-gray-100">
              {filteredMembers.map((atleta: any, idx: any) => (
                <motion.tr
                  key={atleta.id}
                  initial={{ opacity: 0, x: -10 }}
                  animate={{ opacity: 1, x: 0 }}
                  transition={{ delay: idx * 0.05 }}
                  className="hover:bg-blue-50/30 transition-colors"
                >
                  <td className="px-6 py-4">
                    <div className="flex items-center gap-3">
                      <div className="w-8 h-8 rounded-full bg-linear-to-br from-blue-400 to-blue-600 flex items-center justify-center text-white font-bold text-xs shadow-md">
                        {atleta.nome.charAt(0)}
                      </div>

                      <div className="font-medium text-gray-900">
                        {atleta.nome}
                      </div>
                    </div>
                  </td>

                  <td className="px-6 py-4 text-gray-600">
                    {atleta.equipe_nome}
                  </td>

                  <td className="px-6 py-4">
                    <span className="w-8 h-8 rounded-full bg-linear-to-br from-green-400 to-green-600 opacity-70 flex items-center justify-center text-white font-bold text-xs shadow-md">
                      {atleta.equipe_setor}
                    </span>
                  </td>

                  <td className="px-6 py-4">
                    <div className="flex items-center justify-end gap-2">
                      <button
                        onClick={() => {
                          handleOpenModal(atleta)
                          setIsEquipeSelecionada(true)
                        }}
                        className="p-1.5 text-blue-600 hover:bg-blue-50 rounded-md transition-colors"
                      >
                        <Edit2 className="w-4 h-4" />
                      </button>

                      <button
                        onClick={() => handleDeleteMember(atleta.id)}
                        className="p-1.5 text-red-600 hover:bg-red-50 rounded-md transition-colors"
                      >
                        <Trash2 className="w-4 h-4" />
                      </button>
                    </div>
                  </td>
                </motion.tr>
              ))}
            </tbody>
          </table>
        </div>

        <div className="p-4 border-t border-gray-100 text-sm text-gray-500">
          Mostrando {filteredMembers.length} de {atletas.length} atletas
        </div>
      </div>

      <AnimatePresence>
        {showModal && (
          <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
            <motion.div
              initial={{ scale: 0.9, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0.9, opacity: 0 }}
              className="bg-white rounded-xl shadow-2xl max-w-md w-full p-6"
            >
              <div className="flex items-center justify-between mb-4">
                <h2 className="text-xl font-bold flex items-center gap-2">
                  <UserPlus className="w-6 h-6 text-blue-600" />
                  {editingMember ? 'Editar Atleta' : 'Novo Atleta'}
                </h2>

                <button
                  onClick={handleCloseModal}
                  className="text-gray-400 hover:text-gray-600"
                >
                  <X className="w-5 h-5" />
                </button>
              </div>

              <div className="space-y-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Nome completo
                  </label>

                  <input
                    type="text"
                    value={atletaForm.nome}
                    onChange={(e) =>
                      setAtletaForm({
                        ...atletaForm,
                        nome: e.target.value
                      })
                    }
                    className="w-full border border-gray-300 rounded-lg p-2 focus:ring-2 focus:ring-blue-200 focus:outline-none"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Equipe
                  </label>

                  <select
                    value={atletaForm.equipe_id}
                    onChange={(e) =>
                      setAtletaForm({
                        ...atletaForm,
                        equipe_id: Number(e.target.value)
                      })
                    }
                    className="w-full border border-gray-300 rounded-lg p-2 focus:ring-2 focus:ring-blue-200 focus:outline-none"
                  >
                    <option disabled value={0}>Selecione uma equipe...</option>
                    {isEquipeSelecionada ? (
                      <option value={atletaForm.equipe_id}>
                       {equipes.find(equipe => equipe.id === atletaForm.equipe_id)?.nome}
                      </option>
                    ) : equipes.map((equipe) => (
                      <option key={equipe.id} value={equipe.id}>
                        {equipe.nome}
                      </option>
                    ))}

                  </select>
                </div>

                <div className="flex gap-3 mt-6">
                  <button
                    onClick={handleCloseModal}
                    className="flex-1 px-4 py-2 border border-gray-300 rounded-lg text-gray-700 hover:bg-gray-50 transition-colors"
                  >
                    Cancelar
                  </button>

                  <button
                    onClick={handleSaveMember}
                    className="flex-1 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors shadow-md"
                  >
                    {editingMember ? 'Salvar alterações' : 'Adicionar'}
                  </button>
                </div>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>
    </div>
  )
}
