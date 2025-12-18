import { Menu,  Tray, nativeImage, BrowserWindow, app } from "electron";
import path from "node:path";


export function createTray(window: BrowserWindow){
    const appIcon = path.join(__dirname, "resources", "icon.png")
    const icon = nativeImage.createFromPath(appIcon)

    const tray = new Tray(icon)

    const menu = Menu.buildFromTemplate([
        { label: "Battle Fish System", enabled: false,},
        {type: "separator"},
        {
            label: "Abrir",
            click: () =>{
                window.show()
            }
        },
         {type: "separator"},
    ])

    tray.setContextMenu(menu);

}