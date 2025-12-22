import { ipcMain } from 'electron'
import { PeixeModel } from '../models/PeixeModel'
import DatabaseConstructor from 'better-sqlite3'
import { NewPeixe } from '../shared/types/interfaces'

export class PeixesController {
  private model: PeixeModel
  private db: InstanceType<typeof DatabaseConstructor>

  constructor(db: InstanceType<typeof DatabaseConstructor>) {
    this.db = db
    this.model = new PeixeModel(db)
    this.registrarRotas()
  }

  private registrarRotas(): void {
    ipcMain.handle('listarPeixes', async () => {
      try {
        // console.log(this.model.listar())
        return this.model.listar()
      } catch (error) {
        console.error('Erro ao listar membros:', error)
        throw error
      }
    })

    ipcMain.handle('addNovoPeixe', (_, doc: NewPeixe) => {
      try {
        return {
          success: true,
          data: this.model.add(doc)
        }
      } catch (error) {
        console.error('Erro ao adicionar novo grupo:', error)
        throw error
      }
    })

    ipcMain.handle('listarPeixeById', (event, id) => {
      try {
        return this.model.listarById(id)
      } catch (error) {
        console.error('Erro ao buscar peixe', error)
        throw error
      }
    })

    ipcMain.handle('deletarPeixe', (event, id) => {
      try {
        return this.model.delete(id)
      } catch (error) {
        console.error('Erro ao deletar peixe', error)
        throw error
      }
    })
  }
}
