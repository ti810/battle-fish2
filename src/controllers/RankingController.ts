import { ipcMain } from 'electron'
import { RankingModel } from '../models/RankingModel'
import DatabaseConstructor from 'better-sqlite3'
import { success } from 'zod'

export class RankingController {
  private model: RankingModel
  private db: InstanceType<typeof DatabaseConstructor>

  constructor(db: InstanceType<typeof DatabaseConstructor>) {
    this.db = db
    this.model = new RankingModel(db)
    this.registrarRotas()
  }

  private registrarRotas() {
      ipcMain.handle('listarRanking', async () => {
        try {
          return  this.model.ranking()        
        } catch (error) {
          console.error('Erro ao listar Ranking:', error)
          throw error
        }
      })

      ipcMain.handle('ranking:autorizarRevelacao', async (_event, payload: { senha: string }) => {
        try {
          const senha = String(payload?.senha ?? '').trim()

          if (!senha) {
            return {
              success: false,
              message: 'Informe a senha.'
            }
          }

          const allowed = this.db
            .prepare(
              `
                SELECT 1
                FROM usuarios u
                LEFT JOIN configuracoes_sistema c
                  ON c.id = 1
                WHERE u.deletado_em IS NULL
                  AND u.senha = ?
                  AND (
                    u.is_master = 1
                    OR u.id = c.usuario_acesso_id
                  )
                LIMIT 1
              `
            )
            .get(senha)

          if (!allowed) {
            return {
              success: false,
              message: 'Senha invalida. Use a senha do master ou do usuario do sistema.'
            }
          }

          return {
            success: true
          }
        } catch (error) {
          console.error('Erro ao autorizar revelacao do ranking:', error)
          return {
            success: false,
            message: 'Erro ao validar senha de revelacao.'
          }
        }
      })
    }}
