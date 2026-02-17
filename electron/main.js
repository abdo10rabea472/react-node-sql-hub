const { app, BrowserWindow, ipcMain } = require('electron');
const path = require('path');
const fs = require('fs');
const { fork, execFile } = require('child_process');

let mainWindow;
let whatsappServer;
let chromePath = null;

// Detect if running from packaged EXE or development
const isPackaged = app.isPackaged;
const rootDir = isPackaged ? path.join(process.resourcesPath, 'app') : path.join(__dirname, '..');

// مسار قاعدة البيانات في مجلد Documents (يبقى حتى لو التطبيق اتمسح)
const dbDir = path.join(app.getPath('documents'), 'ElTahan-Studio');
const dbPath = path.join(dbDir, 'offline.db');

// مسار تخزين Chrome في AppData (يبقى حتى لو التطبيق اتمسح)
const chromeCacheDir = path.join(app.getPath('userData'), 'chromium');

// ==================== IPC Handlers ====================
ipcMain.handle('fs:getDbPath', () => dbPath);

ipcMain.handle('fs:read', async (_, filePath) => {
  try {
    if (fs.existsSync(filePath)) {
      const buffer = fs.readFileSync(filePath);
      return buffer;
    }
    return null;
  } catch {
    return null;
  }
});

ipcMain.handle('fs:write', async (_, filePath, data) => {
  try {
    fs.mkdirSync(path.dirname(filePath), { recursive: true });
    fs.writeFileSync(filePath, Buffer.from(data));
    return true;
  } catch (err) {
    console.error('[DB] Failed to write:', err.message);
    return false;
  }
});

// ==================== Browser Setup ====================
function setupChrome() {
  return new Promise((resolve, reject) => {
    const setupScript = path.join(rootDir, 'whatsapp-server', 'setup-browser.cjs');
    
    console.log('[Main] Setting up Chrome browser...');
    console.log('[Main] Cache dir:', chromeCacheDir);
    
    // Ensure cache dir exists
    fs.mkdirSync(chromeCacheDir, { recursive: true });
    
    const child = fork(setupScript, [chromeCacheDir], {
      cwd: path.join(rootDir, 'whatsapp-server'),
      stdio: ['pipe', 'pipe', 'pipe', 'ipc'],
      env: { ...process.env }
    });

    let output = '';
    
    child.stdout.on('data', (data) => {
      const str = data.toString();
      console.log('[Chrome Setup]', str.trim());
      output += str;
    });

    child.stderr.on('data', (data) => {
      console.error('[Chrome Setup Error]', data.toString().trim());
    });

    child.on('exit', (code) => {
      if (code === 0) {
        // Extract chrome path from output
        const match = output.match(/CHROME_PATH=(.+)/);
        if (match) {
          chromePath = match[1].trim();
          console.log('[Main] Chrome ready at:', chromePath);
          resolve(chromePath);
        } else {
          console.error('[Main] Could not parse chrome path from output');
          resolve(null);
        }
      } else {
        console.error('[Main] Chrome setup failed with code:', code);
        resolve(null); // Don't reject, let the server try without it
      }
    });

    child.on('error', (err) => {
      console.error('[Main] Chrome setup error:', err.message);
      resolve(null);
    });
  });
}

// ==================== WhatsApp Server ====================
function startWhatsAppServer() {
  const serverPath = path.join(rootDir, 'whatsapp-server', 'server.cjs');
  const serverDir = path.join(rootDir, 'whatsapp-server');

  const env = { ...process.env };
  if (chromePath) {
    env.CHROME_EXECUTABLE_PATH = chromePath;
  }

  whatsappServer = fork(serverPath, [], {
    cwd: serverDir,
    stdio: ['pipe', 'pipe', 'pipe', 'ipc'],
    env
  });

  whatsappServer.stdout.on('data', (data) => {
    console.log('[WA]', data.toString().trim());
  });

  whatsappServer.stderr.on('data', (data) => {
    console.error('[WA Error]', data.toString().trim());
  });

  whatsappServer.on('error', (err) => {
    console.error('[WA] Failed to start:', err.message);
  });

  whatsappServer.on('exit', (code) => {
    console.log(`[WA] Server exited with code ${code}`);
  });
}

// ==================== Window ====================
function createWindow() {
  mainWindow = new BrowserWindow({
    width: 1400,
    height: 900,
    icon: path.join(rootDir, 'public', 'favicon.ico'),
    autoHideMenuBar: true,
    webPreferences: {
      nodeIntegration: false,
      contextIsolation: true,
      preload: path.join(__dirname, 'preload.js')
    }
  });

  // Always load from dist (built files)
  mainWindow.loadFile(path.join(rootDir, 'dist', 'index.html'));

  mainWindow.on('closed', () => {
    mainWindow = null;
  });
}

app.whenReady().then(async () => {
  // Download Chrome first (if not already cached), then start WA server
  await setupChrome();
  startWhatsAppServer();
  createWindow();
});

app.on('window-all-closed', () => {
  if (whatsappServer) whatsappServer.kill();
  if (process.platform !== 'darwin') app.quit();
});

app.on('activate', () => {
  if (mainWindow === null) createWindow();
});

app.on('before-quit', () => {
  if (whatsappServer) whatsappServer.kill();
});
