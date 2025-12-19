import { ipcMain } from 'electron'
import { UsuarioModel } from '../models/UsuarioModel'
import DatabaseConstructor from 'better-sqlite3'

export class UsuariosController {
  private model: UsuarioModel
  private db: InstanceType<typeof DatabaseConstructor>

  constructor(db: InstanceType<typeof DatabaseConstructor>) {
    this.db = db
    this.model = new UsuarioModel(db)
    this.registrarRotas()
  }

  private registrarRotas() {
    ipcMain.handle('listarUsuarios', async () => {
      try {
        // console.log(this.model.listar())
        return this.model.listar()
      } catch (error) {
        console.error('Erro ao listar usuários:', error)
        throw error
      }
    })

    ipcMain.handle('auth:login', async (_event, { usuario, senha }) => {
      try {
        const stmt = this.db.prepare(`
          SELECT id, nome, usuario, senha
          FROM usuarios
          WHERE usuario = ?
          LIMIT 1
        `)

        const user = stmt.get(usuario) as
          | { id: number; nome: string; usuario: string; senha: string }
          | undefined

        if (!user) {
          return { success: false, message: 'Usuário não encontrado' }
        }

        if (user.senha !== senha) {
          return { success: false, message: 'Senha incorreta' }
        }

        const { senha: _senha, ...userSemSenha } = user

        return {
          success: true,
          user: userSemSenha
        }
      } catch (error) {
        console.error('Erro no login:', error)
        return { success: false, message: 'Erro interno' }
      }
    })   
  }
}
