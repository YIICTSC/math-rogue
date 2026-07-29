const { contextBridge, ipcRenderer } = require('electron');

contextBridge.exposeInMainWorld('learningRogue', {
  isElectron: true,
  quit: () => ipcRenderer.invoke('learning-rogue:quit'),
  getWindowState: () => ipcRenderer.invoke('learning-rogue:get-window-state'),
  setFullScreen: (enabled) => ipcRenderer.invoke('learning-rogue:set-full-screen', enabled),
  resetWindowState: () => ipcRenderer.invoke('learning-rogue:reset-window-state'),
  notifyAssignment: (payload) => ipcRenderer.invoke('learning-rogue:notify-assignment', payload),
  onAssignmentNotificationClick: (listener) => {
    const handler = (_event, assignmentId) => listener(assignmentId);
    ipcRenderer.on('learning-rogue:assignment-notification-click', handler);
    return () => ipcRenderer.removeListener('learning-rogue:assignment-notification-click', handler);
  },
});
