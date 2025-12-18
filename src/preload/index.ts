import { contextBridge, ipcRenderer } from 'electron'
import { electronAPI } from '@electron-toolkit/preload'
import { ElectronAPI } from '@electron-toolkit/preload'
import { NewCustomer } from '../shared/types/interfaces'

declare global {
  export interface Window {
    electron: ElectronAPI
    api: typeof api
  }
}

// Custom APIs for renderer
const api = {
  login: (data: { usuario: string; senha: string }) => ipcRenderer.invoke('auth:login', data),
  logout: () => ipcRenderer.invoke('app:logout'),
  listarUsuarios: () => ipcRenderer.invoke('listarUsuarios'),
  addUsuario: (doc: NewCustomer) => ipcRenderer.invoke('addUsuario', doc)
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
