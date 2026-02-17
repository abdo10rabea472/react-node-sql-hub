const { app, BrowserWindow } = require('electron');
const path = require('path');
const { fork } = require('child_process');

let mainWindow;
let whatsappServer;

function startWhatsAppServer() {
  const serverPath = path.join(__dirname, '..', 'whatsapp-server', 'server.cjs');
  const serverDir = path.join(__dirname, '..', 'whatsapp-server');

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
    icon: path.join(__dirname, '..', 'public', 'favicon.ico'),
    webPreferences: {
      nodeIntegration: false,
      contextIsolation: true
    }
  });

  // Load the Vite dev server or built files
  const isDev = process.env.NODE_ENV === 'development';
  if (isDev) {
    mainWindow.loadURL('http://localhost:5173');
    mainWindow.webContents.openDevTools();
  } else {
    mainWindow.loadFile(path.join(__dirname, '..', 'dist', 'index.html'));
  }

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
