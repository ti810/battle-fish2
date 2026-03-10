import { contextBridge, ipcRenderer } from 'electron'
import { electronAPI } from '@electron-toolkit/preload'
import { ElectronAPI } from '@electron-toolkit/preload'
import {
  AtivarLicencaPayload,
  ValidarLicencaPayload,
  AlterarSenhaPayload,
  AtualizarUsuarioPerfilPayload,
  NewEquipeCustomer,
  NewUserCustomer,
  NewPeixeCustomer,
  EquipeCustomer,
  NewAtletaCustomer,
  AtletaCustomer,
  PeixeCustomer,
  CampeonatoCustomer,
  NewCampeonatoCustomer,
  CustodiaCustomer,
  SaveSistemaConfigPayload
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
  listarUsuarios: (actorUserId: number) => ipcRenderer.invoke('listarUsuarios', actorUserId),
  alterarSenhaUsuario: (payload: AlterarSenhaPayload) => ipcRenderer.invoke('usuario:alterarSenha', payload),
  atualizarPerfilUsuario: (payload: AtualizarUsuarioPerfilPayload) =>
    ipcRenderer.invoke('usuario:atualizarPerfil', payload),
  listarLogsUsuarios: (actorUserId: number) => ipcRenderer.invoke('usuario:listarLogs', actorUserId),
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
  autorizarRevelacaoRanking: (senha: string) => ipcRenderer.invoke('ranking:autorizarRevelacao', { senha }),
  // Campeonatos
  // listarRankingPorCampeonato: (id: number) => ipcRenderer.invoke('listarRankingPorCampeonato', id),
  verificarCampeonatoAtivo: () => ipcRenderer.invoke('verificarCampeonatoAtivo'),
  addNovoCampeonato: (doc: NewCampeonatoCustomer) => ipcRenderer.invoke('addNovoCampeonato', doc),
  editCampeonatoById: (doc: CampeonatoCustomer) => ipcRenderer.invoke('editCampeonatoById', doc),
  encerrarCampeonato: (id: number) => ipcRenderer.invoke('encerrarCampeonato', id),
  deletarCampeonato: (id: number) => ipcRenderer.invoke('encerrarCampeonato', id),
  listarCampeonatos: () => ipcRenderer.invoke('listarCampeonatos'),
  listarEquipesByCampeonatoId: (id: number) => ipcRenderer.invoke('listarEquipesByCampeonatoId', id),
  //custodia
  listarCustodia: () => ipcRenderer.invoke('listarCustodia'),
  // configuracao sistema
  obterConfiguracaoSistema: (actorUserId: number) => ipcRenderer.invoke('configSistema:obter', actorUserId),
  salvarConfiguracaoSistema: (payload: SaveSistemaConfigPayload) =>
    ipcRenderer.invoke('configSistema:salvar', payload),
  ativarLicencaSistema: (payload: AtivarLicencaPayload) =>
    ipcRenderer.invoke('configSistema:ativarLicenca', payload),
  validarLicencaSistema: (payload: ValidarLicencaPayload) =>
    ipcRenderer.invoke('configSistema:validarLicenca', payload.actor_user_id),

  //Dashboard
  campeonato: () => ipcRenderer.invoke('campeonato'),
  totalLancamento: () => ipcRenderer.invoke('totalLancamento'),
  maiorPeixe: () => ipcRenderer.invoke('maiorPeixe'),
  totalEquipe: () => ipcRenderer.invoke('totalEquipe'),
  totalAtleta: () => ipcRenderer.invoke('totalAtleta'),
  ultimosLances: () => ipcRenderer.invoke('ultimosLances'),
  setorAtivos: () => ipcRenderer.invoke('setorAtivos'),
  setorSem: () => ipcRenderer.invoke('setorSem'),
  
  // Window controls (custom title bar)
  windowMinimize: () => ipcRenderer.invoke('window:minimize'),
  windowToggleMaximize: () => ipcRenderer.invoke('window:toggle-maximize'),
  windowIsMaximized: () => ipcRenderer.invoke('window:is-maximized'),
  windowClose: () => ipcRenderer.invoke('window:close'),


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
