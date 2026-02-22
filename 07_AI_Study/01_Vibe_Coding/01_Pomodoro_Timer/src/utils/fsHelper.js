export const isElectron = () => {
  return typeof window !== 'undefined' && typeof window.require === 'function';
};

// Get the unified asset directory paths
export const getAssetDirs = () => {
  if (!isElectron()) return null;
  const path = window.require('path');
  const os = window.require('os');
  const isWindows = os.platform() === 'win32';
  const appDataDir = isWindows
    ? path.join(os.homedir(), 'AppData', 'Roaming', 'focusflow')
    : path.join(os.homedir(), '.focusflow');
  return {
    backgrounds: path.join(appDataDir, 'backgrounds'),
    sounds: path.join(appDataDir, 'sounds'),
  };
};

// Save a user-selected file to the appropriate folder using FileReader (no File.path dependency)
export const saveAssetToLocal = (sourceFile, type) => {
  if (!isElectron()) {
    console.warn("Browser fallback: returning object URL instead of saving to file system.");
    return URL.createObjectURL(sourceFile);
  }

  const fs = window.require('fs');
  const path = window.require('path');
  const dirs = getAssetDirs();
  if (!dirs) return URL.createObjectURL(sourceFile);

  // Pick the right subfolder
  const targetDir = type === 'theme' ? dirs.backgrounds : dirs.sounds;

  // Ensure directory exists
  if (!fs.existsSync(targetDir)) {
    fs.mkdirSync(targetDir, { recursive: true });
  }

  const uniqueId = `custom_${Date.now()}`;
  const ext = path.extname(sourceFile.name) || '';
  const fileName = `${uniqueId}${ext}`;
  const destPath = path.join(targetDir, fileName);

  // Use FileReader to read file bytes (works in all Electron versions, no File.path dependency)
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = () => {
      try {
        const buffer = Buffer.from(reader.result);
        fs.writeFileSync(destPath, buffer);
        const folderName = type === 'theme' ? 'backgrounds' : 'sounds';
        const assetUrl = `asset://${folderName}/${encodeURIComponent(fileName)}`;
        console.log('Saved asset to:', destPath, '→', assetUrl);
        resolve(assetUrl);
      } catch (err) {
        console.error('Failed to write file:', err);
        resolve(URL.createObjectURL(sourceFile)); // fallback
      }
    };
    reader.onerror = () => {
      console.error('FileReader error:', reader.error);
      resolve(URL.createObjectURL(sourceFile)); // fallback
    };
    reader.readAsArrayBuffer(sourceFile);
  });
};

// List all files in a given asset directory
export const listAssetsInDir = (dirType) => {
  if (!isElectron()) return [];
  const fs = window.require('fs');
  const dirs = getAssetDirs();
  if (!dirs) return [];
  const dir = dirType === 'backgrounds' ? dirs.backgrounds : dirs.sounds;
  if (!fs.existsSync(dir)) return [];
  return fs.readdirSync(dir).filter(f => !f.startsWith('.'));
};

export const deleteLocalAsset = (fileUrl) => {
  if (!isElectron() || !fileUrl?.startsWith('asset://')) return;
  
  try {
    const fs = window.require('fs');
    let pathStr = fileUrl.replace('asset://', '');
    const os = window.require('os');
    if (os.platform() !== 'win32') {
      pathStr = '/' + pathStr;
    }
    pathStr = decodeURI(pathStr);
    
    if (fs.existsSync(pathStr)) {
      fs.unlinkSync(pathStr);
      console.log("Deleted local asset:", pathStr);
    }
  } catch (err) {
    console.error("Error deleting local asset:", err);
  }
};
