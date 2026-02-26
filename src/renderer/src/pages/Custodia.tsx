import { useEffect, useState } from 'react'
import { Search, Edit2, Trash2, X } from 'lucide-react'
import { motion, AnimatePresence } from 'framer-motion'
import { CustodiaCustomer, PeixeCustomer } from '~/src/shared/types/interfaces'
import { toast } from 'sonner'
import { formataPeso } from '../lib/utils'

export default function Custodia() {

  const [custodias, setCustodias] = useState<CustodiaCustomer[]>([])
  const [searchTerm, setSearchTerm] = useState('')

  const [showModal, setShowModal] = useState(false)
  const [editingMember, setEditingMember] = useState<PeixeCustomer | null>(null)

  const [peixeForm, setPeixeForm] = useState<PeixeCustomer>({
    id: 0,
    peso: "",
    equipe_id: 0
  })


  useEffect(() => {
    loadCustodias()
  }, [])


  async function loadCustodias() {
    const res = await window.api.listarCustodia()

    if (!res?.success) {
      setCustodias([])
      return
    }

    setCustodias(res.data)
  }


  const filteredCustodias = custodias.filter((c) => {
    const term = searchTerm.toLowerCase()

    return (
      c.equipe?.toLowerCase().includes(term) ||
      c.campeonato?.toLowerCase().includes(term) ||
      String(c.peso).includes(term)
    )
  })

  // Paginate Test 
  const [currentPage, setCurrentPage] = useState<number>(1)
  const itemsPerPage = 5

  const totalPages = Math.ceil(filteredCustodias.length / itemsPerPage)

  const startIndex = (currentPage - 1) * itemsPerPage
  const endIndex = startIndex + itemsPerPage

  const currentItems = filteredCustodias.slice(startIndex, endIndex)


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
    // console.log(peixeForm)

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
      buttons: ['Sim', 'Não'],
      defaultId: 1,
      cancelId: 1,
      title: 'Deseja excluir?',
      message: `Tem certeza que deseja excluir este registro?`
    })

    if (resposta.response === 0) {
      await window.api.deletarPeixe(item.id)
      toast.success('Registro excluído com sucesso')
      await loadCustodias()
    }
  }


  return (
    <div className="space-y-6">

      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Custódia</h1>
          <p className="text-gray-500">Revise todos os peixes em custódia</p>
        </div>
      </div>

      <div className="bg-white rounded-xl shadow-sm border border-gray-100 overflow-hidden">

        <div className="p-4 border-b border-gray-100 flex flex-col sm:flex-row gap-4">
          <div className="relative flex-1">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
            <input
              type="text"
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              placeholder="Buscar por equipe, campeonato ou peso..."
              className="w-full pl-9 pr-4 py-2 bg-gray-50 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-100"
            />
          </div>
        </div>

        <div className="overflow-hidden">
          <table className="w-full text-sm text-left">

            <thead className="bg-gray-50 text-gray-500 font-medium border-b border-gray-100">
              <tr>
                <th className="px-6 py-3">ID</th>
                <th className="px-6 py-3">Peso</th>
                <th className="px-6 py-3">Equipe</th>
                <th className="px-6 py-3">Campeonato</th>
                <th className="px-6 py-3 text-right">Setor</th>
                <th className="px-6 py-3 text-right">Ações</th>
              </tr>
            </thead>

            <tbody className="divide-y divide-gray-100">
              {currentItems.map((item, idx) => (
                <motion.tr
                  key={item.id}
                  initial={{ opacity: 0, x: -10 }}
                  animate={{ opacity: 1, x: 0 }}
                  transition={{ delay: idx * 0.03 }}
                  className="hover:bg-blue-50/30 transition-colors"
                >

                  <td className="px-6 py-4 font-medium text-gray-900">
                    {item.id}
                  </td>

                  <td className="px-6 py-4 font-medium text-gray-900">
                    {formataPeso(Number(item.peso))}
                  </td>

                  <td className="px-6 py-4 text-gray-600">
                    {item.equipe}
                  </td>

                  <td className="px-6 py-4 text-gray-600">
                    {item.campeonato}
                  </td>

                  <td className="px-6 py-4 text-right">
                    <span className="inline-flex items-center px-2 py-1 rounded-md text-xs font-medium bg-green-100 text-green-700">
                      {item.setor}
                    </span>
                  </td>

                  <td className="px-6 py-4 text-right flex justify-end gap-2">

                    <button
                      onClick={() => handleOpenModal(item)}
                      className="inline-flex items-center justify-center w-8 h-8 rounded hover:bg-gray-100 text-blue-600"
                    >
                      <Edit2 size={16} />
                    </button>

                    <button
                      onClick={() => handleDelete(item)}
                      className="inline-flex items-center justify-center w-8 h-8 rounded hover:bg-gray-100 text-red-600"
                    >
                      <Trash2 size={16} />
                    </button>

                  </td>

                </motion.tr>
              ))}
            </tbody>

          </table>
        </div>

        {/* <div className="flex items-center justify-between mt-4">

          <button
            disabled={currentPage === 1}
            onClick={() => setCurrentPage((prev) => prev - 1)}
            className="px-3 py-1 rounded bg-gray-200 disabled:opacity-50"
          >
            Anterior
          </button>

          <span className="text-sm text-gray-600">
            Página {currentPage} de {totalPages}
          </span>

          <button
            disabled={currentPage === totalPages}
            onClick={() => setCurrentPage((prev) => prev + 1)}
            className="px-3 py-1 rounded bg-gray-200 disabled:opacity-50"
          >
            Próxima
          </button>

        </div> */}

        <div className="flex gap-2 mt-4 justify-center">
          {Array.from({ length: totalPages }, (_, i) => i + 1).map((page) => (
            <button
              key={page}
              onClick={() => setCurrentPage(page)}
              className={`px-3 py-1 rounded ${currentPage === page
                ? "bg-blue-600 text-white"
                : "bg-gray-200"
                }`}
            >
              {page}
            </button>
          ))}
        </div>


        <div className="p-4 border-t border-gray-100 text-sm text-gray-500">
          {/* Mostrando {currentItems.length} de {custodias.length} registros */}
          Mostrando{" "}
          {filteredCustodias.length === 0 ? 0 : startIndex + 1}
          {" "}a{" "}
          {Math.min(endIndex, filteredCustodias.length)}
          {" "}de {filteredCustodias.length} registros
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
                <h2 className="text-xl font-bold">
                  Editar peixe
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
                    Peso
                  </label>

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
                  >
                    Cancelar
                  </button>

                  <button
                    onClick={handleSave}
                    className="flex-1 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors shadow-md"
                  >
                    Salvar alterações
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