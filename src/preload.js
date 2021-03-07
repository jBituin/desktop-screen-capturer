const {
  app,
  contextBridge,
  ipcRenderer,
  desktopCapturer,
  remote,
} = require('electron');
const { writeFile } = require('fs');
const { dialog, Menu } = remote;

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
    };
  },
  createMenu(template) {
    const menu = Menu.buildFromTemplate(template);
    menu.popup();
  },
  async getBufferFromRecordedChunks(recordedChunks) {
    const blob = new Blob(recordedChunks, {
      type: 'video/webm; codecs=vp9',
    });

    const buffer = Buffer.from(await blob.arrayBuffer());
    return buffer;
  },
});
