const { app, BrowserWindow, ipcMain } = require('electron');
const path = require('path');

const createWindow = () => {
  const mainWindow = new BrowserWindow({
    width: 1280,
    height: 800,
    minWidth: 960,
    minHeight: 640,
    backgroundColor: '#000000',
    title: '学習ローグ オフライン版',
    icon: path.join(__dirname, '..', 'build', 'icon.png'),
    autoHideMenuBar: true,
    webPreferences: {
      preload: path.join(__dirname, 'preload.cjs'),
      contextIsolation: true,
      nodeIntegration: false,
      sandbox: false,
    },
  });

  mainWindow.loadFile(path.join(__dirname, '..', 'dist', 'index.html'));
};

app.whenReady().then(() => {
  createWindow();

  app.on('activate', () => {
    if (BrowserWindow.getAllWindows().length === 0) createWindow();
  });
});

app.on('window-all-closed', () => {
  if (process.platform !== 'darwin') app.quit();
});

ipcMain.handle('learning-rogue:quit', () => {
  app.quit();
});

ipcMain.handle('learning-rogue:get-window-state', (event) => {
  const win = BrowserWindow.fromWebContents(event.sender);
  if (!win) return { isFullScreen: false, isMaximized: false };
  return {
    isFullScreen: win.isFullScreen(),
    isMaximized: win.isMaximized(),
    bounds: win.getBounds(),
  };
});

ipcMain.handle('learning-rogue:set-full-screen', (event, enabled) => {
  const win = BrowserWindow.fromWebContents(event.sender);
  if (!win) return false;
  win.setFullScreen(Boolean(enabled));
  return win.isFullScreen();
});

ipcMain.handle('learning-rogue:reset-window-state', (event) => {
  const win = BrowserWindow.fromWebContents(event.sender);
  if (!win) return false;
  if (win.isFullScreen()) win.setFullScreen(false);
  if (win.isMaximized()) win.unmaximize();
  win.setBounds({ width: 1280, height: 800 });
  win.center();
  return true;
});
