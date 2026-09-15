@echo off
setlocal EnableExtensions
cd /d "%~dp0"
cd /d "..\.."
powershell -NoProfile -ExecutionPolicy Bypass -File "%~dp0..\scripts\webhook-server.ps1"
