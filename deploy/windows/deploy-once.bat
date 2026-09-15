@echo off
setlocal EnableExtensions

cd /d "%~dp0"
cd /d "..\.."
set "REPO_ROOT=%CD%"

set "DEPLOY_PS1=%REPO_ROOT%\deploy\scripts\deploy.ps1"

if not exist "%DEPLOY_PS1%" (
    echo [ERROR] Missing: %DEPLOY_PS1%
    echo.
    echo Fix: run "git pull" in %REPO_ROOT%
    echo      or copy folder deploy\scripts from Mac repo.
    echo.
    pause
    exit /b 1
)

echo Deploy: %REPO_ROOT%
echo.

powershell -NoProfile -ExecutionPolicy Bypass -File "%DEPLOY_PS1%"
set "EXIT_CODE=%ERRORLEVEL%"

echo.
if not "%EXIT_CODE%"=="0" (
    echo [FAILED] exit code %EXIT_CODE%
) else (
    echo [OK] Done. Open http://127.0.0.1:8080/
)
pause
exit /b %EXIT_CODE%
