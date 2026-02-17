const { contextBridge, ipcRenderer } = require('electron');

contextBridge.exposeInMainWorld('electronFS', {
  readFile: (filePath) => ipcRenderer.invoke('fs:read', filePath),
  writeFile: (filePath, data) => ipcRenderer.invoke('fs:write', filePath, data),
  getDbPath: () => ipcRenderer.invoke('fs:getDbPath'),
  isElectron: true,
});
