import { ipcMain } from 'electron'
import { RankingModel } from '../models/RankingModel'
import DatabaseConstructor from 'better-sqlite3'

export class RankingController {
  private model: RankingModel
  private db: InstanceType<typeof DatabaseConstructor>

  constructor(db: InstanceType<typeof DatabaseConstructor>) {
    this.db = db
    this.model = new RankingModel(db)
    this.registrarRotas()
  }

    private registrarRotas() {
  ipcMain.handle('listarRanking', async () => {
    try {
      return this.model.ranking()
    } catch (error) {
      console.error('Erro ao listar Ranking:', error)
      throw error
    }
  })
}}
