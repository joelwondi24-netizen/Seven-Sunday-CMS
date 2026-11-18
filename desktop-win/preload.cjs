const { contextBridge } = require('electron');

contextBridge.exposeInMainWorld('sevenSundayDesktop', {
  isDesktop: true,
  platform: process.platform,
  appVersion: '1.0.0',
});
