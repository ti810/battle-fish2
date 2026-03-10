import { ipcMain } from 'electron'
import DatabaseConstructor from 'better-sqlite3'
import { ConfiguracaoModel } from '../models/ConfiguracaoModel'
import { UsuarioModel } from '../models/UsuarioModel'
import { AtivarLicencaPayload, SaveSistemaConfigPayload } from '../shared/types/interfaces'
import { LicenseService } from '../main/licenseService'

export class ConfiguracaoController {
  private model: ConfiguracaoModel
  private usuarioModel: UsuarioModel
  private db: InstanceType<typeof DatabaseConstructor>
  private licenseService: LicenseService

  constructor(db: InstanceType<typeof DatabaseConstructor>, licenseService: LicenseService) {
    this.db = db
    this.model = new ConfiguracaoModel(db)
    this.usuarioModel = new UsuarioModel(db)
    this.licenseService = licenseService
    this.registrarRotas()
  }

  private validarMaster(actorUserId: number | null | undefined): { success: true } | { success: false; message: string } {
    if (!actorUserId) {
      return { success: false, message: 'Usuario nao autenticado.' }
    }

    if (!this.usuarioModel.isMaster(Number(actorUserId))) {
      return { success: false, message: 'Acesso negado. Apenas usuario master pode acessar esta tela.' }
    }

    return { success: true }
  }

  private registrarRotas() {
    ipcMain.handle('configSistema:obter', async (_event, actorUserId: number) => {
      try {
        const acl = this.validarMaster(actorUserId)

        if (!acl.success) {
          return acl
        }

        return {
          success: true,
          data: this.model.obter()
        }
      } catch (error) {
        console.error('Erro ao carregar configuracao do sistema:', error)
        return {
          success: false,
          message: 'Erro ao carregar configuracao do sistema.'
        }
      }
    })

    ipcMain.handle('configSistema:salvar', async (_event, payload: SaveSistemaConfigPayload) => {
      try {
        const acl = this.validarMaster(payload?.actor_user_id)

        if (!acl.success) {
          return acl
        }

        const accessUser = payload?.access_user

        if (!accessUser?.nome || !accessUser?.usuario || !accessUser?.senha) {
          return {
            success: false,
            message: 'Preencha nome, usuario e senha do acesso principal.'
          }
        }

        const upsertedAccessUser = this.usuarioModel.upsertAccessUser({
          id: accessUser.id,
          nome: accessUser.nome,
          usuario: accessUser.usuario,
          senha: accessUser.senha
        })

        const data = this.model.salvar({
          empresa_nome: payload.empresa_nome,
          cnpj: payload.cnpj,
          endereco: payload.endereco,
          telefone: payload.telefone,
          email: payload.email,
          licenca_chave: payload.licenca_chave,
          usuario_acesso_id: upsertedAccessUser.id
        })

        return {
          success: true,
          data
        }
      } catch (error) {
        console.error('Erro ao salvar configuracao do sistema:', error)
        return {
          success: false,
          message: error instanceof Error ? error.message : 'Erro ao salvar configuracao do sistema.'
        }
      }
    })

    ipcMain.handle('configSistema:ativarLicenca', async (_event, payload: AtivarLicencaPayload) => {
      try {
        const acl = this.validarMaster(payload?.actor_user_id)

        if (!acl.success) {
          return acl
        }

        const remote = await this.licenseService.activate(payload.licenca_chave)
        if (!remote.success || !remote.valid) {
          return {
            success: false,
            message: remote.message || 'Nao foi possivel ativar a licenca no servidor.',
            status: remote.status
          }
        }

        const data = this.model.registrarValidacaoOnlineLicenca(
          payload.licenca_chave,
          1,
          remote.serverTime
        )

        return {
          success: true,
          data,
          status: remote.status,
          expires_at: remote.expiresAt,
          token_expires_at: remote.tokenExpiresAt,
          token_status: remote.tokenStatus,
          token_source: remote.tokenSource,
          server_time: remote.serverTime,
          message: remote.message || 'Licenca ativada com sucesso.'
        }
      } catch (error) {
        console.error('Erro ao ativar licenca:', error)
        return {
          success: false,
          message: error instanceof Error ? error.message : 'Erro ao ativar licenca.'
        }
      }
    })

    ipcMain.handle('configSistema:validarLicenca', async (_event, actorUserId: number) => {
      try {
        const acl = this.validarMaster(actorUserId)
        if (!acl.success) {
          return acl
        }

        const current = this.model.obter()
        const clockRollbackDetected = this.model.isClockRollbackDetected(current)

        if (clockRollbackDetected) {
          const data = this.model.definirStatusLicenca(current.licenca_chave, 0)
          return {
            success: false,
            status: 'CLOCK_ROLLBACK',
            message: 'Licenca bloqueada: foi detectada alteracao retroativa no relogio da maquina.',
            data
          }
        }

        if (!current.licenca_chave?.trim()) {
          return {
            success: false,
            status: 'INVALID',
            message: 'Nenhuma chave de licenca cadastrada.'
          }
        }

        const remote = await this.licenseService.validate(current.licenca_chave)
        if (remote.status === 'NETWORK_ERROR' || remote.status === 'CONFIG_ERROR') {
          const expiredByWindow = this.model.isLicensePastRevalidationWindow(current)
          const data = expiredByWindow
            ? this.model.definirStatusLicenca(current.licenca_chave, 0)
            : current

          return {
            success: false,
            status: remote.status,
            message: expiredByWindow
              ? 'Licenca bloqueada: o sistema esta sem validacao online ha mais de 2 dias.'
              : remote.message,
            expires_at: remote.expiresAt,
            token_expires_at: remote.tokenExpiresAt,
            token_status: remote.tokenStatus,
            token_source: remote.tokenSource,
            server_time: remote.serverTime,
            data
          }
        }

        const shouldBeActive =
          remote.valid && (remote.status === 'ACTIVE' || remote.status === 'ACTIVE_OFFLINE')
        const data = this.model.registrarValidacaoOnlineLicenca(
          current.licenca_chave,
          shouldBeActive ? 1 : 0,
          remote.serverTime
        )

        return {
          success: remote.valid,
          status: remote.status,
          message: remote.message,
          expires_at: remote.expiresAt,
          token_expires_at: remote.tokenExpiresAt,
          token_status: remote.tokenStatus,
          token_source: remote.tokenSource,
          server_time: remote.serverTime,
          data
        }
      } catch (error) {
        console.error('Erro ao validar licenca:', error)
        return {
          success: false,
          message: error instanceof Error ? error.message : 'Erro ao validar licenca.'
        }
      }
    })
  }
}
