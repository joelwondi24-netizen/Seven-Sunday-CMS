const { app, BrowserWindow, Menu, shell, dialog } = require('electron');
const path = require('node:path');
const fs = require('node:fs');
const net = require('node:net');
const http = require('node:http');
const { pathToFileURL } = require('node:url');

let mainWindow = null;
let serverModule = null;

function findFreePort(preferred = 3170) {
  return new Promise((resolve) => {
    const tester = net.createServer();
    tester.once('error', () => {
      const fallback = net.createServer();
      fallback.listen(0, '127.0.0.1', () => {
        const addr = fallback.address();
        const port = typeof addr === 'object' && addr ? addr.port : 3171;
        fallback.close(() => resolve(port));
      });
    });
    tester.listen(preferred, '127.0.0.1', () => {
      tester.close(() => resolve(preferred));
    });
  });
}

function waitForHealth(port, timeoutMs = 15000) {
  const startedAt = Date.now();
  return new Promise((resolve, reject) => {
    const attempt = () => {
      const req = http.get(`http://127.0.0.1:${port}/api/health`, (res) => {
        res.resume();
        if (res.statusCode === 200) {
          resolve();
        } else if (Date.now() - startedAt > timeoutMs) {
          reject(new Error(`ERP server returned HTTP ${res.statusCode}`));
        } else {
          setTimeout(attempt, 150);
        }
      });
      req.on('error', () => {
        if (Date.now() - startedAt > timeoutMs) {
          reject(new Error('Timed out waiting for embedded ERP server.'));
        } else {
          setTimeout(attempt, 150);
        }
      });
    };
    attempt();
  });
}

function resolveUnpackedPath(rel) {
  const appPath = app.getAppPath();
  const unpacked = appPath.includes('app.asar')
    ? appPath.replace('app.asar', 'app.asar.unpacked')
    : appPath;
  const candidate = path.join(unpacked, rel);
  if (fs.existsSync(candidate)) return candidate;
  return path.join(__dirname, rel);
}

async function startEmbeddedBackend() {
  const port = await findFreePort(3170);
  const dataDir = path.join(app.getPath('userData'), 'data');
  const distDir = resolveUnpackedPath('dist');
  const bundlePath = resolveUnpackedPath('server-bundle.mjs');

  if (!fs.existsSync(dataDir)) {
    fs.mkdirSync(dataDir, { recursive: true });
  }
  if (!fs.existsSync(bundlePath)) {
    throw new Error(
      `Missing bundled ERP backend (${bundlePath}). Run "npm run desktop:prepare" before launching or building Electron.`
    );
  }

  process.env.NODE_ENV = 'production';
  process.env.PORT = String(port);
  process.env.HOST = '127.0.0.1';
  process.env.SSE_DATA_DIR = dataDir;
  process.env.SSE_DIST_DIR = distDir;

  serverModule = await import(pathToFileURL(bundlePath).href);
  await waitForHealth(port);
  return { port, dataDir };
}

function buildAppMenu(port) {
  const template = [
    {
      label: 'File',
      submenu: [
        {
          label: 'Command Palette (Ctrl+K)',
          accelerator: 'CmdOrCtrl+K',
          click: () => {
            if (mainWindow) {
              mainWindow.webContents.executeJavaScript(
                'window.dispatchEvent(new KeyboardEvent("keydown", { key: "k", ctrlKey: true, bubbles: true }))'
              );
            }
          },
        },
        {
          label: 'Open Data Folder',
          click: () => shell.openPath(path.join(app.getPath('userData'), 'data')),
        },
        { type: 'separator' },
        { role: 'quit', label: 'Exit Seven Sunday ERP' },
      ],
    },
    {
      label: 'Edit',
      submenu: [
        { role: 'undo' },
        { role: 'redo' },
        { type: 'separator' },
        { role: 'cut' },
        { role: 'copy' },
        { role: 'paste' },
        { role: 'selectAll' },
      ],
    },
    {
      label: 'View',
      submenu: [
        { role: 'reload' },
        { role: 'forceReload' },
        { type: 'separator' },
        { role: 'resetZoom' },
        { role: 'zoomIn' },
        { role: 'zoomOut' },
        { type: 'separator' },
        { role: 'togglefullscreen' },
      ],
    },
    {
      label: 'Help',
      submenu: [
        {
          label: 'Open in Default Browser',
          click: () => shell.openExternal(`http://127.0.0.1:${port}`),
        },
        {
          label: 'About Seven Sunday Ethiopia ERP',
          click: () => {
            dialog.showMessageBox({
              type: 'info',
              title: 'Seven Sunday Ethiopia ERP',
              message: 'Seven Sunday Ethiopia ERP v1.0.0 (Windows Desktop)',
              detail: `Seven Sunday Manufacturing & Trading PLC\nLocal Storage Database: ${path.join(
                app.getPath('userData'),
                'data'
              )}`,
            });
          },
        },
      ],
    },
  ];
  Menu.setApplicationMenu(Menu.buildFromTemplate(template));
}

async function createWindow() {
  const { port } = await startEmbeddedBackend();
  buildAppMenu(port);

  mainWindow = new BrowserWindow({
    width: 1440,
    height: 900,
    minWidth: 1024,
    minHeight: 700,
    title: 'Seven Sunday Ethiopia ERP — Corporate Management Platform',
    icon: path.join(__dirname, 'build', 'icon.ico'),
    backgroundColor: '#082B59',
    webPreferences: {
      preload: path.join(__dirname, 'preload.cjs'),
      contextIsolation: true,
      nodeIntegration: false,
    },
  });

  mainWindow.loadURL(`http://127.0.0.1:${port}`);
  mainWindow.on('closed', () => {
    mainWindow = null;
  });
}

const gotLock = app.requestSingleInstanceLock();
if (!gotLock) {
  app.quit();
} else {
  app.on('second-instance', () => {
    if (mainWindow) {
      if (mainWindow.isMinimized()) mainWindow.restore();
      mainWindow.focus();
    }
  });

  app.whenReady().then(async () => {
    try {
      await createWindow();
    } catch (err) {
      dialog.showErrorBox(
        'Seven Sunday ERP Startup Error',
        err instanceof Error ? err.message : String(err)
      );
      app.quit();
    }
  });

  app.on('window-all-closed', () => {
    if (process.platform !== 'darwin') {
      app.quit();
    }
  });
}
