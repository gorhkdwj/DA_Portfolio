const { app, BrowserWindow, protocol } = require('electron');
const path = require('path');
const fs = require('fs');
const os = require('os');

let mainWindow;

// ── Asset directory paths ──
function getAppDataDir() {
  const isWindows = os.platform() === 'win32';
  return isWindows
    ? path.join(os.homedir(), 'AppData', 'Roaming', 'focusflow')
    : path.join(os.homedir(), '.focusflow');
}

function getBundledAssetsDir() {
  // In packaged app: resources/app.asar/dist/  or  resources/app/dist/
  // In dev: project root / public/
  const isDev = !app.isPackaged;
  if (isDev) {
    return path.join(__dirname, '..', 'public');
  }
  return path.join(__dirname, '..', 'dist');
}

// Copy default assets from the bundled app to AppData on first run
function ensureDefaultAssets() {
  const appDataDir = getAppDataDir();
  const bgDir = path.join(appDataDir, 'backgrounds');
  const soundDir = path.join(appDataDir, 'sounds');

  // Create directories
  if (!fs.existsSync(bgDir)) fs.mkdirSync(bgDir, { recursive: true });
  if (!fs.existsSync(soundDir)) fs.mkdirSync(soundDir, { recursive: true });

  const bundledDir = getBundledAssetsDir();

  // Default backgrounds
  const defaultBgs = ['Wallpaper1.jpg', 'Wallpaper2.jpg', 'Wallpaper3.jpg', 'Wallpaper4.jpg', 'Wallpaper5.jpg', 'Wallpaper6.jpg'];
  for (const file of defaultBgs) {
    const dest = path.join(bgDir, file);
    if (!fs.existsSync(dest)) {
      const src = path.join(bundledDir, 'themes', file);
      if (fs.existsSync(src)) {
        fs.copyFileSync(src, dest);
        console.log('Copied default background:', file);
      }
    }
  }

  // Default sounds
  const defaultSounds = ['AirHorn.wav', 'City_Lights_Recharge.mp3', 'MetalGong.wav', '쉬는시간 1.mp3'];
  for (const file of defaultSounds) {
    const dest = path.join(soundDir, file);
    if (!fs.existsSync(dest)) {
      const src = path.join(bundledDir, 'sounds', file);
      if (fs.existsSync(src)) {
        fs.copyFileSync(src, dest);
        console.log('Copied default sound:', file);
      }
    }
  }

  console.log('Asset directories ready:', { bgDir, soundDir });
}

function createWindow() {
  mainWindow = new BrowserWindow({
    width: 900,
    height: 700,
    minWidth: 800,
    minHeight: 600,
    webPreferences: {
      nodeIntegration: true,
      contextIsolation: false,
      sandbox: false,
      preload: path.join(__dirname, 'preload.js'),
      webSecurity: false
    },
    autoHideMenuBar: true,
    title: "FocusFlow",
  });

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

// Register custom asset:// protocol before app is ready
protocol.registerSchemesAsPrivileged([
  { scheme: 'asset', privileges: { bypassCSP: true, secure: true, supportFetchAPI: true, corsEnabled: true } }
]);

app.whenReady().then(() => {
  protocol.registerFileProtocol('asset', (request, callback) => {
    try {
      const parsedUrl = new URL(request.url);
      const appDataDir = getAppDataDir();
      
      if (parsedUrl.hostname === 'backgrounds' || parsedUrl.hostname === 'sounds') {
        const decodedPath = decodeURIComponent(parsedUrl.pathname.replace(/^\//, ''));
        const absolutePath = path.join(appDataDir, parsedUrl.hostname, decodedPath);
        callback({ path: path.normalize(absolutePath) });
      } else {
        // Fallback for any old absolute paths that might still be stored (asset://c/Users/...)
        let rawPath = request.url.replace(/^asset:\/\//, '');
        if (process.platform === 'win32' && rawPath.match(/^[a-zA-Z]\//)) {
          rawPath = rawPath.substring(0, 1) + ':' + rawPath.substring(1);
        }
        callback({ path: path.normalize(decodeURI(rawPath)) });
      }
    } catch (e) {
      const url = request.url.substr(8);
      callback({ path: path.normalize(decodeURI(url)) });
    }
  });

  // Pre-create folders and copy default assets
  ensureDefaultAssets();

  createWindow();

  app.on('activate', () => {
    if (BrowserWindow.getAllWindows().length === 0) createWindow();
  });
});

app.on('window-all-closed', () => {
  if (process.platform !== 'darwin') app.quit();
});
