import { useEffect, useMemo, useState } from 'react'
import { Building2, KeyRound, Save, ShieldCheck, UserCog, RefreshCcw } from 'lucide-react'
import { toast } from 'sonner'
import { AuthUserCustomer } from '~/src/shared/types/interfaces'

type ConfigFormState = {
  empresa_nome: string
  cnpj: string
  endereco: string
  telefone: string
  email: string
  licenca_chave: string
  licenca_ativa: number
  licenca_ultima_verificacao_em: string | null
  usuario_acesso_id: number | null
  usuario_acesso_nome: string
  usuario_acesso_login: string
  usuario_acesso_senha: string
}

const initialState: ConfigFormState = {
  empresa_nome: '',
  cnpj: '',
  endereco: '',
  telefone: '',
  email: '',
  licenca_chave: '',
  licenca_ativa: 0,
  licenca_ultima_verificacao_em: null,
  usuario_acesso_id: null,
  usuario_acesso_nome: '',
  usuario_acesso_login: '',
  usuario_acesso_senha: ''
}

function parseDateTime(value: string | null): Date | null {
  if (!value) return null

  const normalized = String(value).trim()
  const match = normalized.match(
    /^(\d{4})-(\d{2})-(\d{2})(?:[ T](\d{2}):(\d{2})(?::(\d{2}))?)?$/
  )

  if (match) {
    const year = Number(match[1])
    const month = Number(match[2]) - 1
    const day = Number(match[3])
    const hour = Number(match[4] ?? '0')
    const minute = Number(match[5] ?? '0')
    const second = Number(match[6] ?? '0')
    return new Date(year, month, day, hour, minute, second)
  }

  const fallback = new Date(normalized)
  if (Number.isNaN(fallback.getTime())) {
    return null
  }

  return fallback
}

function formatDateTime(value: string | null): string {
  const date = parseDateTime(value)
  if (!date) {
    return value || '-'
  }

  return date.toLocaleString('pt-BR')
}

