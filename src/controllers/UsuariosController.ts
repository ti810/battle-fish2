import { ipcMain } from 'electron'
import { UsuarioModel } from '../models/UsuarioModel'
import DatabaseConstructor from 'better-sqlite3'
import { ConfiguracaoModel } from '../models/ConfiguracaoModel'

export class UsuariosController {
  private model: UsuarioModel
  private configModel: ConfiguracaoModel
  private db: InstanceType<typeof DatabaseConstructor>

  constructor(db: InstanceType<typeof DatabaseConstructor>) {
    this.db = db
    this.model = new UsuarioModel(db)
    this.configModel = new ConfiguracaoModel(db)
    this.registrarRotas()
  }

  private registrarRotas() {
    ipcMain.handle('listarUsuarios', async (_event, actorUserId: number) => {
      try {
        if (!actorUserId) {
          return []
        }

        return this.model.listar(Number(actorUserId))
      } catch (error) {
        console.error('Erro ao listar usuarios:', error)
        throw error
      }
    })

    ipcMain.handle('usuario:alterarSenha', async (_event, payload) => {
      try {
        return this.model.alterarSenha(payload)
      } catch (error) {
        console.error('Erro ao alterar senha:', error)
        return { success: false, message: 'Erro interno ao alterar senha.' }
      }
    })

    ipcMain.handle('usuario:atualizarPerfil', async (_event, payload) => {
      try {
        return this.model.atualizarPerfil(payload)
      } catch (error) {
        console.error('Erro ao atualizar perfil de usuario:', error)
        return { success: false, message: 'Erro interno ao atualizar usuario.' }
      }
    })

    ipcMain.handle('usuario:listarLogs', async (_event, actorUserId: number) => {
      try {
        if (!actorUserId) {
          return {
            success: false,
            message: 'Usuario nao autenticado.',
            data: []
          }
        }

        return {
          success: true,
          data: this.model.listarLogs(Number(actorUserId))
        }
      } catch (error) {
        console.error('Erro ao listar logs de usuarios:', error)
        return {
          success: false,
          message: 'Erro ao listar logs de usuarios.',
          data: []
        }
      }
    })

    ipcMain.handle('auth:login', async (_event, { usuario, senha }) => {
      try {
        if (!usuario || !senha) {
          return { success: false, message: 'Informe usuario ou email e senha.' }
        }

        const credencial = String(usuario).trim()
        const candidate = this.model.buscarComSenhaPorCredencial(credencial)

        if (!candidate) {
          this.model.registrarLog({
            usuario_id: null,
            acao: 'LOGIN_FALHA',
            detalhes: `Tentativa para usuario/email inexistente: ${credencial}`
          })
          return { success: false, message: 'Usuario/email ou senha invalidos.' }
        }

        if (candidate.senha !== String(senha)) {
          this.model.registrarLog({
            usuario_id: candidate.id,
            acao: 'LOGIN_FALHA',
            detalhes: 'Senha incorreta informada no login.'
          })
          return { success: false, message: 'Usuario/email ou senha invalidos.' }
        }

        const sistemaConfig = this.configModel.obter()
        if (
          Number(candidate.is_master) !== 1
          && this.configModel.isLicensePastRevalidationWindow(sistemaConfig)
        ) {
          this.configModel.definirStatusLicenca(sistemaConfig.licenca_chave, 0)
          return {
            success: false,
            message:
              'Sistema bloqueado: a licenca esta sem validacao online ha mais de 2 dias.'
          }
        }

        if (
          Number(candidate.is_master) !== 1
          && this.configModel.isClockRollbackDetected(sistemaConfig)
        ) {
          this.configModel.definirStatusLicenca(sistemaConfig.licenca_chave, 0)
          return {
            success: false,
            message:
              'Sistema bloqueado: foi detectada alteracao retroativa no relogio da maquina.'
          }
        }

        if (Number(sistemaConfig.licenca_ativa) !== 1 && Number(candidate.is_master) !== 1) {
          return {
            success: false,
            message: 'Sistema com licenca inativa. Solicite ao usuario master a ativacao da licenca.'
          }
        }

        const user = {
          id: candidate.id,
          nome: candidate.nome,
          usuario: candidate.usuario,
          is_master: candidate.is_master
        }

        if (Number(sistemaConfig.licenca_ativa) === 1 && sistemaConfig.licenca_chave?.trim()) {
          this.configModel.registrarHorarioLocalLicenca(sistemaConfig.licenca_chave)
        }

        this.model.registrarLog({
          usuario_id: user.id,
          acao: 'LOGIN_SUCESSO',
          detalhes: 'Usuario autenticado com sucesso.'
        })

        return {
          success: true,
          user
        }
      } catch (error) {
        console.error('Erro no login:', error)
        return { success: false, message: 'Erro interno no login.' }
      }
    })
  }
}
