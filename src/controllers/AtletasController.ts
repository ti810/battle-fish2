import { ipcMain } from 'electron'
import { AtletaModel } from '../models/AtletaModel'
import DatabaseConstructor from 'better-sqlite3'

export class AtletasController {
  private model: AtletaModel
  private db: InstanceType<typeof DatabaseConstructor>

  constructor(db: InstanceType<typeof DatabaseConstructor>) {
    this.db = db
    this.model = new AtletaModel(db)
    this.registrarRotas()
  }

  private registrarRotas() {
    ipcMain.handle('listarAtletas', async () => {
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
