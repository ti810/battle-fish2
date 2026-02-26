import { Menu, Tray, nativeImage, BrowserWindow, app } from "electron";
import path from "node:path";


export function createTray(window: BrowserWindow) {
  // const appIcon = path.join(__dirname, "resources", "icon.ico");
  // const icon = nativeImage.createFromPath(appIcon);

  // const tray = new Tray(icon);

  const iconPath = app.isPackaged
    ? path.join(process.resourcesPath, "icon.ico")
    : path.join(__dirname, "../../resources/icon.ico");
  const tray = new Tray(iconPath);

  // console.log("Icon path:", appIcon);
  // console.log("Exists:", require("fs").existsSync(appIcon));

  const menu = Menu.buildFromTemplate([
    { label: "Battle Fish System", enabled: false },
    { type: "separator" },
    {
      label: "Abrir",
      click: () => {
        window.show();
        window.maximize();
      },
    },
    { type: "separator" },
  ]);

  tray.setContextMenu(menu);
}
