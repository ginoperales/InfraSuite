import { contextBridge, ipcRenderer } from 'electron';

contextBridge.exposeInMainWorld('electron', {
  db: {
    getBudgets: () => ipcRenderer.invoke('db:getBudgets'),
    getBudget: (id: string) => ipcRenderer.invoke('db:getBudget', id),
    saveBudget: (budget: any) => ipcRenderer.invoke('db:saveBudget', budget),
    deleteBudget: (id: string) => ipcRenderer.invoke('db:deleteBudget', id),
  },
  updater: {
    onUpdateAvailable: (callback: () => void) => ipcRenderer.on('update_available', callback),
    onUpdateDownloaded: (callback: () => void) => ipcRenderer.on('update_downloaded', callback),
    restartApp: () => ipcRenderer.send('restart_app'),
  },
  auth: {
    openExternal: (url: string) => ipcRenderer.send('auth:open-external', url),
    onDeepLink: (callback: (url: string) => void) => ipcRenderer.on('deep-link', (_event, url) => callback(url))
  }
});
