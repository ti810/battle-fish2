import { ipcMain } from 'electron'
import { GrupoModel } from '../models/GrupoModel'
import DatabaseConstructor from 'better-sqlite3'
import { NewGroupCustomer, GroupCustomer } from '../shared/types/interfaces'
import { success } from 'zod'

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
        return {
          success: true,
          data: this.model.listar()
        }
      } catch (error) {
        console.error('Erro ao listar membors:', error)
        throw error
      }
    })

    ipcMain.handle('addNovoGrupo', (_, doc: NewGroupCustomer) => {
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

    ipcMain.handle('listarGrupoById', async (_event, id: number) => {
      try {
        // console.log(this.model.listar())
        return {
          success: true,
          data: this.model.getById(id)
        }
      } catch (error) {
        console.error('Erro ao buscar grupo:', error)
        throw error
      }
    })

    ipcMain.handle('editGrupoById', async (_, doc: GroupCustomer) => {
      try {
        return {
          success: true,
          data: this.model.edit(doc)
        }
      } catch (error) {
        console.error('Erro ao buscar grupo:', error)
        throw error
      }
    })

    ipcMain.handle('deletarGrupo', async (_, id: number) => {
      try {
        return {
          success: true,
          data: this.model.delete(id)
        }
      } catch (error) {
        console.error('Erro ao buscar grupo:', error)
        throw error
      }
    })
  }
}
