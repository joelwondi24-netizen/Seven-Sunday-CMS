# Seven Sunday Ethiopia ERP — Windows Desktop (.exe) & Setup

This directory contains the native Windows desktop packaging configuration for **Seven Sunday Manufacturing & Trading PLC** using **Electron** and **electron-builder** (NSIS Setup Installer + Portable `.exe`).

## Outputs Built on Windows
- `dist-electron/Seven-Sunday-Ethiopia-ERP-Setup-1.0.0-x64.exe` — Full Windows NSIS Setup wizard (Desktop shortcut, Start Menu entry, custom install directory, Windows Add/Remove Programs uninstaller).
- `dist-electron/Seven-Sunday-Ethiopia-ERP-Portable-1.0.0-x64.exe` — Zero-install standalone portable `.exe` for USB drives or locked workstations.

## Local Storage & Offline Data Path on Windows
When running as a Windows `.exe`, the embedded Express + WebSocket ERP backend stores the atomic corporate database inside:
`%APPDATA%\seven-sunday-ethiopia-erp-desktop\data\erp-db.json`
Browser IndexedDB and localStorage caches also remain active for instant offline access.

## One-Click Build on Windows 10 / 11
1. Ensure **Node.js 20 LTS or 22 LTS** is installed.
2. Double-click `Setup-SevenSunday-Windows.bat` (or run from PowerShell):
   ```powershell
   npm run desktop:win
   ```
3. Once finished, the Windows Setup `.exe` installer opens automatically and installs **Seven Sunday Ethiopia ERP** onto your PC.
