import { ipcMain } from 'electron'
import { EquipeModel } from '../models/EquipeModel'
import DatabaseConstructor from 'better-sqlite3'
import { NewEquipeCustomer, EquipeCustomer } from '../shared/types/interfaces'
import { success } from 'zod'

export class EquipesController {
  private model: EquipeModel
  private db: InstanceType<typeof DatabaseConstructor>

  constructor(db: InstanceType<typeof DatabaseConstructor>) {
    this.db = db
    this.model = new EquipeModel(db)
    this.registrarRotas()
  }

  private registrarRotas() {
    ipcMain.handle('listarEquipes', async () => {
      try {
        // console.log(this.model.listar())
        return {
          success: true,
          data: this.model.listar()
        }
      } catch (error) {
        console.error('Erro ao listar membors:', error)
        throw error
      }
    })

    ipcMain.handle('addNovoEquipe', (_, doc: NewEquipeCustomer) => {
      try {
        return {
          success: true,
          data: this.model.add(doc)
        }
      } catch (error) {
        console.error('Erro ao adicionar novo Equipe:', error)
        throw error
      }
    })

    ipcMain.handle('listarEquipeById', async (_event, id: number) => {
      try {
        // console.log(this.model.listar())
        return {
          success: true,
          data: this.model.getById(id)
        }
      } catch (error) {
        console.error('Erro ao buscar Equipe:', error)
        throw error
      }
    })

    ipcMain.handle('editEquipeById', async (_, doc: EquipeCustomer) => {
      try {
        return {
          success: true,
          data: this.model.edit(doc)
        }
      } catch (error) {
        console.error('Erro ao buscar Equipe:', error)
        throw error
      }
    })

    ipcMain.handle('deletarEquipe', async (_, id: number) => {
      try {
        return {
          success: true,
          data: this.model.delete(id)
        }
      } catch (error) {
        console.error('Erro ao buscar Equipe:', error)
        throw error
      }
    })
  }
}
