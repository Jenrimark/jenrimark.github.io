@echo off
setlocal EnableExtensions
cd /d "%~dp0"
cd /d "..\.."
powershell -NoProfile -ExecutionPolicy Bypass -File "%~dp0..\scripts\setup-ssh-remote.ps1"
echo.
pause
