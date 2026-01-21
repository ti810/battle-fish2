import { contextBridge, ipcRenderer } from 'electron'
import { electronAPI } from '@electron-toolkit/preload'
import { ElectronAPI } from '@electron-toolkit/preload'
import { NewGroupCustomer, NewUserCustomer, NewPeixeCustomer, GroupCustomer } from '../shared/types/interfaces'

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
  //Grupos
  addNovoGrupo: (doc: NewGroupCustomer) => ipcRenderer.invoke('addNovoGrupo', doc),
  listarGrupos: () => ipcRenderer.invoke('listarGrupos'),
  listarGrupoById: (id: number) => ipcRenderer.invoke('listarGrupoById', id),
  editGrupoById: (doc: GroupCustomer) => ipcRenderer.invoke('editGrupoById', doc),
  deletarGrupo: (id: number) => ipcRenderer.invoke('deletarGrupo', id),
  listarMembros: () => ipcRenderer.invoke('listarMembors'),
  ///Peixes
  addNovoPeixe: (doc: NewPeixeCustomer) => ipcRenderer.invoke('addNovoPeixe', doc),
  listarPeixe: () => ipcRenderer.invoke('listarPeixe'),
  listarPeixeById: (id: number) => ipcRenderer.invoke('listarPeixeById', id),
  deletarPeixe: (id: number) => ipcRenderer.invoke('deletarPeixe', id)
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
