import { app, BrowserWindow, ipcMain, dialog, shell } from 'electron';
import * as path from 'path';
import { setupDatabase, cleanupDatabase } from './database';
import { setupAutoUpdater } from './updater';

let mainWindow: BrowserWindow | null = null;

const isDev = !app.isPackaged;

// Set custom protocol
if (process.defaultApp) {
  if (process.argv.length >= 2) {
    app.setAsDefaultProtocolClient('infrasuite', process.execPath, [path.resolve(process.argv[1])]);
  }
} else {
  app.setAsDefaultProtocolClient('infrasuite');
}

// Enforce Single Instance and handle Deep Link
const gotTheLock = app.requestSingleInstanceLock();
if (!gotTheLock) {
  app.quit();
} else {
  app.on('second-instance', (event, commandLine, workingDirectory) => {
    // Someone tried to run a second instance, we should focus our window.
    if (mainWindow) {
      if (mainWindow.isMinimized()) mainWindow.restore();
      mainWindow.focus();
    }
    // Command line contains the deep link
    const url = commandLine.pop();
    if (url && url.startsWith('infrasuite://')) {
      mainWindow?.webContents.send('deep-link', url);
    }
  });
}


function createWindow() {
  mainWindow = new BrowserWindow({
    width: 1200,
    height: 800,
    webPreferences: {
      preload: path.join(__dirname, 'preload.js'),
      nodeIntegration: false,
      contextIsolation: true,
    },
    autoHideMenuBar: true,
    icon: path.join(__dirname, '../dist/favicon.ico')
  });

  if (isDev) {
    mainWindow.loadURL('http://localhost:5173');
    mainWindow.webContents.openDevTools();
  } else {
    mainWindow.loadFile(path.join(__dirname, '../dist/index.html'));
  }

  mainWindow.on('closed', () => {
    mainWindow = null;
  });
}

app.whenReady().then(() => {
  setupDatabase();
  createWindow();

  app.on('activate', () => {
    if (BrowserWindow.getAllWindows().length === 0) {
      createWindow();
    }
  });
  if (!isDev) {
    if (mainWindow) {
      setupAutoUpdater(mainWindow);
    }
  }

  // Handle open external link
  ipcMain.on('auth:open-external', (event, url) => {
    shell.openExternal(url);
  });
});

// Deep link handling for macOS
app.on('open-url', (event, url) => {
  event.preventDefault();
  if (mainWindow) {
    mainWindow.webContents.send('deep-link', url);
  }
});

app.on('window-all-closed', () => {
  cleanupDatabase();
  if (process.platform !== 'darwin') {
    app.quit();
  }
});
