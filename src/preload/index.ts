import { contextBridge, ipcRenderer } from 'electron'
import { electronAPI } from '@electron-toolkit/preload'
import { ElectronAPI } from '@electron-toolkit/preload'
import {
  NewEquipeCustomer,
  NewUserCustomer,
  NewPeixeCustomer,
  EquipeCustomer,
  NewAtletaCustomer,
  AtletaCustomer,
  PeixeCustomer,
  CampeonatoCustomer,
  NewCampeonatoCustomer,
  CustodiaCustomer
} from '../shared/types/interfaces'

declare global {
  export interface Window {
    electron: ElectronAPI
    api: typeof api
  }
}

// Custom APIs for renderer
const api = {
  //Usuário
  login: (data: { usuario: string; senha: string }) => ipcRenderer.invoke('auth:login', data),
  logout: () => ipcRenderer.invoke('app:logout'),
  addUsuario: (doc: NewUserCustomer) => ipcRenderer.invoke('addUsuario', doc),
  listarUsuarios: () => ipcRenderer.invoke('listarUsuarios'),
  //Equipes
  addNovaEquipe: (doc: NewEquipeCustomer) => ipcRenderer.invoke('addNovaEquipe', doc),
  listarEquipes: () => ipcRenderer.invoke('listarEquipes'),
  listarEquipesComUltimaCaptura: () => ipcRenderer.invoke('listarEquipesComUltimaCaptura'),
  listarEquipeById: (id: number) => ipcRenderer.invoke('listarEquipeById', id),
  editEquipeById: (doc: EquipeCustomer) => ipcRenderer.invoke('editEquipeById', doc),
  deletarEquipe: (id: number) => ipcRenderer.invoke('deletarEquipe', id),
  //Atleta
  addNovoAtleta: (doc: NewAtletaCustomer) => ipcRenderer.invoke('addNovoAtleta', doc),
  listarAtletas: () => ipcRenderer.invoke('listarAtletas'),
  listarAtletaById: (id: number) => ipcRenderer.invoke('listarAtletaById', id),
  atletaComSetor: () => ipcRenderer.invoke('atletaComSetor'),
  editAtletaById: (doc: AtletaCustomer) => ipcRenderer.invoke('editAtletaById', doc),
  deletarAtleta: (id: number) => ipcRenderer.invoke('deletarAtleta', id),
  ///Peixes
  addNovoPeixe: (doc: NewPeixeCustomer) => ipcRenderer.invoke('addNovoPeixe', doc),
  listarPeixe: () => ipcRenderer.invoke('listarPeixe'),
  listarPeixeById: (id: number) => ipcRenderer.invoke('listarPeixeById', id),
  deletarPeixe: (id: number) => ipcRenderer.invoke('deletarPeixe', id),
  listarPeixesAndAtletasByEquipeId: (id: number) => ipcRenderer.invoke('listarPeixesAndAtletasByEquipeId', id),
  editPeixeById: (doc: PeixeCustomer) => ipcRenderer.invoke('editPeixeById', doc),
  //Ranking
  listarRanking: () => ipcRenderer.invoke('listarRanking'),
  // Campeonatos
  // listarRankingPorCampeonato: (id: number) => ipcRenderer.invoke('listarRankingPorCampeonato', id),
  verificarCampeonatoAtivo: () => ipcRenderer.invoke('verificarCampeonatoAtivo'),
  addNovoCampeonato: (doc: NewCampeonatoCustomer) => ipcRenderer.invoke('addNovoCampeonato', doc),
  editCampeonatoById: (doc: CampeonatoCustomer) => ipcRenderer.invoke('editCampeonatoById', doc),
  deletarCampeonato: (id: number) => ipcRenderer.invoke('deletarCampeonato', id),
  listarCampeonatos: () => ipcRenderer.invoke('listarCampeonatos'),
  listarEquipesByCampeonatoId: (id: number) => ipcRenderer.invoke('listarEquipesByCampeonatoId', id),
  //custodia
  listarCustodia: () => ipcRenderer.invoke('listarCustodia'),

  // Message Box 
  showMessageBox: (options: Electron.MessageBoxOptions) => ipcRenderer.invoke('show-message-box', options)

}

// Use `contextBridge` APIs to expose Electron APIs to
// renderer only if context isolation is enabled, otherwise
// just add to the DOM global.
if (process.contextIsolated) {
  try {
    contextBridge.exposeInMainWorld('electron', electronAPI)
    contextBridge.exposeInMainWorld('api', api)
  } catch (error) {
    console.error(error)
  }
} else {
  // @ts-ignore (define in dts)
  window.electron = electronAPI
  // @ts-ignore (define in dts)
  window.api = api
}
