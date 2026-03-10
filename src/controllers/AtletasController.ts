import { ipcMain } from 'electron'
import { AtletaModel } from '../models/AtletaModel'
import DatabaseConstructor from 'better-sqlite3'
import { NewAtletaCustomer, AtletaCustomer } from '../shared/types/interfaces'

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
            return {
              success: true,
              data: this.model.listar()
            }
          } catch (error) {
            console.error('Erro ao listar atletas:', error)
            throw error
          }
        })
    
        ipcMain.handle('addNovoAtleta', (_, doc: NewAtletaCustomer) => {
          try {
            return {
              success: true,
              data: this.model.add(doc)
            }
          } catch (error) {
            console.error('Erro ao adicionar novo Atleta:', error)
            return {
              success: false,
              message:
                error instanceof Error ? error.message : 'Erro ao adicionar novo atleta.'
            }
          }
        })
    
        ipcMain.handle('listarAtletaById', async (_event, id: number) => {
          try {
            // console.log(this.model.listar())
            return {
              success: true,
              data: this.model.getById(id)
            }
          } catch (error) {
            console.error('Erro ao buscar Atleta:', error)
            throw error
          }
        })

        ipcMain.handle('atletaComSetor', async (_event, id: number) => {
          try {
            // console.log(this.model.listar())
            return {
              success: true,
              data: this.model.getSetor()
            }
          } catch (error) {
            console.error('Erro ao buscar Setor:', error)
            throw error
          }
        })
    
        ipcMain.handle('editAtletaById', async (_, doc: AtletaCustomer) => {
          try {
            return {
              success: true,
              data: this.model.update(doc)
            }
          } catch (error) {
            console.error('Erro ao atualizar atleta:', error)
            throw error
          }
        })
    
        ipcMain.handle('deletarAtleta', async (_, id: number) => {
          try {
            return {
              success: true,
              data: this.model.delete(id)
            }
          } catch (error) {
            console.error('Erro ao deletar Atleta:', error)
            throw error
          }
        })
      }
}
