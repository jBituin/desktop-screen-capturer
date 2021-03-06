const {
  app,
  contextBridge,
  ipcRenderer,
  desktopCapturer,
  remote,
} = require('electron');
const { writeFile } = require('fs');
const { dialog, Menu } = remote;
const { buildFromTemplate } = Menu;

// Expose protected methods that allow the renderer process to use
// the ipcRenderer without exposing the entire object
contextBridge.exposeInMainWorld('api', {
  send: (channel, data) => {
    // whitelist channels
    let validChannels = ['toMain'];
    if (validChannels.includes(channel)) {
      ipcRenderer.send(channel, data);
    }
  },
  receive: (channel, func) => {
    let validChannels = ['fromMain'];
    if (validChannels.includes(channel)) {
      // Deliberately strip event as it includes `sender`
      ipcRenderer.on(channel, (event, ...args) => func(...args));
    }
  },
  getElectronModules() {
    return {
      desktopCapturer,
    };
  },
  getFsModules() {
    return {
      writeFile,
    };
  },
  getRemoteModules() {
    return {
      dialog,
      buildFromTemplate,
      getMenu: () => Menu,
    };
  },
  tryMenu() {
    console.log('Menu', Menu);
    const menu = Menu.buildFromTemplate([
      {
        label: 'Joms',
        submenu: [
          { role: 'about' },
          { type: 'separator' },
          { role: 'services' },
          { type: 'separator' },
          { role: 'hide' },
          { role: 'hideothers' },
          { role: 'unhide' },
          { type: 'separator' },
          { role: 'quit' },
        ],
      },
    ]);
    Menu.setApplicationMenu(menu);
    menu.popup();
  },
});
