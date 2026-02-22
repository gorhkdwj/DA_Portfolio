const { app, BrowserWindow, protocol } = require('electron');
const path = require('path');
const fs = require('fs');
const os = require('os');

let mainWindow;

function createWindow() {
  mainWindow = new BrowserWindow({
    width: 900,
    height: 700,
    minWidth: 800,
    minHeight: 600,
    webPreferences: {
      nodeIntegration: true,
      contextIsolation: false, // In a real production app with sensitive data, use contextBridge + preload
      sandbox: false, // Required in newer Electron to allow nodeIntegration
      preload: path.join(__dirname, 'preload.js'),
      webSecurity: false // Simplify local file loading for this demo
    },
    autoHideMenuBar: true, // Hide default Windows menu bar
    title: "Pomodoro Timer",
  });

  // Depending on the environment, load the dev server or the built HTML file
  const isDev = !app.isPackaged;
  if (isDev) {
    mainWindow.loadURL('http://localhost:5173');
    // mainWindow.webContents.openDevTools();
  } else {
    mainWindow.loadFile(path.join(__dirname, '../dist/index.html'));
  }

  mainWindow.on('closed', () => {
    mainWindow = null;
  });
}

// Needed to register custom protocols before app is ready
protocol.registerSchemesAsPrivileged([
  { scheme: 'asset', privileges: { bypassCSP: true, secure: true, supportFetchAPI: true, corsEnabled: true } }
]);

app.whenReady().then(() => {
  protocol.registerFileProtocol('asset', (request, callback) => {
    const url = request.url.substr(8); // Strip "asset://"
    const decodedUrl = decodeURI(url); // Handle spaces
    // Normalize path to prevent directory traversal outside of appData (basic check)
    callback({ path: path.normalize(`${decodedUrl}`) });
  });

  // Pre-create the custom_assets directory so it's always ready
  const isWindows = os.platform() === 'win32';
  const appDataDir = isWindows
    ? path.join(os.homedir(), 'AppData', 'Roaming', 'focusflow')
    : path.join(os.homedir(), '.focusflow');
  const customAssetsDir = path.join(appDataDir, 'custom_assets');
  if (!fs.existsSync(customAssetsDir)) {
    fs.mkdirSync(customAssetsDir, { recursive: true });
    console.log('Created custom_assets directory:', customAssetsDir);
  }

  createWindow();

  app.on('activate', () => {
    if (BrowserWindow.getAllWindows().length === 0) createWindow();
  });
});


app.on('window-all-closed', () => {
  if (process.platform !== 'darwin') app.quit();
});
