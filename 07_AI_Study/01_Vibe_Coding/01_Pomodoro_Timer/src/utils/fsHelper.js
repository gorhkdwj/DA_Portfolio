export const isElectron = () => {
  return typeof window !== 'undefined' && typeof window.require === 'function';
};

export const saveAssetToLocal = (sourceFile, type) => {
  if (!isElectron()) {
    console.warn("Browser fallback: returning object URL instead of saving to file system.");
    return URL.createObjectURL(sourceFile);
  }
  
  const fs = window.require('fs');
  const path = window.require('path');
  const os = window.require('os');
  
  const sourcePath = sourceFile.path;
  if (!sourcePath) {
    console.warn("File path is missing. Are you running in Electron?");
    return URL.createObjectURL(sourceFile);
  }

  // Determine an app data directory
  const isWindows = os.platform() === 'win32';
  const appDataDir = isWindows 
    ? path.join(os.homedir(), 'AppData', 'Roaming', 'PomodoroTimer')
    : path.join(os.homedir(), '.pomodorotimer');
    
  const customAssetsDir = path.join(appDataDir, 'custom_assets');
  
  if (!fs.existsSync(customAssetsDir)) {
    fs.mkdirSync(customAssetsDir, { recursive: true });
  }

  const uniqueId = `custom_${Date.now()}`;
  const ext = path.extname(sourceFile.name) || '';
  const fileName = `${uniqueId}${ext}`;
  const destPath = path.join(customAssetsDir, fileName);

  fs.copyFileSync(sourcePath, destPath);
  
  // Return the file URL format
  return `file:///${destPath.replace(/\\/g, '/')}`;
};

export const deleteLocalAsset = (fileUrl) => {
  if (!isElectron() || !fileUrl?.startsWith('file:///')) return;
  
  try {
    const fs = window.require('fs');
    // Basic conversion from file:///C:/... to C:/... (or /Users/... on Mac)
    let pathStr = fileUrl.replace('file:///', '');
    // On Windows, the path looks like file:///C:/Users/..., so removing file:/// gives C:/Users/...
    // Wait, on Mac it's file:///Users/..., so removing file:/// gives Users/..., missing the root slash.
    const os = window.require('os');
    if (os.platform() !== 'win32') {
      pathStr = '/' + pathStr;
    }
    // Also decode URI components in case spaces are %20
    pathStr = decodeURI(pathStr);
    
    if (fs.existsSync(pathStr)) {
      fs.unlinkSync(pathStr);
      console.log("Deleted local asset:", pathStr);
    }
  } catch (err) {
    console.error("Error deleting local asset:", err);
  }
};
