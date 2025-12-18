import { app, shell, BrowserWindow, ipcMain } from 'electron'
import { join } from 'path'
import { electronApp, optimizer, is } from '@electron-toolkit/utils'
import path from 'node:path'
import { createTray } from './tray'

import Database from 'better-sqlite3'
import { UsuarioController } from '../controllers/UsuarioController'
const db = new Database('./src/database/app.db')

let mainWindow: BrowserWindow | null = null

function createWindow(): void {
  // Create the browser window.
  mainWindow = new BrowserWindow({
    width: 900,
    height: 670,
    show: false,
    autoHideMenuBar: true,
    ...(process.platform === 'linux'
      ? { icon: path.join(__dirname, '../../build/icon.png') }
      : process.platform === 'win32' && {
          icon: path.join(__dirname, 'resources', 'icon.png')
        }),
    webPreferences: {
      preload: join(__dirname, '../preload/index.js'),
      sandbox: false
    }
  })

  mainWindow.webContents.openDevTools({ mode: 'right' })

  if (process.platform === 'darwin') {
    const iconPath = path.resolve(__dirname, 'recources', 'icon.png')
    mainWindow.setIcon(iconPath)
  }

  mainWindow.on('minimize', () => {
    if (mainWindow) {
      mainWindow.hide()
    }
  })

  mainWindow.on('ready-to-show', () => {
    if (mainWindow) {
      mainWindow.show()
      createTray(mainWindow)
    }
  })

  mainWindow.webContents.setWindowOpenHandler((details) => {
    shell.openExternal(details.url)
    return { action: 'deny' }
  })

  // HMR for renderer base on electron-vite cli.
  // Load the remote URL for development or the local html file for production.
  if (is.dev && process.env['ELECTRON_RENDERER_URL']) {
    mainWindow.loadURL(process.env['ELECTRON_RENDERER_URL'])
  } else {
    mainWindow.loadFile(join(__dirname, '../renderer/index.html'))
  }
}

app.whenReady().then(() => {
  // const dbPath = path.join(__dirname, '..', 'database', 'app.db')
  // const db = new Database(dbPath)
  new UsuarioController(db)

  electronApp.setAppUserModelId('com.electron')

  app.on('browser-window-created', (_, window) => {
    optimizer.watchWindowShortcuts(window)
  })

  createWindow()

  app.on('activate', function () {
    if (BrowserWindow.getAllWindows().length === 0) createWindow()
  })

  ipcMain.handle('app:logout', () => {
    app.relaunch()
    app.exit()
  })
})

app.on('window-all-closed', () => {
  if (process.platform !== 'darwin') {
    app.quit()
  }
})

// In this file you can include the rest of your app's specific main process
// code. You can also put them in separate files and require them here.
