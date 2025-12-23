import { ipcMain } from 'electron'
import { PeixeModel } from '../models/PeixeModel'
import DatabaseConstructor from 'better-sqlite3'
import { NewPeixe } from '../shared/types/interfaces'
import { PeixeService } from '../services/peixeService'

export class PeixesController {
  private model: PeixeModel
  private service: PeixeService
  private db: InstanceType<typeof DatabaseConstructor>

  constructor(db: InstanceType<typeof DatabaseConstructor>) {
    this.db = db
    this.model = new PeixeModel(db)
    this.service = new PeixeService(this.model)
    this.registrarRotas()
  }

  private registrarRotas(): void {
    ipcMain.handle('listarPeixes', async () => {
      try {
        // console.log(this.model.listar())
        return this.service.listar()
      } catch (error) {
        console.error('Erro ao listar membros:', error)
        throw error
      }
    })

    ipcMain.handle('addNovoPeixe', (_, doc: NewPeixe) => {
      try {
        return {
          success: true,
          data: this.service.adicionar(doc)
        }
      } catch (error) {
        console.error('Erro ao adicionar novo grupo:', error)
        throw error
      }
    })

    ipcMain.handle('listarPeixeById', (event, id) => {
      try {
        return this.service.listarById(id)
      } catch (error) {
        console.error('Erro ao buscar peixe', error)
        throw error
      }
    })

    ipcMain.handle('deletarPeixe', (event, id) => {
      try {
        return this.service.delete(id)
      } catch (error) {
        console.error('Erro ao deletar peixe', error)
        throw error
      }
    })
  }
}
