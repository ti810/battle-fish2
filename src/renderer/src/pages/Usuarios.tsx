import { Shield, Lock, FileText, X, PencilLine } from 'lucide-react'
import { motion, AnimatePresence } from 'framer-motion'
import { useEffect, useMemo, useState } from 'react'
import { toast } from 'sonner'

import { AuthUserCustomer, UserCustomer, UserLogCustomer } from '~/src/shared/types/interfaces'

const SESSION_KEY = 'battlefish.auth.user'

function getSessionUser(): AuthUserCustomer | null {
  try {
    const raw = localStorage.getItem(SESSION_KEY)
    if (!raw) return null
    return JSON.parse(raw) as AuthUserCustomer
  } catch (error) {
    console.error('Erro ao ler sessao do usuario:', error)
    return null
  }
}

function formatDate(value: string): string {
  if (!value) return '-'
  const date = new Date(value)
  if (Number.isNaN(date.getTime())) return value
  return date.toLocaleString('pt-BR')
}

function isValidEmail(value: string): boolean {
  return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(value.trim())
}

export default function Usuarios() {
  const [usuarios, setUsuarios] = useState<UserCustomer[]>([])
  const [logs, setLogs] = useState<UserLogCustomer[]>([])
  const [loadingUsers, setLoadingUsers] = useState(false)
  const [loadingLogs, setLoadingLogs] = useState(false)
  const [showChangePasswordModal, setShowChangePasswordModal] = useState(false)
  const [showLogsModal, setShowLogsModal] = useState(false)
  const [showEditUserModal, setShowEditUserModal] = useState(false)
  const [savingUserEdit, setSavingUserEdit] = useState(false)
  const [editTargetUserId, setEditTargetUserId] = useState<number | null>(null)
  const [editUserForm, setEditUserForm] = useState({
    nome: '',
    usuario: '',
    email: ''
  })

  const [passwordForm, setPasswordForm] = useState({
    senha_atual: '',
    nova_senha: '',
    confirmar_senha: ''
  })

  const authUser = useMemo(() => getSessionUser(), [])

  async function listarUsuarios() {
    if (!authUser?.id) {
      setUsuarios([])
      return
    }

    try {
      setLoadingUsers(true)
      const data: UserCustomer[] = await window.api.listarUsuarios(authUser.id)
      setUsuarios(data)
    } catch (error) {
      console.error('Erro ao listar usuarios', error)
      toast.error('Erro ao carregar usuarios online.')
    } finally {
      setLoadingUsers(false)
    }
  }

  async function carregarLogs() {
    if (!authUser?.id) {
      setLogs([])
      return
    }

    try {
      setLoadingLogs(true)
      const response = await window.api.listarLogsUsuarios(authUser.id)

      if (!response?.success) {
        toast.error(response?.message || 'Erro ao carregar logs.')
        setLogs([])
        return
      }

      setLogs(response.data ?? [])
    } catch (error) {
      console.error('Erro ao carregar logs', error)
      toast.error('Erro ao carregar logs de atividades.')
      setLogs([])
    } finally {
      setLoadingLogs(false)
    }
  }

  function abrirEdicaoUsuario(item: UserCustomer) {
    setEditTargetUserId(item.id)
    setEditUserForm({
      nome: item.nome || '',
      usuario: item.usuario || '',
      email: item.email || ''
    })
    setShowEditUserModal(true)
  }

  function fecharEdicaoUsuario() {
    setShowEditUserModal(false)
    setEditTargetUserId(null)
    setEditUserForm({ nome: '', usuario: '', email: '' })
  }

  async function handleSalvarUsuario() {
    if (!authUser?.id || !editTargetUserId) {
      toast.error('Sessao invalida. Faca login novamente.')
      return
    }

    const nome = editUserForm.nome.trim()
    const usuario = editUserForm.usuario.trim().toLowerCase()
    const email = editUserForm.email.trim().toLowerCase()

    if (!nome || !usuario || !email) {
      toast.error('Preencha nome, login e email.')
      return
    }

    if (!isValidEmail(email)) {
      toast.error('Informe um email valido.')
      return
    }

    try {
      setSavingUserEdit(true)
      const response = await window.api.atualizarPerfilUsuario({
        actor_user_id: authUser.id,
        target_user_id: editTargetUserId,
        nome,
        usuario,
        email
      })

      if (!response?.success) {
        toast.error(response?.message || 'Nao foi possivel atualizar o usuario.')
        return
      }

      toast.success('Usuario atualizado com sucesso.')
      fecharEdicaoUsuario()
      await listarUsuarios()
      await carregarLogs()
    } catch (error) {
      console.error('Erro ao salvar usuario', error)
      toast.error('Erro ao salvar usuario.')
    } finally {
      setSavingUserEdit(false)
    }
  }

  async function handleChangePassword() {
    if (!authUser?.id) {
      toast.error('Sessao invalida. Faca login novamente.')
      return
    }

    if (!passwordForm.senha_atual || !passwordForm.nova_senha || !passwordForm.confirmar_senha) {
      toast.error('Preencha todos os campos de senha.')
      return
    }

    if (passwordForm.nova_senha.length < 4) {
      toast.error('A nova senha deve ter no minimo 4 caracteres.')
      return
    }

    if (passwordForm.nova_senha !== passwordForm.confirmar_senha) {
      toast.error('A confirmacao de senha nao confere.')
      return
    }

    const response = await window.api.alterarSenhaUsuario({
      actor_user_id: authUser.id,
      senha_atual: passwordForm.senha_atual,
      nova_senha: passwordForm.nova_senha
    })

    if (!response?.success) {
      toast.error(response?.message || 'Nao foi possivel alterar a senha.')
      return
    }

    toast.success('Senha alterada com sucesso.')
    setShowChangePasswordModal(false)
    setPasswordForm({ senha_atual: '', nova_senha: '', confirmar_senha: '' })
    await carregarLogs()
  }

  useEffect(() => {
    listarUsuarios()
  }, [])

  return (
    <div className="max-w-5xl mx-auto space-y-8">
      <div>
        <h1 className="text-2xl font-bold text-gray-900">Usuarios</h1>
        <p className="text-gray-500">Visualize usuarios online e gerencie seguranca.</p>
      </div>

      <div className="grid md:grid-cols-2 gap-6">
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
              <h3 className="font-bold text-gray-900">Usuarios online</h3>
              <p className="text-sm text-gray-500">Acesso ativo no sistema</p>
            </div>
          </div>

          {loadingUsers && <p className="text-sm text-gray-500">Carregando usuarios...</p>}

          <div className="space-y-3">
            {usuarios.map((item) => (
              <div key={item.id} className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
                <div className="flex items-center gap-3">
                  <div className="w-8 h-8 bg-blue-600 text-white rounded-full flex items-center justify-center font-bold text-xs uppercase">
                    {item.nome?.charAt(0) || 'U'}
                  </div>

                  <div>
                    <p className="text-sm font-medium">{item.nome}</p>
                    <p className="text-xs text-gray-500">@{item.usuario || '-'}</p>
                    <p className="text-xs text-gray-500">{item.email || '-'}</p>
                  </div>
                </div>

                <div className="flex items-center gap-2">
                  <button
                    type="button"
                    onClick={() => abrirEdicaoUsuario(item)}
                    className="text-xs px-2 py-1 border border-gray-300 rounded hover:bg-gray-100 inline-flex items-center gap-1"
                  >
                    <PencilLine className="w-3 h-3" />
                    Editar
                  </button>
                  <span className="text-xs bg-blue-100 text-blue-700 px-2 py-1 rounded">Online</span>
                </div>
              </div>
            ))}

            {!loadingUsers && usuarios.length === 0 && (
              <div className="text-sm text-gray-500">Nenhum usuario ativo encontrado.</div>
            )}
          </div>
        </motion.div>
      </div>

      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ delay: 0.2 }}
        className="bg-white p-6 rounded-xl shadow-sm border border-gray-100"
      >
        <h3 className="font-bold text-gray-900 mb-4">Seguranca do Sistema</h3>
        <div className="grid md:grid-cols-2 gap-4">
          <button
            type="button"
            onClick={() => setShowChangePasswordModal(true)}
            className="text-left p-4 border border-gray-100 rounded-lg hover:border-blue-200 transition-colors"
          >
            <Lock className="w-5 h-5 text-gray-400 mb-2" />
            <p className="font-medium text-sm">Alterar Senha</p>
            <p className="text-xs text-gray-500 mt-1">Atualize sua senha de acesso.</p>
          </button>

          <button
            type="button"
            onClick={async () => {
              await carregarLogs()
              setShowLogsModal(true)
            }}
            className="text-left p-4 border border-gray-100 rounded-lg hover:border-blue-200 transition-colors"
          >
            <FileText className="w-5 h-5 text-gray-400 mb-2" />
            <p className="font-medium text-sm">Logs de Atividades</p>
            <p className="text-xs text-gray-500 mt-1">Historico de login e alteracoes de senha.</p>
          </button>
        </div>
      </motion.div>

      <AnimatePresence>
        {showEditUserModal && (
          <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
            <motion.div
              initial={{ scale: 0.95, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0.95, opacity: 0 }}
              className="bg-white rounded-xl shadow-2xl max-w-md w-full p-6"
            >
              <div className="flex items-center justify-between mb-4">
                <h2 className="text-xl font-bold">Editar Usuario</h2>
                <button type="button" onClick={fecharEdicaoUsuario} className="text-gray-500 hover:text-gray-700">
                  <X className="w-5 h-5" />
                </button>
              </div>

              <div className="space-y-3">
                <input
                  type="text"
                  value={editUserForm.nome}
                  onChange={(e) => setEditUserForm((prev) => ({ ...prev, nome: e.target.value }))}
                  className="w-full border border-gray-300 rounded-lg p-2 focus:ring-2 focus:ring-blue-200 focus:outline-none"
                  placeholder="Nome"
                />

                <input
                  type="text"
                  value={editUserForm.usuario}
                  onChange={(e) => setEditUserForm((prev) => ({ ...prev, usuario: e.target.value }))}
                  className="w-full border border-gray-300 rounded-lg p-2 focus:ring-2 focus:ring-blue-200 focus:outline-none"
                  placeholder="Login"
                />

                <input
                  type="email"
                  value={editUserForm.email}
                  onChange={(e) => setEditUserForm((prev) => ({ ...prev, email: e.target.value }))}
                  className="w-full border border-gray-300 rounded-lg p-2 focus:ring-2 focus:ring-blue-200 focus:outline-none"
                  placeholder="Email"
                />
              </div>

              <div className="flex gap-2 mt-5">
                <button
                  type="button"
                  onClick={fecharEdicaoUsuario}
                  className="flex-1 border border-gray-300 rounded-lg p-2 hover:bg-gray-50"
                >
                  Cancelar
                </button>
                <button
                  type="button"
                  onClick={handleSalvarUsuario}
                  disabled={savingUserEdit}
                  className="flex-1 bg-blue-600 hover:bg-blue-700 text-white rounded-lg p-2 disabled:opacity-60"
                >
                  {savingUserEdit ? 'Salvando...' : 'Salvar'}
                </button>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>

      <AnimatePresence>
        {showChangePasswordModal && (
          <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
            <motion.div
              initial={{ scale: 0.95, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0.95, opacity: 0 }}
              className="bg-white rounded-xl shadow-2xl max-w-md w-full p-6"
            >
              <div className="flex items-center justify-between mb-4">
                <h2 className="text-xl font-bold">Alterar Senha</h2>
                <button
                  type="button"
                  onClick={() => setShowChangePasswordModal(false)}
                  className="text-gray-500 hover:text-gray-700"
                >
                  <X className="w-5 h-5" />
                </button>
              </div>

              <div className="space-y-3">
                <input
                  type="password"
                  value={passwordForm.senha_atual}
                  onChange={(e) => setPasswordForm((prev) => ({ ...prev, senha_atual: e.target.value }))}
                  className="w-full border border-gray-300 rounded-lg p-2 focus:ring-2 focus:ring-blue-200 focus:outline-none"
                  placeholder="Senha atual"
                />

                <input
                  type="password"
                  value={passwordForm.nova_senha}
                  onChange={(e) => setPasswordForm((prev) => ({ ...prev, nova_senha: e.target.value }))}
                  className="w-full border border-gray-300 rounded-lg p-2 focus:ring-2 focus:ring-blue-200 focus:outline-none"
                  placeholder="Nova senha"
                />

                <input
                  type="password"
                  value={passwordForm.confirmar_senha}
                  onChange={(e) => setPasswordForm((prev) => ({ ...prev, confirmar_senha: e.target.value }))}
                  className="w-full border border-gray-300 rounded-lg p-2 focus:ring-2 focus:ring-blue-200 focus:outline-none"
                  placeholder="Confirmar nova senha"
                />
              </div>

              <div className="flex gap-2 mt-5">
                <button
                  type="button"
                  onClick={() => setShowChangePasswordModal(false)}
                  className="flex-1 border border-gray-300 rounded-lg p-2 hover:bg-gray-50"
                >
                  Cancelar
                </button>
                <button
                  type="button"
                  onClick={handleChangePassword}
                  className="flex-1 bg-blue-600 hover:bg-blue-700 text-white rounded-lg p-2"
                >
                  Salvar
                </button>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>

      <AnimatePresence>
        {showLogsModal && (
          <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
            <motion.div
              initial={{ scale: 0.95, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0.95, opacity: 0 }}
              className="bg-white rounded-xl shadow-2xl max-w-3xl w-full p-6"
            >
              <div className="flex items-center justify-between mb-4">
                <h2 className="text-xl font-bold">Logs de Atividades</h2>
                <button
                  type="button"
                  onClick={() => setShowLogsModal(false)}
                  className="text-gray-500 hover:text-gray-700"
                >
                  <X className="w-5 h-5" />
                </button>
              </div>

              <div className="max-h-[60vh] overflow-auto border border-gray-100 rounded-lg">
                {loadingLogs && <p className="p-4 text-sm text-gray-500">Carregando logs...</p>}

                {!loadingLogs && logs.length === 0 && (
                  <p className="p-4 text-sm text-gray-500">Nenhum log disponivel.</p>
                )}

                {!loadingLogs && logs.length > 0 && (
                  <table className="w-full text-sm">
                    <thead className="bg-gray-50 text-gray-500">
                      <tr>
                        <th className="text-left px-4 py-2">Data/Hora</th>
                        <th className="text-left px-4 py-2">Usuario</th>
                        <th className="text-left px-4 py-2">Acao</th>
                        <th className="text-left px-4 py-2">Detalhes</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-gray-100">
                      {logs.map((log) => (
                        <tr key={log.id}>
                          <td className="px-4 py-2 text-gray-600">{formatDate(log.criado_em)}</td>
                          <td className="px-4 py-2 text-gray-700">{log.usuario_nome || '-'} ({log.usuario_login || '-'})</td>
                          <td className="px-4 py-2 font-medium text-gray-900">{log.acao}</td>
                          <td className="px-4 py-2 text-gray-600">{log.detalhes || '-'}</td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                )}
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>
    </div>
  )
}
