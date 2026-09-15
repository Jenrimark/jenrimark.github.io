@echo off
cd /d E:\Desktop\FRP
if not exist "frpc.exe" (
    echo [ERROR] Missing E:\Desktop\FRP\frpc.exe
    pause
    exit /b 1
)
.\frpc.exe -c frpc.toml
pause
