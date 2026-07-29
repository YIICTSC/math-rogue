const { app, BrowserWindow, ipcMain, Notification } = require('electron');
const path = require('path');

const ASSIGNMENT_PROTOCOL = 'learning-rogue';
let mainWindow = null;
let pendingAssignmentParam = null;

const getAssignmentParamFromArgv = (argv) => {
  const protocolArg = argv.find((arg) => typeof arg === 'string' && arg.startsWith(`${ASSIGNMENT_PROTOCOL}://`));
  if (!protocolArg) return null;
  try {
    const url = new URL(protocolArg);
    return url.searchParams.get('assignment');
  } catch (e) {
    return null;
  }
};

const loadApp = (win, assignmentParam) => {
  const loadOptions = assignmentParam ? { query: { assignment: assignmentParam } } : undefined;
  win.loadFile(path.join(__dirname, '..', 'dist', 'index.html'), loadOptions);
};

const openAssignmentUrl = (assignmentParam) => {
  if (!assignmentParam) return;
  pendingAssignmentParam = assignmentParam;
  if (!app.isReady()) return;
  if (!mainWindow || mainWindow.isDestroyed()) {
    createWindow(assignmentParam);
    pendingAssignmentParam = null;
    return;
  }
  loadApp(mainWindow, assignmentParam);
  pendingAssignmentParam = null;
  if (mainWindow.isMinimized()) mainWindow.restore();
  mainWindow.focus();
};

const createWindow = (assignmentParam = null) => {
  mainWindow = new BrowserWindow({
    width: 1280,
    height: 800,
    minWidth: 960,
    minHeight: 640,
    backgroundColor: '#000000',
    title: '学習ローグ',
    icon: path.join(__dirname, '..', 'build', 'icon.png'),
    autoHideMenuBar: true,
    webPreferences: {
      preload: path.join(__dirname, 'preload.cjs'),
      contextIsolation: true,
      nodeIntegration: false,
      sandbox: false,
    },
  });

  loadApp(mainWindow, assignmentParam);
  return mainWindow;
};

if (process.defaultApp && process.argv.length >= 2) {
  app.setAsDefaultProtocolClient(ASSIGNMENT_PROTOCOL, process.execPath, [path.resolve(process.argv[1])]);
} else {
  app.setAsDefaultProtocolClient(ASSIGNMENT_PROTOCOL);
}

const gotLock = app.requestSingleInstanceLock();
if (!gotLock) {
  app.quit();
}

app.on('second-instance', (_event, argv) => {
  const assignmentParam = getAssignmentParamFromArgv(argv);
  openAssignmentUrl(assignmentParam);
});

app.on('open-url', (event, url) => {
  event.preventDefault();
  openAssignmentUrl(getAssignmentParamFromArgv([url]));
});

app.whenReady().then(() => {
  mainWindow = createWindow(pendingAssignmentParam || getAssignmentParamFromArgv(process.argv));
  pendingAssignmentParam = null;

  app.on('activate', () => {
    if (BrowserWindow.getAllWindows().length === 0) {
      mainWindow = createWindow();
    }
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

ipcMain.handle('learning-rogue:notify-assignment', (_event, payload) => {
  if (!Notification.isSupported()) return false;
  const notification = new Notification({
    title: String(payload?.title || '新しい課題が届きました'),
    body: String(payload?.body || ''),
    icon: path.join(__dirname, '..', 'build', 'icon.png'),
  });
  notification.on('click', () => {
    if (mainWindow && !mainWindow.isDestroyed()) {
      if (mainWindow.isMinimized()) mainWindow.restore();
      mainWindow.show();
      mainWindow.focus();
      mainWindow.webContents.send(
        'learning-rogue:assignment-notification-click',
        String(payload?.assignmentId || ''),
      );
    }
  });
  notification.show();
  return true;
});
