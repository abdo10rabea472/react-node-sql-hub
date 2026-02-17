const { app, BrowserWindow } = require('electron');
const path = require('path');
const { fork } = require('child_process');

let mainWindow;
let whatsappServer;

// Detect if running from packaged EXE or development
const isPackaged = app.isPackaged;
const rootDir = isPackaged ? path.join(process.resourcesPath, 'app') : path.join(__dirname, '..');

function startWhatsAppServer() {
  const serverPath = path.join(rootDir, 'whatsapp-server', 'server.cjs');
  const serverDir = path.join(rootDir, 'whatsapp-server');

  whatsappServer = fork(serverPath, [], {
    cwd: serverDir,
    stdio: ['pipe', 'pipe', 'pipe', 'ipc'],
    env: { ...process.env }
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

function createWindow() {
  mainWindow = new BrowserWindow({
    width: 1400,
    height: 900,
    icon: path.join(rootDir, 'public', 'favicon.ico'),
    autoHideMenuBar: true,
    webPreferences: {
      nodeIntegration: false,
      contextIsolation: true
    }
  });

  // Always load from dist (built files)
  mainWindow.loadFile(path.join(rootDir, 'dist', 'index.html'));

  mainWindow.on('closed', () => {
    mainWindow = null;
  });
}

app.whenReady().then(() => {
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
