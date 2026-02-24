import { ipcMain } from 'electron'
import { PeixeModel } from '../models/PeixeModel'
import DatabaseConstructor from 'better-sqlite3'
import { NewPeixeCustomer, PeixeCustomer } from '../shared/types/interfaces'
import { peixeSchema } from '../renderer/src/hooks/formValidation'

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

    ipcMain.handle('addNovoPeixe', (_, doc: NewPeixeCustomer) => {
      try {
        return {
          success: true,
          data: this.model.add(doc)
        }
      } catch (error) {
        console.error('Erro ao adicionar novo membro:', error)
        throw error
      }
    })

    ipcMain.handle('listarPeixeById', (event, id) => {
      try {
        return this.model.buscarById(id)
      } catch (error) {
        console.error('Erro ao buscar peixe', error)
        throw error
      }
    })

    ipcMain.handle('editPeixeById', async (_, doc: PeixeCustomer) => {
      try {
        return {
          success: true,
          data: this.model.update(doc)
        }
      } catch (error) {
        console.error('Erro ao atualizar peixe:', error)
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
