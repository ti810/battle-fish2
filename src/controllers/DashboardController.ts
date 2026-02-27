import { ipcMain } from 'electron'
import { DashboardModel } from '../models/DashboardModel'
import DatabaseConstructor from 'better-sqlite3'
import { success } from 'zod'

export class DashboardController {
  private model: DashboardModel
  private db: InstanceType<typeof DatabaseConstructor>

  constructor(db: InstanceType<typeof DatabaseConstructor>) {
    this.db = db
    this.model = new DashboardModel(db)
    this.registrarRotas()
  }

    private registrarRotas() {
      ipcMain.handle('campeonato', async () => {
        try {
          return  this.model.campeonato()        
        } catch (error) {
          console.error('Erro ao retornar nome do campeonato:', error)
          throw error
        }
      })

      ipcMain.handle('totalLancamento', async () => {
        try {
          return  this.model.totalLancamento()        
        } catch (error) {
          console.error('Erro ao retornar total de lançamentos:', error)
          throw error
        }
      })

      ipcMain.handle('maiorPeixe', async () => {
        try {
          return  this.model.maiorPeixe()        
        } catch (error) {
          console.error('Erro ao retornar o maior peixe:', error)
          throw error
        }
      })

      ipcMain.handle('totalEquipe', async () => {
        try {
          return  this.model.totalEquipe()        
        } catch (error) {
          console.error('Erro ao retornar o total de equipes:', error)
          throw error
        }
      })

      ipcMain.handle('totalAtleta', async () => {
        try {
          return  this.model.totalAtleta()        
        } catch (error) {
          console.error('Erro ao retornar o total de atletas:', error)
          throw error
        }
      })

      ipcMain.handle('ultimosLances', async () => {
        try {
          return  this.model.ultimosLances()        
        } catch (error) {
          console.error('Erro ao retornar os ultimos lances:', error)
          throw error
        }
      })

      ipcMain.handle('setorAtivos', async () => {
        try {
          return  this.model.setorAtivos()        
        } catch (error) {
          console.error('Erro ao retornar os setores com mais lançamentos:', error)
          throw error
        }
      })

      ipcMain.handle('setorSem', async () => {
        try {
          return  this.model.setorSem()        
        } catch (error) {
          console.error('Erro ao retornar o total de setores sem lançamentos:', error)
          throw error
        }
      })
    }}
