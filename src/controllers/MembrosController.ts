import { ipcMain } from 'electron'
import { MembroModel } from '../models/MembroModel'
import DatabaseConstructor from 'better-sqlite3'

export class MembrosController {
  private model: MembroModel
  private db: InstanceType<typeof DatabaseConstructor>

  constructor(db: InstanceType<typeof DatabaseConstructor>) {
    this.db = db
    this.model = new MembroModel(db)
    this.registrarRotas()
  }

  private registrarRotas() {
    ipcMain.handle('listarMembros', async () => {
      try {
        // console.log(this.model.listar())
        return this.model.listar()
      } catch (error) {
        console.error('Erro ao listar membors:', error)
        throw error
      }
    })
      
  }
}
