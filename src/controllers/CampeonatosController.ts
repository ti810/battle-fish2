import { ipcMain } from 'electron'
import { CampeonatoModel } from '../models/CampeonatoModel'
import DatabaseConstructor from 'better-sqlite3'
import { NewCampeonatoCustomer, CampeonatoCustomer } from '../shared/types/interfaces'

export class CampeonatosController {
  private model: CampeonatoModel
  private db: InstanceType<typeof DatabaseConstructor>

  constructor(db: InstanceType<typeof DatabaseConstructor>) {
    this.db = db
    this.model = new CampeonatoModel(db)
    this.registrarRotas()
  }

  private registrarRotas() {
    ipcMain.handle('listarCampeonatos', async () => {
      try {
        // console.log(this.model.listar())
        return {
          success: true,
          data: this.model.listar()
        }
      } catch (error) {
        console.error('Erro ao listar campeonatos:', error)
        throw error
      }
    })

    ipcMain.handle('verificarCampeonatoAtivo', async () => {
      try {
        return { ativo: this.model.getCampeonatoAtivo() ? true : false }
      } catch (error) {
        console.error('Erro ao verificar campeonato ativo:', error)
        throw error
      }
    })

    ipcMain.handle('addNovoCampeonato', (_, doc: NewCampeonatoCustomer) => {
      try {
        return {
          success: true,
          data: this.model.add(doc)
        }
      } catch (error) {
        console.error('Erro ao adicionar novo Campeonato:', error)
        throw error
      }
    })

    ipcMain.handle('listarCampeonatoById', async (_event, id: number) => {
      try {
        // console.log(this.model.listar())
        return {
          success: true,
          data: this.model.getById(id)
        }
      } catch (error) {
        console.error('Erro ao buscar Campeonato:', error)
        throw error
      }
    })

    ipcMain.handle('editCampeonatoById', async (_, doc: CampeonatoCustomer) => {
      try {
        const updated = this.model.edit(doc)

        if (!updated) {
          return {
            success: false,
            message: 'Campeonato nao encontrado.'
          }
        }

        return {
          success: true,
          data: updated
        }
      } catch (error) {
        console.error('Erro ao buscar Campeonato:', error)
        throw error
      }
    })

    ipcMain.handle('encerrarCampeonato', async (_, id: number) => {
      try {
        const encerrado = this.model.encerrar(id)

        if (!encerrado) {
          return {
            success: false,
            message: 'Campeonato nao encontrado para encerramento.'
          }
        }

        return {
          success: true,
          data: encerrado
        }
      } catch (error) {
        console.error('Erro ao buscar Campeonato:', error)
        throw error
      }
    })

    ipcMain.handle('listarEquipesByCampeonatoId', async (_event, id: number) => {
      try {
        return {
          success: true,
          data: this.model.listarEquipesByCampeonatoId(id)
        }
      } catch (error) {
        console.error('Erro ao buscar equipes do Campeonato:', error)
        throw error
      }
    })
   
  }
}
