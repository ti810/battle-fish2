import { useEffect, useMemo, useRef, useState } from 'react'
import { UserPlus, Search, Edit2, Trash2, X, FilterX, ChevronLeft, ChevronRight } from 'lucide-react'
import { motion, AnimatePresence } from 'framer-motion'
import { AtletaCustomer, NewAtletaCustomer, EquipeCustomer } from '~/src/shared/types/interfaces'
import { toast } from 'sonner'
import { atletaSchema, formValidation } from '../hooks/formValidation'

const ITEMS_PER_PAGE_OPTIONS = [5, 10, 20, 50]

function normalizeText(value: string): string {
  return value
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .toLowerCase()
    .trim()
}

export default function Atletas() {
  const idEquipeRef = useRef<HTMLSelectElement>(null)
  const nomeRef = useRef<HTMLInputElement>(null)

  const [fieldErrors, setFieldErrors] = useState<Record<string, string[]>>({})

  const [equipes, setEquipes] = useState<EquipeCustomer[]>([])
  const [atletas, setAtletas] = useState<AtletaCustomer[]>([])

  const [showModal, setShowModal] = useState(false)
  const [editingMember, setEditingMember] = useState<AtletaCustomer | null>(null)

  const [searchTerm, setSearchTerm] = useState('')
  const [selectedEquipeFilter, setSelectedEquipeFilter] = useState<string>('all')
  const [selectedSetorFilter, setSelectedSetorFilter] = useState<string>('all')

  const [currentPage, setCurrentPage] = useState<number>(1)
  const [itemsPerPage, setItemsPerPage] = useState<number>(10)

  const [atletaForm, setAtletaForm] = useState<NewAtletaCustomer>({
    nome: '',
    equipe_id: 0
  })

  useEffect(() => {
    loadAtletas()
    loadEquipes()
  }, [])

  useEffect(() => {
    setCurrentPage(1)
  }, [searchTerm, selectedEquipeFilter, selectedSetorFilter, itemsPerPage])

  async function loadAtletas() {
    const res = await window.api.atletaComSetor()

    if (!res?.success) {
      setAtletas([])
      return
    }

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
    setFieldErrors({})

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
    setFieldErrors({})
  }

  const handleSaveMember = async () => {
    const validationRules = await formValidation(atletaSchema, atletaForm)

    if (!validationRules.success) {
      setFieldErrors(validationRules.fieldErrors)

      const firstField = Object.keys(validationRules.fieldErrors)[0]
      if (firstField === 'nome') {
        nomeRef.current?.focus()
      }

      if (firstField === 'equipe_id') {
        idEquipeRef.current?.focus()
      }

      const errors = Object.values(validationRules.fieldErrors).flat()
      toast.error(
        <div className="space-y-1">
          {errors.map((err, index) => (
            <p key={index}>- {err}</p>
          ))}
        </div>
      )

      return
    }

    if (editingMember) {
      const editResponse = await window.api.editAtletaById({
        id: editingMember.id,
        nome: atletaForm.nome,
        equipe_id: atletaForm.equipe_id
      })

      if (!editResponse?.success) {
        toast.error(editResponse?.message || 'Nao foi possivel atualizar o atleta.')
        return
      }
    } else {
      const addResponse = await window.api.addNovoAtleta({
        nome: atletaForm.nome,
        equipe_id: atletaForm.equipe_id
      })

      if (!addResponse?.success) {
        toast.error(addResponse?.message || 'Nao foi possivel adicionar o atleta.')
        return
      }
    }

    await loadAtletas()
    handleCloseModal()
  }

  const handleDeleteMember = async (id: number) => {
    const atleta = atletas.find((a) => a.id === id)

    const resposta = await window.api.showMessageBox({
      type: 'question',
      buttons: ['Sim', 'Nao'],
      defaultId: 1,
      cancelId: 1,
      title: 'Deseja excluir?',
      message: `Tem certeza que deseja excluir este atleta? *** ${(atleta?.nome ?? '').toUpperCase()} ***`
    })

    if (resposta.response === 0) {
      await window.api.deletarAtleta(id)
      toast.success(`Atleta ${atleta?.nome ?? ''} excluido com sucesso!`)
      await loadAtletas()
    }
  }

  const sortedEquipes = useMemo(() => {
    return [...equipes].sort((a, b) => a.nome.localeCompare(b.nome, 'pt-BR'))
  }, [equipes])

  const setorOptions = useMemo(() => {
    const setores = Array.from(
      new Set(
        atletas
          .map((atleta) => String(atleta.equipe_setor ?? '').trim())
          .filter((setor) => setor.length > 0)
      )
    )

    return setores.sort((a, b) => Number(a) - Number(b))
  }, [atletas])

  const filteredMembers = useMemo(() => {
    const normalizedSearch = normalizeText(searchTerm)

    return atletas.filter((atleta) => {
      const matchesSearch =
        normalizedSearch.length === 0 ||
        normalizeText(atleta.nome).includes(normalizedSearch) ||
        normalizeText(atleta.equipe_nome ?? '').includes(normalizedSearch) ||
        String(atleta.equipe_setor ?? '').includes(normalizedSearch) ||
        normalizeText(atleta.equipe_tipo ?? '').includes(normalizedSearch)

      const matchesEquipe =
        selectedEquipeFilter === 'all' || atleta.equipe_id === Number(selectedEquipeFilter)

      const matchesSetor =
        selectedSetorFilter === 'all' || String(atleta.equipe_setor ?? '') === selectedSetorFilter

      return matchesSearch && matchesEquipe && matchesSetor
    })
  }, [atletas, searchTerm, selectedEquipeFilter, selectedSetorFilter])

  const totalPages = Math.max(1, Math.ceil(filteredMembers.length / itemsPerPage))
  const currentPageSafe = Math.min(currentPage, totalPages)

  const startIndex = (currentPageSafe - 1) * itemsPerPage
  const endIndex = startIndex + itemsPerPage

  const currentItems = filteredMembers.slice(startIndex, endIndex)

  const firstVisibleItem = filteredMembers.length === 0 ? 0 : startIndex + 1
  const lastVisibleItem = Math.min(endIndex, filteredMembers.length)

  const visiblePages = useMemo(() => {
    const maxVisiblePages = 5

    let firstPage = Math.max(1, currentPageSafe - 2)
    let lastPage = Math.min(totalPages, firstPage + maxVisiblePages - 1)

    if (lastPage - firstPage + 1 < maxVisiblePages) {
      firstPage = Math.max(1, lastPage - maxVisiblePages + 1)
    }

    return Array.from({ length: lastPage - firstPage + 1 }, (_, index) => firstPage + index)
  }, [currentPageSafe, totalPages])

  const hasActiveFilters =
    searchTerm.trim().length > 0 || selectedEquipeFilter !== 'all' || selectedSetorFilter !== 'all'

  const clearFilters = () => {
    setSearchTerm('')
    setSelectedEquipeFilter('all')
    setSelectedSetorFilter('all')
    setCurrentPage(1)
  }

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Atletas</h1>
          <p className="text-gray-500">Gerencie todos os atletas do campeonato</p>
        </div>

        <button
          onClick={() => handleOpenModal()}
          className="flex items-center justify-center gap-2 bg-blue-600 hover:bg-blue-700 text-white px-4 py-2 rounded-lg transition-colors shadow-lg shadow-blue-200"
        >
          <UserPlus className="w-4 h-4" />
          Adicionar Atleta
        </button>
      </div>

      <div className="bg-white rounded-xl shadow-sm border border-gray-100 overflow-hidden">
        <div className="p-4 border-b border-gray-100 grid grid-cols-1 md:grid-cols-2 xl:grid-cols-4 gap-3">
          <div className="relative md:col-span-2 xl:col-span-2">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
            <input
              type="text"
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              placeholder="Buscar por nome, equipe, setor ou tipo..."
              className="w-full pl-9 pr-4 py-2 bg-gray-50 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-100"
            />
          </div>

          <select
            value={selectedEquipeFilter}
            onChange={(e) => setSelectedEquipeFilter(e.target.value)}
            className="w-full px-3 py-2 bg-gray-50 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-100"
          >
            <option value="all">Todas as equipes</option>
            {sortedEquipes.map((equipe) => (
              <option key={equipe.id} value={equipe.id}>
                {equipe.nome}
              </option>
            ))}
          </select>

          <div className="flex gap-2">
            <select
              value={selectedSetorFilter}
              onChange={(e) => setSelectedSetorFilter(e.target.value)}
              className="w-full px-3 py-2 bg-gray-50 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-100"
            >
              <option value="all">Todos os setores</option>
              {setorOptions.map((setor) => (
                <option key={setor} value={setor}>
                  Setor {setor}
                </option>
              ))}
            </select>

            <button
              type="button"
              onClick={clearFilters}
              disabled={!hasActiveFilters}
              className="inline-flex items-center justify-center gap-2 px-3 py-2 rounded-lg border border-gray-200 text-gray-600 hover:bg-gray-50 disabled:opacity-40 disabled:cursor-not-allowed"
              title="Limpar filtros"
            >
              <FilterX className="w-4 h-4" />
            </button>
          </div>
        </div>

        <div className="overflow-x-auto">
          <table className="min-w-full text-sm text-left">
            <thead className="bg-gray-50 text-gray-500 font-medium border-b border-gray-100">
              <tr>
                <th className="px-6 py-3">Atleta</th>
                <th className="px-6 py-3">Equipe</th>
                <th className="px-6 py-3">Setor</th>
                <th className="px-6 py-3">Tipo de Equipe</th>
                <th className="px-6 py-3 text-right">Acoes</th>
              </tr>
            </thead>

            <tbody className="divide-y divide-gray-100">
              {currentItems.length === 0 && (
                <tr>
                  <td colSpan={5} className="px-6 py-10 text-center text-gray-500">
                    Nenhum atleta encontrado para os filtros aplicados.
                  </td>
                </tr>
              )}

              {currentItems.map((atleta, idx) => (
                <motion.tr
                  key={atleta.id}
                  initial={{ opacity: 0, x: -10 }}
                  animate={{ opacity: 1, x: 0 }}
                  transition={{ delay: idx * 0.03 }}
                  className="hover:bg-blue-50/30 transition-colors"
                >
                  <td className="px-6 py-4">
                    <div className="flex items-center gap-3">
                      <div className="w-8 h-8 rounded-full bg-linear-to-br from-blue-400 to-blue-600 flex items-center justify-center text-white font-bold text-xs shadow-md">
                        {atleta.nome.charAt(0)}
                      </div>

                      <div className="font-medium text-gray-900">{atleta.nome}</div>
                    </div>
                  </td>

                  <td className="px-6 py-4 text-gray-600">{atleta.equipe_nome ?? '-'}</td>

                  <td className="px-6 py-4">
                    <span className="inline-flex items-center px-2 py-1 rounded-md text-xs font-medium bg-green-100 text-green-700">
                      {atleta.equipe_setor ?? '-'}
                    </span>
                  </td>

                  <td className="px-6 py-4 text-gray-600">
                    <span className="inline-flex items-center px-2 py-1 rounded-md text-xs font-medium bg-blue-100 text-blue-700">
                      {atleta.equipe_tipo ?? '-'}
                    </span>
                  </td>

                  <td className="px-6 py-4">
                    <div className="flex items-center justify-end gap-2">
                      <button
                        onClick={() => handleOpenModal(atleta)}
                        className="p-1.5 text-blue-600 hover:bg-blue-50 rounded-md transition-colors"
                        title="Editar atleta"
                      >
                        <Edit2 className="w-4 h-4" />
                      </button>

                      <button
                        onClick={() => handleDeleteMember(atleta.id)}
                        className="p-1.5 text-red-600 hover:bg-red-50 rounded-md transition-colors"
                        title="Excluir atleta"
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

        <div className="p-4 border-t border-gray-100 flex flex-col gap-3 lg:flex-row lg:items-center lg:justify-between">
          <div className="text-sm text-gray-500">
            Mostrando {firstVisibleItem} a {lastVisibleItem} de {filteredMembers.length} registros
            {filteredMembers.length !== atletas.length && ` (total: ${atletas.length})`}
          </div>

          <div className="flex items-center gap-2 text-sm text-gray-600">
            <label htmlFor="atletas-items-per-page">Itens por pagina</label>
            <select
              id="atletas-items-per-page"
              value={itemsPerPage}
              onChange={(e) => setItemsPerPage(Number(e.target.value))}
              className="px-2 py-1 border border-gray-200 rounded-md bg-white"
            >
              {ITEMS_PER_PAGE_OPTIONS.map((option) => (
                <option key={option} value={option}>
                  {option}
                </option>
              ))}
            </select>
          </div>

          <div className="flex items-center justify-end gap-1">
            <button
              type="button"
              onClick={() => setCurrentPage((prev) => Math.max(1, prev - 1))}
              disabled={currentPageSafe === 1}
              className="h-8 w-8 inline-flex items-center justify-center rounded-md border border-gray-200 text-gray-600 hover:bg-gray-50 disabled:opacity-40 disabled:cursor-not-allowed"
              aria-label="Pagina anterior"
            >
              <ChevronLeft className="w-4 h-4" />
            </button>

            {visiblePages.map((page) => (
              <button
                key={page}
                type="button"
                onClick={() => setCurrentPage(page)}
                className={`h-8 min-w-8 px-2 rounded-md text-sm ${
                  currentPageSafe === page
                    ? 'bg-blue-600 text-white'
                    : 'border border-gray-200 text-gray-700 hover:bg-gray-50'
                }`}
              >
                {page}
              </button>
            ))}

            <button
              type="button"
              onClick={() => setCurrentPage((prev) => Math.min(totalPages, prev + 1))}
              disabled={currentPageSafe === totalPages}
              className="h-8 w-8 inline-flex items-center justify-center rounded-md border border-gray-200 text-gray-600 hover:bg-gray-50 disabled:opacity-40 disabled:cursor-not-allowed"
              aria-label="Proxima pagina"
            >
              <ChevronRight className="w-4 h-4" />
            </button>
          </div>
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

                <button onClick={handleCloseModal} className="text-gray-400 hover:text-gray-600" type="button">
                  <X className="w-5 h-5" />
                </button>
              </div>

              <div className="space-y-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Nome completo</label>

                  <input
                    ref={nomeRef}
                    type="text"
                    value={atletaForm.nome}
                    onChange={(e) => {
                      setAtletaForm({
                        ...atletaForm,
                        nome: e.target.value
                      })
                      setFieldErrors((prev) => {
                        const { nome, ...rest } = prev
                        return rest
                      })
                    }}
                    className={`w-full rounded-lg p-2 focus:outline-none ${
                      fieldErrors.nome
                        ? 'border border-red-500 focus:ring-2 focus:ring-red-200'
                        : 'border border-gray-300 focus:ring-2 focus:ring-blue-200'
                    }`}
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Equipe</label>

                  <select
                    ref={idEquipeRef}
                    value={atletaForm.equipe_id || ''}
                    onChange={(e) => {
                      setAtletaForm({
                        ...atletaForm,
                        equipe_id: Number(e.target.value)
                      })
                      setFieldErrors((prev) => {
                        const { equipe_id, ...rest } = prev
                        return rest
                      })
                    }}
                    className={`w-full rounded-lg p-2 focus:outline-none ${
                      fieldErrors.equipe_id
                        ? 'border border-red-500 focus:ring-2 focus:ring-red-200'
                        : 'border border-gray-300 focus:ring-2 focus:ring-blue-200'
                    }`}
                  >
                    <option disabled value="">
                      Selecione uma equipe...
                    </option>

                    {sortedEquipes.map((equipe) => (
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
                    type="button"
                  >
                    Cancelar
                  </button>

                  <button
                    onClick={handleSaveMember}
                    className="flex-1 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors shadow-md"
                    type="button"
                  >
                    {editingMember ? 'Salvar alteracoes' : 'Adicionar'}
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
