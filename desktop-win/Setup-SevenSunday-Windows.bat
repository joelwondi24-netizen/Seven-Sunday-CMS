@echo off
title Seven Sunday Ethiopia ERP - Windows .exe Setup Builder
powershell -NoProfile -ExecutionPolicy Bypass -File "%~dp0Setup-SevenSunday-Windows.ps1"
if errorlevel 1 (
  echo.
  echo Setup build encountered an error. Please review the output above.
  pause
)
