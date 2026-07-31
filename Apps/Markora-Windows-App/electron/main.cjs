const { app, BrowserWindow, Menu } = require('electron');
const path = require('path');

function createWindow() {
  // Hide native default application menu bar
  Menu.setApplicationMenu(null);

  const iconPath = process.platform === 'win32'
    ? path.join(__dirname, '../build/icon.ico')
    : path.join(__dirname, '../public/icon.png');

  const mainWindow = new BrowserWindow({
    width: 1280,
    height: 800,
    title: 'Markora Markdown Editor',
    icon: iconPath,
    autoHideMenuBar: true,
    webPreferences: {
      preload: path.join(__dirname, 'preload.cjs'),
      nodeIntegration: false,
      contextIsolation: true,
    },
  });

  if (process.env.VITE_DEV_SERVER_URL) {
    mainWindow.loadURL(process.env.VITE_DEV_SERVER_URL);
  } else {
    mainWindow.loadFile(path.join(__dirname, '../dist/index.html'));
  }
}

app.whenReady().then(() => {
  createWindow();

  app.on('activate', () => {
    if (BrowserWindow.getAllWindows().length === 0) createWindow();
  });
});

app.on('window-all-closed', () => {
  if (process.platform !== 'darwin') {
    app.quit();
  }
});
