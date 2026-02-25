import fs from "fs";
import path from "node:path";
import { app, shell, BrowserWindow, ipcMain } from "electron";
import { join } from "path";
import { electronApp, optimizer, is } from "@electron-toolkit/utils";
import { createTray } from "./tray";
import { dialog } from "electron";

import Database from "better-sqlite3";
import { UsuariosController } from "../controllers/UsuariosController";
import { EquipesController } from "../controllers/EquipesController";
import { AtletasController } from "../controllers/AtletasController";
import { PeixesController } from "../controllers/PeixesController";
import { RankingController } from "../controllers/RankingController";
import { CampeonatosController } from "../controllers/CampeonatosController";
import { CustodiaController } from "../controllers/CustodiaController";
import { fa } from "zod/locales";
import Custodia from "../renderer/src/pages/Custodia";

let mainWindow: BrowserWindow | null = null;

const iconPath =
  process.platform === "win32"
    ? join(process.resourcesPath, "icon.png")
    : join(__dirname, "../../build/icon.png");

function createWindow(): void {
  // Create the browser window.
  mainWindow = new BrowserWindow({
    minWidth: 1200,
    minHeight: 800,
    show: false,
    maximizable: true,
    // fullscreen: true,
    autoHideMenuBar: true,
    icon: iconPath,
    webPreferences: {
      preload: join(__dirname, "../preload/index.js"),
      sandbox: false,
      // devTools: false
    },
  });

  mainWindow.webContents.openDevTools({ mode: "right" }); // Abrir com DevTools aberto

  mainWindow.setMenu(null);

  if (process.platform === "darwin") {
    const iconPath = path.resolve(__dirname, "recources", "icon.png");
    mainWindow.setIcon(iconPath);
  }

  mainWindow.maximize();

  mainWindow.on("minimize", () => {
    if (mainWindow) {
      mainWindow.hide();
    }
  });

  mainWindow.on("ready-to-show", () => {
    if (mainWindow) {
      mainWindow.show();
      createTray(mainWindow);
    }
  });

  mainWindow.webContents.setWindowOpenHandler((details) => {
    shell.openExternal(details.url);
    return { action: "deny" };
  });

  // HMR for renderer base on electron-vite cli.
  // Load the remote URL for development or the local html file for production.
  if (is.dev && process.env["ELECTRON_RENDERER_URL"]) {
    mainWindow.loadURL(process.env["ELECTRON_RENDERER_URL"]);
  } else {
    mainWindow.loadFile(join(__dirname, "../renderer/index.html"));
  }
}

app.whenReady().then(() => {
  // const userDataPath = app.getPath("userData");
  // const dbPath = path.join(userDataPath, "app.db");
  // const db = new Database(dbPath);

  // if (!fs.existsSync(dbPath)) {
  //   const sourceDbPath = path.join(__dirname, "..", "database", "app.db");
  //   fs.copyFileSync(sourceDbPath, dbPath);
  // }

  const db = new Database("./src/database/app.db"); //DB modo DEV

  new UsuariosController(db);
  new CampeonatosController(db);
  new EquipesController(db);
  new AtletasController(db);
  new PeixesController(db);
  new RankingController(db);
  new CustodiaController(db);

  electronApp.setAppUserModelId("com.electron");

  app.on("browser-window-created", (_, window) => {
    optimizer.watchWindowShortcuts(window);
  });

  createWindow();

  app.on("activate", function () {
    if (BrowserWindow.getAllWindows().length === 0) createWindow();
  });

  ipcMain.handle("app:logout", () => {
    app.relaunch();
    app.exit();
  });
});

app.on("window-all-closed", () => {
  if (process.platform !== "darwin") {
    app.quit();
  }
});

// Message Box

ipcMain.handle("show-message-box", async (event, options) => {
  const result = await dialog.showMessageBox(options);
  return result;
});

// In this file you can include the rest of your app's specific main process
// code. You can also put them in separate files and require them here.