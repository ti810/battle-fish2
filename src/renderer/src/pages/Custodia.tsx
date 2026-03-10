import { useEffect, useMemo, useState } from 'react'
import { Search, Edit2, Trash2, X, FilterX, ChevronLeft, ChevronRight } from 'lucide-react'
import { motion, AnimatePresence } from 'framer-motion'
import { CustodiaCustomer, PeixeCustomer } from '~/src/shared/types/interfaces'
import { toast } from 'sonner'
import { formataPeso } from '../lib/utils'

const ITEMS_PER_PAGE_OPTIONS = [5, 10, 20, 50]

function normalizeText(value: string): string {
  return value
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .toLowerCase()
    .trim()
}

function toNumber(value: string | number): number {
  const parsed = Number(value)
  return Number.isFinite(parsed) ? parsed : 0
}

export default function Custodia() {
  const [custodias, setCustodias] = useState<CustodiaCustomer[]>([])

  const [searchTerm, setSearchTerm] = useState('')
  const [selectedCampeonatoFilter, setSelectedCampeonatoFilter] = useState<string>('all')
  const [selectedSetorFilter, setSelectedSetorFilter] = useState<string>('all')
  const [pesoMinFilter, setPesoMinFilter] = useState('')
  const [pesoMaxFilter, setPesoMaxFilter] = useState('')

  const [currentPage, setCurrentPage] = useState<number>(1)
  const [itemsPerPage, setItemsPerPage] = useState<number>(10)

  const [showModal, setShowModal] = useState(false)
  const [editingMember, setEditingMember] = useState<PeixeCustomer | null>(null)

  const [peixeForm, setPeixeForm] = useState<PeixeCustomer>({
    id: 0,
    peso: '',
    equipe_id: 0
  })

  useEffect(() => {
    loadCustodias()
  }, [])

  useEffect(() => {
    setCurrentPage(1)
  }, [searchTerm, selectedCampeonatoFilter, selectedSetorFilter, pesoMinFilter, pesoMaxFilter, itemsPerPage])

  async function loadCustodias() {
    const res = await window.api.listarCustodia()

    if (!res?.success) {
      setCustodias([])
      return
    }

    setCustodias(res.data)
  }

  const campeonatoOptions = useMemo(() => {
    return Array.from(new Set(custodias.map((item) => item.campeonato)))
      .filter((value) => value?.trim().length > 0)
      .sort((a, b) => a.localeCompare(b, 'pt-BR'))
  }, [custodias])

  const setorOptions = useMemo(() => {
    return Array.from(new Set(custodias.map((item) => String(item.setor))))
      .filter((value) => value.trim().length > 0)
      .sort((a, b) => Number(a) - Number(b))
  }, [custodias])

  const filteredCustodias = useMemo(() => {
    const normalizedSearch = normalizeText(searchTerm)
    const minPeso = pesoMinFilter.trim().length > 0 ? Number(pesoMinFilter) : null
    const maxPeso = pesoMaxFilter.trim().length > 0 ? Number(pesoMaxFilter) : null

    return custodias.filter((item) => {
      const pesoNumber = toNumber(item.peso)

      const matchesSearch =
        normalizedSearch.length === 0 ||
        normalizeText(item.equipe ?? '').includes(normalizedSearch) ||
        normalizeText(item.campeonato ?? '').includes(normalizedSearch) ||
        String(item.setor).includes(normalizedSearch) ||
        String(item.id).includes(normalizedSearch) ||
        normalizeText(formataPeso(pesoNumber)).includes(normalizedSearch) ||
        String(item.peso).includes(normalizedSearch)

      const matchesCampeonato =
        selectedCampeonatoFilter === 'all' || item.campeonato === selectedCampeonatoFilter

      const matchesSetor = selectedSetorFilter === 'all' || String(item.setor) === selectedSetorFilter

      const matchesPesoMin = minPeso === null || pesoNumber >= minPeso
      const matchesPesoMax = maxPeso === null || pesoNumber <= maxPeso

      return matchesSearch && matchesCampeonato && matchesSetor && matchesPesoMin && matchesPesoMax
    })
  }, [
    custodias,
    searchTerm,
    selectedCampeonatoFilter,
    selectedSetorFilter,
    pesoMinFilter,
    pesoMaxFilter
  ])

  const totalPages = Math.max(1, Math.ceil(filteredCustodias.length / itemsPerPage))
  const currentPageSafe = Math.min(currentPage, totalPages)

  const startIndex = (currentPageSafe - 1) * itemsPerPage
  const endIndex = startIndex + itemsPerPage

  const currentItems = filteredCustodias.slice(startIndex, endIndex)

  const firstVisibleItem = filteredCustodias.length === 0 ? 0 : startIndex + 1
  const lastVisibleItem = Math.min(endIndex, filteredCustodias.length)

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
    searchTerm.trim().length > 0 ||
    selectedCampeonatoFilter !== 'all' ||
    selectedSetorFilter !== 'all' ||
    pesoMinFilter.trim().length > 0 ||
    pesoMaxFilter.trim().length > 0

  const clearFilters = () => {
    setSearchTerm('')
    setSelectedCampeonatoFilter('all')
    setSelectedSetorFilter('all')
    setPesoMinFilter('')
    setPesoMaxFilter('')
    setCurrentPage(1)
  }

  const handleOpenModal = (item: CustodiaCustomer) => {
    setEditingMember({
      id: item.id,
      peso: item.peso,
      equipe_id: item.id_equipe
    })

    setPeixeForm({
      id: item.id,
      peso: item.peso,
      equipe_id: item.id_equipe
    })

    setShowModal(true)
  }

  const handleCloseModal = () => {
    setShowModal(false)
    setEditingMember(null)
  }

  const handleSave = async () => {
    if (!editingMember) return

    await window.api.editPeixeById({
      id: peixeForm.id,
      peso: peixeForm.peso,
      equipe_id: peixeForm.equipe_id
    })

    toast.success('Peixe atualizado com sucesso')

    await loadCustodias()
    handleCloseModal()
  }

  const handleDelete = async (item: CustodiaCustomer) => {
    const resposta = await window.api.showMessageBox({
      type: 'question',
      buttons: ['Sim', 'Nao'],
      defaultId: 1,
      cancelId: 1,
      title: 'Deseja excluir?',
      message: 'Tem certeza que deseja excluir este registro?'
    })

    if (resposta.response === 0) {
      await window.api.deletarPeixe(item.id)
      toast.success('Registro excluido com sucesso')
      await loadCustodias()
    }
  }

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Custodia</h1>
          <p className="text-gray-500">Revise todos os peixes em custodia</p>
        </div>
      </div>

      <div className="bg-white rounded-xl shadow-sm border border-gray-100 overflow-hidden">
        <div className="p-4 border-b border-gray-100 space-y-3">
          <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-5 gap-3">
            <div className="relative md:col-span-2 xl:col-span-2">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
              <input
                type="text"
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                placeholder="Buscar por equipe, campeonato, setor, id ou peso..."
                className="w-full pl-9 pr-4 py-2 bg-gray-50 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-100"
              />
            </div>

            <select
              value={selectedCampeonatoFilter}
              onChange={(e) => setSelectedCampeonatoFilter(e.target.value)}
              className="w-full px-3 py-2 bg-gray-50 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-100"
            >
              <option value="all">Todos os campeonatos</option>
              {campeonatoOptions.map((campeonato) => (
                <option key={campeonato} value={campeonato}>
                  {campeonato}
                </option>
              ))}
            </select>

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

            <input
              type="number"
              min="0"
              value={pesoMinFilter}
              onChange={(e) => setPesoMinFilter(e.target.value)}
              placeholder="Peso minimo (g)"
              className="w-full px-3 py-2 bg-gray-50 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-100"
            />
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
            <input
              type="number"
              min="0"
              value={pesoMaxFilter}
              onChange={(e) => setPesoMaxFilter(e.target.value)}
              placeholder="Peso maximo (g)"
              className="w-full px-3 py-2 bg-gray-50 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-100"
            />

            <div className="flex md:justify-end">
              <button
                type="button"
                onClick={clearFilters}
                disabled={!hasActiveFilters}
                className="inline-flex items-center justify-center gap-2 px-3 py-2 rounded-lg border border-gray-200 text-gray-600 hover:bg-gray-50 disabled:opacity-40 disabled:cursor-not-allowed"
                title="Limpar filtros"
              >
                <FilterX className="w-4 h-4" />
                Limpar filtros
              </button>
            </div>
          </div>
        </div>

        <div className="overflow-x-auto">
          <table className="min-w-full text-sm text-left">
            <thead className="bg-gray-50 text-gray-500 font-medium border-b border-gray-100">
              <tr>
                <th className="px-6 py-3">ID</th>
                <th className="px-6 py-3">Peso</th>
                <th className="px-6 py-3">Equipe</th>
                <th className="px-6 py-3">Campeonato</th>
                <th className="px-6 py-3 text-right">Setor</th>
                <th className="px-6 py-3 text-right">Acoes</th>
              </tr>
            </thead>

            <tbody className="divide-y divide-gray-100">
              {currentItems.length === 0 && (
                <tr>
                  <td colSpan={6} className="px-6 py-10 text-center text-gray-500">
                    Nenhum registro encontrado para os filtros aplicados.
                  </td>
                </tr>
              )}

              {currentItems.map((item, idx) => (
                <motion.tr
                  key={item.id}
                  initial={{ opacity: 0, x: -10 }}
                  animate={{ opacity: 1, x: 0 }}
                  transition={{ delay: idx * 0.03 }}
                  className="hover:bg-blue-50/30 transition-colors"
                >
                  <td className="px-6 py-4 font-medium text-gray-900">{item.id}</td>

                  <td className="px-6 py-4 font-medium text-gray-900">{formataPeso(toNumber(item.peso))}</td>

                  <td className="px-6 py-4 text-gray-600">{item.equipe}</td>

                  <td className="px-6 py-4 text-gray-600">{item.campeonato}</td>

                  <td className="px-6 py-4 text-right">
                    <span className="inline-flex items-center px-2 py-1 rounded-md text-xs font-medium bg-green-100 text-green-700">
                      {item.setor}
                    </span>
                  </td>

                  <td className="px-6 py-4 text-right">
                    <div className="flex justify-end gap-2">
                      <button
                        onClick={() => handleOpenModal(item)}
                        className="inline-flex items-center justify-center w-8 h-8 rounded hover:bg-gray-100 text-blue-600"
                        title="Editar peixe"
                      >
                        <Edit2 size={16} />
                      </button>

                      <button
                        onClick={() => handleDelete(item)}
                        className="inline-flex items-center justify-center w-8 h-8 rounded hover:bg-gray-100 text-red-600"
                        title="Excluir peixe"
                      >
                        <Trash2 size={16} />
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
            Mostrando {firstVisibleItem} a {lastVisibleItem} de {filteredCustodias.length} registros
            {filteredCustodias.length !== custodias.length && ` (total: ${custodias.length})`}
          </div>

          <div className="flex items-center gap-2 text-sm text-gray-600">
            <label htmlFor="custodia-items-per-page">Itens por pagina</label>
            <select
              id="custodia-items-per-page"
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
                <h2 className="text-xl font-bold">Editar peixe</h2>

                <button onClick={handleCloseModal} className="text-gray-400 hover:text-gray-600" type="button">
                  <X className="w-5 h-5" />
                </button>
              </div>

              <div className="space-y-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Peso</label>

                  <input
                    type="number"
                    value={peixeForm.peso}
                    onChange={(e) =>
                      setPeixeForm({
                        ...peixeForm,
                        peso: String(e.target.value)
                      })
                    }
                    className="w-full border border-gray-300 rounded-lg p-2 focus:ring-2 focus:ring-blue-200 focus:outline-none"
                  />
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
                    onClick={handleSave}
                    className="flex-1 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors shadow-md"
                    type="button"
                  >
                    Salvar alteracoes
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
