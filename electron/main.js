const { app, BrowserWindow } = require('electron');
const path = require('path');
const { fork } = require('child_process');

let mainWindow;
let whatsappServer;

function startWhatsAppServer() {
  whatsappServer = fork(path.join(__dirname, '..', 'whatsapp-server', 'server.cjs'), [], {
    stdio: ['pipe', 'pipe', 'pipe', 'ipc']
  });

  whatsappServer.stdout.on('data', (data) => {
    console.log('[WhatsApp Server]', data.toString());
  });

  whatsappServer.stderr.on('data', (data) => {
    console.error('[WhatsApp Server Error]', data.toString());
  });

  whatsappServer.on('exit', (code) => {
    console.log(`WhatsApp server exited with code ${code}`);
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
