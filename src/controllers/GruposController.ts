import { ipcMain } from 'electron'
import { GrupoModel } from '../models/GrupoModel'
import DatabaseConstructor from 'better-sqlite3'
import { NewGroupCustomer } from '../shared/types/interfaces'

export class GruposController {
  private model: GrupoModel
  private db: InstanceType<typeof DatabaseConstructor>

  constructor(db: InstanceType<typeof DatabaseConstructor>) {
    this.db = db
    this.model = new GrupoModel(db)
    this.registrarRotas()
  }

  private registrarRotas() {
    ipcMain.handle('listarGrupos', async () => {
      try {
        // console.log(this.model.listar())
        return this.model.listar()
      } catch (error) {
        console.error('Erro ao listar membors:', error)
        throw error
      }
    })

    ipcMain.handle('addNovoGrupo', (_,doc: NewGroupCustomer) => {
      try {
        return {
          success: true, 
          data: this.model.add(doc)
        }
      } catch (error) {
        console.error('Erro ao adcionar novo grupo:', error)
        throw error
      }
    })
  }
}
