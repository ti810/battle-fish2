import { ipcMain } from 'electron'
import { CustodiaModel } from '../models/CustodiaModel'
import DatabaseConstructor from 'better-sqlite3'
import { success } from 'zod'

export class CustodiaController {
  private model: CustodiaModel
  private db: InstanceType<typeof DatabaseConstructor>

  constructor(db: InstanceType<typeof DatabaseConstructor>) {
    this.db = db
    this.model = new CustodiaModel(db)
    this.registrarRotas()
  }

    private registrarRotas() {
  ipcMain.handle('listarCustodia', async () => {
    try {
      const data = this.model.custodia()

      return {
        success: true,
        data
      }
    } catch (error) {
      console.error('Erro ao listar custodia:', error)

      return {
        success: false,
        error: String(error)
      }
    }
  })
}}
