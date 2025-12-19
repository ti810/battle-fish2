import { Shield, User, Lock, Key } from 'lucide-react';
import { motion } from 'framer-motion';
import { useEffect, useState, useCallback, useRef } from 'react';

import { UserCustomer } from '~/src/shared/types/interfaces';

export default function Usuarios() {

  const ran = useRef(false)

  const [usuarios, setUsuarios] = useState<UserCustomer[]>([])
  const [loading, setLoading] = useState(false)

  async function listarUsuarios() {

    try {

      setLoading(true)
      const data: UserCustomer[] = await window.api.listarUsuarios()
      setUsuarios(data)

    } catch (error) {
      console.log("Erro", error)
    } finally {
      setLoading(false)
    }


  }

  useEffect(() => {
    //  if (ran.current) return
    // ran.current = true
    listarUsuarios()
  }, [])

  useEffect(() => {
    console.log(usuarios)
  }, [usuarios])







  return (
    <div className="max-w-4xl mx-auto space-y-8">
      <div>
        <h1 className="text-2xl font-bold text-gray-900">Gerenciamento de Usuários</h1>
        <p className="text-gray-500">Configure os acessos ao sistema</p>
      </div>

      {/* <button onClick={listarUsuarios} className="w-full py-2 border border-dashed border-gray-300 rounded-lg text-gray-500 text-sm hover:bg-gray-50 hover:border-blue-300 hover:text-blue-600 transition-all">
        + Adicionar Usuario
      </button> */}

      <div className="grid md:grid-cols-2 gap-6">
        {/* Admin Card */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="bg-white p-6 rounded-xl shadow-sm border border-gray-100"
        >
          <div className="flex items-center gap-4 mb-6">
            <div className="p-3 bg-blue-100 text-blue-600 rounded-lg">
              <Shield className="w-6 h-6" />
            </div>
            <div>
              <h3 className="font-bold text-gray-900">Administradores</h3>
              <p className="text-sm text-gray-500">Acesso total ao sistema</p>
            </div>
          </div>

          <div className="space-y-12">
            {usuarios.map((item) => (          

              <div key={item.id} className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
                <div className="flex items-center gap-3">
                  <div className="w-8 h-8 bg-blue-600 text-white rounded-full flex items-center justify-center font-bold text-xs">AD</div>
                  <div>
                    <p className="text-sm font-medium">{item.nome}</p>
                    <p className="text-xs text-gray-500">{item.email}</p>
                  </div>
                </div>
                <span className="text-xs bg-blue-100 text-blue-700 px-2 py-1 rounded">Online</span>
              </div>

            ))}
            <button className="w-full py-2 border border-dashed border-gray-300 rounded-lg text-gray-500 text-sm hover:bg-gray-50 hover:border-blue-300 hover:text-blue-600 transition-all">
              + Adicionar Administrador
            </button>
          </div>
        </motion.div>
        
      </div>

      {/* Security Section */}
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ delay: 0.2 }}
        className="bg-white p-6 rounded-xl shadow-sm border border-gray-100"
      >
        <h3 className="font-bold text-gray-900 mb-4">Segurança do Sistema</h3>
        <div className="grid md:grid-cols-3 gap-4">
          <div className="p-4 border border-gray-100 rounded-lg hover:border-blue-200 transition-colors cursor-pointer">
            <Lock className="w-5 h-5 text-gray-400 mb-2" />
            <p className="font-medium text-sm">Alterar Senha</p>
          </div>
          <div className="p-4 border border-gray-100 rounded-lg hover:border-blue-200 transition-colors cursor-pointer">
            <User className="w-5 h-5 text-gray-400 mb-2" />
            <p className="font-medium text-sm">Log de Atividades</p>
          </div>
        </div>
      </motion.div>
    </div>
  );
}
