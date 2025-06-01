@echo off
chcp 65001 >nul
echo 正在启动本地服务器...
echo.

python start-server.py

if %errorlevel% neq 0 (
    echo.
    echo 启动失败，请确保已安装Python
    echo 或者直接双击 index.html 文件在浏览器中打开
    pause
)
