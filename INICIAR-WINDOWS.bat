@echo off
setlocal
cd /d "%~dp0"
title INTO THE ABYSS 404 - REBIRTH v0.65
where powershell.exe >nul 2>nul
if errorlevel 1 (
 echo ERROR: no se encuentra Windows PowerShell 5.1 o posterior.
 pause
 exit /b 1
)
powershell.exe -NoLogo -NoProfile -ExecutionPolicy Bypass -File "%~dp0launch-windows.ps1"
if errorlevel 1 (
 echo.
 echo ERROR al iniciar. Revisa el mensaje anterior.
 pause
)
endlocal
