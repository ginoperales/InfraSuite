import { autoUpdater } from 'electron-updater';
import { BrowserWindow, ipcMain, dialog } from 'electron';
import log from 'electron-log';

autoUpdater.logger = log;
(autoUpdater.logger as any).transports.file.level = 'info';

export const setupAutoUpdater = (mainWindow: BrowserWindow) => {
  autoUpdater.on('checking-for-update', () => {
    log.info('Checking for update...');
  });

  autoUpdater.on('update-available', (info) => {
    log.info('Update available:', info.version);
    mainWindow?.webContents.send('update-available', info);
    mainWindow?.webContents.send('update_available', info);
  });

  autoUpdater.on('update-not-available', (info) => {
    log.info('Update not available:', info);
  });

  autoUpdater.on('error', (err) => {
    log.error('Error in auto-updater: ' + err);
  });

  autoUpdater.on('download-progress', (progressObj) => {
    log.info(`Download speed: ${progressObj.bytesPerSecond} - Downloaded ${progressObj.percent}%`);
    mainWindow?.webContents.send('download-progress', progressObj.percent);
  });

  autoUpdater.on('update-downloaded', (info) => {
    log.info('Update downloaded:', info.version);
    mainWindow?.webContents.send('update-downloaded', info);
    mainWindow?.webContents.send('update_downloaded', info);

    // Native Windows Notification Dialog for Auto-Update
    dialog.showMessageBox(mainWindow, {
      type: 'info',
      title: 'Nueva versión disponible',
      message: `Una nueva versión de InfraSuite (${info.version}) está lista para instalar.`,
      detail: '¿Deseas reiniciar la aplicación ahora para aplicar los cambios y actualizar a la versión más reciente?',
      buttons: ['Reiniciar y Actualizar', 'Más tarde'],
      defaultId: 0,
      cancelId: 1
    }).then((result) => {
      if (result.response === 0) {
        autoUpdater.quitAndInstall();
      }
    });
  });

  ipcMain.handle('restart-app', () => {
    autoUpdater.quitAndInstall();
  });

  ipcMain.on('restart_app', () => {
    autoUpdater.quitAndInstall();
  });

  // Check for updates on startup
  autoUpdater.checkForUpdatesAndNotify();
};

