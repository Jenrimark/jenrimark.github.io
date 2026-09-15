@echo off
cd /d C:\nginx
if not exist "nginx.exe" (
    echo [ERROR] Missing C:\nginx\nginx.exe
    pause
    exit /b 1
)
start nginx
echo Nginx started: http://127.0.0.1:8080/
echo Site root: E:\Desktop\Jenrimark\dist
pause
