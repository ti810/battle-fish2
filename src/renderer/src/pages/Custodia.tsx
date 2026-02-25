import { useEffect, useState, useMemo } from 'react'
import { UserPlus, Search, Edit2, Trash2, X } from 'lucide-react'
import { motion, AnimatePresence } from 'framer-motion'
import { CustodiaCustomer} from '~/src/shared/types/interfaces'
import { agoraParaSQLite } from '../lib/utils'



export default function Custodia() {
  const [custodias, setCustodias] = useState<CustodiaCustomer[]>([])
  const [searchTerm, setSearchTerm] = useState('')

  useEffect(() => {
    loadCustodias()
  }, [])

  async function loadCustodias() {
    console.log("api:", window.api)
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

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Custódia</h1>
          <p className="text-gray-500">
            Revise todos os peixes em custódia
          </p>
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

        <div className="overflow-x-auto">
          <table className="w-full text-sm text-left">
            <thead className="bg-gray-50 text-gray-500 font-medium border-b border-gray-100">
              <tr>
                <th className="px-6 py-3">Peso</th>
                <th className="px-6 py-3">Equipe</th>
                <th className="px-6 py-3">Campeonato</th>
                <th className="px-6 py-3 text-right">Setor</th>
              </tr>
            </thead>

            <tbody className="divide-y divide-gray-100">
              {filteredCustodias.map((item, idx) => (
                <motion.tr
                  key={item.id}
                  initial={{ opacity: 0, x: -10 }}
                  animate={{ opacity: 1, x: 0 }}
                  transition={{ delay: idx * 0.03 }}
                  className="hover:bg-blue-50/30 transition-colors"
                >
                  <td className="px-6 py-4 font-medium text-gray-900">
                    {item.peso}
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
                </motion.tr>
              ))}
            </tbody>
          </table>
        </div>

        <div className="p-4 border-t border-gray-100 text-sm text-gray-500">
          Mostrando {filteredCustodias.length} de {custodias.length} registros
        </div>
      </div>
    </div>
  )
}
