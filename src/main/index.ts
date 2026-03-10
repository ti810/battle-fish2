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
import { DashboardController } from "../controllers/DashboardController";
import { ConfiguracaoController } from "../controllers/ConfiguracaoController";
import { ConfiguracaoModel } from "../models/ConfiguracaoModel";
import { LicenseService } from "./licenseService";

let mainWindow: BrowserWindow | null = null;
let licenseValidationTimer: NodeJS.Timeout | null = null;

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
    frame: false,
    ...(process.platform === "darwin" ? { titleBarStyle: "hiddenInset" as const } : {}),
    // fullscreen: true,
    autoHideMenuBar: true,
    icon: iconPath,
    webPreferences: {
      preload: join(__dirname, "../preload/index.js"),
      sandbox: false,
      devTools: true
    },
  });

  // mainWindow.webContents.openDevTools({ mode: "right" }); // Abrir com DevTools aberto

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
  try {
    const userDataPath = app.getPath("userData");
    const dbPath = path.join(userDataPath, "app.db");

    if (!fs.existsSync(dbPath)) {
      const sourceDbPath = path.join(__dirname, "..", "database", "app.db");
      if (fs.existsSync(sourceDbPath)) {
        fs.copyFileSync(sourceDbPath, dbPath);
      }
    }

    const db = new Database(dbPath);
    const licenseService = new LicenseService(app);

    // const db = new Database("./src/database/app.db"); //DB modo DEV
    // UsuariosController cria a tabela `usuarios`, exigida por configuracoes_sistema.
    new UsuariosController(db);
    new CampeonatosController(db);
    new EquipesController(db);
    new AtletasController(db);
    new PeixesController(db);
    new RankingController(db);
    new CustodiaController(db);
    new DashboardController(db);
    new ConfiguracaoController(db, licenseService);

    const configuracaoModel = new ConfiguracaoModel(db);

    let validationInFlight = false;
    const validateCurrentLicense = async () => {
      if (validationInFlight) return;
      validationInFlight = true;

      try {
        const config = configuracaoModel.obter();
        const serial = String(config.licenca_chave || "").trim();

        if (!serial) {
          return;
        }

        if (configuracaoModel.isClockRollbackDetected(config)) {
          configuracaoModel.definirStatusLicenca(serial, 0);
          return;
        }

        if (Number(config.licenca_ativa) === 1) {
          configuracaoModel.registrarHorarioLocalLicenca(serial);
        }

        const response = await licenseService.validate(serial);
        if (response.status === "NETWORK_ERROR" || response.status === "CONFIG_ERROR") {
          if (configuracaoModel.isLicensePastRevalidationWindow(config)) {
            configuracaoModel.definirStatusLicenca(serial, 0);
          }
          return;
        }

        const shouldActivate =
          response.valid && (response.status === "ACTIVE" || response.status === "ACTIVE_OFFLINE");
        configuracaoModel.registrarValidacaoOnlineLicenca(
          serial,
          shouldActivate ? 1 : 0,
          response.serverTime
        );
      } catch (error) {
        console.error("Erro ao validar licenca automaticamente:", error);
      } finally {
        validationInFlight = false;
      }
    };

    electronApp.setAppUserModelId("com.electron");

    app.on("browser-window-created", (_, window) => {
      optimizer.watchWindowShortcuts(window);
    });

    createWindow();
    void validateCurrentLicense();

    licenseValidationTimer = setInterval(() => {
      void validateCurrentLicense();
    }, ConfiguracaoModel.LICENSE_REVALIDATION_INTERVAL_MS);

    app.on("activate", function () {
      if (BrowserWindow.getAllWindows().length === 0) createWindow();
    });

    ipcMain.handle("app:logout", () => {
      app.relaunch();
      app.exit();
    });
  } catch (error) {
    console.error("Falha na inicializacao do app:", error);
    app.quit();
  }
});

app.on("window-all-closed", () => {
  if (licenseValidationTimer) {
    clearInterval(licenseValidationTimer);
    licenseValidationTimer = null;
  }

  if (process.platform !== "darwin") {
    app.quit();
  }
});

// Message Box

ipcMain.handle("show-message-box", async (event, options) => {
  const result = await dialog.showMessageBox(options);
  return result;
});

// Window Controls
ipcMain.handle("window:minimize", () => {
  if (mainWindow) {
    mainWindow.minimize();
  }
  return true;
});

ipcMain.handle("window:toggle-maximize", () => {
  if (!mainWindow) {
    return { isMaximized: false };
  }

  if (mainWindow.isMaximized()) {
    mainWindow.unmaximize();
  } else {
    mainWindow.maximize();
  }

  return { isMaximized: mainWindow.isMaximized() };
});

ipcMain.handle("window:is-maximized", () => {
  return { isMaximized: Boolean(mainWindow?.isMaximized()) };
});

ipcMain.handle("window:close", () => {
  if (mainWindow) {
    mainWindow.close();
  }
  return true;
});

// In this file you can include the rest of your app's specific main process
// code. You can also put them in separate files and require them here.