export default function ConfiguracoesSistema({ usuario }: { usuario: AuthUserCustomer }) {
  const [loading, setLoading] = useState(false)
  const [saving, setSaving] = useState(false)
  const [activatingLicense, setActivatingLicense] = useState(false)
  const [validatingLicense, setValidatingLicense] = useState(false)
  const [licenseStatus, setLicenseStatus] = useState('')
  const [licenseServerMessage, setLicenseServerMessage] = useState('')
  const [licenseExpiresAt, setLicenseExpiresAt] = useState<string | null>(null)
  const [licenseServerTime, setLicenseServerTime] = useState<string | null>(null)
  const [form, setForm] = useState<ConfigFormState>(initialState)

  const licenseRemainingDays = useMemo(() => {
    const expiresDate = parseDateTime(licenseExpiresAt)
    if (!expiresDate) return null

    const nowDate = parseDateTime(licenseServerTime) ?? new Date()
    const diffMs = expiresDate.getTime() - nowDate.getTime()

    if (diffMs <= 0) return 0
    return Math.ceil(diffMs / (1000 * 60 * 60 * 24))
  }, [licenseExpiresAt, licenseServerTime])

  useEffect(() => {
    carregarConfiguracoes()
  }, [])

  async function carregarConfiguracoes() {
    try {
      setLoading(true)
      const response = await window.api.obterConfiguracaoSistema(usuario.id)

      if (!response?.success) {
        toast.error(response?.message || 'Nao foi possivel carregar as configuracoes.')
        return
      }

      const data = response.data

      setForm({
        empresa_nome: data.empresa_nome ?? '',
        cnpj: data.cnpj ?? '',
        endereco: data.endereco ?? '',
        telefone: data.telefone ?? '',
        email: data.email ?? '',
        licenca_chave: data.licenca_chave ?? '',
        licenca_ativa: Number(data.licenca_ativa ?? 0),
        licenca_ultima_verificacao_em: data.licenca_ultima_verificacao_em ?? null,
        usuario_acesso_id: data.usuario_acesso_id,
        usuario_acesso_nome: data.usuario_acesso_nome ?? '',
        usuario_acesso_login: data.usuario_acesso_login ?? '',
        usuario_acesso_senha: ''
      })
    } catch (error) {
      console.error('Erro ao carregar configuracoes:', error)
      toast.error('Erro ao carregar configuracoes do sistema.')
    } finally {
      setLoading(false)
    }
  }

  function validarFormulario(): boolean {
    if (!form.empresa_nome.trim()) {
      toast.error('Informe o nome da empresa.')
      return false
    }

    if (!form.cnpj.trim()) {
      toast.error('Informe o CNPJ.')
      return false
    }

    if (!form.endereco.trim()) {
      toast.error('Informe o endereco.')
      return false
    }

    if (!form.usuario_acesso_nome.trim()) {
      toast.error('Informe o nome do usuario de acesso.')
      return false
    }

    if (!form.usuario_acesso_login.trim()) {
      toast.error('Informe o login do usuario de acesso.')
      return false
    }

    if (!form.usuario_acesso_senha.trim()) {
      toast.error('Informe a senha do usuario de acesso para salvar.')
      return false
    }

    return true
  }

  async function salvarConfiguracoes() {
    if (!validarFormulario()) {
      return
    }

    try {
      setSaving(true)

      const response = await window.api.salvarConfiguracaoSistema({
        actor_user_id: usuario.id,
        empresa_nome: form.empresa_nome,
        cnpj: form.cnpj,
        endereco: form.endereco,
        telefone: form.telefone,
        email: form.email,
        licenca_chave: form.licenca_chave,
        access_user: {
          id: form.usuario_acesso_id,
          nome: form.usuario_acesso_nome,
          usuario: form.usuario_acesso_login,
          senha: form.usuario_acesso_senha
        }
      })

      if (!response?.success) {
        toast.error(response?.message || 'Nao foi possivel salvar as configuracoes.')
        return
      }

      toast.success('Configuracoes do sistema salvas com sucesso.')

      const data = response.data
      setForm((prev) => ({
        ...prev,
        licenca_ativa: Number(data.licenca_ativa ?? 0),
        licenca_chave: data.licenca_chave ?? prev.licenca_chave,
        licenca_ultima_verificacao_em:
          data.licenca_ultima_verificacao_em ?? prev.licenca_ultima_verificacao_em,
        usuario_acesso_id: data.usuario_acesso_id,
        usuario_acesso_nome: data.usuario_acesso_nome ?? prev.usuario_acesso_nome,
        usuario_acesso_login: data.usuario_acesso_login ?? prev.usuario_acesso_login,
        usuario_acesso_senha: ''
      }))
    } catch (error) {
      console.error('Erro ao salvar configuracoes:', error)
      toast.error('Erro ao salvar configuracoes do sistema.')
    } finally {
      setSaving(false)
    }
  }

  async function ativarLicenca() {
    if (!form.licenca_chave.trim()) {
      toast.error('Informe a chave de licenca antes de ativar.')
      return
    }

    try {
      setActivatingLicense(true)

      const response = await window.api.ativarLicencaSistema({
        actor_user_id: usuario.id,
        licenca_chave: form.licenca_chave
      })

      if (!response?.success) {
        toast.error(response?.message || 'Nao foi possivel ativar a licenca.')
        if (response?.status) {
          setLicenseStatus(String(response.status))
        }
        if (response?.message) {
          setLicenseServerMessage(String(response.message))
        }
        return
      }

      toast.success(response?.message || 'Licenca ativada com sucesso.')

      const data = response.data
      setForm((prev) => ({
        ...prev,
        licenca_ativa: Number(data.licenca_ativa ?? 0),
        licenca_chave: data.licenca_chave ?? prev.licenca_chave,
        licenca_ultima_verificacao_em:
          data.licenca_ultima_verificacao_em ?? prev.licenca_ultima_verificacao_em
      }))

      setLicenseStatus(String(response?.status || 'ACTIVE'))
      setLicenseServerMessage(String(response?.message || 'Licenca ativada com sucesso.'))
      setLicenseExpiresAt(response?.expires_at ? String(response.expires_at) : null)
      setLicenseServerTime(response?.server_time ? String(response.server_time) : null)
    } catch (error) {
      console.error('Erro ao ativar licenca:', error)
      toast.error('Erro ao ativar licenca.')
    } finally {
      setActivatingLicense(false)
    }
  }

  async function validarLicencaNoServidor() {
    try {
      setValidatingLicense(true)

      const response = await window.api.validarLicencaSistema({
        actor_user_id: usuario.id
      })

      if (!response?.success) {
        toast.error(response?.message || 'Nao foi possivel validar a licenca.')
      } else {
        toast.success(response?.message || 'Licenca validada com sucesso.')
      }

      if (response?.data) {
        const data = response.data
        setForm((prev) => ({
          ...prev,
          licenca_ativa: Number(data.licenca_ativa ?? prev.licenca_ativa),
          licenca_chave: data.licenca_chave ?? prev.licenca_chave,
          licenca_ultima_verificacao_em:
            data.licenca_ultima_verificacao_em ?? prev.licenca_ultima_verificacao_em
        }))
      }

      setLicenseStatus(String(response?.status || 'UNKNOWN'))
      setLicenseServerMessage(String(response?.message || ''))
      setLicenseExpiresAt(response?.expires_at ? String(response.expires_at) : null)
      setLicenseServerTime(response?.server_time ? String(response.server_time) : null)
    } catch (error) {
      console.error('Erro ao validar licenca:', error)
      toast.error('Erro ao validar licenca no servidor.')
    } finally {
      setValidatingLicense(false)
    }
  }

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-gray-900">Configuracoes do Sistema</h1>
        <p className="text-gray-500">Area exclusiva do usuario master para administracao da instalacao.</p>
      </div>

      {loading && <p className="text-sm text-gray-500">Carregando configuracoes...</p>}

      <div className="grid grid-cols-1 xl:grid-cols-2 gap-6">
        <section className="bg-white rounded-xl shadow-sm border border-gray-100 p-5 space-y-4">
          <div className="flex items-center gap-2 text-gray-900">
            <Building2 className="w-5 h-5 text-blue-600" />
            <h2 className="text-lg font-semibold">Dados da Empresa</h2>
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Nome da empresa</label>
            <input
              type="text"
              value={form.empresa_nome}
              onChange={(e) => setForm((prev) => ({ ...prev, empresa_nome: e.target.value }))}
              className="w-full border border-gray-300 rounded-lg p-2 focus:ring-2 focus:ring-blue-200 focus:outline-none"
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">CNPJ</label>
            <input
              type="text"
              value={form.cnpj}
              onChange={(e) => setForm((prev) => ({ ...prev, cnpj: e.target.value }))}
              className="w-full border border-gray-300 rounded-lg p-2 focus:ring-2 focus:ring-blue-200 focus:outline-none"
              placeholder="00.000.000/0000-00"
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Endereco</label>
            <input
              type="text"
              value={form.endereco}
              onChange={(e) => setForm((prev) => ({ ...prev, endereco: e.target.value }))}
              className="w-full border border-gray-300 rounded-lg p-2 focus:ring-2 focus:ring-blue-200 focus:outline-none"
            />
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Telefone</label>
              <input
                type="text"
                value={form.telefone}
                onChange={(e) => setForm((prev) => ({ ...prev, telefone: e.target.value }))}
                className="w-full border border-gray-300 rounded-lg p-2 focus:ring-2 focus:ring-blue-200 focus:outline-none"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Email</label>
              <input
                type="email"
                value={form.email}
                onChange={(e) => setForm((prev) => ({ ...prev, email: e.target.value }))}
                className="w-full border border-gray-300 rounded-lg p-2 focus:ring-2 focus:ring-blue-200 focus:outline-none"
              />
            </div>
          </div>
        </section>

        <section className="bg-white rounded-xl shadow-sm border border-gray-100 p-5 space-y-4">
          <div className="flex items-center gap-2 text-gray-900">
            <UserCog className="w-5 h-5 text-blue-600" />
            <h2 className="text-lg font-semibold">Usuario de Acesso</h2>
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Nome</label>
            <input
              type="text"
              value={form.usuario_acesso_nome}
              onChange={(e) => setForm((prev) => ({ ...prev, usuario_acesso_nome: e.target.value }))}
              className="w-full border border-gray-300 rounded-lg p-2 focus:ring-2 focus:ring-blue-200 focus:outline-none"
              placeholder="Nome do usuario que vai operar o sistema"
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Login</label>
            <input
              type="text"
              value={form.usuario_acesso_login}
              onChange={(e) => setForm((prev) => ({ ...prev, usuario_acesso_login: e.target.value.toLowerCase() }))}
              className="w-full border border-gray-300 rounded-lg p-2 focus:ring-2 focus:ring-blue-200 focus:outline-none"
              placeholder="usuario"
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Senha</label>
            <input
              type="password"
              value={form.usuario_acesso_senha}
              onChange={(e) => setForm((prev) => ({ ...prev, usuario_acesso_senha: e.target.value }))}
              className="w-full border border-gray-300 rounded-lg p-2 focus:ring-2 focus:ring-blue-200 focus:outline-none"
              placeholder="Informe a senha para salvar"
            />
          </div>

          <p className="text-xs text-gray-500">
            Sempre informe a senha ao salvar para atualizar o usuario de acesso.
          </p>
        </section>

        <section className="bg-white rounded-xl shadow-sm border border-gray-100 p-5 space-y-4 xl:col-span-2">
          <div className="flex items-center gap-2 text-gray-900">
            <KeyRound className="w-5 h-5 text-blue-600" />
            <h2 className="text-lg font-semibold">Licenca do Sistema</h2>
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-[1fr_auto_auto] gap-3">
            <input
              type="text"
              value={form.licenca_chave}
              onChange={(e) => setForm((prev) => ({ ...prev, licenca_chave: e.target.value.toUpperCase() }))}
              className="w-full border border-gray-300 rounded-lg p-2 focus:ring-2 focus:ring-blue-200 focus:outline-none"
              placeholder="CHAVE-DA-LICENCA"
            />

            <button
              type="button"
              onClick={ativarLicenca}
              disabled={activatingLicense}
              className="inline-flex items-center justify-center gap-2 px-4 py-2 rounded-lg bg-emerald-600 hover:bg-emerald-700 text-white disabled:opacity-50"
            >
              <ShieldCheck className="w-4 h-4" />
              {activatingLicense ? 'Ativando...' : 'Ativar Licenca'}
            </button>

            <button
              type="button"
              onClick={validarLicencaNoServidor}
              disabled={validatingLicense}
              className="inline-flex items-center justify-center gap-2 px-4 py-2 rounded-lg bg-slate-700 hover:bg-slate-800 text-white disabled:opacity-50"
            >
              <RefreshCcw className="w-4 h-4" />
              {validatingLicense ? 'Validando...' : 'Validar Licenca'}
            </button>
          </div>

          <div className="text-sm">
            Status atual:{' '}
            <span className={form.licenca_ativa === 1 ? 'text-emerald-600 font-semibold' : 'text-red-600 font-semibold'}>
              {form.licenca_ativa === 1 ? 'Ativa' : 'Inativa'}
            </span>
          </div>

          <div className="text-sm text-gray-600">
            Ultima validacao online:{' '}
            <span className="font-semibold text-gray-800">
              {formatDateTime(form.licenca_ultima_verificacao_em)}
            </span>
          </div>

          {(licenseStatus || licenseServerMessage || licenseExpiresAt || licenseServerTime) && (
            <div className="text-sm text-gray-600 space-y-1">
              {licenseStatus && (
                <p>
                  Status servidor: <span className="font-semibold text-gray-800">{licenseStatus}</span>
                </p>
              )}
              {licenseServerMessage && <p>Mensagem: {licenseServerMessage}</p>}
              {licenseExpiresAt && <p>Expira em: {formatDateTime(licenseExpiresAt)}</p>}
              {licenseExpiresAt && licenseRemainingDays !== null && (
                <p>
                  Dias restantes:{' '}
                  <span className={licenseRemainingDays > 0 ? 'font-semibold text-emerald-700' : 'font-semibold text-red-700'}>
                    {licenseRemainingDays > 0
                      ? `${licenseRemainingDays} ${licenseRemainingDays === 1 ? 'dia' : 'dias'}`
                      : '0 (expirada)'}
                  </span>
                </p>
              )}
              {licenseServerTime && <p>Horario servidor: {formatDateTime(licenseServerTime)}</p>}
            </div>
          )}
        </section>
      </div>

      <div className="flex justify-end">
        <button
          type="button"
          onClick={salvarConfiguracoes}
          disabled={saving}
          className="inline-flex items-center gap-2 px-5 py-2 rounded-lg bg-blue-600 hover:bg-blue-700 text-white disabled:opacity-50"
        >
          <Save className="w-4 h-4" />
          {saving ? 'Salvando...' : 'Salvar Configuracoes'}
        </button>
      </div>
    </div>
  )
}
