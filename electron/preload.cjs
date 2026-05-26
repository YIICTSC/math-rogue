const { contextBridge, ipcRenderer } = require('electron');

contextBridge.exposeInMainWorld('learningRogue', {
  isElectron: true,
  quit: () => ipcRenderer.invoke('learning-rogue:quit'),
  getWindowState: () => ipcRenderer.invoke('learning-rogue:get-window-state'),
  setFullScreen: (enabled) => ipcRenderer.invoke('learning-rogue:set-full-screen', enabled),
  resetWindowState: () => ipcRenderer.invoke('learning-rogue:reset-window-state'),
});
